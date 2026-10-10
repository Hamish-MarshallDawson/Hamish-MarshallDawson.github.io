import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useReducedMotionConfig } from "framer-motion";
import { pad } from "./format";
import { DemoCursor } from "./DemoCursor";

// DEMO CONTRACT. Every demo under ./demos follows this, and DemoStage is the
// only thing that drives it.
//
//   export const steps = [{ id, title, caption, tour? }, ...]
//     title:   short label for the numbered step list
//     caption: one plain sentence, read out through the aria-live region
//     tour:    optional list of tour items (below), played by auto-play
//
//   export default function SomeDemo({ step, reducedMotion, onAdvance })
//     step:          0-based index of the current step, owned by DemoStage
//     reducedMotion: true when the visitor asks for less motion (OS setting
//                    or the site's FX switch); demos should drop animation
//     onAdvance():   an in-demo interaction calls this to move to the next step
//
// A demo is loaded with a loader (`() => import("./demos/XDemo")`) so its code
// is only fetched when someone opens it. Its styles stay under one root class.
//
// TOUR CONTRACT (v2). The engine draws a pointer over the frame and plays each
// tour item in order:
//   target: the value of a data-tour="..." attribute inside the demo.
//   label:  optional tag beside the pointer, five words at most.
//   click:  press the pointer, then call the element's click().
//   drag:   { from, to }, percent across the target's width. The pointer presses
//           at `from`, drags to `to` and releases. Pointer events are sent to the
//           target, so it must handle pointerdown, pointermove and pointerup.
//   hold:   ms to rest after the item (default 1400).
// A click or drag waits for the target to exist and not be aria-disabled, for
// up to 15 s. A target that never arrives is skipped, so a tour cannot hang.
// A step without a tour rests for six seconds, then moves on. When the
// tour ends, auto-play moves to the next step, and stops after the last one.
// Each item's target must be in the step's own DOM, and the pointer, highlight
// and tag are aria-hidden, so they never move keyboard focus.
//
// Stepping: the frame content fades out (220 ms, ease-in), the demo is given
// the new step, and it fades back in (320 ms, ease-out). The demo is not
// remounted between steps, so its state persists. Restart remounts it.
// Manual Back, Next or a step button pauses auto-play and pulses the first
// target of the new step, with no pointer. Reduced motion has no fades, no
// pointer and no pulse, and the tour cannot be started.

// Render order, top to bottom on phones: the demo frame, then the navigation
// row (Back, step count, Next), the numbered step list, the caption, and the
// options row (Restart, Play tour). Wider stages place the same parts with CSS
// grid areas (see Featured.css). Controls use aria-disabled rather than
// disabled, so a focused button never drops focus to the page.

const FADE_OUT_MS = 220;
const GLIDE_MS = 720; // Pointer move between targets, ease-in-out
const PRESS_MS = 160;
const DRAG_STEPS = 12;
const DRAG_STEP_MS = 55;
const PULSE_MS = 900;
const HOLD_MS = 1400; // Rest after a tour item
const READ_MS = 6000; // Rest on a step with no tour, long enough to read its caption
const WAIT_MS = 15000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
// A name can occur more than once (two copies of a control, one hidden at this width),
// so the target is the first copy that is shown.
const findTarget = (root, name) => {
  const all = root.querySelectorAll(`[data-tour="${name}"]`);
  return [...all].find(isShown) ?? all[0] ?? null;
};

// A target counts only when it is rendered. A control hidden at this width
// (display: none) has an empty box, and the pointer would fly to the corner.
const isShown = (el) => el.getClientRects().length > 0 && el.getBoundingClientRect().width > 0;

// Waits for the target to exist and be shown, and for a tap or drag, to be enabled.
// `onWait` runs once when the wait starts, so the pointer can step aside rather
// than hover over a control that is not ready (or is gone).
async function waitForTarget(root, item, live, onWait) {
  const needsReady = Boolean(item.click || item.drag);
  const deadline = Date.now() + WAIT_MS;
  let waiting = false;
  while (live()) {
    const el = findTarget(root, item.target);
    if (el && isShown(el) && (!needsReady || el.getAttribute("aria-disabled") !== "true")) return el;
    if (!waiting) {
      waiting = true;
      onWait();
    }
    if (Date.now() > deadline) return null;
    await sleep(120);
  }
  return null;
}

// Pointer events for a drag. Demos read clientX and clientY, so MouseEvent
// is enough where PointerEvent is missing.
function pointerEvent(type, x, y) {
  const Kind = typeof PointerEvent === "function" ? PointerEvent : MouseEvent;
  return new Kind(type, {
    bubbles: true,
    cancelable: true,
    clientX: x,
    clientY: y,
    button: 0,
    buttons: type === "pointerup" ? 0 : 1,
    pointerId: 1,
    pointerType: "mouse",
    isPrimary: true,
  });
}

// Presses at `from`, drags to `to` (both percent of the target's width), then
// releases. The pointer follows the drag. Release is sent even if the tour is
// cancelled mid-drag, so the demo never keeps a stuck press.
async function dragAcross(el, item, setCursor, live) {
  const r = el.getBoundingClientRect();
  const centre = r.left + r.width / 2;
  const y = r.top + r.height / 2;
  const at = (percent) => r.left + (r.width * percent) / 100;
  const from = at(item.drag.from);
  const to = at(item.drag.to);
  // The pointer is placed as an offset from the target's centre, so it follows the target if it moves.
  const place = (x, glide) => setCursor((c) => ({ ...c, at: { dx: x - centre, dy: 0 }, glide }));

  place(from, GLIDE_MS);
  await sleep(GLIDE_MS);
  if (!live()) return false;

  setCursor((c) => ({ ...c, press: true }));
  el.dispatchEvent(pointerEvent("pointerdown", from, y));
  try {
    for (let k = 1; k <= DRAG_STEPS; k += 1) {
      const x = from + ((to - from) * k) / DRAG_STEPS;
      place(x, DRAG_STEP_MS);
      el.dispatchEvent(pointerEvent("pointermove", x, y));
      await sleep(DRAG_STEP_MS);
      if (!live()) return false;
    }
  } finally {
    el.dispatchEvent(pointerEvent("pointerup", to, y));
    setCursor((c) => c && { ...c, press: false, at: undefined });
  }
  return true;
}

// Plays one step's tour. Resolves true when every item ran, and false when
// it was cancelled (a manual move, a pause, or the demo itself moved on).
async function playTour(root, frame, items, { live, setCursor, setProgress }) {
  for (let i = 0; i < items.length; i += 1) {
    const item = items[i];
    setProgress(i / items.length);

    if (!item.target) {
      await sleep(item.hold ?? HOLD_MS);
      if (!live()) return false;
      continue;
    }

    // The pointer steps aside at the start of each item: the previous target may already be gone,
    // and the next glide starts from where the pointer was.
    setCursor(null);
    // A short gap, so the hide is drawn before the next pointer appears (in the same tick it is skipped).
    await sleep(24);
    if (!live()) return false;
    const el = await waitForTarget(root, item, live, () => {});
    if (!live()) return false;
    if (!el) continue;

    // Instant, not smooth: html is smooth-scrolling, and a smooth scroll would still be
    // moving when the pointer aimed at the target.
    el.scrollIntoView?.({ block: "nearest", behavior: "instant" });
    setCursor({ target: el, name: item.target, root, frame, label: item.label, glide: GLIDE_MS, press: false, mode: "glide" });
    await sleep(GLIDE_MS);
    if (!live()) return false;

    if (item.drag) {
      if (!(await dragAcross(el, item, setCursor, live))) return false;
    } else if (item.click) {
      setCursor((c) => ({ ...c, press: true }));
      await sleep(PRESS_MS);
      if (!live()) return false;
      setCursor((c) => ({ ...c, press: false }));
      // Look the target up again: the demo may have re-rendered it.
      (findTarget(root, item.target) ?? el).click();
      // The pointer steps aside after a tap. The demo may change under it (a tile gives way
      // to the photo), and the next target brings it back.
      setCursor(null);
    }

    await sleep(item.hold ?? HOLD_MS);
    if (!live()) return false;
  }
  setProgress(1);
  return true;
}

export function DemoStage({ title, loader }) {
  const reduce = useReducedMotionConfig();
  const [demo, setDemo] = useState(null);
  const [failed, setFailed] = useState(false);
  const [step, setStep] = useState(0); // Where the walkthrough is headed
  const [shown, setShown] = useState(0); // The step the demo is drawing; trails `step` while the frame fades
  const [fading, setFading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [cursor, setCursor] = useState(null);
  // Restart bumps this, which remounts the demo so its own state resets too.
  const [run, setRun] = useState(0);
  const frameRef = useRef(null);
  const stageRef = useRef(null);
  const stepsRef = useRef(null);
  const pulseNext = useRef(false); // A manual move asks for the first target to be pulsed
  const focusInDemo = useRef(null); // The control inside the demo that last had focus

  useEffect(() => {
    let live = true;
    loader()
      .then((mod) => live && setDemo(mod))
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [loader]);

  const count = demo ? demo.steps.length : 0;
  const last = count - 1;
  const tour = demo ? demo.steps[shown].tour ?? null : null;

  // Reduced motion (OS setting or the site's FX switch) means no tour.
  useEffect(() => {
    if (reduce) setPlaying(false);
  }, [reduce]);

  // Step changes: fade the frame out, then draw the new step. Reduced motion
  // draws it at once.
  useEffect(() => {
    if (!demo) return undefined;
    if (step === shown) {
      setFading(false);
      return undefined;
    }
    if (reduce) {
      setShown(step);
      setFading(false);
      return undefined;
    }
    setFading(true);
    const timer = setTimeout(() => {
      setShown(step);
      setFading(false);
    }, FADE_OUT_MS);
    return () => clearTimeout(timer);
  }, [demo, step, shown, reduce]);

  // A step can remove the control that had focus (a chip, a tile). Focus then
  // moves to the current step button, rather than falling to the page body.
  useLayoutEffect(() => {
    const was = focusInDemo.current;
    if (was && !was.isConnected) {
      focusInDemo.current = null;
      stepsRef.current?.querySelector('[aria-current="step"]')?.focus({ preventScroll: true });
    }
  }, [shown]);

  // Once the new step is on screen: play its tour when auto-play is on, or
  // pulse its first target after a manual move. Leaving the step, pausing or
  // a demo tap that moves on cancels the tour.
  useEffect(() => {
    const root = stageRef.current;
    const frame = frameRef.current;
    if (!demo || fading || step !== shown || !root || !frame || reduce) return undefined;

    if (!playing) {
      const wanted = pulseNext.current;
      pulseNext.current = false;
      const first = tour?.[0];
      const el = wanted && first?.target ? findTarget(root, first.target) : null;
      if (!el) return undefined;
      setCursor({ target: el, name: first.target, root, frame, mode: "pulse", glide: 0 });
      const timer = setTimeout(() => setCursor(null), PULSE_MS);
      return () => {
        clearTimeout(timer);
        setCursor(null);
      };
    }

    let live = true;
    setProgress(0);
    const items = tour?.length ? tour : [{ hold: READ_MS }];
    playTour(root, frame, items, { live: () => live, setCursor, setProgress }).then((done) => {
      if (!done || !live) return;
      if (shown >= last) setPlaying(false);
      else setStep(shown + 1);
    });
    return () => {
      live = false;
      setCursor(null);
    };
  }, [demo, fading, step, shown, playing, reduce, tour, last]);

  const move = (to) => {
    const target = Math.max(0, Math.min(to, last));
    setPlaying(false);
    if (target !== step) pulseNext.current = true;
    setStep(target);
  };

  const back = () => {
    if (step > 0) move(step - 1);
  };

  const next = () => {
    if (step < last) move(step + 1);
  };

  const restart = () => {
    setPlaying(false);
    pulseNext.current = false;
    setStep(0);
    setShown(0);
    setFading(false);
    setRun((n) => n + 1);
  };

  const toggleTour = () => {
    if (reduce) return;
    if (playing) {
      setPlaying(false);
      return;
    }
    // At the end, Play starts the walkthrough again from the first step.
    if (step >= last) setStep(0);
    setPlaying(true);
  };

  const advance = () => setStep((s) => Math.min(s + 1, last));

  if (!demo) {
    return (
      <div className="fdemo-status" aria-busy={!failed}>
        <p className="u-micro">{failed ? "Couldn't load this demo. Close it and try again." : "Loading demo…"}</p>
      </div>
    );
  }

  const Demo = demo.default;
  // The caption is the aria-live line, so it follows the step asked for, not the fade.
  const { caption } = demo.steps[step];

  return (
    <div className="fdemo">
      <div className="fdemo-grid">
        <div className="fdemo-frame" ref={frameRef} role="region" aria-label={`${title} demo`}>
          <div
            ref={stageRef}
            className={`fdemo-stage${fading ? " is-fading" : ""}`}
            onFocus={(event) => {
              focusInDemo.current = event.target;
            }}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) focusInDemo.current = null;
            }}
          >
            <Demo key={run} step={shown} reducedMotion={reduce} onAdvance={advance} />
          </div>
          <DemoCursor cursor={cursor} />
        </div>

        <div className="fdemo-nav" role="group" aria-label="Walkthrough navigation">
          <button type="button" className="btn btn--paper u-press" aria-disabled={step === 0} onClick={back}>
            Back
          </button>
          <div className="fdemo-count-wrap">
            <p className="fdemo-count u-micro" aria-live="off">
              Step {pad(step + 1)} / {pad(count)}
            </p>
            <div className={`fdemo-tour-status u-micro${playing ? " is-on" : ""}`} aria-hidden="true">
              <span>{playing ? `Playing · ${pad(shown + 1)}/${pad(count)}` : ""}</span>
              <span className="fdemo-tour-bar">
                <span style={{ transform: `scaleX(${progress})` }} />
              </span>
            </div>
          </div>
          <button type="button" className="btn btn--signal u-press" aria-disabled={step === last} onClick={next}>
            Next
          </button>
        </div>

        <ol ref={stepsRef} className="fdemo-steps" aria-label="Walkthrough steps">
          {demo.steps.map((item, i) => (
            <li key={item.id}>
              <button
                type="button"
                className="fdemo-step u-press"
                aria-label={`${pad(i + 1)} ${item.title}`}
                aria-current={i === step ? "step" : undefined}
                onClick={() => move(i)}
              >
                <span className="fdemo-num">{pad(i + 1)}</span>
                <span className="fdemo-step-title">{item.title}</span>
              </button>
            </li>
          ))}
        </ol>

        <p className="fdemo-caption" aria-live="polite" aria-atomic="true">
          <span>{caption}</span>
        </p>

        <div className="fdemo-extras" role="group" aria-label="Walkthrough options">
          <button type="button" className="btn btn--paper u-press" onClick={restart}>
            Restart
          </button>
          <button type="button" className="btn btn--paper u-press" aria-disabled={reduce} onClick={toggleTour}>
            {playing ? "Pause tour" : "Play tour"}
          </button>
          {reduce && <p className="fdemo-note u-micro">The tour is off with reduced motion.</p>}
        </div>
      </div>
    </div>
  );
}
