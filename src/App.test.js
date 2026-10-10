import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import App from "./App";
import { SECTIONS, SECTION_ALIASES, SECTION_IDS } from "./sections";
import { highlights, pickHighlights, vaultProjects } from "./components/projectdata";
import { parseHash } from "./hooks/useSectionRouter";

// fireEvent from @testing-library/react rather than user-event: the installed
// user-event resolves a second copy of @testing-library/dom whose events
// aren't wrapped in act(), so state updates wouldn't have flushed yet.

// Skip the loading screen: it only plays once per session.
beforeEach(() => {
  sessionStorage.setItem("hmd:booted", "1");
  localStorage.clear();
  document.documentElement.style.removeProperty("--signal");
  window.history.replaceState(null, "", "/");
});

const slotNames = () =>
  within(screen.getByRole("tabpanel"))
    .getAllByRole("button")
    .map((button) => button.getAttribute("aria-label"));

// Form fields by role, so a link that happens to be labelled "Email…"
// elsewhere on the page can't match.
const field = (name) => screen.getByRole("textbox", { name });
const type = (name, value) => fireEvent.change(field(name), { target: { value } });

test("renders the operator's name as the page heading", () => {
  render(<App />);
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Hamish Marshall Dawson");
  expect(screen.getByRole("heading", { level: 2, name: "Things I've built." })).toBeInTheDocument();
});

test("vault lists every project until a category filters it", () => {
  render(<App />);
  expect(slotNames()).toHaveLength(vaultProjects.length);

  fireEvent.click(screen.getByRole("tab", { name: /robotics/i }));

  const robotics = vaultProjects.filter((p) => p.categories.includes("robotics"));
  expect(screen.getByRole("tab", { name: /robotics/i })).toHaveAttribute("aria-selected", "true");
  expect(window.location.hash).toBe("#vault/robotics");
  // Exiting slots animate out, so check the survivors rather than the count.
  robotics.forEach((project) => {
    expect(screen.getByRole("button", { name: new RegExp(`^${project.name}\\.`) })).toBeInTheDocument();
  });
});

test("arrow keys move between category tabs", () => {
  render(<App />);
  const all = screen.getByRole("tab", { name: /^all/i });
  all.focus();
  fireEvent.keyDown(all, { key: "ArrowRight" });

  const research = screen.getByRole("tab", { name: /^research/i });
  expect(research).toHaveAttribute("aria-selected", "true");
  expect(research).toHaveFocus();
});

test("LocalMind is in the vault, drawn as a schematic rather than a photo", () => {
  render(<App />);
  const slot = screen.getByRole("button", { name: /^LocalMind\./ });
  expect(slot.querySelector("svg.schematic")).not.toBeNull();
  expect(slot.querySelector("img")).toBeNull();
});

test("no Marathon faction names are left anywhere on the page", () => {
  render(<App />);
  expect(document.body.textContent).not.toMatch(/cyberacme|traxus|\bmida\b|arachne|uesc/i);
});

test("selecting a vault slot loads it into the inspector", () => {
  render(<App />);
  const inspector = document.getElementById("vault-inspector");
  expect(within(inspector).getByRole("heading", { level: 3 })).toHaveTextContent(vaultProjects[0].name);

  fireEvent.click(screen.getByRole("button", { name: /^TensoRoom\./ }));

  expect(screen.getByRole("button", { name: /^TensoRoom\./ })).toHaveAttribute("aria-pressed", "true");
});

test("contact form refuses an incomplete message", () => {
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: /send message/i }));

  expect(screen.getByText(/please add your name/i)).toBeInTheDocument();
  expect(screen.getByText(/email address doesn't look right/i)).toBeInTheDocument();
  expect(screen.getByText(/at least 10 characters/i)).toBeInTheDocument();
  expect(field(/^name/i)).toHaveFocus();
});

test("a valid message hands a pre-filled email to the visitor's email app", () => {
  const assign = jest.fn();
  const original = window.location;
  delete window.location;
  window.location = { ...original, assign };

  try {
    render(<App />);
    type(/^name/i, "Ada");
    type(/^email/i, "ada@example.com");
    fireEvent.click(screen.getByRole("radio", { name: /research/i }));
    type(/^message/i, "Interested in your latency study.");
    fireEvent.click(screen.getByRole("button", { name: /send message/i }));

    expect(assign).toHaveBeenCalledTimes(1);
    const href = decodeURIComponent(assign.mock.calls[0][0]);
    expect(href).toMatch(/^mailto:hamishmarshalldawson@gmail\.com\?/);
    expect(href).toContain("[Research] from Ada");
    expect(href).toContain("ada@example.com");
    expect(screen.getByRole("status")).toHaveTextContent(/email app/i);
  } finally {
    window.location = original;
  }
});

test("the CV uplink opens Reach out with a CV request selected", () => {
  render(<App />);
  const uplinks = screen.getByRole("list", { name: "Uplinks" });
  fireEvent.click(within(uplinks).getByRole("link", { name: /^CV:/ }));
  expect(screen.getByRole("radio", { name: /cv request/i })).toBeChecked();
});

test("reaching Reach out flips the header into breach mode and back", () => {
  // Capture every observer so the test can say which section is in view.
  // Entries only go to observers actually watching that element, as in a
  // browser — the page also has framer-motion's in-view observers.
  const observers = [];
  const Original = window.IntersectionObserver;
  window.IntersectionObserver = class {
    constructor(callback) {
      this.callback = callback;
      this.targets = new Set();
      observers.push(this);
    }
    observe(el) {
      this.targets.add(el);
    }
    unobserve(el) {
      this.targets.delete(el);
    }
    disconnect() {
      this.targets.clear();
    }
  };

  try {
    render(<App />);
    const enter = (id) =>
      act(() => {
        const target = document.getElementById(id);
        observers
          .filter((o) => o.targets.has(target))
          .forEach((o) => o.callback([{ isIntersecting: true, target }], o));
      });

    expect(document.documentElement.dataset.mode).toBe("nominal");
    enter("reach-out");
    expect(document.documentElement.dataset.mode).toBe("breach");
    expect(window.location.hash).toBe("#reach-out");
    enter("vault");
    expect(document.documentElement.dataset.mode).toBe("nominal");
    expect(window.location.hash).toBe("#vault");
  } finally {
    window.IntersectionObserver = Original;
  }
});

test("the FX switch turns visual effects off and remembers it", () => {
  render(<App />);
  const fx = screen.getAllByRole("button", { name: /^FX/ })[0];
  expect(fx).toHaveAttribute("aria-pressed", "true");

  fireEvent.click(fx);

  expect(document.documentElement.dataset.fx).toBe("off");
  expect(localStorage.getItem("hmd:fx")).toBe("off");
});

test("the index drops down as a dialog, starts on the current section and Escape closes it", () => {
  render(<App />);
  const toggle = screen.getByRole("button", { name: /^index/i });
  expect(toggle).toHaveAttribute("aria-expanded", "false");

  // A real click focuses the button first; fireEvent.click doesn't.
  toggle.focus();
  fireEvent.click(toggle);

  const dialog = screen.getByRole("dialog", { name: /site index/i });
  expect(toggle).toHaveAttribute("aria-expanded", "true");
  const rows = within(within(dialog).getByRole("navigation", { name: "Index" })).getAllByRole("link");
  expect(rows).toHaveLength(SECTIONS.length);
  expect(rows[0]).toHaveAttribute("aria-current", "true");
  expect(rows[0]).toHaveFocus();

  fireEvent.keyDown(document, { key: "Escape" });

  expect(toggle).toHaveAttribute("aria-expanded", "false");
  expect(toggle).toHaveFocus();
});

test("choosing a section from the index closes it and travels there", async () => {
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: /^index/i }));
  const dialog = screen.getByRole("dialog", { name: /site index/i });

  fireEvent.click(within(dialog).getByRole("link", { name: /work log/i }));

  expect(screen.getByRole("button", { name: /^index/i })).toHaveAttribute("aria-expanded", "false");
  await waitFor(() => expect(window.location.hash).toBe("#work"));
});

test("the hero's outline echoes stay out of the heading text", () => {
  render(<App />);
  const heading = screen.getByRole("heading", { level: 1 });
  // The echoes are CSS-generated from data-echo; the DOM text is the name only.
  expect(heading.textContent.replace(/\s+/g, " ").trim()).toBe("Hamish Marshall Dawson");
  expect(heading.querySelector("[data-echo]")).not.toBeNull();
});

test("picking a colour replays the loading card in it, then repaints the page", () => {
  render(<App />);
  const toggle = screen.getByRole("button", { name: /^colour$/i });
  toggle.focus();
  fireEvent.click(toggle);

  const dialog = screen.getByRole("dialog", { name: /colour/i });
  expect(within(dialog).getAllByRole("button", { pressed: false }).length).toBeGreaterThan(1);
  fireEvent.click(within(dialog).getByRole("button", { name: /signal red/i }));

  // The card drops in already wearing the new colour; the page underneath
  // hasn't changed yet.
  const card = document.querySelector(".boot");
  expect(card).not.toBeNull();
  expect(card.style.getPropertyValue("--signal")).toBe("#e10600");
  expect(localStorage.getItem("hmd:colour")).toBe("signal-red");

  // Any key skips the card; the page lands on the new colour either way.
  act(() => {
    fireEvent.keyDown(window, { key: "Enter" });
  });
  expect(document.documentElement.style.getPropertyValue("--signal")).toBe("#e10600");
});

test("the highlight strip draws five different facts from the pool", () => {
  const picked = pickHighlights(5);
  expect(picked).toHaveLength(5);
  expect(new Set(picked.map((item) => item.key)).size).toBe(5);
  picked.forEach((item) => expect(highlights).toContain(item));

  render(<App />);
  const strip = document.querySelector(".hero-highlights");
  expect(strip.querySelectorAll("dt")).toHaveLength(5);
});

test("old section links still land on the renamed sections", () => {
  expect(parseHash("#redwall", SECTION_IDS, SECTION_ALIASES)).toEqual({ id: "reach-out", sub: null });
  expect(parseHash("#logs", SECTION_IDS, SECTION_ALIASES)).toEqual({ id: "work", sub: null });
  expect(parseHash("#field", SECTION_IDS, SECTION_ALIASES)).toEqual({ id: "volunteer", sub: null });
  expect(parseHash("#vault/robotics", SECTION_IDS, SECTION_ALIASES)).toEqual({ id: "vault", sub: "robotics" });
});

test("the work log has a Where I've studied section: Heriot-Watt, then Alford Academy", () => {
  render(<App />);
  const work = document.getElementById("work");
  expect(within(work).getByRole("heading", { level: 3, name: "Where I've studied." })).toBeInTheDocument();

  const studies = within(work).getByRole("list", { name: "Where I've studied." });
  const schools = within(studies).getAllByRole("heading", { level: 4 }).map((h) => h.textContent);
  expect(schools).toEqual(["MEng Software Engineering", "Secondary school"]);
  expect(within(studies).getByText("Head Prefect.")).toBeInTheDocument();
  expect(within(studies).getByText(/Garioch Judo on Campus/)).toBeInTheDocument();
  expect(within(studies).getByText(/2016 – 2022/)).toBeInTheDocument();
});

test("the contact section opens with a plain invitation to talk", () => {
  render(<App />);
  const reachOut = document.getElementById("reach-out");
  expect(within(reachOut).getByRole("heading", { level: 2, name: "Let's talk." })).toBeInTheDocument();
  expect(within(reachOut).getByText(/fill out the form below/i)).toBeInTheDocument();
});

test("the contact form speaks plainly", () => {
  render(<App />);
  const reachOut = document.getElementById("reach-out");
  expect(within(reachOut).getByRole("textbox", { name: "Name" })).toBeInTheDocument();
  expect(within(reachOut).getByRole("textbox", { name: /^email \(so i can reply\)$/i })).toBeInTheDocument();
  expect(within(reachOut).getByRole("textbox", { name: /^message/i })).toBeInTheDocument();
  expect(within(reachOut).getByRole("group", { name: "What's it about?" })).toBeInTheDocument();
  expect(within(reachOut).getByRole("button", { name: /send message/i })).toBeInTheDocument();
  expect(reachOut.textContent).not.toMatch(/ident|payload|transmit|firewall|intercept/i);
});

test("the featured block shows LocalMind and TensoRoom, each with a demo", () => {
  render(<App />);
  const grid = screen.getByRole("list", { name: "Featured projects" });
  const cards = within(grid).getAllByRole("article");
  expect(cards.map((card) => within(card).getByRole("heading", { level: 4 }).textContent)).toEqual([
    "LocalMind",
    "TensoRoom",
  ]);
  expect(within(grid).getAllByRole("button", { name: /^run the demo/i })).toHaveLength(2);
});

test("Run the demo opens one walkthrough stage with its step controls", async () => {
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: "Run the demo for LocalMind" }));

  expect(await screen.findByRole("group", { name: "Walkthrough navigation" })).toBeInTheDocument();
  expect(screen.getByRole("group", { name: "Walkthrough options" })).toBeInTheDocument();
  expect(screen.getByRole("list", { name: "Walkthrough steps" })).toBeInTheDocument();
  // Back and Next are aria-disabled, not disabled, so they keep focus.
  expect(screen.getByRole("button", { name: "Back" })).toHaveAttribute("aria-disabled", "true");
  expect(screen.getByRole("button", { name: "Next" })).toHaveAttribute("aria-disabled", "false");
  expect(screen.getByRole("button", { name: "Restart" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Play tour" })).toBeInTheDocument();

  // Opening a second demo replaces the first: still exactly one stage.
  fireEvent.click(screen.getByRole("button", { name: "Run the demo for TensoRoom" }));
  await waitFor(() => expect(screen.getAllByRole("region", { name: /^Demo · / })).toHaveLength(1));
  expect(screen.getByRole("button", { name: "Run the demo for LocalMind" })).toHaveAttribute("aria-expanded", "false");
});

test("Next moves the walkthrough caption on", async () => {
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: "Run the demo for LocalMind" }));

  expect(await screen.findByText(/Chats sit on the left/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Next" }));

  // The step changes after the frame's fade-out, so wait for the new caption.
  expect(await screen.findByText(/Paste the advert and ask for the CV to be tailored/)).toBeInTheDocument();
  expect(screen.queryByText(/Chats sit on the left/)).not.toBeInTheDocument();
});

test("Next keeps keyboard focus when it becomes unavailable on the last step", async () => {
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: "Run the demo for LocalMind" }));
  await screen.findByText(/Chats sit on the left/);

  const next = screen.getByRole("button", { name: "Next" });
  next.focus();
  for (let i = 0; i < 5; i += 1) fireEvent.click(next);

  expect(await screen.findByText(/The PC is asleep/)).toBeInTheDocument();
  expect(next).toHaveAttribute("aria-disabled", "true");
  expect(next).not.toBeDisabled();
  expect(next).toHaveFocus();

  // Clicking the unavailable button does nothing, and focus stays on it.
  fireEvent.click(next);
  expect(screen.getByText(/The PC is asleep/)).toBeInTheDocument();
  expect(next).toHaveFocus();
});

test("Restart returns to the first step with the demo freshly mounted", async () => {
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: "Run the demo for LocalMind" }));
  await screen.findByText(/Chats sit on the left/);
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
  // The demo's root node is the only way to tell a fresh mount from a reused one.
  // eslint-disable-next-line testing-library/no-node-access
  const before = document.querySelector(".lm-demo");

  fireEvent.click(screen.getByRole("button", { name: "Restart" }));

  expect(screen.getByText(/Chats sit on the left/)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Back" })).toHaveAttribute("aria-disabled", "true");
  // The demo is a new instance, so any state it held is gone.
  // eslint-disable-next-line testing-library/no-node-access
  expect(document.querySelector(".lm-demo")).not.toBe(before);
});

test("reduced motion turns auto-play off and cannot be switched on", async () => {
  localStorage.setItem("hmd:fx", "off");
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: "Run the demo for LocalMind" }));
  await screen.findByText(/Chats sit on the left/);

  const auto = screen.getByRole("button", { name: "Play tour" });
  expect(auto).toHaveAttribute("aria-disabled", "true");
  fireEvent.click(auto);
  expect(auto).toHaveTextContent("Play tour");
  expect(screen.getByText(/The tour is off with reduced motion/)).toBeInTheDocument();
});

test("Escape closes the stage and returns focus to its card button", async () => {
  render(<App />);
  const run = screen.getByRole("button", { name: "Run the demo for LocalMind" });
  fireEvent.click(run);
  await screen.findByText(/Chats sit on the left/);

  fireEvent.keyDown(window, { key: "Escape" });

  expect(screen.queryByRole("region", { name: /^Demo · / })).toBeNull();
  expect(run).toHaveFocus();
});
