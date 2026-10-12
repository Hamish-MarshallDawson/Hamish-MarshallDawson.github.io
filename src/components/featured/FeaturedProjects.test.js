import { useState } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MotionConfig } from "framer-motion";
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

test("Run the demo opens the demo inside its own card, in place of the image, and Close restores it", () => {
  render(<FeaturedProjects projects={projects} />);
  const card = screen.getByRole("article", { name: "Alpha" });
  // eslint-disable-next-line testing-library/no-node-access
  expect(card.querySelector(".feat-media")).not.toBeNull();

  fireEvent.click(screen.getByRole("button", { name: "Run the demo for Alpha" }));

  const stage = within(card).getByRole("region", { name: "Demo · Alpha" });
  expect(stage).toHaveAttribute("id", "feat-stage");
  expect(within(card).getByRole("button", { name: "Close demo" })).toBeInTheDocument();
  // The image is replaced, and the card's text (pitch, facts, the Run button) stays below.
  // eslint-disable-next-line testing-library/no-node-access
  expect(card.querySelector(".feat-media")).toBeNull();
  expect(within(card).getByText("A pitch.")).toBeInTheDocument();
  expect(within(card).getByRole("button", { name: "Close the demo for Alpha" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Close the demo for Alpha" })).toHaveAttribute("aria-expanded", "true");
  expect(screen.getByRole("button", { name: "Close the demo for Alpha" })).toHaveAttribute("aria-controls", "feat-stage");

  fireEvent.click(within(card).getByRole("button", { name: "Close demo" }));

  expect(screen.queryByRole("region", { name: "Demo · Alpha" })).toBeNull();
  // eslint-disable-next-line testing-library/no-node-access
  expect(card.querySelector(".feat-media")).not.toBeNull();
});

test("opening a demo moves focus to its title, and scrolls the card into view smoothly", () => {
  const scroll = jest.fn();
  Element.prototype.scrollIntoView = scroll;
  render(<FeaturedProjects projects={projects} />);
  fireEvent.click(screen.getByRole("button", { name: "Run the demo for Alpha" }));

  expect(screen.getByRole("heading", { name: "Demo · Alpha" })).toHaveFocus();
  expect(scroll).toHaveBeenCalledWith({ block: "nearest", behavior: "smooth" });
  delete Element.prototype.scrollIntoView;
});

test("with reduced motion the card scrolls into view at once", () => {
  const scroll = jest.fn();
  Element.prototype.scrollIntoView = scroll;
  render(
    <MotionConfig reducedMotion="always">
      <FeaturedProjects projects={projects} />
    </MotionConfig>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Run the demo for Alpha" }));

  expect(scroll).toHaveBeenCalledWith({ block: "nearest", behavior: "auto" });
  delete Element.prototype.scrollIntoView;
});
