import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { categories, profile, vaultProjects } from "../projectdata";
import { useRepoTelemetry } from "../../hooks/useRepoTelemetry";
import { parseHash } from "../../hooks/useSectionRouter";
import { SectionHeader } from "../shared/SectionHeader";
import { VaultSlot, pad } from "./VaultSlot";
import { ProjectDossier } from "./ProjectDossier";
import { FeaturedProjects } from "../featured/FeaturedProjects";
import "./Vault.css";

const ALL = {
  id: "all",
  name: "All",
  label: "Full index",
  blurb: "Every file in the vault, across all four categories.",
};
const TABS = [ALL, ...categories];
const TAB_IDS = TABS.map((tab) => tab.id);

function categoryFromHash() {
  const route = parseHash(window.location.hash, ["vault"]);
  return route && TAB_IDS.includes(route.sub) ? route.sub : "all";
}

// The vault: the featured builds first, then "More from the vault": a ruled
// tab row of categories over a grid of the other files, each opening its
// dossier. A project shows once: featured ones are not repeated in the grid.
// Tabs are a real tablist (roving focus, arrow keys) and each one is also a
// route: #vault/robotics.
export function AIResearchVault() {
  const [category, setCategory] = useState(categoryFromHash);
  const [openId, setOpenId] = useState(null);
  const repos = useRepoTelemetry(profile.githubUser);
  const tabRefs = useRef({});

  // Curated order and copy always win; GitHub only adds the repo link (for
  // projects without one) and the live readouts.
  const projects = useMemo(
    () =>
      vaultProjects.map((project) => {
        const live = project.repo && repos?.[project.repo.toLowerCase()];
        return live ? { ...project, url: project.url || live.url, live } : project;
      }),
    [repos]
  );

  const featured = useMemo(() => projects.filter((project) => project.featured), [projects]);
  const rest = useMemo(() => projects.filter((project) => !project.featured), [projects]);

  const counts = useMemo(
    () =>
      Object.fromEntries(
        TABS.map((tab) => [
          tab.id,
          tab.id === "all" ? rest.length : rest.filter((p) => p.categories.includes(tab.id)).length,
        ])
      ),
    [rest]
  );

  const visible = useMemo(
    () => (category === "all" ? rest : rest.filter((p) => p.categories.includes(category))),
    [rest, category]
  );

  const current = TABS.find((tab) => tab.id === category);
  // The dossier steps through the list its file came from: the featured six or the filtered grid.
  const dossierList = featured.some((p) => p.id === openId) ? featured : visible;
  const openIndex = dossierList.findIndex((p) => p.id === openId);

  const select = (id, moveFocus = false) => {
    setCategory(id);
    window.history.replaceState(null, "", id === "all" ? "#vault" : `#vault/${id}`);
    if (moveFocus) tabRefs.current[id]?.focus();
  };

  // Back/Forward between #vault/<category> entries.
  useEffect(() => {
    const onPopState = () => {
      if (parseHash(window.location.hash, ["vault"])) setCategory(categoryFromHash());
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  // Roving focus for the tablist: arrows move and select, Home/End jump.
  const onTabKeyDown = (event, index) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
    let next = null;
    if (step) next = (index + step + TABS.length) % TABS.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = TABS.length - 1;
    if (next === null) return;
    event.preventDefault();
    select(TABS[next].id, true);
  };

  const stepDossier = useCallback(
    (direction) => {
      const at = dossierList.findIndex((p) => p.id === openId);
      setOpenId(dossierList[(at + direction + dossierList.length) % dossierList.length].id);
    },
    [dossierList, openId]
  );

  const closeDossier = useCallback(() => setOpenId(null), []);

  return (
    <section id="vault" className="section vault surface-paper" data-category={category} aria-labelledby="vault-title">
      <div className="section-inner">
        <SectionHeader
          index="02"
          kicker="Project vault"
          title="Things I've built."
          titleId="vault-title"
          aside={[`${projects.length} files · ${featured.length} featured`]}
        />

        <FeaturedProjects projects={featured} onOpenFile={setOpenId} />

        <h3 className="vault-more">More from the vault</h3>

        <LayoutGroup id="vault-tabs">
          <div className="vault-tabs" role="tablist" aria-label="Categories">
            {TABS.map((tab, index) => {
              const selectedTab = tab.id === category;
              return (
                <button
                  key={tab.id}
                  ref={(node) => {
                    tabRefs.current[tab.id] = node;
                  }}
                  type="button"
                  role="tab"
                  id={`vault-tab-${tab.id}`}
                  aria-selected={selectedTab}
                  aria-controls="vault-panel"
                  tabIndex={selectedTab ? 0 : -1}
                  className="vault-tab"
                  data-category={tab.id}
                  onClick={() => select(tab.id)}
                  onKeyDown={(event) => onTabKeyDown(event, index)}
                >
                  {selectedTab && (
                    <motion.span
                      layoutId="vault-tab-fill"
                      className="vault-tab-fill"
                      transition={{ duration: 0.34, ease: [0.7, 0, 0.2, 1] }}
                    />
                  )}
                  <span className="vault-tab-idx" aria-hidden="true">
                    ({pad(index)})
                  </span>
                  <span className="vault-tab-name">{tab.name}</span>
                  <span className="vault-tab-label">{tab.label}</span>
                  <span className="vault-tab-count num">
                    {pad(counts[tab.id])}
                    <span className="sr-only"> projects</span>
                  </span>
                </button>
              );
            })}
          </div>
        </LayoutGroup>

        <p className="sr-only" aria-live="polite">
          Showing {visible.length} {visible.length === 1 ? "project" : "projects"} in {current.name}
          {category === "all" ? "" : `: ${current.label}`}.
        </p>

        <motion.ul id="vault-panel" role="tabpanel" aria-labelledby={`vault-tab-${category}`} className="vault-slots">
          <AnimatePresence mode="popLayout" initial={false}>
            {visible.map((project) => (
              <VaultSlot
                key={project.id}
                project={project}
                fileNo={featured.length + rest.indexOf(project) + 1}
                onSelect={() => setOpenId(project.id)}
              />
            ))}
          </AnimatePresence>
        </motion.ul>
      </div>

      <ProjectDossier projects={dossierList} index={openIndex} onClose={closeDossier} onStep={stepDossier} />
    </section>
  );
}
