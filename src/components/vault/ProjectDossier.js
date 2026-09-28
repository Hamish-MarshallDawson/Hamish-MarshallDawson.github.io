import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { isMobile } from "react-device-detect";
import { useDialog } from "../../hooks/useDialog";
import { ArrowIcon, CloseIcon, ExternalIcon } from "../shared/Icons";
import { ProjectMedia } from "./ProjectMedia";
import { categoryName, linkLabel, pad } from "./VaultSlot";

const snap = [0.7, 0, 0.2, 1];
const SWIPE = 80;

// Full-file view of a vault entry: the inspector on phones and tablets, and
// the "expand file" view on desktop. A paper sheet on a signal-blue field;
// the abstract is a blue block overlapping the bottom of the image. Arrow
// keys, the buttons or a sideways swipe on the image step through whatever
// the current filter shows.
export function ProjectDossier({ projects, index, onClose, onStep }) {
  const project = index >= 0 ? projects[index] : null;
  const open = Boolean(project);
  const dialogRef = useDialog(open, onClose);
  const canStep = projects.length > 1;

  useEffect(() => {
    if (!open || !canStep) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "ArrowRight") onStep(1);
      if (event.key === "ArrowLeft") onStep(-1);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, canStep, onStep]);

  const live = project?.live;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="dossier"
          className="dossier-scrim surface-signal"
          initial={{ clipPath: "inset(100% 0% 0% 0%)" }}
          animate={{ clipPath: "inset(0% 0% 0% 0%)" }}
          exit={{ clipPath: "inset(0% 0% 100% 0%)" }}
          transition={{ duration: 0.36, ease: snap }}
          onClick={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
        >
          <motion.div
            ref={dialogRef}
            className="dossier surface-paper"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dossier-title"
            data-category={project.categories[0]}
            initial={{ y: 48 }}
            animate={{ y: 0 }}
            exit={{ y: 24 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <header className="dossier-bar surface-ink u-micro">
              <span className="dossier-file">
                File {pad(index + 1)}/{pad(projects.length)} · {categoryName(project.categories[0])}
              </span>
              <div className="dossier-nav">
                {canStep && (
                  <>
                    <button type="button" onClick={() => onStep(-1)} aria-label="Previous file">
                      <ArrowIcon direction="left" />
                    </button>
                    <button type="button" onClick={() => onStep(1)} aria-label="Next file">
                      <ArrowIcon />
                    </button>
                  </>
                )}
                <button type="button" onClick={onClose} aria-label="Close file" data-autofocus>
                  <CloseIcon />
                </button>
              </div>
            </header>

            <motion.div
              key={project.id}
              className="dossier-scroll"
              initial={{ clipPath: "inset(0% 0% 0% 100%)" }}
              animate={{ clipPath: "inset(0% 0% 0% 0%)" }}
              transition={{ duration: 0.3, ease: snap }}
            >
              <figure className={`dossier-media${project.schematic ? " has-schematic" : ""}`}>
                <motion.div
                  className={`dossier-plate${project.fit === "contain" ? " is-contain" : ""}`}
                  drag={canStep ? "x" : false}
                  dragSnapToOrigin
                  dragElastic={0.5}
                  onDragEnd={(_, info) => {
                    if (info.offset.x < -SWIPE) onStep(1);
                    else if (info.offset.x > SWIPE) onStep(-1);
                  }}
                >
                  <ProjectMedia project={project} draggable="false" />
                </motion.div>
                <figcaption className="dossier-abstract surface-signal">
                  <span className="dossier-abstract-key u-micro">Abstract</span>
                  <p>{project.description}</p>
                </figcaption>
              </figure>

              <div className="dossier-data">
                <p className="u-micro">{project.category}</p>
                <h3 id="dossier-title" className="dossier-title">
                  {project.name}
                </h3>

                <dl className="dossier-readout">
                  <div>
                    <dt>Categories</dt>
                    <dd>{project.categories.map(categoryName).join(" / ")}</dd>
                  </div>
                  {live?.language && (
                    <div>
                      <dt>Language</dt>
                      <dd>{live.language}</dd>
                    </div>
                  )}
                  {live?.pushedAt && (
                    <div>
                      <dt>Last push</dt>
                      <dd>{live.pushedAt.slice(0, 10)}</dd>
                    </div>
                  )}
                  {live && (
                    <div>
                      <dt>Stars</dt>
                      <dd>{live.stars}</dd>
                    </div>
                  )}
                </dl>

                <ul className="chip-list" aria-label="Stack">
                  {project.tags.map((tag) => (
                    <li key={tag} className="chip">
                      {tag}
                    </li>
                  ))}
                </ul>

                {project.url && (
                  <a className="btn btn--signal u-press" href={project.url} target="_blank" rel="noopener noreferrer">
                    {linkLabel(project.url)}
                    <span className="sr-only"> (opens in a new tab)</span>
                    <ExternalIcon className="btn-glyph" />
                  </a>
                )}
                {canStep && (
                  <p className="dossier-hint u-micro" aria-hidden="true">
                    {isMobile ? "Swipe the image to step through files" : "← → keys or swipe the image to step through files"}
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
