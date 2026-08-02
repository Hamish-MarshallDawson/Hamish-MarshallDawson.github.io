import { useState, useEffect } from "react";
import { fetchUserRepos, formatRepoData } from "../services/githubAPI";
import { carouselProjects } from "./projectdata";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/effect-coverflow";
import { EffectCoverflow, Navigation, Pagination } from "swiper/modules";

export const Carousel = () => {
  const [projects, setProjects] = useState(carouselProjects);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadRepos = async () => {
      try {
        const data = await fetchUserRepos("Hamish-MarshallDawson");
        const byName = new Map(
          data.map(formatRepoData).map((repo) => [repo.name.toLowerCase(), repo])
        );

        // Curated order wins; live GitHub stats fill in where the repo is public.
        const merged = carouselProjects.map((project) => {
          const live = byName.get(project.repo.toLowerCase());
          if (!live) return project;
          return {
            ...project,
            url: project.url || live.url,
            language: project.language || live.language,
            stars: live.stars,
            forks: live.forks,
          };
        });

        if (!cancelled) setProjects(merged);
      } catch (err) {
        console.error("Failed to load GitHub repos:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadRepos();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="pageCarouselPage">
        <div className="carousel-loading">
          <div className="loading-spinner"></div>
          <p>Loading project details…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pageCarouselPage">
      <Swiper
        className="projectSwiper"
        modules={[EffectCoverflow, Navigation, Pagination]}
        effect="coverflow"
        grabCursor={true}
        centeredSlides={true}
        slidesPerView={1.1}
        spaceBetween={16}
        navigation={true}
        pagination={{ clickable: true }}
        coverflowEffect={{
          rotate: 0,
          stretch: 0,
          depth: 120,
          modifier: 1.6,
          slideShadows: false,
        }}
        breakpoints={{
          640: { slidesPerView: 1.6, spaceBetween: 20 },
          1024: { slidesPerView: 2.2, spaceBetween: 24 },
        }}
      >
        {projects.map((project) => (
          <SwiperSlide key={project.repo} className="projectSlide">
            <div
              className="swiperSlideMedia"
              style={{ background: project.accent }}
            />
            <div className="swiperSlideContent">
              <span className="project-card-eyebrow">{project.category}</span>
              <h3>{project.name}</h3>
              <p>{project.description}</p>
              <div className="project-card-meta">
                {project.language && <span>{project.language}</span>}
                {project.stars !== undefined && <span>⭐ {project.stars}</span>}
                {project.forks !== undefined && <span>⑂ {project.forks}</span>}
              </div>
              {project.url && (
                <a
                  className="detail-link"
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View on GitHub
                </a>
              )}
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};
