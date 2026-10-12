import { useEffect, useRef, useState } from "react";

// The demo plays inside the card's picture box, in place of the picture. The box keeps its
// size: the demo fills a layer on top of it, and nothing else on the page moves.
//
// The player owns the timing. A demo owns its scenes (its own look and its own CSS animations).
// The player tells it which scene to show, and whether it is playing (`playing` is false while
// paused, off screen, in a hidden tab, or with reduced motion). The demo must not start JS
// timers while `playing` is false.
//
//   scenes:  [{ id, caption, ms }], exported by the demo. `ms` is how long the scene is shown.
//   Demo:    the demo's default export, rendered with { scene, playing, reducedMotion }.
//
// The last scene is held for HOLD_MS more, then the layer fades back to the picture.

export const HOLD_MS = 2000;

const GLYPHS = {
  play: <path d="M4.5 2.5v11l9-5.5z" />,
  pause: (
    <>
      <path d="M4 2.5h3v11H4zM9 2.5h3v11H9z" />
    </>
  ),
  next: (
    <>
      <path d="M2.5 2.5v11l8-5.5z" />
      <path d="M11.5 2.5h2v11h-2z" />
    </>
  ),
  replay: (
    <path
      d="M3.2 8a4.8 4.8 0 1 0 1.5-3.5M2.6 1.8v3.2h3.2"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="square"
    />
  ),
};

// What the round control and the card's button say, from the player's phase. One function, so the
// two cannot drift apart. `phase` is "idle", "playing", "paused" or "ended".
export function controlLabels(phase, reduce, title) {
  if (reduce) {
    if (phase === "playing") return { text: "Next scene", aria: `Next scene of the ${title} demo`, glyph: "next" };
    return { text: "Play demo", aria: `Play the ${title} demo`, glyph: "play" };
  }
  if (phase === "playing") return { text: "Pause demo", aria: `Pause the ${title} demo`, glyph: "pause" };
  if (phase === "ended") return { text: "Replay demo", aria: `Replay the ${title} demo`, glyph: "replay" };
  return { text: "Play demo", aria: `Play the ${title} demo`, glyph: "play" };
}

const NO_SCENES = [];

export function DemoPlayer({ boxRef, Demo, scenes = NO_SCENES, scene, phase, reduce, title, runKey, onPress, onScene, onEnd, onPreload }) {
  const [away, setAway] = useState(false);
  const count = scenes.length;
  const show = phase === "playing" || phase === "paused";
  const live = Boolean(Demo) && phase === "playing" && !reduce && !away;
  const shown = Math.min(scene, Math.max(0, count - 1));
  const labels = controlLabels(phase, reduce, title);
  // The timer reads the latest callbacks without restarting when they change identity.
  const callbacks = useRef({});
  callbacks.current = { onScene, onEnd };
  // Time left in the current scene when it was paused, so play resumes from the same point.
  const remain = useRef(null);

  // Off screen, or in a hidden tab, the demo freezes as if paused. The phase is kept, so it resumes.
  useEffect(() => {
    const box = boxRef.current;
    if (!box) return undefined;
    let outOfView = false;
    const sync = () => {
      const next = outOfView || document.hidden;
      setAway((prev) => (prev === next ? prev : next));
    };
    const observer = typeof IntersectionObserver === "function"
      ? new IntersectionObserver(([entry]) => {
        outOfView = !entry.isIntersecting;
        sync();
      })
      : null;
    observer?.observe(box);
    document.addEventListener("visibilitychange", sync);
    return () => {
      observer?.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, [boxRef]);

  // A new run starts its first scene with no time left over from the last run.
  useEffect(() => {
    remain.current = null;
  }, [runKey]);

  // The scene timer. It runs only while the demo is live, and leaves no timer behind.
  useEffect(() => {
    if (!live) return undefined;
    const full = (scenes[shown]?.ms ?? 0) + (shown === count - 1 ? HOLD_MS : 0);
    const left = remain.current ?? full;
    const started = performance.now();
    let fired = false;
    const timer = setTimeout(() => {
      fired = true;
      remain.current = null;
      if (shown < count - 1) callbacks.current.onScene(shown + 1);
      else callbacks.current.onEnd();
    }, left);
    return () => {
      clearTimeout(timer);
      // Paused, hidden, or changed: keep what is left of the scene.
      if (!fired) remain.current = Math.max(0, left - (performance.now() - started));
    };
  }, [live, shown, count, scenes]);

  return (
    <>
      {Demo && (
        <div key={runKey} className="fdemo-layer" data-show={show ? "true" : "false"} data-reduced={reduce ? "true" : undefined}>
          <div className="fdemo-scene">
            <Demo scene={shown} playing={live} reducedMotion={reduce} />
          </div>
          <div className="fdemo-band">
            <p className="fdemo-caption" aria-live="polite" aria-atomic="true">
              {show && scenes[shown] ? scenes[shown].caption : ""}
            </p>
            <ol className="fdemo-dots" aria-hidden="true">
              {scenes.map((item, i) => (
                <li key={item.id} className={i === shown ? "is-current" : undefined} />
              ))}
            </ol>
          </div>
        </div>
      )}
      <button
        type="button"
        className="fdemo-round"
        aria-label={labels.aria}
        data-glyph={labels.glyph}
        onClick={onPress}
        onMouseEnter={onPreload}
        onFocus={onPreload}
      >
        <svg className="fdemo-round-glyph" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
          {GLYPHS[labels.glyph]}
        </svg>
      </button>
    </>
  );
}
