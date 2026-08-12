import { useEffect } from "react";

/**
 * The two accent blobs behind the page. Ambient drift lives on the orbs
 * themselves (CSS keyframes); scroll position comes in through a --scroll
 * custom property so the two motions never fight over the same transform.
 */
export default function BackgroundOrbs() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches) return undefined;

    let frame = 0;

    const update = () => {
      frame = 0;
      const max =
        document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? window.scrollY / max : 0;
      document.documentElement.style.setProperty(
        "--scroll",
        progress.toFixed(4)
      );
    };

    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
      document.documentElement.style.removeProperty("--scroll");
    };
  }, []);

  return (
    <div className="bg-orbs" aria-hidden="true">
      <span className="bg-orb bg-orb-a" />
      <span className="bg-orb bg-orb-b" />
    </div>
  );
}
