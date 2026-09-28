import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotionConfig } from "framer-motion";

const BURST_MS = { breach: 760, nominal: 520 };

// Solid plates from the three-colour palette — never a tint or a fade.
const PLATES = {
  breach: ["var(--signal)", "var(--ink)", "var(--paper)", "var(--signal)", "var(--ink)"],
  nominal: ["var(--ink)", "var(--signal)", "var(--paper)"],
};

function makeBars(to) {
  const colours = PLATES[to];
  const count = to === "breach" ? 7 : 4;
  return Array.from({ length: count }, (_, i) => ({
    top: (i / count) * 100 + Math.random() * (40 / count),
    height: 3 + Math.random() * (to === "breach" ? 11 : 6),
    colour: colours[i % colours.length],
    from: i % 2 ? "101%" : "-101%",
    delay: i * 0.035 + Math.random() * 0.05,
    duration: 0.34 + Math.random() * 0.16,
  }));
}

// Fires when the global mode changes: hard-edged plates sweep across the
// screen as the header inverts for the contact section, fewer on the way
// back out. The colours themselves flip instantly underneath; this is the
// punctuation. Skipped with reduced motion / FX off.
export function GlitchTransition({ mode }) {
  const reduce = useReducedMotionConfig();
  const previous = useRef(mode);
  const [burst, setBurst] = useState(null);

  useEffect(() => {
    if (previous.current === mode) return undefined;
    previous.current = mode;
    if (reduce) {
      setBurst(null);
      return undefined;
    }
    setBurst({ id: Date.now(), to: mode });
    const timer = setTimeout(() => setBurst(null), BURST_MS[mode]);
    return () => clearTimeout(timer);
  }, [mode, reduce]);

  const bars = useMemo(() => (burst ? makeBars(burst.to) : []), [burst]);
  if (!burst) return null;

  return (
    <div key={burst.id} className="wipe-burst" aria-hidden="true">
      {bars.map((bar, i) => (
        <motion.span
          key={i}
          className="wipe-bar"
          style={{ top: `${bar.top}%`, height: `${bar.height}vh`, background: bar.colour }}
          initial={{ x: bar.from }}
          animate={{ x: bar.from === "101%" ? "-101%" : "101%" }}
          transition={{ duration: bar.duration, delay: bar.delay, ease: [0.7, 0, 0.2, 1] }}
        />
      ))}
    </div>
  );
}
