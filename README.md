# hamishmarshalldawson.com

My portfolio site, live at [hamishmarshalldawson.com](https://hamishmarshalldawson.com). Built with React and framer-motion.

The Project vault has a **Featured builds** block: LocalMind and TensoRoom each get a card and a walkthrough that plays inside the page, so visitors can see the software without downloading or running it. Each demo is styled like its own app.

## Preview

### The Featured block

| Desktop (1440px) | Phone (390px) |
|---|---|
| <img src="docs/preview/desktop-0-featured.jpg" alt="Featured builds block with LocalMind and TensoRoom cards on desktop" width="560"> | <img src="docs/preview/phone-0-featured.jpg" alt="Featured builds block on a phone" width="220"> |

### Play tour

Press **Play tour** and a pointer walks through each step: it glides to each part of the screen, highlights it, labels it and presses it. Steps fade between each other, and a progress bar shows where the tour is. With reduced motion or the site's FX switch off, the tour is replaced by manual stepping.

| | |
|---|---|
| <img src="docs/preview/desktop-localmind-tour.jpg" alt="LocalMind tour highlighting the open_document tool call with a label" width="560"> | <img src="docs/preview/phone-tensoroom-tour.jpg" alt="TensoRoom tour on a phone, pointer on the prompt box with a label" width="220"> |
| <sub>LocalMind, step 03 mid-tour</sub> | <sub>TensoRoom on a phone, step 03 mid-tour</sub> |

### LocalMind demo

Styled like the current app, with paper, ink and a blue accent. Six steps: the chat home screen, pasting a job advert, the tool calls, the answer with a PDF, the knowledge base sections, and messaging the PC from a phone.

| | |
|---|---|
| <img src="docs/preview/desktop-localmind-1.jpg" alt="LocalMind home screen with VRAM, GPU and context readouts" width="420"> | <img src="docs/preview/desktop-localmind-3.jpg" alt="LocalMind tool calls: knowledge search, open cv.tex, write file, compile LaTeX" width="420"> |
| <sub>01 · Home screen</sub> | <sub>03 · Tool calls</sub> |
| <img src="docs/preview/desktop-localmind-5.jpg" alt="LocalMind knowledge base with shared and private sections" width="420"> | <img src="docs/preview/desktop-localmind-6.jpg" alt="LocalMind phone app waking the PC over the gateway" width="420"> |
| <sub>05 · Knowledge base</sub> | <sub>06 · From my phone</sub> |

<img src="docs/preview/phone-localmind-6.jpg" alt="LocalMind phone step on a phone" width="220">
<br><sub>Step 06 on a phone</sub>

### TensoRoom demo

Five steps, in the app's own phone layout, with the picture box in the same place on every step: your room, what to change, choose and describe, redraw, and a before/after comparison using real renders.

| | | | |
|---|---|---|---|
| <img src="docs/preview/phone-tensoroom-1.jpg" alt="TensoRoom first screen: Take a photo and Choose a photo" width="190"> | <img src="docs/preview/phone-tensoroom-2.jpg" alt="TensoRoom: naming the objects to change" width="190"> | <img src="docs/preview/phone-tensoroom-3.jpg" alt="TensoRoom: four objects found, each with a mask" width="190"> | <img src="docs/preview/phone-tensoroom-5.jpg" alt="TensoRoom before/after slider, grey sofa redrawn in green velvet" width="190"> |
| <sub>01 · Your room</sub> | <sub>02 · What to change</sub> | <sub>03 · Choose & describe</sub> | <sub>05 · Compare</sub> |

<img src="docs/preview/desktop-tensoroom-5.jpg" alt="TensoRoom compare step on desktop" width="560">
<br><sub>Step 05 on desktop</sub>

## Where it lives

- `src/components/featured/`: the block (`FeaturedProjects.js`), the step and tour engine (`DemoStage.js`, `DemoCursor.js`) and one module per demo in `demos/`.
- `public/featured/tensoroom/`: the room photos the TensoRoom demo uses.
- To feature another project, add a `featured` entry to it in `src/components/projectdata.js` and register a demo module in `FeaturedProjects.js`. A step's `tour` lists the `data-tour` targets the pointer visits (the contract is at the top of `DemoStage.js`).
- `docs/preview/`: the screenshots above. They aren't part of the built site.
- `assets-src/`: full-size originals of the project images. The site uses the resized copies in `public/`.

## Running it

- `npm start`: dev server at http://localhost:3000
- `npm test`: Jest tests
- `npm run build`: production build in `build/`
- `npm run deploy`: builds and publishes `build/` to the `gh-pages` branch, which serves the live site
