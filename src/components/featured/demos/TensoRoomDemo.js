import { useEffect } from "react";
import "./TensoRoomDemo.css";

// TensorRoom, as five self-playing scenes in the card's picture box. The photos are the
// real ones from TensorRoom's own runs (edit-before is the room, edit-1-sofa the same room
// with the sofa redrawn). Each scene animates itself with CSS; the player owns the timing.
// The demo freezes its animations when `playing` is false, and draws the scene in its final
// state when `reducedMotion` is on (no animation at all).
// In a wide box the photo covers the scene. In a tall box (a phone card, or the overlay
// over a 1440 card) the photo sits whole at the top and the scene's own panel fills the
// rest; the `tr-extra` pieces only show in a tall box, the `tr-wide` pieces only in a wide one.

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

// The prompt pill: wide boxes show the two chips, tall boxes type the words out.
function Pill() {
  return (
    <div className="tr-pill" aria-hidden="true">
      <span className="tr-pill-label tr-wide">Change</span>
      <span className="tr-chip tr-chip--a tr-wide">sofa</span>
      <span className="tr-chip tr-chip--b tr-wide">rug</span>
      <span className="tr-type tr-extra">sofa, rug</span>
    </div>
  );
}

// The camera frame: four corner brackets round the photo, and a shutter flash on it.
function Frame() {
  return (
    <>
      <span className="tr-corner tr-corner--tl tr-extra" />
      <span className="tr-corner tr-corner--tr tr-extra" />
      <span className="tr-corner tr-corner--bl tr-extra" />
      <span className="tr-corner tr-corner--br tr-extra" />
      <span className="tr-flash tr-extra" />
    </>
  );
}

// One scene. Keyed by its index, so each scene starts its animations afresh. The photo, the masks
// and the comparison sit in `.tr-art`, a box with the photo's own aspect; a percentage in the art is
// a percentage of the photo, whatever the box's shape. The panel holds the scene's tall-box content.
function Scene({ index }) {
  if (index === 0) {
    return (
      <div className="tr-scene tr-scene--room">
        <div className="tr-art">
          <img className="tr-photo" src={BEFORE} alt="" />
          <Frame />
        </div>
        <p className="tr-tag">Your room</p>
        <div className="tr-panel">
          <p className="tr-big tr-extra">Photograph a room</p>
          <span className="tr-shutter tr-extra" aria-hidden="true">
            <span />
          </span>
        </div>
      </div>
    );
  }
  if (index === 1) {
    return (
      <div className="tr-scene tr-scene--name">
        <div className="tr-art">
          <img className="tr-photo" src={BEFORE} alt="" />
        </div>
        <div className="tr-panel">
          <p className="tr-big tr-extra">What should change?</p>
          <Pill />
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
        <div className="tr-panel">
          <p className="tr-big tr-extra">Two masks</p>
          <ul className="tr-list tr-extra">
            <li className="tr-row tr-row--sofa">
              <span className="tr-row-name">Sofa</span>
              <span className="tr-row-chip">Traced</span>
            </li>
            <li className="tr-row tr-row--rug">
              <span className="tr-row-name">Rug</span>
              <span className="tr-row-chip">Traced</span>
            </li>
          </ul>
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
        <p className="tr-tag tr-tag--late tr-wide">Velvet, dark green</p>
        <div className="tr-panel">
          <p className="tr-big tr-extra">Velvet, dark green</p>
          <span className="tr-bar tr-extra" aria-hidden="true">
            <span className="tr-bar-fill" />
          </span>
          <p className="tr-note tr-extra">Redrawing the sofa</p>
        </div>
      </div>
    );
  }
  return (
    <div className="tr-scene tr-scene--compare">
      {/* Wide boxes: the overlay, the after photo revealed by a divider. */}
      <div className="tr-art tr-wide-art">
        <img className="tr-photo" src={BEFORE} alt="" />
        <div className="tr-after">
          <img className="tr-photo" src={AFTER} alt="" />
        </div>
        <div className="tr-rail" aria-hidden="true">
          <span className="tr-line" />
          <span className="tr-knob" />
        </div>
      </div>
      {/* Tall boxes: the before photo above the after photo, with the divider between. */}
      <div className="tr-stack tr-extra">
        <div className="tr-art tr-art--stack">
          <img className="tr-photo" src={BEFORE} alt="" />
          <span className="tr-label tr-label--before">Before</span>
        </div>
        <div className="tr-seam" aria-hidden="true">
          <span className="tr-knob" />
        </div>
        <div className="tr-art tr-art--stack">
          <img className="tr-photo" src={AFTER} alt="" />
          <span className="tr-label tr-label--after">After</span>
        </div>
      </div>
      <span className="tr-label tr-label--before tr-wide">Before</span>
      <span className="tr-label tr-label--after tr-wide">After</span>
      <div className="tr-panel">
        <p className="tr-big tr-extra">Everything else left exactly as it was</p>
      </div>
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
