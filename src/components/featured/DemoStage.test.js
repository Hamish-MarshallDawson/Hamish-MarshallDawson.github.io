import { useState } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MotionConfig } from "framer-motion";
import { DemoStage, createTourClock } from "./DemoStage";

// A stand-in demo. It keeps a tap counter in its own state, so a remount
// would show up as the counter going back to zero. Its `go` target calls
// onAdvance, like a demo's own action would.
function FakeDemo({ step, onAdvance }) {
  const [taps, setTaps] = useState(0);
  return (
    <div>
      <button type="button" onClick={() => setTaps((n) => n + 1)}>
        {`tap ${taps} on ${step}`}
      </button>
      <button type="button" data-tour="go" onClick={onAdvance}>
        go
      </button>
      {/* Present in the page but never shown: the tour should skip it, not wait for it. */}
      <span data-tour="ghost">ghost</span>
    </div>
  );
}

const onGo = jest.fn();

// jsdom has no layout. A rendered element needs a box to count as shown, so give
// every element a 10px box, except the hidden `ghost`, which has none (display: none).
// Set per test: Create React App resets mocks between tests.
beforeEach(() => {
  jest.spyOn(Element.prototype, "getClientRects").mockImplementation(function rects() {
    return this.dataset?.tour === "ghost" ? [] : [{}];
  });
  jest.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function box() {
    const size = this.dataset?.tour === "ghost" ? 0 : 10;
    return { left: 0, top: 0, right: size, bottom: size, width: size, height: size, x: 0, y: 0, toJSON() {} };
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

const fake = {
  default: FakeDemo,
  steps: [
    {
      id: "a",
      title: "First",
      caption: "First caption.",
      tour: [
        { target: "go", label: "Go", click: true, hold: 50 },
      ],
    },
    {
      id: "b",
      title: "Second",
      caption: "Second caption.",
    },
  ],
};

// Loaders are called on every render otherwise, so keep one stable reference.
const loader = () => Promise.resolve(fake);

// The same demo, but its first step's tour aims at the hidden `ghost` and then at a target
// that does not exist yet.
const hiddenFake = {
  default: FakeDemo,
  steps: [
    { id: "a", title: "First", caption: "First caption.", tour: [{ target: "ghost", label: "Ghost", hold: 50 }] },
    { id: "b", title: "Second", caption: "Second caption." },
  ],
};
const hiddenLoader = () => Promise.resolve(hiddenFake);
const missingFake = {
  default: FakeDemo,
  steps: [
    { id: "a", title: "First", caption: "First caption.", tour: [{ target: "nowhere", label: "Nowhere", hold: 50 }] },
    { id: "b", title: "Second", caption: "Second caption." },
  ],
};
const missingLoader = () => Promise.resolve(missingFake);

function renderStage() {
  return render(<DemoStage title="Fake" loader={loader} />);
}

// Each click on the demo's `go` target also reports to onGo.
document.addEventListener("click", (event) => {
  if (event.target.matches?.('[data-tour="go"]')) onGo();
});

beforeEach(() => {
  onGo.mockClear();
});

test("a step change keeps the demo's state: it fades, it does not remount", async () => {
  renderStage();
  const tap = await screen.findByRole("button", { name: /^tap/ });
  fireEvent.click(tap);
  expect(screen.getByRole("button", { name: "tap 1 on 0" })).toBe(tap);

  fireEvent.click(screen.getByRole("button", { name: "Next" }));

  await waitFor(() => expect(screen.getByRole("button", { name: "tap 1 on 1" })).toBeInTheDocument());
  expect(screen.getByRole("button", { name: "tap 1 on 1" })).toBe(tap);
  expect(screen.getByText("Second caption.")).toBeInTheDocument();
});

// The fade between steps is 400 ms out, a 120 ms blank and 550 ms in. The tour's own
// steps are timed in DemoStage (glide 1150 ms, press 120 ms, hold 50 ms here).
const FADE_MS = 400 + 120 + 550;

test("auto-play waits for the step's tour, then moves on", async () => {
  renderStage();
  await screen.findByRole("button", { name: /^tap/ }, { timeout: 5000 });

  fireEvent.click(screen.getByRole("button", { name: "Play tour" }));

  // The tour glides, then taps `go`. Until that tap, the walkthrough stays on step one.
  await new Promise((resolve) => setTimeout(resolve, 400));
  expect(screen.getByText("First caption.")).toBeInTheDocument();
  expect(onGo).not.toHaveBeenCalled();

  await waitFor(() => expect(onGo).toHaveBeenCalledTimes(1), { timeout: 4000 });
  // The tap moved the demo on, and the tour stopped at the end of the walkthrough.
  await waitFor(() => expect(screen.getByText("Second caption.")).toBeInTheDocument(), { timeout: 4000 });
  // The second step has no tour, so it rests for its six seconds (then fades) before auto-play stops.
  await waitFor(() => expect(screen.getByRole("button", { name: "Play tour" })).toBeInTheDocument(), { timeout: 6000 + FADE_MS + 4000 });
}, 30000);

test("a target that is in the page but never shown is skipped after about 400 ms", async () => {
  render(<DemoStage title="Fake" loader={hiddenLoader} />);
  await screen.findByRole("button", { name: /^tap/ }, { timeout: 5000 });
  fireEvent.click(screen.getByRole("button", { name: "Play tour" }));
  // Waiting for the hidden target would take 15 s. Skipping it, the tour is on to step two well within 4 s.
  await waitFor(() => expect(screen.getByText("Second caption.")).toBeInTheDocument(), { timeout: 4000 });
}, 10000);

test("a target that does not exist yet is still waited for, not skipped at once", async () => {
  render(<DemoStage title="Fake" loader={missingLoader} />);
  await screen.findByRole("button", { name: /^tap/ }, { timeout: 5000 });
  fireEvent.click(screen.getByRole("button", { name: "Play tour" }));
  await new Promise((resolve) => setTimeout(resolve, 2500));
  // Still on step one: the target may yet appear, so the tour holds for its full wait.
  expect(screen.getByText("First caption.")).toBeInTheDocument();
}, 10000);

test("reduced motion: no pointer, no fades, and the tour cannot start", async () => {
  render(
    <MotionConfig reducedMotion="always">
      <DemoStage title="Fake" loader={loader} />
    </MotionConfig>,
  );
  await screen.findByRole("button", { name: /^tap/ });

  const play = screen.getByRole("button", { name: "Play tour" });
  expect(play).toHaveAttribute("aria-disabled", "true");
  fireEvent.click(play);
  expect(screen.getByRole("button", { name: "Play tour" })).toBeInTheDocument();
  expect(screen.getByText("The tour is off with reduced motion.")).toBeInTheDocument();

  // Manual steps change at once: no fade class, and the pointer is never drawn.
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
  expect(screen.getByText("Second caption.")).toBeInTheDocument();
  // eslint-disable-next-line testing-library/no-node-access
  expect(document.querySelector(".fdemo-stage.is-fading")).toBeNull();
  // eslint-disable-next-line testing-library/no-node-access
  expect(document.querySelector('.fdemo-pointer[data-on="true"]')).toBeNull();
});

// The tour's clock: its waits stop while it is paused, and carry on from the same point.
test("the tour clock stops while paused, and carries on where it left off", async () => {
  jest.useFakeTimers();
  const clock = createTourClock(false);
  let done = false;
  clock.sleep(1000).then(() => {
    done = true;
  });
  jest.advanceTimersByTime(600);
  clock.setPaused(true);
  jest.advanceTimersByTime(5000);
  await Promise.resolve();
  expect(done).toBe(false);
  expect(jest.getTimerCount()).toBe(0);

  clock.setPaused(false);
  jest.advanceTimersByTime(399);
  await Promise.resolve();
  expect(done).toBe(false);
  jest.advanceTimersByTime(1);
  await Promise.resolve();
  await Promise.resolve();
  expect(done).toBe(true);
  jest.useRealTimers();
});

test("disposing the tour clock ends every wait at once, and leaves no timers", async () => {
  jest.useFakeTimers();
  const clock = createTourClock(false);
  let done = false;
  clock.sleep(5000).then(() => {
    done = true;
  });
  clock.dispose();
  await Promise.resolve();
  expect(done).toBe(true);
  expect(jest.getTimerCount()).toBe(0);
  jest.useRealTimers();
});

// Before the tour has been played, a large Play button covers the demo. It is the way in.
test("the overlay offers the tour, and its Play button starts it", async () => {
  renderStage();
  await screen.findByRole("button", { name: /^tap/ });
  fireEvent.click(screen.getByRole("button", { name: "Play the tour" }));

  expect(screen.queryByRole("button", { name: "Play the tour" })).toBeNull();
  expect(screen.getByRole("button", { name: "Pause tour" })).toBeInTheDocument();
});

test("pressing inside the demo starts by hand, so the offer goes; the demo stays usable under it", async () => {
  renderStage();
  const tap = await screen.findByRole("button", { name: /^tap/ });
  // The offer's scrim lets the press through to the demo: a real press starts with pointerdown.
  fireEvent.pointerDown(tap);
  fireEvent.click(tap);
  expect(screen.getByRole("button", { name: "tap 1 on 0" })).toBe(tap);
  expect(screen.queryByRole("button", { name: "Play the tour" })).toBeNull();
});

test("a manual step hides the overlay, and Restart brings it back", async () => {
  renderStage();
  await screen.findByRole("button", { name: /^tap/ });
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
  expect(screen.queryByRole("button", { name: "Play the tour" })).toBeNull();

  fireEvent.click(screen.getByRole("button", { name: "Restart" }));
  expect(await screen.findByRole("button", { name: "Play the tour" })).toBeInTheDocument();
});

test("with reduced motion there is no overlay, because the tour cannot play", async () => {
  render(
    <MotionConfig reducedMotion="always">
      <DemoStage title="Fake" loader={loader} />
    </MotionConfig>,
  );
  await screen.findByRole("button", { name: /^tap/ });
  expect(screen.queryByRole("button", { name: "Play the tour" })).toBeNull();
});
