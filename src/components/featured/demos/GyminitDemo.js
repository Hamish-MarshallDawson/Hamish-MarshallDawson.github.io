import "./GyminitDemo.css";

// Gyminit as seven self-animating scenes on a phone screen in the app's glossy
// "day sky / deep water" look. The player owns the scene index, the caption and the
// progress dots. Each scene animates itself in CSS: entrance delays are custom
// properties, and `.is-paused` on the root freezes them. There are no JS timers at
// all. With `.is-still` (reduced motion) nothing animates and each scene shows its end state.
// The scene fills a tall box. The top-right corner stays clear for the player's close button.
export const scenes = [
  { id: "start", caption: "Start a workout from Home", ms: 4000 },
  { id: "pick", caption: "Search the exercise list and add Lat Pulldown", ms: 4500 },
  { id: "log", caption: "Tap ✓ to log a set and the rest timer starts", ms: 5000 },
  { id: "plates", caption: "The plate calculator adds up the bar for you", ms: 4000 },
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

const SETS = [
  { n: 1, prev: "60 × 10", kg: "60", reps: "10", at: 500 },
  { n: 2, prev: "65 × 8", kg: "65", reps: "8", at: 1700 },
  { n: 3, prev: "65 × 8", kg: "67.5", reps: "8", at: 2900 },
];

// Five weeks of the month heatmap: 0 none, 1 light, 2 strong, 3 PR day.
const HEAT = [
  [0, 1, 0, 2, 0, 1, 0],
  [1, 0, 2, 0, 1, 0, 0],
  [0, 2, 0, 1, 0, 3, 0],
  [1, 0, 2, 0, 1, 0, 1],
  [0, 3, 0, 1, 2, 0, 0],
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

function Tabs({ lit }) {
  return (
    <ul className="gm-tabs">
      {TABS.map((tab, i) => (
        <li key={tab} className={i === lit ? "is-lit" : undefined}>
          {tab}
        </li>
      ))}
    </ul>
  );
}

// Scene 1: the green pill is pressed, then the empty workout offers "+ Add exercise".
function StartScene() {
  return (
    <div className="gm-body">
      <p className="gm-hero gm-in">Good morning</p>
      <p className="gm-sub gm-in" style={at(150)}>Last session · Pull day · Thu 15 Oct</p>
      <span className="gm-pill gm-press" style={at(1200)}>Start workout</span>
      <div className="gm-card gm-in" style={at(2200)}>
        <span className="gm-card-title">New workout</span>
        <span className="gm-add gm-in" style={at(2600)}>
          <Icon name="plus" />
          Add exercise
        </span>
      </div>
    </div>
  );
}

// Scene 2: the search text types in, and the Lat Pulldown row comes up.
function PickScene() {
  return (
    <div className="gm-body">
      <div className="gm-search gm-in">
        <Icon name="search" />
        <span className="gm-typed">pulldown</span>
      </div>
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
      </div>
      <span className="gm-pill is-aqua gm-in" style={at(2800)}>Add to workout</span>
    </div>
  );
}

// Scene 3: each ✓ turns its row aqua, and the rest timer bar starts to run.
function LogScene() {
  return (
    <div className="gm-body">
      <p className="gm-ex-title">Lat Pulldown (Machine)</p>
      <div className="gm-sets">
        <div className="gm-set is-head">
          <span>Set</span>
          <span>Previous</span>
          <span>kg</span>
          <span>reps</span>
          <span>✓</span>
        </div>
        {SETS.map((row) => (
          <div key={row.n} className="gm-set">
            <span className="gm-set-fill" style={at(row.at)} />
            <span>{row.n}</span>
            <span>{row.prev}</span>
            <span>{row.kg}</span>
            <span>{row.reps}</span>
            <span className="gm-ok" style={at(row.at)}>
              <Icon name="check" />
            </span>
          </div>
        ))}
      </div>
      <div className="gm-rest gm-in" style={at(2900)}>
        <span>Rest 1:30</span>
        <span className="gm-meter" aria-hidden="true">
          <span className="gm-meter-fill" style={at(2900)} />
        </span>
      </div>
    </div>
  );
}

// Scene 4: a barbell row, with the plates drawn either side and the sum under it.
function PlatesScene() {
  return (
    <div className="gm-body">
      <p className="gm-ex-title">Barbell Row</p>
      <div className="gm-bar gm-in" style={at(200)} aria-hidden="true">
        <i className="is-p25" style={at(500)} />
        <i className="is-p25" style={at(800)} />
        <i className="is-p20" style={at(1100)} />
        <i className="is-p5" style={at(1400)} />
        <b />
      </div>
      <p className="gm-sub gm-in" style={at(1600)}>+ 20 kg bar</p>
      <p className="gm-sum gm-in" style={at(2000)}>
        Plates 150 kg + bar 20 kg = <strong>170 kg</strong>
      </p>
    </div>
  );
}

// Scene 5: the finish sheet rises with its name chips.
function SaveScene() {
  return (
    <div className="gm-body">
      <div className="gm-sheet gm-rise">
        <p className="gm-sheet-title">Name this workout</p>
        <span className="gm-field gm-in" style={at(500)}>Pull day</span>
        <span className="gm-chips">
          <span className="gm-chip is-on">Pull day</span>
          <span className="gm-chip">Back &amp; Biceps</span>
        </span>
        <span className="gm-pill gm-press" style={at(1800)}>Save workout</span>
      </div>
    </div>
  );
}

// Scene 6: the month heatmap fills in, then the log line for the saved session.
function HistoryScene() {
  return (
    <div className="gm-body">
      <div className="gm-heat" aria-hidden="true">
        {HEAT.flat().map((level, i) => (
          <i key={i} className={`gm-cell is-l${level}`} style={at(i * 40)} />
        ))}
      </div>
      <p className="gm-log gm-in" style={at(1800)}>
        <span className="gm-log-name">
          <span className="gm-log-dot" aria-hidden="true" />
          Pull day
        </span>
        <span className="gm-log-meta">Thu 15 Oct · 52 min · 5 exercises · 18 sets · 6,240 kg · 2 PRs</span>
      </p>
    </div>
  );
}

// Scene 7: offline first. The phone is the source of truth; signing in backs it up.
function BackupScene() {
  return (
    <div className="gm-body">
      <div className="gm-card gm-in">
        <span className="gm-card-title">
          <Icon name="plane" />
          Offline · saved on this phone
        </span>
      </div>
      <div className="gm-card gm-in" style={at(900)}>
        <span className="gm-card-title">Backup</span>
        <span className="gm-field">Email me a sign-in code</span>
      </div>
      <p className="gm-backed gm-in" style={at(2400)}>
        <Icon name="cloud" />
        Backed up · 2 min ago
      </p>
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
        <View key={scene} />
        <Tabs lit={TAB_OF[scene]} />
      </div>
    </div>
  );
}
