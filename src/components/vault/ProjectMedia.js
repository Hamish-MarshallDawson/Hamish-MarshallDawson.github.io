// A project's plate: its photo, or — for projects without one — a drawn
// schematic of the system as a staircase of ruled boxes joined by labelled
// links. Pure SVG in currentColor, so hover and selection can re-ink it the
// same way they duotone the photos.

const W = 400;
const H = 300;
const PAD = 18;
const BOX_W = 176;
const BOX_H = 58;

export function Schematic({ schematic, label }) {
  const { nodes, links = [], notes = [], footer } = schematic;
  const steps = Math.max(1, nodes.length - 1);
  const stepX = (W - 2 * PAD - BOX_W) / steps;
  const stepY = (H - 2 * PAD - BOX_H) / steps;
  const at = (i) => ({ x: PAD + i * stepX, y: PAD + i * stepY });

  return (
    <svg
      className="schematic"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid meet"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : "true"}
      focusable="false"
    >
      {links.map((text, i) => {
        const from = at(i);
        const to = at(i + 1);
        const x0 = from.x + 36;
        const y0 = from.y + BOX_H;
        const y1 = to.y + BOX_H / 2;
        return (
          <g key={text}>
            <path className="schematic-link" d={`M${x0} ${y0} V${y1} H${to.x - 3}`} />
            <path className="schematic-link" d={`M${to.x - 13} ${y1 - 7} L${to.x - 3} ${y1} L${to.x - 13} ${y1 + 7}`} />
            <text className="schematic-small" x={x0 + 10} y={(y0 + y1) / 2 - 2}>
              {text}
            </text>
          </g>
        );
      })}

      {nodes.map((text, i) => {
        const { x, y } = at(i);
        return (
          <g key={text}>
            <rect className="schematic-plate" x={x + 5} y={y + 5} width={BOX_W} height={BOX_H} />
            <rect className="schematic-box" x={x} y={y} width={BOX_W} height={BOX_H} />
            <text className="schematic-node" x={x + 14} y={y + BOX_H / 2 + 8}>
              {text}
            </text>
          </g>
        );
      })}

      {notes.map((text, i) => (
        <text key={text} className="schematic-small" x={W - PAD} y={PAD + 14 + i * 22} textAnchor="end">
          {text}
        </text>
      ))}

      {footer && (
        <text className="schematic-small" x={PAD} y={H - 96}>
          {[].concat(footer).map((line, i) => (
            <tspan key={line} x={PAD} dy={i ? 20 : 0}>
              {line}
            </tspan>
          ))}
        </text>
      )}
    </svg>
  );
}

// `decorative` plates (the grid cards, whose button already names the
// project) are hidden from assistive tech; elsewhere they carry the alt text.
export function ProjectMedia({ project, decorative = false, lazy = false, draggable }) {
  if (project.schematic) {
    return <Schematic schematic={project.schematic} label={decorative ? undefined : project.alt} />;
  }
  return (
    <img
      src={project.image}
      alt={decorative ? "" : project.alt}
      loading={lazy ? "lazy" : undefined}
      decoding="async"
      draggable={draggable}
      style={project.focus ? { objectPosition: project.focus } : undefined}
    />
  );
}
