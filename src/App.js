import React, { useEffect } from "react";
import "./App.css";
import Header from "./components/Header";
import { Carousel } from "./components/carousel";
import { experience, extracurricular } from "./components/projectdata";

function Title() {
  useEffect(() => {
    document.title = "Hamish Marshall Dawson";
  }, []);

  return null;
}

function Home() {
  return (
    <div className="page">
      <div className="mainBody">
        <header className="headerSection">
          <Title />
          <span className="section-eyebrow">Software engineering · AI</span>
          <div className="textColourAnimation">
            <h1>Hamish Marshall Dawson</h1>
          </div>
          <p className="hero-intro">
            Final-year MEng student at Heriot-Watt, currently building AI
            pipelines at STMicroelectronics. Mostly robotics, perception, and
            getting models to run on hardware that shouldn't fit them.
          </p>
          <Header />
        </header>

        <section className="portfolio-section">
          <div className="stacked-intro">
            <span className="section-eyebrow">Work</span>
            <h2 className="section-title">Things I've built.</h2>
          </div>
          <Carousel />
        </section>

        <section className="portfolio-section">
          <div className="stacked-intro">
            <span className="section-eyebrow">Experience</span>
            <h2 className="section-title">Where I've worked.</h2>
          </div>
          <div className="stacked-notes">
            {experience.map((job) => (
              <article key={job.org} className="experience-item">
                <div className="experience-head">
                  <h3>{job.role}</h3>
                  <span className="experience-period">{job.period}</span>
                </div>
                <span className="project-card-eyebrow">
                  {job.org} · {job.location}
                </span>
                <ul>
                  {job.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="portfolio-section">
          <div className="stacked-intro">
            <span className="section-eyebrow">Outside the code</span>
            <h2 className="section-title">The rest of it.</h2>
          </div>
          <div className="extra-grid">
            {extracurricular.map((item) => (
              <article key={item.role} className="note-card extra-card">
                <div
                  className="extra-card-media"
                  style={{
                    backgroundImage: `url(${item.image}), linear-gradient(135deg, rgba(224,152,145,0.3), rgba(116,156,117,0.22))`,
                  }}
                />
                <div className="extra-card-body">
                  <span className="project-card-eyebrow">{item.period}</span>
                  <h3>{item.role}</h3>
                  <p className="extra-card-org">{item.org}</p>
                  <p>{item.description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function App() {
  return <Home />;
}

export default App;
