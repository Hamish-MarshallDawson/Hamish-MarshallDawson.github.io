/* eslint-disable testing-library/no-node-access, testing-library/no-container -- the demo is aria-hidden, so its parts are found by class */
import { render, screen } from "@testing-library/react";
import PoseidonDemo, { scenes } from "./PoseidonDemo";

// One text each scene shows that no other scene does.
const MARKERS = {
  live: /32,558 ships/,
  quiet: "deliberate_candidate",
  estimate: /80% circle 55 km/,
  replay: "Back to live",
};

const eachScene = scenes.map((s, i) => [s.id, i]);

test("there are seven scenes with unique ids and captions, and a positive time each", () => {
  expect(scenes).toHaveLength(7);
  expect(new Set(scenes.map((s) => s.id)).size).toBe(scenes.length);
  expect(new Set(scenes.map((s) => s.caption)).size).toBe(scenes.length);
  scenes.forEach((s) => expect(s.ms).toBeGreaterThan(0));
});

describe.each([
  ["playing false", { playing: false, reducedMotion: false }],
  ["reduced motion", { playing: false, reducedMotion: true }],
])("%s", (_name, props) => {
  test.each(eachScene)("scene %s renders with its id and the Illustrative tag", (id, i) => {
    const { container, unmount } = render(<PoseidonDemo scene={i} {...props} />);
    expect(container.firstChild).toHaveAttribute("data-scene", id);
    expect(screen.getByText("Illustrative · ships named SYN are synthetic")).toBeInTheDocument();
    if (MARKERS[id]) expect(screen.getAllByText(MARKERS[id]).length).toBeGreaterThan(0);
    unmount();
  });
});

test("the demo is hidden from assistive tech and carries its mode classes", () => {
  const { container } = render(<PoseidonDemo scene={0} playing={false} reducedMotion />);
  expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
  expect(container.firstChild).toHaveClass("pd-demo", "is-paused", "is-still");
});

test("the quiet scene flags a candidate, never a finding", () => {
  const { container } = render(<PoseidonDemo scene={1} playing={false} reducedMotion />);
  expect(container).toHaveTextContent("A flag is a prompt to review, not an accusation.");
  expect(container).toHaveTextContent("a candidate only");
  expect(container).toHaveTextContent("at least 30 min or 20× its usual interval");
});

test("the estimate scene is circles, credited to the DMA, and not a sighting", () => {
  const { container } = render(<PoseidonDemo scene={3} playing={false} reducedMotion />);
  expect(screen.getByText("80% circle")).toBeInTheDocument();
  expect(screen.getByText("95% circle")).toBeInTheDocument();
  expect(container).toHaveTextContent("not a sighting");
  expect(container).toHaveTextContent("Route model trained on Danish Maritime Authority AIS");
});

test("the replay offers exactly the product's four speeds", () => {
  const { container } = render(<PoseidonDemo scene={5} playing={false} reducedMotion />);
  expect([...container.querySelectorAll(".pd-pop-i")].map((el) => el.textContent)).toEqual(["1×", "10×", "60×", "300×"]);
});

describe.each(eachScene)("honest wording in %s", (_id, i) => {
  test("no go-dark percentage, no overclaim, and only synthetic names", () => {
    const { container } = render(<PoseidonDemo scene={i} playing={false} reducedMotion />);
    const text = container.textContent;
    expect(text).not.toMatch(/\d+\s?% chance|chance of going dark/i);
    expect(text).not.toMatch(/detects illegal|caught|proves/i);
    const maybeMmsi = text.match(/\b\d{9}\b/g) ?? [];
    expect(maybeMmsi.filter((m) => !m.startsWith("000"))).toEqual([]);
  });
});

test("every map scene credits OpenStreetMap", () => {
  [0, 1, 2, 3, 4, 5].forEach((i) => {
    const { container, unmount } = render(<PoseidonDemo scene={i} playing={false} reducedMotion />);
    expect(container).toHaveTextContent("© OpenStreetMap contributors");
    unmount();
  });
});
