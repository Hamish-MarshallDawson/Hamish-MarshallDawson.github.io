import { Fragment, useRef, useState } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotionConfig,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { isMobile } from "react-device-detect";
import { AICore } from "./AICore";
import { SECTIONS } from "../../sections";
import { Barcode } from "../shared/Barcode";
import { Typewriter } from "../shared/Typewriter";
import { Wipe } from "../shared/Wipe";
import { ArrowIcon } from "../shared/Icons";
import { linkLatency } from "../shared/Telemetry";
import { experience, extracurricular, isActiveRole, pickHighlights, profile, vaultProjects } from "../projectdata";
import "./Hero.css";

const ease = [0.16, 1, 0.3, 1];
const WORDS = profile.name.split(" ");
const codeFor = (href) => SECTIONS.find((section) => `#${section.id}` === href)?.code;

const sessionCode = () =>
  Math.floor(Math.random() * 0xffffff)
    .toString(16)
    .toUpperCase()
    .padStart(6, "0");

// After its solid word, each row carries on through the name in outline and
// runs off the edge of the sheet, like a poster set too big for its paper.
// It is generated content with empty alt text (see Hero.css), so it never
// reaches the DOM text or the heading's accessible name.
const echoFor = (i) => ` ${[...WORDS.slice(i + 1), ...WORDS, ...WORDS].join(" ")}`;

// The lobby menu, each entry with a live chip. Everything comes from the data.
function buildMenu() {
  const active = experience.filter((job) => isActiveRole(job)).length;
  return [
    { href: "#vault", label: "Project vault", chip: `${vaultProjects.length} files` },
    {
      href: "#work",
      label: "Work log",
      chip: active ? `Active [${active}/${experience.length}]` : `${experience.length} entries`,
    },
    { href: "#volunteer", label: "Volunteer work", chip: `${extracurricular.length} records` },
    { href: "#reach-out", label: "Reach out", chip: "Contact", alert: true },
  ];
}

// The profile sheet's columns.
function buildStats() {
  const activeJob = experience.find((job) => isActiveRole(job));
  const job = activeJob ?? experience[0];
  return [
    { key: "Designation", value: profile.role },
    { key: "Status", value: `${profile.degree} — ${profile.institution}` },
    { key: activeJob ? "Current post" : "Last post", value: `${job.role} — ${job.org}` },
  ];
}

// Landing section, set like the front of a catalogue: a ruled data sheet
// across the top, the name in rows of compressed black type that bleed off
// the right edge, and the AI core printed as a signal-blue plate over the
// rows. Scrolling drifts the rows apart; the plate's hard shadow follows the
// pointer. Once the loading card hands over (`live`), the rows rise, the
// plate wipes in and the sheet types itself.
export function HeroBootSequence({ live }) {
  const reduce = useReducedMotionConfig();
  const sectionRef = useRef(null);
  const [session] = useState(sessionCode);
  const [rtt] = useState(linkLatency);
  const [menu] = useState(buildMenu);
  const [stats] = useState(buildStats);
  // A different five each time the page loads (or refreshes via Colour).
  const [highlights] = useState(() => pickHighlights(5));

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const drift = [
    useTransform(scrollYProgress, [0, 1], ["0vw", "-16vw"]),
    useTransform(scrollYProgress, [0, 1], ["0vw", "10vw"]),
    useTransform(scrollYProgress, [0, 1], ["0vw", "-24vw"]),
  ];

  // Pointer position (-0.5…0.5) steers the plate's shadow: move left and
  // the shadow swings long to the right, as if the light were following you.
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(useTransform(px, [-0.5, 0.5], [26, 6]), { stiffness: 180, damping: 22 });
  const sy = useSpring(useTransform(py, [-0.5, 0.5], [26, 6]), { stiffness: 180, damping: 22 });
  const shadow = useMotionTemplate`${sx}px ${sy}px 0 0 var(--ink)`;
  const steer = !reduce && !isMobile;

  const onPointerMove = (event) => {
    if (!steer || event.pointerType !== "mouse" || !sectionRef.current) return;
    const rect = sectionRef.current.getBoundingClientRect();
    px.set((event.clientX - rect.left) / rect.width - 0.5);
    py.set((event.clientY - rect.top) / rect.height - 0.5);
  };

  const resetPointer = () => {
    px.set(0);
    py.set(0);
  };

  return (
    <section
      id="core"
      ref={sectionRef}
      className="hero surface-paper"
      aria-labelledby="hero-name"
      onPointerMove={onPointerMove}
      onPointerLeave={resetPointer}
    >
      <div className="hero-top">
        <dl className="hero-sheet">
          <div className="hero-cell hero-cell--id" aria-hidden="true">
            <dt>Session</dt>
            <dd>
              {session}
              {rtt ? ` · ${rtt}ms` : ""}
            </dd>
          </div>
          {stats.map((row, i) => (
            <div key={row.key} className="hero-cell">
              <dt>{row.key}</dt>
              <dd>
                <Typewriter text={row.value} start={live} delay={0.55 + i * 0.25} cps={54} />
              </dd>
            </div>
          ))}
        </dl>

        <div className="hero-stage">
          <h1 id="hero-name" className="hero-name">
            {WORDS.map((word, i) => (
              <Fragment key={word}>
                <span className="hero-row">
                  <motion.span
                    className="hero-track"
                    data-echo={echoFor(i)}
                    style={reduce ? undefined : { x: drift[i] }}
                    initial={reduce ? false : { y: "106%" }}
                    animate={{ y: live || reduce ? "0%" : "106%" }}
                    transition={{ duration: 0.95, delay: 0.1 + i * 0.1, ease }}
                  >
                    {word}
                  </motion.span>
                </span>
                {i < WORDS.length - 1 ? " " : null}
              </Fragment>
            ))}
          </h1>

          <AICore live={live} shadow={steer ? shadow : undefined} />

          <div className="hero-rail" aria-hidden="true">
            <Barcode value={`HMD-${session}`} className="hero-barcode" vertical />
            <span className="hero-rail-text">
              HMD / {profile.location} · {profile.coords}
            </span>
          </div>
        </div>
      </div>

      <div className="hero-deck">
        <div className="hero-intro">
          <p className="hero-role">{profile.role}</p>
          <p className="hero-cmd">
            <span className="hero-prompt">operator@hmd-mainframe:~$</span>{" "}
            <Typewriter text="cat bio.txt" start={live} delay={0.9} cps={22} />
          </p>
          <motion.p
            className="hero-bio"
            initial={reduce ? false : { clipPath: "inset(0% 0% 100% 0%)" }}
            animate={{ clipPath: live || reduce ? "inset(0% 0% 0% 0%)" : "inset(0% 0% 100% 0%)" }}
            transition={{ delay: live && !reduce ? 1.45 : 0, duration: 0.7, ease: [0.7, 0, 0.2, 1] }}
          >
            {profile.bio}
          </motion.p>
          <a className="btn btn--ink u-press hero-cta" href="#vault">
            Deploy to project vault <ArrowIcon className="btn-glyph" />
          </a>
        </div>

        <Wipe className="hero-vector surface-ink" from="left">
          <p className="hero-vector-key u-micro">Research vector</p>
          <p className="hero-vector-value">
            <Typewriter text={profile.research} start={live} delay={1.2} cps={36} />
          </p>
          <p className="hero-vector-sub">
            {profile.researchContext}: how input latency changes an operator&apos;s trust in the robot.
          </p>
          <p className="hero-vector-note u-micro">{profile.researchNote}</p>
        </Wipe>

        <dl className="hero-highlights">
          {highlights.map((item) => (
            <div key={item.key} className="hero-highlight">
              <dt>{item.key}</dt>
              <dd>{item.value}</dd>
            </div>
          ))}
        </dl>

        <nav className="hero-menu" aria-label="Lobby">
          {menu.map((item) => (
            <a key={item.href} href={item.href} className="hero-item u-press" data-alert={item.alert || undefined}>
              <span className="hero-item-code u-micro" aria-hidden="true">
                ({codeFor(item.href)})
              </span>
              <span className="hero-item-label">{item.label}</span>
              <span className="hero-item-chip chip">{item.chip}</span>
              <ArrowIcon direction="down" className="hero-item-glyph" />
            </a>
          ))}
        </nav>
      </div>
    </section>
  );
}
