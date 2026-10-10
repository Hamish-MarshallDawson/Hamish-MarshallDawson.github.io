import { useEffect, useState } from "react";
import "./LocalMindDemo.css";

// The LocalMind walkthrough, redrawn from the app's own screens: the Gradio
// desktop app (src/localmind/ui/app.py, theme.py) and the gateway's phone page
// (gateway/localmind_gateway/static). Every value is made up and local.
//
// `tour` drives the cursor (see DemoStage). Each target is a data-tour name
// rendered inside this demo; a target that is not on screen at the current
// width (the sidebar on a narrow frame) is skipped by the tour.
export const steps = [
  {
    id: "home",
    title: "Home screen",
    caption:
      "Chats sit on the left. The top bar reads VRAM, GPU use and how much context is left before the model runs out of room.",
    tour: [
      { target: "chats", label: "Chats on this PC" },
      { target: "hud", label: "VRAM, GPU, context" },
    ],
  },
  {
    id: "advert",
    title: "Paste a job advert",
    caption: "Paste the advert and ask for the CV to be tailored. Sending it starts the tool loop.",
    tour: [
      { target: "new-chat", label: "New chat" },
      { target: "input", label: "Advert pasted", hold: 1000 },
      { target: "send", label: "Send", click: true },
    ],
  },
  {
    id: "tools",
    title: "Tool calls",
    caption:
      "The model searches only the sections this chat can see, opens the original cv.tex, writes the new file and compiles it. Each call shows what it did.",
    tour: [
      { target: "tool-search", label: "Shared sections only" },
      { target: "tool-open", label: "Opens the original" },
      { target: "tool-write", label: "Writes the new file" },
      { target: "tool-compile", label: "Compiles the PDF" },
    ],
  },
  {
    id: "answer",
    title: "Answer and PDF",
    caption: "The answer streams in British English, says what changed, and the compiled PDF is offered as a download.",
    tour: [
      { target: "answer", label: "Streams in" },
      { target: "pdf", label: "PDF offered", hold: 1800 },
    ],
  },
  {
    id: "kb",
    title: "Knowledge base",
    caption:
      "Shared sections, such as the general CV, are searchable from every chat. A private section, like one employer's material, is only searchable from chats scoped to it.",
    tour: [
      { target: "shared", label: "Any chat can search" },
      { target: "private", label: "Scoped chats only" },
    ],
  },
  {
    id: "phone",
    title: "From my phone",
    caption:
      "The PC is asleep. A message from the phone wakes it with a Wake-on-LAN packet, the answer streams back, and the PC switches itself off after ten idle minutes.",
    tour: [
      { target: "node-phone", label: "Phone" },
      { target: "node-gateway", label: "Always on" },
      { target: "node-pc", label: "Woken on message" },
      { target: "pc-pill", label: "PC state" },
    ],
  },
];

// Context in thousands of tokens and GPU use, per step, for the readouts.
const CONTEXT_K = [1.1, 1.1, 4.9, 8.4, 8.4, 8.4];
const GPU_PCT = [0, 0, 86, 64, 0, 0];
const CONTEXT_WINDOW_K = 46;
const VRAM_USED_GB = 13.1;
const VRAM_TOTAL_GB = 16;

const CHATS = ["Barclays · graduate analyst", "Rust async notes", "Gas boiler quote", "Tax return 2025"];
const NAV = [
  { id: "chat", label: "Chat", icon: "chat" },
  { id: "kb", label: "Knowledge base", icon: "book" },
  { id: "search", label: "Search documents", icon: "search" },
  { id: "tasks", label: "Tasks", icon: "tasks" },
  { id: "tools", label: "Skills & tools", icon: "tools" },
];

const ADVERT =
  "Graduate Analyst, Data Engineering. You will build and maintain Python pipelines on cloud platforms, write SQL against large datasets, and work with stakeholders to turn requirements into reliable data products.";

const ANSWER =
  "I've tailored the CV for the graduate analyst role. The summary now leads with the pipeline work, and the STMicroelectronics placement has moved above the dissertation. I've also changed “utilized” to “utilised” throughout to match British spelling. It still fits on two pages, and every new line comes from your CV or the placement notes, so nothing has been invented.";

const PHONE_ANSWER =
  "Yes. The recruiter's email came in at 09:12 with a 30-minute video interview on Thursday at 14:00. I've added it to your notes in the Barclays section.";

// The answer types out in chunks, as the app streams it.
const TYPE_TICK_MS = 22;
const TYPE_CHUNK = 3;

// Milliseconds each phone phase lasts: asleep, waking, answering, idle countdown.
const PHONE_TIMES = [1600, 1800, 2600, 2400];

// Lucide-style strokes, the same paths theme.py draws as CSS masks.
const ICONS = {
  plus: <path d="M12 5v14M5 12h14" />,
  chat: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
  book: (
    <>
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </>
  ),
  download: (
    <>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="m7 10 5 5 5-5" />
      <path d="M12 15V3" />
    </>
  ),
  tasks: (
    <>
      <path d="M9 6h11M9 12h11M9 18h11" />
      <path d="m3 6 1.5 1.5L7 5M3 12l1.5 1.5L7 11M3 18l1.5 1.5L7 17" />
    </>
  ),
  tools: (
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9z" />
  ),
  lock: (
    <>
      <rect x="4" y="11" width="16" height="10" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </>
  ),
  send: <path d="M12 19V5M5 12l7-7 7 7" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  globe: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </>
  ),
  spark: <path d="M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2z" />,
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

// A readout in the app's HUD: a label, a numeral in the pixel face, and a
// meter when the value has a ceiling. Over 80% the cell inverts, as in app.css.
function Readout({ label, numeric, pct }) {
  const level = pct === undefined ? "" : pct >= 0.8 ? " lm-hud-warm" : "";
  return (
    <span className={`lm-hud-pill${level}`}>
      <b>{label}</b>
      <span className="lm-num">{numeric}</span>
      {pct !== undefined && (
        <span className="lm-meter" aria-hidden="true">
          <i style={{ width: `${Math.min(100, pct * 100).toFixed(0)}%` }} />
        </span>
      )}
    </span>
  );
}

function Sidebar({ chatting, kb }) {
  return (
    <aside className="lm-sidebar" aria-hidden="true" data-tour="chats">
      <div className="lm-brand">
        <span className="lm-mark">LM</span>
        <span className="lm-brand-name">LocalMind</span>
      </div>
      <div className="lm-new" data-tour="new-chat">
        <Icon name="plus" />
        New chat
      </div>
      <div className="lm-filter">Search chats</div>
      <p className="lm-group-label">Recent</p>
      <div className="lm-convs">
        {CHATS.map((chat, i) => (
          <div key={chat} className={`lm-conv${i === 0 && chatting ? " is-active" : ""}`}>
            {chat}
          </div>
        ))}
      </div>
      <nav className="lm-nav">
        {NAV.map((item) => (
          <div key={item.id} className={`lm-nav-item${item.id === (kb ? "kb" : "chat") ? " is-active" : ""}`}>
            <Icon name={item.icon} />
            {item.label}
          </div>
        ))}
      </nav>
    </aside>
  );
}

// The app's readouts, ruled and pinned to the top right of the window. The
// VRAM cell is 82% of the card, so it inverts as the app does at 80%.
function Hud({ step }) {
  const used = CONTEXT_K[step];
  const left = CONTEXT_WINDOW_K - used;
  return (
    <div className="lm-hud" data-tour="hud">
      <Readout label="VRAM" numeric={`${VRAM_USED_GB}/${VRAM_TOTAL_GB}`} pct={VRAM_USED_GB / VRAM_TOTAL_GB} />
      <span className="lm-hud-pill lm-hud-gpu">
        <b>GPU</b>
        <span className="lm-num">{GPU_PCT[step]}%</span>
      </span>
      <span className={`lm-hud-pill lm-hud-ctx${used / CONTEXT_WINDOW_K >= 0.8 ? " lm-hud-warm" : ""}`}>
        <b>Context</b>
        <span className="lm-num lm-num-ctx">{used.toFixed(1)}K/{CONTEXT_WINDOW_K}K</span>
        <span className="lm-meter" aria-hidden="true">
          <i style={{ width: `${((used / CONTEXT_WINDOW_K) * 100).toFixed(0)}%` }} />
        </span>
        <b>left</b>
        <span className="lm-num lm-num-left">{left.toFixed(1)}K</span>
      </span>
    </div>
  );
}

// The app's top bar: a ruled row of cells. On a narrow frame the menu icon
// leads, the model cell drops out, and the title takes the room.
function TopBar({ step, title, chatting }) {
  const running = chatting && step === 2;
  return (
    <header className="lm-top">
      <span className="lm-menu" aria-hidden="true">
        <Icon name="menu" />
      </span>
      <span className={`lm-cell lm-cell-fill${chatting ? "" : " is-off"}`} aria-hidden={!chatting}>
        Chat
      </span>
      <h2 className="lm-cell lm-cell-title">
        <span className="lm-title">{title}</span>
      </h2>
      <span className={`lm-cell lm-model${chatting ? "" : " is-off"}`} aria-hidden={!chatting}>
        Qwen3-VL 8B <span className="lm-badge">local</span>
      </span>
      <span className={`lm-cell lm-cell-push${running ? "" : " is-off"}`} aria-hidden={!running}>
        <span className="lm-status">
          <span className="lm-dot" aria-hidden="true" />
          Running tools
        </span>
      </span>
    </header>
  );
}

// The option row under the composer, with the labels the app shows: the model
// and knowledge scope pickers, then Web, Knowledge, Queue tasks and Thinking.
function Options({ step }) {
  return (
    <div className="lm-options" aria-hidden="true">
      <span className="lm-select">Qwen3-VL 8B</span>
      <span className="lm-select">Shared + Barclays</span>
      <span className="lm-chip">
        <Icon name="globe" />
        Web
      </span>
      <span className={`lm-chip${step >= 2 ? " is-on" : ""}`}>
        <Icon name="book" />
        Knowledge
      </span>
      <span className="lm-chip">
        <Icon name="tasks" />
        Queue tasks
      </span>
      <span className="lm-chip">
        <Icon name="spark" />
        Thinking
      </span>
    </div>
  );
}

// The composer: the paste box with the Send control. Send stays focusable when
// it is not live (aria-disabled), so keyboard focus never drops to the page.
function Composer({ step, onAdvance }) {
  const ready = step === 1;
  const send = () => {
    if (ready) onAdvance();
  };
  return (
    <div className="lm-composer">
      <div className="lm-composer-card">
        {ready ? (
          <p className="lm-input" data-tour="input">
            {ADVERT}
          </p>
        ) : (
          <p className="lm-input" data-tour="input">
            <span className="lm-placeholder">Message LocalMind…</span>
          </p>
        )}
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
      <Options step={step} />
    </div>
  );
}

function ToolPanel({ icon, title, meta, tour, children }) {
  return (
    <div className="lm-panel" data-tour={tour}>
      <div className="lm-panel-head">
        <span className="lm-panel-mark" aria-hidden="true">
          –
        </span>
        <span className="lm-panel-title">
          {icon} {title}
        </span>
        <span className="lm-panel-dur">{meta}</span>
      </div>
      {children && <div className="lm-panel-body">{children}</div>}
    </div>
  );
}

function ChatView({ step, reduced }) {
  const typed = useTyped(ANSWER, step >= 3, reduced);
  const sentAdvert = step >= 2;

  if (step === 0) {
    return (
      <div className="lm-empty">
        <span className="lm-mark lm-mark--big">LM</span>
        <h3>What are we working on?</h3>
        <p>Answers come from this PC. Nothing leaves it unless you route a message to a cloud model.</p>
      </div>
    );
  }

  return (
    <div className="lm-thread">
      {step === 1 && <p className="lm-note">New chat · scoped to Barclays</p>}
      {sentAdvert && (
        <div className="lm-user">
          <p>Here's the advert for the Barclays role, pasted below. Tailor my CV to it, keep it to two pages and British English. Save it as cv-barclays.tex and compile it.</p>
          <p className="lm-advert">{ADVERT}</p>
        </div>
      )}
      {step >= 2 && (
        <>
          <ToolPanel icon="📚" title="knowledge_search · graduate analyst, data engineering" meta="0.4 s" tour="tool-search">
            <p>Scope: <b>General CV</b> (shared). The Barclays section is not in this chat's scope.</p>
            <p className="lm-quote">CV · general · Experience: built and tested Python data pipelines, reproducible splits</p>
          </ToolPanel>
          <ToolPanel icon="📂" title="open_document · cv.tex" meta="original · 214 lines" tour="tool-open">
            <p>Opened the .tex original, not retrieved fragments.</p>
          </ToolPanel>
          <ToolPanel icon="✏️" title="write_file · cv-barclays.tex" meta="+2 −2 lines" tour="tool-write">
            <pre className="lm-diff">
              <span className="lm-del">- Final-year MEng student focused on AI systems.</span>
              {"\n"}
              <span className="lm-add">+ Final-year MEng Software Engineering student building local AI pipelines.</span>
              {"\n"}
              <span className="lm-ctx">  \section{"{Experience}"}</span>
              {"\n"}
              <span className="lm-del">- \item Built and tested pipelines for analytics</span>
              {"\n"}
              <span className="lm-add">+ \item Built and tested data pipelines, with fixed splits and reproducible results</span>
            </pre>
          </ToolPanel>
          <ToolPanel icon="🧾" title="compile_latex · cv-barclays.tex" meta="2 pages · 212 KB" tour="tool-compile">
            <p>Typeset with the TeX already installed on the PC.</p>
          </ToolPanel>
        </>
      )}
      {step >= 3 && (
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
      {step === 1 && <p className="lm-note">Advert pasted. Send to start the tool loop.</p>}
    </div>
  );
}

function KnowledgeView() {
  const shared = [
    { name: "General CV", docs: "cv.tex, 3 PDFs, 2 references" },
    { name: "Study notes", docs: "14 documents" },
  ];
  const priv = [
    { name: "Barclays", docs: "job pack, 4 documents" },
    { name: "STMicroelectronics", docs: "placement reports, 9 documents" },
  ];
  return (
    <div className="lm-kb">
      <div className="lm-page-head">
        <h3>Knowledge base</h3>
        <p>Sections decide which chats can see a document. Shared sections reach every chat.</p>
      </div>
      <section className="lm-section" data-tour="shared" aria-label="Shared sections">
        <p className="lm-group-head">
          <span>Shared</span>
          <span className="lm-muted">every chat</span>
        </p>
        {shared.map((section) => (
          <div key={section.name} className="lm-section-row">
            <span className="lm-section-name">{section.name}</span>
            <span className="lm-section-docs">{section.docs}</span>
            <span className="lm-badge">Shared</span>
          </div>
        ))}
      </section>
      <section className="lm-section" data-tour="private" aria-label="Private sections">
        <p className="lm-group-head">
          <span>Private</span>
          <span className="lm-muted">scoped chats only</span>
        </p>
        {priv.map((section) => (
          <div key={section.name} className="lm-section-row">
            <span className="lm-section-name">{section.name}</span>
            <span className="lm-section-docs">{section.docs}</span>
            <span className="lm-badge is-private">
              <Icon name="lock" />
              Private
            </span>
          </div>
        ))}
      </section>
      <p className="lm-scope">
        This chat can search: <b>General CV</b>, <b>Barclays</b>
      </p>
    </div>
  );
}

function DesktopView({ step, reduced, onAdvance }) {
  const kb = step === 4;
  const chatting = !kb;
  const title = kb ? "Knowledge base" : step === 0 ? "New chat" : "Barclays · graduate analyst";
  return (
    <div className="lm-desk">
      <Hud step={step} />
      <div className="lm-app">
        <Sidebar chatting={step > 0 && chatting} kb={kb} />
        <div className="lm-main">
          <TopBar step={step} title={title} chatting={chatting} />
          <div className="lm-body">
            {kb ? <KnowledgeView /> : <ChatView key={step} step={step} reduced={reduced} />}
          </div>
          {chatting && <Composer step={step} onAdvance={onAdvance} />}
        </div>
      </div>
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
  const nodes = [
    { id: "node-phone", name: "Phone" },
    { id: "node-gateway", name: "Gateway" },
    { id: "node-pc", name: "GPU PC" },
  ];

  return (
    <div className="lm-phone-stage">
      <ol className="lm-nodes" aria-label="Route to the PC">
        {nodes.map((item, i) => (
          <li key={item.id} className={`lm-node${i === node ? " is-active" : ""}`} data-tour={item.id}>
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
            <p className="lm-input" data-tour="input">
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
