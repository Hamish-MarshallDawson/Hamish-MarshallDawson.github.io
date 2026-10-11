import { findTarget, isShown } from "./targets";

// jsdom has no layout: a copy counts as shown when it has a box, so give each one by hand.
const copy = (shown) => {
  const el = document.createElement("button");
  el.dataset.tour = "pick";
  jest.spyOn(el, "getClientRects").mockReturnValue(shown ? [{}] : []);
  jest.spyOn(el, "getBoundingClientRect").mockReturnValue({ width: shown ? 10 : 0 });
  return el;
};

const rootWith = (...copies) => {
  const root = document.createElement("div");
  copies.forEach((el) => root.appendChild(el));
  return root;
};

test("the target is the first copy that is shown, even when a hidden copy comes first", () => {
  const hidden = copy(false);
  const shown = copy(true);
  const later = copy(true);
  expect(findTarget(rootWith(hidden, shown, later), "pick")).toBe(shown);
  expect(isShown(shown)).toBe(true);
  expect(isShown(hidden)).toBe(false);
});

test("with no copy shown, the target is the first copy, so the caller can see it is hidden", () => {
  const first = copy(false);
  expect(findTarget(rootWith(first, copy(false)), "pick")).toBe(first);
});

test("with no copy at all, the target is null", () => {
  expect(findTarget(rootWith(), "pick")).toBeNull();
});
