import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotionConfig } from "framer-motion";
import { DemoPlayer, controlLabels } from "./DemoPlayer";
import { ExternalIcon } from "../shared/Icons";
import { ProjectMedia } from "../vault/ProjectMedia";
import { pad } from "./format";
import "./Featured.css";

// Demo loaders, keyed by the `featured.demo` value in projectdata.js. Each is
// a stable reference, and a demo's module is fetched on its first Play (or on hover
// or focus of its Play control).
const DEMOS = {
  localmind: () => import("./demos/LocalMindDemo"),
  tensoroom: () => import("./demos/TensoRoomDemo"),
};

const NO_SCENES = [];

const repoLabel = (url) => (url.includes("github.com") ? "Repo" : "Visit");

// The featured block at the top of the vault: the polished builds, each with a
// pitch, three facts and a demo. The demo plays inside the card's picture box,
// and only one card plays at a time: starting one resets the other.
export function FeaturedProjects({ projects }) {
  const [activeId, setActiveId] = useState(null);

  // A `featured.demo` that is not in DEMOS shows no button; say so in dev.
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    projects.forEach((project) => {
      const key = project.featured?.demo;
      if (key && !DEMOS[key]) console.warn(`Featured: "${project.id}" names demo "${key}", which is not in DEMOS.`);
    });
  }, [projects]);

  if (!projects.length) return null;

  return (
    <section className="feat" aria-labelledby="feat-title">
      <div className="feat-bar">
        <h3 id="feat-title" className="feat-title">
          Featured builds
        </h3>
        <p className="feat-note u-micro">Walkthroughs built into this page. No downloads, no network calls.</p>
      </div>

      <ul className="feat-grid" aria-label="Featured projects">
        {projects.map((project, index) => (
          <li key={project.id} className="feat-cell">
            <FeaturedCard
              project={project}
              index={index}
              total={projects.length}
              active={project.id === activeId}
              onStart={() => setActiveId(project.id)}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

// One card. It owns its demo's run: the phase (idle, playing, paused or ended) and the scene.
// The picture box keeps its size: the poster is the card's picture, and the demo plays over it.
function FeaturedCard({ project, index, total, active, onStart }) {
  const { pitch, facts = [], demo } = project.featured;
  const loader = DEMOS[demo];
  const reduce = useReducedMotionConfig();
  const boxRef = useRef(null);
  const [mod, setMod] = useState(null);
  const [phase, setPhase] = useState("idle");
  const [scene, setScene] = useState(0);
  const [runKey, setRunKey] = useState(0);
  const scenes = mod?.scenes ?? NO_SCENES;
  const count = scenes.length;

  // Fetches the demo's module once. A failed fetch leaves the card on its picture.
  const preload = useCallback(() => {
    if (!loader || mod) return;
    loader().then(setMod, () => setPhase("idle"));
  }, [loader, mod]);

  // Another card took the box: this one goes back to its picture.
  useEffect(() => {
    if (!active && phase !== "idle") {
      setPhase("idle");
      setScene(0);
    }
  }, [active, phase]);

  // Scrolls only when the box is mostly off screen (smooth, or at once with reduced motion).
  const bringIntoView = () => {
    const box = boxRef.current;
    if (!box) return;
    const r = box.getBoundingClientRect();
    const seen = Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0);
    if (seen < r.height / 2) box.scrollIntoView?.({ block: "center", behavior: reduce ? "auto" : "smooth" });
  };

  const start = () => {
    preload();
    onStart();
    setScene(0);
    setRunKey((k) => k + 1);
    setPhase("playing");
    bringIntoView();
  };

  // With reduced motion, a press steps to the next scene; after the last, it returns to the picture.
  const advance = () => {
    if (scene < count - 1) setScene(scene + 1);
    else setPhase("ended");
  };

  // The card's button and the round control both call this, so they always do the same thing.
  const press = () => {
    if (phase === "idle" || phase === "ended") {
      start();
      return;
    }
    if (reduce) {
      if (phase === "playing") advance();
      return;
    }
    setPhase(phase === "playing" ? "paused" : "playing");
  };

  const labels = controlLabels(phase, reduce, project.name);

  return (
    <article
      className="feat-card surface-paper"
      aria-labelledby={`feat-${project.id}`}
      data-category={project.categories[0]}
    >
      <div ref={boxRef} className={`feat-media${project.fit === "contain" ? " is-contain" : ""}${loader ? " has-demo" : ""}`}>
        {/* The vault's own plate, decorative here: the heading names the project. */}
        <ProjectMedia project={project} decorative lazy />
        {loader && (
          <DemoPlayer
            boxRef={boxRef}
            Demo={mod?.default ?? null}
            scenes={scenes}
            scene={scene}
            phase={phase}
            reduce={reduce}
            title={project.name}
            runKey={runKey}
            onPress={press}
            onScene={setScene}
            onEnd={() => setPhase("ended")}
            onPreload={preload}
          />
        )}
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
          {loader && (
            <button type="button" className="btn btn--signal u-press" onClick={press} onMouseEnter={preload} onFocus={preload}>
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
