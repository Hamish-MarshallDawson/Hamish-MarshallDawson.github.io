/* eslint-disable testing-library/no-node-access, testing-library/no-container -- the demo is aria-hidden, so its parts are found by class */
import { render, screen } from "@testing-library/react";
import BusDisplayDemo, { scenes } from "./BusDisplayDemo";

// One text each scene shows. Board scenes share rows, so the tests below tell them apart.
const MARKERS = [
  "Stops from today's cache · 0.08 s",
  "Ocean Terminal",
  "Western Harbour",
  "Balerno",
  "Approaching Queensferry Street",
  "NO WI-FI",
  "5 suites passed, no network",
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
  test.each(scenes.map((s, i) => [s.id, i]))("scene %s shows its own screen", (id, i) => {
    const { container, unmount } = render(<BusDisplayDemo scene={i} {...props} />);
    expect(screen.getAllByText(MARKERS[i]).length).toBeGreaterThan(0);
    expect(container.firstChild).toHaveAttribute("data-scene", id);
    unmount();
  });
});

test("the board shows live, delayed and scheduled times on Princes Street", () => {
  render(<BusDisplayDemo scene={1} playing={false} reducedMotion />);
  expect(screen.getByText("Princes Street (Stop F)")).toBeInTheDocument();
  expect(screen.getByText("Due")).toBeInTheDocument();
  expect(screen.getByText("Delayed")).toBeInTheDocument();
  expect(screen.getByText("Gyle Centre")).toBeInTheDocument();
});

test("out of city lists other buses, one cancelled", () => {
  render(<BusDisplayDemo scene={2} playing={false} reducedMotion />);
  expect(screen.getByText("Cancelled")).toBeInTheDocument();
  expect(screen.queryByText("Gyle Centre")).not.toBeInTheDocument();
});

test("hiding route 34 marks its chip and takes its row off the board", () => {
  const { container } = render(<BusDisplayDemo scene={3} playing={false} reducedMotion />);
  expect(container.querySelector(".lb-chips .is-hidden")).toHaveTextContent("34");
  const gone = container.querySelector(".lb-row.is-gone");
  expect(gone).toHaveTextContent("Gyle Centre");
  expect(container.querySelectorAll(".lb-row:not(.is-gone)")).toHaveLength(4);
});

test("the tracking scene is the app's real render: its OSM map crop, the 37 to Penicuik and my stop", () => {
  const { container } = render(<BusDisplayDemo scene={4} playing={false} reducedMotion />);
  expect(container.querySelector(".lb-map img")).toHaveAttribute("src", expect.stringMatching(/featured\/bus\/map\.png$/));
  expect(screen.getByText("to Penicuik Dburn")).toBeInTheDocument();
  expect(screen.getByText("2 stops away · due in 6 min")).toBeInTheDocument();
  expect(screen.getByText("On time")).toBeInTheDocument();
  expect(screen.getByText("Princes Street (Scott Mon.)")).toBeInTheDocument();
  // No drawn map, so no credit in the page's own text: the credit is in the image.
  expect(screen.queryByText(/OpenStreetMap/)).not.toBeInTheDocument();
});

test("the demo is hidden from assistive tech and carries its mode classes", () => {
  const { container } = render(<BusDisplayDemo scene={0} playing={false} reducedMotion />);
  expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
  expect(container.firstChild).toHaveClass("lb-demo", "is-paused", "is-still");
});
