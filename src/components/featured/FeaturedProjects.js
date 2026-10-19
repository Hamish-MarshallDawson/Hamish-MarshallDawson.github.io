import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotionConfig } from "framer-motion";
import { DemoPanel, RoundControl, controlLabels } from "./DemoPlayer";
import { ArrowIcon, ExternalIcon } from "../shared/Icons";
import { ProjectMedia } from "../vault/ProjectMedia";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { pad } from "./format";
import "./Featured.css";

// Demo loaders, keyed by the `featured.demo` value in projectdata.js. Each is
// a stable reference, and a demo's module is fetched on its first Play (or on hover
// or focus of its Play control).
export const DEMOS = {
  localmind: () => import("./demos/LocalMindDemo"),
  tensoroom: () => import("./demos/TensoRoomDemo"),
  gyminit: () => import("./demos/GyminitDemo"),
};

const NO_SCENES = [];

const repoLabel = (url) => (url.includes("github.com") ? "Repo" : "Visit");

// The card that a demo covers on a wide screen: the other card of the visible pair (start and
// start + 1). On a narrow screen (one column), and with a lone visible card, it is the card itself.
const partnerIndex = (index, start, total) => {
  const partner = index === start ? start + 1 : start;
  return partner < total ? partner : index;
};

// The featured block at the top of the vault: the polished builds, each with a
// pitch, three facts and a demo. One demo plays at a time. It covers a card's whole
// box: the card beside it on a wide screen, or its own card on a narrow one. Its close
// button (X) puts the covered card back.
export function FeaturedProjects({ projects }) {
  const wide = useMediaQuery("(min-width: 900px)");
  const reduce = useReducedMotionConfig();
  // The one run: which card it started from, its phase, its scene, and a key that changes per run.
  // Phases: "playing", "paused", "ended" (held on the last scene, then the panel fades out) and "idle" (closed).
  const [run, setRun] = useState(null);
  // Loaded demo modules, keyed by the demo's name.
  const [mods, setMods] = useState({});
  // The first visible card of the pair on a wide screen. More than two projects make a carousel.
  const [from, setFrom] = useState(0);
  const buttons = useRef({});

  // A `featured.demo` that is not in DEMOS shows no button; say so in dev.
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    projects.forEach((project) => {
      const key = project.featured?.demo;
      if (key && !DEMOS[key]) console.warn(`Featured: "${project.id}" names demo "${key}", which is not in DEMOS.`);
    });
  }, [projects]);

  const carousel = wide && projects.length > 2;
  const first = Math.min(from, Math.max(projects.length - 2, 0));
  const visible = (index) => !carousel || index === first || index === first + 1;
  const runIndex = run ? projects.findIndex((project) => project.id === run.id) : -1;
  const runProject = runIndex >= 0 ? projects[runIndex] : null;
  const runId = runProject?.id ?? null;
  const showing = Boolean(runProject) && (run.phase === "playing" || run.phase === "paused");
  // The card the panel sits over: its own card when narrow, its partner when wide.
  const hostId = runProject ? projects[wide ? partnerIndex(runIndex, carousel ? first : runIndex - (runIndex % 2), projects.length) : runIndex].id : null;
  const covered = showing ? hostId : null;
  const runDemo = runProject?.featured.demo;
  const runScenes = (runDemo && mods[runDemo]?.scenes) || NO_SCENES;

  // Fetches a demo's module once. A failed fetch leaves its card on the picture.
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
    setRun((prev) => ({ id: project.id, phase: "playing", scene: 0, runKey: (prev?.runKey ?? 0) + 1 }));
  };

  // With reduced motion, a press steps to the next scene; after the last, the panel goes.
  const advance = (project) => {
    const count = (mods[project.featured.demo]?.scenes ?? NO_SCENES).length;
    setRun((r) => (r.scene < count - 1 ? { ...r, scene: r.scene + 1 } : { ...r, phase: "ended" }));
  };

  // The card's button, the round control on the card and the one in the panel all call this.
  const press = (project) => {
    const phase = run?.id === project.id ? run.phase : "idle";
    if (phase === "idle" || phase === "ended") {
      start(project);
      return;
    }
    if (reduce) {
      if (phase === "playing") advance(project);
      return;
    }
    setRun((r) => ({ ...r, phase: r.phase === "playing" ? "paused" : "playing" }));
  };

  const close = useCallback(() => setRun((r) => (r ? { ...r, phase: "idle" } : r)), []);
  const slide = (to) => {
    setFrom(to);
    close();
  };
  const onScene = useCallback((scene) => setRun((r) => (r ? { ...r, scene } : r)), []);
  const onEnd = useCallback(() => setRun((r) => (r ? { ...r, phase: "ended" } : r)), []);

  // Escape closes the panel while focus is in it, or on the card it started from.
  useEffect(() => {
    if (!showing) return undefined;
    const onKey = (event) => {
      if (event.key !== "Escape") return;
      const cell = document.activeElement?.closest?.(".feat-cell");
      if (cell && (cell.dataset.id === runId || cell.dataset.id === hostId)) close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [showing, runId, hostId, close]);

  // When the panel closes or ends with focus in it, focus goes back to the card's Play button.
  useEffect(() => {
    if (showing || !runId) return;
    if (document.activeElement?.closest?.(".fdemo-overlay")) buttons.current[runId]?.focus({ preventScroll: true });
  }, [showing, runId]);

  // The panel moved (the screen crossed 900px) and took focus with it: focus its card's button.
  useEffect(() => {
    if (showing && document.activeElement === document.body) buttons.current[runId]?.focus({ preventScroll: true });
  }, [wide, showing, runId]);

  if (!projects.length) return null;

  return (
    <section className="feat" aria-labelledby="feat-title" aria-roledescription={carousel ? "carousel" : undefined}>
      <div className="feat-bar">
        <h3 id="feat-title" className="feat-title">
          Featured builds
        </h3>
        <p className="feat-note u-micro">Walkthroughs built into this page. No downloads, no network calls.</p>
      </div>

      {carousel && (
        <div className="feat-nav" role="group" aria-label="Featured projects navigation">
          <button type="button" className="btn btn--paper u-press" aria-disabled={first === 0} onClick={() => first > 0 && slide(first - 1)}>
            <ArrowIcon direction="left" className="btn-glyph" />
            <span className="sr-only">Previous projects</span>
          </button>
          <span className="feat-pos u-micro" aria-live="polite">
            {pad(first + 1)}–{pad(first + 2)} / {pad(projects.length)}
          </span>
          <button type="button" className="btn btn--paper u-press" aria-disabled={first + 2 >= projects.length} onClick={() => first + 2 < projects.length && slide(first + 1)}>
            <ArrowIcon className="btn-glyph" />
            <span className="sr-only">Next projects</span>
          </button>
        </div>
      )}

      <div className={carousel ? "feat-viewport" : undefined}>
      <ul className={`feat-grid${carousel ? " is-carousel" : ""}${carousel && reduce ? " is-still" : ""}`} aria-label="Featured projects" style={carousel ? { "--feat-start": first } : undefined}>
        {projects.map((project, index) => {
          const hosts = hostId === project.id && runProject;
          return (
            <li key={project.id} className="feat-cell" data-id={project.id} inert={visible(index) ? undefined : ""}>
              <FeaturedCard
                project={project}
                index={index}
                total={projects.length}
                phase={run?.id === project.id ? run.phase : "idle"}
                reduce={reduce}
                inert={covered === project.id}
                buttonRef={(el) => {
                  buttons.current[project.id] = el;
                }}
                onPress={() => press(project)}
                onPreload={() => preload(project)}
              />
              {hosts && (
                <DemoPanel
                  key={run.runKey}
                  Demo={mods[runDemo]?.default ?? null}
                  scenes={runScenes}
                  scene={run.scene}
                  phase={run.phase}
                  reduce={reduce}
                  title={runProject.name}
                  runKey={run.runKey}
                  focusClose={hostId === runId}
                  onPress={() => press(runProject)}
                  onClose={close}
                  onScene={onScene}
                  onEnd={onEnd}
                  onPreload={() => preload(runProject)}
                />
              )}
            </li>
          );
        })}
      </ul>
      </div>
    </section>
  );
}

// One card: its picture, its pitch and facts, and its Play button. The demo itself plays in a
// panel over a card (see FeaturedProjects), so the picture box keeps its size.
function FeaturedCard({ project, index, total, phase, reduce, inert, buttonRef, onPress, onPreload }) {
  const { pitch, facts = [], demo } = project.featured;
  const hasDemo = Boolean(DEMOS[demo]);
  const labels = controlLabels(phase, reduce, project.name);

  return (
    <article
      className="feat-card surface-paper"
      aria-labelledby={`feat-${project.id}`}
      data-category={project.categories[0]}
      inert={inert ? "" : undefined}
    >
      <div className={`feat-media${project.fit === "contain" ? " is-contain" : ""}${hasDemo ? " has-demo" : ""}`}>
        {/* The vault's own plate, decorative here: the heading names the project. */}
        <ProjectMedia project={project} decorative lazy />
        {hasDemo && <RoundControl phase={phase} reduce={reduce} title={project.name} onPress={onPress} onPreload={onPreload} />}
      </div>

      <div className="feat-body">
        <header className="feat-head">
          <span className="feat-idx u-micro">Featured {pad(index + 1)}/{pad(total)}</span>
          <p className="feat-cat u-micro">{project.category}</p>
        </header>

        <h4 id={`feat-${project.id}`} className="feat-name">
          {project.name}
        </h4>
        <p className="feat-pitch">{pitch}</p>

        <ul className="feat-facts" aria-label="Key facts">
          {facts.map((fact) => (
            <li key={fact}>{fact}</li>
          ))}
        </ul>

        <ul className="chip-list feat-tags" aria-label="Stack">
          {project.tags.map((tag) => (
            <li key={tag} className="chip">
              {tag}
            </li>
          ))}
        </ul>

        <div className="feat-actions">
          {hasDemo && (
            <button ref={buttonRef} type="button" className="btn btn--signal u-press" onClick={onPress} onMouseEnter={onPreload} onFocus={onPreload}>
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
  );
}
