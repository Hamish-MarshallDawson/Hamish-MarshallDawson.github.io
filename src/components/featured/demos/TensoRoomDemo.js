import { useEffect } from "react";
import "./TensoRoomDemo.css";

// TensorRoom, as five self-playing scenes in the card's picture box. The photos are the
// real ones from TensorRoom's own runs (edit-before is the room, edit-1-sofa the same room
// with the sofa redrawn). Each scene animates itself with CSS; the player owns the timing.
// The demo freezes its animations when `playing` is false, and draws the scene in its final
// state when `reducedMotion` is on (no animation at all).

const ASSET = (file) => `${process.env.PUBLIC_URL}/featured/tensoroom/${file}`;
const BEFORE = ASSET("edit-before.jpg");
const AFTER = ASSET("edit-1-sofa.jpg");
const FONT_LINK_ID = "tensoroom-fonts";
const FONT_HREF =
  // Only what the CSS uses: DM Sans at 400 to 700, and Fraunces roman and italic at 500 to 600 with its SOFT and optical size axes.
  "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Fraunces:ital,opsz,wght,SOFT@0,9..144,500..600,0..100;1,9..144,500..600,0..100&display=swap";

export const scenes = [
  { id: "room", caption: "Photograph a room", ms: 4000 },
  { id: "name", caption: "Name the pieces you want to change", ms: 4500 },
  { id: "mask", caption: "Masks trace the sofa and the rug", ms: 4500 },
  { id: "redraw", caption: "A dark green velvet sofa, drawn in place", ms: 4500 },
  { id: "compare", caption: "Everything else left exactly as it was", ms: 5000 },
];

// Where the sofa and the rug sit on the photo, as percentages of the photo (edit-before.jpg).
// The rug is inset a little, so its outline stays inside the photo's edges.
const SOFA = { left: 15, top: 36, width: 62, height: 40 };
const RUG = { left: 2, top: 80, width: 96, height: 18 };

function loadFonts() {
  if (document.getElementById(FONT_LINK_ID)) return;
  const link = document.createElement("link");
  link.id = FONT_LINK_ID;
  link.rel = "stylesheet";
  link.href = FONT_HREF;
  document.head.appendChild(link);
}

const box = (r) => ({ left: `${r.left}%`, top: `${r.top}%`, width: `${r.width}%`, height: `${r.height}%` });

// One scene. Keyed by its index, so each scene starts its animations afresh. The photo, the masks
// and the comparison sit in `.tr-art`, a box with the photo's own aspect that covers the scene, so a
// percentage in the art is a percentage of the photo, whatever the box's shape. Text sits on the scene.
function Scene({ index }) {
  if (index === 0) {
    return (
      <div className="tr-scene tr-scene--room">
        <div className="tr-art">
          <img className="tr-photo" src={BEFORE} alt="" />
        </div>
        <p className="tr-tag">Your room</p>
      </div>
    );
  }
  if (index === 1) {
    return (
      <div className="tr-scene tr-scene--name">
        <div className="tr-art">
          <img className="tr-photo" src={BEFORE} alt="" />
        </div>
        <div className="tr-pill" aria-hidden="true">
          <span className="tr-pill-label">Change</span>
          <span className="tr-chip tr-chip--a">sofa</span>
          <span className="tr-chip tr-chip--b">rug</span>
        </div>
      </div>
    );
  }
  if (index === 2) {
    return (
      <div className="tr-scene tr-scene--mask">
        <div className="tr-art">
          <img className="tr-photo" src={BEFORE} alt="" />
          <div className="tr-mask tr-mask--sofa" style={box(SOFA)} aria-hidden="true">
            <span>Sofa</span>
          </div>
          <div className="tr-mask tr-mask--rug" style={box(RUG)} aria-hidden="true">
            <span>Rug</span>
          </div>
        </div>
      </div>
    );
  }
  if (index === 3) {
    return (
      <div className="tr-scene tr-scene--redraw">
        <div className="tr-art">
          <img className="tr-photo" src={AFTER} alt="" />
          <img className="tr-photo tr-wipe" src={BEFORE} alt="" />
        </div>
        <p className="tr-tag tr-tag--late">Velvet, dark green</p>
      </div>
    );
  }
  return (
    <div className="tr-scene tr-scene--compare">
      <div className="tr-art">
        <img className="tr-photo" src={BEFORE} alt="" />
        <div className="tr-after">
          <img className="tr-photo" src={AFTER} alt="" />
        </div>
        <div className="tr-rail" aria-hidden="true">
          <span className="tr-line" />
          <span className="tr-knob" />
        </div>
      </div>
      <span className="tr-label tr-label--before">Before</span>
      <span className="tr-label tr-label--after">After</span>
    </div>
  );
}

export default function TensoRoomDemo({ scene = 0, playing = true, reducedMotion = false }) {
  useEffect(loadFonts, []);
  const className = ["tr-demo", playing ? "" : "is-paused", reducedMotion ? "is-still" : ""].filter(Boolean).join(" ");
  return (
    <div className={className}>
      <Scene key={scene} index={scene} />
    </div>
  );
}
