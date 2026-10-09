import { useEffect, useState } from "react";
import "./LocalMindDemo.css";

// The LocalMind walkthrough, redrawn from the app's own screens (ui/app.py,
// ui/render.py and the gateway's phone app). Every value is made up and local.
export const steps = [
  {
    id: "home",
    title: "Home screen",
    caption:
      "Chats sit on the left. The top bar reads VRAM, GPU use and how much context is left before the model runs out of room.",
  },
  {
    id: "advert",
    title: "Paste a job advert",
    caption: "Paste the advert and ask for the CV to be tailored. Sending it starts the tool loop.",
  },
  {
    id: "tools",
    title: "Tool calls",
    caption:
      "The model searches only the sections this chat can see, opens the original cv.tex, writes the new file and compiles it. Each call shows what it did.",
  },
  {
    id: "answer",
    title: "Answer and PDF",
    caption: "The answer streams in British English, says what changed, and the compiled PDF is offered as a download.",
  },
  {
    id: "kb",
    title: "Knowledge base",
    caption:
      "Shared sections, such as the general CV, are searchable from every chat. A private section, like one employer's material, is only searchable from chats scoped to it.",
  },
  {
    id: "phone",
    title: "From my phone",
    caption:
      "The PC is asleep. A message from the phone wakes it with a Wake-on-LAN packet, the answer streams back, and the PC switches itself off after ten idle minutes.",
  },
];

// Context in thousands of tokens and GPU use, per step, for the top bar.
const CONTEXT_K = [1.1, 1.1, 4.9, 8.4, 8.4, 8.4];
const GPU_PCT = [0, 0, 86, 64, 0, 0];
const CONTEXT_WINDOW_K = 46;

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

const FONTS = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap";

// Lucide-style strokes, the same set that theme.py draws as CSS masks.
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
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </>
  ),
  send: <path d="M12 19V5M5 12l7-7 7 7" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  globe: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20" />
    </>
  ),
  mic: (
    <>
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <path d="M12 19v3" />
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

function Readout({ label, value }) {
  return (
    <span className="lm-pill">
      <b>{label}</b> {value}
    </span>
  );
}

function Sidebar({ view, chatting }) {
  return (
    <aside className="lm-sidebar" aria-hidden="true">
      <div className="lm-brand">
        <span className="lm-mark">LM</span>
        <span className="lm-brand-name">LocalMind</span>
      </div>
      <div className="lm-new">
        <Icon name="plus" />
        New chat
      </div>
      <div className="lm-filter">Search chats</div>
      <div className="lm-convs">
        {CHATS.map((chat, i) => (
          <div key={chat} className={`lm-conv${i === 0 && chatting ? " is-active" : ""}`}>
            {chat}
          </div>
        ))}
      </div>
      <nav className="lm-nav">
        {NAV.map((item) => (
          <div key={item.id} className={`lm-nav-item${item.id === (view === "kb" ? "kb" : "chat") ? " is-active" : ""}`}>
            <Icon name={item.icon} />
            {item.label}
          </div>
        ))}
      </nav>
    </aside>
  );
}

// Wide frames get the desktop top bar with three readouts. Narrow frames get
// the phone app's single bar (menu, title, PC pill) and one compact readout line.
function TopBar({ step, title }) {
  const used = CONTEXT_K[step];
  const left = CONTEXT_WINDOW_K - used;
  return (
    <>
      <header className="lm-top lm-top--wide">
        <h2 className="lm-title">{title}</h2>
        <span className="lm-model">Qwen3-VL 8B · bf16</span>
        <div className="lm-readouts">
          <Readout label="VRAM" value="13.1 / 16 GB" />
          <Readout label="GPU" value={`${GPU_PCT[step]}%`} />
          <Readout label="Context" value={`${used.toFixed(1)}K / ${CONTEXT_WINDOW_K}K · ${left.toFixed(1)}K left`} />
        </div>
      </header>
      <header className="lm-top lm-top--narrow">
        <span className="lm-menu">
          <Icon name="menu" />
        </span>
        <h2 className="lm-title">{title}</h2>
        <span className="lm-pcpill is-online">
          <i aria-hidden="true" />
          PC online
        </span>
      </header>
      <p className="lm-compact">
        VRAM 13.1/16 · GPU {GPU_PCT[step]}% · Ctx {used.toFixed(1)}K/{CONTEXT_WINDOW_K}K
      </p>
    </>
  );
}

// The option chips under the composer, with the labels the app shows
// (app.py: Web search, Knowledge base, Thinking, Voice).
function ChipRow({ step }) {
  return (
    <div className="lm-chips" aria-hidden="true">
      <span className="lm-chip lm-chip--model">Qwen3-VL 8B ▾</span>
      <span className="lm-chip">
        <Icon name="globe" />
        Web search
      </span>
      <span className={`lm-chip${step >= 2 ? " is-on" : ""}`}>
        <Icon name="book" />
        Knowledge base
      </span>
      <span className="lm-chip">
        <Icon name="spark" />
        Thinking
      </span>
      <span className="lm-chip">
        <Icon name="mic" />
        Voice
      </span>
    </div>
  );
}

function ToolPanel({ icon, title, meta, children }) {
  return (
    <div className="lm-tool">
      <div className="lm-tool-head">
        <span className="lm-tool-title">
          {icon} {title}
        </span>
        <span className="lm-tool-meta">{meta}</span>
      </div>
      {children && <div className="lm-tool-body">{children}</div>}
    </div>
  );
}

function ChatView({ step, reduced, onAdvance }) {
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
      {step === 1 && <p className="lm-hint">New chat · scoped to Barclays</p>}
      {sentAdvert && (
        <div className="lm-bubble lm-bubble--user">
          <p>Here's the advert for the Barclays role, pasted below. Tailor my CV to it, keep it to two pages and British English. Save it as cv-barclays.tex and compile it.</p>
          <p className="lm-advert">{ADVERT}</p>
        </div>
      )}
      {step >= 2 && (
        <>
          <ToolPanel icon="📚" title="knowledge_search · graduate analyst, data engineering" meta="0.4 s">
            <p>Scope: <b>General CV</b> (shared). The Barclays section is not in this chat's scope.</p>
            <p className="lm-quote">CV · general · Experience: built and tested Python data pipelines, reproducible splits</p>
          </ToolPanel>
          <ToolPanel icon="📂" title="open_document · cv.tex" meta="original · 214 lines">
            <p>Opened the .tex original, not retrieved fragments.</p>
          </ToolPanel>
          <ToolPanel icon="✏️" title="write_file · cv-barclays.tex" meta="+2 −2 lines">
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
          <ToolPanel icon="🧾" title="compile_latex · cv-barclays.tex" meta="2 pages · 212 KB">
            <p>Typeset with the TeX already installed on the PC.</p>
          </ToolPanel>
        </>
      )}
      {step >= 3 && (
        <div className="lm-bubble lm-bubble--model">
          <p>
            {typed}
            {typed.length < ANSWER.length && <span className="lm-caret" aria-hidden="true" />}
          </p>
          {typed.length === ANSWER.length && (
            <span className="lm-file">
              <Icon name="download" />
              cv-barclays.pdf · 212 KB
            </span>
          )}
        </div>
      )}
      {step === 1 && <p className="lm-hint">Advert pasted. Send to start the tool loop.</p>}
    </div>
  );
}

function Composer({ step, onAdvance }) {
  // The advert is pasted in on step 1; sending it is the in-demo interaction.
  // Send stays focusable when it is not live (aria-disabled), so keyboard
  // focus never drops to the page.
  const ready = step === 1;
  const draft = ready ? "Tailor my CV to this advert…" : "";
  const send = () => {
    if (ready) onAdvance();
  };
  return (
    <div className="lm-composer">
      <div className="lm-composer-row">
        <div className="lm-input">{draft || <span className="lm-placeholder">Message LocalMind…</span>}</div>
        <button
          type="button"
          className="lm-send"
          aria-label={ready ? "Send the advert to tailor the CV" : "Send"}
          aria-disabled={!ready}
          onClick={send}
        >
          <Icon name="send" />
        </button>
      </div>
      <ChipRow step={step} />
    </div>
  );
}

function KnowledgeView() {
  const sections = [
    { name: "General CV", docs: "cv.tex, 3 PDFs, 2 references", shared: true },
    { name: "Study notes", docs: "14 documents", shared: true },
    { name: "Barclays", docs: "job pack, 4 documents", shared: false },
    { name: "STMicroelectronics", docs: "placement reports, 9 documents", shared: false },
  ];
  return (
    <div className="lm-kb">
      <p className="lm-kb-sub">Sections decide which chats can see a document. Shared sections reach every chat.</p>
      <ul className="lm-kb-list">
        {sections.map((section) => (
          <li key={section.name} className="lm-kb-row">
            <span className="lm-kb-name">{section.name}</span>
            <span className="lm-kb-docs">{section.docs}</span>
            <span className={`lm-badge${section.shared ? " is-shared" : ""}`}>
              {!section.shared && <Icon name="lock" />}
              {section.shared ? "Shared" : "Private"}
            </span>
          </li>
        ))}
      </ul>
      <p className="lm-kb-scope">
        This chat can search: <b>General CV</b>, <b>Barclays</b>
      </p>
    </div>
  );
}

function DesktopView({ step, reduced, onAdvance }) {
  const view = step === 4 ? "kb" : "chat";
  const title = view === "kb" ? "Knowledge base" : step === 0 ? "New chat" : "Barclays · graduate analyst";
  return (
    <div className="lm-app">
      <Sidebar view={view} chatting={step > 0 && view === "chat"} />
      <div className="lm-main">
        <TopBar step={step} title={title} />
        <div className="lm-body">
          {view === "kb" ? <KnowledgeView /> : <ChatView key={step} step={step} reduced={reduced} onAdvance={onAdvance} />}
        </div>
        {view === "chat" && <Composer step={step} onAdvance={onAdvance} />}
      </div>
    </div>
  );
}

// The gateway's phone page: a PC status card, the chat, and the composer.
// The three nodes above it show where the message is in the chain.
function PhoneView({ reduced }) {
  const phase = usePhoneScript(reduced);
  const typed = useTyped(PHONE_ANSWER, phase >= 2, reduced);
  const pcState = [
    { dot: "is-asleep", label: "PC asleep" },
    { dot: "is-waking", label: "Waking your PC" },
    { dot: "is-online", label: "PC online" },
    { dot: "is-online", label: "PC online" },
    { dot: "is-asleep", label: "PC asleep" },
  ][phase];

  const cardText = [
    "Asleep · Wake-on-LAN ready",
    "Wake-on-LAN packet sent",
    "Answering from the PC",
    "Turns off after 10 min without activity",
    "Switched off after 10 min idle",
  ][phase];

  const node = phase === 0 ? 0 : phase === 1 ? 1 : 2;

  return (
    <div className="lm-phone-stage">
      <ol className="lm-nodes" aria-label="Route to the PC">
        {["Phone", "Gateway", "GPU PC"].map((name, i) => (
          <li key={name} className={`lm-node${i === node ? " is-active" : ""}`}>
            {name}
          </li>
        ))}
      </ol>

      <div className="lm-phone">
        <header className="lm-phone-top">
          <span className="lm-mark">LM</span>
          <span className="lm-phone-title">Barclays · graduate analyst</span>
          <span className={`lm-pcpill ${pcState.dot}`}>
            <i aria-hidden="true" />
            {pcState.label}
          </span>
        </header>

        <div className={`lm-pccard ${pcState.dot}`}>
          <span className="lm-pccard-text">{cardText}</span>
          {phase === 3 && (
            <div className="lm-meter" aria-hidden="true">
              <i />
            </div>
          )}
          {phase >= 1 && phase <= 2 && (
            <ol className="lm-stages">
              <li className={phase >= 2 ? "is-done" : "is-now"}>Wake PC</li>
              <li className={phase >= 2 ? "is-now" : ""}>Deliver</li>
              <li className={phase >= 2 ? "is-now" : ""}>Answer</li>
            </ol>
          )}
        </div>

        <div className="lm-phone-thread">
          {phase >= 1 && <div className="lm-bubble lm-bubble--user">Any news from Barclays about the interview?</div>}
          {phase >= 2 && (
            <div className="lm-bubble lm-bubble--model">
              {typed}
              {typed.length < PHONE_ANSWER.length && <span className="lm-caret" aria-hidden="true" />}
            </div>
          )}
        </div>

        <div className="lm-composer lm-composer--phone">
          <div className="lm-composer-row">
            <div className="lm-input" aria-hidden="true">
              {phase === 0 ? "Any news from Barclays about the interview?" : <span className="lm-placeholder">Message LocalMind…</span>}
            </div>
            <span className="lm-send" aria-hidden="true">
              <Icon name="send" />
            </span>
          </div>
          <div className="lm-chips" aria-hidden="true">
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

// The walkthrough shell passes the step; every demo root carries the palette
// as its own custom properties so nothing leaks in or out.
export default function LocalMindDemo({ step, reducedMotion, onAdvance }) {
  useEffect(() => {
    if (document.getElementById("lm-demo-fonts")) return;
    const link = document.createElement("link");
    link.id = "lm-demo-fonts";
    link.rel = "stylesheet";
    link.href = FONTS;
    document.head.appendChild(link);
  }, []);

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
