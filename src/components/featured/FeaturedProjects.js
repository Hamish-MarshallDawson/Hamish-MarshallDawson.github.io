import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { LayoutGroup, MotionConfigContext, motion, useReducedMotionConfig } from "framer-motion";
import { DemoPanel } from "./DemoPlayer";
import { ExternalIcon } from "../shared/Icons";
import { ProjectMedia } from "../vault/ProjectMedia";
import { pad } from "./format";
import "./Featured.css";

// Demo loaders, keyed by the `featured.demo` value in projectdata.js. Each is
// a stable reference, and a demo's module is fetched on its first Play (or on hover
// or focus of its Play control).
export const DEMOS = {
  localmind: () => import("./demos/LocalMindDemo"),
  tensoroom: () => import("./demos/TensoRoomDemo"),
  gyminit: () => import("./demos/GyminitDemo"),
  codeforgood: () => import("./demos/CodeForGoodDemo"),
  bus: () => import("./demos/BusDisplayDemo"),
  poseidon: () => import("./demos/PoseidonDemo"),
};

const NO_SCENES = [];
const COLUMNS = 3;

const repoLabel = (url) => (url.includes("github.com") ? "Repo" : "Visit");

// Where the playing layout puts the info panel, from the column of the card that was pressed: the
// stage takes the other two columns. A right-column card keeps its place and the stage opens to its
// left; a left-column card keeps its place and the stage opens to its right; a middle-column card has
// no two free columns on either side, so its panel slides one column left.
export const sideFor = (index) => (index % COLUMNS === COLUMNS - 1 ? "right" : "left");

// The featured block at the top of the vault: the six builds as a 3 x 2 grid of cards. Pressing Play
// grows that card into a two-row info panel and opens the demo stage on the other two columns, both
// rows. The other five shrink to an "Other builds" strip under it, each able to swap the demo in.
// X or Esc goes back to the grid, with focus on the card's Play button. The block keeps the grid's
// height while a demo plays, so nothing below it moves.
export function FeaturedProjects({ projects, onOpenFile }) {
  // The demos go still only with FX off (MotionConfig "always"), not with the OS setting, which
  // power-saving modes switch on. The expansion itself follows both: it cuts straight to the stage.
  const reduce = useContext(MotionConfigContext).reducedMotion === "always";
  const calm = useReducedMotionConfig();
  // The one run: which project, its phase, its scene, and a key that changes per run.
  // Phases: "playing", "paused", "ended" (held on the last scene) and "idle" (closed).
  const [run, setRun] = useState(null);
  // Loaded demo modules, keyed by the demo's name.
  const [mods, setMods] = useState({});
  // The grid's height when the stage opened, which the playing layout keeps.
  const [lock, setLock] = useState(null);
  const grid = useRef(null);
  const playMain = useRef(null);
  const buttons = useRef({});
  const lastId = useRef(null);

  // A `featured.demo` that is not in DEMOS shows no button; say so in dev.
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    projects.forEach((project) => {
      const key = project.featured?.demo;
      if (key && !DEMOS[key]) console.warn(`Featured: "${project.id}" names demo "${key}", which is not in DEMOS.`);
    });
  }, [projects]);

  const runIndex = run ? projects.findIndex((project) => project.id === run.id) : -1;
  const open = runIndex >= 0 && run.phase !== "idle";
  const runProject = open ? projects[runIndex] : null;
  const runDemo = runProject?.featured.demo;
  const runScenes = (runDemo && mods[runDemo]?.scenes) || NO_SCENES;

  // Fetches a demo's module once. A failed fetch closes the stage again.
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

  // Starts (or swaps to) a project's demo from its first scene.
  const start = (project) => {
    preload(project);
    if (!open && grid.current) setLock(grid.current.offsetHeight);
    lastId.current = project.id;
    setRun((prev) => ({ id: project.id, phase: "playing", scene: 0, runKey: (prev?.runKey ?? 0) + 1 }));
  };

  // The round control: play, pause or replay; with FX off a press steps to the next scene.
  const press = (project) => {
    const phase = run?.id === project.id ? run.phase : "idle";
    if (phase === "idle" || phase === "ended") {
      start(project);
      return;
    }
    if (reduce) {
      const count = (mods[project.featured.demo]?.scenes ?? NO_SCENES).length;
      setRun((r) => (r.scene < count - 1 ? { ...r, scene: r.scene + 1 } : { ...r, phase: "ended" }));
      return;
    }
    setRun((r) => ({ ...r, phase: r.phase === "playing" ? "paused" : "playing" }));
  };

  const close = useCallback(() => setRun((r) => (r ? { ...r, phase: "idle" } : r)), []);
  const onScene = useCallback((scene) => setRun((r) => (r ? { ...r, scene } : r)), []);
  const onEnd = useCallback(() => setRun((r) => (r ? { ...r, phase: "ended" } : r)), []);

  // Esc closes the stage, unless a dialog (a dossier, the Index menu) is the one being closed.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      if (document.activeElement?.closest?.('[role="dialog"]')) return;
      close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  // On opening, and on each swap from the strip below it, the stage scrolls to just under the top bar, so
  // all of it is on screen above the status strip.
  const runKey = open ? run.runKey : null;
  useEffect(() => {
    // Instant: a smooth scroll is cancelled by the layout settling under it.
    if (runKey !== null) playMain.current?.scrollIntoView?.({ block: "start", behavior: "instant" });
  }, [runKey]);

  // The demo mounts once the card has finished growing into its panel: mounting it is heavy enough to
  // swallow the 240 ms slide. With reduced motion there is no slide, so it mounts at once.
  const [grown, setGrown] = useState(false);
  useEffect(() => {
    setGrown(open && calm);
    if (!open || calm) return undefined;
    // In case the layout animation never reports back (nothing to animate from).
    const fallback = setTimeout(() => setGrown(true), 400);
    return () => clearTimeout(fallback);
  }, [open, calm]);

  // Back on the grid, focus returns to the Play button of the card that was playing.
  useEffect(() => {
    if (open || !lastId.current) return;
    buttons.current[lastId.current]?.focus(); // scrolls the card back into view if the grid moved it off screen
    lastId.current = null;
  }, [open]);

  if (!projects.length) return null;

  const morph = calm ? { duration: 0 } : { duration: 0.24, ease: [0.2, 0, 0, 1] };

  return (
    <section className="feat" aria-labelledby="feat-title">
      <div className="feat-bar">
        <h3 id="feat-title" className="feat-title">
          Featured builds
        </h3>
        {open && (
          <p className="feat-now u-micro">
            Now playing · {pad(runIndex + 1)} / {pad(projects.length)}
          </p>
        )}
      </div>

      <LayoutGroup id="feat">
        {open ? (
          <div className="feat-play" data-side={sideFor(runIndex)} style={lock ? { "--feat-lock": `${lock}px` } : undefined}>
            <div className="feat-play-main" ref={playMain}>
              <FeaturedInfo
                project={runProject}
                phase={run.phase}
                scene={run.scene}
                count={runScenes.length}
                reduce={reduce}
                transition={morph}
                onGrown={() => setGrown(true)}
                onOpenFile={onOpenFile}
              />
              <motion.div
                className="feat-stage"
                initial={calm ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={calm ? { duration: 0 } : { duration: 0.24, delay: 0.12 }}
              >
                <DemoPanel
                  key={run.runKey}
                  stage
                  Demo={grown ? mods[runDemo]?.default ?? null : null}
                  scenes={runScenes}
                  scene={run.scene}
                  phase={run.phase}
                  reduce={reduce}
                  title={runProject.name}
                  runKey={run.runKey}
                  focusClose
                  onPress={() => press(runProject)}
                  onReplay={() => start(runProject)}
                  onClose={close}
                  onScene={onScene}
                  onEnd={onEnd}
                  onPreload={() => preload(runProject)}
                />
              </motion.div>
            </div>

            <div className="feat-others">
              <p id="feat-others-title" className="feat-others-title u-micro">
                Other builds · swap the demo
              </p>
              <ul className="feat-others-list" aria-labelledby="feat-others-title">
                {projects
                  .filter((project) => project.id !== runProject.id)
                  .map((project) => (
                    <li key={project.id}>
                      <button
                        type="button"
                        className="feat-other u-press"
                        onClick={() => start(project)}
                        onMouseEnter={() => preload(project)}
                        onFocus={() => preload(project)}
                      >
                        <span className={`feat-other-thumb${project.fit === "contain" ? " is-contain" : ""}`}>
                          <ProjectMedia project={project} decorative lazy />
                        </span>
                        <span className="feat-other-name">
                          <span className="sr-only">Play the demo of </span>
                          {project.short ?? project.name}
                        </span>
                        <span className="feat-other-play" aria-hidden="true">
                          ▶
                        </span>
                      </button>
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        ) : (
          <ul className="feat-grid" aria-label="Featured projects" ref={grid}>
            {projects.map((project) => (
              <li key={project.id} className="feat-cell" data-id={project.id}>
                <FeaturedCard
                  project={project}
                  transition={morph}
                  buttonRef={(el) => {
                    buttons.current[project.id] = el;
                  }}
                  onPlay={() => start(project)}
                  onPreload={() => preload(project)}
                />
              </li>
            ))}
          </ul>
        )}
      </LayoutGroup>
    </section>
  );
}

// The project's outbound links: its repo or site, and the charity it was built for.
// `compact` (the grid cards) shows one: the charity a build was made for, else its repo or site.
function ProjectLinks({ project, compact = false }) {
  return (
    <>
      {project.url && !(compact && project.charity) && (
        <a className="btn btn--paper u-press" href={project.url} target="_blank" rel="noopener noreferrer">
          {repoLabel(project.url)}
          <span className="sr-only"> (opens in a new tab)</span>
          <ExternalIcon className="btn-glyph" />
        </a>
      )}
      {project.charity && (
        <a className="btn btn--paper u-press" href={project.charity.url} target="_blank" rel="noopener noreferrer">
          Visit charity
          <span className="sr-only"> (opens in a new tab)</span>
          <ExternalIcon className="btn-glyph" />
        </a>
      )}
    </>
  );
}

// One card on the grid: picture, category, name, pitch, Play demo and its links. It shares a layout id
// with the info panel, so pressing Play grows the card into the panel.
function FeaturedCard({ project, transition, buttonRef, onPlay, onPreload }) {
  const { pitch, demo } = project.featured;
  const hasDemo = Boolean(DEMOS[demo]);

  return (
    <motion.article
      layoutId={`feat-${project.id}`}
      transition={transition}
      className="feat-card surface-paper"
      aria-labelledby={`feat-${project.id}`}
      data-category={project.categories[0]}
    >
      <div className={`feat-media${project.fit === "contain" ? " is-contain" : ""}`}>
        {/* The vault's own plate, decorative here: the heading names the project. */}
        <ProjectMedia project={project} decorative lazy />
      </div>

      <div className="feat-body">
        <p className="feat-cat u-micro">{project.category}</p>
        <h4 id={`feat-${project.id}`} className="feat-name">
          {project.name}
        </h4>
        <p className="feat-pitch">{pitch}</p>

        <div className="feat-actions">
          {hasDemo && (
            <button ref={buttonRef} type="button" className="btn btn--signal u-press" onClick={onPlay} onMouseEnter={onPreload} onFocus={onPreload}>
              <span aria-hidden="true">▶</span> Play demo
              <span className="sr-only"> for {project.name}</span>
            </button>
          )}
          <ProjectLinks project={project} compact />
        </div>
      </div>
    </motion.article>
  );
}

// The playing card, grown to two rows: more about the project beside its demo.
function FeaturedInfo({ project, phase, scene, count, reduce, transition, onGrown, onOpenFile }) {
  const { pitch, facts = [] } = project.featured;
  // With FX off the demo holds each scene until the round control steps it on.
  const state = { playing: reduce ? "▶ Step through" : "▶ Playing", paused: "❚❚ Paused", ended: "■ Ended" }[phase];
  return (
    <motion.article
      layoutId={`feat-${project.id}`}
      transition={transition}
      onLayoutAnimationComplete={onGrown}
      className="feat-card feat-info surface-paper"
      aria-labelledby={`feat-info-${project.id}`}
    >
      <div className={`feat-media${project.fit === "contain" ? " is-contain" : ""}`}>
        <ProjectMedia project={project} decorative />
      </div>
      <div className="feat-body">
        <p className="feat-cat u-micro">{project.category}</p>
        <h4 id={`feat-info-${project.id}`} className="feat-name">
          {project.name}
        </h4>
        <p className="feat-state u-micro">
          {state}
          {count ? ` · scene ${Math.min(scene, count - 1) + 1} / ${count}` : ""}
        </p>
        <p className="feat-pitch">{pitch}</p>
        <p className="feat-desc">{project.description}</p>
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
          <ProjectLinks project={project} />
          {onOpenFile && (
            <button type="button" className="btn btn--paper u-press" onClick={() => onOpenFile(project.id)}>
              Full file +<span className="sr-only"> for {project.name}</span>
            </button>
          )}
        </div>
      </div>
    </motion.article>
  );
}
