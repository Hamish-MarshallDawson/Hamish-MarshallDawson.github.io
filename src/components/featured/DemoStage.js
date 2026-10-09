import { useEffect, useState } from "react";
import { useReducedMotionConfig } from "framer-motion";
import { pad } from "./format";

// DEMO CONTRACT. Every demo under ./demos follows this, and DemoStage is the
// only thing that drives it.
//
//   export const steps = [{ id, title, caption }, ...]
//     title:   short label for the numbered step list
//     caption: one plain sentence, read out through the aria-live region
//
//   export default function SomeDemo({ step, reducedMotion, onAdvance })
//     step:          0-based index of the current step, owned by DemoStage
//     reducedMotion: true when the visitor asks for less motion (OS setting
//                    or the site's FX switch); demos should drop animation
//     onAdvance():   an in-demo interaction calls this to move to the next step
//
// A demo is loaded with a loader (`() => import("./demos/XDemo")`) so its code
// is only fetched when someone opens it. Its styles stay under one root class.

const AUTOPLAY_MS = 6000;

// Render order, top to bottom on phones: the demo frame, then the navigation
// row (Back, step count, Next), the numbered step list, the caption, and the
// options row (Restart, Auto-play). Wider stages place the same parts with CSS
// grid areas (see Featured.css). Controls use aria-disabled rather than
// disabled, so a focused button never drops focus to the page.
export function DemoStage({ title, loader }) {
  const reduce = useReducedMotionConfig();
  const [demo, setDemo] = useState(null);
  const [failed, setFailed] = useState(false);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  // Restart bumps this, which remounts the demo so its own state resets too.
  const [run, setRun] = useState(0);

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

  // Reduced motion (OS setting or the site's FX switch) means no auto-play.
  useEffect(() => {
    if (reduce) setPlaying(false);
  }, [reduce]);

  // Auto-play moves one step every few seconds and stops at the end. Any
  // manual move pauses it, so the visitor keeps control.
  useEffect(() => {
    if (!playing || reduce) return undefined;
    if (step >= last) {
      setPlaying(false);
      return undefined;
    }
    const timer = setTimeout(() => setStep((s) => Math.min(s + 1, last)), AUTOPLAY_MS);
    return () => clearTimeout(timer);
  }, [playing, reduce, step, last]);

  const move = (to) => {
    setPlaying(false);
    setStep(Math.max(0, Math.min(to, last)));
  };

  const back = () => {
    if (step > 0) move(step - 1);
  };

  const next = () => {
    if (step < last) move(step + 1);
  };

  const restart = () => {
    setPlaying(false);
    setStep(0);
    setRun((n) => n + 1);
  };

  const toggleAutoplay = () => {
    if (!reduce) setPlaying((on) => !on);
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
  const current = demo.steps[step];

  return (
    <div className="fdemo">
      <div className="fdemo-grid">
        <div className="fdemo-frame" role="region" aria-label={`${title} demo`}>
          <Demo key={run} step={step} reducedMotion={reduce} onAdvance={advance} />
        </div>

        <div className="fdemo-nav" role="group" aria-label="Walkthrough navigation">
          <button
            type="button"
            className="btn btn--paper u-press"
            aria-disabled={step === 0}
            onClick={back}
          >
            Back
          </button>
          <p className="fdemo-count u-micro" aria-live="off">
            Step {pad(step + 1)} / {pad(count)}
          </p>
          <button
            type="button"
            className="btn btn--signal u-press"
            aria-disabled={step === last}
            onClick={next}
          >
            Next
          </button>
        </div>

        <ol className="fdemo-steps" aria-label="Walkthrough steps">
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
          <span>{current.caption}</span>
        </p>

        <div className="fdemo-extras" role="group" aria-label="Walkthrough options">
          <button type="button" className="btn btn--paper u-press" onClick={restart}>
            Restart
          </button>
          <button
            type="button"
            className="btn btn--paper u-press"
            aria-pressed={playing}
            aria-disabled={reduce}
            onClick={toggleAutoplay}
          >
            Auto-play: {playing ? "on" : "off"}
          </button>
          {reduce && <p className="fdemo-note u-micro">Auto-play is off with reduced motion.</p>}
        </div>
      </div>
    </div>
  );
}
