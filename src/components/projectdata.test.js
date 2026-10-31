import { DEMOS } from "./featured/FeaturedProjects";
import { vaultProjects } from "./projectdata";

const featured = vaultProjects.filter((project) => project.featured);

test("Gyminit links to the live app and says it practised multi-agent orchestration", () => {
  const gyminit = vaultProjects.find((project) => project.id === "gyminit");
  expect(gyminit.url).toBe("https://gyminit.hamishmdawson.workers.dev");
  expect(gyminit.featured.facts.some((fact) => /multi-agent orchestration/i.test(fact))).toBe(true);
});

test("the bus display is featured with its repo, and its picture is the city-centre render, not the old photo", () => {
  const bus = vaultProjects.find((project) => project.id === "bus");
  expect(bus.url).toBe("https://github.com/Hamish-MarshallDawson/Lothian-Api-Bus-Display");
  expect(bus.featured.demo).toBe("bus");
  expect(bus.category).toBe("Open source · C++ · Completed 2026");
  expect(bus.image).toMatch(/bus-board\.png$/);
  expect(JSON.stringify(bus)).not.toMatch(/e-ink/i);
});

test("every featured demo names a loader in DEMOS", () => {
  featured.filter((project) => project.featured.demo).forEach((project) => expect(Object.keys(DEMOS)).toContain(project.featured.demo));
});
