import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useReducedMotionConfig } from "framer-motion";
import { pad } from "./format";
import { DemoCursor } from "./DemoCursor";
import { findTarget, isShown } from "./targets";

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
//   hold:   ms to rest after the item (default 1800).
// A click or drag waits for the target to exist and not be aria-disabled, for
// up to 15 s. A target that never arrives is skipped, so a tour cannot hang.
// A step without a tour rests for six seconds, then moves on. When the
// tour ends, auto-play moves to the next step, and stops after the last one.
// Each item's target must be in the step's own DOM, and the pointer, highlight
// and tag are aria-hidden, so they never move keyboard focus.
//
// Stepping: the frame content fades out (400 ms, ease-in), the demo is given
// the new step behind a 120 ms blank, and it fades back in (550 ms, ease-out).
// The demo is not remounted between steps, so its state persists. Restart
// remounts it. Manual Back, Next or a step button pauses auto-play and pulses
// the first target of the new step, with no pointer. Reduced motion has no
// fades, no pointer and no pulse, and the tour cannot be started.
//
// Pausing: the tour stops while the demo frame is scrolled out of view or the
// tab is hidden, and carries on from the same point when it comes back. Its
// timers are not running while paused. Closing the demo cancels the tour.

// Render order, top to bottom on phones: the demo frame (with the "Play the tour"
// offer over it, until the visitor has played or touched the demo), then the
// navigation row (Back, step count, Next), the options row (Play tour, Restart), the
// numbered step list and the caption. Back and Next stay right under the frame, so
// the step controls are in reach with it. The offer is for motion only: with reduced
// motion the tour cannot play, so there is none. Its scrim lets pointers through to
// the demo, so a press inside the demo counts as the visitor starting by hand, and
// the offer goes. Play is the main control: a full-width signal button, and the step
// tabs are a quieter secondary row. Wider stages place the same parts with CSS grid
// areas (see Featured.css). Controls use aria-disabled rather than disabled, so a
// focused button never drops focus to the page.

const FADE_OUT_MS = 400; // Frame fades out, ease-in (the fade back in, ease-out, is in Featured.css)
const BLANK_MS = 120; // Blank beat while the new step is drawn
const GLIDE_MS = 1150; // Pointer move between targets, ease-in-out
const PRESS_MS = 240; // Pressed for 240 ms: the dip goes down over 120 ms, and back up over 120 ms after release
const DRAG_STEPS = 40; // Drag: eased steps across about 1.4 s
const DRAG_STEP_MS = 35;
const PULSE_MS = 900;
const HOLD_MS = 1800; // Rest after a tour item
const READ_MS = 6000; // Rest on a step with no tour, long enough to read its caption
const WAIT_MS = 15000; // A target that does not exist yet (it may appear after a click)
const HIDDEN_MS = 400; // A target that is there but not shown at this width is skipped after this

// The tour's timers. sleep() waits on a timer that stops while the clock is paused,
// and resumes with the time it had left, so a paused tour costs nothing and carries on
// where it stopped. dispose() ends every wait at once, so nothing outlives the tour.
export function createTourClock(startPaused = false) {
  let paused = startPaused;
  let disposed = false;
  const waiting = new Set();
  const finish = (w) => {
    clearTimeout(w.timer);
    waiting.delete(w);
    w.resolve();
  };
  const arm = (w) => {
    w.at = performance.now();
    w.timer = setTimeout(() => finish(w), w.left);
  };
  return {
    sleep(ms) {
      return new Promise((resolve) => {
        const w = { left: ms, at: 0, timer: 0, resolve };
        if (disposed) {
          resolve();
          return;
        }
        waiting.add(w);
        if (!paused) arm(w);
      });
    },
    setPaused(next) {
      if (disposed || next === paused) return;
      paused = next;
      for (const w of waiting) {
        if (paused) {
          clearTimeout(w.timer);
          w.left -= performance.now() - w.at;
        } else {
          arm(w);
        }
      }
    },
    dispose() {
      disposed = true;
      for (const w of [...waiting]) finish(w);
    },
  };
}

// Waits for the target to exist and be shown, and for a tap or drag, to be enabled.
// `onWait` runs once when the wait starts, so the pointer can step aside rather
// than hover over a control that is not ready (or is gone).
async function waitForTarget(root, item, { live, sleep }, onWait) {
  const needsReady = Boolean(item.click || item.drag);
  // Counted in polls rather than by the clock, so time spent paused counts as waiting too.
  let waited = 0;
  let hidden = 0;
  let waiting = false;
  while (live()) {
    // The first copy shown, or else the first copy there is (hidden), or null.
    const found = findTarget(root, item.target);
    const shown = Boolean(found && isShown(found));
    if (shown && (!needsReady || found.getAttribute("aria-disabled") !== "true")) return found;
    if (!waiting) {
      waiting = true;
      onWait();
    }
    // Present but never shown at this width (display none on a phone): skip it quickly.
    // Not yet present: it may arrive after a click, so it gets the full wait.
    hidden = found && !shown ? hidden + 120 : 0;
    if (hidden >= HIDDEN_MS) return null;
    if (waited > WAIT_MS) return null;
    waited += 120;
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
async function dragAcross(el, item, setCursor, { live, sleep }) {
  const r = el.getBoundingClientRect();
  const centre = r.left + r.width / 2;
  const y = r.top + r.height / 2;
  const at = (percent) => r.left + (r.width * percent) / 100;
  const from = at(item.drag.from);
  const to = at(item.drag.to);
  // The pointer is placed as an offset from the target's centre, so it follows the target if it moves.
  // Each step is a short linear move; the steps themselves are eased, so the drag starts and ends softly.
  const place = (x, glide, linear) => setCursor((c) => ({ ...c, at: { dx: x - centre, dy: 0 }, glide, linear }));

  place(from, GLIDE_MS, false);
  await sleep(GLIDE_MS);
  if (!live()) return false;

  setCursor((c) => ({ ...c, press: true }));
  el.dispatchEvent(pointerEvent("pointerdown", from, y));
  try {
    for (let k = 1; k <= DRAG_STEPS; k += 1) {
      const eased = 0.5 - 0.5 * Math.cos((Math.PI * k) / DRAG_STEPS);
      const x = from + (to - from) * eased;
      place(x, DRAG_STEP_MS, true);
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
async function playTour(root, frame, items, ctx) {
  const { live, setCursor, setProgress, sleep } = ctx;
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
    const el = await waitForTarget(root, item, ctx, () => {});
    if (!live()) return false;
    if (!el) continue;

    // Instant, not smooth: html is smooth-scrolling, and a smooth scroll would still be
    // moving when the pointer aimed at the target.
    el.scrollIntoView?.({ block: "nearest", behavior: "instant" });
    setCursor({ target: el, name: item.target, root, frame, label: item.label, glide: GLIDE_MS, press: false, mode: "glide" });
    await sleep(GLIDE_MS);
    if (!live()) return false;

    if (item.drag) {
      if (!(await dragAcross(el, item, setCursor, ctx))) return false;
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
  // True once the visitor has played the tour, moved a step, or pressed inside the
  // demo. Until then, the overlay offers the tour. Restart brings it back.
  const [touched, setTouched] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [cursor, setCursor] = useState(null);
  // True while the demo is offscreen or the tab is hidden. The tour pauses, and so does the pointer's loop.
  const [away, setAway] = useState(false);
  // Restart bumps this, which remounts the demo so its own state resets too.
  const [run, setRun] = useState(0);
  const frameRef = useRef(null);
  const stageRef = useRef(null);
  const stepsRef = useRef(null);
  const clockRef = useRef(null); // The running tour's clock, so pausing reaches its timers
  const awayRef = useRef(false);
  const pulseNext = useRef(false); // A manual move asks for the first target to be pulsed
  const focusInDemo = useRef(null); // The control inside the demo that last had focus
  const lastRef = useRef(0);

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
  lastRef.current = last;
  const tour = demo ? demo.steps[shown].tour ?? null : null;

  // Reduced motion (OS setting or the site's FX switch) means no tour.
  useEffect(() => {
    if (reduce) setPlaying(false);
  }, [reduce]);

  // Pause the tour while the frame is out of view or the tab is hidden, and resume it
  // when both are back. Nothing is scheduled in the meantime.
  useEffect(() => {
    const frame = frameRef.current;
    if (!demo || !frame) return undefined;
    let outOfView = false;
    const sync = () => {
      const next = outOfView || document.hidden;
      if (awayRef.current === next) return;
      awayRef.current = next;
      setAway(next);
      clockRef.current?.setPaused(next);
    };
    const observer = typeof IntersectionObserver === "function"
      ? new IntersectionObserver(([entry]) => {
        outOfView = !entry.isIntersecting;
        sync();
      })
      : null;
    observer?.observe(frame);
    document.addEventListener("visibilitychange", sync);
    return () => {
      observer?.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, [demo]);

  // Step changes: fade the frame out, draw the new step behind a short blank, then fade it back in.
  // Reduced motion draws it at once.
  useEffect(() => {
    if (!demo) return undefined;
    if (step === shown) return undefined;
    if (reduce) {
      setShown(step);
      setFading(false);
      return undefined;
    }
    setFading(true);
    const timer = setTimeout(() => setShown(step), FADE_OUT_MS);
    return () => clearTimeout(timer);
  }, [demo, step, shown, reduce]);

  // The new step is drawn, but the frame stays blank for a beat before it fades in.
  useEffect(() => {
    if (!fading || step !== shown) return undefined;
    const timer = setTimeout(() => setFading(false), BLANK_MS);
    return () => clearTimeout(timer);
  }, [fading, step, shown]);

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
    const clock = createTourClock(awayRef.current);
    clockRef.current = clock;
    const ctx = { live: () => live, setCursor, setProgress, sleep: clock.sleep };
    playTour(root, frame, items, ctx).then((done) => {
      if (!done || !live) return;
      if (shown >= lastRef.current) setPlaying(false);
      else setStep(shown + 1);
    });
    return () => {
      live = false;
      clock.dispose();
      if (clockRef.current === clock) clockRef.current = null;
      setCursor(null);
    };
  }, [demo, fading, step, shown, playing, reduce, tour]);

  const move = (to) => {
    const target = Math.max(0, Math.min(to, last));
    setPlaying(false);
    setTouched(true);
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
    setTouched(false);
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
    // Playing brings the demo into view first. The controls sit below the frame on phones,
    // and a tour started from below would wait, paused, for the visitor to scroll back up.
    frameRef.current?.scrollIntoView?.({ block: "nearest", behavior: "smooth" });
    // At the end, Play starts the walkthrough again from the first step.
    if (step >= last) setStep(0);
    setTouched(true);
    setPlaying(true);
  };

  // A demo's own action moves the walkthrough on. Stable, so the demo is not redrawn for it.
  const advance = useCallback(() => setStep((s) => Math.min(s + 1, lastRef.current)), []);

  const Demo = demo?.default;
  // The demo is built once per step, and not again when the pointer moves: the cursor
  // updates its own layer and does not need the demo to render.
  const demoNode = useMemo(
    () => (Demo ? <Demo key={run} step={shown} reducedMotion={reduce} onAdvance={advance} /> : null),
    [Demo, run, shown, reduce, advance],
  );

  if (!demo) {
    return (
      <div className="fdemo-status" aria-busy={!failed}>
        <p className="u-micro">{failed ? "Couldn't load this demo. Close it and try again." : "Loading demo…"}</p>
      </div>
    );
  }

  // The caption is the aria-live line, so it follows the step asked for, not the fade.
  const { caption } = demo.steps[step];
  // The overlay is for motion only: with reduced motion the tour cannot play at all.
  const offerStart = !reduce && !touched;

  return (
    <div className="fdemo">
      <div className="fdemo-grid">
        <div className="fdemo-frame" ref={frameRef} role="region" aria-label={`${title} demo`}>
          {offerStart && (
            <div className="fdemo-start">
              <button type="button" className="btn btn--signal u-press fdemo-start-btn" onClick={toggleTour}>
                <svg className="fdemo-start-glyph" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                  <path d="M4 2.5v11l9-5.5z" />
                </svg>
                Play the tour
              </button>
            </div>
          )}
          <div
            ref={stageRef}
            className={`fdemo-stage${fading ? " is-fading" : ""}`}
            onPointerDown={() => setTouched(true)}
            onKeyDown={() => setTouched(true)}
            onFocus={(event) => {
              focusInDemo.current = event.target;
            }}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) focusInDemo.current = null;
            }}
          >
            {demoNode}
          </div>
          <DemoCursor cursor={cursor} paused={away} />
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
          <button
            type="button"
            className={`btn ${reduce ? "btn--signal" : "btn--paper"} u-press`}
            aria-disabled={step === last}
            onClick={next}
          >
            Next
          </button>
        </div>

        <div className="fdemo-extras" role="group" aria-label="Walkthrough options">
          <button
            type="button"
            className={`btn ${reduce ? "btn--paper" : "btn--signal"} u-press fdemo-play`}
            aria-disabled={reduce}
            onClick={toggleTour}
          >
            {playing ? "Pause tour" : "Play tour"}
          </button>
          <button type="button" className="btn btn--paper u-press" onClick={restart}>
            Restart
          </button>
          {reduce && <p className="fdemo-note u-micro">The tour is off with reduced motion.</p>}
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

      </div>
    </div>
  );
}
