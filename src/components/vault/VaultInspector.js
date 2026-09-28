import { AnimatePresence, motion } from "framer-motion";
import { ExternalIcon } from "../shared/Icons";
import { ProjectMedia } from "./ProjectMedia";
import { categoryName, linkLabel, pad } from "./VaultSlot";

// The inspector beside the vault grid (desktop only; smaller screens open
// the dossier instead). An ink panel set like a magazine spread: a header
// strip, the name in heavy type, a black-and-white plate with a white label
// box over it, the abstract and a ruled stat list. Files swap with a hard
// wipe rather than a fade.
export function VaultInspector({ project, fileNo, total, onExpand }) {
  const primary = project.categories[0];
  const live = project.live;

  return (
    <aside id="vault-inspector" className="vinspect surface-ink" data-category={primary} aria-labelledby="vinspect-title">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={project.id}
          className="vinspect-inner"
          initial={{ clipPath: "inset(0% 100% 0% 0%)" }}
          animate={{ clipPath: "inset(0% 0% 0% 0%)" }}
          exit={{ clipPath: "inset(0% 0% 0% 100%)" }}
          transition={{ duration: 0.24, ease: [0.7, 0, 0.2, 1] }}
        >
          <header className="vinspect-bar u-micro">
            <span>
              Inspect // file {pad(fileNo)}/{pad(total)}
            </span>
            <span className="vinspect-chip">{categoryName(primary)}</span>
          </header>

          <div className="vinspect-body">
            <p className="u-micro">{project.category}</p>
            <h3 id="vinspect-title" className="vinspect-title">
              {project.name}
            </h3>

            <div className={`vinspect-media${project.fit === "contain" ? " is-contain" : ""}`}>
              <ProjectMedia project={project} />
              <span className="vinspect-tag u-micro" aria-hidden="true">
                File {pad(fileNo)}
              </span>
            </div>

            <div className="vinspect-abstract">
              <p className="vinspect-abstract-key u-micro">Abstract</p>
              <p>{project.description}</p>
            </div>

            <dl className="vinspect-stats">
              <div>
                <dt>Stack</dt>
                <dd>{project.tags.join(" · ")}</dd>
              </div>
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
            </dl>

            <div className="vinspect-actions">
              {project.url && (
                <a className="btn btn--signal u-press" href={project.url} target="_blank" rel="noopener noreferrer">
                  {linkLabel(project.url)}
                  <span className="sr-only"> (opens in a new tab)</span>
                  <ExternalIcon className="btn-glyph" />
                </a>
              )}
              <button type="button" className="btn btn--paper u-press" aria-haspopup="dialog" onClick={onExpand}>
                Expand file
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </aside>
  );
}
