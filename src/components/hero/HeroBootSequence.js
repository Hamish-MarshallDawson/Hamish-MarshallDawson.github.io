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
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { AICore } from "./AICore";
import { SECTIONS } from "../../sections";
import { Typewriter } from "../shared/Typewriter";
import { ArrowIcon, ExternalIcon } from "../shared/Icons";
import { linkLatency } from "../shared/Telemetry";
import { experience, isActiveRole, pickHighlights, profile } from "../projectdata";
import "./Hero.css";
import "./HeroPhone.css";

const ease = [0.16, 1, 0.3, 1];
const WORDS = profile.name.split(" ");
const INDEX = SECTIONS.filter((section) => section.id !== "core");

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

// The data sheet's columns: where he studies, where he works, what he wants.
function buildStats() {
  const activeJob = experience.find((job) => isActiveRole(job));
  const job = activeJob ?? experience[0];
  return [
    { key: "Status", value: profile.status },
    { key: activeJob ? "Current post" : "Last post", value: `${job.role} · ${job.org}${activeJob ? ` · until ${job.period.split(" – ")[1]}` : ""}` },
    { key: "Seeking", value: profile.seeking, seeking: true },
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
  const isTouch = useMediaQuery("(pointer: coarse)");
  const sectionRef = useRef(null);
  const [session] = useState(sessionCode);
  const [rtt] = useState(linkLatency);
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
  const steer = !reduce && !isTouch;

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
            <div key={row.key} className={`hero-cell${row.seeking ? " hero-cell--seeking" : ""}`}>
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

          <motion.div
            className="hero-card"
            initial={reduce ? false : { opacity: 0, y: 24 }}
            animate={live || reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
            transition={{ delay: live && !reduce ? 0.5 : 0, duration: 0.6, ease }}
          >
            <p className="hero-kicker u-micro">
              {profile.name} · {profile.role}
            </p>
            <p className="hero-tagline">
              {profile.tagline} <em>{profile.taglineWhen}</em>.
            </p>
            <div className="hero-actions">
              <a className="btn btn--signal u-press" href={profile.cv} download>
                <ArrowIcon direction="down" className="btn-glyph" /> Download CV · PDF
              </a>
              <a className="btn btn--ink u-press" href={`mailto:${profile.email}`}>
                Email me <ArrowIcon className="btn-glyph" />
              </a>
              <a className="btn btn--paper u-press" href={profile.linkedin} target="_blank" rel="noopener noreferrer">
                LinkedIn <ExternalIcon className="btn-glyph" />
              </a>
              <a className="btn btn--paper u-press" href={profile.github} target="_blank" rel="noopener noreferrer">
                GitHub <ExternalIcon className="btn-glyph" />
              </a>
            </div>
          </motion.div>
        </div>

        <dl className="hero-highlights">
          {highlights.map((item) => (
            <div key={item.key} className={`hero-highlight${item.weight < 1000 ? " is-rotating" : ""}`}>
              <dt>
                {item.key}
                {item.weight < 1000 && <span aria-hidden="true"> ↻</span>}
              </dt>
              <dd>{item.value}</dd>
            </div>
          ))}
        </dl>

        <nav className="hero-index surface-ink" aria-label="Sections">
          <ul className="hero-index-list u-micro">
            {INDEX.map((section) => (
              <li key={section.id}>
                <a href={`#${section.id}`}>
                  <span aria-hidden="true">({section.code})</span> {section.short}
                </a>
              </li>
            ))}
          </ul>
          <a className="hero-doing" href="#work">
            What I&apos;m doing <ArrowIcon direction="down" className="hero-doing-glyph" />
          </a>
        </nav>
      </div>
    </section>
  );
}
