import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { isMobile } from "react-device-detect";
import { categories, profile, vaultProjects } from "../projectdata";
import { useRepoTelemetry } from "../../hooks/useRepoTelemetry";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { parseHash } from "../../hooks/useSectionRouter";
import { SectionHeader } from "../shared/SectionHeader";
import { CategoryBanner } from "./CategoryBanner";
import { VaultSlot, pad } from "./VaultSlot";
import { VaultInspector } from "./VaultInspector";
import { ProjectDossier } from "./ProjectDossier";
import "./Vault.css";

const ALL = {
  id: "all",
  name: "All",
  label: "Full index",
  blurb: "Every file in the vault, across all four categories.",
};
const TABS = [ALL, ...categories];
const TAB_IDS = TABS.map((tab) => tab.id);
const COLUMNS = 4;

// Slots always fill whole rows of the 4-column grid (and so of the 2-column
// phone grid too); the leftovers render as empty hatched cells.
const slotsFor = (count) => Math.max(COLUMNS, Math.ceil(count / COLUMNS) * COLUMNS);

function categoryFromHash() {
  const route = parseHash(window.location.hash, ["vault"]);
  return route && TAB_IDS.includes(route.sub) ? route.sub : "all";
}

// The vault: a ruled tab row of categories, a grid of file cards on hard
// shadows, and an inspector for the selected file. Tabs are a real tablist
// (roving focus, arrow keys) and each one is also a route: #vault/robotics.
export function AIResearchVault() {
  const [category, setCategory] = useState(categoryFromHash);
  const [selectedId, setSelectedId] = useState(vaultProjects[0].id);
  const [openId, setOpenId] = useState(null);
  const repos = useRepoTelemetry(profile.githubUser);
  const withInspector = useMediaQuery("(min-width: 1100px)");
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

  const counts = useMemo(
    () =>
      Object.fromEntries(
        TABS.map((tab) => [
          tab.id,
          tab.id === "all" ? projects.length : projects.filter((p) => p.categories.includes(tab.id)).length,
        ])
      ),
    [projects]
  );

  const visible = useMemo(
    () => (category === "all" ? projects : projects.filter((p) => p.categories.includes(category))),
    [projects, category]
  );

  // Keep a valid selection when the filter drops the selected file.
  const selected = visible.find((p) => p.id === selectedId) ?? visible[0];
  const current = TABS.find((tab) => tab.id === category);
  const openIndex = visible.findIndex((p) => p.id === openId);
  const emptySlots = slotsFor(visible.length) - visible.length;

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

  const onSlot = (project) => {
    setSelectedId(project.id);
    if (!withInspector) setOpenId(project.id);
  };

  const stepDossier = useCallback(
    (direction) => {
      const at = visible.findIndex((p) => p.id === openId);
      const next = visible[(at + direction + visible.length) % visible.length].id;
      setOpenId(next);
      setSelectedId(next);
    },
    [visible, openId]
  );

  const closeDossier = useCallback(() => setOpenId(null), []);

  return (
    <section id="vault" className="section vault surface-paper" data-category={category} aria-labelledby="vault-title">
      <div className="section-inner">
        <SectionHeader
          index="01"
          kicker="Project vault"
          title="Things I've built."
          titleId="vault-title"
          aside={[
            `Vault capacity ${pad(projects.length)}/${pad(slotsFor(projects.length))}`,
            `GitHub telemetry: ${repos ? "linked" : "standby"}`,
          ]}
        >
          Projects I&apos;m proud of: robotics research, neural pipelines and the software around them. Filter the index
          by category.
        </SectionHeader>

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

        <div className="vault-body">
          <div className="vault-main">
            <p className="vault-path" aria-hidden="true">
              <span className="vault-path-prompt">operator@hmd-mainframe</span>:~/vault
              {category === "all" ? "" : `/${category}`}$ ls{" "}
              <span className="vault-path-count">
                {visible.length}/{slotsFor(visible.length)} slots
              </span>
              <span className="caret" />
              <span className="vault-path-hint">
                {withInspector ? "Select a file to inspect it" : `${isMobile ? "Tap" : "Select"} a file to open it`}
              </span>
            </p>

            <motion.ul
              id="vault-panel"
              role="tabpanel"
              aria-labelledby={`vault-tab-${category}`}
              className="vault-slots"
            >
              <AnimatePresence mode="popLayout" initial={false}>
                {visible.map((project) => (
                  <VaultSlot
                    key={project.id}
                    project={project}
                    fileNo={projects.indexOf(project) + 1}
                    category={category}
                    inspector={withInspector}
                    selected={withInspector && project.id === selected.id}
                    onSelect={() => onSlot(project)}
                  />
                ))}
              </AnimatePresence>
              {Array.from({ length: emptySlots }, (_, i) => (
                <li key={`empty-${i}`} className="vslot-cell" aria-hidden="true">
                  <span className="vslot vslot--empty">
                    <span className="vslot-empty-mark">+</span>
                  </span>
                </li>
              ))}
            </motion.ul>

            <CategoryBanner category={current} counts={counts} />
          </div>

          {withInspector && (
            <VaultInspector
              project={selected}
              fileNo={projects.indexOf(selected) + 1}
              total={projects.length}
              onExpand={() => setOpenId(selected.id)}
            />
          )}
        </div>
      </div>

      <ProjectDossier projects={visible} index={openIndex} onClose={closeDossier} onStep={stepDossier} />
    </section>
  );
}
