import { useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

const FOCUSABLE =
  'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Expanded view of a carousel project. The card clamps the title to two lines
 * and the description to four; here everything runs at full length.
 */
export function ProjectModal({ project, onClose }) {
  const panelRef = useRef(null);
  const closeRef = useRef(null);

  const onBackdropClick = useCallback(
    (event) => {
      // Only a click on the backdrop itself closes — not one that bubbled up
      // from inside the panel.
      if (event.target === event.currentTarget) onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (!project) return undefined;

    const previouslyFocused = document.activeElement;
    closeRef.current?.focus();

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;

      const focusable = Array.from(
        panelRef.current.querySelectorAll(FOCUSABLE)
      ).filter((el) => el.offsetParent !== null);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);

    // Locking scroll removes the scrollbar, which would otherwise widen the
    // page and shift everything sideways as the modal opens.
    const { overflow, paddingRight } = document.body.style;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`;

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = paddingRight;
      previouslyFocused?.focus?.();
    };
  }, [project, onClose]);

  if (!project) return null;

  const titleId = `project-modal-${project.id}`;

  return createPortal(
    <div className="modal-backdrop" onClick={onBackdropClick}>
      <div
        className="project-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={panelRef}
      >
        <button
          type="button"
          className="project-modal-close"
          onClick={onClose}
          aria-label="Close"
          ref={closeRef}
        >
          <span aria-hidden="true">×</span>
        </button>

        <div
          className="project-modal-media"
          style={{
            backgroundImage: project.image
              ? `url(${project.image}), ${project.accent}`
              : project.accent,
          }}
        />

        <div className="project-modal-body">
          <span className="project-card-eyebrow">{project.category}</span>
          <h3 id={titleId}>{project.name}</h3>
          <p>{project.description}</p>

          {(project.tags || []).length > 0 && (
            <div className="project-card-meta">
              {project.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          )}

          {project.url && (
            <div className="slide-links">
              <a
                className="detail-link"
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {project.url.includes("github.com") ? "GitHub" : "Visit"}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
