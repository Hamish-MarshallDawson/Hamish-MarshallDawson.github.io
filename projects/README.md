# Project images

Referenced from `src/components/projectdata.js`. Filenames are matched exactly —
GitHub Pages is case-sensitive, so `BoninLoot.png` and `boninloot.png` are not
the same file. Anything missing falls back to the gradient behind it.

## Two copies

- **This folder** — full-resolution originals, straight off the camera. Nothing
  on the site loads these.
- **`optimized/`** — what the site actually serves: same filenames, resized to
  1200px wide, JPEGs re-encoded at quality 82. 18.95 MB → 2.34 MB.

`projectdata.js` points at `optimized/`. Adding a new image means dropping the
original here and putting a resized copy in `optimized/` under the same name.

| Filename                | Used by                    |
| ----------------------- | -------------------------- |
| `dissertation.png`      | Robotic arm object swapping |
| `hri.jpg`               | Trust in Teleoperation      |
| `tensoroom.png`         | TensoRoom                   |
| `bus.jpg`               | Lothian Bus Display         |
| `iterationinc.png`      | Iteration Inc               |
| `minecraft.png`         | Minecraft Companion Agent   |
| `BoninLoot.png`         | Bonin' Loot                 |
| `ClassRepoftheyear.jpg` | Student Representative      |
| `hw-racing.jpg`         | Heriot-Watt Racing          |
| `GymLife.jpg`           | The gym                     |
| `NewPc.jpg`             | Building PCs                |
| `EdinTown.jpg`          | Photography and film        |

LocalMind has no image: its plate is drawn from the `schematic` field in
`projectdata.js` (nodes, links, notes). Any project can use one instead of
`image`.

## Hero portrait

`public/image_2a10f9.jpg` is the camera original (6679×4453, ~30 MB); the
site serves `public/optimized/image_2a10f9.jpg`, a 1600px copy at JPEG
quality 82 (~240 KB). Replace both together, keeping the originals-and-copies
split above.

Landscape crops around 16:9 work best — cards and slides use that ratio.

## Note on deploy size

Everything under `public/` is copied into `build/` and pushed to GitHub Pages,
so the originals ship too — 19 MB of files no visitor ever requests. Page load
is unaffected (nothing links to them), but each deploy carries the extra weight.
Moving the originals outside `public/` would fix that.
