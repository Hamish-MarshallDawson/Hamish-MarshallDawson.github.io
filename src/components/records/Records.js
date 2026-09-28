import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  education,
  experience,
  extracurricular,
  isActiveRole,
  personal,
  roleProgress,
  toolkit,
} from "../projectdata";
import { Marquee } from "../shared/Marquee";
import { MaskedWords, SectionHeader } from "../shared/SectionHeader";
import { Reveal } from "../shared/Wipe";
import "./Records.css";

const pad = (n) => String(n).padStart(2, "0");

// The segmented fill runs out from the left once the bar is on screen. The
// bar is watched rather than the fill: at scaleX(0) the fill has no area.
function ProgressFill({ progress }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  return (
    <span ref={ref} className="contract-progress-track">
      <motion.i
        style={{ width: `${progress}%` }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: inView ? 1 : 0 }}
        transition={{ duration: 1.1, delay: 0.3, ease: [0.7, 0, 0.2, 1] }}
      />
    </span>
  );
}

// How each kind of record talks about itself.
const TERMS = {
  contract: {
    tag: "Contract",
    live: "Active",
    open: "Contract progress",
    closed: "Contract closed",
    points: "Objectives",
    aria: "contract progress",
  },
  education: {
    tag: "Education",
    live: "In progress",
    open: "Degree progress",
    closed: "Completed",
    points: "Highlights",
    aria: "course progress",
  },
};

// One record as a paper sheet on the ink section: a signal header strip,
// the title in heavy type, numbered points in ruled rows and a segmented
// progress bar worked out from the record's dates. Jobs and education use
// the same sheet; only the wording changes.
function RecordSheet({ record, title, kind, number, delay, heading: Heading = "h3" }) {
  const terms = TERMS[kind];
  const active = isActiveRole(record);
  const progress = active ? roleProgress(record) : 100;
  const id = `${kind}-${number}`;
  return (
    <Reveal className="contract" delay={delay}>
      <article className="contract-sheet surface-paper" aria-labelledby={id}>
        <header className="contract-bar surface-signal u-micro">
          <span>{`${terms.tag} 0x${number} // ${record.org}`}</span>
          <span className={`contract-state${active ? " is-active" : ""}`}>
            {active ? `${terms.live} · ${progress}%` : "Complete"}
          </span>
        </header>

        <div className="contract-body">
          <div className="contract-head">
            <Heading id={id} className="contract-role">
              {title}
            </Heading>
            <p className="contract-meta u-micro">
              {record.period} · {record.location}
            </p>
            <p className="contract-org" aria-hidden="true">
              {record.org}
            </p>
          </div>

          <div className="contract-objectives">
            <p className="contract-objectives-title u-micro">
              {terms.points} [{record.points.length}/{record.points.length}]
            </p>
            <ol>
              {record.points.map((point, n) => (
                <li key={point}>
                  <span className="contract-n num" aria-hidden="true">
                    {pad(n + 1)}
                  </span>
                  <span>{point}</span>
                </li>
              ))}
            </ol>
          </div>

          {progress !== null && (
            <div className="contract-progress">
              <span className="contract-progress-label u-micro">{active ? terms.open : terms.closed}</span>
              <span
                className="contract-progress-bar"
                role="progressbar"
                aria-label={`${record.org} ${terms.aria}`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progress}
              >
                <ProgressFill progress={progress} />
              </span>
              <span className="contract-progress-value num">{progress}%</span>
            </div>
          )}
        </div>
      </article>
    </Reveal>
  );
}

const subheading = {
  hidden: {},
  show: { transition: { staggerChildren: 0.055 } },
};

// The work log: jobs as contracts, then "Where I've studied" as the same
// kind of sheet, and the toolkit ledger to close.
export function ServiceLog() {
  return (
    <section id="work" className="section logs surface-ink" aria-labelledby="logs-title">
      <div className="section-inner">
        <SectionHeader
          index="02"
          kicker="Work log"
          title="Where I've worked."
          titleId="logs-title"
          aside={[`${experience.length} contracts on record`, `${education.length} places of study`]}
        />

        <ol className="contracts">
          {experience.map((job, i) => (
            <RecordSheet
              key={job.org + job.role}
              record={job}
              title={job.role}
              kind="contract"
              number={pad(experience.length - i)}
              delay={i * 0.09}
            />
          ))}
        </ol>

        <div className="study">
          <div className="cells u-micro study-cells">
            <span className="cell cell--fill">(02·b)</span>
            <span className="cell">Education</span>
            <span className="cell cell--push">{education.length} places of study</span>
          </div>
          <motion.h3
            id="study-title"
            className="study-title"
            variants={subheading}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
          >
            <MaskedWords text="Where I've studied." />
          </motion.h3>

          <ol className="contracts" aria-labelledby="study-title">
            {education.map((school, i) => (
              <RecordSheet
                key={school.org}
                record={school}
                title={school.qualification}
                kind="education"
                number={pad(education.length - i)}
                delay={i * 0.09}
                heading="h4"
              />
            ))}
          </ol>
        </div>

        <Reveal as="div" className="toolkit">
          <h3 className="toolkit-title">Toolkit</h3>
          <dl className="toolkit-rows">
            {toolkit.map((row) => (
              <div key={row.key} className="toolkit-row">
                <dt className="u-micro">{row.key}</dt>
                <dd>
                  <ul className="chip-list">
                    {row.items.map((item) => (
                      <li key={item} className="chip">
                        {item}
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  );
}

// Record cards: the heading sits right on the top edge of a black-and-white
// plate, a white label box and an optional stat block overlap the plate.
function RecordCard({ index, image, alt, focus, meta, title, org, badge, stat, children }) {
  return (
    <Reveal className="rcard" delay={index * 0.09}>
      <article>
        <p className="rcard-meta u-micro">{meta}</p>
        <h3 className="rcard-title">{title}</h3>
        <div className="rcard-media">
          <img src={image} alt={alt} loading="lazy" decoding="async" style={focus ? { objectPosition: focus } : undefined} />
          {badge && <span className="rcard-badge u-micro">{badge}</span>}
          {stat && <span className="rcard-stat">{stat}</span>}
        </div>
        {org && <p className="rcard-org">{org}</p>}
        <p className="rcard-copy">{children}</p>
      </article>
    </Reveal>
  );
}

export function FieldOps() {
  return (
    <section id="volunteer" className="section field surface-paper" aria-labelledby="field-title">
      <Marquee items={["Volunteer work // commendations"]} repeat={5} speed={2} variant="micro" className="field-strip" />
      <div className="section-inner">
        <SectionHeader
          index="03"
          kicker="Volunteer work · life without code"
          title="The social work."
          titleId="field-title"
        />
        <ul className="rgrid rgrid--2">
          {extracurricular.map((item, i) => (
            <RecordCard
              key={item.role}
              index={i}
              image={item.image}
              alt={item.alt}
              focus={item.focus}
              meta={item.period}
              title={item.role}
              org={item.org}
              badge={item.badge}
            >
              {item.description}
            </RecordCard>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function OffDuty() {
  return (
    <section id="offline" className="section offline surface-ink" aria-labelledby="offline-title">
      <div className="section-inner">
        <SectionHeader
          index="04"
          kicker="Off-duty · off the clock"
          title="In my spare time I am..."
          titleId="offline-title"
          wide
        />
        <ul className="rgrid rgrid--3">
          {personal.map((item, i) => (
            <RecordCard
              key={item.title}
              index={i}
              image={item.image}
              alt={item.alt}
              focus={item.focus}
              meta="Off-duty telemetry"
              title={item.title}
              stat={item.meta}
            >
              {item.description}
            </RecordCard>
          ))}
        </ul>
      </div>
    </section>
  );
}
