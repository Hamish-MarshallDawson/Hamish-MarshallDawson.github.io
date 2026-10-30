import "./CodeForGoodDemo.css";

// The West Lothian 50+ Network platform (Code for Good hackathon) as seven self-animating scenes,
// each a miniature of a real screen from the team's demo video: the member survey in its phone frame,
// and the staff screens with their navy header and left navigation. Colours, lines and radii are the
// app's own tokens. The player owns the scene index, the caption and the progress dots. Each scene
// animates itself in CSS: entrance delays are custom properties, and `.is-paused` on the root freezes
// them. There are no JS timers. With `.is-still` (reduced motion) nothing animates and each scene shows
// its end state: a later screen is a layer drawn over the earlier one.
// The top 56px of the box is kept clear: the crumb sits to the left of the player's close button.
export const scenes = [
  { id: "survey", caption: "A member answers eleven questions in about five minutes", ms: 4500 },
  { id: "private", caption: "Answers are stored apart from the member's name and number", ms: 5000 },
  { id: "paper", caption: "Paper forms are photographed, read by AI, and checked by a person", ms: 4500 },
  { id: "coffee", caption: "A volunteer records a coffee chat; names are removed before anything is stored", ms: 5000 },
  { id: "feelings", caption: "Written answers are checked by staff first, then the AI reads the feeling", ms: 4500 },
  { id: "insights", caption: "Change since joining, for every member, next to the Scotland average", ms: 5000 },
  { id: "report", caption: "A report for one group or the whole Network, drafted by AI and checked against the figures", ms: 5000 },
];

const CRUMBS = [
  "Member survey · question 2",
  "Member survey, then Staff · Names and contact",
  "Staff · Paper surveys",
  "Staff · Conversations",
  "Staff · Feedback and results",
  "Staff · Insights",
  "Staff · Reports",
];

// Entrance delay for one element, as the CSS custom property the keyframes read.
const at = (ms) => ({ "--d": `${ms}ms` });

const ICONS = {
  home: "M3 11l9-7 9 7M5 10v10h14V10",
  id: "M3 5h18v14H3zM6 10h5M6 14h5M14 10h4M14 14h4",
  chart: "M5 20v-8M12 20V5M19 20v-11",
  clip: "M9 3h6v3H9zM7 4H5v17h14V4h-2M9 11h6M9 15h6",
  trend: "M3 17l6-6 4 4 8-8",
  eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 100 6 3 3 0 000-6z",
  phone: "M5 3h4l2 5-3 2a12 12 0 006 6l2-3 5 2v4a2 2 0 01-2 2A18 18 0 013 5a2 2 0 012-2z",
  user: "M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0",
  lock: "M6 11h12v10H6zM8 11V7a4 4 0 018 0v4",
  check: "M5 12l5 5 9-10",
  info: "M12 3a9 9 0 110 18 9 9 0 010-18zM12 11v6M12 7v1",
  back: "M15 5l-7 7 7 7",
  chat: "M4 4h16v12H9l-5 4z",
  guide: "M8 3h8v3H8zM6 4H5v17h14V4h-1M9 11h6M9 15h6",
  smile: "M12 3a9 9 0 110 18 9 9 0 010-18zM8 14s1.5 2 4 2 4-2 4-2M9 9v.5M15 9v.5",
  menu: "M4 7h16M4 12h16M4 17h16",
  up: "M12 4l8 14H4z",
};

const Icon = ({ n }) => (
  <svg className="cg-i" viewBox="0 0 24 24" aria-hidden="true">
    <path d={ICONS[n]} />
  </svg>
);

const Logo = () => <span className="cg-logo">50+</span>;

const Help = () => (
  <p className="cg-help">
    <Icon n="phone" />
    Need help? Call us on 01506 635510
  </p>
);

// A radio row. `on` draws the selected and focused state as a layer that fades in at that delay.
function Choice({ label, on, style }) {
  return (
    <li className="cg-choice cg-in" style={style}>
      <span className="cg-rf" />
      <span>{label}</span>
      {on !== undefined && (
        <span className="cg-choice-on cg-fade" style={at(on)}>
          <span className="cg-rf" />
          <span>{label}</span>
        </span>
      )}
    </li>
  );
}

// The member side: the site's header bar, a phone showing the survey, the video's side note on wide
// boxes, and the help strip.
function Member({ side, children }) {
  return (
    <div className="cg-member">
      <p className="cg-mhead">
        <Logo />
        West Lothian 50+ Network
      </p>
      <div className="cg-stage">
        <div className="cg-phone">
          <p className="cg-phead">
            <Logo />
            <span>West Lothian 50+ Network</span>
            <span className="cg-hbtn">
              <Icon n="eye" />
              Display
            </span>
          </p>
          <div className="cg-pbody">{children}</div>
          <Help />
        </div>
        <div className="cg-side">
          <p className="cg-side-t">{side[0]}</p>
          <p>{side[1]}</p>
        </div>
      </div>
      <Help />
    </div>
  );
}

const NAV = [
  ["Home", "home"],
  ["Names and contact", "id"],
  ["Feedback and results", "chart"],
  ["Collect feedback", "clip", "group"],
  ["Paper surveys", null, "sub"],
  ["Conversations", null, "sub"],
  ["Insights", "trend", "group"],
  ["Loneliness and place", null, "sub"],
  ["Whole Network", null, "sub"],
  ["By group", null, "sub"],
  ["One member", null, "sub"],
  ["Reports", null, "sub"],
];

// The staff side: navy header with Staff, Display and Sign out, then the left navigation with the
// current page marked (a Menu bar instead on narrow boxes, as on a phone).
function Staff({ here, layer, children }) {
  return (
    <div className={`cg-staff${layer === undefined ? "" : " cg-layer cg-fade"}`} style={layer === undefined ? undefined : at(layer)}>
      <div className="cg-shead">
        <p className="cg-brand">
          <Logo />
          West Lothian 50+ Network - Staff and volunteers
        </p>
        <p className="cg-acts">
          <span className="cg-role">
            <Icon n="user" />
            Staff
          </span>
          <span className="cg-hbtn">
            <Icon n="eye" />
            Display
          </span>
          <span className="cg-hbtn">Sign out</span>
        </p>
      </div>
      <div className="cg-frame">
        <ul className="cg-nav">
          {NAV.map(([label, icon, kind]) => (
            <li key={label} className={[kind ? `is-${kind}` : "", label === here ? "is-here" : ""].join(" ").trim() || undefined}>
              {icon && <Icon n={icon} />}
              {label}
            </li>
          ))}
        </ul>
        <p className="cg-menu">
          <span className="cg-btns">
            <Icon n="menu" />
            Menu
          </span>
          {here}
        </p>
        <div className="cg-main">{children}</div>
      </div>
    </div>
  );
}

function SurveyScene() {
  return (
    <Member side={["Larger text and high contrast", "Display settings are on every screen and are remembered."]}>
      <p className="cg-back">
        <Icon n="back" />
        Back
      </p>
      <p>Question 2 of 11</p>
      <p className="cg-track" aria-hidden="true">
        <i className="cg-grow" />
      </p>
      <h3 className="cg-qt cg-in" style={at(200)}>
        How often do you feel left out?
      </h3>
      <ul className="cg-choices">
        {["Hardly ever", "Some of the time", "Often", "I would rather not say"].map((label, i) => (
          <Choice key={label} label={label} on={i === 1 ? 2200 : undefined} style={at(500 + i * 150)} />
        ))}
      </ul>
      <p className="cg-btnp cg-wide cg-in cg-press" style={at(1100)}>
        Continue
      </p>
    </Member>
  );
}

const REASONS = ["Arranging a call", "Case study follow-up", "Wellbeing check-in", "Updating details", "Other"];

function PrivateScene() {
  return (
    <>
      <Member side={["Eleven questions, about five minutes", "The same loneliness and wellbeing questions each time, so change can be measured. Any question can be skipped."]}>
        <h3 className="cg-qt">Thank you</h3>
        <p>Your answers are saved.</p>
        <p className="cg-privacy cg-in" style={at(300)}>
          Your feedback is stored separately from your name and phone number.
        </p>
        <p>If you want to withdraw your answers, contact us using the details below.</p>
        <div className="cg-hub">
          <b>Members’ Hub and Activity Centre</b>
          <span>14 George St, Bathgate EH48 1PW</span>
          <b>Tel</b>
          <u>01506 635510</u>
        </div>
      </Member>
      <Staff here="Names and contact" layer={1900}>
        <p className="cg-btns">
          <Icon n="back" />
          Back to Names and contact
        </p>
        <h3 className="cg-h1">Why are you opening this record?</h3>
        <p>Member ID WL-81162-0. The name and phone number stay hidden until you choose a reason.</p>
        <ul className="cg-choices cg-choices--staff">
          {REASONS.map((label, i) => (
            <Choice key={label} label={label} on={i === 2 ? 3600 : undefined} style={at(2300 + i * 120)} />
          ))}
        </ul>
        <p className="cg-info">
          <Icon n="lock" />
          Opening contact details is recorded in the access log.
        </p>
      </Staff>
    </>
  );
}

// Answers the AI read from the photo: question, the 0-10 box it picked, when it appears.
const READ = [
  ["5. Overall, to what extent do you feel the things you do in your life are worthwhile?", 7, 900],
  ["6. Overall, how happy did you feel yesterday?", 6, 1500],
  ["7. Overall, how anxious did you feel yesterday?", 4, 2100],
];

function PaperScene() {
  return (
    <>
      <Staff here="Paper surveys">
        <p className="cg-muted">WL-77632-8 · Baseline · form dated 21 Oct 2026</p>
        <div className="cg-info">
          <Icon n="info" />
          <p>
            <b>Draft: a computer read these answers from the photos.</b> Nothing is saved until you have checked it. Compare
            each answer with the photo and change it if it is wrong.
          </p>
        </div>
        <div className="cg-cols">
          <div className="cg-panel cg-in">
            <h4 className="cg-pt">Photos of the paper form</h4>
            <p className="cg-row">
              <span className="cg-btns cg-sm cg-on">
                <Icon n="check" />
                Page 1
              </span>
              <span className="cg-btns cg-sm">+ Zoom in</span>
              <span className="cg-btns cg-sm">− Zoom out</span>
            </p>
            <div className="cg-photo" aria-hidden="true">
              <div className="cg-sheet">
                <span className="cg-sheet-id" />
                <span className="cg-sheet-head">
                  <Logo />
                </span>
                {[0, 1, 2, 3, 4, 5].map((n) => (
                  <i key={n} className={n < 3 ? "cg-ticks" : "cg-boxes"} />
                ))}
                <span className="cg-sheet-note" />
              </div>
            </div>
          </div>
          <div className="cg-panel cg-in" style={at(300)}>
            {READ.map(([q, v, d]) => (
              <div key={q} className="cg-scaleq">
                <p className="cg-strong">{q}</p>
                <p className="cg-scale">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <span key={n}>
                      {n}
                      {n === v && (
                        <b className="cg-cell cg-fade" style={at(d)}>
                          {n}
                        </b>
                      )}
                    </span>
                  ))}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Staff>
      <Staff here="Paper surveys" layer={3200}>
        <div className="cg-saved">
          <p className="cg-saved-t">
            <Icon n="check" />
            Saved to the feedback database
          </p>
          <p className="cg-strong">The paper survey for member ID WL-77632-8 is saved.</p>
          <p>The photos have been removed from this device. They were never stored.</p>
          <span className="cg-badge cg-badge--ok">
            <Icon n="check" />
            Checked and saved
          </span>
          <p className="cg-muted">Read by openai/gpt-6-luna, prompt version 3. Checked by you.</p>
        </div>
        <p className="cg-row">
          <span className="cg-btnp">Start the next survey</span>
          <span className="cg-btns">Back to Paper surveys</span>
        </p>
        <p className="cg-link">Open this member’s feedback record</p>
      </Staff>
    </>
  );
}

const GUIDE = [
  ["Company and feeling left out", "Who do you spend time with in a normal week?"],
  ["How life feels at the moment", "How are things for you these days?"],
  ["What feels worthwhile", "What do you do that feels worth doing?"],
];

function CoffeeScene() {
  return (
    <>
      <Staff here="Conversations">
        <p>There is no time limit. Pause stops the recording until you press Carry on.</p>
        <div className="cg-cols">
          <div className="cg-panel cg-in">
            <h4 className="cg-pt cg-navy">
              <Icon n="chat" />
              Live transcript
            </h4>
            <span className="cg-badge cg-badge--draft">
              <Icon n="info" />
              Draft transcript
            </span>
            <p>No speaker labels yet. Names are removed when you finish, before anyone else reads it.</p>
            <p className="cg-transcript cg-down" style={at(600)}>
              Hello, thanks for having a coffee with me. Just for the recording, can you tell me your name? Of course. It’s
              Agnes Testwood. Lovely, thanks Agnes. So, how have things been since you started coming along to the network?
            </p>
            <p className="cg-listen">
              <span className="cg-rf" />
              Listening…
            </p>
          </div>
          <div className="cg-panel cg-in" style={at(300)}>
            <h4 className="cg-pt cg-navy">
              <Icon n="guide" />
              Guide
            </h4>
            <p>0 of 6 covered</p>
            {GUIDE.map(([t, q]) => (
              <div key={t} className="cg-gcard">
                <b>{t}</b>
                <i>Try: “{q}”</i>
                <span className="cg-btns cg-sm">
                  <span className="cg-rf" />
                  Mark as covered
                </span>
              </div>
            ))}
          </div>
        </div>
      </Staff>
      <Staff here="Conversations" layer={2700}>
        <p className="cg-link">Back to Conversations</p>
        <h3 className="cg-h1">
          Review the conversation{" "}
          <span className="cg-badge cg-badge--info">Awaiting review</span>
        </h3>
        <dl className="cg-meta">
          <div>
            <dt>Member ID</dt>
            <dd>WL-60583-8</dd>
          </div>
          <div>
            <dt>Type</dt>
            <dd>Coffee chat</dd>
          </div>
          <div>
            <dt>Date</dt>
            <dd>24 Oct 2026, 10:07</dd>
          </div>
        </dl>
        <div className="cg-safe cg-in" style={at(3400)}>
          <p className="cg-safe-t">
            <Icon n="info" />
            Safeguarding: check this first
          </p>
          <span className="cg-badge cg-badge--concern">Safeguarding: tell an admin</span>
          <p>
            <b>Why this was flagged (draft):</b> The member reports low mood since the clocks changed, skipping cooking and not
            eating properly, which affects her daily life; a staff check-in was agreed.
          </p>
          <p>Check the transcript and tell an admin now, by phone or in person. Do not wait until you finish reviewing.</p>
        </div>
        <p className="cg-row">
          <span className="cg-btns cg-sm">
            <Icon n="check" />
            1. Check the transcript (done)
          </span>
          <span className="cg-btns cg-sm cg-on">2. Check the analysis (you are here)</span>
          <span className="cg-btns cg-sm">3. Strong feelings</span>
          <span className="cg-btns cg-sm">4. Approve</span>
        </p>
        <div className="cg-panel">
          <h4 className="cg-pt">Draft summary</h4>
          <span className="cg-badge cg-badge--draft">
            <Icon n="info" />
            Draft summary: check before using
          </span>
          <p>
            The member described feeling very lonely after her husband died, but said attending the network has transformed her
            social life, with regular Tuesday contact and a warm welcome from the group.
          </p>
        </div>
      </Staff>
    </>
  );
}

// A filled or empty three-block strength meter, as the review card draws it.
const Meter = ({ n }) => (
  <span className="cg-meter" aria-hidden="true">
    {[0, 1, 2].map((i) => (
      <i key={i} className={i < n ? "is-on" : undefined} />
    ))}
  </span>
);

function FeelingsScene() {
  return (
    <Staff here="Feedback and results">
      <p>What members wrote to “What difference, if any, has the Network made to you?”</p>
      <div className="cg-cols">
        <p className="cg-db">
          <b>
            <Icon n="id" />
            Names and contact
          </b>
          <span>Names, phone numbers and consent. Kept apart from survey answers.</span>
        </p>
        <p className="cg-db cg-on">
          <b>
            <Icon n="chart" />
            <u>Feedback and results</u>
            <Icon n="check" />
          </b>
          <span>Survey answers by member ID only. No names or phone numbers.</span>
        </p>
      </div>
      <div className="cg-info cg-in" style={at(200)}>
        <Icon n="info" />
        <p>
          <b>Draft: a computer read these answers. A person checks each reading.</b> This is not a score and is not the member’s
          wellbeing or loneliness result.
        </p>
      </div>
      <div className="cg-panel cg-in" style={at(600)}>
        <p className="cg-row">
          <span className="cg-badge cg-badge--ok">
            <Icon n="smile" />
            Very positive
          </span>
          <span className="cg-badge cg-badge--draft">
            <Icon n="info" />
            Draft: check before using
          </span>
        </p>
        <p className="cg-quote">Walking with the Tuesday group gave me my confidence back. I’m [name] and I have friends again.</p>
        <dl className="cg-reading">
          <div>
            <dt>Positive feeling</dt>
            <dd>
              <Meter n={3} /> strong (3 of 3)
            </dd>
          </div>
          <div>
            <dt>Negative feeling</dt>
            <dd>
              <Meter n={0} /> none (0 of 3)
            </dd>
          </div>
          <div>
            <dt>AI summary</dt>
            <dd>Tuesday walking group restored confidence and built new friendships.</dd>
          </div>
          <div>
            <dt>Words it picked out</dt>
            <dd>“gave me my confidence back”</dd>
          </div>
        </dl>
        <p>
          <b className="cg-navy">Member WL-81162-0</b>, answered 24 Oct 2026. Not an approved quote.
        </p>
        <p className="cg-row">
          <span className="cg-btnp cg-press" style={at(2600)}>
            Approve this reading
          </span>
          <span className="cg-btns">Reject this reading</span>
        </p>
      </div>
    </Staff>
  );
}

const TILES = [
  ["146", "Members surveyed", "of 160 members (91%) answered a survey in this period."],
  ["0.5", "Change in loneliness since baseline", "points better on average. Higher is better.", true],
  ["42%", "Loneliness result, same members", "improved. 42% stayed the same, 17% lonelier."],
  ["0.6", "Change in wellbeing (ONS)", "points better on average across the 4 ONS measures.", true],
];

// Wellbeing compared with Scotland: when they joined, latest survey, Scotland (out of 10).
const COMPARE = [
  ["Life satisfaction", [6.0, 6.6, 7.6]],
  ["Things I do are worthwhile", [6.1, 6.7, 7.8]],
  ["Happy yesterday", [5.8, 6.4, 7.5]],
  ["Anxious yesterday", [4.8, 4.3, 3.3]],
];
const SERIES = ["when they joined", "latest survey", "Scotland"];

// Map clusters: count, then not lonely · may be lonely · no score, and where on the map.
const CLUSTERS = [
  ["4", "3 · ▲ 1 · – 0", 34, 34],
  ["10", "5 · ▲ 5 · – 0", 72, 38],
  ["73", "38 · ▲ 27 · – 8", 56, 58],
  ["43", "17 · ▲ 20 · – 6", 30, 72],
];

function InsightsScene() {
  return (
    <>
      <Staff here="Whole Network">
        <h3 className="cg-h1">Insights: whole Network</h3>
        <p>Results worked out automatically from every member’s surveys. Totals only: no names and no member IDs appear on this page.</p>
        <p className="cg-row">
          <span className="cg-strong">Show results for</span>
          <span className="cg-btns cg-sm">Last 6 months</span>
          <span className="cg-btns cg-sm">Last 12 months</span>
          <span className="cg-btnp cg-sm">
            <Icon n="check" />
            All time
          </span>
        </p>
        <div className="cg-tiles">
          {TILES.map(([n, label, note, up], i) => (
            <p key={label} className="cg-tile cg-in" style={at(300 + i * 150)}>
              <b>
                {up && <Icon n="up" />}
                {n}
              </b>
              <span className="cg-strong">{label}</span>
              <span>{note}</span>
            </p>
          ))}
        </div>
        <div className="cg-panel cg-in" style={at(1100)}>
          <h4 className="cg-pt">Wellbeing compared with Scotland</h4>
          <div className="cg-compare">
            {COMPARE.map(([title, values], g) => (
              <div key={title}>
                <p className="cg-strong">{title}</p>
                {values.map((v, i) => (
                  <p key={SERIES[i]} className="cg-cbar">
                    <i className={`cg-grow is-s${i}`} style={{ ...at(1500 + g * 200 + i * 100), "--v": v }} />
                    {v.toFixed(1)} {SERIES[i]}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </div>
      </Staff>
      <Staff here="Loneliness and place" layer={3300}>
        <h3 className="cg-h1">Insights: loneliness and place</h3>
        <div className="cg-panel">
          <h4 className="cg-pt">West Lothian</h4>
          <p className="cg-row">
            <span className="cg-btns">Show all West Lothian</span>
            <span>Drag or use arrow keys to pan.</span>
          </p>
          <div className="cg-map" aria-hidden="true">
            <i className="cg-area" />
            <p className="cg-zoom">
              <span>+</span>
              <span>−</span>
            </p>
            {CLUSTERS.map(([n, sub, x, y], i) => (
              <span key={n} className="cg-cluster cg-in" style={{ ...at(3700 + i * 150), left: `${x}%`, top: `${y}%` }}>
                <b>{n}</b>
                <small>● {sub}</small>
              </span>
            ))}
            <small className="cg-attr">Leaflet | © OpenStreetMap contributors</small>
          </div>
          <p className="cg-muted">Shown by data zone, never by home address.</p>
        </div>
      </Staff>
    </>
  );
}

function ReportScene() {
  return (
    <>
      <div className="cg-report">
        <p className="cg-rtop" />
        <p className="cg-rbar cg-rbar--p">Download report</p>
        <p className="cg-rbar">Print or save as PDF</p>
        <div className="cg-doc cg-in" style={at(200)}>
          <h3>Tuesday Walkers report: Last year</h3>
          <p>Period: 1 November 2025 to 24 October 2026</p>
          <p>Made on 24 October 2026 at 10:11 by c6ca3a84-c780-4344-95ae-acb0bf28096b.</p>
          <hr />
          <h4>Summary</h4>
          <p className="cg-muted">Draft written by AI from the figures below. Check it before sharing.</p>
          <p className="cg-lead cg-in" style={at(700)}>
            Members of the Tuesday Walkers group feel less lonely than when they joined, and their wellbeing has improved on all
            four measures.
          </p>
          <p className="cg-in" style={at(1200)}>
            Over the last 12 months, loneliness scores improved on average by 1.6 points. A higher score means less lonely, so this
            shows members feel less lonely than at the start. Of the 16 members with a before and after survey, 12 improved, 3
            stayed about the same and 1 got worse.
          </p>
          <p className="cg-in" style={at(1700)}>
            At the start, 10 of 16 members may have been lonely. Now, 2 of 16 members may be lonely. Wellbeing also rose on every
            measure.
          </p>
        </div>
      </div>
      <div className="cg-member cg-layer cg-fade" style={at(3000)}>
        <p className="cg-mhead">
          <Logo />
          West Lothian 50+ Network
        </p>
        <div className="cg-endc">
          <p className="cg-end-t">One record for every member</p>
          <p className="cg-muted">Feedback and impact platform · West Lothian 50+ Network · Team 2</p>
        </div>
        <Help />
      </div>
    </>
  );
}

const VIEWS = [SurveyScene, PrivateScene, PaperScene, CoffeeScene, FeelingsScene, InsightsScene, ReportScene];

// The player passes the scene index and whether it is playing. Each scene is keyed
// by its index, so it restarts from its first frame when the player moves on.
export default function CodeForGoodDemo({ scene, playing, reducedMotion }) {
  const View = VIEWS[scene];
  const classes = ["cg-demo", playing ? "" : "is-paused", reducedMotion ? "is-still" : ""].filter(Boolean).join(" ");
  return (
    <div className={classes} data-scene={scenes[scene].id} aria-hidden="true">
      <p className="cg-crumb">{CRUMBS[scene]}</p>
      <div className="cg-screen">
        <View key={scene} />
      </div>
    </div>
  );
}
