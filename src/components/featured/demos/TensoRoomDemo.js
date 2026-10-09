import { useEffect, useRef, useState } from "react";
import "./TensoRoomDemo.css";
import { pad } from "../format";

/*
  TensorRoom walkthrough
  ======================
  A native copy of the flow in TensorRoom's web app (web/app.js), built from
  the screenshots in its docs. Nothing is sent anywhere and nothing is
  rendered for real: each step is scripted. The timings come from the
  recorded run in docs/images/results.json (RTX 5080), and the renders play
  back six times faster so a visitor is not left watching for half a minute.

  The shell owns `step` and `reducedMotion`. A tap inside the demo that
  finishes a step calls onAdvance(); the shell's own Back and Next still work.
*/

const ASSET = (file) => `${process.env.PUBLIC_URL}/featured/tensoroom/${file}`;
const FONT_LINK_ID = "tensoroom-fonts";
const FONT_HREF =
  // Only what the CSS uses: DM Sans at 400 to 700, and Fraunces roman and italic at 500 to 600 with its SOFT and optical size axes.
  "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Fraunces:ital,opsz,wght,SOFT@0,9..144,500..600,0..100;1,9..144,500..600,0..100&display=swap";

const CHECK_SECONDS = 1.2; // People check on the photo
const SCAN_SECONDS = 2.1; // Object finding, real time (segment_s in results.json)
const PREVIEW_SECONDS = 12; // Four-step preview, "about 12 s" in the README
const SPEED = 6; // Playback speed for the renders
const REAL_TIME = 1; // Playback speed for the short checks and the object scan

export const steps = [
  {
    id: "room",
    title: "Your room",
    caption: "Take a photo of the room with nobody in it. TensorRoom checks it for people before anything is stored.",
  },
  {
    id: "objects",
    title: "What to change",
    caption: "Name the pieces, or tap a suggestion. Each one is matched to an object in the photo and given its own mask.",
  },
  {
    id: "choose",
    title: "Choose & describe",
    caption: "Tap the photo or the list to choose what to change, then say what it should become.",
  },
  {
    id: "redraw",
    title: "Redraw",
    caption: "A quick four-step preview first, then the full render. Only a crop around the chosen pieces goes to the model.",
  },
  {
    id: "compare",
    title: "Compare",
    caption: "Drag across the photo to see before and after. Everything outside the mask is copied exactly from the original.",
  },
];

const SUGGESTIONS = ["sofa", "rug", "coffee table", "chair"];

// Edits recorded for the walkthrough, from docs/images/results.json.
// Each edit image is the after half of a before/after card, cropped so it
// lines up with edit-before.jpg.
const EDITS = [
  { id: "sofa", label: "Sofa", instruction: "a dark green velvet mid-century sofa", image: "edit-1-sofa.jpg", seconds: 22.4, vram: 11.64 },
  { id: "rug", label: "Rug", instruction: "a round natural jute rug", image: "edit-2-rug.jpg", seconds: 17.3, vram: 10.41 },
  { id: "coffee table", label: "Coffee table", instruction: "a round white marble coffee table", image: "edit-3-coffee-table.jpg", seconds: 20.3, vram: 11.64 },
  { id: "chair", label: "Chair", instruction: "a cognac leather armchair", image: "edit-4-chair.jpg", seconds: 25.6, vram: 13.28 },
];
const SOFA = EDITS[0];

// Where each object sits on find-objects.jpg, as a percentage of the picture.
// Later entries sit on top, so the table wins where it overlaps the sofa and rug.
const REGIONS = [
  { id: "rug", left: 0, top: 81.7, width: 100, height: 18.3 },
  { id: "sofa", left: 15, top: 44.9, width: 60.9, height: 39.2 },
  { id: "chair", left: 76.6, top: 45.1, width: 23.4, height: 52.5 },
  { id: "coffee table", left: 27.7, top: 67.2, width: 40.7, height: 32.8 },
];

const fmt = (seconds) => `${seconds.toFixed(1)} s`;
const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
const noop = () => {};

// Adds the class that switches off the demo's animation (see the is-still rules in the CSS).
const stillClass = (reducedMotion) => (reducedMotion ? " is-still" : "");

// Runs from 0 to `target` seconds of demo time, `speed` times faster than the
// clock on the wall, then calls onDone. With reduced motion it finishes at once.
function useClock(running, target, speed, reducedMotion, onDone) {
  const [elapsed, setElapsed] = useState(0);
  const done = useRef(onDone);
  done.current = onDone;

  useEffect(() => {
    if (!running) return undefined;
    if (reducedMotion) {
      setElapsed(target);
      done.current();
      return undefined;
    }
    let frame;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(target, ((now - start) / 1000) * speed);
      setElapsed(t);
      if (t >= target) done.current();
      else frame = requestAnimationFrame(tick);
    };
    setElapsed(0);
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running, target, speed, reducedMotion]);

  return elapsed;
}

function Frame({ wide, children }) {
  return <div className={`tr-demo__frame${wide ? " tr-demo__frame--wide" : ""}`}>{children}</div>;
}

function Figure({ num, caption, wide, children }) {
  return (
    <figure className="tr-demo__figure">
      <Frame wide={wide}>{children}</Frame>
      <figcaption className="tr-demo__caption">
        <b>Fig. {num}</b> <span>{caption}</span>
      </figcaption>
    </figure>
  );
}

// Before/after slider. Pointer drag anywhere on the photo, or the arrow keys
// on the handle. touch-action keeps vertical swipes scrolling the page.
function Compare({ before, after, alt, reducedMotion }) {
  const [pos, setPos] = useState(50);
  const frame = useRef(null);
  const dragging = useRef(false);

  const placeAt = (clientX) => {
    const box = frame.current.getBoundingClientRect();
    setPos(clamp(((clientX - box.left) / box.width) * 100, 0, 100));
  };

  const onKeyDown = (event) => {
    const nudge = { ArrowLeft: -5, ArrowRight: 5, PageDown: -10, PageUp: 10 };
    if (event.key in nudge) {
      event.preventDefault();
      setPos((value) => clamp(value + nudge[event.key], 0, 100));
    } else if (event.key === "Home") {
      event.preventDefault();
      setPos(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setPos(100);
    }
  };

  return (
    <figure className="tr-demo__figure">
      <div
        ref={frame}
        className={`tr-demo__frame tr-demo__frame--wide tr-demo__compare${stillClass(reducedMotion)}`}
        style={{ "--pos": `${pos}%` }}
        onPointerDown={(event) => {
          dragging.current = true;
          event.currentTarget.setPointerCapture(event.pointerId);
          placeAt(event.clientX);
        }}
        onPointerMove={(event) => {
          if (dragging.current) placeAt(event.clientX);
        }}
        onPointerUp={() => {
          dragging.current = false;
        }}
        onPointerCancel={() => {
          dragging.current = false;
        }}
      >
        <img className="tr-demo__img" src={after} alt={alt} draggable={false} />
        <img className="tr-demo__img tr-demo__before" src={before} alt="" aria-hidden="true" draggable={false} />
        <span className="tr-demo__handle" aria-hidden="true" />
        <span
          className="tr-demo__knob"
          role="slider"
          tabIndex={0}
          aria-label="Before and after"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(pos)}
          aria-valuetext={`${Math.round(pos)}% before`}
          onKeyDown={onKeyDown}
        >
          ‹ ›
        </span>
        <span className="tr-demo__tag tr-demo__tag--before">Before</span>
        <span className="tr-demo__tag tr-demo__tag--after">After</span>
      </div>
    </figure>
  );
}

export default function TensoRoomDemo({ step = 0, reducedMotion = false, onAdvance }) {
  const [people, setPeople] = useState("idle"); // idle | checking | clear
  const dockRef = useRef(null);
  const [terms, setTerms] = useState("sofa, rug, coffee table, chair");
  const [scan, setScan] = useState("idle"); // idle | scanning | found
  const [picked, setPicked] = useState([]);
  const [instruction, setInstruction] = useState(SOFA.instruction);
  const [redraw, setRedraw] = useState("idle"); // idle | previewing | preview | finalising | final
  const [editId, setEditId] = useState(SOFA.id);

  // The app's fonts, injected once the first time the demo mounts.
  useEffect(() => {
    try {
      if (document.getElementById(FONT_LINK_ID)) return;
      const link = document.createElement("link");
      link.id = FONT_LINK_ID;
      link.rel = "stylesheet";
      link.href = FONT_HREF;
      document.head.appendChild(link);
    } catch (error) {
      // Without the link the page falls back to Georgia and the system sans.
    }
  }, []);

  const termList = terms.split(",").map((term) => term.trim()).filter(Boolean);
  const edit = EDITS.find((item) => item.id === editId) || SOFA;

  useClock(people === "checking", CHECK_SECONDS, REAL_TIME, reducedMotion, () => setPeople("clear"));
  const scanTime = useClock(scan === "scanning", SCAN_SECONDS, REAL_TIME, reducedMotion, () => setScan("found"));
  const previewTime = useClock(redraw === "previewing", PREVIEW_SECONDS, SPEED, reducedMotion, () => setRedraw("preview"));
  const finalTime = useClock(redraw === "finalising", SOFA.seconds, SPEED, reducedMotion, () => setRedraw("final"));

  const togglePick = (id) => {
    setPicked((list) => (list.includes(id) ? list.filter((item) => item !== id) : [...list, id]));
  };

  const toggleTerm = (word) => {
    const next = termList.includes(word) ? termList.filter((term) => term !== word) : [...termList, word];
    setTerms(next.join(", "));
  };

  const next = () => {
    if (onAdvance) onAdvance();
  };

  // Picking a photo starts the people check. The tile that was pressed is
  // removed, so focus moves to the dock button, which stays in place.
  const startCheck = () => setPeople("checking");
  const takePhoto = () => {
    startCheck();
    if (dockRef.current) dockRef.current.focus();
  };
  const cycleEdit = () => {
    const at = EDITS.findIndex((item) => item.id === edit.id);
    setEditId(EDITS[(at + 1) % EDITS.length].id);
  };

  // The one button on the thumb-reach dock, which changes with the step. It is
  // never removed or disabled outright (aria-disabled instead), so a keyboard
  // user's focus stays on it through every state.
  let action;
  if (step === 0) {
    action = people === "idle"
      ? { label: "Choose a photo", disabled: false, run: startCheck }
      : { label: "Use this photo", disabled: people !== "clear", run: next };
  } else if (step === 1) {
    if (scan === "idle") action = { label: "Find objects", disabled: !termList.length, run: () => setScan("scanning") };
    else if (scan === "scanning") action = { label: "Finding objects…", disabled: true, run: noop };
    else action = { label: "Choose a piece", disabled: false, run: next };
  } else if (step === 2) {
    action = { label: "Redraw", disabled: !picked.includes(SOFA.id) || !instruction.trim(), run: next };
  } else if (step === 3) {
    if (redraw === "idle") action = { label: "Preview · 4 steps", disabled: false, run: () => setRedraw("previewing") };
    else if (redraw === "previewing") action = { label: "Previewing…", disabled: true, run: noop };
    else if (redraw === "preview") action = { label: "Final render", disabled: false, run: () => setRedraw("finalising") };
    else if (redraw === "finalising") action = { label: "Rendering…", disabled: true, run: noop };
    else action = { label: "Compare before & after", disabled: false, run: next };
  } else {
    // Last step: there is nothing to advance to, so the dock cycles the edits.
    action = { label: "Try another edit", disabled: false, run: cycleEdit };
  }

  const status = [
    people === "idle" ? "Take a photo, or choose one from your library." : people === "clear" ? "No people in the photo. Ready." : "Checking the photo for people.",
    scan === "found" ? `Found four pieces in ${SCAN_SECONDS} seconds.` : scan === "scanning" ? "Finding objects." : "Four objects can be matched.",
    picked.length ? `${picked.length} chosen.` : "Tap the sofa to choose it.",
    {
      idle: "Ready to preview.",
      previewing: "Previewing.",
      preview: "Preview ready.",
      finalising: "Rendering the full image.",
      final: `Final render ready in ${SOFA.seconds} seconds.`,
    }[redraw],
    `${edit.label}: ${edit.instruction}.`,
  ][step];

  const renderView = () => {
    if (step === 0 && people === "idle") {
      return (
        <>
          <p className="tr-demo__lede">Start with a photo, taken from where you would normally stand.</p>
          <div className="tr-demo__tiles">
            <button type="button" className="tr-demo__tile tr-demo__tile--accent" onClick={takePhoto}>
              <span className="tr-demo__icon tr-demo__icon--lens" aria-hidden="true" />
              <span className="tr-demo__tile-label">Take a photo</span>
              <span className="tr-demo__tile-hint">Opens the camera</span>
            </button>
            <button type="button" className="tr-demo__tile" onClick={takePhoto}>
              <span className="tr-demo__icon tr-demo__icon--arch" aria-hidden="true" />
              <span className="tr-demo__tile-label">Choose a photo</span>
              <span className="tr-demo__tile-hint">From your library</span>
            </button>
          </div>
        </>
      );
    }

    if (step === 0) {
      return (
        <>
          <p className="tr-demo__lede">The photo is checked for people before anything is stored. A portrait or a TV on the wall is fine.</p>
          <Figure num="01" caption="Living room, taken from where you would normally stand">
            <img src={ASSET("original.jpg")} alt="A bright living room with a grey sofa, a wooden coffee table and a mustard armchair" />
            {people === "checking" ? (
              <>
                <span className="tr-demo__sweep" aria-hidden="true" />
                <span className="tr-demo__badge">Checking for people…</span>
              </>
            ) : (
              <span className="tr-demo__badge tr-demo__badge--ok">✓ Nobody in shot</span>
            )}
          </Figure>
        </>
      );
    }

    if (step === 1) {
      return (
        <>
          <p className="tr-demo__lede">Type the pieces, or tap a suggestion. Separate several with commas.</p>
          <label className="tr-demo__field">
            <span className="tr-demo__label">Objects</span>
            <input
              type="text"
              value={terms}
              onChange={(event) => setTerms(event.target.value)}
              placeholder="sofa, coffee table"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
            />
          </label>
          <div className="tr-demo__chips" role="group" aria-label="Suggestions">
            {SUGGESTIONS.map((word) => (
              <button
                key={word}
                type="button"
                className="tr-demo__chip"
                aria-pressed={termList.includes(word)}
                onClick={() => toggleTerm(word)}
              >
                {word}
              </button>
            ))}
          </div>
          <Figure num="02" caption={scan === "found" ? `Four pieces found, each with its own mask` : "Matched in about two seconds"}>
            <img
              src={ASSET(scan === "found" ? "find-objects.jpg" : "original.jpg")}
              alt={scan === "found" ? "The room with the sofa, rug, coffee table and chair each shaded in a different mask" : "The room, before any objects are found"}
            />
            {scan === "scanning" && (
              <>
                <span className="tr-demo__sweep" aria-hidden="true" />
                <span className="tr-demo__badge">Finding objects · {fmt(scanTime)}</span>
              </>
            )}
          </Figure>
        </>
      );
    }

    if (step === 2) {
      return (
        <>
          <p className="tr-demo__lede">Tap the sofa in the photo or in the list, then say what it should become.</p>
          <Figure num="03" caption={picked.length ? `${picked.length} chosen` : "Nothing chosen yet"}>
            <img src={ASSET("find-objects.jpg")} alt="The room with each object shaded in a different mask" />
            {REGIONS.map((region) => (
              // Pointer-only: the list below is the keyboard and screen reader route to the same choices.
              <button
                key={region.id}
                type="button"
                className="tr-demo__hit"
                tabIndex={-1}
                aria-hidden="true"
                aria-pressed={picked.includes(region.id)}
                style={{ left: `${region.left}%`, top: `${region.top}%`, width: `${region.width}%`, height: `${region.height}%` }}
                onClick={() => togglePick(region.id)}
              />
            ))}
          </Figure>
          <ul className="tr-demo__list" aria-label="Objects found">
            {SUGGESTIONS.map((word) => (
              <li key={word}>
                <button
                  type="button"
                  className="tr-demo__item"
                  aria-pressed={picked.includes(word)}
                  onClick={() => togglePick(word)}
                >
                  <span className="tr-demo__swatch" aria-hidden="true" />
                  <span>{word}</span>
                  <span className="tr-demo__tick" aria-hidden="true">{picked.includes(word) ? "✓" : ""}</span>
                </button>
              </li>
            ))}
          </ul>
          <label className="tr-demo__field">
            <span className="tr-demo__label">Change them to</span>
            <textarea rows={2} value={instruction} onChange={(event) => setInstruction(event.target.value)} placeholder="a green velvet mid-century sofa" />
          </label>
          {!picked.includes(SOFA.id) && <p className="tr-demo__note">Choose the sofa to continue.</p>}
        </>
      );
    }

    if (step === 3) {
      const showAfter = redraw === "preview" || redraw === "finalising" || redraw === "final";
      const blur = redraw === "preview" ? 1.5 : redraw === "finalising" ? 1.5 * (1 - finalTime / SOFA.seconds) : 0;
      const meter = redraw === "previewing"
        ? previewTime / PREVIEW_SECONDS
        : redraw === "finalising"
          ? finalTime / SOFA.seconds
          : 0;
      const badge = {
        idle: "",
        previewing: `Preview · ${previewTime.toFixed(1)} of ${PREVIEW_SECONDS} s`,
        preview: "Preview · 4 steps",
        finalising: `Final render · ${finalTime.toFixed(1)} of ${SOFA.seconds} s`,
        final: `Final render · ${fmt(SOFA.seconds)}`,
      }[redraw];
      return (
        <>
          <p className="tr-demo__lede">Preview first (4 steps, about 12 s), then the full render (20 steps, 17 to 26 s).</p>
          <Figure num="04" wide caption={`“${SOFA.instruction}”`}>
            <img
              src={ASSET(showAfter ? SOFA.image : "original.jpg")}
              alt={showAfter ? "The sofa redrawn in dark green velvet" : "The room before the redraw"}
              style={blur ? { filter: `blur(${blur}px)` } : undefined}
            />
            {badge && <span className="tr-demo__badge">{badge}</span>}
            {(redraw === "previewing" || redraw === "finalising") && (
              <div className="tr-demo__meter" aria-hidden="true">
                <span style={{ width: `${Math.round(meter * 100)}%` }} />
              </div>
            )}
          </Figure>
          <p className="tr-demo__note">
            {redraw === "final"
              ? `Final render · peak ${SOFA.vram.toFixed(1)} GB of graphics memory · RTX 5080`
              : "Recorded on an RTX 5080 and played back six times faster."}
          </p>
        </>
      );
    }

    return (
      <>
        <p className="tr-demo__lede">Drag across the photo. Everything outside the mask is copied exactly from the original.</p>
        <Compare
          key={edit.id}
          before={ASSET("edit-before.jpg")}
          after={ASSET(edit.image)}
          alt={`After: ${edit.instruction}`}
          reducedMotion={reducedMotion}
        />
        <div className="tr-demo__chips" role="group" aria-label="Edits">
          {EDITS.map((item) => (
            <button
              key={item.id}
              type="button"
              className="tr-demo__chip"
              aria-pressed={item.id === edit.id}
              onClick={() => setEditId(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <p className="tr-demo__note">
          <b>{edit.label}</b> · {edit.instruction} · final render {fmt(edit.seconds)}
        </p>
      </>
    );
  };

  return (
    <div className={`tr-demo${stillClass(reducedMotion)}`} data-step={step}>
      <div className="tr-demo__phone">
        <div className="tr-demo__screen">
          <header className="tr-demo__bar">
            <span className="tr-demo__brand">
              Tensor<em>Room</em>
            </span>
            <span className="tr-demo__count">
              {pad(step + 1)} / {pad(steps.length)}
            </span>
          </header>
          <div className="tr-demo__progress" aria-hidden="true">
            {steps.map((item, index) => (
              <span
                key={item.id}
                className={index < step ? "is-done" : index === step ? "is-current" : undefined}
              />
            ))}
          </div>

          <div className="tr-demo__view">
            <h5 className="tr-demo__title">
              <span className="tr-demo__num">{pad(step + 1)}</span>
              {steps[step].title}
            </h5>
            <p className="tr-demo__status" aria-live="polite">{status}</p>
            {renderView()}
          </div>

          <div className="tr-demo__dock">
            <button
              ref={dockRef}
              type="button"
              className="tr-demo__cta"
              aria-disabled={action.disabled ? "true" : undefined}
              onClick={() => {
                if (!action.disabled) action.run();
              }}
            >
              {action.label}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
