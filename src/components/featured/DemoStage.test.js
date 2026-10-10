import { useState } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MotionConfig } from "framer-motion";
import { DemoStage } from "./DemoStage";

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
    </div>
  );
}

const onGo = jest.fn();

// jsdom has no layout. A rendered element needs a box to count as shown, so give
// every element a 10px box. Set per test: Create React App resets mocks between tests.
beforeEach(() => {
  jest.spyOn(Element.prototype, "getClientRects").mockImplementation(() => [{}]);
  jest.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(() => ({
    left: 0, top: 0, right: 10, bottom: 10, width: 10, height: 10, x: 0, y: 0, toJSON() {},
  }));
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

test("auto-play waits for the step's tour, then moves on", async () => {
  renderStage();
  await screen.findByRole("button", { name: /^tap/ });

  fireEvent.click(screen.getByRole("button", { name: "Play tour" }));

  // The tour glides, then taps `go`. Until that tap, the walkthrough stays on step one.
  await new Promise((resolve) => setTimeout(resolve, 400));
  expect(screen.getByText("First caption.")).toBeInTheDocument();
  expect(onGo).not.toHaveBeenCalled();

  await waitFor(() => expect(onGo).toHaveBeenCalledTimes(1), { timeout: 4000 });
  // The tap moved the demo on, and the tour stopped at the end of the walkthrough.
  await waitFor(() => expect(screen.getByText("Second caption.")).toBeInTheDocument(), { timeout: 2000 });
  // The second step has no tour, so it rests for its six seconds before auto-play stops.
  await waitFor(() => expect(screen.getByRole("button", { name: "Play tour" })).toBeInTheDocument(), { timeout: 8000 });
}, 15000);

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
