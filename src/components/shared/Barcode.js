import { useMemo } from "react";

// A decorative barcode generated from a string: each character's bits set
// the widths of four bars and the gaps between them. Deterministic, so the
// same value always prints the same code. Pure vector, no asset. `vertical`
// stacks the bars top to bottom for narrow rails.
export function Barcode({ value, className, depth = 40, vertical = false }) {
  const { bars, length } = useMemo(() => {
    const out = [];
    let at = 0;
    [...value].forEach((ch) => {
      const code = ch.charCodeAt(0);
      for (let bit = 0; bit < 4; bit += 1) {
        const size = ((code >> bit) & 1) + 1;
        out.push({ at, size });
        at += size + (((code >> (bit + 2)) & 1) + 1);
      }
      at += 2;
    });
    return { bars: out, length: at };
  }, [value]);

  return (
    <svg
      className={className}
      viewBox={vertical ? `0 0 ${depth} ${length}` : `0 0 ${length} ${depth}`}
      preserveAspectRatio="none"
      shapeRendering="crispEdges"
      aria-hidden="true"
      focusable="false"
    >
      {bars.map((bar) =>
        vertical ? (
          <rect key={bar.at} y={bar.at} height={bar.size} width={depth} fill="currentColor" />
        ) : (
          <rect key={bar.at} x={bar.at} width={bar.size} height={depth} fill="currentColor" />
        )
      )}
    </svg>
  );
}
