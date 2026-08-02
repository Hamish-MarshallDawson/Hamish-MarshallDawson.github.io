import { useState, useEffect, useRef } from "react";
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
  const swiperRef = useRef(null);

  // Swiper picks up the new breakpoint on resize but does not always re-lay out
  // the slides, leaving them at the previous width. Force it.
  useEffect(() => {
    const onResize = () => {
      if (swiperRef.current) swiperRef.current.update();
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, []);

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
          const live = project.repo && byName.get(project.repo.toLowerCase());
          if (!live) return project;
          // Tags and copy are curated; GitHub only supplies the repo link.
          return { ...project, url: project.url || live.url };
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
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
        }}
        modules={[EffectCoverflow, Navigation, Pagination]}
        effect="coverflow"
        grabCursor={true}
        centeredSlides={true}
        observer={true}
        observeParents={true}
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
          <SwiperSlide key={project.id} className="projectSlide">
            <div
              className="swiperSlideMedia"
              style={{
                backgroundImage: project.image
                  ? `url(${project.image}), ${project.accent}`
                  : project.accent,
              }}
            />
            <div className="swiperSlideContent">
              <span className="project-card-eyebrow">{project.category}</span>
              <h3>{project.name}</h3>
              <p>{project.description}</p>
              <div className="project-card-meta">
                {(project.tags || []).map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
              <div className="slide-links">
                {project.url && (
                  <a
                    className="detail-link"
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {project.url.includes("github.com") ? "GitHub" : "Visit"}
                  </a>
                )}
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};
