// Vector graphics for the four project categories, generated once at module load.
// Everything here is decorative and rendered aria-hidden by its callers.

/* ---------- Performance: topographic contours ----------
   Iso-lines of a few summed gaussian peaks, traced with marching squares so
   the contours nest properly instead of crossing each other. */

function traceContours(width, height, cols, rows, field, levels) {
  const dx = width / cols;
  const dy = height / rows;
  const grid = [];
  for (let j = 0; j <= rows; j += 1) {
    grid.push([]);
    for (let i = 0; i <= cols; i += 1) grid[j].push(field(i * dx, j * dy));
  }

  const f = (n) => n.toFixed(1);
  let d = "";
  const seg = (p, q) => {
    d += `M${f(p[0])} ${f(p[1])}L${f(q[0])} ${f(q[1])}`;
  };

  levels.forEach((level) => {
    const t = (p, q) => (level - p) / (q - p);
    for (let j = 0; j < rows; j += 1) {
      for (let i = 0; i < cols; i += 1) {
        const a = grid[j][i]; // top-left
        const b = grid[j][i + 1]; // top-right
        const c = grid[j + 1][i + 1]; // bottom-right
        const e = grid[j + 1][i]; // bottom-left
        const idx = (a > level ? 8 : 0) | (b > level ? 4 : 0) | (c > level ? 2 : 0) | (e > level ? 1 : 0);
        if (idx === 0 || idx === 15) continue;

        const x = i * dx;
        const y = j * dy;
        const top = () => [x + dx * t(a, b), y];
        const right = () => [x + dx, y + dy * t(b, c)];
        const bottom = () => [x + dx * t(e, c), y + dy];
        const left = () => [x, y + dy * t(a, e)];

        switch (idx) {
          case 1:
          case 14:
            seg(left(), bottom());
            break;
          case 2:
          case 13:
            seg(bottom(), right());
            break;
          case 3:
          case 12:
            seg(left(), right());
            break;
          case 4:
          case 11:
            seg(top(), right());
            break;
          case 5:
            seg(top(), right());
            seg(left(), bottom());
            break;
          case 6:
          case 9:
            seg(top(), bottom());
            break;
          case 7:
          case 8:
            seg(left(), top());
            break;
          case 10:
            seg(left(), top());
            seg(bottom(), right());
            break;
          default:
            break;
        }
      }
    }
  });
  return d;
}

const TOPO_W = 480;
const TOPO_H = 200;
const peak = (x, y, cx, cy, amp, sx, sy) =>
  amp * Math.exp(-(((x - cx) ** 2) / (2 * sx * sx) + ((y - cy) ** 2) / (2 * sy * sy)));

export const TOPO_PATH = traceContours(TOPO_W, TOPO_H, 96, 40, (x, y) =>
  peak(x, y, 120, 84, 1, 70, 52) +
  peak(x, y, 330, 128, 0.85, 62, 40) +
  peak(x, y, 250, 22, 0.55, 90, 36) +
  0.04 * Math.sin(x / 23) * Math.cos(y / 17),
  [0.08, 0.16, 0.24, 0.32, 0.42, 0.52, 0.62, 0.72, 0.82, 0.92]
);

export function TopoMesh({ className }) {
  return (
    <svg className={className} viewBox={`0 0 ${TOPO_W} ${TOPO_H}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <path d={TOPO_PATH} fill="none" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function Crosshair({ className }) {
  return (
    <svg className={className} viewBox="0 0 100 100" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke">
        <circle cx="50" cy="50" r="20" />
        <circle cx="50" cy="50" r="34" strokeDasharray="2 5" />
        <path d="M50 8v22M50 70v22M8 50h22M70 50h22" />
      </g>
      <circle cx="50" cy="50" r="2.5" fill="currentColor" />
    </svg>
  );
}

/* ---------- ML: neural pathways ---------- */

const NET_W = 480;
const NET_H = 200;
const LAYERS = [4, 6, 6, 3];

function buildNet() {
  const gapX = (NET_W - 80) / (LAYERS.length - 1);
  const nodes = LAYERS.flatMap((count, layer) =>
    Array.from({ length: count }, (_, k) => ({
      id: `${layer}-${k}`,
      layer,
      x: 40 + layer * gapX,
      y: NET_H / 2 + (k - (count - 1) / 2) * (NET_H / (count + 1.2)),
    }))
  );
  const edges = [];
  nodes.forEach((a) => {
    nodes
      .filter((b) => b.layer === a.layer + 1)
      .forEach((b) => edges.push({ id: `${a.id}>${b.id}`, a, b }));
  });
  return { nodes, edges };
}

const NET = buildNet();

export function NeuralPathways({ className }) {
  return (
    <svg className={className} viewBox={`0 0 ${NET_W} ${NET_H}`} preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <g className="net-edges">
        {NET.edges.map(({ id, a, b }) => (
          <line key={id} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
        ))}
      </g>
      <g className="net-pulses">
        {NET.edges
          .filter((_, i) => i % 5 === 0)
          .map(({ id, a, b }, i) => (
            <line
              key={id}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              pathLength="100"
              style={{ animationDelay: `${(i * 0.37) % 2.6}s` }}
            />
          ))}
      </g>
      <g className="net-nodes">
        {NET.nodes.map((node) => (
          <circle key={node.id} cx={node.x} cy={node.y} r={node.layer === 0 || node.layer === LAYERS.length - 1 ? 5 : 4} />
        ))}
      </g>
    </svg>
  );
}

/* ---------- Research: sparkline ---------- */

// A clean readout line over a fine grid, for the executive summary look.
export function Sparkline({ className }) {
  const points = [12, 18, 15, 24, 22, 31, 28, 36, 34, 41, 47, 44, 52, 58, 55, 63, 70, 68, 76, 82]
    .map((v, i, all) => `${(i / (all.length - 1)) * 480},${190 - v * 2.1}`)
    .join(" ");
  return (
    <svg className={className} viewBox="0 0 480 200" preserveAspectRatio="none" aria-hidden="true">
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
