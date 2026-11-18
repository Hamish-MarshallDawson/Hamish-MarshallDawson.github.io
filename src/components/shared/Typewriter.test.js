import { render } from "@testing-library/react";
import { Typewriter } from "./Typewriter";

test("typewriter text appears once in the page text", () => {
  const { container } = render(<Typewriter text="cat bio.txt" />);
  expect(container.textContent).toBe("cat bio.txt");
});
