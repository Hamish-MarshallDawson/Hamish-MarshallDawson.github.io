// Every top-level section doubles as a route (#vault, #reach-out…). The HUD,
// the router and the page itself all read this list, so order matters.
// `short` is the label on the hero's section index.
export const SECTIONS = [
  { id: "core", code: "00", label: "Lobby", short: "Top", hint: "Operator profile" },
  { id: "work", code: "01", label: "Work log", short: "Work", hint: "Experience" },
  { id: "vault", code: "02", label: "Project vault", short: "Projects", hint: "Projects & research" },
  { id: "study", code: "03", label: "Education", short: "Education", hint: "Education & hackathons" },
  { id: "volunteer", code: "04", label: "Beyond the code", short: "Beyond code", hint: "Leadership & off-duty" },
  { id: "reach-out", code: "05", label: "Reach out", short: "Contact", hint: "Contact", alert: true },
];

export const SECTION_IDS = SECTIONS.map((section) => section.id);

// Routes from before the sections were renamed or merged, so old links still land.
export const SECTION_ALIASES = {
  redwall: "reach-out",
  logs: "work",
  field: "volunteer",
  offline: "volunteer",
  hackathons: "study",
};
