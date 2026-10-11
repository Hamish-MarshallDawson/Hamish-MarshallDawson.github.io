// The one rule for finding a tour target, shared by DemoStage (which plays a tour
// item) and DemoCursor (which follows the pointer's target).
//
// A name can occur more than once (two copies of a control, one hidden at this
// width), so the target is the first copy that is shown. With none shown, it is
// the first copy, so the caller can tell it is there but hidden. Null when absent.
export const isShown = (el) => el.getClientRects().length > 0 && el.getBoundingClientRect().width > 0;

export function findTarget(root, name) {
  const all = root.querySelectorAll(`[data-tour="${name}"]`);
  return [...all].find(isShown) ?? all[0] ?? null;
}
