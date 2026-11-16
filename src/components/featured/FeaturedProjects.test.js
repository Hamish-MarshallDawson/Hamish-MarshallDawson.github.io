import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { MotionConfig } from "framer-motion";
import { FeaturedProjects, sideFor } from "./FeaturedProjects";

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

jest.mock("./demos/GyminitDemo", () => {
  const h = require("react").createElement;
  return {
    __esModule: true,
    scenes: [{ id: "g", caption: "Gym one", ms: 4000 }],
    default: function FakeGym() {
      return h("div", { "data-testid": "gym-demo" });
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
    name: "TensorRoom",
    category: "Photos",
    categories: ["photos"],
    tags: ["Python"],
    image: "beta.jpg",
    alt: "Beta plate",
    featured: { pitch: "Another pitch.", facts: ["Two"], demo: "tensoroom" },
  },
];

const gyminit = {
  id: "gamma",
  name: "Gyminit",
  category: "Personal",
  categories: ["performance"],
  tags: ["React"],
  image: "gamma.png",
  alt: "Gamma icon",
  url: "https://gyminit.example.workers.dev",
  featured: { pitch: "Third pitch.", facts: ["Three"], demo: "gyminit" },
};
const three = [...projects, gyminit];

const realMatchMedia = window.matchMedia;
const realObserver = window.IntersectionObserver;

// Lets the demo modules' promises resolve.
const flush = () => act(async () => {
  await Promise.resolve();
  await Promise.resolve();
});

// Cards and cells. A cell is the grid item (li) that holds a card and, while a demo covers it, the panel.
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

// The demo mounts once the card has grown into its panel (jsdom never reports the layout animation, so
// the 400 ms fallback does it).
const grow = () => act(() => jest.advanceTimersByTime(400));

async function startLocal() {
  fireEvent.click(playCard("LocalMind"));
  await flush();
  grow();
}

const info = (name) => screen.getByRole("article", { name });
const others = () => screen.getByRole("list", { name: /other builds/i });
const playing = () => document.querySelector(".feat-play"); // eslint-disable-line testing-library/no-node-access

test("the six builds sit on a grid of cards, each with its own Play demo", async () => {
  await renderFeatured(three);
  const grid = screen.getByRole("list", { name: "Featured projects" });
  expect(within(grid).getAllByRole("article")).toHaveLength(3);
  expect(within(grid).getAllByRole("button", { name: /^Play demo for/ })).toHaveLength(3);
  expect(screen.queryByRole("button", { name: /next projects/i })).toBeNull();
});

test("the column rule: left and middle cards put the panel on the left, right-column cards mirror it", () => {
  expect([0, 1, 2, 3, 4, 5].map(sideFor)).toEqual(["left", "left", "right", "left", "left", "right"]);
});

test("Play grows the card into an info panel beside the stage; the other builds go to a strip", async () => {
  await renderFeatured(three);
  await startLocal();

  expect(screen.queryByRole("list", { name: "Featured projects" })).toBeNull();
  expect(playing()).toHaveAttribute("data-side", "left");
  expect(info("LocalMind")).toHaveTextContent("A pitch.");
  expect(info("LocalMind")).toHaveTextContent("One fact");
  expect(info("LocalMind")).toHaveTextContent(/Playing · scene 1 \/ 3/);
  expect(screen.getByText("Now playing · 01 / 03")).toBeInTheDocument();
  expect(within(others()).getAllByRole("button").map((b) => b.textContent)).toEqual([
    "Play the demo of TensorRoom▶",
    "Play the demo of Gyminit▶",
  ]);
  expect(within(panel("LocalMind")).getByRole("button", { name: "Close the LocalMind demo" })).toHaveFocus();
});

test("a right-column card keeps its place: the stage opens to its left", async () => {
  await renderFeatured(three);
  fireEvent.click(playCard("Gyminit"));
  await flush();
  expect(playing()).toHaveAttribute("data-side", "right");
});

test("the X goes back to the grid, with focus on the card's Play button", async () => {
  await renderFeatured(three);
  await startLocal();
  fireEvent.click(within(panel("LocalMind")).getByRole("button", { name: "Close the LocalMind demo" }));

  expect(screen.getByRole("list", { name: "Featured projects" })).toBeInTheDocument();
  expect(screen.queryByRole("region", { name: "LocalMind demo" })).toBeNull();
  expect(playCard("LocalMind")).toHaveFocus();
});

test("Escape closes the stage from anywhere on the page, but not from inside a dialog", async () => {
  await renderFeatured(three);
  await startLocal();
  document.body.focus();

  const dialog = document.createElement("div");
  dialog.setAttribute("role", "dialog");
  const inside = document.createElement("button");
  dialog.appendChild(inside);
  document.body.appendChild(dialog);
  inside.focus();
  fireEvent.keyDown(inside, { key: "Escape" });
  expect(panel("LocalMind")).toBeInTheDocument();
  dialog.remove();

  fireEvent.keyDown(document.body, { key: "Escape" });
  expect(screen.queryByRole("region", { name: "LocalMind demo" })).toBeNull();
  expect(playCard("LocalMind")).toHaveFocus();
});

test("a build in the strip swaps the demo without closing it; closing then returns to that card", async () => {
  await renderFeatured(three);
  await startLocal();
  act(() => jest.advanceTimersByTime(1000));

  fireEvent.click(within(others()).getByRole("button", { name: /TensorRoom/ }));
  await flush();

  expect(screen.queryByRole("region", { name: "LocalMind demo" })).toBeNull();
  expect(captionText(panel("TensorRoom"))).toBe("Room one");
  expect(demoOf(panel("TensorRoom"), "room-demo")).toHaveAttribute("data-playing", "true");
  expect(info("TensorRoom")).toBeInTheDocument();
  expect(within(others()).getByRole("button", { name: /LocalMind/ })).toBeInTheDocument();
  expect(within(panel("TensorRoom")).getByRole("button", { name: "Close the TensorRoom demo" })).toHaveFocus();

  fireEvent.keyDown(document.body, { key: "Escape" });
  expect(playCard("TensorRoom")).toHaveFocus();
});

test("play starts the scenes, and each scene advances on its own", async () => {
  await renderFeatured();
  await startLocal();

  expect(captionText(panel("LocalMind"))).toBe("Scene one");
  expect(demoOf(panel("LocalMind"), "local-demo")).toHaveAttribute("data-scene", "0");
  expect(demoOf(panel("LocalMind"), "local-demo")).toHaveAttribute("data-playing", "true");

  act(() => jest.advanceTimersByTime(4000));
  expect(captionText(panel("LocalMind"))).toBe("Scene two");
  expect(info("LocalMind")).toHaveTextContent(/scene 2 \/ 3/);
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
  expect(info("LocalMind")).toHaveTextContent(/Paused/);

  act(() => jest.advanceTimersByTime(10000));
  expect(captionText(panel("LocalMind"))).toBe("Scene one");

  // Resumed, the scene has its remaining 3 s, not a fresh 4 s.
  fireEvent.click(within(panel("LocalMind")).getByRole("button", { name: "Play the LocalMind demo" }));
  act(() => jest.advanceTimersByTime(2999));
  expect(captionText(panel("LocalMind"))).toBe("Scene one");
  act(() => jest.advanceTimersByTime(1));
  expect(captionText(panel("LocalMind"))).toBe("Scene two");
});

test("the last scene is held on the stage, and Replay plays it again from the start", async () => {
  await renderFeatured();
  await startLocal();
  act(() => jest.advanceTimersByTime(4000));
  act(() => jest.advanceTimersByTime(4000));
  expect(captionText(panel("LocalMind"))).toBe("Scene three");

  // The last scene runs 4 s and is held for 2 s more; then the run ends but the stage stays open on it.
  act(() => jest.advanceTimersByTime(6000));
  expect(shownOf(panel("LocalMind"))).toBe("true");
  expect(captionText(panel("LocalMind"))).toBe("Scene three");
  expect(within(panel("LocalMind")).getByRole("button", { name: "Replay the LocalMind demo" })).toBeInTheDocument();
  expect(jest.getTimerCount()).toBe(0);

  fireEvent.click(within(panel("LocalMind")).getByRole("button", { name: /^↻ Replay/ }));
  await flush();
  expect(captionText(panel("LocalMind"))).toBe("Scene one");
  expect(demoOf(panel("LocalMind"), "local-demo")).toHaveAttribute("data-playing", "true");
});

test("auto-pauses when its stage is off screen, and resumes when it is back", async () => {
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

  act(() => reports.forEach((report) => report([{ isIntersecting: true }])));
  expect(demoOf(panel("LocalMind"), "local-demo")).toHaveAttribute("data-playing", "true");
  act(() => jest.advanceTimersByTime(3000));
  expect(captionText(panel("LocalMind"))).toBe("Scene two");
});

test("with FX off there is no timer: the control steps through the scenes, and the X still closes", async () => {
  render(
    <MotionConfig reducedMotion="always">
      <FeaturedProjects projects={projects} />
    </MotionConfig>,
  );
  await flush();
  await startLocal();
  expect(demoOf(panel("LocalMind"), "local-demo")).toHaveAttribute("data-reduced", "true");
  act(() => jest.advanceTimersByTime(30000));
  expect(captionText(panel("LocalMind"))).toBe("Scene one");
  expect(demoOf(panel("LocalMind"), "local-demo")).toHaveAttribute("data-playing", "false");

  fireEvent.click(within(panel("LocalMind")).getByRole("button", { name: "Next scene of the LocalMind demo" }));
  expect(captionText(panel("LocalMind"))).toBe("Scene two");

  fireEvent.click(within(panel("LocalMind")).getByRole("button", { name: "Close the LocalMind demo" }));
  expect(playCard("LocalMind")).toHaveFocus();
});

test("leaving the block unmounted leaves no timers behind", async () => {
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

  fireEvent.click(playCard("LocalMind"));
  expect(within(panel("LocalMind")).queryByTestId("local-demo")).toBeNull(); // still growing
  grow();
  expect(demoOf(panel("LocalMind"), "local-demo")).toHaveAttribute("data-scene", "0");
});

test("Full file opens the project's dossier", async () => {
  const onOpenFile = jest.fn();
  render(<FeaturedProjects projects={projects} onOpenFile={onOpenFile} />);
  await flush();
  await startLocal();
  fireEvent.click(within(info("LocalMind")).getByRole("button", { name: /^Full file/ }));
  expect(onOpenFile).toHaveBeenCalledWith("alpha");
});

test("the Gyminit card links to the live app and reads Visit", async () => {
  await renderFeatured(three);
  const link = within(screen.getByRole("article", { name: "Gyminit" })).getByRole("link", { name: /^Visit/ });
  expect(link).toHaveAttribute("href", "https://gyminit.example.workers.dev");
});

test("a card with a charity shows a Visit charity link to it", async () => {
  const charityCard = { ...gyminit, id: "delta", name: "Delta", url: undefined, charity: { name: "Charity", url: "https://charity.example.org/" } };
  await renderFeatured([charityCard]);
  const link = within(screen.getByRole("article", { name: "Delta" })).getByRole("link", { name: /^Visit charity/ });
  expect(link).toHaveAttribute("href", "https://charity.example.org/");
});

test("with FX off the panel says the demo steps through, not that it plays", async () => {
  render(
    <MotionConfig reducedMotion="always">
      <FeaturedProjects projects={projects} />
    </MotionConfig>,
  );
  await flush();
  await startLocal();
  expect(info("LocalMind")).toHaveTextContent(/Step through · scene 1 \/ 3/);
  expect(info("LocalMind")).not.toHaveTextContent(/Playing/);
});

test("a card with a charity shows the charity, not its repo; the playing panel shows both", async () => {
  const charityCard = { ...projects[0], url: "https://github.com/x/y", charity: { name: "Charity", url: "https://charity.example.org/" } };
  await renderFeatured([charityCard]);
  expect(within(screen.getByRole("article", { name: "LocalMind" })).queryByRole("link", { name: /^Repo/ })).toBeNull();
  await startLocal();
  expect(within(info("LocalMind")).getByRole("link", { name: /^Repo/ })).toBeInTheDocument();
  expect(within(info("LocalMind")).getByRole("link", { name: /^Visit charity/ })).toBeInTheDocument();
});
