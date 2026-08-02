import React, { useEffect } from "react";
import "./App.css";
import Header from "./components/Header";
import { Carousel } from "./components/carousel";
import ProjectCard from "./components/ProjectCard";
import { projectList, projectSections } from "./components/projectdata";

function Title() {
  useEffect(() => {
    const favicon = document.querySelector("link[rel~='icon']");

    if (favicon) {
      favicon.href = "/src/assets/favicon.ico";
    }
    document.title = "Hamish Marshall Dawson";
  }, []);

  return null;
}

function Home() {
  const featuredProjects = projectList.filter((project) => project.featured);

  return (
    <div className="page">
      <div className="mainBody">
        <div className="headerSection">
          <Title />
          <span className="section-eyebrow">AI engineering portfolio</span>
          <div className="textColourAnimation">
            <h1>Hamish Marshall Dawson</h1>
          </div>
          <p className="hero-intro">
            Robotics, HRI, and local AI systems built with a research mindset.
          </p>
          <Header />
        </div>
        <section className="portfolio-section">
          <div className="stacked-intro">
            <span className="section-eyebrow">Selected work</span>
            <h2 className="section-title">Research-led projects with real engineering depth.</h2>
            <p className="section-copy">
              The focus here is on projects that show experimentation, ownership,
              and technical judgement: embodied AI, robotics research, and
              practical deployment under resource constraints.
            </p>
          </div>
          <div className="project-grid">
            {featuredProjects.map((project) => (
              <ProjectCard key={project.name} project={project} />
            ))}
          </div>
        </section>

        <section className="portfolio-section portfolio-split">
          <div>
            <span className="section-eyebrow">Context</span>
            <h2 className="section-title">What this work says about me.</h2>
          </div>
          <div className="stacked-notes">
            {projectSections.map((section) => (
              <article key={section.label} className="note-card">
                <span className="project-card-eyebrow">{section.label}</span>
                <h3>{section.title}</h3>
                <p>{section.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="portfolio-section">
          <div className="experience-callout">
            <span className="section-eyebrow">Placement</span>
            <h2 className="section-title">STMicroelectronics</h2>
            <p className="section-copy">
              2.5 months into a placement focused on local AI pipelines for fault
              detection, exploring VLMs with LoRA, CLIP clustering, and VRAM-constrained
              experimentation.
            </p>
            <a href="#experience" className="detail-link">
              Read the placement summary
            </a>
          </div>
        </section>

        <section className="portfolio-section">
          <div className="stacked-intro">
            <span className="section-eyebrow">In focus</span>
            <h2 className="section-title">The four projects I'd point you to first.</h2>
            <p className="section-copy">
              My dissertation, TensorRoom, the Lothian bus display, and Iteration
              Inc — the work that best shows where my engineering is heading.
            </p>
          </div>
          <Carousel />
        </section>
      </div>
    </div>
  );
}

function App() {
  return <Home />;
}

export default App;
