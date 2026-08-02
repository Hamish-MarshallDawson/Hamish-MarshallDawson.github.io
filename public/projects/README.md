# Project images

Referenced from `src/components/projectdata.js`. Filenames are matched exactly —
GitHub Pages is case-sensitive, so `BoninLoot.png` and `boninloot.png` are not
the same file. Anything missing falls back to the gradient behind it.

| Filename                | Used by                          | Present |
| ----------------------- | -------------------------------- | ------- |
| `dissertation.png`      | Robotic arm object swapping      | yes     |
| `hri.jpg`               | Trust in Teleoperation           | yes     |
| `tensoroom.png`         | TensoRoom                        | yes     |
| `bus.jpg`               | Lothian Bus Display              | yes     |
| `iterationinc.png`      | Iteration Inc                    | yes     |
| `minecraft.png`         | Minecraft Companion Agent        | **no**  |
| `BoninLoot.png`         | Bonin' Loot                      | yes     |
| `ClassRepoftheyear.jpg` | Student Representative           | yes     |
| `hw-racing.jpg`         | Heriot-Watt Racing               | yes     |

Landscape crops around 16:9 work best — cards and slides use that ratio.

Keep each file under ~300KB. Several are currently in the megabytes, which is
the bulk of the page's load time.
