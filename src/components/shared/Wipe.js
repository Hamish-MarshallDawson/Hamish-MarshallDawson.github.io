import { useLayoutEffect, useRef } from "react";
import { motion, useInView, useReducedMotionConfig } from "framer-motion";

// Hard-edged reveals: a clip-path inset retracts from one side. No opacity
// is involved, so things arrive as solid plates rather than fading up.
//
// Chrome clips IntersectionObserver geometry by the target's own clip-path,
// so a fully clipped element never counts as "in view". Both helpers below
// therefore watch an element that is *not* clipped (the parent, or a
// wrapper) and drive the clip from that. The clip is dropped once the wipe
// lands so hard shadows and hover lifts outside the box aren't cut off.
const HIDDEN = {
  left: "inset(0% 100% 0% 0%)",
  right: "inset(0% 0% 0% 100%)",
  top: "inset(0% 0% 100% 0%)",
  bottom: "inset(100% 0% 0% 0%)",
};
const SHOWN = "inset(0% 0% 0% 0%)";
const ease = [0.7, 0, 0.2, 1];

// Wipes an element in when its parent scrolls into view. For blocks whose
// own box is the thing being revealed (colour plates, framed panels).
export function Wipe({ as = "div", from = "left", delay = 0, duration = 0.7, amount = 0.25, children, ...rest }) {
  const reduce = useReducedMotionConfig();
  const self = useRef(null);
  const parent = useRef(null);
  useLayoutEffect(() => {
    parent.current = self.current?.parentElement ?? null;
  }, []);
  const inView = useInView(parent, { once: true, amount });
  const Tag = motion[as];

  // framer's reducedMotion only suppresses transforms; clip-path would still
  // animate, so reduced motion skips the reveal entirely.
  if (reduce) return <Tag {...rest}>{children}</Tag>;
  return (
    <Tag
      ref={self}
      initial={{ clipPath: HIDDEN[from] }}
      animate={inView ? { clipPath: SHOWN, transitionEnd: { clipPath: "none" } } : { clipPath: HIDDEN[from] }}
      transition={{ duration, delay, ease }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

// A list item (or any wrapper) whose content wipes down from its top edge
// once the wrapper is on screen.
export function Reveal({ as: Tag = "li", className, delay = 0, children }) {
  const reduce = useReducedMotionConfig();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  return (
    <Tag ref={ref} className={className}>
      <motion.div
        className="reveal"
        initial={reduce ? false : { clipPath: HIDDEN.top }}
        animate={reduce || inView ? { clipPath: SHOWN, transitionEnd: { clipPath: "none" } } : { clipPath: HIDDEN.top }}
        transition={{ duration: 0.75, delay, ease }}
      >
        {children}
      </motion.div>
    </Tag>
  );
}
