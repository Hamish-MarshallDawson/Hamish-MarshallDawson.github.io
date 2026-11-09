import "./PoseidonDemo.css";
import { WindowScene, ReviewScene, LabScene } from "./PoseidonPanels";

// Poseidon as seven self-animating scenes in the product's own Dark theme: its tokens, map chrome,
// ship sprites, gap label and scrub bar, copied from the shipped frontend. The maps are real
// captures of the product's map: Europe as it was, and the Baltic with the map's own ship layers
// and its region, country and Kaliningrad labels switched off, as those would sit under the demo's
// panels (its heat map is real traffic, nothing is retouched).
// Every ship drawn on top is synthetic and no real identity appears. Like the other
// demos, each scene animates itself in CSS with no JS timers: `.is-paused` holds the animations
// and `.is-still` (reduced motion) shows each end state. The top-right corner stays clear for the
// player's close button.
export const scenes = [
  { id: "live", caption: "Live AIS from around the world, merged into one map", ms: 4500 },
  { id: "quiet", caption: "A moving ship falls silent while ships around it keep reporting", ms: 7000 },
  { id: "window", caption: "Click a ship for its identity, track, gaps and risk", ms: 5500 },
  { id: "estimate", caption: "Where it could be now: 80% and 95% circles, not one point", ms: 6000 },
  { id: "review", caption: "An order with reasons, never a percentage", ms: 6000 },
  { id: "replay", caption: "Scrub back through history at up to 300× speed", ms: 7500 },
  { id: "lab", caption: "A fixed rule on a frozen test judges each new model", ms: 6000 },
];

const asset = (name) => `${process.env.PUBLIC_URL}/featured/poseidon/${name}`;
const at = (ms) => ({ "--d": `${ms}ms` });

const OSM = "© OpenStreetMap contributors";
const AIS = "AIS: AISStream, Fintraffic / digitraffic.fi";
const DMA = "Route model trained on Danish Maritime Authority AIS";

// The product's mid-zoom sprites (map/sprites/ship-*-mid.svg), bow up, 12 x 32.
const HULLS = {
  cargo: "M6 0.25C8 2.5 11 6.5 11 11V30C11 31 10.5 31.5 9.5 31.5H2.5C1.5 31.5 1 31 1 30V11C1 6.5 4 2.5 6 0.25ZM2 10H10V11.2H2V10ZM2 15H10V16.2H2V15ZM2 20H10V21.2H2V20ZM2 25H10V26.2H2V25Z",
  tanker: "M6 0.5C8.75 2 10.5 5 10.5 9V30C10.5 31 10 31.5 9 31.5H3C2 31.5 1.5 31 1.5 30V9C1.5 5 3.25 2 6 0.5ZM5.4 6H6.6V23H5.4V6ZM2.5 24.5H9.5V25.7H2.5V24.5Z",
  passenger: "M6 0.25C9.5 1.25 11.5 4.5 11.5 9.5V28.5C11.5 30.5 10.5 31.5 8.5 31.5H3.5C1.5 31.5 0.5 30.5 0.5 28.5V9.5C0.5 4.5 2.5 1.25 6 0.25ZM6 3C8.25 3.75 9.25 5.75 9.25 9.5V27.5C9.25 28.5 8.75 29 7.75 29H4.25C3.25 29 2.75 28.5 2.75 27.5V9.5C2.75 5.75 3.75 3.75 6 3ZM6 4.3C7.5 4.9 8 6.5 8 9.5V26.8C8 27.4667 7.66667 27.8 7 27.8H5C4.33333 27.8 4 27.4667 4 26.8V9.5C4 6.5 4.5 4.9 6 4.3Z",
  fishing: "M6 6C8.25 7.5 10 10.5 10 14.5V24.5C10 25.5 9.5 26 8.5 26H3.5C2.5 26 2 25.5 2 24.5V14.5C2 10.5 3.75 7.5 6 6ZM3.5 17.5H8.5V24.5H3.5V17.5ZM2 15.5V17.5L0.7 23L0 22.5L2 15.5ZM10 15.5V17.5L11.3 23L12 22.5L10 15.5Z",
  other: "M3 1.5C3 0.666667 3.5 0.25 4.5 0.25H7.5C8.5 0.25 9 0.666667 9 1.5V31.5H3V1.5ZM4 3H8V26H4V3Z",
};

function Hull({ kind = "cargo", tone = "", r = 0, s = 1, className = "", style }) {
  return (
    <svg className={`pd-hull ${tone} ${className}`} viewBox="0 0 12 32" style={{ "--r": `${r}deg`, "--s": s, ...style }}>
      <path d={HULLS[kind]} fillRule="evenodd" clipRule="evenodd" />
    </svg>
  );
}

// A ship at a point on the map. With `sail`, it arrives at that point along its heading.
function Ship({ x, y, r = 0, kind, tone, s, sail, run, delay = 0, children }) {
  const rad = (r * Math.PI) / 180;
  const motion = sail
    ? { "--dx": `calc(${(-Math.sin(rad) * sail).toFixed(1)} * var(--u))`, "--dy": `calc(${(Math.cos(rad) * sail).toFixed(1)} * var(--u))`, "--run": `${run}ms`, "--d": `${delay}ms` }
    : null;
  return (
    <span className={`pd-ship${sail ? " is-sailing" : ""}`} style={{ left: `${x}%`, top: `${y}%`, ...motion }}>
      {kind && <Hull kind={kind} tone={tone} r={r} s={s} />}
      {children}
    </span>
  );
}

// Stacked text where one line shows at a time. [text, from, until]; the last has no `until` and stays.
function Frames({ items, className = "" }) {
  return (
    <span className={`pd-frames ${className}`}>
      {items.map(([text, from, until]) =>
        until ? (
          <span key={text} className="pd-frame" style={{ "--d": `${from}ms`, "--len": `${until - from}ms` }}>
            {text}
          </span>
        ) : (
          <span key={text} className="pd-snap" style={at(from)}>
            {text}
          </span>
        ),
      )}
    </span>
  );
}

function Cross({ className = "", style }) {
  return (
    <svg className={`pd-cross ${className}`} viewBox="0 0 11 11" style={style}>
      <path d="M2 2l7 7M9 2l-7 7" />
    </svg>
  );
}

function Brackets({ className = "", style }) {
  return (
    <span className={`pd-brackets ${className}`} style={style}>
      <i />
      <i />
      <i />
      <i />
    </span>
  );
}

function GapLabel({ head, children, className = "", style }) {
  return (
    <div className={`pd-gap-label ${className}`} style={style}>
      <b>{head}</b>
      {children}
    </div>
  );
}

// ---- Positions on the Baltic backdrop, in % of the map. pos-panels' leader lines use SYN.
const SYN = { x: 61, y: 41, r: 207 };
const EST = { x: 56, y: 54 };
const TRACK_START = { x: 73, y: 22 };

const NEIGHBOURS = [
  { x: 58, y: 24, r: 192, kind: "cargo" },
  { x: 70, y: 31, r: 205, kind: "tanker" },
  { x: 69, y: 53, r: 342, kind: "cargo" },
  { x: 49, y: 50, r: 76, kind: "fishing", tone: "is-b" },
  { x: 66, y: 66, r: 28, kind: "tanker", tone: "is-b" },
];

function Neighbours({ run }) {
  return NEIGHBOURS.map((n) => <Ship key={n.x} {...n} sail={run ? 46 : undefined} run={run} />);
}

function Overlay({ children, className = "", style }) {
  return (
    <svg className={`pd-overlay ${className}`} viewBox="0 0 100 100" preserveAspectRatio="none" style={style}>
      {children}
    </svg>
  );
}

// ---- Scenes. `World` is drawn on the map, `Hud` above the chrome.

function LiveWorld() {
  const lanes = [
    { x: 28, y: 42, r: 58, kind: "cargo" },
    { x: 18, y: 28, r: 20, kind: "tanker" },
    { x: 38, y: 33, r: 118, kind: "passenger", tone: "is-b" },
    { x: 80, y: 44, r: 250, kind: "cargo" },
    { x: 84, y: 36, r: 30, kind: "other", tone: "is-b" },
    { x: 12, y: 48, r: 140, kind: "tanker" },
  ];
  return lanes.map((l) => <Ship key={l.x} {...l} s={0.7} sail={40} run={4500} />);
}

function LiveHud() {
  return <img className="pd-logo pd-in" style={at(500)} src={asset("wordmark.png")} alt="" width="755" height="106" />;
}

const SILENCE_AT = 1500;
const CANDIDATE_AT = 4300;

function QuietWorld() {
  return (
    <>
      <Neighbours run={7000} />
      <Ship {...SYN} sail={60} run={SILENCE_AT}>
        <Hull kind="cargo" r={SYN.r} className="pd-was" style={at(CANDIDATE_AT)} />
        <Hull kind="cargo" r={SYN.r} tone="is-dark" className="pd-in" style={at(CANDIDATE_AT)} />
        <Cross className="pd-in" style={at(CANDIDATE_AT)} />
        <span className="pd-heard pd-in" style={at(CANDIDATE_AT)}>
          SYN 4821 · last heard 31 min ago
        </span>
      </Ship>
    </>
  );
}

function QuietHud() {
  return (
    <>
      <div className="pd-panel pd-clock pd-in" style={at(SILENCE_AT + 200)}>
        <p className="pd-section-label">SYN 4821 · no AIS</p>
        <Frames
          className="pd-clock-t"
          items={[
            ["00:00:04", 0, 2300],
            ["00:12:40", 2300, 2900],
            ["00:22:18", 2900, 3500],
            ["00:29:57", 3500, 4300],
            ["00:31:04", 4300],
          ]}
        />
        <p className="pd-clock-c">since last AIS 11:37Z</p>
        <div className="pd-meter">
          <i className="pd-meter-fill" style={at(SILENCE_AT + 300)} />
          <i className="pd-meter-mark" />
        </div>
        <p className="pd-clock-c">Class A, moving: at least 30 min or 20× its usual interval, whichever is longer</p>
      </div>
      <GapLabel head="No AIS for 31 min" className="pd-quiet-label pd-in" style={at(CANDIDATE_AT + 250)}>
        <span>reception normal nearby (5 ships heard within 20 km)</span>
        <span className="pd-flag">
          <code>deliberate_candidate</code> looks deliberate, a candidate only
        </span>
        <span>A flag is a prompt to review, not an accusation.</span>
      </GapLabel>
    </>
  );
}

function PastTrack({ className = "", style }) {
  return (
    <Overlay className={className} style={style}>
      <line className="pd-past" x1={TRACK_START.x} y1={TRACK_START.y} x2={SYN.x} y2={SYN.y} />
    </Overlay>
  );
}

function TrafficWorld({ selected = false }) {
  return (
    <>
      <Neighbours />
      {selected && <PastTrack />}
      <Ship {...SYN} kind="cargo" tone="is-dark">
        <Cross />
        {selected && <Brackets />}
      </Ship>
    </>
  );
}

function EstimateWorld() {
  return (
    <>
      <Neighbours />
      <PastTrack />
      <span className="pd-rings" style={{ left: `${EST.x}%`, top: `${EST.y}%` }}>
        <svg className="pd-ring is-95 pd-grow" viewBox="0 0 200 200" style={at(900)}>
          <circle cx="100" cy="100" r="99" />
        </svg>
        <svg className="pd-ring is-80 pd-grow" viewBox="0 0 200 200" style={at(600)}>
          <circle cx="100" cy="100" r="99" />
        </svg>
        <span className="pd-ring-t is-80 pd-in" style={at(2000)}>
          80% circle
        </span>
        <span className="pd-ring-t is-95 pd-in" style={at(2200)}>
          95% circle
        </span>
      </span>
      <Overlay className="pd-wipe" style={at(300)}>
        <line className="pd-course" x1={SYN.x} y1={SYN.y} x2={EST.x} y2={EST.y} />
      </Overlay>
      <Ship {...SYN} kind="cargo" tone="is-dark">
        <Cross />
        <Brackets />
      </Ship>
    </>
  );
}

function EstimateHud() {
  return (
    <>
      <GapLabel head="Estimated position now · 80% circle 55 km, 95% circle 91 km" className="pd-est-label pd-in" style={at(2500)}>
        <span>6 h 00 min since last heard · route-dma90-v2 · not a sighting</span>
      </GapLabel>
      <div className="pd-panel pd-skill pd-in" style={at(3200)}>
        <p className="pd-section-label">Skill vs dead reckoning, our feed</p>
        <ul>
          <li>
            <span>1 h</span>
            <b>0.141</b>
          </li>
          <li>
            <span>3 h</span>
            <b>0.400</b>
          </li>
          <li>
            <span>6 h</span>
            <b>0.515</b>
          </li>
        </ul>
      </div>
    </>
  );
}

// Replay: the playhead is dragged back, then plays forward over the ship's last hours at 300×, and
// stops the moment it goes quiet, at the 11:37Z the other scenes give as its last AIS.
const SCRUB_END = 1700;
const REPLAY_END = 6200;

const CLOCK = [
  ["13:25:22Z", 0, 500],
  ["10:43:06Z", 500, 1000],
  ["08:08:20Z", 1000, 3000],
  ["09:16:40Z", 3000, 4200],
  ["10:32:02Z", 4200, 5300],
  ["11:37:22Z", 5300],
];
const BEHIND = [
  ["−0 min", 0, 500],
  ["−2 h 42", 500, 1000],
  ["−5 h 17", 1000, 3000],
  ["−4 h 09", 3000, 4200],
  ["−2 h 53", 4200, 5300],
  ["−1 h 48", 5300],
];

function ReplayWorld() {
  const sail = 160;
  return (
    <>
      <Neighbours run={REPLAY_END} />
      <Overlay className="pd-wipe" style={at(SCRUB_END)}>
        <line className="pd-past" x1={TRACK_START.x} y1={TRACK_START.y} x2={SYN.x} y2={SYN.y} />
      </Overlay>
      <Ship {...SYN} sail={sail} run={REPLAY_END - SCRUB_END} delay={SCRUB_END}>
        <Hull kind="cargo" r={SYN.r} className="pd-was" style={at(REPLAY_END)} />
        <Hull kind="cargo" r={SYN.r} tone="is-dark" className="pd-in" style={at(REPLAY_END)} />
      </Ship>
    </>
  );
}

function ReplayHud() {
  return (
    <>
      <div className="pd-edge pd-in" style={at(0)} />
      <div className="pd-tab pd-drop" style={at(0)}>
        <b>REPLAY</b> showing Mon 9 Nov <Frames items={CLOCK} /> · not live
      </div>
    </>
  );
}

// ---- Chrome, on every map scene.

function Status({ replay }) {
  return (
    <div className="pd-status pd-panel">
      {replay ? (
        <>
          <span className="pd-replay">REPLAY</span>
          <span>
            · Mon <Frames items={CLOCK} /> · 32,558 ships
          </span>
        </>
      ) : (
        <>
          <i className="pd-dot" />
          <span className="pd-mode">LIVE</span>
          <span>· 32,558 ships</span>
        </>
      )}
    </div>
  );
}

function Toolbar({ count, replay }) {
  return (
    <div className={`pd-tools${replay ? " is-replay" : ""}`}>
      <span className="pd-tool">
        <i className="pd-box" />
        Review<small>{count}</small>
      </span>
      <span className="pd-tool">
        <i className="pd-sq" />
        Model Lab
      </span>
      <span className="pd-tool">
        <i className="pd-sq" />
        Display
      </span>
    </div>
  );
}

const PlayIcon = () => (
  <svg viewBox="0 0 12 12">
    <path d="M2 1l9 5-9 5z" />
  </svg>
);
const PauseIcon = () => (
  <svg viewBox="0 0 12 12">
    <path d="M2 1h3v10H2zM7 1h3v10H7z" />
  </svg>
);

const TICKS = Array.from({ length: 25 }, (_, i) => i);
const COUNTS = [
  [15, "12"],
  [38, "10"],
  [57, "11"],
  [73, "12"],
  [94, "10"],
];
const SPEEDS = ["1×", "10×", "60×", "300×"];

function Bar({ replay = false, quiet = false, time, open }) {
  return (
    <div className={`pd-bar${replay ? " is-replay" : ""}`}>
      <span className="pd-bar-btn pd-play">{replay ? <PlayIcon /> : <PauseIcon />}</span>
      <span className="pd-readout">
        {replay ? <Frames className="pd-time" items={CLOCK} /> : <span className="pd-time">{time}</span>}
        {replay && <Frames className="pd-behind" items={BEHIND} />}
      </span>
      <div className="pd-track">
        {TICKS.map((i) => (
          <i key={i} className={`pd-tick${i % 4 === 0 ? " is-major" : ""}`} style={{ left: `${(i / 24) * 100}%` }} />
        ))}
        <i className="pd-line" />
        <i className="pd-span" style={{ left: "27%", width: "11%" }} />
        <i className="pd-span" style={{ left: "42%", width: "15%" }} />
        {replay && <i className="pd-span is-open" style={{ left: "70%", width: "30%" }} />}
        {open && <i className="pd-span is-open is-lane1" style={{ left: `${open[0]}%`, width: `${open[1]}%` }} />}
        {COUNTS.map(([left, n]) => (
          <span key={left} className="pd-count" style={{ left: `${left}%` }}>
            {n}
          </span>
        ))}
        {quiet && <i className="pd-span is-open pd-wipe" style={{ left: "96%", width: "4%", ...at(SILENCE_AT) }} />}
        <div className="pd-cov">
          <i />
        </div>
        <div className={`pd-head${replay ? " is-scrub" : ""}`}>
          <i />
        </div>
      </div>
      <span className="pd-menu-wrap">
        <span className={`pd-bar-btn pd-mono${replay ? "" : " is-off"}`}>
          {replay ? (
            <Frames
              items={[
                ["1×", 0, 2100],
                ["300×", 2100],
              ]}
            />
          ) : (
            "1×"
          )}
        </span>
        {replay && (
          <span className="pd-pop pd-drop" style={at(SCRUB_END)}>
            {SPEEDS.map((s) => (
              <span key={s} className={`pd-pop-i${s === "300×" ? " is-on" : ""}`} style={s === "300×" ? at(2100) : undefined}>
                {s}
              </span>
            ))}
          </span>
        )}
      </span>
      <span className="pd-bar-btn pd-mono pd-range">6 h</span>
      {replay && <span className="pd-bar-btn pd-back">Back to live</span>}
    </div>
  );
}

function Tag() {
  return <span className="pd-tag">Illustrative · ships named SYN are synthetic</span>;
}

function Credits({ credits }) {
  return <p className="pd-credits">{credits.join(" · ")}</p>;
}

function Chrome({ replay, quiet, time, open, count, scale, scaleW, credits }) {
  return (
    <>
      <div className={`pd-topleft${replay ? " is-replay" : ""}`}>
        <Status replay={replay} />
        <Tag />
      </div>
      <Toolbar count={count} replay={replay} />
      <div className="pd-bottom">
        <div className="pd-row">
          <span className="pd-legend">
            <span className="pd-legend-i">
              <i />
              <i />
              <i />
            </span>
            Legend
            <i className="pd-box" />
          </span>
          <span className="pd-scale" style={{ "--w": scaleW }}>
            <i />
            {scale}
          </span>
        </div>
        <Bar replay={replay} quiet={quiet} time={time} open={open} />
        <Credits credits={credits} />
      </div>
    </>
  );
}

const SEA = "baltic.webp";
const REVIEW_COUNT = 3; // The rows in the review scene.
// Scale bars: the capture's 200 km bar (96 px at 1440), carried through each crop's zoom.
const BALTIC = { map: SEA, scale: "100 km", scaleW: 110, time: "12:08:28Z" };
// Six hours after SYN 4821's last AIS at 11:37Z, which is what the window and estimate say.
const LATER = { ...BALTIC, time: "17:37:09Z", count: REVIEW_COUNT, open: [0, 100] };

const VIEWS = [
  { map: "europe.webp", scale: "200 km", scaleW: 88, time: "12:08:28Z", open: [88, 12], count: 0, credits: [OSM, AIS], World: LiveWorld, Hud: LiveHud, zoom: true },
  { ...BALTIC, count: 0, credits: [OSM, AIS], World: QuietWorld, Hud: QuietHud, quiet: true },
  { ...LATER, credits: [OSM, AIS, DMA], World: () => <TrafficWorld selected />, Hud: WindowScene },
  { ...LATER, credits: [OSM, AIS, DMA], World: EstimateWorld, Hud: EstimateHud },
  { ...LATER, credits: [OSM, AIS, DMA], World: () => <TrafficWorld />, Hud: ReviewScene },
  { ...BALTIC, count: REVIEW_COUNT, credits: [OSM, AIS], World: ReplayWorld, Hud: ReplayHud, replay: true },
  { credits: [DMA], Hud: LabScene },
];

// The player passes the scene index and whether it is playing. Each scene is keyed by its index,
// so it restarts from its first frame when the player moves on.
export default function PoseidonDemo({ scene, playing, reducedMotion }) {
  const { map, World, Hud, credits, zoom, replay, quiet, time, open, count, scale, scaleW } = VIEWS[scene];
  const classes = ["pd-demo", playing ? "" : "is-paused", reducedMotion ? "is-still" : ""].filter(Boolean).join(" ");
  return (
    <div className={classes} data-scene={scenes[scene].id} aria-hidden="true">
      <div key={scene} className="pd-scene">
        {map && (
          <div className="pd-world">
            <div className={`pd-map${zoom ? " is-zoom" : ""}`}>
              <img src={asset(map)} alt="" width="656" height="801" />
              <World />
            </div>
          </div>
        )}
        {map && <Chrome replay={replay} quiet={quiet} time={time} open={open} count={count} scale={scale} scaleW={scaleW} credits={credits} />}
        <Hud />
        {!map && (
          <div className="pd-lab-note">
            <Tag />
            <Credits credits={credits} />
          </div>
        )}
      </div>
    </div>
  );
}
