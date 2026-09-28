import { useCallback, useEffect, useRef, useState } from "react";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { isMobile } from "react-device-detect";
import { Typewriter } from "../shared/Typewriter";
import { categories, experience, profile, vaultProjects } from "../projectdata";
import "./BootSequence.css";

const BOOT_FLAG = "hmd:booted";

// Plays once per browser session, and never with reduced motion or FX off.
export function shouldBoot() {
  if (typeof window === "undefined") return false;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return false;
  try {
    return !sessionStorage.getItem(BOOT_FLAG) && localStorage.getItem("hmd:fx") !== "off";
  } catch {
    return true;
  }
}

function markBooted() {
  try {
    sessionStorage.setItem(BOOT_FLAG, "1");
  } catch {
    /* non-essential */
  }
}

const snap = [0.7, 0, 0.2, 1];
const rise = [0.16, 1, 0.3, 1];

const log = {
  hidden: {},
  show: { transition: { staggerChildren: 0.11, delayChildren: 0.45 } },
};
const line = {
  hidden: { clipPath: "inset(0% 100% 0% 0%)" },
  show: { clipPath: "inset(0% 0% 0% 0%)", transition: { duration: 0.12, ease: "linear" } },
};

const SEGMENTS = 48;

// The loading card: one uninterrupted field of signal blue, the name set
// large in serif with the middle name italic and stepped in, a ruled boot
// log and a long segmented bar. It leaves by sliding up like a shutter,
// trailing a band of ink.
//
// Picking a colour from the header replays it: given a `palette`, the card
// is painted in the new colour, drops down over the page, reports
// `onCovered` once the page is hidden (so the site can swap colour and
// reset underneath), then plays and leaves as usual.
export function BootSequence({ onFinish, palette = null, onCovered }) {
  const replay = Boolean(palette);
  const [core, setCore] = useState("····");
  const [granted, setGranted] = useState(false);
  const finished = useRef(false);
  const holdTimer = useRef(null);
  const progress = useMotionValue(0);
  const percent = useTransform(progress, (v) => `${String(Math.round(v)).padStart(3, "0")}%`);
  const filled = useTransform(progress, (v) => Math.round((v / 100) * SEGMENTS));
  const [segments, setSegments] = useState(0);

  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    markBooted();
    onFinish();
  }, [onFinish]);

  // Probe the portrait so the log reports what actually loaded.
  useEffect(() => {
    const probe = new Image();
    probe.onload = () => setCore("OK");
    probe.onerror = () => setCore("FALLBACK");
    probe.src = profile.coreImage;
    return () => {
      probe.onload = null;
      probe.onerror = null;
    };
  }, []);

  useEffect(() => {
    const controls = animate(progress, 100, { duration: 1.35, delay: 0.35, ease: [0.3, 0, 0.3, 1] });
    const unsubscribe = filled.on("change", setSegments);
    return () => {
      controls.stop();
      unsubscribe();
    };
  }, [progress, filled]);

  // Any input skips. Tab counts too, so keyboard users never tab into a page
  // they can't see.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("is-locked");
    const events = ["keydown", "pointerdown", "wheel", "touchstart"];
    events.forEach((type) => window.addEventListener(type, finish, { passive: true }));
    return () => {
      root.classList.remove("is-locked");
      events.forEach((type) => window.removeEventListener(type, finish));
      clearTimeout(holdTimer.current);
    };
  }, [finish]);

  const lines = [
    replay
      ? [`Apply palette · ${palette.name}`, palette.hex.toUpperCase()]
      : ["CPU0 · neural accelerator", "ONLINE"],
    [`Mount /vault · ${vaultProjects.length} files`, "OK"],
    [`Mount /work · ${experience.length} entries`, "OK"],
    ["Load portrait · image_2a10f9", core],
    ["Calibrate trust/latency model", "OK"],
    [`Index categories · ${categories.map((c) => c.name).join(" / ")}`, "OK"],
  ];

  return (
    <motion.div
      className="boot surface-signal"
      aria-hidden="true"
      style={replay ? { "--signal": palette.hex } : undefined}
      initial={replay ? { y: "-100%" } : false}
      animate={{ y: "0%" }}
      transition={{ duration: 0.55, ease: snap }}
      onAnimationComplete={() => onCovered?.()}
      exit={{ y: "-100%", transition: { duration: 0.62, ease: snap } }}
    >
      <header className="boot-top u-micro">
        <span>Loading // HMD-mainframe</span>
        <span className="boot-top-mid">Personnel file · orbital terminal 07</span>
        <span>Zone 00 · Lobby</span>
      </header>

      <div className="boot-card">
        <p className="boot-name">
          {profile.name.split(" ").map((word, i) => (
            <span key={word} className="boot-line">
              <motion.span
                className="boot-word"
                initial={{ y: "108%" }}
                animate={{ y: "0%" }}
                transition={{ duration: 0.85, delay: 0.12 + i * 0.12, ease: rise }}
              >
                {word}
              </motion.span>
            </span>
          ))}
        </p>
        <p className="boot-role u-micro">{profile.role}</p>
      </div>

      <div className="boot-foot">
        <motion.ol
          className="boot-log u-micro"
          variants={log}
          initial="hidden"
          animate="show"
          onAnimationComplete={() => setGranted(true)}
        >
          {lines.map(([label, status]) => (
            <motion.li key={label} variants={line}>
              <span className="boot-label">&gt; {label}</span>
              <span className="boot-dots" />
              <span className={`boot-status${status === "FALLBACK" ? " is-warn" : ""}`}>[{status}]</span>
            </motion.li>
          ))}
        </motion.ol>

        <div className="boot-meta u-micro">
          <p className="boot-granted">
            {granted ? (
              <Typewriter
                text="> Operator recognised. Welcome, engineer."
                cps={60}
                caret
                onDone={() => {
                  holdTimer.current = setTimeout(finish, 420);
                }}
              />
            ) : (
              " "
            )}
          </p>
          <p className="boot-skip">{isMobile ? "Tap anywhere to skip" : "Press any key to skip"}</p>
        </div>

        <div className="boot-progress">
          <span className="boot-progress-label u-micro">Loading</span>
          <div className="boot-segments">
            {Array.from({ length: SEGMENTS }, (_, i) => (
              <span key={i} className={i < segments ? "is-on" : undefined} />
            ))}
          </div>
          <motion.span className="boot-percent">{percent}</motion.span>
        </div>
      </div>

      <span className="boot-edge" />
    </motion.div>
  );
}
