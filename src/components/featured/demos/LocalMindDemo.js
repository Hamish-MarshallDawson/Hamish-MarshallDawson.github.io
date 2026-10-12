import { useEffect, useState } from "react";
import "./LocalMindDemo.css";

// LocalMind as five self-animating scenes in the app's paper, ink and signal look.
// The player owns the scene index, the caption and the progress dots. Each scene
// animates itself in CSS: entrance delays are custom properties, and `.is-paused`
// on the root freezes them. The only JS timer is the streamed answer, which runs
// only while the demo is playing. With `.is-still` (reduced motion) nothing
// animates and each scene shows its end state.
export const scenes = [
  { id: "ask", caption: "Paste a job advert and send it", ms: 4500 },
  { id: "search", caption: "It searches only what this chat can see", ms: 4500 },
  { id: "write", caption: "It writes the CV and compiles it to two pages", ms: 4500 },
  { id: "answer", caption: "The answer streams back, with the PDF", ms: 4500 },
  { id: "phone", caption: "Message it from my phone and the PC wakes", ms: 5000 },
];

const ADVERT = "Graduate Analyst, Data Engineering";
const REQUEST = "Tailor my CV to this advert.";
const ANSWER = "Tailored for the graduate analyst role. Pipeline work now leads, and it still fits on two pages.";

// About 30 updates a second at most, so the streamed text never costs a render per character.
const TYPE_TICK_MS = 33;
const TYPE_CHUNK = 2;

const NODES = [
  { name: "Phone", at: 400 },
  { name: "Gateway", at: 1400 },
  { name: "GPU PC", at: 2400 },
];

const ROWS = [
  { name: "General CV", tag: "Shared", at: 600 },
  { name: "Study notes", tag: "Shared", at: 1500 },
  { name: "Barclays", tag: "This chat", at: 2400 },
];

// Lucide-style strokes, the same paths the app draws.
const ICONS = {
  send: <path d="M12 19V5M5 12l7-7 7 7" />,
  lock: (
    <>
      <rect x="4" y="11" width="16" height="10" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </>
  ),
  download: (
    <>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="m7 10 5 5 5-5" />
      <path d="M12 15V3" />
    </>
  ),
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
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

// Streams ANSWER in small chunks while `active`. Pausing stops the timer; playing
// again resumes from the same character. Reduced motion shows the full text.
function useStream(active, reduced) {
  const [count, setCount] = useState(0);
  const more = active && !reduced && count < ANSWER.length;

  useEffect(() => {
    if (!more) return undefined;
    const id = setTimeout(() => setCount((n) => Math.min(ANSWER.length, n + TYPE_CHUNK)), TYPE_TICK_MS);
    return () => clearTimeout(id);
  }, [more, count]);

  const done = reduced || count >= ANSWER.length;
  return { typed: reduced ? ANSWER : ANSWER.slice(0, count), done };
}

// The window's title bar: the mark, the name and one status plate.
function TitleBar({ status, busy }) {
  return (
    <div className="lm-titlebar">
      <span className="lm-mark" aria-hidden="true">
        LM
      </span>
      <span className="lm-wordmark">LocalMind</span>
      <span className={`lm-status${busy ? " is-busy" : ""}`}>
        <span className="lm-dot" aria-hidden="true" />
        {status}
      </span>
    </div>
  );
}

// Scene 1: the advert chip leaves the composer and lands in the user's bubble.
function AskScene() {
  return (
    <>
      <TitleBar status="Idle" />
      <div className="lm-body">
        <p className="lm-note">New chat · scoped to Barclays</p>
        <div className="lm-thread">
          <div className="lm-bubble is-user lm-in" style={at(500)}>
            <span className="lm-chip">{ADVERT}</span>
            <span>{REQUEST}</span>
          </div>
        </div>
        <div className="lm-composer">
          <span className="lm-chip lm-lift" style={at(300)}>
            {ADVERT}
          </span>
          <span className="lm-send">
            <Icon name="send" />
            <span className="lm-ring" style={at(1900)} />
          </span>
        </div>
      </div>
    </>
  );
}

// Scene 2: the knowledge rows tick in; the private section stays locked.
function SearchScene() {
  return (
    <>
      <TitleBar status="Searching" busy />
      <div className="lm-body">
        <p className="lm-query lm-in" style={at(200)}>
          knowledge_search · this chat
        </p>
        <ul className="lm-rows">
          {ROWS.map((row) => (
            <li key={row.name} className="lm-row lm-in" style={at(row.at)}>
              <span className="lm-row-name">{row.name}</span>
              <span className="lm-badge">{row.tag}</span>
              <span className="lm-tick" style={at(row.at + 300)}>
                <Icon name="check" />
              </span>
            </li>
          ))}
          <li className="lm-row is-locked lm-in" style={at(3200)}>
            <span className="lm-row-name">STMicroelectronics</span>
            <span className="lm-badge is-private">
              <Icon name="lock" />
              Private
            </span>
            <span className="lm-tick is-empty" aria-hidden="true" />
          </li>
        </ul>
      </div>
    </>
  );
}

// Scene 3: the tool loop writes cv-barclays.tex, compiles it, and offers the PDF.
function WriteScene() {
  return (
    <>
      <TitleBar status="Running tools" busy />
      <div className="lm-body">
        <div className="lm-bubble is-user lm-wide-only lm-in" style={at(0)}>
          {REQUEST}
        </div>
        <ol className="lm-calls">
          <li className="lm-call lm-in" style={at(200)}>
            <span className="lm-call-name">open_document</span>
            <span className="lm-call-meta">cv.tex · 214 lines</span>
          </li>
          <li className="lm-call lm-in" style={at(1100)}>
            <span className="lm-call-name">write_file</span>
            <span className="lm-call-meta">+2 −2</span>
          </li>
          <li className="lm-call lm-in" style={at(2000)}>
            <span className="lm-call-name">compile_latex</span>
            <span className="lm-call-meta">2 pages</span>
          </li>
        </ol>
        <div className="lm-files">
          <span className="lm-file lm-in" style={at(1500)}>
            cv-barclays.tex
          </span>
          <span className="lm-file is-pdf lm-in" style={at(3000)}>
            <Icon name="download" />
            cv-barclays.pdf · 2 pages
          </span>
        </div>
      </div>
    </>
  );
}

// Scene 4: the answer streams back, and the PDF is offered when it finishes.
function AnswerScene({ playing, reduced }) {
  const { typed, done } = useStream(playing, reduced);
  return (
    <>
      <TitleBar status={done ? "Done" : "Streaming"} busy={!done} />
      <div className="lm-body lm-thread">
        <div className="lm-bubble is-user lm-in">{REQUEST}</div>
        <div className="lm-bubble is-bot">
          <p>
            {typed}
            {!done && <span className="lm-caret" aria-hidden="true" />}
          </p>
        </div>
        {done && (
          <span className="lm-file is-pdf lm-in">
            <Icon name="download" />
            cv-barclays.pdf · 2 pages
          </span>
        )}
      </div>
    </>
  );
}

// Scene 5: the phone's message travels phone, gateway, PC; the PC then counts down to sleep.
function PhoneScene() {
  return (
    <>
      <TitleBar status="Waking PC" busy />
      <div className="lm-body">
        <div className="lm-bubble is-user lm-in" style={at(200)}>
          Any news from Barclays about the interview?
        </div>
        <ol className="lm-nodes">
          {NODES.map((node, i) => (
            <li key={node.name} className="lm-node-item">
              {i > 0 && <span className="lm-link" style={at(node.at - 500)} aria-hidden="true" />}
              <span className="lm-node" style={at(node.at)}>
                {node.name}
              </span>
            </li>
          ))}
        </ol>
        <div className="lm-sleep lm-in" style={at(3600)}>
          <span>Sleeps after 10 idle minutes</span>
          <span className="lm-meter" aria-hidden="true">
            <span className="lm-meter-fill" style={at(3600)} />
          </span>
        </div>
      </div>
    </>
  );
}

const VIEWS = [AskScene, SearchScene, WriteScene, AnswerScene, PhoneScene];

// The player passes the scene index and whether it is playing. Each scene is keyed
// by its index, so it restarts from its first frame when the player moves on.
export default function LocalMindDemo({ scene, playing, reducedMotion }) {
  const View = VIEWS[scene];
  const classes = ["lm-demo", playing ? "" : "is-paused", reducedMotion ? "is-still" : ""].filter(Boolean).join(" ");
  return (
    <div className={classes} data-scene={scenes[scene].id} aria-hidden="true">
      <div className="lm-window">
        <View key={scene} playing={playing} reduced={reducedMotion} />
      </div>
    </div>
  );
}
