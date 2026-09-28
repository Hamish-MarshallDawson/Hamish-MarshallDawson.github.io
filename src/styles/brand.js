// Keeps the browser chrome in step with the palette, so re-colouring the
// site is one edit to --signal in tokens.css: the mobile address-bar colour
// (theme-color) and the tab icon are both rebuilt from the token at start.
// In development it also checks the new colour still clears 4.5:1 against
// the white text the site sets on it.

const channel = (c) => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};

const luminance = ([r, g, b]) => 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);

export function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// Any CSS colour → [r, g, b]. A canvas normalises named colours, rgb() and
// short hex to #rrggbb; null where there's no canvas (tests) or no match.
function toRgb(colour) {
  const ctx = document.createElement("canvas").getContext?.("2d");
  if (!ctx) return null;
  ctx.fillStyle = "#000";
  ctx.fillStyle = colour;
  const match = /^#([0-9a-f]{6})$/i.exec(ctx.fillStyle);
  if (!match) return null;
  const n = parseInt(match[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const icon = (fill, mark) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="${fill}"/><path d="M14 14h9v14h18V14h9v36h-9V36H23v14h-9z" fill="${mark}"/></svg>`;

export function syncBrandColour() {
  const styles = getComputedStyle(document.documentElement);
  const signal = styles.getPropertyValue("--signal").trim();
  const paper = styles.getPropertyValue("--paper").trim() || "#ffffff";
  if (!signal) return;

  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", signal);
  document
    .querySelector('link[rel="icon"]')
    ?.setAttribute("href", `data:image/svg+xml,${encodeURIComponent(icon(signal, paper))}`);

  if (process.env.NODE_ENV === "development") {
    const fg = toRgb(paper);
    const bg = toRgb(signal);
    const ratio = fg && bg ? contrast(fg, bg) : null;
    if (ratio !== null && ratio < 4.5) {
      console.warn(
        `[palette] --signal ${signal} gives ${ratio.toFixed(2)}:1 against the white text set on it; ` +
          "it needs 4.5:1. Pick a darker or more saturated colour (options listed in src/styles/tokens.css)."
      );
    }
  }
}
