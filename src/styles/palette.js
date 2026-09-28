import { contrast, syncBrandColour } from "./brand";

// The colours a visitor can switch the site to from the header's Colour
// menu. Each one clears 4.5:1 against the white text the site sets on it.
// The site's default is whatever --signal says in tokens.css.
export const PALETTE = [
  { id: "electric-blue", name: "Electric blue", hex: "#1f1fff" },
  { id: "violet", name: "Violet", hex: "#6a00f4" },
  { id: "cobalt", name: "Cobalt", hex: "#0047ab" },
  { id: "deep-orange", name: "Deep orange", hex: "#c43d00" },
  { id: "hot-pink", name: "Hot pink", hex: "#d6006f" },
  { id: "signal-red", name: "Signal red", hex: "#e10600" },
  { id: "racing-green", name: "Racing green", hex: "#00843d" },
];

const KEY = "hmd:colour";

const rgb = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

// "7.19:1" — the contrast of white text on the colour.
export const ratioOf = (hex) => `${contrast(rgb(hex), [255, 255, 255]).toFixed(2)}:1`;

export function storedColour() {
  try {
    return PALETTE.find((entry) => entry.id === localStorage.getItem(KEY)) ?? null;
  } catch {
    return null;
  }
}

export function storeColour(entry) {
  try {
    localStorage.setItem(KEY, entry.id);
  } catch {
    /* not remembered, still applied */
  }
}

// Paints the page in a palette entry by overriding --signal on <html>, then
// rebuilds the favicon and browser-bar colour to match.
export function applyColour(entry) {
  if (entry) document.documentElement.style.setProperty("--signal", entry.hex);
  else document.documentElement.style.removeProperty("--signal");
  syncBrandColour();
}

// The entry the page is showing right now (a stored choice, else the
// tokens.css default), or null if the default isn't one of the palette.
export function activeColour() {
  const hex = getComputedStyle(document.documentElement).getPropertyValue("--signal").trim().toLowerCase();
  return PALETTE.find((entry) => entry.hex === hex) ?? null;
}
