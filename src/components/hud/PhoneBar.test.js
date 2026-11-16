import { fireEvent, render, screen } from "@testing-library/react";
import { PhoneBar } from "./PhoneBar";
import { profile } from "../projectdata";

test("the phone bar offers the CV and email", () => {
  const onRequestCv = jest.fn();
  render(<PhoneBar onRequestCv={onRequestCv} />);
  expect(screen.getByRole("navigation", { name: "CV and email" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /email me/i })).toHaveAttribute("href", `mailto:${profile.email}`);
  const cv = screen.getByRole("link", { name: /CV · PDF/ });
  if (profile.cv) {
    expect(cv).toHaveAttribute("href", profile.cv);
  } else {
    fireEvent.click(cv);
    expect(onRequestCv).toHaveBeenCalledTimes(1);
  }
});
