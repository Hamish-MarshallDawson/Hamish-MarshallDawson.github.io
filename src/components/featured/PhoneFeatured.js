import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { MotionConfigContext, useReducedMotionConfig } from "framer-motion";
import { DemoPanel, controlLabels } from "./DemoPlayer";
import { DEMOS } from "./FeaturedProjects";
import { ArrowIcon, ExternalIcon } from "../shared/Icons";
import { ProjectMedia } from "../vault/ProjectMedia";
import { pad } from "./format";
import "./PhoneFeatured.css";

// A swipe shorter than this (px) springs back instead of changing card.
export const SWIPE_PX = 50;

// Index i wrapped into 0..n-1, so -1 is the last card and n is the first.
export const wrap = (i, n) => ((i % n) + n) % n;

// A finger moved dx px: -1 (back), 1 (forward) or 0 (spring back). Left swipe goes forward.
export const swipeStep = (dx, threshold = SWIPE_PX) => (dx <= -threshold ? 1 : dx >= threshold ? -1 : 0);

const NO_SCENES = [];
const repoLabel = (url) => (url.includes("github.com") ? "Repo" : "Visit");

// Phone featured projects (Layout A, Figma 21:822 and 26:1198): a wrap-around carousel with a peek of
// the next card, a 01 / 06 counter, a position bar and arrow buttons. Play fills the screen between the
// header and the phone bar, with a switcher to move between demos without going back.
export function PhoneFeatured({ projects }) {
  const n = projects.length;
  const reduce = useContext(MotionConfigContext).reducedMotion === "always";
  const calm = useReducedMotionConfig();
  const [at, setAt] = useState(0);
  const [dx, setDx] = useState(0);
  const [run, setRun] = useState(null);
  const [mods, setMods] = useState({});
  const track = useRef(null);
  const touch = useRef(null);
  const buttons = useRef({});

  // Slides are ordered previous, current, next, …, so both neighbours sit beside the current card.
  const order = (i) => wrap(i - at + 1, n);

  // One card's width plus the gap, read from the laid-out track.
  const pitch = () => {
    const kids = track.current?.children;
    return kids && kids.length > 1 ? kids[1].offsetLeft - kids[0].offsetLeft : 0;
  };

  // Changes card by step (-1, 0 or 1). `from` is where the finger left the track, so the slide continues from there.
  const go = (step, from = 0) => {
    if (step) setAt((a) => wrap(a + step, n));
    setDx(0);
    const start = from + step * pitch();
    if (calm || !start || !track.current?.animate) return;
    track.current.animate([{ translate: `${start}px 0` }, { translate: "0 0" }], { duration: 260, easing: "cubic-bezier(0.2, 0, 0, 1)" });
  };

  const onTouchStart = (e) => {
    const t = e.touches[0];
    touch.current = { x: t.clientX, y: t.clientY, horizontal: null };
  };
  const onTouchMove = (e) => {
    const s = touch.current;
    if (!s) return;
    const t = e.touches[0];
    const mx = t.clientX - s.x;
    const my = t.clientY - s.y;
    if (s.horizontal === null && Math.abs(mx) + Math.abs(my) > 8) s.horizontal = Math.abs(mx) > Math.abs(my);
    if (s.horizontal) setDx(mx);
  };
  const onTouchEnd = (e) => {
    const s = touch.current;
    touch.current = null;
    if (!s?.horizontal) return;
    const t = e.changedTouches[0];
    const mx = t.clientX - s.x;
    go(swipeStep(mx), mx);
  };

  // ---- demo run (same phases as FeaturedProjects: playing, paused, ended, idle) ----
  const runIndex = run ? projects.findIndex((p) => p.id === run.id) : -1;
  const runProject = runIndex >= 0 ? projects[runIndex] : null;
  const showing = Boolean(runProject) && (run.phase === "playing" || run.phase === "paused");
  const runDemo = runProject?.featured.demo;
  const runScenes = (runDemo && mods[runDemo]?.scenes) || NO_SCENES;
  const playable = projects.filter((p) => DEMOS[p.featured?.demo]);

  const preload = useCallback(
    (project) => {
      const key = project.featured?.demo;
      if (!DEMOS[key] || mods[key]) return;
      DEMOS[key]().then(
        (mod) => setMods((prev) => ({ ...prev, [key]: mod })),
        () => setRun((r) => (r && r.id === project.id ? { ...r, phase: "idle" } : r)),
      );
    },
    [mods],
  );

  const start = (project) => {
    preload(project);
    setAt(projects.indexOf(project));
    setRun((prev) => ({ id: project.id, phase: "playing", scene: 0, runKey: (prev?.runKey ?? 0) + 1 }));
  };

  const press = (project) => {
    const phase = run?.id === project.id ? run.phase : "idle";
    if (phase === "idle" || phase === "ended") return start(project);
    if (reduce) {
      if (phase !== "playing") return undefined;
      const count = (mods[project.featured.demo]?.scenes ?? NO_SCENES).length;
      return setRun((r) => (r.scene < count - 1 ? { ...r, scene: r.scene + 1 } : { ...r, phase: "ended" }));
    }
    return setRun((r) => ({ ...r, phase: r.phase === "playing" ? "paused" : "playing" }));
  };

  // The switcher plays the previous or next project's demo, wrapping round.
  const switchDemo = (step) => {
    const i = playable.findIndex((p) => p.id === runProject.id);
    start(playable[wrap(i + step, playable.length)]);
  };

  const close = useCallback(() => setRun((r) => (r ? { ...r, phase: "idle" } : r)), []);
  const onScene = useCallback((scene) => setRun((r) => (r ? { ...r, scene } : r)), []);
  const onEnd = useCallback(() => setRun((r) => (r ? { ...r, phase: "ended" } : r)), []);

  useEffect(() => {
    if (!showing) return undefined;
    const onKey = (e) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [showing, close]);

  // Closing (X, Esc, or the demo ending) puts focus back on the card's Play button.
  const runId = runProject?.id;
  const wasShowing = useRef(false);
  useEffect(() => {
    if (wasShowing.current && !showing && runId) buttons.current[runId]?.focus({ preventScroll: true });
    wasShowing.current = showing;
  }, [showing, runId]);

  if (!n) return null;
  const next = projects[wrap(at + 1, n)];
  const switchIndex = runProject ? playable.findIndex((p) => p.id === runProject.id) : -1;

  return (
    <section className="pfeat" aria-labelledby="pfeat-title" aria-roledescription="carousel">
      <h3 id="pfeat-title" className="feat-title pfeat-title">
        Featured builds
      </h3>

      <div className="pfeat-viewport" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} onTouchCancel={() => go(0, dx)}>
        <ul className="pfeat-track" ref={track} style={dx ? { translate: `${dx}px 0` } : undefined}>
          {projects.map((project, index) => {
            const phase = run?.id === project.id ? run.phase : "idle";
            const labels = controlLabels(phase, reduce, project.name);
            const hasDemo = Boolean(DEMOS[project.featured?.demo]);
            const current = index === at;
            return (
              <li
                key={project.id}
                className="pfeat-slide"
                style={{ order: order(index) }}
                aria-roledescription="slide"
                aria-label={`${index + 1} of ${n}`}
                aria-hidden={current ? undefined : "true"}
                inert={current ? undefined : ""}
              >
                <article className="pfeat-card surface-paper" aria-labelledby={`pfeat-${project.id}`}>
                  <div className={`pfeat-media${project.fit === "contain" ? " is-contain" : ""}`}>
                    <ProjectMedia project={project} decorative lazy />
                  </div>
                  <div className="pfeat-body">
                    <p className="pfeat-kicker u-micro">{project.category}</p>
                    <h4 id={`pfeat-${project.id}`} className="pfeat-name">
                      {project.name}
                    </h4>
                    <p className="pfeat-pitch">{project.featured.pitch}</p>
                    <div className="pfeat-actions">
                      {hasDemo && (
                        <button
                          ref={(el) => {
                            buttons.current[project.id] = el;
                          }}
                          type="button"
                          className="btn btn--signal u-press"
                          onClick={() => press(project)}
                          onFocus={() => preload(project)}
                        >
                          {labels.glyph === "play" ? "▶ " : ""}
                          {labels.text}
                          <span className="sr-only"> for {project.name}</span>
                        </button>
                      )}
                      {project.url && (
                        <a className="btn btn--paper u-press" href={project.url} target="_blank" rel="noopener noreferrer">
                          {repoLabel(project.url)}
                          <span className="sr-only"> (opens in a new tab)</span>
                          <ExternalIcon className="btn-glyph" />
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="pfeat-nav" role="group" aria-label="Featured projects navigation">
        <span className="pfeat-count" aria-live="polite">
          {pad(at + 1)} / {pad(n)}
          <span className="sr-only">: {projects[at].name}</span>
        </span>
        <ol className="pfeat-bar" aria-hidden="true">
          {projects.map((p, i) => (
            <li key={p.id} className={i === at ? "is-current" : undefined} />
          ))}
        </ol>
        <button type="button" className="pfeat-arrow" onClick={() => go(-1)} aria-label="Previous project">
          <ArrowIcon direction="left" className="btn-glyph" />
        </button>
        <button type="button" className="pfeat-arrow pfeat-arrow--next" onClick={() => go(1)} aria-label={`Next project: ${next.name}`}>
          <ArrowIcon className="btn-glyph" />
        </button>
      </div>

      {runProject && (
        <div className="pfeat-stage" data-show={showing ? "true" : "false"} inert={showing ? undefined : ""}>
          <DemoPanel
            key={run.runKey}
            Demo={mods[runDemo]?.default ?? null}
            scenes={runScenes}
            scene={run.scene}
            phase={run.phase}
            reduce={reduce}
            title={runProject.name}
            runKey={run.runKey}
            focusClose
            onPress={() => press(runProject)}
            onClose={close}
            onScene={onScene}
            onEnd={onEnd}
            onPreload={() => preload(runProject)}
          />
          {playable.length > 1 && (
            <div className="pfeat-switch" role="group" aria-label="Switch demo">
              <button type="button" className="pfeat-arrow" onClick={() => switchDemo(-1)} aria-label="Previous demo">
                <ArrowIcon direction="left" className="btn-glyph" />
              </button>
              <p className="pfeat-switch-label">
                <b>
                  {pad(switchIndex + 1)} / {pad(playable.length)} · {runProject.name}
                </b>
                <span>Next: {playable[wrap(switchIndex + 1, playable.length)].name}</span>
              </p>
              <button type="button" className="pfeat-arrow pfeat-arrow--next" onClick={() => switchDemo(1)} aria-label="Next demo">
                <ArrowIcon className="btn-glyph" />
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
