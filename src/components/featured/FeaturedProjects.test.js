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

// Lets the demo modules' promises resolve.
const flush = () => act(async () => {
  await Promise.resolve();
  await Promise.resolve();
});

const card = (name) => screen.getByRole("article", { name });
const local = () => card("LocalMind");
const playCard = () => screen.getByRole("button", { name: "Play demo for LocalMind" });
const playRound = () => screen.getByRole("button", { name: "Play the LocalMind demo" });
const captionText = (article) => {
  // eslint-disable-next-line testing-library/no-node-access
  return article.querySelector(".fdemo-caption").textContent;
};
const layerShown = (article) => {
  // eslint-disable-next-line testing-library/no-node-access
  return article.querySelector(".fdemo-layer")?.getAttribute("data-show");
};
const demoOf = (article) => within(article).getByTestId(article === local() ? "local-demo" : "room-demo");
const nextCard = () => screen.getByRole("button", { name: "Next scene for LocalMind" });

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
  delete global.IntersectionObserver;
});

async function renderFeatured() {
  render(<FeaturedProjects projects={projects} />);
  await flush();
}

async function startLocal() {
  fireEvent.click(playCard());
  await flush();
}

test("the card keeps its picture box, and the demo plays over it: no stage, no bar", async () => {
  await renderFeatured();
  const before = local().querySelector(".feat-media");
  await startLocal();

  // The same box: the demo is a layer inside it, not a new section elsewhere on the page.
  expect(local().querySelector(".feat-media")).toBe(before);
  expect(before.querySelector(".fdemo-layer")).not.toBeNull();
  expect(document.querySelector("#feat-stage")).toBeNull();
  expect(screen.queryByRole("button", { name: "Close demo" })).toBeNull();
});

test("the round control sits in the picture box, with the accessible name Play the LocalMind demo", async () => {
  await renderFeatured();
  expect(local().querySelector(".feat-media .fdemo-round")).toBe(playRound());
  expect(playRound()).toHaveAttribute("aria-label", "Play the LocalMind demo");
});

test("play starts the scenes, and each scene advances on its own", async () => {
  await renderFeatured();
  await startLocal();

  expect(captionText(local())).toBe("Scene one");
  expect(demoOf(local())).toHaveAttribute("data-scene", "0");
  expect(demoOf(local())).toHaveAttribute("data-playing", "true");

  act(() => jest.advanceTimersByTime(4000));
  expect(captionText(local())).toBe("Scene two");
  expect(demoOf(local())).toHaveAttribute("data-scene", "1");
});

test("the caption is an aria-live region, and the scene dots follow the scene", async () => {
  await renderFeatured();
  await startLocal();
  // eslint-disable-next-line testing-library/no-node-access
  expect(local().querySelector(".fdemo-caption")).toHaveAttribute("aria-live", "polite");
  act(() => jest.advanceTimersByTime(4000));
  // eslint-disable-next-line testing-library/no-node-access
  const current = [...local().querySelectorAll(".fdemo-dots li")].findIndex((li) => li.classList.contains("is-current"));
  expect(current).toBe(1);
});

test("pause freezes the scene, and play resumes from the same point", async () => {
  await renderFeatured();
  await startLocal();
  act(() => jest.advanceTimersByTime(1000));

  fireEvent.click(screen.getByRole("button", { name: "Pause the LocalMind demo" }));
  expect(playRound()).toHaveAccessibleName("Play the LocalMind demo");
  expect(demoOf(local())).toHaveAttribute("data-playing", "false");

  // Paused, nothing moves for a long time.
  act(() => jest.advanceTimersByTime(10000));
  expect(captionText(local())).toBe("Scene one");

  // Resumed, the scene has its remaining 3 s, not a fresh 4 s.
  fireEvent.click(playRound());
  expect(demoOf(local())).toHaveAttribute("data-playing", "true");
  act(() => jest.advanceTimersByTime(2999));
  expect(captionText(local())).toBe("Scene one");
  act(() => jest.advanceTimersByTime(1));
  expect(captionText(local())).toBe("Scene two");
});

test("the card's button and the round control stay in sync", async () => {
  await renderFeatured();
  expect(playCard()).toHaveTextContent("Play demo");
  expect(playRound()).toHaveAccessibleName("Play the LocalMind demo");

  fireEvent.click(playCard());
  await flush();
  expect(screen.getByRole("button", { name: "Pause demo for LocalMind" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Pause the LocalMind demo" })).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Pause the LocalMind demo" }));
  expect(screen.getByRole("button", { name: "Play demo for LocalMind" })).toBeInTheDocument();
  expect(playRound()).toHaveAccessibleName("Play the LocalMind demo");

  // Pressing the card's button resumes what the round control paused.
  fireEvent.click(screen.getByRole("button", { name: "Play demo for LocalMind" }));
  expect(screen.getByRole("button", { name: "Pause the LocalMind demo" })).toBeInTheDocument();
});

test("the last scene is held, then the picture comes back, and Replay plays it again", async () => {
  await renderFeatured();
  await startLocal();
  act(() => jest.advanceTimersByTime(4000));
  act(() => jest.advanceTimersByTime(4000));
  expect(captionText(local())).toBe("Scene three");

  // The last scene runs 4 s and is held for 2 s more, then the layer fades back to the picture.
  act(() => jest.advanceTimersByTime(5999));
  expect(layerShown(local())).toBe("true");
  act(() => jest.advanceTimersByTime(1));
  expect(layerShown(local())).toBe("false");
  expect(screen.getByRole("button", { name: "Replay the LocalMind demo" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Replay demo for LocalMind" })).toBeInTheDocument();
  expect(jest.getTimerCount()).toBe(0);

  fireEvent.click(screen.getByRole("button", { name: "Replay the LocalMind demo" }));
  expect(captionText(local())).toBe("Scene one");
  expect(demoOf(local())).toHaveAttribute("data-scene", "0");
});

test("only one demo plays at a time: starting one resets the other", async () => {
  await renderFeatured();
  await startLocal();
  act(() => jest.advanceTimersByTime(1000));

  fireEvent.click(screen.getByRole("button", { name: "Play demo for TensoRoom" }));
  await flush();

  expect(layerShown(local())).toBe("false");
  expect(playCard()).toHaveTextContent("Play demo");
  expect(captionText(card("TensoRoom"))).toBe("Room one");
  expect(demoOf(card("TensoRoom"))).toHaveAttribute("data-playing", "true");
});

test("auto-pauses when its box is off screen, and resumes when it is back", async () => {
  // Every observer reports through here: each card has its own box.
  const reports = [];
  class FakeObserver {
    constructor(callback) {
      reports.push(callback);
    }

    observe() {}

    disconnect() {}
  }
  global.IntersectionObserver = FakeObserver;
  await renderFeatured();
  await startLocal();
  act(() => jest.advanceTimersByTime(1000));

  act(() => reports.forEach((report) => report([{ isIntersecting: false }])));
  expect(demoOf(local())).toHaveAttribute("data-playing", "false");
  act(() => jest.advanceTimersByTime(10000));
  expect(captionText(local())).toBe("Scene one");
  // Its phase is kept: the card still offers Pause, and the box is still playing.
  expect(screen.getByRole("button", { name: "Pause demo for LocalMind" })).toBeInTheDocument();

  act(() => reports.forEach((report) => report([{ isIntersecting: true }])));
  expect(demoOf(local())).toHaveAttribute("data-playing", "true");
  act(() => jest.advanceTimersByTime(3000));
  expect(captionText(local())).toBe("Scene two");
});

test("with reduced motion there is no timer: the control steps through the scenes", async () => {
  render(
    <MotionConfig reducedMotion="always">
      <FeaturedProjects projects={projects} />
    </MotionConfig>,
  );
  await flush();
  expect(playRound()).toHaveAccessibleName("Play the LocalMind demo");

  fireEvent.click(playRound());
  await flush();
  expect(demoOf(local())).toHaveAttribute("data-reduced", "true");
  expect(captionText(local())).toBe("Scene one");
  act(() => jest.advanceTimersByTime(30000));
  expect(captionText(local())).toBe("Scene one");
  expect(demoOf(local())).toHaveAttribute("data-playing", "false");
  expect(screen.getByRole("button", { name: "Next scene of the LocalMind demo" })).toBeInTheDocument();
  expect(nextCard()).toBeInTheDocument();

  fireEvent.click(nextCard());
  expect(captionText(local())).toBe("Scene two");
  fireEvent.click(screen.getByRole("button", { name: "Next scene of the LocalMind demo" }));
  expect(captionText(local())).toBe("Scene three");

  // After the last scene, the next press returns to the picture.
  fireEvent.click(screen.getByRole("button", { name: "Next scene of the LocalMind demo" }));
  expect(layerShown(local())).toBe("false");
  expect(playCard()).toHaveTextContent("Play demo");
});

test("leaving the card unmounted leaves no timers behind", async () => {
  const { unmount } = render(<FeaturedProjects projects={projects} />);
  await flush();
  await startLocal();
  unmount();
  expect(jest.getTimerCount()).toBe(0);
});

test("the Play controls preload the demo on hover, before the first play", async () => {
  await renderFeatured();
  fireEvent.mouseEnter(playCard());
  await flush();
  // The module is in, so the layer is there, hidden until the first play fades it in.
  // eslint-disable-next-line testing-library/no-node-access
  expect(local().querySelector(".fdemo-layer")).not.toBeNull();
  expect(layerShown(local())).toBe("false");
  expect(playCard()).toHaveTextContent("Play demo");
});
