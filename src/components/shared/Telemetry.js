import { useEffect, useState } from "react";

// Live UTC clock for the HUD readouts.
export function Clock({ className }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <time className={className} dateTime={now.toISOString()}>
      {now.toISOString().slice(11, 19)} UTC
    </time>
  );
}

// The lobby's FPS readout, measured for real from requestAnimationFrame.
// Browsers pause rAF in background tabs, so this costs nothing there.
export function Fps({ className }) {
  const [fps, setFps] = useState(null);

  useEffect(() => {
    let frames = 0;
    let last = performance.now();
    let frame = requestAnimationFrame(function tick(t) {
      frames += 1;
      if (t - last >= 1000) {
        setFps(Math.round((frames * 1000) / (t - last)));
        frames = 0;
        last = t;
      }
      frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  return <span className={className}>{fps ?? "--"} FPS</span>;
}

// Whether the browser currently has a network connection.
export function useOnline() {
  const [online, setOnline] = useState(() => navigator.onLine ?? true);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  return online;
}

// Real round-trip for the page request that loaded this session (request
// sent → first byte back). Null where the Navigation Timing API isn't there.
export function linkLatency() {
  const nav = window.performance?.getEntriesByType?.("navigation")?.[0];
  if (!nav || !nav.responseStart || !nav.requestStart) return null;
  return Math.max(1, Math.round(nav.responseStart - nav.requestStart));
}
