import { render, screen } from "@testing-library/react";
import { PhoneBar } from "./PhoneBar";
import { profile } from "../projectdata";

test("the phone bar offers the CV and email", () => {
  render(<PhoneBar />);
  expect(screen.getByRole("navigation", { name: "CV and email" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /email me/i })).toHaveAttribute("href", `mailto:${profile.email}`);
  expect(screen.getByRole("link", { name: /CV · PDF/ })).toHaveAttribute("href", profile.cv);
});
