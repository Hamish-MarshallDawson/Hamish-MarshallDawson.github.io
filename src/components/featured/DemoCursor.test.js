import { render, screen } from "@testing-library/react";
import { DemoCursor, placeTag } from "./DemoCursor";

const frame = { w: 260, h: 180 };
const size = { w: 80, h: 20 };
const box = (left, top, w, h) => ({ left, top, w, h });
// Two boxes overlap when their interiors meet.
const meets = (a, b) => a.left < b.left + b.w && a.left + a.w > b.left && a.top < b.top + b.h && a.top + a.h > b.top;

test("the tag goes below its target, with a 6px gap, when there is room", () => {
  const target = box(100, 50, 60, 20);
  expect(placeTag({ box: target, size, frame, avoid: [target] })).toEqual({ side: "below", left: 100, top: 76, clear: true });
});

test("the tag avoids a neighbouring button below its target, and goes above the target", () => {
  const target = box(100, 50, 60, 20);
  // A button sits directly under the target. Below would cover it, so the tag goes above.
  const neighbour = box(100, 76, 60, 30);
  const spot = placeTag({ box: target, size, frame, avoid: [target, neighbour] });
  expect(spot).toEqual({ side: "above", left: 100, top: 24, clear: true });
});

test("with buttons above and below the target, the tag goes to its right", () => {
  const target = box(100, 50, 60, 20);
  const avoid = [target, box(100, 76, 60, 30), box(100, 0, 60, 44)];
  const spot = placeTag({ box: target, size, frame, avoid });
  expect(spot.side).toBe("right");
  expect(spot.clear).toBe(true);
  expect(spot.left).toBe(166);
});

test("a target near the bottom edge takes the tag above it, clear of the target", () => {
  const target = box(40, 260, 60, 20);
  const spot = placeTag({ box: target, size, frame: { w: 260, h: 300 }, avoid: [target] });
  expect(spot.side).toBe("above");
  expect(spot.clear).toBe(true);
  expect(spot.top + size.h).toBeLessThanOrEqual(target.top - 6);
});

test("when the tag is clear, it never overlaps its target or a control", () => {
  for (const [left, top] of [[0, 0], [100, 50], [200, 120], [240, 150]]) {
    const target = box(left, top, 60, 40);
    const neighbour = box(left + 70, top, 50, 40);
    const spot = placeTag({ box: target, size, frame, avoid: [target, neighbour] });
    if (!spot.clear) continue;
    const tag = box(spot.left, spot.top, size.w, size.h);
    expect(meets(tag, target)).toBe(false);
    expect(meets(tag, neighbour)).toBe(false);
  }
});

test("with no clear spot, there is no spot at all: the tag is hidden rather than placed over something", () => {
  const target = box(10, 10, 100, 40);
  expect(placeTag({ box: target, size, frame: { w: 120, h: 60 }, avoid: [target] })).toEqual({ clear: false });
});

test("a crowded target with neighbours on every side is hidden, not placed over a neighbour", () => {
  const target = box(100, 100, 60, 40);
  // Neighbours above, below, left and right leave no room for a clear 80x20 tag.
  const avoid = [target, box(100, 0, 60, 92), box(100, 146, 60, 90), box(0, 100, 92, 40), box(166, 100, 94, 40)];
  expect(placeTag({ box: target, size, frame, avoid })).toEqual({ clear: false });
});

test("a tag at the left edge is pulled in, so it stays visible", () => {
  const target = box(0, 50, 40, 20);
  const spot = placeTag({ box: target, size, frame, avoid: [target] });
  expect(spot.left).toBe(8);
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

  // The tag is drawn at the offset tagPlacement gives, so the tested placement is the drawn one.
  // The tag is hidden while the pointer moves, and placed once it lands, beside its target.
  test("the tag is placed once the pointer lands, below its target and clear of it", () => {
    const { frame, target } = setup();
    Object.defineProperty(frame, "clientWidth", { value: 260 });
    Object.defineProperty(frame, "clientHeight", { value: 180 });
    const { rerender, container } = render(<DemoCursor cursor={null} />);
    rerender(<DemoCursor cursor={{ target, frame, glide: 0, label: "Pick" }} />);
    runFrame(16);
    // eslint-disable-next-line testing-library/no-node-access
    const tag = container.querySelector(".fdemo-tag");
    // The target is 40x20 at the frame's origin. Its tag goes 6px under it, 8px in from the edge.
    // The tag is a child of the pointer, which sits at the target's centre (20, 10), so its transform is
    // the tag's frame position less that centre: (8 - 20, 26 - 10).
    expect(tag.dataset.placed).toBe("true");
    expect(tag.dataset.side).toBe("below");
    expect(tag.style.transform).toBe("translate3d(-12px, 16px, 0)");
    document.body.removeChild(frame);
  });

  test("the tag is parked and hidden while the pointer glides, and placed on landing", () => {
    const { frame, target } = setup();
    Object.defineProperty(frame, "clientWidth", { value: 260 });
    Object.defineProperty(frame, "clientHeight", { value: 180 });
    const { rerender, container } = render(<DemoCursor cursor={null} />);
    rerender(<DemoCursor cursor={{ target, frame, glide: 1000, label: "Pick" }} />);
    // eslint-disable-next-line testing-library/no-node-access
    const tag = container.querySelector(".fdemo-tag");
    const t = performance.now();
    runFrame(t + 100);
    expect(tag.dataset.placed).toBe("false");
    expect(tag.style.transform).toBe("translate3d(-10000px, 0, 0)");
    runFrame(t + 1100);
    expect(tag.dataset.placed).toBe("true");
    expect(tag.style.transform).toBe("translate3d(-12px, 16px, 0)");
    document.body.removeChild(frame);
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
