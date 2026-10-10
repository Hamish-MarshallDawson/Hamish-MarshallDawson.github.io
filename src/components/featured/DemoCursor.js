import { useEffect, useLayoutEffect, useRef } from "react";

// The tour's pointer, highlight ring and label tag. DemoStage hands over the
// target element, and this component follows it: every animation frame it reads
// the target's live box and paints the pointer, ring and tag from it, so the
// pointer lands on the target's centre and keeps following it through a resize,
// a scroll or a target that moves. Painting writes transform and opacity only
// (the tag's flip and width cap are the only other writes). It is decoration only:
// aria-hidden, pointer-events off, and it never moves keyboard focus.
//
//   cursor: null, or {
//     target                     the element to point at
//     name, root                 optional: the target is looked up again by name in root on
//                                every frame, so a target the demo re-mounts is followed
//     frame                      the demo frame (its border is the coordinate origin)
//     at                         optional { dx, dy } offset from the target's centre
//     glide                      ms to move from the last painted position
//     press                      true while the pointer is pressing
//     label                      optional tag text
//     mode                       "glide" (pointer and ring) or "pulse" (ring only)
//   }
//
// The element to point at right now. A demo can re-mount its controls, so a
// named target is looked up again rather than trusting the element it had.
function liveTarget(c) {
  if (c.name && c.root) {
    const all = c.root.querySelectorAll(`[data-tour="${c.name}"]`);
    // The first copy that is rendered (a name can occur twice, one hidden at this width).
    const found = [...all].find((el) => el.getClientRects().length > 0 && el.getBoundingClientRect().width > 0) ?? all[0];
    if (found) return found;
  }
  return c.target && c.target.isConnected ? c.target : null;
}

// The tag sits below and to the right of the tip. In the right half of the frame
// it moves to the left of the tip, and near the bottom it moves above it. A tip
// off the left or top edge pushes it in. Its width is capped to the room it has.
// `x` and `y` are only known for the default placement; a flipped tag is placed
// from its own measured size, in paintTag.
export function tagPlacement({ cx = 0, cy = 0, frameW = 0, frameH = 0 }) {
  const left = frameW > 0 && cx > frameW / 2;
  const up = frameH > 0 && cy > frameH - 48;
  if (left || up || frameW <= 0) {
    const room = left ? cx - 14 : frameW - cx - 28;
    return { left, up, maxWidth: frameW > 0 ? Math.max(40, Math.round(room)) : undefined };
  }
  const x = Math.max(20, 8 - cx);
  const y = Math.max(22, 8 - cy);
  const room = frameW - cx - x - 8;
  return { left, up, x, y, maxWidth: Math.max(40, Math.round(room)) };
}

// The glide: an ease-in-out cubic blended with an ease-out, so the pointer is moving
// from the first frame (a pure ease-in holds still for the first ~150ms, and reads as
// the pointer having stopped on the old target). It still lands softly.
const easeInOutCubic = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
const ease = (p) => 0.5 * (1 - (1 - p) * (1 - p)) + 0.5 * easeInOutCubic(p);
const lerp = (a, b, t) => a + (b - a) * t;

// The tag's box is moved with a transform. Its width cap changes only when the
// room changes, and a flipped tag is placed a few pixels from the tip using its
// measured size, so it ends up beside the tip and inside the frame.
function paintTag(t, at, f, s) {
  const tag = tagPlacement({ cx: at.x, cy: at.y, frameW: f.clientWidth, frameH: f.clientHeight });
  t.classList.toggle("is-left", tag.left);
  t.classList.toggle("is-up", tag.up);
  if (s.maxWidth !== tag.maxWidth) {
    s.maxWidth = tag.maxWidth;
    t.style.maxWidth = tag.maxWidth ? `${tag.maxWidth}px` : "";
  }
  const x = tag.left ? -6 - t.offsetWidth : tag.x;
  const y = tag.up ? -4 - t.offsetHeight : tag.y;
  t.style.transform = `translate3d(${x}px, ${y}px, 0)`;
}

export function DemoCursor({ cursor }) {
  const layer = useRef(null);
  const ringEl = useRef(null);
  const pointerEl = useRef(null);
  const tagEl = useRef(null);
  const cursorRef = useRef(cursor);
  cursorRef.current = cursor;
  // Where the pointer was last painted, and its glide from there.
  const paintState = useRef({ at: { x: 0, y: 0 }, box: null, from: null, start: 0, glide: 0, base: null, maxWidth: null });

  // A new cursor starts a glide from wherever the pointer was last painted.
  useLayoutEffect(() => {
    const s = paintState.current;
    if (!cursor) return;
    const target = liveTarget(cursor);
    if (target) {
      const r = target.getBoundingClientRect();
      s.base = { w: r.width || 1, h: r.height || 1 };
      if (ringEl.current) {
        ringEl.current.style.width = `${s.base.w}px`;
        ringEl.current.style.height = `${s.base.h}px`;
      }
    }
    s.from = { at: { ...s.at }, box: s.box ? { ...s.box } : null };
    s.start = performance.now();
    s.glide = cursor.glide ?? 0;
  }, [cursor]);

  // Paint every frame while a cursor is on: glide, then track the live target.
  useEffect(() => {
    if (!cursor) return undefined;
    let frame;
    const paint = (now) => {
      frame = requestAnimationFrame(paint);
      const c = cursorRef.current;
      const s = paintState.current;
      const target = c && c.frame ? liveTarget(c) : null;
      if (!target) {
        // No target to follow: the pointer and ring step aside until one is back.
        if (ringEl.current) ringEl.current.dataset.on = "false";
        if (pointerEl.current) pointerEl.current.dataset.on = "false";
        return;
      }
      if (ringEl.current) ringEl.current.dataset.on = "true";
      if (pointerEl.current && c.mode !== "pulse") pointerEl.current.dataset.on = "true";
      const f = c.frame;
      const fr = f.getBoundingClientRect();
      // The tour layer sits inside the frame's border, so its origin is the padding edge.
      const ox = fr.left + f.clientLeft;
      const oy = fr.top + f.clientTop;
      const r = target.getBoundingClientRect();
      const box = { left: r.left - ox, top: r.top - oy, w: r.width, h: r.height };
      const goal = { x: box.left + box.w / 2 + (c.at?.dx ?? 0), y: box.top + box.h / 2 + (c.at?.dy ?? 0) };
      // A frame can be stamped before the glide started; never let the glide run backwards.
      const p = s.glide > 0 ? Math.min(1, Math.max(0, now - s.start) / s.glide) : 1;
      const e = ease(p);
      const from = s.from ?? { at: goal, box };
      const at = { x: lerp(from.at.x, goal.x, e), y: lerp(from.at.y, goal.y, e) };
      // The ring changes size with the glide too, so it never shows the new size at the old place.
      const drawn = from.box
        ? { left: lerp(from.box.left, box.left, e), top: lerp(from.box.top, box.top, e), w: lerp(from.box.w, box.w, e), h: lerp(from.box.h, box.h, e) }
        : box;
      s.at = at;
      s.box = drawn;
      if (ringEl.current && s.base) {
        ringEl.current.style.transform = `translate3d(${drawn.left}px, ${drawn.top}px, 0) scale(${drawn.w / s.base.w}, ${drawn.h / s.base.h})`;
      }
      if (pointerEl.current) pointerEl.current.style.transform = `translate3d(${at.x}px, ${at.y}px, 0)`;
      if (tagEl.current) paintTag(tagEl.current, at, f, s);
    };
    frame = requestAnimationFrame(paint);
    return () => cancelAnimationFrame(frame);
  }, [cursor]);

  const on = Boolean(cursor);
  const pulse = cursor?.mode === "pulse";

  return (
    <div className="fdemo-tour" aria-hidden="true" ref={layer}>
      <span
        ref={ringEl}
        className={`fdemo-hl${pulse ? " is-pulse" : ""}`}
        data-on={on ? "true" : "false"}
      />
      <span
        ref={pointerEl}
        className="fdemo-pointer"
        data-on={on && !pulse ? "true" : "false"}
        data-press={cursor?.press ? "true" : undefined}
      >
        <svg viewBox="0 0 24 28" width="24" height="28" focusable="false">
          <path
            d="M2 1.5 L2 21.5 L7.2 16.8 L10.6 24.6 L14 23.1 L10.6 15.4 L17.6 15.4 Z"
            fill="#000"
            stroke="#fff"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
        {cursor?.label && !pulse && (
          <span ref={tagEl} className="fdemo-tag">
            {cursor.label}
          </span>
        )}
      </span>
    </div>
  );
}
