import { useEffect, useRef } from "react";
import { animate, useMotionValue, useMotionValueEvent, useReducedMotionConfig, useTransform } from "framer-motion";

// Types `text` out once `start` flips true. The character count is a motion
// value, so typing doesn't re-render React. Screen readers get the full string
// from the sr-only copy; the ghost copy reserves the final size so the layout
// doesn't shift while it types. Ghost and live text are CSS generated content
// (data-text), so they stay out of textContent and the page text holds it once.
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
  const liveRef = useRef(null);
  const setLive = (value) => {
    if (liveRef.current) liveRef.current.dataset.text = value;
  };
  useMotionValueEvent(shown, "change", setLive);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    if (!start) {
      count.set(0);
      return undefined;
    }
    if (reduce) {
      setLive(text);
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
      <span className="tw-ghost" aria-hidden="true" data-text={text} />
      <span className="tw-live" aria-hidden="true" ref={liveRef} data-text="">
        {caret && <span className="caret" />}
      </span>
    </span>
  );
}
