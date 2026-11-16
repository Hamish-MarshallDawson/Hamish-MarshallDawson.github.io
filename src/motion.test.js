import { fireEvent, render, screen, within } from "@testing-library/react";
import App from "./App";
import { scenes as lmScenes } from "./components/featured/demos/LocalMindDemo";

// The device asks for reduced motion (power-saving modes can switch it on). framer-motion reads
// the setting once per test file, so it is set here before anything renders: wide desktop, reduce.
const realMatchMedia = window.matchMedia;
beforeAll(() => {
  window.matchMedia = (query) => ({ ...realMatchMedia(query), matches: /min-width|prefers-reduced-motion/.test(query) });
});
afterAll(() => {
  window.matchMedia = realMatchMedia;
});

beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
});

const skipHint = () => screen.queryByText("Press any key to skip");
const playLocalMind = async () => {
  const card = screen.getByRole("article", { name: "LocalMind" });
  fireEvent.click(within(card).getByRole("button", { name: "Play demo for LocalMind" }));
  await screen.findByText(lmScenes[0].caption);
  return screen.getByRole("region", { name: "LocalMind demo" });
};

test("with reduced motion and FX on, the loading card still plays", () => {
  render(<App />);
  expect(skipHint()).toBeInTheDocument();
});

test("with FX off, the loading card does not play", () => {
  localStorage.setItem("hmd:fx", "off");
  render(<App />);
  expect(skipHint()).not.toBeInTheDocument();
});

test("with reduced motion and FX on, a demo plays on its own", async () => {
  sessionStorage.setItem("hmd:booted", "1");
  render(<App />);
  const stage = await playLocalMind();
  expect(within(stage).getByRole("button", { name: "Pause the LocalMind demo" })).toBeInTheDocument();
  expect(screen.getByRole("region", { name: "LocalMind demo" })).not.toHaveAttribute("data-reduced");
});

test("with FX off, a demo is stepped through by hand", async () => {
  sessionStorage.setItem("hmd:booted", "1");
  localStorage.setItem("hmd:fx", "off");
  render(<App />);
  const stage = await playLocalMind();
  expect(within(stage).getByRole("button", { name: "Next scene of the LocalMind demo" })).toBeInTheDocument();
  expect(screen.getByRole("region", { name: "LocalMind demo" })).toHaveAttribute("data-reduced", "true");
});
