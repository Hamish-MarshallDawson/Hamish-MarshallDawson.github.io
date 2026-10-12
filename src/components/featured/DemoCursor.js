import { useEffect, useLayoutEffect, useRef } from "react";
import { findTarget } from "./targets";

// The tour's pointer, highlight ring and label tag. DemoStage hands over the
// target element, and this component follows it: while it is moving it reads the
// target's live box each frame and paints the pointer, ring and tag from it, so the
// pointer lands on the target's centre and keeps following it through a resize,
// a scroll or a target that moves. Painting writes transform and opacity only
// (the tag is placed once per landing, and parked while the pointer moves). It is decoration only:
// aria-hidden, pointer-events off, and it never moves keyboard focus.
//
// The frame loop runs only while something is moving. Once the pointer has
// landed and the target has stopped, the loop stops, and it is woken again by a
// new cursor, a resize of the target or the frame, a scroll or window resize, or
// a check every 300 ms (which catches a target that re-renders or grows as text
// streams in). The ring, pointer and tag keep their own layer (will-change in the stylesheet):
// toggling it on every check would drop the ring's layer, and repaint its dim.
// While `paused` is true (the demo is offscreen or the tab is hidden) nothing runs.
//
//   cursor: null, or {
//     target                     the element to point at
//     name, root                 optional: the target is looked up again by name in root when
//                                the one it had is gone or hidden, so a re-mounted control is followed
//     frame                      the demo frame (its border is the coordinate origin)
//     at                         optional { dx, dy } offset from the target's centre
//     glide                      ms to move from the last painted position
//     linear                     optional: move at a constant speed, not eased (drag steps)
//     press                      true while the pointer is pressing
//     label                      optional tag text
//     mode                       "glide" (pointer and ring) or "pulse" (ring only)
//   }
//
// The element to point at right now. A demo can re-mount its controls, so a
// named target is looked up again rather than trusting the element it had.
function liveTarget(c) {
  if (c.name && c.root) {
    // The first copy that is shown, as DemoStage picks it (see targets.js).
    const found = findTarget(c.root, c.name);
    if (found) return found;
  }
  return c.target && c.target.isConnected ? c.target : null;
}

// A glide fades the ring out first, holds it still while it is invisible, and fades it back in once
// the pointer has landed. Otherwise the ring would stretch across the frame on the way, and its dim
// would leave half the frame grey. Short glides (drag steps) and pulses never fade the ring.
const RING_FADE_MS = 300;

// The glide: one symmetric ease-in-out (sine), so it starts softly and lands softly.
// Drag steps are short and already eased by the engine, so they move linearly.
const easeInOutSine = (p) => 0.5 - 0.5 * Math.cos(Math.PI * p);
const lerp = (a, b, t) => a + (b - a) * t;
const near = (a, b) => Math.abs(a - b) < 0.05;
const sameBox = (a, b) => a && b && near(a.left, b.left) && near(a.top, b.top) && near(a.w, b.w) && near(a.h, b.h);
const sameAt = (a, b) => near(a.x, b.x) && near(a.y, b.y);


// The tag's spot is chosen once per placement, when the pointer lands, and kept relative to the
// target's box. The candidates, in order: below the target, above it, then right of it and left
// of it. Each is clamped inside the frame. The first that overlaps neither the target nor any
// control in the frame wins. If none is clear, there is no spot: the tag is hidden rather than
// placed over something. Pure, so it can be tested without a layout.
const TAG_GAP = 6; // between the target's edge and the tag
const EDGE = 8; // the tag keeps this far inside the frame
const overlap = (a, b) => Math.max(0, Math.min(a.left + a.w, b.left + b.w) - Math.max(a.left, b.left))
  * Math.max(0, Math.min(a.top + a.h, b.top + b.h) - Math.max(a.top, b.top));
export function placeTag({ box, size, frame, avoid }) {
  const { w, h } = size;
  const midY = box.top + (box.h - h) / 2;
  const candidates = [
    { side: "below", left: box.left, top: box.top + box.h + TAG_GAP },
    { side: "above", left: box.left, top: box.top - TAG_GAP - h },
    { side: "below", left: box.left + box.w - w, top: box.top + box.h + TAG_GAP },
    { side: "above", left: box.left + box.w - w, top: box.top - TAG_GAP - h },
    { side: "right", left: box.left + box.w + TAG_GAP, top: midY },
    { side: "left", left: box.left - TAG_GAP - w, top: midY },
  ];
  const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), Math.max(lo, hi));
  for (const c of candidates) {
    const left = clamp(c.left, EDGE, frame.w - w - EDGE);
    const top = clamp(c.top, EDGE, frame.h - h - EDGE);
    const rect = { left, top, w, h };
    const clear = avoid.every((a) => overlap(rect, a) === 0);
    if (clear) return { side: c.side, left, top, clear: true };
  }
  return { clear: false };
}

// Controls a tag must not cover, as a selector inside the demo frame.
const CONTROL_SEL = "button, a[href], input, textarea, select, [data-tour]";
// Where a hidden tag is parked: outside the frame, so it covers nothing while it is not shown.
const PARKED = "translate3d(-10000px, 0, 0)";

// The part of an element that can be seen inside the frame: its box, cut by every ancestor that
// clips (a scrolling view, for one). Null when nothing of it is visible.
function visibleRect(el, f) {
  const r = el.getBoundingClientRect();
  let box = { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
  for (let p = el.parentElement; p; p = p.parentElement) {
    const o = getComputedStyle(p);
    if (o.overflowX !== "visible" || o.overflowY !== "visible") {
      const pr = p.getBoundingClientRect();
      box = {
        left: Math.max(box.left, pr.left),
        top: Math.max(box.top, pr.top),
        right: Math.min(box.right, pr.right),
        bottom: Math.min(box.bottom, pr.bottom),
      };
    }
    if (p === f) break;
  }
  return box.right > box.left && box.bottom > box.top ? box : null;
}

// Reads the tag's size and the controls' boxes, then chooses the tag's spot. Called once per
// placement (when the pointer lands), never per frame. The spot is kept relative to the target.
function measureTag(t, f, box) {
  t.style.maxWidth = `${Math.max(40, f.clientWidth - 2 * EDGE)}px`;
  const size = { w: t.offsetWidth, h: t.offsetHeight };
  const fr = f.getBoundingClientRect();
  const ox = fr.left + f.clientLeft;
  const oy = fr.top + f.clientTop;
  const avoid = [box];
  f.querySelectorAll(CONTROL_SEL).forEach((el) => {
    if (el.getClientRects().length === 0) return;
    const r = visibleRect(el, f);
    if (r) avoid.push({ left: r.left - ox, top: r.top - oy, w: r.right - r.left, h: r.bottom - r.top });
  });
  const spot = placeTag({ box, size, frame: { w: f.clientWidth, h: f.clientHeight }, avoid });
  const boxW = box.w;
  const boxH = box.h;
  if (!spot.clear) return { clear: false, boxW, boxH };
  return { clear: true, side: spot.side, dx: spot.left - box.left, dy: spot.top - box.top, boxW, boxH };
}

// The tag is hidden (parked and transparent) while the pointer moves, and when no clear spot
// exists, and placed once it lands on a target that has one. `done` is true once the glide has
// landed; `drawn` is the target's box as it is drawn; `tip` is where the pointer is. The tag is a
// child of the pointer, so its transform is relative to the tip.
function hideTag(t, s) {
  if (s.tagShown === false) return;
  t.dataset.placed = "false";
  t.style.transform = PARKED;
  s.tagShown = false;
}

function paintTag(t, done, drawn, f, s, tip) {
  if (!done) {
    hideTag(t, s);
    return;
  }
  // The spot is measured again whenever the target changes size, so a target that grows (while
  // text streams in, say) gets a fresh clear check. Between checks the tag keeps its spot.
  const spot = s.spot;
  if (!spot || Math.abs(spot.boxW - drawn.w) > 1 || Math.abs(spot.boxH - drawn.h) > 1) {
    s.spot = measureTag(t, f, drawn);
  }
  if (!s.spot.clear) {
    hideTag(t, s);
    return;
  }
  const at = `translate3d(${drawn.left + s.spot.dx - tip.x}px, ${drawn.top + s.spot.dy - tip.y}px, 0)`;
  if (t.style.transform !== at) t.style.transform = at;
  if (t.dataset.placed !== "true") t.dataset.placed = "true";
  if (t.dataset.side !== s.spot.side) t.dataset.side = s.spot.side;
  s.tagShown = true;
}

export function DemoCursor({ cursor, paused = false }) {
  const ringEl = useRef(null);
  const pointerEl = useRef(null);
  const tagEl = useRef(null);
  const cursorRef = useRef(cursor);
  cursorRef.current = cursor;
  // Where the pointer was last painted, and its glide from there.
  const paintState = useRef({ at: { x: 0, y: 0 }, box: null, from: null, start: 0, glide: 0, glideLeft: 0, base: null, el: null, frame: 0, tag: null });
  // Wakes the frame loop. Set while the loop can run.
  const wake = useRef(null);
  const active = Boolean(cursor);

  // A new cursor starts a glide from wherever the pointer was last painted.
  useLayoutEffect(() => {
    const s = paintState.current;
    if (!cursor) return;
    const target = liveTarget(cursor);
    // The frame loop reads this element each frame. It is set for this cursor, so a
    // new cursor never measures the element the previous one pointed at.
    s.el = target;
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
    s.ringFade = !cursor.linear && cursor.mode !== "pulse" && s.glide >= 2 * RING_FADE_MS;
    s.glideLeft = 0;
    // The new cursor's tag is placed afresh once its pointer lands. Until then it is hidden.
    s.spot = null;
    s.tagShown = undefined;
    if (tagEl.current) tagEl.current.dataset.placed = "false";
    wake.current?.();
  }, [cursor]);

  // The frame loop. It stays up for the life of a cursor, and only runs while
  // something is moving (see the header).
  useEffect(() => {
    if (!active || paused) return undefined;
    const s = paintState.current;
    // Resuming mid-glide: the pointer carries on from where it stopped, over the time its glide had left.
    if (s.glideLeft > 0) {
      s.from = { at: { ...s.at }, box: s.box ? { ...s.box } : null };
      s.start = performance.now();
      s.glide = s.glideLeft;
    }
    s.glideLeft = 0;

    // One frame. Reads come first (the target, the frame and its origin), then writes.
    // Returns true while the loop should run again.
    const paint = (now) => {
      const c = cursorRef.current;
      const ring = ringEl.current;
      const pointer = pointerEl.current;
      if (!c || !c.frame) return false;
      let el = s.el && s.el.isConnected ? s.el : null;
      let r = el ? el.getBoundingClientRect() : null;
      if (!r || r.width <= 0) {
        el = liveTarget(c);
        r = el ? el.getBoundingClientRect() : null;
      }
      s.el = el;
      if (!r || r.width <= 0) {
        // No target to follow: the pointer and ring step aside until one is back.
        if (ring && ring.dataset.on !== "false") ring.dataset.on = "false";
        if (pointer && pointer.dataset.on !== "false") pointer.dataset.on = "false";
        s.box = null;
        return false;
      }
      if (pointer && c.mode !== "pulse" && pointer.dataset.on !== "true") pointer.dataset.on = "true";

      const f = c.frame;
      const fr = f.getBoundingClientRect();
      // The tour layer sits inside the frame's border, so its origin is the padding edge.
      const ox = fr.left + f.clientLeft;
      const oy = fr.top + f.clientTop;
      const box = { left: r.left - ox, top: r.top - oy, w: r.width, h: r.height };
      const goal = { x: box.left + box.w / 2 + (c.at?.dx ?? 0), y: box.top + box.h / 2 + (c.at?.dy ?? 0) };
      const from = s.from ?? { at: goal, box };
      // A glide that has nowhere to go (the pointer is already on the target) ends at once,
      // rather than running its full time with nothing drawn.
      const travels = !sameAt(from.at, goal) || !sameBox(from.box ?? box, box);
      // A frame can be stamped before the glide started; never let the glide run backwards.
      const p = s.glide > 0 && travels ? Math.min(1, Math.max(0, now - s.start) / s.glide) : 1;
      const done = p >= 1;
      const e = c.linear ? p : easeInOutSine(p);
      const at = done ? goal : { x: lerp(from.at.x, goal.x, e), y: lerp(from.at.y, goal.y, e) };
      // The ring fades out at the start of a fading glide, stays where it was while invisible,
      // then moves, and is visible again only once the pointer has landed.
      const ringFade = s.ringFade && travels;
      const ringSpan = s.glide - RING_FADE_MS;
      const pr = ringFade && ringSpan > 0 ? Math.min(1, Math.max(0, now - s.start - RING_FADE_MS) / ringSpan) : p;
      const k = ringFade ? easeInOutSine(pr) : e;
      const ringOn = !ringFade || done;
      if (ring && ring.dataset.on !== (ringOn ? "true" : "false")) ring.dataset.on = ringOn ? "true" : "false";
      // The ring changes size with the glide too, so it never shows the new size at the old place.
      const drawn = done || !from.box
        ? box
        : { left: lerp(from.box.left, box.left, k), top: lerp(from.box.top, box.top, k), w: lerp(from.box.w, box.w, k), h: lerp(from.box.h, box.h, k) };

      const changed = !s.box || !sameBox(s.box, drawn) || !sameAt(s.at, at);
      s.at = at;
      s.box = drawn;
      if (changed) {
        if (ring && s.base) {
          ring.style.transform = `translate3d(${drawn.left}px, ${drawn.top}px, 0) scale(${drawn.w / s.base.w}, ${drawn.h / s.base.h})`;
        }
        if (pointer && c.mode !== "pulse") pointer.style.transform = `translate3d(${at.x}px, ${at.y}px, 0)`;
      }
      // A tag that has not been placed yet (a new label, drawn where the pointer already is)
      // is placed even when nothing moved, so it never shows at the stylesheet's origin.
      if (tagEl.current) paintTag(tagEl.current, done, drawn, f, s, at);
      // Keep going while the glide runs or the target is still moving. Stop once it has landed.
      return !done || changed;
    };

    const frame = (now) => {
      s.frame = 0;
      if (paint(now)) start();
    };
    const start = () => {
      if (s.frame) return;
      s.frame = requestAnimationFrame(frame);
    };
    wake.current = start;
    start();

    // The wake-ups. Each one restarts the loop only when it can change what is drawn.
    const onWake = () => start();
    window.addEventListener("scroll", onWake, { capture: true, passive: true });
    window.addEventListener("resize", onWake);
    const observer = typeof ResizeObserver === "function" ? new ResizeObserver(onWake) : null;
    const observed = cursorRef.current?.frame;
    if (observer && observed) observer.observe(observed);
    const target = cursorRef.current ? liveTarget(cursorRef.current) : null;
    if (observer && target) observer.observe(target);
    // A check every 300ms, for a target that is re-rendered or grows without a resize of its own.
    const poll = setInterval(onWake, 300);
    // The demo changes under the pointer (text streams in, a control grows or is re-mounted). A change
    // in the demo wakes the loop, so the tag is checked against the new box on the next frame, not at
    // the next 300 ms check. The cursor's own layer is left out, or its writes would wake it.
    const own = ringEl.current?.parentElement;
    const mutations = typeof MutationObserver === "function" && observed
      ? new MutationObserver((records) => {
        if (records.some((r) => !own?.contains(r.target))) onWake();
      })
      : null;
    mutations?.observe(observed, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ["class", "style", "hidden", "aria-disabled"] });

    return () => {
      // Pausing or ending keeps the glide's time left, so a pause mid-glide can finish it.
      s.glideLeft = s.glide > 0 ? Math.max(0, s.start + s.glide - performance.now()) : 0;
      cancelAnimationFrame(s.frame);
      s.frame = 0;
      clearInterval(poll);
      observer?.disconnect();
      mutations?.disconnect();
      window.removeEventListener("scroll", onWake, { capture: true });
      window.removeEventListener("resize", onWake);
      wake.current = null;
    };
  }, [active, paused]);

  const on = Boolean(cursor);
  const pulse = cursor?.mode === "pulse";

  return (
    <div className="fdemo-tour" aria-hidden="true">
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
          <span key={cursor.label} ref={tagEl} className="fdemo-tag">
            {cursor.label}
          </span>
        )}
      </span>
    </div>
  );
}
