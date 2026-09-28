// Every top-level section doubles as a route (#vault, #reach-out…). The HUD,
// the router and the page itself all read this list, so order matters.
export const SECTIONS = [
  { id: "core", code: "00", label: "Lobby", hint: "Operator profile" },
  { id: "vault", code: "01", label: "Project vault", hint: "Projects & research" },
  { id: "work", code: "02", label: "Work log", hint: "Experience & education" },
  { id: "volunteer", code: "03", label: "Volunteer work", hint: "Leadership & teams" },
  { id: "offline", code: "04", label: "Off-duty", hint: "Life outside code" },
  { id: "reach-out", code: "05", label: "Reach out", hint: "Contact", alert: true },
];

export const SECTION_IDS = SECTIONS.map((section) => section.id);

// Routes from before the sections were renamed, so old links still land.
export const SECTION_ALIASES = {
  redwall: "reach-out",
  logs: "work",
  field: "volunteer",
};
