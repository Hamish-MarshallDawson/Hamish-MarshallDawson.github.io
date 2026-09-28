import { useState } from "react";
import { motion, useReducedMotionConfig } from "framer-motion";
import { profile } from "../projectdata";
import { NeuralLattice } from "./NeuralLattice";

// The plate wipes down from its top edge. Once it lands the clip is dropped
// entirely, so the hard shadow, the label box and the pill (all of which
// hang outside the border box) print in full.
const CLOSED = "inset(0% 0% 100% 0%)";
const OPEN = "inset(0% 0% 0% 0%)";

// The portrait as a print plate: image_2a10f9 in greyscale, screened onto
// signal blue, in a heavy frame on a hard shadow. A white RAW-style label
// box and an outline pill (name and age) sit over its corners.
export function AICore({ live, shadow }) {
  const reduce = useReducedMotionConfig();
  const [missing, setMissing] = useState(false);

  return (
    <motion.figure
      className="core"
      style={shadow ? { boxShadow: shadow } : undefined}
      initial={reduce ? false : { clipPath: CLOSED }}
      animate={live || reduce ? { clipPath: OPEN, transitionEnd: { clipPath: "none" } } : { clipPath: CLOSED }}
      transition={{ delay: live && !reduce ? 0.3 : 0, duration: 0.85, ease: [0.7, 0, 0.2, 1] }}
    >
      <div className="core-plate u-duotone">
        {missing ? (
          <NeuralLattice className="core-visual" />
        ) : (
          <img
            className="core-visual core-img"
            src={profile.coreImage}
            alt={profile.coreAlt}
            decoding="async"
            style={{ objectPosition: "48% 30%" }}
            onError={() => setMissing(true)}
          />
        )}
      </div>

      <span className="core-pill pill" aria-hidden="true">
        Hamish <span className="core-pill-tag">⊕ {profile.age}</span>
      </span>

      <figcaption className="core-label u-micro" aria-hidden="true">
        <span className="core-index">AI engineer</span>
        <span>
          Quantisation in progress
          <span className="caret" />
        </span>
      </figcaption>

      {missing && process.env.NODE_ENV === "development" && (
        <p className="core-devnote u-micro">Missing /public/optimized/image_2a10f9.jpg — showing the wireframe</p>
      )}
    </motion.figure>
  );
}
