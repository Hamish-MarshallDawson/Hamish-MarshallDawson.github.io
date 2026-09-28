import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, MotionConfig } from "framer-motion";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/utilities.css";
import "./App.css";
import { SECTION_ALIASES, SECTION_IDS } from "./sections";
import { useSectionRouter } from "./hooks/useSectionRouter";
import { activeColour, applyColour, storeColour } from "./styles/palette";
import { GlitchTransition } from "./components/fx/Atmosphere";
import { BootSequence, shouldBoot } from "./components/boot/BootSequence";
import { GlobalHUD } from "./components/hud/GlobalHUD";
import { HeroBootSequence } from "./components/hero/HeroBootSequence";
import { Manifesto } from "./components/hero/Manifesto";
import { AIResearchVault } from "./components/vault/AIResearchVault";
import { FieldOps, OffDuty, ServiceLog } from "./components/records/Records";
import { Contact } from "./components/redwall/Contact";

const FX_KEY = "hmd:fx";

// Visual effects (marquees, wipes, drift, typing) can be switched off from
// the HUD. The choice is remembered per browser; storage can throw in
// private modes, in which case it just isn't remembered.
function readFx() {
  try {
    return localStorage.getItem(FX_KEY) !== "off";
  } catch {
    return true;
  }
}

function jumpToTop() {
  const root = document.documentElement;
  root.style.scrollBehavior = "auto";
  window.scrollTo(0, 0);
  root.style.scrollBehavior = "";
  const { pathname, search } = window.location;
  window.history.replaceState(null, "", pathname + search);
}

function App() {
  const [booted, setBooted] = useState(() => !shouldBoot());
  const [fx, setFx] = useState(readFx);
  const [cvRequest, setCvRequest] = useState(0);

  // A colour change is a refresh. The loading card replays in the new colour
  // (`repaint` while it's up, `run` keys each card) and, once it hides the
  // page, <main> remounts underneath it (`generation`): back to the top,
  // intro replayed, highlights reshuffled.
  const [repaint, setRepaint] = useState(null);
  const [run, setRun] = useState(0);
  const [generation, setGeneration] = useState(0);
  const [colour, setColour] = useState(activeColour);
  const pending = useRef(null);

  const { active, navigate } = useSectionRouter(SECTION_IDS, {
    ready: booted,
    aliases: SECTION_ALIASES,
    version: generation,
  });

  // Reaching Reach out puts the page into breach mode: the header row
  // inverts to ink over the signal-colour contact section (GlobalHUD.css).
  const mode = active === "reach-out" ? "breach" : "nominal";
  useEffect(() => {
    document.documentElement.dataset.mode = mode;
  }, [mode]);

  useEffect(() => {
    document.documentElement.dataset.fx = fx ? "on" : "off";
    try {
      localStorage.setItem(FX_KEY, fx ? "on" : "off");
    } catch {
      /* non-essential */
    }
  }, [fx]);

  const toggleFx = useCallback(() => setFx((on) => !on), []);

  const requestCv = useCallback(() => {
    setCvRequest((n) => n + 1);
    navigate("reach-out");
  }, [navigate]);

  // Swap to the pending colour and reset the page. Runs once per pick —
  // whichever comes first of "the card now covers the page" and "the card
  // was skipped". Returns whether it did anything.
  const resetPage = useCallback(() => {
    const entry = pending.current;
    if (!entry) return false;
    pending.current = null;
    applyColour(entry);
    setColour(entry);
    jumpToTop();
    setCvRequest(0);
    setGeneration((n) => n + 1);
    return true;
  }, []);

  const pickColour = useCallback(
    (entry) => {
      storeColour(entry);
      pending.current = entry;
      // No card with reduced motion or FX off: the page just changes.
      const still = !fx || window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
      if (still) {
        resetPage();
        return;
      }
      setRepaint(entry);
      setRun((n) => n + 1);
    },
    [fx, resetPage]
  );

  // The card now hides the page: swap underneath it, and hold the fresh
  // page's intro until the card leaves.
  const coverPage = useCallback(() => {
    if (resetPage()) setBooted(false);
  }, [resetPage]);

  const finishBoot = useCallback(() => {
    resetPage();
    setBooted(true);
    setRepaint(null);
  }, [resetPage]);

  const showBoot = !booted || repaint !== null;

  return (
    <MotionConfig reducedMotion={fx ? "user" : "always"}>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <GlobalHUD
        active={active}
        navigate={navigate}
        onRequestCv={requestCv}
        fx={fx}
        onToggleFx={toggleFx}
        colour={colour}
        onPickColour={pickColour}
      />

      <main key={generation} id="main" className="stage" tabIndex={-1}>
        <HeroBootSequence live={booted} />
        <Manifesto />
        <AIResearchVault />
        <ServiceLog />
        <FieldOps />
        <OffDuty />
        <Contact cvRequest={cvRequest} />
      </main>

      <GlitchTransition mode={mode} />
      <AnimatePresence>
        {showBoot && (
          <BootSequence key={`boot-${run}`} palette={repaint} onCovered={coverPage} onFinish={finishBoot} />
        )}
      </AnimatePresence>
    </MotionConfig>
  );
}

export default App;
