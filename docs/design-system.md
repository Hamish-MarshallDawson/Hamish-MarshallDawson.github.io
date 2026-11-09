# HMD design system

The rulebook for hamishmarshalldawson.com. Read this before you build or change any UI. It is written so you can
make a new section or component without opening the CSS. If this file and the code ever disagree, the code wins:
`src/styles/tokens.css` is the source of truth, and this file should be fixed to match it.

Figma: https://www.figma.com/design/vsPXcDB3SKkWlrRkdN18Zu (page map at the end).

## 1. Purpose and character

- A one-page React (CRA) portfolio for Hamish Marshall Dawson, AI & Software Engineer.
- Neo-brutalist: flat fills, hard black frames, solid offset shadows, square corners, big condensed type, and a
  spreadsheet / terminal feel (cells, rules, codes, readouts).
- Components read tokens: the values in `tokens.css` or the surface contract set by `.surface-*` classes
  (`utilities.css`). Known exceptions: component-local type clamps (listed in §4), and a few cards that pin
  ink/paper (`.vslot`, `.dossier`, `.palette-row`, `.rw-input`, `.index`). Do not copy them. See §13.

## 2. Palette

Exactly three colours. No greys, no gradients, no opacity fades, no blur. One exception: the featured demos
(`featured/demos/*`) animate opacity for scene changes. UI chrome never does.

| Token | Value | Use |
| --- | --- | --- |
| `--paper` | `#ffffff` | page, cards, text on ink and signal |
| `--ink` | `#000000` | text, frames, shadows |
| `--signal` | `#1f1fff` (default) | the accent: Index button, focus fills, duotones, Reach out section, loading card |

### Pairing rules (every text pair clears 4.5:1, WCAG 2.2 AA)

| Pair | Ratio | Allowed |
| --- | --- | --- |
| ink on paper | 21:1 | yes |
| paper on ink | 21:1 | yes |
| paper on signal | 7.8:1 | yes |
| signal on paper | 7.8:1 | yes: signal text only ever sits on paper |
| ink on signal | 2.7:1 | **never**: text on signal is always paper |
| signal on ink | 2.7:1 | **never**: signal on ink is block colour only (shadows, fills), never text |

### Colour menu

Visitors can change `--signal` from the header's Colour menu (`src/styles/palette.js`). The pick is stored in
`localStorage` key `hmd:colour` and applied by setting `--signal` on `<html>`. `src/styles/brand.js` then rebuilds
the favicon and browser-bar colour. Picking a colour replays the loading card in it.

| Option | Hex | Paper text on it |
| --- | --- | --- |
| Electric blue (default) | `#1f1fff` | 7.78:1 |
| Violet | `#6a00f4` | 7.19:1 |
| Cobalt | `#0047ab` | 8.44:1 |
| Deep orange | `#c43d00` | 5.23:1 |
| Hot pink | `#d6006f` | 5.14:1 |
| Signal red | `#e10600` | 4.97:1 |
| Racing green | `#00843d` | 4.81:1 |

Any new option must clear 4.5:1 against white (`npm start` warns in the console if it does not). Yellow, cyan and
light orange cannot work: white text on them falls to 1.3–3:1. If you change the default, also update `theme-color`
in `public/index.html` and `theme_color` in `public/manifest.json`.

So: design every screen in signal, never in "blue". Anything you draw in signal must still work in all seven colours.

## 3. Surfaces (the contract)

Each section picks one surface class. Components only read these names, so the same card works on any surface.

| Variable | `.surface-paper` | `.surface-ink` | `.surface-signal` |
| --- | --- | --- | --- |
| `--surface` (fill) | paper | ink | signal |
| `--on-surface` (text, icons) | ink | paper | paper |
| `--line` (borders, rules) | ink | paper | paper |
| `--shadow-ink` (hard shadow) | ink | signal | ink |
| `--text-accent` (emphasis text) | signal | paper | paper |
| `--focus-bg` (focus fill) | signal | paper | paper |
| `--focus-fg` (focus text) | paper | ink | ink |

The `.surface-*` classes also re-declare `--shadow-1…4`, because custom properties resolve where they are declared.

Section surfaces today: Lobby paper (its manifesto band ink), Project vault paper, Work log ink, Volunteer work
paper, Off-duty ink, Reach out signal, loading card signal, status strip ink, Index menu paper with a signal brand
panel, dossier paper with an ink bar and a signal abstract.

## 4. Type

Families:

| Token | Family | Use |
| --- | --- | --- |
| `--font-grotesk` | Archivo (variable: wdth 62–125, wght 100–900) | everything by default |
| `--font-mono` | JetBrains Mono (400/500/700) | labels, cells, readouts, buttons, chips |
| `--font-serif` | Instrument Serif (regular, italic) | the loading-card name only |
| `--font-pixel` | Silkscreen | numbers and counters (`.u-pixel`, `.num`) |

Archivo's width axis is the display system: `--wdth-compressed` 62, `--wdth-condensed` 75 (titles),
`--wdth-normal` 100 (reading), `--wdth-wide` 125 (spaced labels). Set it with
`font-variation-settings: "wdth" var(--wdth-condensed)`.

Fluid scale: `clamp(min, a + b·vw, max)` solved for a 320→1600px viewport, no media queries.

| Token / class | Range | Weight, width | Line height | Tracking | Case | Use |
| --- | --- | --- | --- | --- | --- | --- |
| `--fs-mega` / `.u-mega` | 56→272px (also capped by height) | 900, wdth 75 | `--lh-mega` 0.82 | `--tr-mega` −0.035em | caps | hero rows |
| `--fs-serif` | 56→208px | serif 400 | 0.86 (boot) | 0 | as typed | loading name |
| `--fs-display` / `.u-display` | 44→144px | 900, wdth 75 | `--lh-display` 0.88 | `--tr-display` −0.025em | caps | section titles |
| `--fs-h2` / `.u-h2` | 36→104px | 850, wdth 75 | 0.88 | −0.025em | as typed | statements |
| `--fs-h3` / `.u-h3` | 24→48px | 850, wdth 75 | `--lh-tight` 1.05 | −0.015em | caps | card titles |
| `--fs-h4` | 18→24px | 400 | `--lh-snug` 1.25 | 0 | as typed | section intro (`.sh-copy`) |
| `--fs-body` | 16→18px | 400, wdth 100 | `--lh-body` 1.55 | 0 | as typed | reading copy |
| `--fs-small` / `.u-mono` | 14px | mono 400 | 1.55 | 0 | as typed | code-ish copy |
| `--fs-micro` / `.u-micro` | 12px | mono 500 | 1.25 | `--tr-micro` 0.06em | caps | labels, cells, readouts |
| `.u-wide` | from context | 300, wdth 125 | — | `--tr-wide` 0.32em | caps | spaced labels |

Values at the two reference frames (Figma text styles `HMD/Desktop/*` and `HMD/Phone/*`):
Mega 205.2 / 56 · Serif 153 / 66.9 · Display 131.5 / 49.5 · H2 95.5 / 39.7 · H3 45 / 25.3 · H4 23.3 / 18.3 ·
Body 17.8 / 16.1 (1440×900 / 390×844).

Fixed recipes used by components: button label 700 12px mono, lh 1, +0.06em, caps; chip label 500 12px mono,
lh 1.2, caps. Component titles use their own clamps (featured name 24→34px, vault slot name 18→22.4px, dossier
title 32→60px, index row label 24→40px), always 850–900 condensed caps.

Decorative outline type (`.u-outline`) is a stroke `max(1.5px, 0.012em)` in on-surface and is only used on
`aria-hidden` echoes, never on real content.

## 5. Space, borders, shadows

Spacing (`--space-*`): 1=4, 2=8, 3=12, 4=16, 5=24, 6=32, 7=48, 8=64, 9=96 px. Use them for every gap and padding.

Borders (always solid, in `--line` unless a component pins ink):

| Token | Width | Use |
| --- | --- | --- |
| `--bw-hair` | 1px | microtable and fact rules |
| `--bw-rule` | 2px | nav cells, rows, chips, cell rules |
| `--bw-frame` | 3px | primary containers, buttons, cards |
| `--bw-heavy` | 4px | hero objects, dialogs, error fields |

Shadows are a second solid plate behind the object. Blur is always 0, colour is `--shadow-ink`:
`--shadow-1` 4px, `--shadow-2` 8px, `--shadow-3` 12px, `--shadow-4` 18px (`--off-1…4`, both x and y).

The press model (`.u-press`), the one interaction for anything clickable:

- Rest: sits on a 4px plate.
- Hover (fine pointers only): moves −4,−4 and the plate grows to 8px.
- Focus-visible: fill swaps to `--focus-bg` / `--focus-fg` and lifts like hover. Colour change and geometry change.
- Active: moves +4,+4 onto the plate; the plate disappears.
- Transform and shadow animate 90ms `--ease-snap`; colour changes are instant.

Corners are square. The only rounded things are `.pill` (999px), the round demo control's disc, and the phone mock
inside the Gyminit demo.

Patterns use hard colour stops only: `.u-hazard` (−45° stripes, 12px) and `.u-hatch` (135° 2px lines every 11px).
Images are never fills: `.u-raw` (grayscale, contrast 1.18) or `.u-duotone` (grayscale screened over signal).

## 6. Layout and breakpoints

| Token | Value |
| --- | --- |
| `--maxw` | 1680px content width (`.section-inner`, `.u-inner`) |
| `--gutter` | `clamp(16px, 0.5rem + 2.5vw, 48px)` (≈44 at 1440, ≈18 at 390) |
| `--section-pad` | `clamp(72px, 3rem + 7vw, 176px)` top and bottom of each `.section` (≈149 / ≈75) |
| `--measure` | 62ch for reading copy |
| `--bar-h` | 52px fixed header; also `scroll-padding-top` |
| `--strip-h` | 38px fixed bottom status strip |
| `--hit` | 44px comfortable target (hard floor 24px) |

Stacking (`--z-*`): bar 50 · stamp 55 · panel 60 · dialog 70 · wipe 80 · boot 100 · skip link 200.
In Figma, `layout/gutter` and `layout/section-pad` have Desktop / Phone modes (44 / 16 and 149 / 72).

Breakpoints in the CSS (all width queries are `max-width: N−1px` or `min-width: N`):

- **768**: the main phone break. Header cells stack, aside cells go full width, the status strip hides, boot
  segments halve.
- **max-height 500px** (landscape phones): treated like a phone for the status strip and the demo band; the hero's
  first screen drops the strip height (`Hero.css`); the Index menu hides its brand panel so the rows start under
  the header (`GlobalHUD.css`).
- **900**: featured cards go two-up and the carousel turns on (JS `useMediaQuery`); picture boxes switch from 4:3
  to 16:9; the dossier becomes a centred sheet instead of full screen. Below it the hero's AI core drops out of its
  corner into the flow (5:4 box, max 560px; `Hero.css`) and each Work log contract sheet collapses to one column
  and hides its org column (`Records.css`).
- **1024**: below it the header drops the hint and the clock, and the Reach out grid (`RedWall.css`) stacks the form
  over the side column.
- **1100**: the vault inspector panel appears beside the grid (JS); below it the vault grid and Records grids drop
  a column.
- **1200**: below it the hero sheet re-lays out.
- **1280**: wide header layout and FPS readout (JS); the featured nav spreads over 5 columns; below it the vault tabs
  wrap to 3 columns (`Vault.css`).
- **360 / 375 / 480**: small-phone fixes (header hides the count and the "Colour" word at 480, the Index glyph at
  375; the Colour menu goes full width at 480).
- `(hover: hover) and (pointer: fine)` gates hover lifts; touch only gets press.

Design at 1440×900 (desktop) and 390×844 (phone).

## 7. Component inventory

There is one component library, on the Figma **Components** page. The left column holds the foundation-level
components; the frame **"Library (from screens): figma-b components"** (6:2) on the same page holds the
page-level components the screens were built from. Every screen instance points at one of these.

| Component | Code | Figma node (Components page) | Notes |
| --- | --- | --- | --- |
| Button | `.btn` + `.u-press` in `src/App.css` | `Button` 6:95 (Style × State) | 48px tall, padding 0 24, 3px line border. Signal / Paper / Ink. Each names its own focus pair. Props: Label, Glyph, Glyph text. |
| Chip | `.chip` in `App.css` | `Chip` 6:101 (Size) | 28px (Compact 24 in featured cards), 2px border, not interactive. `.pill` is the rounded cousin. |
| Section header | `shared/SectionHeader.js` | `Section header` 6:103 | Full header: cells row (index cell filled) over a display title and optional `.sh-copy`. |
| Section bar | same, cells row only | `Section bar` 6:17 (in 6:2) | The cells row on its own, as the screens use it. |
| Surface plate | `.surface-*` + `.u-frame` + `.u-shadow-*` | `Surface plate` 6:139 (Surface × Shadow) | Generic card frame for any surface. |
| Tag | `.feat-idx`, `.vslot-tag` | `Tag` 6:15 (in 6:2) | Inverted micro label: "Featured 01/04", slot category tags. |
| LED | `.led` | `LED` 7:108 | 9px signal square, steps (never fades). |
| Barcode | `shared/Barcode.js` | `Barcode` 7:110 | Decorative SVG generated from a string. |
| Marquee | `shared/Marquee.js` | `Marquee` 7:272 (Micro / Mega) | `aria-hidden`, scroll-linked. Mega alternates filled and outline items. |
| HUD bar | `hud/GlobalHUD.js` `.bar` | `HUD bar` 8:64 (Width = Desktop / Phone, in 6:2) | Mark, rolling readout, clock, Colour button, Index button, scroll tape. |
| Index row | `.index-row` | `Index row` 6:34 (in 6:2) | The Index drop-down is the only navigation. Current row: code cell inverts, "Viewing". |
| Colour row | `.palette-row` | `Colour row` 8:87 (in 6:2) | Swatch, name, hex, ratio; set the row's HMD/Signal mode. Selected row takes its own colour. |
| Uplink row | `.index-link`, Contact uplinks | `Uplink row` 8:110 (in 6:2) | Icon, title, detail, arrow. |
| Status strip | `.strip` | `Status strip` 8:65 (in 6:2) | Ink, 38px. Uplinks, link status LED, FPS, mail, FX switch. Hidden on phones. |
| Highlight cell | `.hero-highlight` (`hero/Manifesto.js`) | `Highlight cell` 6:41 (in 6:2) | One of five highlights on the Lobby strip. |
| Zone card | `.hero-item` | `Zone card` 6:58 (Tone = Paper / Signal, in 6:2) | Lobby jump cards; Reach out is the signal one. |
| Featured card | `featured/FeaturedProjects.js` | `Featured card` 7:2 (in 6:2) | Picture box, tag, category, name, pitch, facts, chips, actions. Picture RAW at rest, duotone on hover. |
| Fact row | `.feat-facts li` | `Fact row` 6:27 (in 6:2) | "→ fact", mono 14px, hair rules. |
| Round demo control | `featured/DemoPlayer.js` `RoundControl` | `Round demo control` 8:266 (Glyph × State) | 44px box, 40px signal disc. Play / pause / next / replay. |
| Demo band | `.fdemo-band` | `Demo band` 8:268 | 60px caption + scene dots under a demo. |
| Vault slot | `vault/VaultSlot.js` | `Vault slot` 7:69 (State, in 6:2) | Grid card; opens the dossier. Pins ink/paper. Selected = duotone picture. |
| Vault slot / Empty | `.vslot--empty` | `Vault slot / Empty` 7:70 (in 6:2) | Unfilled capacity slot (dashed, hatched). |
| Dossier dialog | `vault/ProjectDossier.js` | `Dossier dialog` 10:315 | Project detail modal. |
| Microtable row | `.dossier-readout`, `.vinspect-stats` | `Microtable row` 8:238 | Key/value row (112px key column), bound to the surface contract. Used by the Dossier dialog and the screens' vault inspector. |
| Record card | `records/Records.js` (ServiceLog) | `Record card` 7:73 (in 6:2) | Work log contract sheet; also "Where I've studied". |
| Record point | `.contract-objectives li` | `Record point` 6:30 (in 6:2) | Numbered objective row in a Record card. |
| Volunteer card | `Records.js` (FieldOps) `.rcard` | `Volunteer card` 8:92 (in 6:2) | Photo RAW. |
| Off-duty card | `Records.js` (OffDuty) `.rcard` | `Off-duty card` 8:101 (in 6:2) | On ink; photo is a signal duotone. |
| Form field | `redwall/Contact.js` `Field` | `Form field` 10:386 (Kind × State) | Input 52px / textarea 160px. Focus inverts to ink. Props: Label, Hint, Show hint, Value. |
| Send button | `.rw-send` | `Send button` 10:388 | Signal button "Send message ▸" (opens the email app). |
| Boot card | `boot/BootSequence.js` | `Boot card` 10:393 | Signal loading card before the page. |
| Hackathon sheet | `records/Records.js` (Hackathons block, not built yet) | `Hackathon sheet` 41:232 (Width × Status) | A Record card for an event: Event mark, facts as Record points, a status tag instead of the progress bar. See §14. |
| Event mark | same | `Event mark` 39:75 (Mark = JPMorganChase / HackTheBurgh / Fallback) | 240×112 paper plate, 3px ink frame, the organiser's logo in ink. Fallback: initials over the event name. |

Not drawn as components: category tabs (`.vault-tabs`), the vault inspector panel, hero objects (AICore,
NeuralLattice), the demos' inner scenes, glitch/wipe effects. They exist as drawn frames on the screens pages.

### Adding a project

Projects live in `src/components/projectdata.js`. A featured project gets a Featured card (carousel order: Poseidon, LocalMind,
TensoRoom, Gyminit, Code for Good, Lothian Bus Display) and every project gets a Vault slot and a dossier. The featured index tag reads
"Featured NN/NN"; the dossier bar reads "File NN/NN · Category". Action labels: "Play demo" (signal, only when there
is a demo), then "Repo" for GitHub URLs or "Visit" otherwise (paper, external glyph, opens a new tab). An extra
action such as "Visit charity" is another paper button in the same row.

Worked example, the one drawn in Figma (the screens' Featured card and Vault slot, and the Dossier dialog, all
show it). Its entry in `projectdata.js` is `code-for-good`.

- Name "50+ Network impact platform" (full title "West Lothian 50+ Network: feedback and impact platform").
- Category line "Code for Good · JPMorganChase · Oct 2026"; vault category `ml` (ML & web).
- Position: "Featured 05/06" in the carousel; vault file 07/11 (order: poseidon, dissertation, hri, localmind, tensoroom,
  gyminit, code-for-good, bus, iteration-inc, minecraft-agent, bonin-loot), so the slot reads [07] and the dossier
  bar "File 07/11 · ML & web".
- Pitch: "A feedback and impact platform for the charity West Lothian 50+ Network, built in under 24 hours by a team
  of five who had never met before. I was the lead front-end developer."
- Facts: "Built in under 24 hours, brief to demo" / "Lead front-end developer in a team of five strangers" /
  "Built for West Lothian 50+ Network, to the charity's own brief".
- Chips (five tags): Next.js 16, React 19, TypeScript, PostgreSQL + Drizzle, OpenRouter AI.
- Actions: Repo (https://github.com/glasgow26/Team-2) then Visit charity (https://westlothian50plusnetwork.co.uk/).
  Play demo comes first (seven scenes, shown on the "Demo - Code for Good" page).
- Picture: the charity's logo, `public/projects/optimized/codeforgood.jpg` (source: `.agents/assets/wl50-logo.jpg`),
  with `fit: "contain"` (12% padding in the card and slot, 10% in the dossier). It prints RAW (black and white) at
  rest and as a signal duotone on hover or when selected, like every other picture. Alt text: "West Lothian 50+
  Network logo".

LocalMind's picture is its LM mark (`public/projects/optimized/localmind.svg`: signal plate, paper "LM"), also
`contain` and greyscale at rest. No project uses a `schematic` plate any more; the drawn-diagram plate stays
available in `ProjectMedia` for a project with no picture.

## 8. Motion

- framer-motion drives reveals, word masks, the readout roll and the dossier wipe. CSS handles the press model.
- Eases: `--ease-snap` `cubic-bezier(0.7, 0, 0.2, 1)` (mechanical, no float) for presses and UI moves;
  `--ease-out` `cubic-bezier(0.16, 1, 0.3, 1)` for reveals. Durations: `--dur-1` 90ms, `--dur-2` 160ms, `--dur-3` 280ms.
- Blinks and LEDs use `steps(1)`: on/off, never a fade.
- Headings rise word by word out of clip masks (0.62s, 0.055s stagger).
- Reduced motion: the OS setting and the site's FX switch (status strip, Index foot; stored as `hmd:fx`) behave the
  same. FX off sets `html[data-fx="off"]`, which cuts every CSS animation and transition to 0.001ms, and wraps the app
  in `<MotionConfig reducedMotion="always">`. FX off also skips the loading card. Demos draw each scene in its final
  state and the round control offers "Next scene" instead of play/pause.
- Every new animation must have a still, complete end state for reduced motion.

## 9. Copy voice

- Plain English, short sentences, one idea each. Write like a person, not a brochure.
- First person for Hamish ("I was the lead front-end developer").
- Labels are short and literal: "Play demo", "Visit", "Repo", "Send message", "Close".
- Section names exactly: Lobby, Project vault, Work log, Volunteer work, Off-duty, Reach out (codes 00–05). No
  faction names or invented in-world titles for sections.
- The terminal flavour lives in micro labels and readouts (codes, "File 04/12", "[OK]"), never in body copy that
  explains something.
- Screen-reader text spells out what icons and short labels mean ("(opens in a new tab)", "for LocalMind").

## 10. Accessibility rules

- Every text/fill pair clears 4.5:1 (see the pairing rules). Non-text indicators clear 3:1.
- Hit targets: 44px (`--hit`) for anything tapped often; never under 24px. Buttons are 48px tall.
- Focus: never the browser ring. Components swap to `--focus-bg` / `--focus-fg` and lift; anything else falls back to
  a 3px solid outline in `--on-surface`, offset 3px. `:focus:not(:focus-visible)` has no outline.
- Hidden carousel cards and closed demo panels are `inert` (out of the tab order and accessibility tree).
- Dialogs (`useDialog`): lock page scroll (`html.is-locked`), move focus inside, trap Tab, close on Escape, and
  return focus to the opener. The dossier starts on Close.
- Decorative items (marquees, barcodes, outline echoes, the readout) are `aria-hidden`.
- A skip link is the first focusable element.
- Live regions announce carousel position and form status.

## 11. Page flow

1. **Loading card** (`boot/`): signal, the name in serif, a boot log and a progress bar. Once per session
   (`sessionStorage hmd:booted`), skipped with FX off, any key or tap skips it.
2. **Header** (fixed, 52px) and **status strip** (fixed, 38px, hidden on phones) frame every section.
3. **00 Lobby** `#core`: hero with mega type and the AI core, then the manifesto band.
4. **01 Project vault** `#vault`: section header, Featured builds (carousel ≥900px, stacked below), category tabs,
   project grid (+ inspector ≥1100px), dossier dialog.
5. **02 Work log** `#work`: experience sheets, "Where I've studied", "Where I've hacked" and the Toolkit (ink). The
   Toolkit ledger has four rows of chips: Languages, AI / ML, Systems & tools, and Agents & workflow (Claude Code,
   Codex, Herdr, Multi-agent orchestration, MCP servers, Playwright, Obsidian).
6. **03 Volunteer work** `#volunteer` (paper).
7. **04 Off-duty** `#offline` (ink).
8. **05 Reach out** `#reach-out`: signal section, warning strip, contact form (fields, channel picker, Send).

Routing (`src/sections.js`, `hooks/useSectionRouter.js`):

- Every section is a hash route: `#core` (shown as no hash), `#vault`, `#work`, `#volunteer`, `#offline`,
  `#reach-out`. Old names still land through `SECTION_ALIASES`: `#logs` → work, `#field` → volunteer,
  `#redwall` → reach-out.
- Vault tabs are sub-routes: `#vault/research`, `#vault/robotics`, `#vault/performance`, `#vault/ml`; All is plain
  `#vault`. Tab changes use `replaceState`, and Back/Forward between them is honoured.
- Scrolling updates the hash with `replaceState` (scrolling never fills history). Deliberate jumps (the HUD, the
  Index menu, the CV request) use `pushState`.
- A deep link (e.g. `#reach-out`) is honoured once, when the page first becomes ready after the loading card.
- Picking a colour in the Colour menu replays the loading card in the new colour and resets to the top.

## 12. Figma

File: https://www.figma.com/design/vsPXcDB3SKkWlrRkdN18Zu

| Page | What is on it |
| --- | --- |
| Cover | Title frame. |
| Foundations | Colour (primitives, Colour-menu modes), Surfaces (the contract per mode), Rules, Type, Space/borders/shadows (incl. the press model), Layout (tokens, breakpoints, motion, z-index). |
| Components | The one library: every component in §7, with variants, properties and descriptions (page-level ones in frame 6:2). |
| Reference, Screens - Desktop 1440, Screens - Phone 390, Flow | The screens and the route/flow map, built from the Components page. Desktop frames: Lobby 10:116, Project vault 11:126, Work log 12:465, Volunteer work 13:654, Off-duty 13:711, Reach out 13:770. |
| Lothian Bus Display | The bus project's Featured card (desktop pair 04–05 / 05 and phone), Vault slot (default,
selected) and Dossier dialog, with a notes column. |
| Demo - Lothian Bus Display | The seven scenes of the bus demo as 656 × 861 panels with the band, a 390 phone panel, the
screen parts as local components and per-scene animation notes. `BusDisplayDemo.css` is the source of truth. |
| Demo - Code for Good | The seven scenes of the Code for Good demo as 656 × 861 panels with the band. Each scene box holds a 1440 screenshot of the built demo's end state (`.agents/shots/demo2/1440-dN-<id>.png`); two-screen scenes (2, 3, 4, 6, 7) show their first screen as a smaller frame under the panel. Each notes column names the matching video still. |

Variables:

- `HMD/Primitives`: `paper`, `ink`.
- `HMD/Signal`: `signal`, one mode per Colour-menu option. Set a frame's mode to preview the site in that colour.
- `HMD/Surface`: modes `paper` / `ink` / `signal`; `surface`, `on-surface`, `line`, `shadow-ink`, `text-accent`,
  `focus-bg`, `focus-fg`, all aliases. Set a section frame's mode to re-skin everything inside it.
- `HMD/Geometry` (modes Desktop / Phone): `bw/*`, `off/*`, `space/*`,
  `layout/bar-h|strip-h|hit|maxw|gutter|section-pad`, `breakpoint/*`. Only gutter and section-pad differ by mode.

Styles: text `HMD/Desktop/*` and `HMD/Phone/*` (the fluid scale), `HMD/Mono`, `HMD/Mono 12`, `HMD/Readout value`,
`HMD/Micro`, `HMD/Micro bold`, `HMD/Label/*` (Button, Chip, Field, Hint, Key, Tight), `HMD/Caption`, `HMD/Input`,
`HMD/Wide`, `HMD/Pixel`, `HMD/Pixel/16`, `HMD/Glyph/*`, plus component titles (`HMD/Desktop/Card title`,
`Dossier title`, `Marquee`, `Abstract`). Styles marked "(b)" record recipes the screens used that are not exact
code values; their descriptions name the code value. Every text node on the Components page uses a style.
Effects: `HMD/Shadow/1–4` and `HMD/Shadow/Press-hover` (bound to `shadow-ink` and `off/*`), `HMD/Shadow/Signal-1|2`
(the contact field's error and focus plates). Every variable's web code syntax is its CSS name, e.g.
`var(--on-surface)`.

Known gaps between Figma and code: icons are text glyphs in Figma (the code uses SVGs in `shared/Icons.js`); the
Boot card draws its dotted leaders solid; Figma has no hover, so hover states are separate variants (Button
variants are drawn offset −4,−4 / +4,+4 inside their set).

## 13. Known deviations in the code

The rules above are the target. These places in the code break them today; do not copy them into new work.

1. **Opacity.** `.fdemo-dots li` dims inactive scene dots with `opacity: .25`; the demos (`GyminitDemo.css`,
   `LocalMindDemo.css`) animate opacity between scenes. Chrome should use a hollow dot instead.
2. **Shadow colour.** `.feat-card`, `.fdemo-overlay`, `.fdemo-close` and `.fdemo-round::before` cast their shadow
   in `--line`, not `--shadow-ink`. Identical on paper; on ink they would cast paper instead of signal.
3. **Pinned ink/paper.** `.vslot`, `.dossier` and `.dossier-*`, `.palette-row`, `.rw-input` and `.index` borders use
   `var(--ink)` / `var(--paper)` directly instead of the surface contract, so they do not re-skin on other surfaces.
4. **Radius.** `GyminitDemo.css` uses 22px / 50% / 999px (its phone mock), and the round demo control's disc is
   50%. The only shared rounded primitive is `.pill`.
5. **Local sizes.** Component-local type clamps (§4) and raw px: `.bar-mark` 24px, `.bar-code` 11px, the palette
   swatch's 3px shadow, `.rw-input` 17px, the demo band's 76px right padding.
6. `--wdth-compressed` (62) is defined but not used by any CSS read for this doc.

## 14. Page layout recipes

All sections: `.section` (padding `--section-pad` × `--gutter`) wrapping `.section-inner` (max `--maxw`), starting
with a Section header. Figma frames listed are on "Screens - Desktop 1440".

- **Lobby / hero** (`hero/`, frame 10:116): first screen is `min-height: 100svh − bar − strip`. A spec sheet row
  (`.hero-sheet`: 160px id cell + 3 equal cells, 2px rules, 3px bottom rule) over the mega name rows with the AI
  core beside them. Below, `.hero-deck`: 12 columns, column gap 32, row gap 64, padding 96 top; intro spans 1–7
  (bio max 52ch), the ink vector plate spans 9–12 (padding 32, 3px ink frame); then the highlights strip (5 equal
  cells, 2px gaps showing the line colour, 3px rules top/bottom) and the zone cards (4 columns, gap 24, each min
  176px, padding 16/16/24/24, 3px ink frame). Under 1200 the sheet re-lays out; under 900 the core joins the flow.
- **Work log sheet** (`records/Records.js` ServiceLog, frame 12:465, ink section): sheets stack with gap 64. Each is
  a paper sheet: signal bar (padding 12 24, 3px ink bottom rule, state tag with 2px paper border), then a 12-column
  body (gaps 32 × 48, padding 32 32 24): head spans 1–5, objectives span 6–12 as rows of 44px number +
  text (gap 16, padding 16 0, 2px ink top rule), progress row spans all. Under 900: one column.
  - **Head column**, top to bottom: role/qualification title, the **mark slot**, the "period · place" line, then the
    **org stamp** pushed to the foot of the column (`margin-top: auto`).
  - **Mark slot**: an Event mark instance, Size=Desktop (logo 200 tall) or Size=Phone (logo 96 tall). No plate: no
    paper fill, no frame, no padding; the mark is just the ink logo, width following its aspect (ST about 344 wide,
    Heriot-Watt 400, the square marks 200; on phone 165 / 192 / 96), left-aligned with the title. Logos print in ink
    only: colour fields become ink, white counters become paper. Marks: STMicro `Mark=ST`, HRI internship
    `Mark=Robotarium` (National Robotarium pinwheel, mark only), MEng `Mark=Heriot-Watt` (crest + wordmark), Alford
    Academy `Mark=Alford` (the Alford bull silhouette), Code for Good `Mark=JPMC tile` (a black square with the white
    serif "JPMC", `jpmc-tile.png`; the tile is the whole mark, 200 square on desktop, 96 on phone). No usable logo:
    `Mark=Fallback` (initials + name, also plate-free).
  - **Org stamp** (`.contract-org`): the organisation only, no city (the city is already in the meta line):
    STMICROELECTRONICS, HERIOT-WATT UNIVERSITY (HRI and MEng), ALFORD ACADEMY, JPMORGANCHASE. Mono stamp:
    JetBrains Mono 700, 15px desktop (text style `HMD/Desktop/Stamp`), 12px phone (`HMD/Micro bold`), tr-micro
    (0.06em), uppercase, ink, no outline, wraps to a second line if needed. Matches the HUD readouts and section
    cells. Shown on phone too. The old outlined echo (900 condensed, transparent fill, 1.5px text-stroke, clipped to
    one line) is retired: nothing in the system uses text-stroke or opacity.
  - In Figma the desktop Role column has a min height equal to its content, so a 200px mark never clips the stamp
    when the objectives column is shorter.
- **Volunteer / Off-duty cards** (`.rgrid`, `.rcard`; frames 13:654, 13:711): Volunteer is 2 columns, Off-duty 3
  (column gap 48, 32 for 3-up); rows align through `subgrid` (meta, title, 4:3 media with 3px frame, org, copy).
  Titles 900 clamp(32→72px) lh .86; Off-duty titles are wide 300 at clamp(20→30px), +0.08em. Under 1100 3-up goes
  2-up; under 768 one column. Volunteer photos are RAW and turn duotone on hover; Off-duty is the reverse
  (duotone at rest, RAW on hover), and its meta runs vertically in a 48px left gutter.
- **Reach out / contact form** (`redwall/`, frame 13:770, signal section): hazard warning strip (3px ink frame),
  then `.rw-grid` 1.7fr | minmax(280px, 1fr), gap 64. The form is a paper plate with a 4px ink frame and 18px ink
  shadow: an ink head row (padding 12 24, integrity meter), fields in 2 columns (gap 24, padding 32 24 24) with
  Message and the channel picker spanning both, an ink "intercepts" log (min 92px), then Send + note (padding 32 24
  12). Under 1024 the grid stacks; under 768 the fields go one column.
- **Hackathons block** (`records/Records.js`, inside the Work log after "Where I've studied" and before the
  Toolkit; desktop frame 12:465, phone 19:465). Same shape as the Education block: a cells row "(02·c) ·
  Hackathons · 2 events", the masked-words title "Where I've hacked.", then a full Hackathon sheet for each attended
  event, newest first, and a compact Upcoming strip for each event still to come, directly under the sheets (gap 48
  like the rest of the section). A hackathon is an event, not a contract: it never counts towards "N contracts on
  record".
  - **Attended sheet** (Status=Attended) is the RecordSheet: signal bar "Hackathon 0xNN // Organiser" with an
    Attended tag, then the 12-column body. The head (cols 1–5) follows the Work log head column: event name, the
    mark slot (`Mark=JPMC tile`, Size=Desktop/Phone), "date · city · length", and the org stamp "JPMorganChase"
    at the foot. The facts (cols 6–12) are Record point rows under "Facts [n/n]". The progress row becomes a status row:
    "Status", an ink tag with paper text, then the links pushed right as Buttons: Signal for an in-page jump ("See
    the project ↑", to the featured card / vault file 06), Paper with ↗ for external links. HackTheBurgh XIII 0x02: the ink hexagon `hacktheburgh.svg` from the event's site, "Sat 7 – Sun 8 Nov 2026 · Edinburgh · 24 hours", status "Attended · 24 hours", Facts [5/5], links "See the project ↑" / "hacktheburgh.com ↗" / "Repo ↗". The Upcoming strip below stays for future events. Code for Good 0x01:
    "Fri 23 – Sat 24 Oct 2026 · Glasgow · 24 hours", status "Attended · 24 hours, no sleep", Facts [5/5] (copy in
    `projectdata.js` `hackathons`), links "See the project ↑" / "Visit charity ↗" / "Repo ↗".
  - **Upcoming strip** (Status=Upcoming): no bar, mark, facts or numbered rows. One row: a paper frame with a 3px
    ink outline, no shadow, filled with the `.u-hatch` pattern (2px `line` strokes every 11px at 135°, drawn as
    lines, never opacity: the system has no transparency), padding 16 24, gap 16. Left, the line "Upcoming ·
    HackTheBurgh XIII · Edinburgh · Sat 7 – Sun 8 Nov 2026" in Micro, ink, on a paper chip (padding 8 12) so it
    reads over the hatching; right, a Paper button "hacktheburgh.com ↗". Desktop 72 tall; phone stacks text over
    button and hugs its height (148 at 358 wide).
  Logos print in ink only: an organiser's colour fields drop out to paper (HackTheBurgh's stripes), as every
  picture on the site prints greyscale. No usable logo: use the Fallback mark (initials in condensed caps over the
  event name). Under 900 the sheet's bar and body stack, the org stamp drops to 12px and the links wrap; the strip
  wraps its button under the text.

### Demos

A featured card's demo plays in a panel over its partner card: the panel is the card's size (about 656 × 861 at
1440), the scene fills it above the 60px Demo band (caption, seven dots, round control), and the close button owns
the top-right 52 × 52, so nothing in a scene sits there. A demo wears the product's own look, not the site's: the
Gyminit demo is Gyminit's Frutiger Aero, and the Lothian Bus Display demo draws the board's 320 × 480 screen in its own theme (`gfx/theme.h` of the bus repo:
white, Lothian maroon #8C1713, route pills in the routes' own colours, Nunito Sans) inside a rounded black bezel,
with every size a multiple of one screen pixel (`--u`); every stop and destination in it is city centre. The
Code for Good demo copies the platform's real tokens from its
source CSS (navy #073e8c, cream #f6f6f1, text #1f1f1f, Inter, 2px lines, 0.4em radius, and the GOV.UK-style focus
ring: cream, then black, then #ffdd00). Its spec is the set of scene screenshots in `.agents/shots/demo2/`
(`1440-` and `390-`, each scene's end state, plus `-first` for the earlier screen of a two-screen scene), shown on
the Figma page; `CodeForGoodDemo.css` is the source of truth. The palette is declared on the
demo's root, so the Colour menu cannot reach it, and the three-colour rule stops at the panel's frame and band.
Copy the product from its real screens (video stills, screenshots), keep its real copy and figures, and draw each
scene's end state first: that is also the reduced-motion frame. Entrances start hidden and fill forwards; only
transform, opacity and clip-path move. The Code for Good scenes are on the Figma page "Demo - Code for Good".

The Poseidon demo uses the product's shipped Dark theme (`tokens/tokens.css` of the Poseidon repo: panel #1c2d38,
text #eee9dc, accent #86c9e8, dark-ship pink #f26aa0, Barlow Semi Condensed and IBM Plex Mono), with every size a
multiple of one product pixel (`--u`). Where the product's wording would overclaim, the demo departs from it on purpose:
go-dark is an order with reasons and never a percentage, route estimates are "80% circle" and "95% circle", every named
ship is synthetic (SYN 4821, MMSI 000 004 821) and a persistent tag says so. Map, AIS and Danish Maritime Authority
credits sit where that data appears.
