import { forwardRef } from "react";
import { motion } from "framer-motion";
import { categories } from "../projectdata";
import { Crosshair, NeuralPathways, TopoMesh } from "./CategoryViz";
import { ProjectMedia } from "./ProjectMedia";

export const pad = (n) => String(n).padStart(2, "0");

export const categoryName = (id) => categories.find((c) => c.id === id)?.name ?? id;

export function linkLabel(url) {
  return url.includes("github.com") ? "Source" : "Visit";
}

// Per-category line art printed over the slot image. The unfiltered view
// gets none.
function SlotOverlay({ category }) {
  if (category === "performance") {
    return (
      <>
        <TopoMesh className="vslot-topo" />
        <Crosshair className="vslot-cross" />
      </>
    );
  }
  if (category === "ml") return <NeuralPathways className="vslot-net" />;
  return null;
}

// One file card in the vault grid: a black-and-white plate that prints in
// signal-blue duotone when hovered or selected, a RAW-style index label
// over its corner and a ruled caption. forwardRef because AnimatePresence's
// popLayout mode measures it.
export const VaultSlot = forwardRef(function VaultSlot(
  { project, fileNo, category, inspector, selected, onSelect },
  ref
) {
  const primary = project.categories[0];
  return (
    <motion.li
      ref={ref}
      layout="position"
      className="vslot-cell"
      initial={{ y: 28, scale: 0.94 }}
      animate={{ y: 0, scale: 1 }}
      exit={{ scale: 0.9, transition: { duration: 0.12 } }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      <button
        type="button"
        className={`vslot${selected ? " is-selected" : ""}`}
        data-category={primary}
        aria-pressed={selected}
        aria-controls={inspector ? "vault-inspector" : undefined}
        aria-label={`${project.name}. ${project.category}.`}
        onClick={onSelect}
      >
        <span className={`vslot-media${project.fit === "contain" ? " is-contain" : ""}`}>
          <ProjectMedia project={project} decorative lazy />
          <SlotOverlay category={category} />
          <span className="vslot-idx">[{pad(fileNo)}]</span>
          <span className="vslot-tag">{categoryName(primary)}</span>
        </span>
        <span className="vslot-caption">
          <span className="vslot-name">{project.name}</span>
          <span className="vslot-cat">{project.category}</span>
        </span>
      </button>
    </motion.li>
  );
});
