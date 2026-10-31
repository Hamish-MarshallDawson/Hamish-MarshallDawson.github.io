import "./BusDisplayDemo.css";

// The Lothian Bus Display as seven self-animating scenes on its 3.5" touchscreen, in the app's own
// look (gfx/theme.h and busColours.h of the bus repo): white screen, Lothian maroon, route pills in
// the routes' own colours, Nunito Sans. No Lothian logos. Every stop and destination is city
// centre. The screen is drawn in its own 320 x 480 pixels (the --u unit) inside a black bezel,
// scaled to the box. Like the other demos, each scene animates itself in CSS with no JS timers:
// `.is-paused` holds the animations and `.is-still` (reduced motion) shows each end state.
// The top-right corner stays clear for the player's close button.
export const scenes = [
  { id: "boot", caption: "Starts on boot and finds its stops from the daily cache", ms: 4000 },
  { id: "board", caption: "Live departures, with delays and cancellations", ms: 4500 },
  { id: "direction", caption: "Into or out of city, decided from the timetables", ms: 4500 },
  { id: "hide", caption: "Tap a route chip to hide it. It stays hidden after a restart", ms: 4500 },
  { id: "track", caption: "Tap a bus to follow it on the map", ms: 5500 },
  { id: "offline", caption: "No Wi-Fi? It backs off and keeps the last good board", ms: 4500 },
  { id: "snapshot", caption: "Every screen renders to PNG from test data, with five offline test suites", ms: 5500 },
];

// Route colours from busColours.h. Light fills take dark text, as the app picks.
const ROUTES = {
  5: { bg: "#F9B233", fg: "#1E272C" },
  10: { bg: "#6A2655" },
  16: { bg: "#AE9A64", fg: "#1E272C" },
  22: { bg: "#7C3F61" },
  34: { bg: "#2B2171" },
  37: { bg: "#355FAA" },
  N22: { bg: "#6B7780" },
};
const CHIPS = ["5", "22", "34", "10", "N22", "16"];

// kind: live, due, delayed, sched (no live icon, grey) or cancelled.
const INTO = [
  { route: "5", dest: "Muirhouse", time: "Due", kind: "due" },
  { route: "22", dest: "Ocean Terminal", time: "3 min", kind: "live" },
  { route: "34", dest: "Gyle Centre", time: "7 min", kind: "delayed" },
  { route: "10", dest: "Newhaven", time: "9 min", kind: "sched" },
  { route: "N22", dest: "Balerno", time: "12 min", kind: "live" },
];
const OUT = [
  { route: "22", dest: "Leith", time: "2 min", kind: "live" },
  { route: "10", dest: "Western Harbour", time: "6 min", kind: "live" },
  { route: "16", dest: "Colinton", time: "11 min", kind: "cancelled" },
  { route: "5", dest: "The Jewel", time: "15 min", kind: "sched" },
];
const STOPS = ["Princes Street", "North Bridge", "St Andrew Square", "Waverley Bridge", "South St Andrew Street"];

// The tracking scene's map: a crop of the app's own render (docs/images/bus-detail.png in the bus repo),
// real OpenStreetMap tiles of the New Town, Old Town and Waverley, with the credit the device draws.
const MAP = `${process.env.PUBLIC_URL}/featured/bus/map.png`;

const at = (ms) => ({ "--d": `${ms}ms` });

function Live({ className = "" }) {
  return (
    <svg className={`lb-live ${className}`} viewBox="0 0 12 12" aria-hidden="true">
      <circle cx="2.5" cy="6" r="1.4" />
      <path d="M5 3.2a4 4 0 0 1 0 5.6M7.6 1.2a7 7 0 0 1 0 9.6" />
    </svg>
  );
}

function StatusBar({ offline = false, time = "16:00" }) {
  return (
    <div className="lb-status">
      <span>{time}</span>
      {offline ? (
        <span className="lb-offline">Offline</span>
      ) : (
        <span className="lb-status-live">
          <Live /> Live
        </span>
      )}
    </div>
  );
}

function Pill({ route, small = false, className = "", style }) {
  const c = ROUTES[route];
  return (
    <span className={`lb-pill${small ? " is-small" : ""} ${className}`} style={{ background: c.bg, color: c.fg ?? "#FFFFFF", ...style }}>
      {route}
    </span>
  );
}

function StopIcon() {
  return (
    <span className="lb-stopicon" aria-hidden="true">
      <i />
    </span>
  );
}

function Header({ name = "Princes Street (Stop F)" }) {
  return (
    <div className="lb-head">
      <StopIcon />
      <span className="lb-head-name">{name}</span>
      <span className="lb-chev" />
    </div>
  );
}

function Direction({ out = false, tapAt }) {
  return (
    <div className={`lb-dir${out ? " is-out" : ""}`}>
      <span className="lb-btn lb-btn-into">Into city</span>
      <span className="lb-btn lb-btn-out">Out of city</span>
      {out && <span className="lb-dir-fill" style={at(tapAt)} />}
      {out && <Tap className="lb-tap-out" ms={tapAt} />}
    </div>
  );
}

function Tap({ className, ms }) {
  return <span className={`lb-tap ${className}`} style={at(ms)} />;
}

// A gone row leaves the flow at once and is wiped out where it stood (`--i` places it), while
// the rows after it slide up into the gap: only transform and clip-path move.
function Row({ row, ms, index, gone = false }) {
  const { route, dest, time, kind } = row;
  const enters = ms >= 0;
  return (
    <li className={`lb-row${enters ? " lb-in" : ""}${gone ? " is-gone" : ""}`} style={{ ...(enters ? at(ms) : null), "--i": index }}>
      <Pill route={route} small />
      <span className="lb-dest">{dest}</span>
      <span className={`lb-time is-${kind}`}>
        {(kind === "live" || kind === "due" || kind === "delayed") && <Live />}
        <b>{time}</b>
      </span>
      {kind === "delayed" && <span className="lb-sub is-delayed">Delayed</span>}
      {kind === "cancelled" && <span className="lb-sub is-cancelled">Cancelled</span>}
    </li>
  );
}

// The departures board. `hide` is a route whose chip is struck and whose row collapses; `first` is
// when the rows start to enter.
function Board({ out = false, hide, tapAt = 600, first = 200, rowsIn = true }) {
  const rows = out ? OUT : INTO;
  return (
    <div className="lb-screen-in">
      <StatusBar />
      <Header />
      <Direction out={out} tapAt={tapAt} />
      <ul className="lb-chips">
        {CHIPS.map((route) => (
          <li key={route} className={hide === route ? "is-hidden" : undefined}>
            <Pill route={route} small />
            {hide === route && <Pill route={route} small className="lb-was" style={at(tapAt + 120)} />}
            {hide === route && <span className="lb-strike" style={at(tapAt + 120)} />}
            {hide === route && <Tap className="lb-tap-chip" ms={tapAt} />}
          </li>
        ))}
      </ul>
      <p className="lb-upcoming">Upcoming departures</p>
      <ul className={`lb-rows${hide ? " has-gone" : ""}`} style={hide ? at(tapAt + 300) : undefined}>
        {rows.map((row, i) => (
          <Row key={row.route + row.dest} row={row} index={i} gone={row.route === hide} ms={rowsIn ? first + i * 120 : -1} />
        ))}
      </ul>
    </div>
  );
}

function BootScene() {
  return (
    <>
      <div className="lb-boot">
        <p className="lb-boot-t lb-rise" style={at(100)}>
          Bus Tracker
        </p>
        <p className="lb-boot-s lb-blink" style={at(500)}>
          Finding stops...
        </p>
      </div>
      <div className="lb-layer lb-cover" style={at(2000)}>
        <div className="lb-screen-in">
          <StatusBar />
          <div className="lb-back">
            <span className="lb-back-chev" />
            <span className="lb-back-t">Into city</span>
          </div>
          <ul className="lb-stops">
            {STOPS.map((name, i) => (
              <li key={name} className="lb-in" style={at(2200 + i * 90)}>
                <StopIcon />
                <span>
                  {name}
                  <small>into city</small>
                </span>
                <span className="lb-chev" />
              </li>
            ))}
          </ul>
          <p className="lb-cache lb-in" style={at(2800)}>
            Stops from today's cache · 0.08 s
          </p>
        </div>
      </div>
    </>
  );
}

// The stops from the one before the bus to mine, as the app lists them under the map.
const LINE = [
  ["Drumsheugh Place", "17:52", "passed"],
  ["Queensferry Street", "17:54", "next"],
  ["Princes Street (west)", "17:58", "ahead"],
  ["Princes Street (Scott Mon.)", "18:03", "mine"],
];

function TrackScene() {
  return (
    <div className="lb-screen-in">
      <StatusBar time="17:53" />
      <div className="lb-back lb-track-head">
        <span className="lb-back-chev" />
        <Pill route="37" />
        <span className="lb-track-dest">to Penicuik Dburn</span>
      </div>
      <div className="lb-map lb-reveal" style={at(200)}>
        <img src={MAP} alt="" width="320" height="200" />
      </div>
      <div className="lb-info lb-in" style={at(900)}>
        <p className="lb-info-h">Approaching Queensferry Street</p>
        <p className="lb-info-s">2 stops away · due in 6 min</p>
        <div className="lb-info-row">
          <span className="lb-late is-ontime">On time</span>
          <span className="lb-updated">Updated 7 s ago</span>
        </div>
      </div>
      <ol className="lb-line">
        {LINE.map(([name, t, kind], i) => (
          <li key={name} className={`lb-in is-${kind}`} style={at(1200 + i * 120)}>
            <i />
            <span>{name}</span>
            <b>{t}</b>
          </li>
        ))}
      </ol>
    </div>
  );
}

function OfflineScene() {
  return (
    <div className="lb-screen-in">
      <StatusBar offline />
      <div className="lb-err">
        <span className="lb-err-icon lb-pop" style={at(200)}>
          !
        </span>
        <p className="lb-err-t lb-in" style={at(400)}>
          NO WI-FI
        </p>
        <p className="lb-err-m lb-in" style={at(500)}>
          Can't reach Lothian buses. Check the Wi-Fi.
        </p>
        <p className="lb-err-f lb-in" style={at(900)}>
          Last board 4 min ago · Retrying in 42 s
        </p>
      </div>
      <span className="lb-big is-filled lb-in" style={at(1100)}>
        RETRY
      </span>
      <span className="lb-big lb-in" style={at(1200)}>
        CHOOSE STOP
      </span>
    </div>
  );
}

const TERMINAL = [
  ["cmd", "./busTrack --snapshot board.png --screen main"],
  ["out", "wrote board.png  320x480"],
  ["cmd", "make test"],
  ["ok", "refresh_test"],
  ["ok", "direction_test"],
  ["ok", "live_format_test"],
  ["ok", "tracking_test"],
  ["ok", "test_screens"],
  ["out", "5 suites passed, no network"],
];

function Terminal() {
  return (
    <div className="lb-term lb-wipe" style={at(500)}>
      {TERMINAL.map(([kind, text], i) => (
        <p key={text} className={`lb-step is-${kind}`} style={at(800 + i * 260)}>
          {kind === "cmd" && <span className="lb-prompt">$ </span>}
          {text}
          {kind === "ok" && <span className="lb-ok"> ok</span>}
        </p>
      ))}
    </div>
  );
}

// Each scene: what is on the screen, and anything drawn beside the device.
const VIEWS = [
  { Screen: BootScene },
  { Screen: () => <Board /> },
  { Screen: () => <Board out tapAt={300} first={700} /> },
  { Screen: () => <Board hide="34" tapAt={500} rowsIn={false} /> },
  { Screen: TrackScene },
  { Screen: OfflineScene },
  { Screen: () => <Board rowsIn={false} />, Beside: Terminal },
];

// The player passes the scene index and whether it is playing. Each scene is keyed by its index,
// so it restarts from its first frame when the player moves on.
export default function BusDisplayDemo({ scene, playing, reducedMotion }) {
  const { Screen, Beside } = VIEWS[scene];
  const classes = ["lb-demo", playing ? "" : "is-paused", reducedMotion ? "is-still" : ""].filter(Boolean).join(" ");
  return (
    <div className={classes} data-scene={scenes[scene].id} aria-hidden="true">
      <div className="lb-device">
        <div className="lb-screen">
          <Screen key={scene} />
        </div>
      </div>
      {Beside && <Beside key={scene} />}
    </div>
  );
}
