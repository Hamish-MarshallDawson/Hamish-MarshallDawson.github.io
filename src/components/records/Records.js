import { motion } from "framer-motion";
import { education, experience, extracurricular, hackathons, isActiveRole, personal, toolkit } from "../projectdata";
import { MaskedWords, SectionHeader } from "../shared/SectionHeader";
import { Reveal } from "../shared/Wipe";
import "./Records.css";

const pad = (n) => String(n).padStart(2, "0");
const MONTH = /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*/;
// "May 2026 – December 2026" → "Dec 2026"; a period with no range stays as it is.
const periodEnd = (period) => period.split(" – ").pop().replace(MONTH, "$1");

// How each kind of record talks about itself.
const TERMS = {
  contract: { tag: "Contract", live: "Active · to", closed: "Closed ·" },
  education: { tag: "Education", live: "In progress ·", closed: "Completed ·" },
};

// One record as a paper sheet on the ink section: a signal header strip
// with its state, the title in heavy type over the organisation's mark, and
// numbered points in ruled rows. Jobs and education use the same sheet.
function RecordSheet({ record, title, kind, number, delay, heading: Heading = "h3" }) {
  const terms = TERMS[kind];
  const active = isActiveRole(record);
  const id = `${kind}-${number}`;
  return (
    <Reveal className="contract" delay={delay}>
      <article className="contract-sheet surface-paper" aria-labelledby={id}>
        <header className="contract-bar surface-signal u-micro">
          <span>{`${terms.tag} 0x${number} // ${record.org}`}</span>
          <span className="contract-state is-active">
            {active ? `${terms.live} ${periodEnd(record.period)}` : `${terms.closed} ${record.period}`}
          </span>
        </header>

        <div className="contract-body">
          <div className="contract-head">
            <Heading id={id} className="contract-role">
              {title}
            </Heading>
            {record.mark && (
              <img className="contract-mark" src={`${process.env.PUBLIC_URL}/projects/marks/${record.mark}`} alt="" />
            )}
            <p className="contract-meta u-micro">
              {record.period} · {record.location}
            </p>
          </div>

          <div className="contract-objectives">
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
        </div>
      </article>
    </Reveal>
  );
}

// A hackathon you attended, on the same sheet with a links row at the foot.
// The mark is a black-and-white file, so it prints in ink.
function HackathonSheet({ event, number, delay }) {
  const id = `hackathon-${number}`;
  return (
    <Reveal className="contract" delay={delay}>
      <article className="contract-sheet surface-paper" aria-labelledby={id}>
        <header className="contract-bar surface-signal u-micro">
          <span>{`Hackathon 0x${number} // ${event.org}`}</span>
          <span className="contract-state is-active">{event.hours} hours</span>
        </header>

        <div className="contract-body">
          <div className="contract-head">
            <h4 id={id} className="contract-role">
              {event.event}
            </h4>
            <img className="contract-mark contract-mark--small" src={`${process.env.PUBLIC_URL}/projects/marks/${event.mark}`} alt="" />
            <p className="contract-meta u-micro">
              {event.when} · {event.where} · {event.hours} hours
            </p>
          </div>

          <div className="contract-objectives">
            <ol>
              {event.points.map((point, n) => (
                <li key={point}>
                  <span className="contract-n num" aria-hidden="true">
                    {pad(n + 1)}
                  </span>
                  <span>{point}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="contract-progress hack-foot">
            <span className="contract-progress-label u-micro">
              Attended · {event.hours} hours{event.noSleep ? ", no sleep" : ""}
            </span>
            <ul className="hack-links">
              {event.links.map((link, n) => (
                <li key={link.url}>
                  <a
                    className={`btn u-press ${n === 0 ? "btn--signal" : "btn--paper"}`}
                    href={link.url}
                    {...(link.internal ? {} : { target: "_blank", rel: "noopener noreferrer" })}
                  >
                    {link.label}
                    {link.internal ? " ↑" : " ↗"}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </article>
    </Reveal>
  );
}

// An event still to come: a hatched, outlined strip rather than a sheet.
function UpcomingStrip({ event }) {
  return (
    <Reveal as="div">
      <div className="hack-next u-hatch">
        <p className="hack-next-text u-micro">
          Upcoming · {event.event} · {event.where} · {event.when}
        </p>
        <a className="btn btn--paper u-press" href={event.link.url} target="_blank" rel="noopener noreferrer">
          {event.link.label} ↗
        </a>
      </div>
    </Reveal>
  );
}

const attended = hackathons.filter((e) => e.status === "attended");
const upcoming = hackathons.filter((e) => e.status === "upcoming");
// The degree gets a full sheet; a finished school is one line under it.
const degrees = education.filter((school) => school.starts);
const schools = education.filter((school) => !school.starts);

const subheading = {
  hidden: {},
  show: { transition: { staggerChildren: 0.055 } },
};

// Where I've worked: jobs as contracts.
export function ServiceLog() {
  return (
    <section id="work" className="section logs surface-ink" aria-labelledby="logs-title">
      <div className="section-inner">
        <SectionHeader
          index="01"
          kicker="Work log · Experience"
          title="Where I've worked."
          titleId="logs-title"
          aside={[`${experience.length} contracts on record`]}
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
      </div>
    </section>
  );
}

// Where I've studied and where I've hacked, then the toolkit ledger.
export function Study() {
  return (
    <section id="study" className="section logs surface-ink" aria-labelledby="study-title">
      <div className="section-inner">
        <SectionHeader
          index="03"
          kicker="Education & hackathons"
          title="Where I've studied."
          titleId="study-title"
          aside={[`${degrees.length} degree · ${hackathons.length} hackathons`]}
        />

        <ol className="contracts" aria-labelledby="study-title">
          {degrees.map((school, i) => (
            <RecordSheet
              key={school.org}
              record={school}
              title={school.qualification}
              kind="education"
              number={pad(education.length - i)}
              delay={i * 0.09}
            />
          ))}
          {schools.map((school) => (
            <li key={school.org} className="school-row">
              <img className="school-mark" src={`${process.env.PUBLIC_URL}/projects/marks/${school.mark}`} alt="" />
              <h3 className="school-name">
                {school.org} · {school.period} · {school.points[0].replace(/\.$/, "")}
              </h3>
              <p className="school-more">{school.points.slice(1).join(" ")}</p>
            </li>
          ))}
        </ol>

        <div className="study">
          <motion.h3
            id="hackathon-title"
            className="study-title"
            variants={subheading}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
          >
            <MaskedWords text="Where I've hacked." />
          </motion.h3>

          <ol className="contracts contracts--pair" aria-labelledby="hackathon-title">
            {attended.map((event, i) => (
              <HackathonSheet key={event.id} event={event} number={pad(attended.length - i)} delay={i * 0.09} />
            ))}
          </ol>
          {upcoming.map((event) => (
            <UpcomingStrip key={event.id} event={event} />
          ))}
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
        {image && (
          <div className="rcard-media">
            <img src={image} alt={alt} loading="lazy" decoding="async" style={focus ? { objectPosition: focus } : undefined} />
            {badge && <span className="rcard-badge u-micro">{badge}</span>}
            {stat && <span className="rcard-stat">{stat}</span>}
          </div>
        )}
        {org && <p className="rcard-org">{org}</p>}
        <p className="rcard-copy">{children}</p>
      </article>
    </Reveal>
  );
}

// Beyond the code: leadership roles, then life off the clock.
export function BeyondCode() {
  return (
    <section id="volunteer" className="section field surface-paper" aria-labelledby="field-title">
      <div className="section-inner">
        <SectionHeader
          index="04"
          kicker="Leadership & off-duty"
          title="Beyond the code."
          titleId="field-title"
          aside={[`${extracurricular.length} roles · ${personal.length} hobbies`]}
        />
        <ul className="rgrid rgrid--2" aria-label="Leadership">
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
        <ul className="rgrid rgrid--3 rgrid--after" aria-label="In my spare time">
          {personal.map((item, i) => (
            <RecordCard
              key={item.title}
              index={i}
              image={item.image}
              alt={item.alt}
              focus={item.focus}
              meta="Off-duty"
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
