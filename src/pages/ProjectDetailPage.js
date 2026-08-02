import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { projectList } from "../components/projectdata";
import { fetchUserRepos, fetchRepoLanguages } from "../services/githubAPI";

function slugify(name) {
  return name
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export default function ProjectDetailPage() {
  const { slug } = useParams();
  const [project, setProject] = useState(null);
  const [languages, setLanguages] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const local = projectList.find((p) => slugify(p.name) === slug);
    if (local) {
      setProject(local);
      setLoading(false);
      return;
    }

    // Otherwise try fetching from GitHub by repo name match
    const loadFromGitHub = async () => {
      try {
        setLoading(true);
        const repos = await fetchUserRepos("Hamish-MarshallDawson");
        const matched = repos.find(
          (r) => slugify(r.name) === slug || slugify(r.full_name) === slug
        );
        if (matched) {
          const formatted = {
            id: matched.id,
            name: matched.name,
            description: matched.description,
            url: matched.html_url,
            homepage: matched.homepage,
            stars: matched.stargazers_count,
            forks: matched.forks_count,
            language: matched.language,
          };
          setProject(formatted);
          const langs = await fetchRepoLanguages(
            "Hamish-MarshallDawson",
            matched.name
          );
          setLanguages(langs);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadFromGitHub();
  }, [slug]);

  if (loading) return <div className="pageCarouselPage">Loading...</div>;
  if (!project)
    return (
      <div className="pageCarouselPage">
        <p>Project not found.</p>
        <Link to="/">Back to home</Link>
      </div>
    );

  return (
    <section className="pageCarouselPage">
      <Link to="/" className="detail-link" style={{ marginBottom: 8 }}>
        Back to home
      </Link>
      <div className="project-detail-hero">
        {project.category && <span className="project-detail-eyebrow">{project.category}</span>}
        <h2>{project.name}</h2>
        {project.shortDescription && <p className="project-detail-summary">{project.shortDescription}</p>}
      </div>

      {project.img && (
        <div className="project-detail-imageWrap">
          <img className="project-detail-image" src={project.img} alt={project.alt || project.name} />
        </div>
      )}

      {project.description && <p className="project-detail-copy">{project.description}</p>}

      {(project.highlights || project.outcomes || project.stack) && (
        <div className="project-detail-grid">
          {project.highlights && (
            <div>
              <h4>Highlights</h4>
              <ul>
                {project.highlights.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}
          {project.outcomes && (
            <div>
              <h4>Outcomes</h4>
              <ul>
                {project.outcomes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}
          {project.stack && (
            <div>
              <h4>Stack</h4>
              <ul className="project-stack-list">
                {project.stack.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="project-detail-meta">
        {project.timeline && <div>Timeline: {project.timeline}</div>}
        {project.language && <div>Primary: {project.language}</div>}
        {project.stars !== undefined && <div>⭐ {project.stars}</div>}
        {project.forks !== undefined && <div>Forks: {project.forks}</div>}
      </div>

      {Object.keys(languages).length > 0 && (
        <div className="project-languages">
          <h4>Language breakdown</h4>
          <ul>
            {Object.entries(languages).map(([lang, bytes]) => (
              <li key={lang}>
                {lang}: {bytes}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ marginTop: 20 }}>
        {project.url && (
          <a href={project.url} target="_blank" rel="noopener noreferrer">
            Open on GitHub
          </a>
        )}
      </div>
    </section>
  );
}
