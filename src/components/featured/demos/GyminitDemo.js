import "./GyminitDemo.css";
import { BUDDY_SEAT, BUDDY_STAND } from "./gyminitBuddy";

// Gyminit as seven self-animating scenes on a phone screen in the app's own Frutiger Aero look:
// its painted sky background with drifting bubbles, glass surfaces, glossy pills, the buddy mascot
// and the Hanoi plate diagram, all ported from the app. The player owns the scene index, the
// caption and the progress dots. Each scene animates itself in CSS: entrance delays are custom
// properties, and `.is-paused` on the root freezes them. There are no JS timers at all. With
// `.is-still` (reduced motion) nothing animates and each scene shows its end state.
// The scene fills a tall box. The top-right corner stays clear for the player's close button.
export const scenes = [
  { id: "start", caption: "Start a workout from Home", ms: 4000 },
  { id: "pick", caption: "Search the exercise list and add Lat Pulldown", ms: 4500 },
  { id: "log", caption: "Tap ✓ to log a set and the rest timer starts", ms: 5000 },
  { id: "plates", caption: "The plate calculator loads the bar for you", ms: 4500 },
  { id: "save", caption: "Name the workout and save it", ms: 4000 },
  { id: "history", caption: "History shows every session, PRs in orange", ms: 4500 },
  { id: "backup", caption: "Offline first, with optional cloud backup", ms: 5000 },
];

const CRUMBS = [
  "Home · Gyminit",
  "Exercises · search",
  "Workout · Lat Pulldown",
  "Workout · plates",
  "Finish · Name this workout",
  "History · October",
  "Settings · Backup",
];

const TABS = ["Home", "History", "Exercises", "Settings", "Friends"];
// The tab that is lit in each scene.
const TAB_OF = [0, 2, 0, 0, 0, 1, 3];

const WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DONE_DAYS = [1, 4];

const SETS = [
  { n: 1, kg: "60", reps: "10", at: 500 },
  { n: 2, kg: "65", reps: "8", at: 1700 },
  { n: 3, kg: "67.5", reps: "8", at: 2900 },
];

// The app's standard kg plates, with its plate colours (plateColors.ts). 2.5 and 1.25 stay neutral.
const PLATES = [
  { kg: "25", fill: "#C62828", ink: "#FFFFFF", on: 3 },
  { kg: "20", fill: "#1565C0", ink: "#FFFFFF", on: 0 },
  { kg: "15", fill: "#F9D923", ink: "#1A1A1A", on: 0 },
  { kg: "10", fill: "#2E7D32", ink: "#FFFFFF", on: 0 },
  { kg: "5", fill: "#F5F5F5", ink: "#1A1A1A", on: 0 },
  { kg: "2.5", on: 0 },
  { kg: "1.25", on: 0 },
];

// 170 kg on a 20 kg bar is 150 kg of plates: 75 a side, three 25s, biggest nearest the collar.
const STACK = [25, 25, 25];
const PLATE_W = 14;
const MID = 65;
// The app's plateHeight(): grows with weight but compresses.
const plateHeight = (kg) => Math.round(30 + 70 * Math.sqrt(Math.min(kg, 25) / 25));

// Five weeks of the month heatmap: 0 none, 1 to 4 the app's ramp, 5 a PR day.
const HEAT = [
  [0, 1, 0, 2, 0, 1, 0],
  [1, 0, 3, 0, 1, 0, 0],
  [0, 2, 0, 1, 0, 5, 0],
  [1, 0, 4, 0, 2, 0, 1],
  [0, 5, 0, 1, 2, 0, 0],
];

const ICONS = {
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l5 5" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  cloud: <path d="M7 18a4.5 4.5 0 0 1-.6-8.96A6 6 0 0 1 18 10a4 4 0 0 1-.5 8z" />,
  plane: <path d="M3 12l18-8-6 17-3-7z" />,
};

function Icon({ name }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {ICONS[name]}
    </svg>
  );
}

// Entrance delay for one element, as the CSS custom property the keyframes read.
const at = (ms) => ({ "--d": `${ms}ms` });

// The buddy, as the app draws it (static SVG saved from its own drawing code).
function Buddy({ pose, className, style }) {
  const art = pose === "stand" ? BUDDY_STAND : BUDDY_SEAT;
  return (
    <svg
      className={`gm-buddy ${className}`}
      style={style}
      viewBox={art.viewBox}
      aria-hidden="true"
      focusable="false"
      dangerouslySetInnerHTML={{ __html: art.html }}
    />
  );
}

// The app's "sky" painted background (dark palette) and its drifting bubbles. It is outside the
// scene, so it keeps drifting from one scene to the next.
const STARS = [[40, 60], [120, 130], [210, 50], [300, 110], [360, 40], [70, 220], [180, 190], [330, 250], [250, 300], [20, 330], [380, 360], [150, 400]];
const CLOUD_BANKS = [
  { cls: "gm-far", clouds: [[30, 230, 0.55], [230, 300, 0.5]] },
  { cls: "gm-mid", clouds: [[160, 430, 0.85], [-10, 520, 0.8]] },
  { cls: "gm-near", clouds: [[60, 640, 1.25], [260, 580, 1.1]] },
];

function Cloud({ x, y, s }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill="url(#gm-sk-c)">
      <circle r="26" />
      <circle cx="30" cy="-12" r="34" />
      <circle cx="68" cy="-4" r="28" />
      <circle cx="96" cy="6" r="20" />
      <rect x="-20" y="4" width="136" height="22" rx="11" />
    </g>
  );
}

function Sky() {
  return (
    <div className="gm-sky" aria-hidden="true">
      <svg viewBox="0 0 400 800" preserveAspectRatio="xMidYMax slice" focusable="false">
        <defs>
          <linearGradient id="gm-sk-g" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#031225" />
            <stop offset="0.55" stopColor="#0b3a6b" />
            <stop offset="1" stopColor="#2a4a78" />
          </linearGradient>
          <radialGradient id="gm-sk-sun">
            <stop offset="0" stopColor="#1f4a7a" />
            <stop offset="1" stopColor="#1f4a7a" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="gm-sk-moon">
            <stop offset="0" stopColor="#2a4a78" />
            <stop offset="1" stopColor="#2a4a78" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="gm-sk-c" cx="0.4" cy="0.35" r="0.7">
            <stop offset="0" stopColor="#1f4a7a" />
            <stop offset="1" stopColor="#0b3a6b" />
          </radialGradient>
        </defs>
        <rect width="400" height="800" fill="url(#gm-sk-g)" />
        <circle cx="60" cy="720" r="280" fill="url(#gm-sk-sun)" />
        <circle cx="310" cy="160" r="170" fill="url(#gm-sk-moon)" />
        <g fill="#eaf7ff">
          {STARS.map(([x, y]) => (
            <circle key={`${x},${y}`} cx={x} cy={y} r="1.3" />
          ))}
        </g>
        <g className="gm-twinkle" fill="#eaf7ff">
          <circle cx="90" cy="90" r="1.8" />
          <circle cx="270" cy="210" r="1.8" />
        </g>
        {CLOUD_BANKS.map((bank) => (
          <g key={bank.cls} className={`gm-bank ${bank.cls}`}>
            {[0, -400].map((dx) => (
              <g key={dx} transform={`translate(${dx} 0)`}>
                {bank.clouds.map(([x, y, s]) => (
                  <Cloud key={`${x},${y}`} x={x} y={y} s={s} />
                ))}
              </g>
            ))}
          </g>
        ))}
      </svg>
      <span className="gm-bubble" style={{ left: "8%", top: "10%", width: 90, height: 90 }} />
      <span className="gm-bubble" style={{ left: "72%", top: "28%", width: 60, height: 60 }} />
      <span className="gm-bubble" style={{ left: "20%", top: "62%", width: 120, height: 120 }} />
      <span className="gm-bubble" style={{ left: "78%", top: "80%", width: 70, height: 70 }} />
    </div>
  );
}

function Tabs({ lit }) {
  return (
    <ul className="gm-tabs">
      {TABS.map((tab, i) => (
        <li key={tab} className={i === lit ? "is-lit" : undefined}>
          <span>{tab}</span>
        </li>
      ))}
    </ul>
  );
}

// Scene 1: the buddy greets from Home, the green pill is pressed, then the workout offers "+ Add exercise".
function StartScene() {
  return (
    <div className="gm-body">
      <p className="gm-title gm-in">Gyminit</p>
      <ul className="gm-week gm-in" style={at(100)}>
        {WEEK.map((day, i) => (
          <li key={day} className={i === 3 ? "is-today" : undefined}>
            <span className={`gm-ring${DONE_DAYS.includes(i) ? " is-done" : ""}`} />
            {day}
          </li>
        ))}
      </ul>
      <div className="gm-hello">
        <Buddy pose="seat" className="gm-hello-buddy gm-in" style={at(300)} />
        <p className="gm-say gm-in" style={at(900)}>
          Ready to lift? Last time was Pull day.
        </p>
      </div>
      <span className="gm-pill gm-press" style={at(1600)}>Start workout</span>
      <div className="gm-card gm-in" style={at(2400)}>
        <span className="gm-card-title">New workout</span>
        <span className="gm-add gm-in" style={at(2800)}>
          <Icon name="plus" />
          Add exercise
        </span>
      </div>
    </div>
  );
}

// Scene 2: the search text types in, and the Lat Pulldown row is picked.
function PickScene() {
  return (
    <div className="gm-body">
      <p className="gm-title gm-in">Add exercise</p>
      <div className="gm-search gm-in">
        <Icon name="search" />
        <span className="gm-typed">pulldown</span>
      </div>
      <ul className="gm-chiprow gm-in" style={at(1500)}>
        <li className="is-on">All</li>
        <li>Chest</li>
        <li>Back</li>
        <li>Shoulders</li>
      </ul>
      <div className="gm-ex gm-in" style={at(1800)}>
        <span className="gm-art" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span className="gm-ex-text">
          <span className="gm-ex-name">Lat Pulldown (Machine)</span>
          <span className="gm-ex-meta">Works: Lats · Biceps (secondary)</span>
        </span>
        <span className="gm-radio">
          <span className="gm-radio-on" style={at(2600)}>
            <Icon name="check" />
          </span>
        </span>
      </div>
      <span className="gm-pill is-aqua gm-in" style={at(2900)}>Add (1)</span>
    </div>
  );
}

// Scene 3: each ✓ turns its row aqua, and the rest timer bar starts to run.
function LogScene() {
  return (
    <div className="gm-body">
      <div className="gm-card gm-exercise">
        <p className="gm-ex-title">Lat Pulldown (Machine)</p>
        <p className="gm-ex-meta">Back · Machine</p>
        <div className="gm-sets">
          <div className="gm-set is-head">
            <span>SET</span>
            <span>PREVIOUS</span>
            <span>KG</span>
            <span>REPS</span>
            <span />
          </div>
          {SETS.map((row) => (
            <div key={row.n} className="gm-set">
              <span className="gm-set-fill" style={at(row.at)} />
              <span>{row.n}</span>
              <span>—</span>
              <span className="gm-field-num">{row.kg}</span>
              <span className="gm-field-num">{row.reps}</span>
              <span className="gm-ok" style={at(row.at)}>
                <Icon name="check" />
              </span>
            </div>
          ))}
        </div>
        <span className="gm-add is-wide">
          <Icon name="plus" />
          Add set
        </span>
      </div>
      <div className="gm-rest gm-in" style={at(2900)}>
        <div className="gm-rest-row">
          <span className="gm-rest-time">1:30</span>
          <span className="gm-mini">−15 s</span>
          <span className="gm-mini">Skip</span>
          <span className="gm-mini">+15 s</span>
        </div>
        <span className="gm-meter" aria-hidden="true">
          <span className="gm-meter-fill" style={at(2900)} />
        </span>
      </div>
    </div>
  );
}

// Scene 4: the app's plate sheet. 170 kg on a 20 kg bar is three 25 kg plates a side.
function PlatesScene() {
  return (
    <div className="gm-body">
      <div className="gm-sheet gm-in">
        <div className="gm-sheet-head">
          <p className="gm-sheet-title">Plates</p>
          <span className="gm-mini">Close</span>
        </div>
        <svg className="gm-hanoi" viewBox="0 0 360 130" aria-hidden="true" focusable="false">
          <defs>
            <linearGradient id="gm-hb-chrome" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#f4f8fb" />
              <stop offset="0.45" stopColor="#b7c4d1" />
              <stop offset="1" stopColor="#7d8e9f" />
            </linearGradient>
            <linearGradient id="gm-hb-navy" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#4f86f0" />
              <stop offset="1" stopColor="#153c94" />
            </linearGradient>
          </defs>
          <ellipse cx="180" cy="120" rx="150" ry="5" fill="rgb(0 20 50 / 0.18)" />
          <rect x="14" y={MID - 3} width="332" height="6" rx="3" fill="url(#gm-hb-chrome)" stroke="#4f5f70" strokeWidth="1" />
          <rect x="22" y={MID - 6} width="100" height="12" rx="4" fill="url(#gm-hb-chrome)" stroke="#4f5f70" strokeWidth="1" />
          <rect x="238" y={MID - 6} width="100" height="12" rx="4" fill="url(#gm-hb-chrome)" stroke="#4f5f70" strokeWidth="1" />
          <rect x="118" y={MID - 18} width="5" height="36" rx="2.5" fill="url(#gm-hb-navy)" stroke="#0a2a4a" strokeWidth="1" />
          <rect x="237" y={MID - 18} width="5" height="36" rx="2.5" fill="url(#gm-hb-navy)" stroke="#0a2a4a" strokeWidth="1" />
          {STACK.map((kg, i) => {
            const h = plateHeight(kg);
            return [117 - PLATE_W - i * (PLATE_W + 1), 243 + i * (PLATE_W + 1)].map((x) => (
              <g key={x} className="gm-plate" style={at(500 + i * 400)}>
                <rect x={x} y={MID - h / 2} width={PLATE_W} height={h} rx="3" fill="#C62828" stroke="#0a2a4a" strokeWidth="1" />
                <rect x={x + 1} y={MID - h / 2 + 2} width={PLATE_W * 0.35} height={h - 4} rx="2" fill="#fff" opacity="0.28" />
              </g>
            ));
          })}
        </svg>
        <p className="gm-total gm-in" style={at(1800)}>
          Plates 150 kg + bar 20 kg = <strong>170 kg</strong>
        </p>
        <p className="gm-ex-meta">Each side: 25, 25, 25</p>
        <ul className="gm-plates">
          {PLATES.map((p) => (
            <li key={p.kg}>
              <span className={`gm-minus${p.on ? "" : " is-off"}`}>
                <Icon name="minus" />
              </span>
              <span
                className={`gm-platebtn${p.fill ? "" : " is-neutral"}`}
                style={p.fill ? { background: p.fill, color: p.ink } : undefined}
              >
                + {p.kg}
                {p.on > 0 && <small> ×{p.on}</small>}
              </span>
            </li>
          ))}
        </ul>
        <div className="gm-actions">
          <span className="gm-mini is-big">Clear</span>
          <span className="gm-pill is-small">Use 150 kg</span>
        </div>
      </div>
    </div>
  );
}

// Scene 5: the buddy cheers over the finish sheet; the name chips and Save workout.
function SaveScene() {
  return (
    <div className="gm-body">
      <div className="gm-cheer">
        <Buddy pose="stand" className="gm-cheer-buddy gm-hop" style={at(300)} />
        <p className="gm-say gm-in" style={at(700)}>
          Nice session!
        </p>
      </div>
      <div className="gm-sheet gm-rise">
        <p className="gm-sheet-title">Name this workout</p>
        <span className="gm-field gm-in" style={at(500)}>Pull day</span>
        <span className="gm-chips">
          <span className="gm-chip is-on">
            <Icon name="check" />
            Pull day
          </span>
          <span className="gm-chip">Back &amp; Biceps</span>
        </span>
        <p className="gm-ex-meta">52 min · 5 exercises · 18 sets · 6,240 kg</p>
        <span className="gm-pill gm-press" style={at(1800)}>Save workout</span>
      </div>
    </div>
  );
}

// Scene 6: the month heatmap fills in, then the log line for the saved session and the saved toast.
function HistoryScene() {
  return (
    <div className="gm-body">
      <p className="gm-title gm-in">History</p>
      <div className="gm-heat" aria-hidden="true">
        {HEAT.flat().map((level, i) => (
          <i key={i} className={`gm-cell is-l${level}`} style={at(i * 40)} />
        ))}
      </div>
      <ul className="gm-legend gm-in" style={at(1500)}>
        <li>Less</li>
        <li className="gm-cell is-l0" />
        <li className="gm-cell is-l1" />
        <li className="gm-cell is-l2" />
        <li className="gm-cell is-l3" />
        <li className="gm-cell is-l4" />
        <li>More</li>
        <li className="gm-cell is-l5" />
        <li>PR day</li>
      </ul>
      <p className="gm-log gm-in" style={at(1800)}>
        <span className="gm-log-name">
          <span className="gm-log-dot" aria-hidden="true" />
          Pull day
        </span>
        <span className="gm-ex-meta">Thu 15 Oct · 52 min · 5 exercises · 18 sets · 6,240 kg · 2 PRs</span>
      </p>
      <p className="gm-toast gm-in" style={at(2600)}>Workout saved</p>
    </div>
  );
}

// Scene 7: offline first. The phone is the source of truth; signing in backs it up.
function BackupScene() {
  return (
    <div className="gm-body">
      <p className="gm-title gm-in">Settings</p>
      <div className="gm-card gm-in">
        <span className="gm-card-title">
          <Icon name="plane" />
          Offline · saved on this phone
        </span>
        <span className="gm-ex-meta">Your workouts live on this device. Nothing leaves it unless you sign in.</span>
      </div>
      <div className="gm-card gm-in" style={at(900)}>
        <span className="gm-card-title">Backup</span>
        <span className="gm-field">Email me a sign-in code</span>
      </div>
      <p className="gm-backed gm-in" style={at(2400)}>
        <Icon name="cloud" />
        Backed up · 2 min ago
      </p>
      <Buddy pose="seat" className="gm-corner-buddy gm-in" style={at(3000)} />
    </div>
  );
}

const VIEWS = [StartScene, PickScene, LogScene, PlatesScene, SaveScene, HistoryScene, BackupScene];

// The player passes the scene index and whether it is playing. Each scene is keyed
// by its index, so it restarts from its first frame when the player moves on.
export default function GyminitDemo({ scene, playing, reducedMotion }) {
  const View = VIEWS[scene];
  const classes = ["gm-demo", playing ? "" : "is-paused", reducedMotion ? "is-still" : ""].filter(Boolean).join(" ");
  return (
    <div className={classes} data-scene={scenes[scene].id} aria-hidden="true">
      <p className="gm-crumb">{CRUMBS[scene]}</p>
      <div className="gm-phone">
        <Sky />
        <View key={scene} />
        <Tabs lit={TAB_OF[scene]} />
      </div>
    </div>
  );
}
