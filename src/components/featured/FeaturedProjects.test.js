import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { FeaturedProjects } from "./FeaturedProjects";
import { useDialog } from "../../hooks/useDialog";

// The stage's own walkthrough is not under test here, so DemoStage is a stub.
jest.mock("./DemoStage", () => ({
  DemoStage: ({ title }) => <div>{`stage for ${title}`}</div>,
}));

const projects = [
  {
    id: "alpha",
    name: "Alpha",
    category: "Tools",
    categories: ["tools"],
    tags: ["React"],
    image: "alpha.jpg",
    alt: "Alpha plate",
    featured: { pitch: "A pitch.", facts: ["One fact"], demo: "localmind" },
  },
];

// Stands in for the vault's dossier: a dialog that closes on Escape through useDialog,
// the same hook ProjectDossier uses, so the key goes through the same document listener.
function Dossier({ onClose }) {
  const ref = useDialog(true, onClose);
  return (
    <div ref={ref} role="dialog" aria-modal="true" aria-label="Dossier">
      <button type="button">Dossier button</button>
    </div>
  );
}

function Page() {
  const [dossier, setDossier] = useState(false);
  return (
    <>
      <FeaturedProjects projects={projects} />
      <button type="button" onClick={() => setDossier(true)}>
        Open dossier
      </button>
      {dossier && <Dossier onClose={() => setDossier(false)} />}
    </>
  );
}

test("with the demo and the dossier both open, Escape closes only the dossier", async () => {
  render(<Page />);
  fireEvent.click(screen.getByRole("button", { name: "Run the demo for Alpha" }));
  expect(screen.getByText("stage for Alpha")).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Open dossier" }));
  expect(screen.getByRole("dialog", { name: "Dossier" })).toBeInTheDocument();

  // Escape goes to the focused control inside the dossier, and bubbles up to the document and the window.
  fireEvent.keyDown(screen.getByRole("button", { name: "Dossier button" }), { key: "Escape" });

  expect(screen.queryByRole("dialog", { name: "Dossier" })).toBeNull();
  expect(screen.getByText("stage for Alpha")).toBeInTheDocument();
});

test("with only the demo open, Escape still closes it", () => {
  render(<Page />);
  fireEvent.click(screen.getByRole("button", { name: "Run the demo for Alpha" }));
  fireEvent.keyDown(window, { key: "Escape" });
  expect(screen.queryByText("stage for Alpha")).toBeNull();
});
