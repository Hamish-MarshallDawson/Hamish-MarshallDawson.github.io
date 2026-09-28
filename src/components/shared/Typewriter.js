import { useEffect, useRef } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotionConfig,
  useTransform,
} from "framer-motion";

// Types `text` out once `start` flips true. The character count is a motion
// value, so typing doesn't re-render React. Screen readers get the full string
// from the sr-only copy; the ghost copy reserves the final size so the layout
// doesn't shift while it types.
export function Typewriter({
  text,
  start = true,
  delay = 0,
  cps = 40,
  block = false,
  caret = false,
  onDone,
  className = "",
}) {
  const reduce = useReducedMotionConfig();
  const count = useMotionValue(0);
  const shown = useTransform(count, (value) => text.slice(0, Math.round(value)));
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    if (!start) {
      count.set(0);
      return undefined;
    }
    if (reduce) {
      count.set(text.length);
      onDoneRef.current?.();
      return undefined;
    }
    const controls = animate(count, text.length, {
      duration: text.length / cps,
      delay,
      ease: "linear",
      onComplete: () => onDoneRef.current?.(),
    });
    return () => controls.stop();
  }, [start, reduce, text, delay, cps, count]);

  return (
    <span className={`tw${block ? " tw--block" : ""}${className ? ` ${className}` : ""}`}>
      <span className="sr-only">{text}</span>
      <span className="tw-ghost" aria-hidden="true">
        {text}
      </span>
      <span className="tw-live" aria-hidden="true">
        {/* With reduced motion the text is simply there. Setting the motion
            value once from the effect isn't enough: it can land before
            framer has subscribed the span to its child value, and the only
            update is lost. */}
        {reduce && start ? <span>{text}</span> : <motion.span>{shown}</motion.span>}
        {caret && <span className="caret" />}
      </span>
    </span>
  );
}
