import { useCallback, useEffect, useRef, useState } from "react";
import { DemoStage } from "./DemoStage";
import { ExternalIcon } from "../shared/Icons";
import { pad } from "./format";
import "./Featured.css";

// Demo loaders, keyed by the `featured.demo` value in projectdata.js. Each is
// a stable reference so DemoStage loads a demo once and reuses the module.
const DEMOS = {
  localmind: () => import("./demos/LocalMindDemo"),
  tensoroom: () => import("./demos/TensoRoomDemo"),
};

const repoLabel = (url) => (url.includes("github.com") ? "Repo" : "Visit");

// The featured block at the top of the vault: the polished builds, each with
// a pitch, three facts and a walkthrough. Everything comes from the `featured`
// object on each project, so adding one is a data change. Only one demo is
// open at a time; it opens in a framed stage under the cards.
export function FeaturedProjects({ projects }) {
  const [openId, setOpenId] = useState(null);
  const runRefs = useRef({});
  const stageRef = useRef(null);

  const open = projects.find((project) => project.id === openId) ?? null;

  // Move focus into the stage when a demo opens, so keyboard and screen
  // reader users land on what they asked for.
  useEffect(() => {
    if (openId) stageRef.current?.focus();
  }, [openId]);

  // Closing hands focus back to the card's button that opened the stage.
  const closeStage = useCallback((id) => {
    setOpenId(null);
    runRefs.current[id]?.focus();
  }, []);

  // Escape closes the open stage, as it closes the vault's dossier.
  useEffect(() => {
    if (!openId) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") closeStage(openId);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openId, closeStage]);

  // A `featured.demo` that is not in DEMOS shows no button; say so in dev.
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    projects.forEach((project) => {
      const key = project.featured?.demo;
      if (key && !DEMOS[key]) console.warn(`Featured: "${project.id}" names demo "${key}", which is not in DEMOS.`);
    });
  }, [projects]);

  if (!projects.length) return null;

  const toggle = (id) => {
    if (id === openId) closeStage(id);
    else setOpenId(id);
  };

  return (
    <section className="feat" aria-labelledby="feat-title">
      <div className="feat-bar">
        <h3 id="feat-title" className="feat-title">
          Featured builds
        </h3>
        <p className="feat-note u-micro">Walkthroughs built into this page. No downloads, no network calls.</p>
      </div>

      <ul className="feat-grid" aria-label="Featured projects">
        {projects.map((project, index) => {
          const { pitch, facts = [], demo } = project.featured;
          const hasDemo = Boolean(DEMOS[demo]);
          const isOpen = project.id === openId;
          return (
            <li key={project.id} className="feat-cell">
              <article className="feat-card surface-paper" aria-labelledby={`feat-${project.id}`} data-category={project.categories[0]}>
                <header className="feat-head">
                  <span className="feat-idx u-micro">Featured {pad(index + 1)}/{pad(projects.length)}</span>
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
                    <button
                      type="button"
                      ref={(node) => {
                        runRefs.current[project.id] = node;
                      }}
                      className="btn btn--signal u-press"
                      aria-expanded={isOpen}
                      aria-controls={isOpen ? "feat-stage" : undefined}
                      onClick={() => toggle(project.id)}
                    >
                      {isOpen ? "Close the demo" : "Run the demo"}
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
              </article>
            </li>
          );
        })}
      </ul>

      {open && (
        <section id="feat-stage" className="fstage surface-paper" aria-labelledby="fstage-title">
          <header className="fstage-bar u-micro">
            <h4 id="fstage-title" className="fstage-title" ref={stageRef} tabIndex={-1}>
              Demo · {open.name}
            </h4>
            <button type="button" className="fstage-close" onClick={() => closeStage(open.id)}>
              Close demo
            </button>
          </header>
          <DemoStage key={open.id} title={open.name} loader={DEMOS[open.featured.demo]} />
        </section>
      )}
    </section>
  );
}
