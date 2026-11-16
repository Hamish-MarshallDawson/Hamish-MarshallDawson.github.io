import { DEMOS } from "./featured/FeaturedProjects";
import { experience, highlights, profile, vaultProjects } from "./projectdata";

const featured = vaultProjects.filter((project) => project.featured);

test("Gyminit links to the live app and says it practised multi-agent orchestration", () => {
  const gyminit = vaultProjects.find((project) => project.id === "gyminit");
  expect(gyminit.url).toBe("https://gyminit.hamishmdawson.workers.dev");
  expect(gyminit.description).toMatch(/multi-agent orchestration/i);
});

test("the bus display is featured with its repo, and its picture is the city-centre render, not the old photo", () => {
  const bus = vaultProjects.find((project) => project.id === "bus");
  expect(bus.url).toBe("https://github.com/Hamish-MarshallDawson/Lothian-Api-Bus-Display");
  expect(bus.featured.demo).toBe("bus");
  expect(bus.category).toBe("Open source · C++ · Completed 2026");
  expect(bus.image).toMatch(/bus-board\.png$/);
  expect(JSON.stringify(bus)).not.toMatch(/e-ink/i);
});

test("Poseidon is featured with its repo and demo, and its copy makes no guarantee", () => {
  const poseidon = vaultProjects.find((project) => project.id === "poseidon");
  expect(poseidon.url).toBe("https://github.com/Hamish-MarshallDawson/Poseidon");
  expect(poseidon.featured.demo).toBe("poseidon");
  expect(JSON.stringify(poseidon)).not.toMatch(/detects illegal|caught|proves|guarantee|80% chance/i);
  expect(poseidon.description).toMatch(/Danish Maritime Authority/);
});

test("every featured demo names a loader in DEMOS", () => {
  featured.filter((project) => project.featured.demo).forEach((project) => expect(Object.keys(DEMOS)).toContain(project.featured.demo));
});

test("STMicroelectronics is described without figures, on the record and in the hero facts", () => {
  const st = experience.find((job) => job.org === "STMicroelectronics");
  expect(st.points).toHaveLength(5);
  st.points.forEach((point) => expect(point).not.toMatch(/\d+%|senior engineers|\b\d+ (fault|classes)/));
  expect(JSON.stringify(highlights)).not.toMatch(/98%|23%|8 senior/);
});

test("coding agents come up at most once per project, and TensorRoom is spelled right", () => {
  vaultProjects.forEach((project) => {
    const mentions = JSON.stringify(project).match(/coding agent/gi) || [];
    expect(mentions.length).toBeLessThanOrEqual(1);
  });
  expect(JSON.stringify(vaultProjects)).not.toMatch(/TensoRoom/);
});

test("the CV is the published PDF", () => {
  expect(profile.cv).toMatch(/\/cv\.pdf$/);
});
