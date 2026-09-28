import { useRef } from "react";
import {
  motion,
  useAnimationFrame,
  useInView,
  useMotionValue,
  useReducedMotionConfig,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from "framer-motion";

// Keeps v inside [min, max) so the track can loop forever.
const wrap = (min, max, v) => {
  const range = max - min;
  return ((((v - min) % range) + range) % range) + min;
};

// A band of type that drifts sideways and reacts to the page: scrolling
// speeds it up, scrolling back up reverses it. The track holds two identical
// runs and loops between -50% and 0, so the seam never shows. Decorative
// only (aria-hidden); it idles while off screen and sits still with reduced
// motion or FX off.
export function Marquee({ items, repeat = 3, speed = 1.2, variant = "mega", className = "" }) {
  const ref = useRef(null);
  const inView = useInView(ref);
  const reduce = useReducedMotionConfig();
  const base = useMotionValue(0);
  const direction = useRef(1);

  const { scrollY } = useScroll();
  const velocity = useSpring(useVelocity(scrollY), { damping: 50, stiffness: 400 });
  const boost = useTransform(velocity, [-2000, 0, 2000], [-5, 0, 5], { clamp: false });
  const x = useTransform(base, (v) => `${wrap(-50, 0, v)}%`);

  useAnimationFrame((_, delta) => {
    if (reduce || !inView) return;
    const b = boost.get();
    if (b < 0) direction.current = -1;
    else if (b > 0) direction.current = 1;
    base.set(base.get() - direction.current * speed * (delta / 1000) * (1 + Math.abs(b)));
  });

  const run = Array.from({ length: repeat }, () => items).flat();

  return (
    <div ref={ref} className={`marquee marquee--${variant}${className ? ` ${className}` : ""}`} aria-hidden="true">
      <motion.div className="marquee-track" style={{ x }}>
        {[0, 1].map((copy) => (
          <span key={copy} className="marquee-run">
            {run.map((item, i) => (
              <span key={i} className="marquee-item">
                {item}
                <span className="marquee-sep" />
              </span>
            ))}
          </span>
        ))}
      </motion.div>
    </div>
  );
}
