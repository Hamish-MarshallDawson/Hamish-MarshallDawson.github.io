import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { PhoneFeatured, SWIPE_PX, swipeStep, wrap } from "./PhoneFeatured";
import { DEMOS } from "./FeaturedProjects";
import { vaultProjects } from "../projectdata";

// Every demo module is a stand-in that shows which demo it is.
const mockDemo = (id) => {
  const h = require("react").createElement;
  return {
    __esModule: true,
    scenes: [
      { id: "a", caption: `${id} one`, ms: 4000 },
      { id: "b", caption: `${id} two`, ms: 4000 },
    ],
    default: () => h("div", { "data-testid": "demo", "data-demo": id }),
  };
};
jest.mock("./demos/LocalMindDemo", () => mockDemo("localmind"));
jest.mock("./demos/GyminitDemo", () => mockDemo("gyminit"));
jest.mock("./demos/CodeForGoodDemo", () => mockDemo("codeforgood"));
jest.mock("./demos/BusDisplayDemo", () => mockDemo("bus"));
jest.mock("./demos/PoseidonDemo", () => mockDemo("poseidon"));
// TensorRoom's file may be renamed (spec item 15); mock whichever DEMOS points at by stubbing its loader.
const realTensor = DEMOS.tensoroom;

const projects = vaultProjects.filter((p) => p.featured);
const n = projects.length;
const pad = (i) => String(i).padStart(2, "0");
const counter = () => screen.getByText((_, el) => el?.classList?.contains("pfeat-count")).textContent;

beforeAll(() => {
  if (DEMOS.tensoroom) DEMOS.tensoroom = () => Promise.resolve(mockDemo("tensoroom"));
});
afterAll(() => {
  if (realTensor) DEMOS.tensoroom = realTensor;
});

const viewport = (container) => container.querySelector(".pfeat-viewport");
const swipe = (el, dx, dy = 0) => {
  fireEvent.touchStart(el, { touches: [{ clientX: 200, clientY: 300 }] });
  fireEvent.touchMove(el, { touches: [{ clientX: 200 + dx / 2, clientY: 300 + dy / 2 }] });
  fireEvent.touchMove(el, { touches: [{ clientX: 200 + dx, clientY: 300 + dy }] });
  fireEvent.touchEnd(el, { changedTouches: [{ clientX: 200 + dx, clientY: 300 + dy }] });
};

describe("carousel maths", () => {
  test("wrap goes from the first back to the last, and from the last on to the first", () => {
    expect(wrap(-1, 6)).toBe(5);
    expect(wrap(-2, 6)).toBe(4);
    expect(wrap(6, 6)).toBe(0);
    expect(wrap(3, 6)).toBe(3);
  });

  test("a swipe must pass the threshold; left is forward, right is back", () => {
    expect(swipeStep(-SWIPE_PX)).toBe(1);
    expect(swipeStep(SWIPE_PX)).toBe(-1);
    expect(swipeStep(-(SWIPE_PX - 1))).toBe(0);
    expect(swipeStep(SWIPE_PX - 1)).toBe(0);
    expect(swipeStep(0)).toBe(0);
  });
});

describe("PhoneFeatured", () => {
  test("has six featured projects to show", () => {
    expect(n).toBe(6);
  });

  test("shows a 01 / 06 counter and a position bar with the current segment marked", () => {
    const { container } = render(<PhoneFeatured projects={projects} />);
    expect(counter()).toMatch(`01 / ${pad(n)}`);
    const segs = container.querySelectorAll(".pfeat-bar li");
    expect(segs).toHaveLength(n);
    expect(segs[0]).toHaveClass("is-current");
  });

  test("the arrow buttons wrap round in both directions", () => {
    render(<PhoneFeatured projects={projects} />);
    const prev = screen.getByRole("button", { name: "Previous project" });
    fireEvent.click(prev);
    expect(counter()).toMatch(`${pad(n)} / ${pad(n)}`);
    fireEvent.click(prev);
    expect(counter()).toMatch(`${pad(n - 1)} / ${pad(n)}`);
    const next = () => screen.getByRole("button", { name: /^Next project/ });
    fireEvent.click(next());
    fireEvent.click(next());
    expect(counter()).toMatch(`01 / ${pad(n)}`);
    fireEvent.click(next());
    expect(counter()).toMatch(`02 / ${pad(n)}`);
  });

  test("only the current card is focusable; the peek is inert", () => {
    const { container } = render(<PhoneFeatured projects={projects} />);
    const slides = container.querySelectorAll(".pfeat-slide");
    expect(slides[0]).not.toHaveAttribute("inert");
    expect(slides[1]).toHaveAttribute("inert");
    // The next card is ordered straight after the current one, so it peeks.
    expect(Number(slides[1].style.order)).toBe(Number(slides[0].style.order) + 1);
  });

  test("swipes change card past the threshold, wrap, and ignore short or vertical swipes", () => {
    const { container } = render(<PhoneFeatured projects={projects} />);
    const vp = viewport(container);
    swipe(vp, SWIPE_PX); // right on the first: wraps to the last
    expect(counter()).toMatch(`${pad(n)} / ${pad(n)}`);
    swipe(vp, -SWIPE_PX); // left on the last: wraps to the first
    expect(counter()).toMatch(`01 / ${pad(n)}`);
    swipe(vp, -(SWIPE_PX - 10));
    expect(counter()).toMatch(`01 / ${pad(n)}`);
    swipe(vp, -120, 300); // mostly vertical: a scroll, not a swipe
    expect(counter()).toMatch(`01 / ${pad(n)}`);
    swipe(vp, -120);
    expect(counter()).toMatch(`02 / ${pad(n)}`);
  });

  test("Play fills the stage; the switcher wraps between demos; X returns focus to Play", async () => {
    render(<PhoneFeatured projects={projects} />);
    const first = projects[0];
    const play = screen.getByRole("button", { name: `▶ Play demo for ${first.name}` });
    await act(async () => {
      fireEvent.click(play);
    });
    const stage = document.querySelector(".pfeat-stage");
    expect(stage).toHaveAttribute("data-show", "true");
    const sw = within(stage).getByRole("group", { name: "Switch demo" });
    expect(sw).toHaveTextContent(`01 / 06 · ${first.name}`);
    expect(sw).toHaveTextContent(`Next: ${projects[1].name}`);

    await act(async () => {
      fireEvent.click(within(sw).getByRole("button", { name: "Previous demo" }));
    });
    expect(sw).toHaveTextContent(`06 / 06 · ${projects[5].name}`);
    // The carousel follows the demo, so closing lands on it.
    expect(counter()).toMatch("06 / 06");
    await act(async () => {
      fireEvent.click(within(sw).getByRole("button", { name: "Next demo" }));
    });
    expect(sw).toHaveTextContent(`01 / 06 · ${first.name}`);

    fireEvent.click(within(stage).getByRole("button", { name: `Close the ${first.name} demo` }));
    expect(stage).toHaveAttribute("data-show", "false");
    expect(document.activeElement).toBe(screen.getByRole("button", { name: `▶ Play demo for ${first.name}` }));
  });

  test("Escape closes the stage", async () => {
    render(<PhoneFeatured projects={projects} />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: `▶ Play demo for ${projects[0].name}` }));
    });
    fireEvent.keyDown(document, { key: "Escape" });
    expect(document.querySelector(".pfeat-stage")).toHaveAttribute("data-show", "false");
  });
});
