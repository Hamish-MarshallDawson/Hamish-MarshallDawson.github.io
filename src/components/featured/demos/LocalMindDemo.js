import { useEffect, useRef, useState } from "react";
import "./LocalMindDemo.css";

// The LocalMind walkthrough, simplified to the screens that carry the point:
// one window that swaps between the chat, the tool loop, the knowledge base
// and the phone's route (the gateway's page). Every value is made up and local.
//
// `tour` drives the cursor (see DemoStage). Each target is a data-tour name
// rendered inside this demo; a target that is not on screen at the current
// width is skipped by the tour. A name is used once, and every name is shown at
// both phone and desktop widths, so each one points at a visible element.
export const steps = [
  {
    id: "ask",
    title: "Ask",
    caption: "Paste a job advert and send it, and LocalMind starts the tool loop on this PC.",
    tour: [
      { target: "input", label: "Advert pasted", hold: 1000 },
      { target: "send", label: "Send", click: true },
    ],
  },
  {
    id: "tools",
    title: "Tool calls",
    caption: "The model searches the sections this chat can see, opens cv.tex, writes the new file and compiles it.",
    tour: [
      { target: "tool-search", label: "Shared sections only" },
      { target: "tool-write", label: "Writes the new file" },
      { target: "tool-compile", label: "Compiles the PDF" },
    ],
  },
  {
    id: "answer",
    title: "Answer and PDF",
    caption: "The answer streams in, and the compiled PDF is offered as a download.",
    tour: [
      { target: "answer", label: "Streams in" },
      { target: "pdf", label: "PDF offered", hold: 1800 },
    ],
  },
  {
    id: "kb",
    title: "Knowledge base",
    caption: "Shared sections reach every chat. A private section is only searchable from chats scoped to it.",
    tour: [
      { target: "shared", label: "Any chat can search" },
      { target: "private", label: "Scoped chats only" },
    ],
  },
  {
    id: "phone",
    title: "From my phone",
    caption:
      "The PC is asleep. A message from the phone wakes it, the answer streams back, and the PC switches off after ten idle minutes.",
    tour: [
      { target: "node-phone", label: "Phone" },
      { target: "node-pc", label: "Woken on message" },
      { target: "pc-pill", label: "PC state" },
    ],
  },
];

// The GPU status plate in the window's title bar, per step. `short` is the word
// shown under the 400px container, where the full text would clip the name; the
// full text stays in the accessibility tree either way.
const STATUS = [
  { text: "GPU idle", short: "Idle", busy: false },
  { text: "Running tools", short: "Tools", busy: true },
  { text: "Streaming", short: "Streaming", busy: true },
  { text: "GPU idle", short: "Idle", busy: false },
];

const SHARED = ["General CV", "Study notes"];
const PRIVATE = ["Barclays", "STMicroelectronics"];

const ADVERT =
  "Graduate Analyst, Data Engineering. You will build and maintain Python pipelines on cloud platforms, write SQL against large datasets, and work with stakeholders to turn requirements into reliable data products.";

const ANSWER =
  "I've tailored the CV for the graduate analyst role. The summary now leads with the pipeline work, and the STMicroelectronics placement has moved above the dissertation. I've also changed “utilized” to “utilised” throughout to match British spelling. It still fits on two pages, and every new line comes from your CV or the placement notes, so nothing has been invented.";

const PHONE_ANSWER =
  "Yes. The recruiter's email came in at 09:12 with a 30-minute video interview on Thursday at 14:00. I've added it to your notes in the Barclays section.";

// The answer types out in chunks, as the app streams it. A tick of 33 ms is
// about 30 renders a second, so the streamed text never costs one per character.
const TYPE_TICK_MS = 33;
const TYPE_CHUNK = 6;

// Milliseconds each phone phase lasts: asleep, waking, answering, idle countdown.
const PHONE_TIMES = [1600, 1800, 2600, 2400];

// Lucide-style strokes, the same paths theme.py draws as CSS masks.
const ICONS = {
  download: (
    <>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="m7 10 5 5 5-5" />
      <path d="M12 15V3" />
    </>
  ),
  lock: (
    <>
      <rect x="4" y="11" width="16" height="10" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </>
  ),
  send: <path d="M12 19V5M5 12l7-7 7 7" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
};

function Icon({ name }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {ICONS[name]}
    </svg>
  );
}

// Types the answer out in chunks, as the app streams it. Starts once `go` is
// set; with reduced motion the text is simply there.
function useTyped(text, go, reduced) {
  const [count, setCount] = useState(reduced ? text.length : 0);

  useEffect(() => {
    if (!go || reduced || count >= text.length) return undefined;
    const timer = setTimeout(() => setCount((n) => Math.min(text.length, n + TYPE_CHUNK)), TYPE_TICK_MS);
    return () => clearTimeout(timer);
  }, [go, reduced, count, text]);

  if (!go) return "";
  return reduced ? text : text.slice(0, count);
}

// The phone script: asleep, waking, answering, idle countdown, asleep again.
function usePhoneScript(reduced) {
  const [phase, setPhase] = useState(reduced ? 4 : 0);

  useEffect(() => {
    if (reduced || phase >= 4) return undefined;
    const timer = setTimeout(() => setPhase((p) => p + 1), PHONE_TIMES[phase]);
    return () => clearTimeout(timer);
  }, [phase, reduced]);

  return phase;
}

// The window's title bar: the mark, the name and one status plate.
function TitleBar({ step }) {
  const { text, short, busy } = STATUS[step];
  return (
    <div className="lm-titlebar">
      <span className="lm-mark" aria-hidden="true">
        LM
      </span>
      <span className="lm-wordmark">LocalMind</span>
      <span className={`lm-status${busy ? " is-busy" : ""}`}>
        <span className="lm-dot" aria-hidden="true" />
        <span className="lm-status-full">{text}</span>
        <span className="lm-status-short" aria-hidden="true">
          {short}
        </span>
      </span>
    </div>
  );
}

// One tool call, shown as a single compact row in the thread.
function ToolRow({ mark, name, meta, tour }) {
  return (
    <div className="lm-tool" data-tour={tour}>
      <span className="lm-tool-mark" aria-hidden="true">
        {mark}
      </span>
      <span className="lm-tool-name">{name}</span>
      <span className="lm-tool-meta">{meta}</span>
    </div>
  );
}

// The composer is the paste box and Send, nothing else. Send stays focusable
// when it is not live (aria-disabled), so keyboard focus never drops to the page.
function Composer({ ready, onSend }) {
  const send = () => {
    if (ready) onSend();
  };
  return (
    <div className="lm-composer">
      <div className="lm-composer-card">
        <p className="lm-input" data-tour="input">
          {ready ? ADVERT : <span className="lm-placeholder">Message LocalMind…</span>}
        </p>
        <button
          type="button"
          className="lm-send"
          data-tour="send"
          aria-label={ready ? "Send the advert to tailor the CV" : "Send"}
          aria-disabled={!ready}
          onClick={send}
        >
          <Icon name="send" />
        </button>
      </div>
    </div>
  );
}

function ChatView({ step, reduced }) {
  const typed = useTyped(ANSWER, step >= 2, reduced);
  const sent = step >= 1;
  const threadRef = useRef(null);

  // In a short frame the thread scrolls, and the newest line (the streamed
  // answer, or the last tool call) follows to the bottom of the chat area.
  useEffect(() => {
    const body = threadRef.current?.parentElement;
    if (body) body.scrollTop = body.scrollHeight;
  }, [step, typed.length]);

  return (
    <div className="lm-thread" ref={threadRef}>
      <p className="lm-note">{step === 0 ? "New chat · scoped to Barclays" : "Barclays · graduate analyst"}</p>
      {step === 0 && <p className="lm-note">Advert ready. Send to start the tool loop.</p>}
      {sent && (
        <div className="lm-user">
          <p>Tailor my CV to this advert: two pages, British English, saved as cv-barclays.tex.</p>
        </div>
      )}
      {sent && (
        <div className="lm-tools">
          <ToolRow mark="📚" name="knowledge_search · shared sections" meta="0.4 s" tour="tool-search" />
          <ToolRow mark="📂" name="open_document · cv.tex" meta="214 lines" />
          <ToolRow mark="✏️" name="write_file · cv-barclays.tex" meta="+2 −2" tour="tool-write" />
          <ToolRow mark="🧾" name="compile_latex · cv-barclays.tex" meta="2 pages" tour="tool-compile" />
        </div>
      )}
      {step >= 2 && (
        <div className="lm-bot" data-tour="answer">
          <p>
            {typed}
            {typed.length < ANSWER.length && <span className="lm-caret" aria-hidden="true" />}
          </p>
          {typed.length === ANSWER.length && (
            <span className="lm-file" data-tour="pdf">
              <Icon name="download" />
              cv-barclays.pdf · 212 KB
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function KnowledgeView() {
  return (
    <div className="lm-kb">
      <p className="lm-note">Knowledge base</p>
      <section className="lm-section" data-tour="shared" aria-label="Shared sections">
        <p className="lm-group-head">
          <span>Shared</span>
          <span className="lm-muted">every chat</span>
        </p>
        {SHARED.map((name) => (
          <div key={name} className="lm-section-row">
            <span className="lm-section-name">{name}</span>
            <span className="lm-badge">Shared</span>
          </div>
        ))}
      </section>
      <section className="lm-section" data-tour="private" aria-label="Private sections">
        <p className="lm-group-head">
          <span>Private</span>
          <span className="lm-muted">scoped chats only</span>
        </p>
        {PRIVATE.map((name) => (
          <div key={name} className="lm-section-row">
            <span className="lm-section-name">{name}</span>
            <span className="lm-badge is-private">
              <Icon name="lock" />
              Private
            </span>
          </div>
        ))}
      </section>
    </div>
  );
}

function DesktopView({ step, reduced, onAdvance }) {
  const kb = step === 3;
  return (
    <div className="lm-window">
      <TitleBar step={step} />
      <div className="lm-body">{kb ? <KnowledgeView /> : <ChatView key={step} step={step} reduced={reduced} />}</div>
      {!kb && <Composer ready={step === 0} onSend={onAdvance} />}
    </div>
  );
}

// The gateway's phone page: its top bar with the PC pill, the wake card, the
// chat and the composer. The three route nodes above show where the message is.
function PhoneView({ reduced }) {
  const phase = usePhoneScript(reduced);
  const typed = useTyped(PHONE_ANSWER, phase >= 2, reduced);
  const pc = [
    { state: "asleep", label: "PC asleep" },
    { state: "waking", label: "Waking your PC" },
    { state: "online", label: "PC online" },
    { state: "online", label: "PC online" },
    { state: "asleep", label: "PC asleep" },
  ][phase];

  const card = [
    "Asleep · Wake-on-LAN ready",
    "Wake-on-LAN packet sent",
    "Answering from the PC",
    "Turns off after 10 min without activity",
    "Switched off after 10 min idle",
  ][phase];

  const node = phase === 0 ? 0 : phase === 1 ? 1 : 2;
  // Only the phone and the PC are tour targets; the gateway is part of the route.
  const nodes = [
    { name: "Phone", tour: "node-phone" },
    { name: "Gateway" },
    { name: "GPU PC", tour: "node-pc" },
  ];

  return (
    <div className="lm-phone-stage">
      <ol className="lm-nodes" aria-label="Route to the PC">
        {nodes.map((item, i) => (
          <li key={item.name} className={`lm-node${i === node ? " is-active" : ""}`} data-tour={item.tour}>
            {item.name}
          </li>
        ))}
      </ol>

      <div className="lm-phone">
        <header className="lm-phone-top">
          <span className="lm-phone-menu" aria-hidden="true">
            <Icon name="menu" />
          </span>
          <span className="lm-phone-title">Barclays · graduate analyst</span>
          <span className={`lm-pcpill is-${pc.state}`} data-tour="pc-pill">
            <span className="lm-dot" aria-hidden="true" />
            {pc.label}
          </span>
        </header>

        <div className={`lm-job is-${pc.state}`}>
          <span className="lm-job-detail">{card}</span>
          <span className={`lm-meter-wide${phase === 3 ? "" : " is-off"}`} aria-hidden="true">
            <span />
          </span>
          <ol className={`lm-steps${phase >= 1 && phase <= 2 ? "" : " is-off"}`}>
            <li className={phase >= 2 ? "is-done" : "is-now"}>Wake PC</li>
            <li className={phase >= 2 ? "is-now" : ""}>Deliver</li>
            <li className={phase >= 2 ? "is-now" : ""}>Answer</li>
          </ol>
        </div>

        <div className="lm-phone-thread">
          {phase >= 1 && <div className="lm-user">Any news from Barclays about the interview?</div>}
          {phase >= 2 && (
            <div className="lm-bot">
              {typed}
              {typed.length < PHONE_ANSWER.length && <span className="lm-caret" aria-hidden="true" />}
            </div>
          )}
        </div>

        <div className="lm-composer lm-composer--phone">
          <div className="lm-composer-card">
            <p className="lm-input">
              {phase === 0 ? "Any news from Barclays about the interview?" : <span className="lm-placeholder">Message LocalMind…</span>}
            </p>
            <span className="lm-send" aria-hidden="true">
              <Icon name="send" />
            </span>
          </div>
          <div className="lm-options" aria-hidden="true">
            <span className="lm-chip">Model</span>
            <span className="lm-chip">Web</span>
            <span className="lm-chip">Knowledge</span>
            <span className="lm-chip">Queue tasks</span>
            <span className="lm-chip">Thinking</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// The walkthrough shell passes the step; the demo root carries the palette as
// its own custom properties, so the site's Colour menu cannot reach it.
export default function LocalMindDemo({ step, reducedMotion, onAdvance }) {
  const isPhone = step === steps.length - 1;
  return (
    <div className="lm-demo" data-step={steps[step].id}>
      {isPhone ? (
        <PhoneView reduced={reducedMotion} />
      ) : (
        <DesktopView step={step} reduced={reducedMotion} onAdvance={onAdvance} />
      )}
    </div>
  );
}
