import { AnimatePresence, motion } from "framer-motion";
import { categories } from "../projectdata";
import { Crosshair, NeuralPathways, Sparkline, TopoMesh } from "./CategoryViz";

const pad = (n) => String(n).padStart(2, "0");

// The research plate's market-data ticker. Every entry is lifted from the
// real project and experience copy, just formatted like market data.
const TICKS = [
  { sym: "DISS", val: "89/100", dir: "up", note: "final grade" },
  { sym: "HCI", val: "2026", dir: "up", note: "accepted for publication" },
  { sym: "VLM", val: "98%", dir: "up", note: "fault detection, 25 classes" },
  { sym: "VRAM", val: "<4GB", dir: "down", note: "fully local pipeline" },
  { sym: "STUDY", val: "N=12", dir: "flat", note: "latency × trust" },
  { sym: "EPSRC", val: "FUNDED", dir: "up", note: "continuation funding" },
  { sym: "ASR", val: "LLM", dir: "flat", note: "voice to action" },
  { sym: "LOCAL", val: "WOL", dir: "flat", note: "LocalMind wakes on request" },
];

const ARROW = { up: "▲", down: "▼", flat: "■" };

function Ticker() {
  const run = [...TICKS, ...TICKS];
  return (
    <div className="ticker" aria-hidden="true">
      <div className="ticker-track">
        {run.map((tick, i) => (
          <span key={i} className={`tick tick--${tick.dir}`}>
            <b>{tick.sym}</b>
            <span className="tick-val">
              {ARROW[tick.dir]} {tick.val}
            </span>
            <span className="tick-note">{tick.note}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function IndexBars({ counts }) {
  return (
    <div className="viz-index">
      {categories.map((category) => (
        <div key={category.id} className="viz-index-row">
          <span className="viz-index-name">{category.name}</span>
          <span className="viz-index-bar">
            <i style={{ width: `${(counts[category.id] / counts.all) * 100}%` }} />
          </span>
          <span className="viz-index-count">{pad(counts[category.id])}</span>
        </div>
      ))}
    </div>
  );
}

function Viz({ id, counts }) {
  switch (id) {
    case "research":
      return <Sparkline className="viz-spark" />;
    case "robotics":
      return (
        <div className="viz-hazard">
          <span className="viz-stencil">TELEOP</span>
          <span className="viz-stencil-sub">Heavy hardware · handle with care</span>
        </div>
      );
    case "performance":
      return (
        <div className="viz-topo">
          <TopoMesh className="viz-topo-mesh" />
          <Crosshair className="viz-topo-cross" />
        </div>
      );
    case "ml":
      return <NeuralPathways className="viz-net" />;
    default:
      return <IndexBars counts={counts} />;
  }
}

// A signal-blue plate under the grid naming the current category, with line
// art in paper: a sparkline and ticker for research, a hazard stencil for
// robotics, contours for performance, a network for ML, index bars for all.
export function CategoryBanner({ category, counts }) {
  const all = category.id === "all";
  return (
    <div className="vbanner-slot">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={category.id}
          className="vbanner surface-signal"
          data-category={category.id}
          initial={{ clipPath: "inset(0% 100% 0% 0%)" }}
          animate={{ clipPath: "inset(0% 0% 0% 0%)", transitionEnd: { clipPath: "none" } }}
          exit={{ clipPath: "inset(0% 0% 0% 100%)", transition: { duration: 0.14 } }}
          transition={{ duration: 0.42, ease: [0.7, 0, 0.2, 1] }}
        >
          <div className="vbanner-copy">
            <p className="vbanner-kicker">
              {all ? "Vault index · unfiltered" : `${category.label} · ${pad(counts[category.id])} files`}
            </p>
            <p className="vbanner-name">{category.name}</p>
            <p className="vbanner-blurb">{category.blurb}</p>
          </div>
          <div className="vbanner-viz" aria-hidden="true">
            <Viz id={category.id} counts={counts} />
          </div>
          {category.id === "research" && <Ticker />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
