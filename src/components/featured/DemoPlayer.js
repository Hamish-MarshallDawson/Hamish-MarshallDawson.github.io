import { useEffect, useRef, useState } from "react";

// The demo plays in a panel over a featured card: the card it was started from, or the
// card beside it on a wide screen. The panel is the card's own size (the cell's box), so
// nothing else on the page moves. The panel has a close button (X) and the round control
// in its band, which does what the card's own control does.
//
// The player owns the timing. A demo owns its scenes (its own look and its own CSS animations).
// The player tells it which scene to show, and whether it is playing (`playing` is false while
// paused, off screen, in a hidden tab, or with reduced motion). The demo must not start JS
// timers while `playing` is false.
//
//   scenes:  [{ id, caption, ms }], exported by the demo. `ms` is how long the scene is shown.
//   Demo:    the demo's default export, rendered with { scene, playing, reducedMotion }.
//
// The last scene is held for HOLD_MS more, then the panel fades back to the card.

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

// What the round control and the card's button say, from the run's phase. One function, so the
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

// The round control. It is in the card's picture box and in the panel's band, and both
// call the same press, so they always show and do the same.
export function RoundControl({ phase, reduce, title, onPress, onPreload }) {
  const labels = controlLabels(phase, reduce, title);
  return (
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
  );
}

const NO_SCENES = [];

// Scrolls the panel into view only when it is mostly off screen (smooth, or at once with reduced motion).
function bringIntoView(panel, reduce) {
  const r = panel.getBoundingClientRect();
  const seen = Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0);
  // A panel taller than the screen (a phone held sideways) counts as in view when the screen is mostly filled.
  if (seen < Math.min(r.height, window.innerHeight) / 2) panel.scrollIntoView?.({ block: "center", behavior: reduce ? "auto" : "smooth" });
}

export function DemoPanel({ Demo, scenes = NO_SCENES, scene, phase, reduce, title, runKey, focusClose, onPress, onClose, onScene, onEnd, onPreload }) {
  const [away, setAway] = useState(false);
  const panelRef = useRef(null);
  const closeRef = useRef(null);
  const count = scenes.length;
  const show = phase === "playing" || phase === "paused";
  const live = Boolean(Demo) && phase === "playing" && !reduce && !away;
  const shown = Math.min(scene, Math.max(0, count - 1));
  // The timer reads the latest callbacks without restarting when they change identity.
  const callbacks = useRef({});
  callbacks.current = { onScene, onEnd };
  // Time left in the current scene when it was paused, so play resumes from the same point.
  const remain = useRef(null);

  // Off screen, or in a hidden tab, the demo freezes as if paused. The phase is kept, so it resumes.
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return undefined;
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
    observer?.observe(panel);
    document.addEventListener("visibilitychange", sync);
    return () => {
      observer?.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  // A new run starts its first scene with no time left over from the last run, and comes into view.
  useEffect(() => {
    remain.current = null;
    if (show && panelRef.current) bringIntoView(panelRef.current, reduce);
  }, [runKey, reduce, show]);

  // The close button takes focus when the panel opens over the card that was pressed (the card's
  // own button is inert then), and when the panel moves to a new card while it is open.
  // Focus does not scroll: the page does not move. The X sticks to the top of the screen and the band to the bottom.
  useEffect(() => {
    if (focusClose && show) closeRef.current?.focus({ preventScroll: true });
  }, [runKey, focusClose, show]);

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
    <section
      ref={panelRef}
      className="fdemo-overlay"
      aria-label={`${title} demo`}
      data-show={show ? "true" : "false"}
      data-reduced={reduce ? "true" : undefined}
      inert={show ? undefined : ""}
    >
      {/* A closed panel fades out and then stays in the page, hidden and inert: out of the tab order and the accessibility tree. */}
      {/* The X is first in the panel, in its own sticky row, so it stays under the top bar while any of the panel is below it. */}
      <div className="fdemo-top">
        <button ref={closeRef} type="button" className="fdemo-close" aria-label={`Close the ${title} demo`} onClick={onClose}>
          <svg className="fdemo-close-glyph" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
            <path d="M3 3L13 13M13 3L3 13" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="square" />
          </svg>
        </button>
      </div>
      {/* The stage holds the scene and the band as one unit. It sticks under the top bar while the panel spans the screen. */}
      <div className="fdemo-stage">
        <div className="fdemo-scene">
          {Demo && <Demo scene={shown} playing={live} reducedMotion={reduce} />}
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
          <RoundControl phase={phase} reduce={reduce} title={title} onPress={onPress} onPreload={onPreload} />
        </div>
      </div>
    </section>
  );
}
