import { useEffect, useRef } from "react";
import { useReducedMotionConfig } from "framer-motion";

// Stand-in for the hero image while /public/image_2a10f9.jpg is missing: a
// fibre-optic wireframe head drawn on canvas. A lat/long sphere is pushed
// into a head shape (jaw taper, nose, brow, eye sockets), then turned slowly
// side to side with light pulses running down the meridians.

const LAT = 30;
const LON = 44;
const PERSPECTIVE = 3.2;

const gauss = (v, mu, sigma) => Math.exp(-((v - mu) ** 2) / (2 * sigma * sigma));

function headPoint(lat, lon) {
  const cosLat = Math.cos(lat);
  let x = cosLat * Math.sin(lon) * 0.74;
  const y = Math.sin(lat);
  let z = cosLat * Math.cos(lon) * 0.86;

  if (y < -0.1) {
    const t = (-0.1 - y) / 0.9;
    x *= 1 - 0.36 * t * t;
    z *= 1 - 0.16 * t;
  }

  if (z > 0) {
    const front = Math.min(1, z / 0.86);
    const ax = Math.abs(x);
    z += 0.22 * front * gauss(x, 0, 0.085) * gauss(y, -0.1, 0.19); // nose
    z += 0.05 * front * gauss(y, 0.27, 0.06) * gauss(ax, 0.2, 0.22); // brow
    z -= 0.085 * front * gauss(ax, 0.27, 0.1) * gauss(y, 0.13, 0.075); // eyes
    z += 0.045 * front * gauss(x, 0, 0.16) * gauss(y, -0.5, 0.07); // lips
    z += 0.05 * front * gauss(x, 0, 0.17) * gauss(y, -0.78, 0.09); // chin
    x *= 1 + 0.05 * gauss(y, -0.02, 0.16); // cheekbones
  }
  return [x, y, z];
}

function buildMesh() {
  const rings = [];
  for (let i = 0; i < LAT; i += 1) {
    const lat = -Math.PI / 2 + ((i + 0.5) / LAT) * Math.PI;
    const ring = [];
    for (let j = 0; j < LON; j += 1) ring.push(headPoint(lat, (j / LON) * Math.PI * 2));
    rings.push(ring);
  }
  const eyeLat = Math.asin(0.13);
  const eyeLon = Math.asin(0.27 / (0.74 * Math.cos(eyeLat)));
  const eyes = [headPoint(eyeLat, eyeLon), headPoint(eyeLat, -eyeLon)];
  return { rings, eyes };
}

// Depth buckets set stroke weight, not alpha: the far side of the head is
// left out, the middle drawn in hairlines, the near side in heavier strokes
// — all solid paper on the signal plate, no glow and no transparency.
const WEIGHTS = [0, 0.35, 0.6, 1, 1.7];
const PAPER = "#ffffff";

function draw(ctx, width, height, mesh, t) {
  ctx.clearRect(0, 0, width, height);
  if (!width || !height) return;

  const yaw = Math.sin(t * 0.00032) * 0.62;
  const pitch = -0.06 + Math.sin(t * 0.00021) * 0.07;
  const cosYaw = Math.cos(yaw);
  const sinYaw = Math.sin(yaw);
  const cosPitch = Math.cos(pitch);
  const sinPitch = Math.sin(pitch);
  const radius = Math.min(width, height) * 0.4;
  const cx = width / 2;
  const cy = height / 2 + radius * 0.05;

  const project = ([x, y, z]) => {
    const x1 = x * cosYaw + z * sinYaw;
    const z1 = -x * sinYaw + z * cosYaw;
    const y2 = y * cosPitch - z1 * sinPitch;
    const z2 = y * sinPitch + z1 * cosPitch;
    const f = PERSPECTIVE / (PERSPECTIVE - z2);
    return [cx + x1 * f * radius, cy - y2 * f * radius, z2, y];
  };

  const points = mesh.rings.map((ring) => ring.map(project));
  const scanY = 1.3 - ((t * 0.00032) % 2.6);
  const buckets = WEIGHTS.map(() => []);

  const addSegment = (a, b) => {
    let level = ((a[2] + b[2]) / 2 + 0.9) / 1.8;
    if (Math.abs((a[3] + b[3]) / 2 - scanY) < 0.05) level += 0.55;
    const k = Math.max(0, Math.min(WEIGHTS.length - 1, Math.floor(level * WEIGHTS.length)));
    buckets[k].push(a[0], a[1], b[0], b[1]);
  };

  for (let i = 0; i < LAT; i += 1) {
    for (let j = 0; j < LON; j += 1) {
      const a = points[i][j];
      addSegment(a, points[i][(j + 1) % LON]);
      if (i + 1 < LAT) addSegment(a, points[i + 1][j]);
    }
  }

  ctx.strokeStyle = PAPER;
  ctx.fillStyle = PAPER;
  buckets.forEach((segments, k) => {
    if (!segments.length || !WEIGHTS[k]) return;
    ctx.lineWidth = Math.max(0.5, (radius / 240) * WEIGHTS[k]);
    ctx.beginPath();
    for (let s = 0; s < segments.length; s += 4) {
      ctx.moveTo(segments[s], segments[s + 1]);
      ctx.lineTo(segments[s + 2], segments[s + 3]);
    }
    ctx.stroke();
  });

  // Square pulses travelling down every fourth meridian.
  const block = Math.max(3, radius * 0.035);
  for (let j = 0; j < LON; j += 4) {
    const along = ((t * 0.00042 + j * 0.37) % 1) * (LAT - 1);
    const i = Math.floor(along);
    const frac = along - i;
    const a = points[LAT - 1 - i][j];
    const b = points[Math.max(0, LAT - 2 - i)][j];
    const depth = a[2] + (b[2] - a[2]) * frac;
    if (depth < -0.1) continue;
    const px = a[0] + (b[0] - a[0]) * frac;
    const py = a[1] + (b[1] - a[1]) * frac;
    ctx.fillRect(px - block / 2, py - block / 2, block, block);
  }

  // Eyes as solid blocks, with the occasional blink (a squash, not a fade).
  const blink = Math.abs(Math.sin(t * 0.0011)) > 0.985 ? 0.15 : 1;
  mesh.eyes.map(project).forEach(([ex, ey, depth]) => {
    if (depth < 0) return;
    const w = radius * 0.11;
    const h = radius * 0.05 * blink;
    ctx.fillRect(ex - w / 2, ey - h / 2, w, h);
  });
}

export function NeuralLattice({ className }) {
  const canvasRef = useRef(null);
  const reduce = useReducedMotionConfig();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext?.("2d");
    if (!ctx) return undefined;

    const mesh = buildMesh();
    let frame = 0;
    let visible = true;
    let width = 0;
    let height = 0;

    const still = () => draw(ctx, width, height, mesh, 4200);
    const loop = (t) => {
      draw(ctx, width, height, mesh, t);
      frame = requestAnimationFrame(loop);
    };
    const start = () => {
      if (!frame && visible && !document.hidden && !reduce) frame = requestAnimationFrame(loop);
    };
    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (reduce) still();
    };

    const sizeObserver = new ResizeObserver(resize);
    sizeObserver.observe(canvas);
    resize();

    // Only animate while on screen and while the tab is visible.
    const viewObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else stop();
    });
    viewObserver.observe(canvas);
    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVisibility);

    if (reduce) still();
    else start();

    return () => {
      stop();
      sizeObserver.disconnect();
      viewObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [reduce]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
