import React from "react";

export default function ProjectCard({ project }) {
  // projectdata.js uses `githubLink`; GitHub-derived entries use `url`.
  const link = project.url || project.githubLink;

  return (
    <article className="project-card">
      <div
        className="project-card-thumb"
        style={{
          backgroundImage: project.img ? `url(${project.img})` : undefined,
        }}
      />

      <div className="project-card-body">
        {project.category && (
          <span className="project-card-eyebrow">{project.category}</span>
        )}
        <h3>{project.name}</h3>
        <p>{project.shortDescription || project.description}</p>
        <div className="project-card-meta">
          {project.timeline && <span>{project.timeline}</span>}
          {project.language && <span>{project.language}</span>}
          {project.stars !== undefined && <span>⭐ {project.stars}</span>}
        </div>
        {link && (
          <div className="project-card-cta">
            <a href={link} target="_blank" rel="noopener noreferrer">
              View on GitHub
            </a>
          </div>
        )}
      </div>
    </article>
  );
}
