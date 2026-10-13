import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { MotionConfig } from "framer-motion";
import { FeaturedProjects } from "./FeaturedProjects";

// Two stand-in demos. Each shows the scene it is given, and whether it is playing, so the
// tests can read what the player asks of the demo. The demos are loaded through dynamic
// import, which these factories answer.
jest.mock("./demos/LocalMindDemo", () => {
  const h = require("react").createElement;
  return {
    __esModule: true,
    scenes: [
      { id: "a", caption: "Scene one", ms: 4000 },
      { id: "b", caption: "Scene two", ms: 4000 },
      { id: "c", caption: "Scene three", ms: 4000 },
    ],
    default: function FakeLocal({ scene, playing, reducedMotion }) {
      return h("div", { "data-testid": "local-demo", "data-scene": scene, "data-playing": String(playing), "data-reduced": String(reducedMotion) });
    },
  };
});
jest.mock("./demos/TensoRoomDemo", () => {
  const h = require("react").createElement;
  return {
    __esModule: true,
    scenes: [
      { id: "x", caption: "Room one", ms: 4000 },
      { id: "y", caption: "Room two", ms: 4000 },
    ],
    default: function FakeRoom({ scene, playing, reducedMotion }) {
      return h("div", { "data-testid": "room-demo", "data-scene": scene, "data-playing": String(playing), "data-reduced": String(reducedMotion) });
    },
  };
});

const projects = [
  {
    id: "alpha",
    name: "LocalMind",
    category: "Tools",
    categories: ["tools"],
    tags: ["React"],
    image: "alpha.jpg",
    alt: "Alpha plate",
    featured: { pitch: "A pitch.", facts: ["One fact"], demo: "localmind" },
  },
  {
    id: "beta",
    name: "TensoRoom",
    category: "Photos",
    categories: ["photos"],
    tags: ["Python"],
    image: "beta.jpg",
    alt: "Beta plate",
    featured: { pitch: "Another pitch.", facts: ["Two"], demo: "tensoroom" },
  },
];

// jsdom has no layout, so "wide" is decided by a matchMedia stand-in: the default in setupTests
// is a wide screen; narrow() makes it one column (under 900px).
const realMatchMedia = window.matchMedia;
const realObserver = window.IntersectionObserver;
function narrow() {
  window.matchMedia = (query) => ({
    matches: !/min-width/.test(query),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
  });
}

// Lets the demo modules' promises resolve.
const flush = () => act(async () => {
  await Promise.resolve();
  await Promise.resolve();
});

// Cards and cells. A cell is the grid item (li) that holds a card and, while a demo covers it, the panel.
const card = (name) => screen.getByRole("article", { name });
const local = () => card("LocalMind");
const room = () => card("TensoRoom");
const cell = (id) => {
  // eslint-disable-next-line testing-library/no-node-access
  return document.querySelector(`li[data-id="${id}"]`);
};
const panel = (title) => screen.getByRole("region", { name: `${title} demo` });
const playCard = (name) => screen.getByRole("button", { name: `Play demo for ${name}` });
const captionText = (region) => {
  // eslint-disable-next-line testing-library/no-node-access
  return region.querySelector(".fdemo-caption").textContent;
};
const shownOf = (region) => region.getAttribute("data-show");
const demoOf = (region, testId) => within(region).getByTestId(testId);

beforeEach(() => {
  jest.useFakeTimers();
  window.matchMedia = realMatchMedia;
});

afterEach(() => {
  jest.useRealTimers();
  window.IntersectionObserver = realObserver;
  window.matchMedia = realMatchMedia;
});

async function renderFeatured(list = projects) {
  render(<FeaturedProjects projects={list} />);
  await flush();
}

async function startLocal() {
  fireEvent.click(playCard("LocalMind"));
  await flush();
}

test("on a wide screen, a demo covers the other card: it sits in that card's cell, and that card is inert", async () => {
  await renderFeatured();
  await startLocal();

  expect(within(cell("beta")).getByRole("region", { name: "LocalMind demo" })).toBe(panel("LocalMind"));
  expect(cell("alpha").querySelector('[role="region"]')).toBeNull();
  expect(room()).toHaveAttribute("inert");
  expect(local()).not.toHaveAttribute("inert");
  // The card it started from stays usable, and says Pause.
  expect(within(local()).getByRole("button", { name: "Pause demo for LocalMind" })).toBeInTheDocument();
});

test("on a narrow screen, the demo covers its own card: the panel is in that cell, and the focus goes to the X", async () => {
  narrow();
  await renderFeatured();
  await startLocal();

  expect(within(cell("alpha")).getByRole("region", { name: "LocalMind demo" })).toBe(panel("LocalMind"));
  expect(room()).not.toHaveAttribute("inert");
  expect(local()).toHaveAttribute("inert");
  expect(within(panel("LocalMind")).getByRole("button", { name: "Close the LocalMind demo" })).toHaveFocus();
});

test("the X puts the card back: the panel fades, the card is live, focus returns, and the label is Play demo", async () => {
  await renderFeatured();
  await startLocal();
  const close = within(panel("LocalMind")).getByRole("button", { name: "Close the LocalMind demo" });
  act(() => close.focus());

  fireEvent.click(close);
  expect(shownOf(panel("LocalMind"))).toBe("false");
  expect(panel("LocalMind")).toHaveAttribute("inert"); // closed: out of the tab order and the accessibility tree
  expect(room()).not.toHaveAttribute("inert");
  expect(playCard("LocalMind")).toHaveTextContent("Play demo");
  expect(playCard("LocalMind")).toHaveFocus();
  expect(jest.getTimerCount()).toBe(0);
});

test("on a narrow screen, the X closes the demo over its own card, and the card is live again", async () => {
  narrow();
  await renderFeatured();
  await startLocal();
  fireEvent.click(within(panel("LocalMind")).getByRole("button", { name: "Close the LocalMind demo" }));

  expect(shownOf(panel("LocalMind"))).toBe("false");
  expect(local()).not.toHaveAttribute("inert");
  expect(playCard("LocalMind")).toHaveFocus();
});

test("Escape closes the demo while focus is in the panel", async () => {
  await renderFeatured();
  await startLocal();
  act(() => within(panel("LocalMind")).getByRole("button", { name: "Close the LocalMind demo" }).focus());

  fireEvent.keyDown(document.activeElement, { key: "Escape" });
  expect(shownOf(panel("LocalMind"))).toBe("false");
  expect(room()).not.toHaveAttribute("inert");
  expect(playCard("LocalMind")).toHaveFocus();
});

test("Escape closes the demo while focus is on the card it started from", async () => {
  await renderFeatured();
  await startLocal();
  const pause = screen.getByRole("button", { name: "Pause demo for LocalMind" });
  act(() => pause.focus());

  fireEvent.keyDown(pause, { key: "Escape" });
  expect(shownOf(panel("LocalMind"))).toBe("false");
});

test("Escape does nothing while focus is elsewhere on the page", async () => {
  await renderFeatured();
  await startLocal();
  act(() => document.activeElement.blur());

  fireEvent.keyDown(document.body, { key: "Escape" });
  expect(shownOf(panel("LocalMind"))).toBe("true");
});

test("play starts the scenes, and each scene advances on its own", async () => {
  await renderFeatured();
  await startLocal();

  expect(captionText(panel("LocalMind"))).toBe("Scene one");
  expect(demoOf(panel("LocalMind"), "local-demo")).toHaveAttribute("data-scene", "0");
  expect(demoOf(panel("LocalMind"), "local-demo")).toHaveAttribute("data-playing", "true");

  act(() => jest.advanceTimersByTime(4000));
  expect(captionText(panel("LocalMind"))).toBe("Scene two");
  expect(demoOf(panel("LocalMind"), "local-demo")).toHaveAttribute("data-scene", "1");
});

test("the caption is an aria-live region, and the scene dots follow the scene", async () => {
  await renderFeatured();
  await startLocal();
  // eslint-disable-next-line testing-library/no-node-access
  expect(panel("LocalMind").querySelector(".fdemo-caption")).toHaveAttribute("aria-live", "polite");
  act(() => jest.advanceTimersByTime(4000));
  // eslint-disable-next-line testing-library/no-node-access
  const current = [...panel("LocalMind").querySelectorAll(".fdemo-dots li")].findIndex((li) => li.classList.contains("is-current"));
  expect(current).toBe(1);
});

test("pause freezes the scene, and play resumes from the same point", async () => {
  await renderFeatured();
  await startLocal();
  act(() => jest.advanceTimersByTime(1000));

  fireEvent.click(within(panel("LocalMind")).getByRole("button", { name: "Pause the LocalMind demo" }));
  expect(demoOf(panel("LocalMind"), "local-demo")).toHaveAttribute("data-playing", "false");

  // Paused, nothing moves for a long time.
  act(() => jest.advanceTimersByTime(10000));
  expect(captionText(panel("LocalMind"))).toBe("Scene one");

  // Resumed, the scene has its remaining 3 s, not a fresh 4 s.
  fireEvent.click(within(panel("LocalMind")).getByRole("button", { name: "Play the LocalMind demo" }));
  expect(demoOf(panel("LocalMind"), "local-demo")).toHaveAttribute("data-playing", "true");
  act(() => jest.advanceTimersByTime(2999));
  expect(captionText(panel("LocalMind"))).toBe("Scene one");
  act(() => jest.advanceTimersByTime(1));
  expect(captionText(panel("LocalMind"))).toBe("Scene two");
});

test("the card's button, the round control on the card and the one in the panel stay in sync", async () => {
  await renderFeatured();
  expect(playCard("LocalMind")).toHaveTextContent("Play demo");
  expect(within(local()).getByRole("button", { name: "Play the LocalMind demo" })).toBeInTheDocument();

  fireEvent.click(playCard("LocalMind"));
  await flush();
  expect(within(local()).getByRole("button", { name: "Pause demo for LocalMind" })).toBeInTheDocument();
  expect(within(local()).getByRole("button", { name: "Pause the LocalMind demo" })).toBeInTheDocument();
  expect(within(panel("LocalMind")).getByRole("button", { name: "Pause the LocalMind demo" })).toBeInTheDocument();

  fireEvent.click(within(panel("LocalMind")).getByRole("button", { name: "Pause the LocalMind demo" }));
  expect(within(local()).getByRole("button", { name: "Play demo for LocalMind" })).toBeInTheDocument();
  expect(within(local()).getByRole("button", { name: "Play the LocalMind demo" })).toBeInTheDocument();
  expect(within(panel("LocalMind")).getByRole("button", { name: "Play the LocalMind demo" })).toBeInTheDocument();

  // Pressing the card's button resumes what the panel's control paused.
  fireEvent.click(playCard("LocalMind"));
  expect(within(panel("LocalMind")).getByRole("button", { name: "Pause the LocalMind demo" })).toBeInTheDocument();
});

test("the last scene is held, the panel fades, and Replay plays it again", async () => {
  await renderFeatured();
  await startLocal();
  act(() => jest.advanceTimersByTime(4000));
  act(() => jest.advanceTimersByTime(4000));
  expect(captionText(panel("LocalMind"))).toBe("Scene three");

  // The last scene runs 4 s and is held for 2 s more, then the panel fades back to the card.
  act(() => jest.advanceTimersByTime(5999));
  expect(shownOf(panel("LocalMind"))).toBe("true");
  act(() => jest.advanceTimersByTime(1));
  expect(shownOf(panel("LocalMind"))).toBe("false");
  expect(panel("LocalMind")).toHaveAttribute("inert");
  expect(room()).not.toHaveAttribute("inert");
  expect(within(local()).getByRole("button", { name: "Replay demo for LocalMind" })).toBeInTheDocument();
  expect(within(local()).getByRole("button", { name: "Replay the LocalMind demo" })).toBeInTheDocument();
  expect(jest.getTimerCount()).toBe(0);

  fireEvent.click(within(local()).getByRole("button", { name: "Replay the LocalMind demo" }));
  expect(shownOf(panel("LocalMind"))).toBe("true");
  expect(captionText(panel("LocalMind"))).toBe("Scene one");
  expect(demoOf(panel("LocalMind"), "local-demo")).toHaveAttribute("data-scene", "0");
});

test("only one demo plays at a time: the panel moves to the other card, and the first card goes back to Play", async () => {
  await renderFeatured();
  await startLocal();
  act(() => jest.advanceTimersByTime(1000));

  fireEvent.click(playCard("TensoRoom"));
  await flush();

  // TensoRoom is playing, over LocalMind's cell now (the card beside it); LocalMind's own panel is gone.
  expect(screen.queryByRole("region", { name: "LocalMind demo" })).toBeNull();
  expect(within(cell("alpha")).getByRole("region", { name: "TensoRoom demo" })).toBe(panel("TensoRoom"));
  expect(local()).toHaveAttribute("inert");
  expect(room()).not.toHaveAttribute("inert");
  expect(playCard("LocalMind")).toBeInTheDocument();
  expect(within(local()).getByRole("button", { name: "Play demo for LocalMind" })).toBeInTheDocument();
  expect(captionText(panel("TensoRoom"))).toBe("Room one");
  expect(demoOf(panel("TensoRoom"), "room-demo")).toHaveAttribute("data-playing", "true");
});

test("a demo with no partner card covers its own card, even on a wide screen", async () => {
  await renderFeatured([projects[0]]);
  await startLocal();

  expect(within(cell("alpha")).getByRole("region", { name: "LocalMind demo" })).toBe(panel("LocalMind"));
  expect(local()).toHaveAttribute("inert");
  expect(within(panel("LocalMind")).getByRole("button", { name: "Close the LocalMind demo" })).toHaveFocus();
});

test("auto-pauses when its panel is off screen, and resumes when it is back", async () => {
  // Every observer reports through here: the panel is the only thing observed.
  const reports = [];
  class FakeObserver {
    constructor(callback) {
      reports.push(callback);
    }

    observe() {}

    disconnect() {}
  }
  window.IntersectionObserver = FakeObserver;
  await renderFeatured();
  await startLocal();
  act(() => jest.advanceTimersByTime(1000));

  act(() => reports.forEach((report) => report([{ isIntersecting: false }])));
  expect(demoOf(panel("LocalMind"), "local-demo")).toHaveAttribute("data-playing", "false");
  act(() => jest.advanceTimersByTime(10000));
  expect(captionText(panel("LocalMind"))).toBe("Scene one");
  // Its phase is kept: the card still offers Pause, and the panel is still playing.
  expect(within(local()).getByRole("button", { name: "Pause demo for LocalMind" })).toBeInTheDocument();

  act(() => reports.forEach((report) => report([{ isIntersecting: true }])));
  expect(demoOf(panel("LocalMind"), "local-demo")).toHaveAttribute("data-playing", "true");
  act(() => jest.advanceTimersByTime(3000));
  expect(captionText(panel("LocalMind"))).toBe("Scene two");
});

test("with reduced motion there is no timer: the control steps through the scenes, and the X still closes", async () => {
  render(
    <MotionConfig reducedMotion="always">
      <FeaturedProjects projects={projects} />
    </MotionConfig>,
  );
  await flush();
  expect(within(local()).getByRole("button", { name: "Play the LocalMind demo" })).toBeInTheDocument();

  fireEvent.click(within(local()).getByRole("button", { name: "Play the LocalMind demo" }));
  await flush();
  expect(demoOf(panel("LocalMind"), "local-demo")).toHaveAttribute("data-reduced", "true");
  expect(captionText(panel("LocalMind"))).toBe("Scene one");
  act(() => jest.advanceTimersByTime(30000));
  expect(captionText(panel("LocalMind"))).toBe("Scene one");
  expect(demoOf(panel("LocalMind"), "local-demo")).toHaveAttribute("data-playing", "false");
  expect(within(panel("LocalMind")).getByRole("button", { name: "Next scene of the LocalMind demo" })).toBeInTheDocument();

  fireEvent.click(within(local()).getByRole("button", { name: "Next scene for LocalMind" }));
  expect(captionText(panel("LocalMind"))).toBe("Scene two");
  fireEvent.click(within(panel("LocalMind")).getByRole("button", { name: "Next scene of the LocalMind demo" }));
  expect(captionText(panel("LocalMind"))).toBe("Scene three");

  // After the last scene, the next press returns to the card.
  fireEvent.click(within(panel("LocalMind")).getByRole("button", { name: "Next scene of the LocalMind demo" }));
  expect(shownOf(panel("LocalMind"))).toBe("false");
  expect(playCard("LocalMind")).toHaveTextContent("Play demo");

  // And a fresh run can be closed with the X.
  fireEvent.click(playCard("LocalMind"));
  fireEvent.click(within(panel("LocalMind")).getByRole("button", { name: "Close the LocalMind demo" }));
  expect(shownOf(panel("LocalMind"))).toBe("false");
});

test("leaving the card unmounted leaves no timers behind", async () => {
  const { unmount } = render(<FeaturedProjects projects={projects} />);
  await flush();
  await startLocal();
  unmount();
  expect(jest.getTimerCount()).toBe(0);
});

test("the Play controls preload the demo on hover, so the first play has no wait", async () => {
  await renderFeatured();
  fireEvent.mouseEnter(playCard("LocalMind"));
  await flush();

  // The module is in: the first play shows the scene at once, with no further flush.
  fireEvent.click(playCard("LocalMind"));
  expect(demoOf(panel("LocalMind"), "local-demo")).toHaveAttribute("data-scene", "0");
});
