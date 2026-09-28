import { useEffect, useRef, useState } from "react";
import { useReducedMotionConfig } from "framer-motion";
import { profile } from "../projectdata";
import { ArrowIcon, CvIcon, ExternalIcon, GithubIcon, LinkedinIcon, MailIcon } from "../shared/Icons";
import { Marquee } from "../shared/Marquee";
import { SectionHeader } from "../shared/SectionHeader";
import "./RedWall.css";

const CHANNELS = [
  { id: "role", label: "Role / hiring" },
  { id: "research", label: "Research" },
  { id: "collab", label: "Collaboration" },
  { id: "cv", label: "CV request" },
  { id: "other", label: "Other" },
];

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FIELD_ORDER = ["name", "email", "message"];

function validate({ name, email, message }) {
  const errors = {};
  if (!name.trim()) errors.name = "Please add your name.";
  if (!EMAIL.test(email.trim())) errors.email = "That email address doesn't look right.";
  if (message.trim().length < 10) errors.message = "Your message needs at least 10 characters.";
  return errors;
}

function Field({ id, label, hint, error, multiline, inputRef, ...props }) {
  const Tag = multiline ? "textarea" : "input";
  const inputId = `rw-${id}`;
  return (
    <div className={`rw-field${error ? " has-error" : ""}${multiline ? " rw-field--wide" : ""}`}>
      <label className="rw-label" htmlFor={inputId}>
        {label}
        {hint && <span className="rw-hint"> ({hint})</span>}
      </label>
      <Tag
        id={inputId}
        name={id}
        ref={inputRef}
        className="rw-input"
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${inputId}-error` : undefined}
        {...props}
      />
      {error && (
        <p id={`${inputId}-error`} className="rw-error">
          ! {error}
        </p>
      )}
    </div>
  );
}

// Reach out: the contact form, set on a full signal-colour field and worded
// plainly. As the visitor types, a small checklist counts which fields are
// ready, a log notes progress, the title's hard shadow drops further off it
// and each burst of keystrokes jolts the panel. Sending hands the message
// to the visitor's own email app; the site is static, so nothing is stored.
export function Contact({ cvRequest }) {
  const reduce = useReducedMotionConfig();
  const [fields, setFields] = useState({ name: "", email: "", message: "" });
  const [channel, setChannel] = useState("role");
  const [errors, setErrors] = useState({});
  const [sent, setSent] = useState(false);
  const [intercepts, setIntercepts] = useState([]);
  const [jolt, setJolt] = useState(0);
  const lastJolt = useRef(0);
  const logged = useRef(new Set());
  const inputRefs = { name: useRef(null), email: useRef(null), message: useRef(null) };

  // A CV request from the HUD arrives as a bumped counter.
  useEffect(() => {
    if (cvRequest) setChannel("cv");
  }, [cvRequest]);

  const typed = fields.name.length + fields.email.length + fields.message.length;
  const intrusion = Math.min(1, typed / 240);
  const ready = [
    fields.name.trim().length > 0,
    EMAIL.test(fields.email.trim()),
    fields.message.trim().length >= 10,
  ].filter(Boolean).length;

  const intercept = (id, text) => {
    if (logged.current.has(id)) return;
    logged.current.add(id);
    setIntercepts((lines) => [...lines, { id, text }].slice(-4));
  };

  const onChange = (event) => {
    const { name, value } = event.target;
    const next = { ...fields, [name]: value };
    setFields(next);
    setSent(false);
    if (errors[name]) setErrors((current) => ({ ...current, [name]: undefined }));

    intercept("draft", "Draft started");
    if (next.name.trim().length > 1) intercept("name", "Name added");
    if (EMAIL.test(next.email.trim())) intercept("email", "Email looks good");
    if (next.message.length > 40) intercept("message", "Message is taking shape");
    if (next.message.length > 140) intercept("detail", "Plenty of detail — send whenever you're ready");

    const now = performance.now();
    if (!reduce && now - lastJolt.current > 140) {
      lastJolt.current = now;
      setJolt((n) => n + 1);
    }
  };

  const onSubmit = (event) => {
    event.preventDefault();
    const found = validate(fields);
    setErrors(found);
    const firstInvalid = FIELD_ORDER.find((key) => found[key]);
    if (firstInvalid) {
      inputRefs[firstInvalid].current?.focus();
      return;
    }

    const channelLabel = CHANNELS.find((c) => c.id === channel).label;
    const subject = `[${channelLabel}] from ${fields.name.trim()}`;
    const body = `${fields.message.trim()}\n\n— ${fields.name.trim()}\n${fields.email.trim()}`;
    intercept("send", "Opening your email app");
    setSent(true);
    window.location.assign(
      `mailto:${profile.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    );
  };

  const formClass = ["rw-form", "surface-paper"];
  if (jolt) formClass.push(jolt % 2 ? "jolt-a" : "jolt-b");

  return (
    <section
      id="reach-out"
      className="section redwall surface-signal"
      style={{ "--intrusion": intrusion }}
      aria-labelledby="rw-title"
    >
      <div className="section-inner rw-inner">
        <SectionHeader
          index="05"
          kicker="Reach out"
          title="Let's talk."
          titleId="rw-title"
          titleClass="sh-title--stamp"
          aside={["Exfil point", "Channel 05"]}
        >
          If you&apos;d like to discuss my work further, or you&apos;re just into AI and ML in general, feel free to fill
          out the form below — it comes straight to me.
        </SectionHeader>

        <p className="rw-warning">
          <span className="rw-warning-tag u-micro">Security alert</span>
          <span className="rw-warning-text u-micro">Unrestricted entity beyond this point. Proceed anyway.</span>
        </p>

        <div className="rw-grid">
          <form className={formClass.join(" ")} noValidate onSubmit={onSubmit} aria-labelledby="rw-form-title">
            <div className="rw-form-head surface-ink u-micro" aria-hidden="true">
              <span>New message · to Hamish</span>
              <span className="rw-integrity">
                {ready === 3 ? "Ready to send" : "Filled in"} <b>{ready}/3</b>
                <i className="rw-meter">
                  <i style={{ width: `${(ready / 3) * 100}%` }} />
                </i>
              </span>
            </div>
            <h3 id="rw-form-title" className="sr-only">
              Send Hamish a message
            </h3>

            <div className="rw-fields">
              <Field
                id="name"
                label="Name"
                autoComplete="name"
                value={fields.name}
                onChange={onChange}
                error={errors.name}
                inputRef={inputRefs.name}
              />
              <Field
                id="email"
                type="email"
                label="Email"
                hint="so I can reply"
                autoComplete="email"
                inputMode="email"
                value={fields.email}
                onChange={onChange}
                error={errors.email}
                inputRef={inputRefs.email}
              />

              <fieldset className="rw-channels">
                <legend className="rw-label">What&apos;s it about?</legend>
                <div className="rw-chip-row">
                  {CHANNELS.map((option) => (
                    <label key={option.id} className="rw-chip">
                      <input
                        type="radio"
                        name="channel"
                        value={option.id}
                        checked={channel === option.id}
                        onChange={() => setChannel(option.id)}
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
                {channel === "cv" && !profile.cv && (
                  <p className="rw-cv-note u-micro">
                    Leave a quick note and I&apos;ll email my CV back to you as a PDF.
                  </p>
                )}
              </fieldset>

              <Field
                id="message"
                label="Message"
                hint="10 characters minimum"
                multiline
                rows={6}
                value={fields.message}
                onChange={onChange}
                error={errors.message}
                inputRef={inputRefs.message}
              />
            </div>

            <div className="rw-intercepts surface-ink" aria-hidden="true">
              {intercepts.length === 0 ? (
                <p className="rw-idle">&gt; Waiting for your message…</p>
              ) : (
                intercepts.map((line) => <p key={line.id}>&gt; {line.text}</p>)
              )}
            </div>

            <div className="rw-submit">
              <button type="submit" className="btn btn--signal u-press rw-send">
                Send message <span className="rw-send-glyph" aria-hidden="true">▸</span>
              </button>
              <p className="rw-note u-micro">
                Opens your email app with the message ready to send. Nothing is stored on this site.
              </p>
            </div>

            <p className="rw-status" role="status">
              {sent &&
                `Your email app should have opened with the message ready to send. If it didn't, email me at ${profile.email}.`}
            </p>
          </form>

          <aside className="rw-uplinks" aria-labelledby="rw-uplinks-title">
            <h3 id="rw-uplinks-title" className="rw-uplinks-title">
              Direct uplinks
            </h3>
            <ul>
              <li>
                <a className="rw-uplink" href={`mailto:${profile.email}`}>
                  <MailIcon className="rw-uplink-icon" />
                  <span className="rw-uplink-text">
                    <b>Email</b>
                    <span>{profile.email}</span>
                  </span>
                  <ArrowIcon className="rw-uplink-glyph" />
                </a>
              </li>
              <li>
                <a className="rw-uplink" href={profile.linkedin} target="_blank" rel="noopener noreferrer">
                  <LinkedinIcon className="rw-uplink-icon" />
                  <span className="rw-uplink-text">
                    <b>LinkedIn</b>
                    <span>in/hamish-marshall-dawson</span>
                  </span>
                  <span className="sr-only"> (opens in a new tab)</span>
                  <ExternalIcon className="rw-uplink-glyph" />
                </a>
              </li>
              <li>
                <a className="rw-uplink" href={profile.github} target="_blank" rel="noopener noreferrer">
                  <GithubIcon className="rw-uplink-icon" />
                  <span className="rw-uplink-text">
                    <b>GitHub</b>
                    <span>@{profile.githubUser}</span>
                  </span>
                  <span className="sr-only"> (opens in a new tab)</span>
                  <ExternalIcon className="rw-uplink-glyph" />
                </a>
              </li>
              <li>
                {profile.cv ? (
                  <a className="rw-uplink" href={profile.cv} download>
                    <CvIcon className="rw-uplink-icon" />
                    <span className="rw-uplink-text">
                      <b>CV</b>
                      <span>Download PDF</span>
                    </span>
                    <ArrowIcon className="rw-uplink-glyph" direction="down" />
                  </a>
                ) : (
                  <button type="button" className="rw-uplink" onClick={() => setChannel("cv")}>
                    <CvIcon className="rw-uplink-icon" />
                    <span className="rw-uplink-text">
                      <b>CV</b>
                      <span>On request · via the form</span>
                    </span>
                    <ArrowIcon className="rw-uplink-glyph" direction="left" />
                  </button>
                )}
              </li>
            </ul>
            <p className="rw-sig u-micro">{profile.location}</p>
          </aside>
        </div>

        <footer className="rw-footer cells u-micro">
          <span className="cell cell--fill">
            © {new Date().getFullYear()} {profile.name}
          </span>
          <span className="cell cell--push">End of transmission</span>
        </footer>
      </div>

      <Marquee items={[profile.name, profile.role]} repeat={3} speed={1} className="rw-marquee" />
    </section>
  );
}
