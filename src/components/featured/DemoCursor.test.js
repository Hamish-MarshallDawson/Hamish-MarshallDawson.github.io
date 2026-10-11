import { render, screen } from "@testing-library/react";
import { DemoCursor, tagPlacement } from "./DemoCursor";

const frame = { frameW: 260, frameH: 180 };

test("the tag flips to the left of the tip in the right half of the frame", () => {
  const tag = tagPlacement({ ...frame, cx: 240, cy: 40 });
  expect(tag.left).toBe(true);
  expect(tag.up).toBe(false);
  // The room left of the tip, so the tag stays inside the frame.
  expect(tag.maxWidth).toBe(226);
});

test("the tag stays right of the tip in the left half, and above it near the bottom edge", () => {
  const right = tagPlacement({ ...frame, cx: 40, cy: 40 });
  expect(right.left).toBe(false);
  expect(right.up).toBe(false);
  expect(right.x).toBe(20);
  expect(right.y).toBe(22);

  const up = tagPlacement({ ...frame, cx: 40, cy: 170 });
  expect(up.up).toBe(true);
});

test("a tip off the left edge pulls the tag in so it stays visible", () => {
  const tag = tagPlacement({ ...frame, cx: -40, cy: 40 });
  // The tag's left edge is at least 8px inside the frame: -40 + 48 = 8.
  expect(tag.x).toBe(48);
  expect(tag.maxWidth).toBe(244);
});

test("the label is rendered inside the tour layer, which is hidden from assistive tech", () => {
  render(<DemoCursor cursor={{ label: "Choose a photo", target: null, frame: null }} />);
  expect(screen.getByText("Choose a photo")).toBeInTheDocument();
  // eslint-disable-next-line testing-library/no-node-access
  expect(screen.getByText("Choose a photo").closest(".fdemo-tour")).toHaveAttribute("aria-hidden", "true");
});

// The frame loop, with animation frames queued by hand, so each frame can be run in turn.
describe("the frame loop", () => {
  let queue;
  let nextId;

  beforeEach(() => {
    jest.useFakeTimers();
    queue = [];
    nextId = 1;
    // Every element has the same box, so the frame and the target share an origin.
    jest.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(() => ({
      left: 100, top: 50, right: 140, bottom: 70, width: 40, height: 20, x: 100, y: 50, toJSON() {},
    }));
    jest.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
      const id = nextId;
      nextId += 1;
      queue.push({ id, cb });
      return id;
    });
    jest.spyOn(window, "cancelAnimationFrame").mockImplementation((id) => {
      queue = queue.filter((q) => q.id !== id);
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  // Runs the queued frames once, and returns how many were queued.
  const runFrame = (time) => {
    const due = queue;
    queue = [];
    due.forEach(({ cb }) => cb(time));
    return queue.length;
  };

  const setup = () => {
    const frame = document.createElement("div");
    const target = document.createElement("button");
    frame.appendChild(target);
    document.body.appendChild(frame);
    return { frame, target };
  };

  test("the loop stops once the pointer has landed, and checks again every 300 ms", () => {
    const { frame, target } = setup();
    const { rerender, unmount } = render(<DemoCursor cursor={null} />);
    rerender(<DemoCursor cursor={{ target, frame, glide: 0 }} />);

    // The first frame paints the pointer; the next finds nothing moving, and the loop stops.
    expect(queue).toHaveLength(1);
    expect(runFrame(16)).toBe(1);
    expect(runFrame(32)).toBe(0);
    expect(queue).toHaveLength(0);

    // Nothing is scheduled between checks, and the 300 ms check wakes the loop once.
    jest.advanceTimersByTime(299);
    expect(queue).toHaveLength(0);
    jest.advanceTimersByTime(1);
    expect(queue).toHaveLength(1);
    expect(runFrame(340)).toBe(0);

    unmount();
    document.body.removeChild(frame);
    // Unmounting cancels the check, so no wake-up is left behind.
    jest.advanceTimersByTime(1000);
    expect(queue).toHaveLength(0);
    expect(jest.getTimerCount()).toBe(0);
  });

  test("a new target is measured from the start, not the element the last cursor pointed at", () => {
    const { frame, target } = setup();
    const other = document.createElement("button");
    frame.appendChild(other);
    // The second target sits 60px further down the frame than the first.
    jest.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function measure() {
      const top = this === other ? 110 : 50;
      return { left: 100, top, right: 140, bottom: top + 20, width: 40, height: 20, x: 100, y: top, toJSON() {} };
    });
    const { rerender, unmount } = render(<DemoCursor cursor={null} />);
    rerender(<DemoCursor cursor={{ target, frame, glide: 0 }} />);
    runFrame(16);
    runFrame(32);
    expect(document.querySelector(".fdemo-pointer").style.transform).toBe("translate3d(20px, 10px, 0)");

    rerender(<DemoCursor cursor={{ target: other, frame, glide: 0 }} />);
    // The frame that moves the pointer asks for one more frame, to confirm it has settled.
    expect(runFrame(48)).toBe(1);
    expect(runFrame(64)).toBe(0);
    // The frame and the target share an origin, so the centre is (20, 70) from the frame's padding edge.
    expect(document.querySelector(".fdemo-pointer").style.transform).toBe("translate3d(20px, 70px, 0)");
    unmount();
    document.body.removeChild(frame);
  });

  test("a glide fades the ring out, keeps it still while it is invisible, and fades it back in on landing", () => {
    const { frame, target } = setup();
    const other = document.createElement("button");
    frame.appendChild(other);
    // The second target sits 60px further down the frame than the first.
    jest.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function measure() {
      const top = this === other ? 110 : 50;
      return { left: 100, top, right: 140, bottom: top + 20, width: 40, height: 20, x: 100, y: top, toJSON() {} };
    });
    const { rerender, unmount } = render(<DemoCursor cursor={null} />);
    rerender(<DemoCursor cursor={{ target, frame, glide: 0 }} />);
    // Settle on the first target.
    let t = performance.now();
    for (let i = 1; runFrame(t + i * 16) > 0; i += 1) { /* run until the loop stops */ }
    const ring = document.querySelector(".fdemo-hl");
    expect(ring.dataset.on).toBe("true");

    // A 1200ms glide to the second target.
    rerender(<DemoCursor cursor={{ target: other, frame, glide: 1200 }} />);
    t = performance.now();
    runFrame(t + 100);
    expect(ring.dataset.on).toBe("false");
    // Still invisible and still in place for the first 300ms of the glide.
    runFrame(t + 250);
    expect(ring.style.transform).toContain("translate3d(0px, 0px, 0)");
    expect(ring.dataset.on).toBe("false");
    // Moving while invisible.
    runFrame(t + 700);
    expect(ring.style.transform).not.toContain("translate3d(0px, 0px, 0)");
    expect(ring.dataset.on).toBe("false");
    // Landed: the ring is on the second target, and fades back in.
    runFrame(t + 1300);
    expect(ring.style.transform).toContain("translate3d(0px, 60px, 0)");
    expect(ring.dataset.on).toBe("true");
    unmount();
    document.body.removeChild(frame);
  });

  test("nothing runs while the cursor is paused, and it carries on when resumed", () => {
    const { frame, target } = setup();
    const { rerender, unmount } = render(<DemoCursor cursor={null} paused />);
    rerender(<DemoCursor cursor={{ target, frame, glide: 0 }} paused />);
    expect(window.requestAnimationFrame).not.toHaveBeenCalled();
    jest.advanceTimersByTime(2000);
    expect(window.requestAnimationFrame).not.toHaveBeenCalled();

    rerender(<DemoCursor cursor={{ target, frame, glide: 0 }} paused={false} />);
    expect(queue).toHaveLength(1);

    unmount();
    document.body.removeChild(frame);
    expect(jest.getTimerCount()).toBe(0);
  });
});
