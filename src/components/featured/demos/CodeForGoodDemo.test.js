import { render, screen } from "@testing-library/react";
import CodeForGoodDemo, { scenes } from "./CodeForGoodDemo";

// One text each scene shows and no other scene does.
const MARKERS = [
  "Question 2 of 11",
  "Why are you opening this record?",
  "Saved to the feedback database",
  "Safeguarding: check this first",
  "Reject this reading",
  "42%",
  "One record for every member",
];

test("there are seven scenes with unique ids and captions, and a positive time each", () => {
  expect(scenes).toHaveLength(MARKERS.length);
  expect(new Set(scenes.map((s) => s.id)).size).toBe(scenes.length);
  expect(new Set(scenes.map((s) => s.caption)).size).toBe(scenes.length);
  scenes.forEach((s) => expect(s.ms).toBeGreaterThan(0));
});

describe.each([
  ["playing false", { playing: false, reducedMotion: false }],
  ["reduced motion", { playing: false, reducedMotion: true }],
])("%s", (_name, props) => {
  test.each(scenes.map((s, i) => [s.id, i]))("scene %s shows its own content", (_id, i) => {
    const { unmount } = render(<CodeForGoodDemo scene={i} {...props} />);
    expect(screen.getByText(MARKERS[i])).toBeInTheDocument();
    MARKERS.filter((_marker, j) => j !== i).forEach((marker) => expect(screen.queryByText(marker)).not.toBeInTheDocument());
    unmount();
  });
});

test("the demo is hidden from assistive tech and carries its mode classes", () => {
  render(<CodeForGoodDemo scene={0} playing={false} reducedMotion />);
  const root = screen.getByText("Member survey · question 2").parentElement; // eslint-disable-line testing-library/no-node-access
  expect(root).toHaveAttribute("aria-hidden", "true");
  expect(root).toHaveAttribute("data-scene", "survey");
  expect(root).toHaveClass("is-paused", "is-still");
});
