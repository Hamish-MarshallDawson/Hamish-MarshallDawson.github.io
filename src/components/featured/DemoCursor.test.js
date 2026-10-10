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
