import "./PoseidonPanels.css";

// The three panel scenes of the Poseidon demo: the ship window, the Review list and Model Lab, as miniatures of the
// shipped panels (windows/ShipCard.tsx, review/ReviewPanel.tsx, lab/). PoseidonDemo draws the shell and map behind them.
// Honesty beats fidelity here: the shipped card's percentages and "80% chance" wording are replaced by an order with
// reasons and "80% circle", every ship is synthetic, and the figures are the README's. No named champion is shown,
// because the shipped Lab records at least one champion as promoted by hand.

const at = (ms) => ({ "--d": `${ms}ms` });

function Field({ label, value, ms }) {
  return (
    <div className="pd-sw-field pd-pn-rise" style={at(ms)}>
      <span className="pd-sw-label">{label}</span>
      <span className="pd-sw-value">{value}</span>
    </div>
  );
}

export function WindowScene() {
  return (
    <div className="pd-pn pd-pn-window">
      <div className="pd-lead pd-pn-wipe" style={at(650)}>
        <i className="pd-lead-line" />
        <i className="pd-lead-dot" />
      </div>
      <div className="pd-sw pd-pn-pop" style={at(350)}>
        <div className="pd-sw-bar">
          <i className="pd-sw-grip" />
          <span className="pd-sw-name">SYN 4821</span>
          <span className="pd-sw-btn">–</span>
          <span className="pd-sw-btn">×</span>
        </div>
        <div className="pd-sw-card">
          <div className="pd-sw-col">
            <span className="pd-sw-chip pd-pn-rise" style={at(700)}>
              No AIS
            </span>
            <p className="pd-sw-sub pd-pn-rise" style={at(800)}>
              Cargo · Class A · MMSI 000 004 821 · 183 m
            </p>
            <p className="pd-sw-route pd-pn-rise" style={at(900)}>
              <span>
                <b>From</b> Helsinki, FI (left 08:40Z)
              </span>
              <span>
                → <b>To</b> "ILLUSTRATIVE" (reported)
              </span>
            </p>
            <div className="pd-sw-timer pd-pn-rise" style={at(1050)}>
              <span className="pd-sw-clock">06:00:09</span>
              <span className="pd-sw-caption">since last AIS 11:37Z · AISStream, low</span>
            </div>
          </div>
          <div className="pd-sw-col">
            <div className="pd-sw-grid">
              <Field label="Last speed" value="12.4 kn" ms={1250} />
              <Field label="Last heading" value="207°" ms={1350} />
              <Field label="Ships heard nearby" value="9 within 20 km" ms={1450} />
              <Field label="Estimated position now · route-dma90-v2" value="80% circle 55 km · 6 h 00 min since last heard" ms={1550} />
              <div className="pd-sw-gaps">
                <Field label="Past silent gaps" value="2 in 7 days" ms={1650} />
              </div>
            </div>
            <p className="pd-sw-note pd-pn-rise" style={at(1900)}>
              <b>Go-dark order:</b> rank 1 · raised by no AIS now, reception normal nearby, silent gap in the last 24 h
            </p>
            <div className="pd-sw-actions pd-pn-rise" style={at(2150)}>
              <span className="pd-btn">Brief me</span>
              <span className="pd-btn is-filled">Add to review</span>
            </div>
            <p className="pd-sw-caption pd-pn-rise" style={at(2300)}>
              Track: last 24 h
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// The first row is on the shared list, so it has a status (`was` changes to `status`); the rest are System entries.
const REVIEW = [
  { name: "SYN 4821", type: "Cargo", timer: "No AIS 06:00:09", dark: true, codes: ["OPEN_GAP", "HIGH_FORECAST"], status: "Reviewed", was: "Open" },
  { name: "SYN 2611", type: "Tanker", timer: "AIS 00:00:04", codes: ["HIGH_FORECAST", "RECENT_GAP"] },
  { name: "SYN 7524", type: "Passenger", timer: "AIS 00:00:09", codes: ["DRAUGHT_JUMP", "BLANK_DESTINATION"] },
];

function ReviewRow({ row, rank }) {
  const ms = 500 + rank * 260;
  return (
    <li className={`pd-rv-item pd-pn-rise${row.dark ? " is-noais" : ""}`} style={at(ms)}>
      <span className="pd-rv-head">
        <span className="pd-rv-name">
          <b>{row.name}</b>
          <span>{row.type}</span>
        </span>
        <span className="pd-rv-timer">{row.timer}</span>
        <i className="pd-rv-pick" />
      </span>
      <span className="pd-rv-risk">
        <b>#{rank}</b>
        <span>
          Go-dark order · rank {rank}
          <small>Model estimate for ranking, not a guarantee</small>
        </span>
      </span>
      <span className="pd-rv-codes">
        {!row.status && <span className="pd-rv-sys">System</span>}
        {row.codes.map((code) => (
          <span className="pd-chip" key={code}>
            {code}
          </span>
        ))}
      </span>
      <span className="pd-rv-actions">
        {row.status ? (
          <span className="pd-rv-status">
            {row.status}
            <span className="pd-rv-was" style={at(2900)}>
              {row.was}
            </span>
          </span>
        ) : (
          <span className="pd-btn">Add</span>
        )}
        <span className="pd-btn">Focus on map</span>
        <span className="pd-btn">{row.status ? "Remove" : "Dismiss"}</span>
      </span>
    </li>
  );
}

export function ReviewScene() {
  return (
    <div className="pd-pn pd-pn-review">
      <div className="pd-rv pd-pn-drop" style={at(200)}>
        <div className="pd-rv-title">
          <h3>Review</h3>
          <span className="pd-btn">
            Close <kbd>Esc</kbd>
          </span>
        </div>
        <p className="pd-rv-banner">A flag is a prompt to review, not an accusation.</p>
        <ul className="pd-rv-list">
          {REVIEW.map((row, i) => (
            <ReviewRow key={row.name} row={row} rank={i + 1} />
          ))}
        </ul>
        <div className="pd-rv-brief">
          <span>Tick ships to compare or brief</span>
          <span className="pd-rv-brief-actions">
            <span className="pd-btn is-off">Compare</span>
            <span className="pd-btn is-filled is-off">Brief ships</span>
          </span>
        </div>
        <p className="pd-rv-foot">Prospective test running…</p>
      </div>
    </div>
  );
}

const STEPS = ["New data", "Gemini proposes", "Train", "Judge on frozen test", "Promote / reject", "Live grading"];

function Stat({ value, label, ms, weak = false }) {
  return (
    <span className={`pd-lab-stat pd-pn-rise${weak ? " is-weak" : ""}`} style={at(ms)}>
      <b>{value}</b>
      <span>{label}</span>
    </span>
  );
}

export function LabScene() {
  return (
    <div className="pd-pn pd-lab">
      <header className="pd-lab-head">
        <h3>Model Lab</h3>
      </header>
      <div className="pd-lab-cols">
        <section className="pd-lab-col">
          <p className="pd-lab-name">Route</p>
          <p className="pd-lab-q">Predicting the path of a dark vessel</p>
          <p className="pd-lab-basis">Skill against dead reckoning, on our own feed</p>
          <div className="pd-lab-stats">
            <Stat value="0.141" label="at 1 h" ms={300} />
            <Stat value="0.400" label="at 3 h" ms={450} />
            <Stat value="0.515" label="at 6 h" ms={600} />
          </div>
        </section>
        <section className="pd-lab-col">
          <p className="pd-lab-name">
            Go-dark <span className="pd-chip pd-lab-weak">Weak, and labelled so</span>
          </p>
          <p className="pd-lab-q">Predicting which ships go dark</p>
          <p className="pd-lab-basis">Ranking only, and shown as an order</p>
          <div className="pd-lab-stats">
            <Stat value="0.59" label="AUC at 1 h" ms={800} weak />
            <Stat value="0.63" label="AUC at 6 h" ms={950} weak />
            <Stat value="~2×" label="how often the top 10% went dark within 6 h, against average" ms={1100} weak />
          </div>
        </section>
      </div>
      <ol className="pd-lab-pipe">
        {STEPS.map((step, i) => (
          <li key={step}>
            <span>{step}</span>
            <i className="pd-lab-lit" style={at(1500 + i * 280)} />
          </li>
        ))}
      </ol>
      <div className="pd-lab-rule pd-pn-rise" style={at(3300)}>
        <p className="pd-section-label">The frozen test</p>
        <p className="pd-lab-sentence">A challenger faces a frozen held-out set, and a fixed rule judges it. The current go-dark champion was promoted by hand, to give the live predictor a model to run.</p>
        <p className="pd-lab-small">Frozen forecasts are later graded against what happened.</p>
      </div>
    </div>
  );
}
