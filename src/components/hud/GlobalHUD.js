import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, LayoutGroup, motion, useIsPresent, useScroll } from "framer-motion";
import { SECTIONS } from "../../sections";
import { useDialog } from "../../hooks/useDialog";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { experience, extracurricular, isActiveRole, personal, profile, vaultProjects } from "../projectdata";
import { PALETTE, ratioOf } from "../../styles/palette";
import { Barcode } from "../shared/Barcode";
import { ArrowIcon, CloseIcon, CvIcon, ExternalIcon, GithubIcon, LinkedinIcon, MailIcon } from "../shared/Icons";
import { Clock, Fps, useOnline } from "../shared/Telemetry";
import "./GlobalHUD.css";

const snap = [0.7, 0, 0.2, 1];

// The uplinks. With no CV file configured the CV uplink opens Reach out
// with a CV request instead of pointing at nothing.
function buildUplinks(onRequestCv) {
  return [
    { id: "github", title: "GitHub", detail: "Source repositories", href: profile.github, Icon: GithubIcon, external: true },
    { id: "linkedin", title: "LinkedIn", detail: "Professional record", href: profile.linkedin, Icon: LinkedinIcon, external: true },
    profile.cv
      ? { id: "cv", title: "CV", detail: "Download PDF", href: profile.cv, Icon: CvIcon, download: true }
      : { id: "cv", title: "CV", detail: "On request", href: "#reach-out", Icon: CvIcon, onActivate: onRequestCv },
  ];
}

// What each index row reports in its status column, all read from the data.
function buildStatus() {
  const active = experience.filter((job) => isActiveRole(job)).length;
  return {
    core: "Top of file",
    vault: `${vaultProjects.length} files`,
    work: active ? `Active [${active}/${experience.length}]` : `${experience.length} entries`,
    volunteer: `${extracurricular.length} records`,
    offline: `${personal.length} entries`,
    "reach-out": "Open",
  };
}

function Uplink({ link, className, onActivate, children }) {
  const { title, detail, href, external, download } = link;
  const activate = onActivate ?? link.onActivate;
  return (
    <a
      className={className}
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      download={download ? "" : undefined}
      aria-label={`${title}: ${detail}${external ? " (opens in a new tab)" : ""}`}
      onClick={
        activate
          ? (event) => {
              event.preventDefault();
              activate();
            }
          : undefined
      }
    >
      {children}
    </a>
  );
}

/* ---------- scroll tape: progress under the header row ---------- */

function ScrollTape() {
  const { scrollYProgress } = useScroll();
  const [ticks, setTicks] = useState([]);

  useEffect(() => {
    const measure = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setTicks(
        SECTIONS.map((section) => {
          const el = document.getElementById(section.id);
          if (!el || max <= 0) return 0;
          return Math.min(1, (el.getBoundingClientRect().top + window.scrollY) / max);
        })
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(document.body);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="tape" aria-hidden="true">
      <motion.span className="tape-fill" style={{ scaleX: scrollYProgress }} />
      {ticks.map((at, i) => (
        <span key={SECTIONS[i].id} className="tape-tick" style={{ left: `${at * 100}%` }} />
      ))}
    </div>
  );
}

/* ---------- header row: mark, where you are, colour, index ---------- */

// Navigation lives in the Index drop-down; the bar itself only says where
// you are. The readout rolls over like a split-flap cell when the section
// changes. Colour opens the palette; its swatch is always the live colour.
function SiteBar({ active, panel, onToggle, indexRef, colourRef }) {
  const indexOpen = panel === "index";
  const colourOpen = panel === "colour";
  const current = SECTIONS.find((section) => section.id === active) ?? SECTIONS[0];
  const position = SECTIONS.indexOf(current) + 1;
  return (
    <header className="bar">
      <a className="bar-mark" href="#core" aria-label="Back to top">
        <span aria-hidden="true">HMD</span>
      </a>

      <p className="bar-readout" aria-hidden="true">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={current.id}
            className="bar-readout-roll"
            initial={{ y: "110%" }}
            animate={{ y: "0%" }}
            exit={{ y: "-110%" }}
            transition={{ duration: 0.16, ease: snap }}
          >
            <span className="bar-code" data-alert={current.alert || undefined}>
              {current.code}
            </span>
            <span className="bar-label">{current.label}</span>
            <span className="bar-hint">{current.hint}</span>
          </motion.span>
        </AnimatePresence>
        <span className="bar-count">
          {String(position).padStart(2, "0")}/{String(SECTIONS.length).padStart(2, "0")}
        </span>
      </p>

      <Clock className="bar-clock" />

      <button
        ref={colourRef}
        type="button"
        className="bar-colour"
        aria-label="Colour"
        aria-expanded={colourOpen}
        aria-controls="site-colour"
        aria-haspopup="dialog"
        onClick={() => onToggle("colour")}
      >
        <span className="bar-swatch" aria-hidden="true" />
        <span className="bar-colour-label" aria-hidden="true">
          Colour
        </span>
      </button>

      <button
        ref={indexRef}
        type="button"
        className="bar-index"
        aria-expanded={indexOpen}
        aria-controls="site-index"
        aria-haspopup="dialog"
        onClick={() => onToggle("index")}
      >
        Index
        <ArrowIcon direction={indexOpen ? "up" : "down"} className="bar-index-glyph" />
      </button>

      <ScrollTape />
    </header>
  );
}

/* ---------- the drop-down index ---------- */

const rows = {
  hidden: {},
  show: { transition: { staggerChildren: 0.035, delayChildren: 0.12 } },
};
const row = {
  hidden: { y: -14 },
  show: { y: 0, transition: { duration: 0.28, ease: snap } },
};

function IndexPanel({ active, navigate, uplinks, fx, onToggleFx, onClose, returnFocusRef }) {
  // The panel stays mounted while its exit wipe plays; dropping the dialog
  // plumbing as soon as it starts leaving releases the scroll lock and
  // hands focus back straight away.
  const present = useIsPresent();
  const panelRef = useDialog(present, onClose, returnFocusRef);
  const online = useOnline();
  const [status] = useState(buildStatus);

  // Close first so the scroll lock is released, then travel.
  const closeThen = (action) => {
    onClose();
    requestAnimationFrame(action);
  };

  return (
    <>
      <motion.div
        key="scrim"
        className="index-scrim"
        onClick={onClose}
        initial={{ clipPath: "inset(0% 0% 100% 0%)" }}
        animate={{ clipPath: "inset(0% 0% 0% 0%)", transition: { duration: 0.3, ease: snap } }}
        exit={{ clipPath: "inset(100% 0% 0% 0%)", transition: { duration: 0.24, ease: snap } }}
      />
      <motion.div
        key="panel"
        id="site-index"
        ref={panelRef}
        className="index surface-paper"
        role="dialog"
        aria-modal="true"
        aria-labelledby="site-index-title"
        initial={{ clipPath: "inset(0% 0% 100% 0%)" }}
        animate={{ clipPath: "inset(0% 0% -6% 0%)", transition: { duration: 0.42, ease: snap } }}
        exit={{ clipPath: "inset(0% 0% 100% 0%)", transition: { duration: 0.26, ease: snap } }}
      >
        <div className="index-brand surface-signal">
          <p className="index-name" aria-hidden="true">
            {profile.name.split(" ").map((word) => (
              <span key={word}>{word}</span>
            ))}
          </p>
          <div className="index-brand-foot">
            <p className="u-micro">
              {profile.role}
              <br />
              {profile.location}
            </p>
            <Barcode value="HMD-2026" className="index-barcode" />
          </div>
        </div>

        <div className="index-body">
          <div className="cells u-micro index-head">
            <h2 id="site-index-title" className="cell cell--fill index-title">
              Site index
            </h2>
            <span className="cell">{SECTIONS.length} sections</span>
            <span className="cell cell--push index-clock">
              <Clock />
            </span>
            <button type="button" className="cell index-close" onClick={onClose}>
              Close <CloseIcon className="index-close-glyph" />
            </button>
          </div>

          <nav aria-label="Index">
            <LayoutGroup id="index">
              <motion.ol className="index-rows" variants={rows} initial="hidden" animate="show">
                {SECTIONS.map((section) => {
                  const on = active === section.id;
                  return (
                    <motion.li key={section.id} variants={row}>
                      <a
                        href={`#${section.id}`}
                        className="index-row"
                        data-alert={section.alert || undefined}
                        aria-current={on ? "true" : undefined}
                        data-autofocus={on || undefined}
                        onClick={(event) => {
                          event.preventDefault();
                          closeThen(() => navigate(section.id));
                        }}
                      >
                        <span className="index-code u-micro">
                          {on && <motion.span layoutId="index-active" className="index-active" />}
                          <span className="index-code-text">({section.code})</span>
                        </span>
                        <span className="index-label">{section.label}</span>
                        <span className="index-hint u-micro">{section.hint}</span>
                        <span className="index-status u-micro">{on ? "Viewing" : status[section.id]}</span>
                      </a>
                    </motion.li>
                  );
                })}
              </motion.ol>
            </LayoutGroup>
          </nav>

          <div className="index-links">
            <p className="u-micro index-sub">Elsewhere</p>
            <ul aria-label="Links">
              {uplinks.map((link) => (
                <li key={link.id}>
                  <Uplink
                    link={link}
                    className="index-link"
                    onActivate={link.onActivate && (() => closeThen(link.onActivate))}
                  >
                    <link.Icon className="index-link-icon" />
                    <span className="index-link-title">{link.title}</span>
                    <span className="u-micro index-link-detail">{link.detail}</span>
                    {link.external ? (
                      <ExternalIcon className="index-link-glyph" />
                    ) : (
                      <ArrowIcon className="index-link-glyph" direction={link.download ? "down" : "right"} />
                    )}
                  </Uplink>
                </li>
              ))}
              <li>
                <a className="index-link" href={`mailto:${profile.email}`}>
                  <MailIcon className="index-link-icon" />
                  <span className="index-link-title">Email</span>
                  <span className="u-micro index-link-detail">{profile.email}</span>
                  <ArrowIcon className="index-link-glyph" />
                </a>
              </li>
            </ul>
          </div>

          <div className="cells u-micro index-foot">
            <span className="cell">
              <span className={`led${online ? "" : " is-off"}`} aria-hidden="true" />
              Link {online ? "online" : "offline"}
            </span>
            <button type="button" className="cell cell--push fx-toggle" aria-pressed={fx} onClick={onToggleFx}>
              FX <b>{fx ? "On" : "Off"}</b>
              <span className="sr-only"> (visual effects and motion)</span>
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}

/* ---------- the colour palette ---------- */

// Every colour the site can wear, as ruled rows. Each row fills with its own
// colour on hover or focus — a preview — and the current one stays filled.
// Choosing one hands off to the app, which replays the loading card in it.
function ColourPanel({ colour, onPick, onClose, returnFocusRef }) {
  const present = useIsPresent();
  const panelRef = useDialog(present, onClose, returnFocusRef);

  return (
    <>
      <motion.div
        key="scrim"
        className="index-scrim"
        onClick={onClose}
        initial={{ clipPath: "inset(0% 0% 100% 0%)" }}
        animate={{ clipPath: "inset(0% 0% 0% 0%)", transition: { duration: 0.3, ease: snap } }}
        exit={{ clipPath: "inset(100% 0% 0% 0%)", transition: { duration: 0.24, ease: snap } }}
      />
      <motion.div
        key="panel"
        id="site-colour"
        ref={panelRef}
        className="palette surface-paper"
        role="dialog"
        aria-modal="true"
        aria-labelledby="site-colour-title"
        initial={{ clipPath: "inset(0% 0% 100% -4%)" }}
        animate={{ clipPath: "inset(0% 0% -6% -4%)", transition: { duration: 0.36, ease: snap } }}
        exit={{ clipPath: "inset(0% 0% 100% -4%)", transition: { duration: 0.24, ease: snap } }}
      >
        <div className="cells u-micro palette-head">
          <h2 id="site-colour-title" className="cell cell--fill index-title">
            Colour
          </h2>
          <span className="cell">{PALETTE.length} options</span>
          <button type="button" className="cell index-close palette-close" onClick={onClose}>
            Close <CloseIcon className="index-close-glyph" />
          </button>
        </div>

        <ul className="palette-rows">
          {PALETTE.map((entry) => {
            const on = colour?.id === entry.id;
            return (
              <li key={entry.id}>
                <button
                  type="button"
                  className="palette-row"
                  style={{ "--row": entry.hex }}
                  aria-pressed={on}
                  data-autofocus={on || undefined}
                  onClick={() => onPick(entry)}
                >
                  <span className="palette-swatch" aria-hidden="true" />
                  <span className="palette-name">{entry.name}</span>
                  <span className="palette-hex u-micro" aria-hidden="true">
                    {entry.hex}
                  </span>
                  <span className="palette-ratio num" aria-hidden="true">
                    {ratioOf(entry.hex)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <p className="palette-note u-micro">
          Picking a colour replays the loading screen in it. Ratios are white text on each colour; your pick is
          remembered on this browser.
        </p>
      </motion.div>
    </>
  );
}

/* ---------- status strip: the spreadsheet's status bar ---------- */

function StatusStrip({ uplinks, fx, onToggleFx }) {
  const online = useOnline();
  const wide = useMediaQuery("(min-width: 1280px)");
  return (
    <div className="strip surface-ink u-micro">
      <ul className="strip-links" aria-label="Uplinks">
        {uplinks.map((link) => (
          <li key={link.id}>
            <Uplink link={link} className="strip-link">
              <link.Icon className="strip-icon" />
              {link.title}
              <span className="strip-detail" aria-hidden="true">
                {link.detail}
              </span>
            </Uplink>
          </li>
        ))}
      </ul>
      <div className="strip-right">
        <span className="strip-cell">
          <span className={`led${online ? "" : " is-off"}`} aria-hidden="true" />
          Link {online ? "online" : "offline"}
        </span>
        {wide && <Fps className="strip-cell" />}
        <a className="strip-link strip-mail" href={`mailto:${profile.email}`} aria-label={`Email ${profile.email}`}>
          <MailIcon className="strip-icon" />
        </a>
        <button type="button" className="strip-link fx-toggle" aria-pressed={fx} onClick={onToggleFx}>
          FX <b>{fx ? "On" : "Off"}</b>
          <span className="sr-only"> (visual effects and motion)</span>
        </button>
      </div>
    </div>
  );
}

/* ---------- section stamp: first visit to a section ---------- */

// Entering a section for the first time slams its name down in the corner,
// like a rubber stamp on a file. Decorative; the headings carry the meaning.
function SectionStamp({ active }) {
  const [zone, setZone] = useState(null);
  const seen = useRef(null);

  useEffect(() => {
    if (seen.current === null) {
      seen.current = new Set([active]); // wherever the visit starts is already "known"
      return;
    }
    if (seen.current.has(active)) return;
    seen.current.add(active);
    setZone(SECTIONS.find((section) => section.id === active));
  }, [active]);

  useEffect(() => {
    if (!zone) return undefined;
    const timer = setTimeout(() => setZone(null), 2400);
    return () => clearTimeout(timer);
  }, [zone]);

  return (
    <AnimatePresence>
      {zone && (
        <motion.div
          key={zone.id}
          className={`stamp ${zone.alert ? "surface-signal" : "surface-ink"}`}
          aria-hidden="true"
          initial={{ clipPath: "inset(0% 100% -12% 0%)", x: -12 }}
          animate={{ clipPath: "inset(0% -6% -12% 0%)", x: 0 }}
          exit={{ clipPath: "inset(0% -6% -12% 100%)" }}
          transition={{ duration: 0.32, ease: snap }}
        >
          <p className="stamp-kicker u-micro">
            ({zone.code}) {zone.alert ? "Channel open" : "Zone discovered"}
          </p>
          <p className="stamp-name">{zone.label}</p>
          <p className="stamp-hint u-micro">{zone.hint}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function GlobalHUD({ active, navigate, onRequestCv, fx, onToggleFx, colour, onPickColour }) {
  // At most one header panel is open; opening the other swaps them.
  const [panel, setPanel] = useState(null);
  const indexRef = useRef(null);
  const colourRef = useRef(null);
  const uplinks = buildUplinks(onRequestCv);
  const closePanel = useCallback(() => setPanel(null), []);
  const toggle = useCallback((name) => setPanel((open) => (open === name ? null : name)), []);

  const pick = (entry) => {
    closePanel();
    onPickColour(entry);
  };

  return (
    <>
      <SiteBar active={active} panel={panel} onToggle={toggle} indexRef={indexRef} colourRef={colourRef} />
      <AnimatePresence>
        {panel === "index" && (
          <IndexPanel
            key="index"
            active={active}
            navigate={navigate}
            uplinks={uplinks}
            fx={fx}
            onToggleFx={onToggleFx}
            onClose={closePanel}
            returnFocusRef={indexRef}
          />
        )}
        {panel === "colour" && (
          <ColourPanel key="colour" colour={colour} onPick={pick} onClose={closePanel} returnFocusRef={colourRef} />
        )}
      </AnimatePresence>
      <StatusStrip uplinks={uplinks} fx={fx} onToggleFx={onToggleFx} />
      <SectionStamp active={active} />
    </>
  );
}
