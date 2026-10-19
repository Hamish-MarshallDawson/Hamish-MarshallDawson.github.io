import { DEMOS } from "./featured/FeaturedProjects";
import { vaultProjects } from "./projectdata";

const featured = vaultProjects.filter((project) => project.featured);

test("Gyminit links to the live app and says it practised multi-agent orchestration", () => {
  const gyminit = vaultProjects.find((project) => project.id === "gyminit");
  expect(gyminit.url).toBe("https://gyminit.hamishmdawson.workers.dev");
  expect(gyminit.featured.facts.some((fact) => /multi-agent orchestration/i.test(fact))).toBe(true);
});

test("every featured demo names a loader in DEMOS", () => {
  featured.forEach((project) => expect(Object.keys(DEMOS)).toContain(project.featured.demo));
});
