// jest-dom adds custom jest matchers for asserting on DOM nodes.
import "@testing-library/jest-dom";

// jsdom leaves out several browser APIs the terminal leans on. These stand-ins
// only need to exist and behave plausibly; layout-driven behaviour (scroll
// spying, canvas drawing) is exercised in a real browser, not here.

// Everything reports "wide desktop, no reduced-motion preference".
window.matchMedia = (query) => ({
  matches: /min-width/.test(query),
  media: query,
  onchange: null,
  addEventListener: () => {},
  removeEventListener: () => {},
  addListener: () => {},
  removeListener: () => {},
  dispatchEvent: () => false,
});

class NoopObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}
window.IntersectionObserver = NoopObserver;
window.ResizeObserver = NoopObserver;

Element.prototype.scrollIntoView = () => {};
HTMLCanvasElement.prototype.getContext = () => null;

// The vault asks GitHub for live repo data. Tests run offline, so the request
// just never answers and the curated data stands, as it does on a flaky link.
global.fetch = () => new Promise(() => {});
