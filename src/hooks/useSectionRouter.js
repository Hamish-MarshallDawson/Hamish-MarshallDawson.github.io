import { useCallback, useEffect, useRef, useState } from "react";

// "#vault/robotics" → { id: "vault", sub: "robotics" }. Unknown sections →
// null. `aliases` maps old route names onto current ones.
export function parseHash(hash, ids, aliases = {}) {
  const [raw, sub = null] = hash.replace(/^#/, "").split("/");
  const id = aliases[raw] ?? raw;
  return ids.includes(id) ? { id, sub } : null;
}

// Router for a single scrolling page: each section is a route. Links are
// plain #anchors, so the browser handles history and smooth scrolling; this
// hook tracks which section is in view, mirrors it into the URL, and honours
// deep links like #reach-out once the boot screen is out of the way. Hash
// URLs also work on GitHub Pages without the 404.html redirect BrowserRouter
// needs. Bump `version` when the sections remount so they're re-observed.
export function useSectionRouter(ids, { ready = true, aliases = {}, version = 0 } = {}) {
  const deepLink = useRef(parseHash(window.location.hash, ids, aliases));
  const [active, setActive] = useState(deepLink.current?.id ?? ids[0]);

  // html has scroll-behavior: smooth, so an instant jump briefly overrides it
  // ("instant" as a behavior value isn't safe on older Safari).
  const scrollToSection = useCallback((id, { instant = false } = {}) => {
    const el = document.getElementById(id);
    if (!el?.scrollIntoView) return;
    const root = document.documentElement;
    if (instant) root.style.scrollBehavior = "auto";
    el.scrollIntoView({ block: "start" });
    if (instant) root.style.scrollBehavior = "";
  }, []);

  // A section is active while it crosses a thin line just under the middle of
  // the viewport. Sections are contiguous, so exactly one holds it at a time.
  useEffect(() => {
    if (!ready || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: "-45% 0px -54% 0px" }
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [ids, ready, version]);

  // replaceState rather than pushState: scrolling shouldn't fill history.
  // An old alias in the address bar is swapped for the current name.
  useEffect(() => {
    if (!ready) return;
    const raw = window.location.hash.replace(/^#/, "").split("/")[0];
    const current = parseHash(window.location.hash, ids, aliases);
    if (current?.id === active && !(raw in aliases)) return; // keeps sub-paths like #vault/robotics
    const { pathname, search } = window.location;
    window.history.replaceState(null, "", active === ids[0] ? pathname + search : `#${active}`);
  }, [active, ids, ready, aliases]);

  // A deep link is honoured once, when the page first becomes ready — not
  // again after a colour change resets the page to the top.
  useEffect(() => {
    if (!ready || !deepLink.current) return;
    scrollToSection(deepLink.current.id, { instant: true });
    deepLink.current = null;
  }, [ready, scrollToSection]);

  // For navigation that doesn't come from an anchor (the HUD drawer, CV
  // requests). Pushes an entry so Back returns to where the visitor was.
  const navigate = useCallback(
    (id, sub) => {
      const hash = `#${sub ? `${id}/${sub}` : id}`;
      if (window.location.hash !== hash) window.history.pushState(null, "", hash);
      scrollToSection(id);
    },
    [scrollToSection]
  );

  return { active, navigate };
}
