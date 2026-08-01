import React from "react";

function slugify(name) {
  return name
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export default function ProjectCard({ project }) {
  const slug = slugify(project.name);

  return (
    <article className="project-card">
      <div
        className="project-card-thumb"
        style={{
          backgroundImage: project.img ? `url(${project.img})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      <div className="project-card-body">
        {project.category && <span className="project-card-eyebrow">{project.category}</span>}
        <h3>{project.name}</h3>
        <p>{project.shortDescription || project.description}</p>
        <div className="project-card-meta">
          {project.timeline && <span>{project.timeline}</span>}
          {project.language && <span>{project.language}</span>}
          {project.stars !== undefined && <span>⭐ {project.stars}</span>}
        </div>
        <div className="project-card-cta">
          {project.url && (
            <a href={project.url} target="_blank" rel="noopener noreferrer">
              View on GitHub
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
