import { useState, useEffect } from "react";
import { fetchUserRepos, formatRepoData } from "../services/githubAPI";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/effect-coverflow";
import { EffectCoverflow, Navigation, Pagination } from "swiper/modules";
import { register } from "swiper/element/bundle";
import { isMobile } from "react-device-detect";

register();

export const Carousel = () => {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // 'all', 'original', 'forks'

  useEffect(() => {
    const loadRepos = async () => {
      try {
        setLoading(true);
        const data = await fetchUserRepos("Hamish-MarshallDawson");
        const formattedRepos = data.map(formatRepoData);
        setRepos(formattedRepos);
      } catch (err) {
        console.error("Failed to load GitHub repos:", err);
      } finally {
        setLoading(false);
      }
    };

    loadRepos();
  }, []);

  // Filter repos based on selection
  const filteredRepos = repos.filter((repo) => {
    if (filter === "original") return !repo.isFork;
    if (filter === "forks") return repo.isFork;
    return true; // 'all'
  });

  if (loading) {
    return (
      <section className="pageCarouselPage">
        <div className="carousel-loading">
          <div className="loading-spinner"></div>
          <p>Loading projects from GitHub...</p>
        </div>
      </section>
    );
  }

  if (repos.length === 0) {
    return (
      <section className="pageCarouselPage">
        <p>No projects found.</p>
      </section>
    );
  }

  return (
    <section className="pageCarouselPage">
      {/* Filter Dropdown */}
      <div className="carousel-filter-container">
        <label htmlFor="project-filter" className="filter-label">
          Show:
        </label>
        <select
          id="project-filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="project-filter-dropdown"
        >
          <option value="all">All Projects ({repos.length})</option>
          <option value="original">
            My Projects ({repos.filter((r) => !r.isFork).length})
          </option>
          <option value="forks">
            Forked Projects ({repos.filter((r) => r.isFork).length})
          </option>
        </select>
      </div>

      <Swiper
        pagination={{ clickable: true }}
        grabCursor={true}
        centeredSlides={true}
        slidesPerView="auto"
        effect="coverflow"
        loop={filteredRepos.length > 1}
        navigation={!isMobile}
        coverflowEffect={{
          rotate: 50,
          stretch: 0,
          depth: 100,
          modifier: 1,
        }}
        modules={[EffectCoverflow, Navigation, Pagination]}
      >
        <div className="swiperWrapper">
          {filteredRepos.map((project) => (
            <SwiperSlide
              key={project.id}
              style={{
                backgroundImage: project.img
                  ? `url(${project.img})`
                  : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              }}
            >
              <div className="swiperSlideContent">
                <h3>
                  {project.name}
                  {project.isFork && (
                    <span className="fork-badge-carousel">Fork</span>
                  )}
                </h3>
                <a href={project.url} target="_blank" rel="noopener noreferrer">
                  <p>{project.description}</p>
                </a>
                {project.language && (
                  <p className="project-language">
                    <span className="language-dot"></span>
                    {project.language}
                  </p>
                )}
                <div className="project-stats">
                  <span>⭐ {project.stars}</span>
                  <span>🔱 {project.forks}</span>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </div>
      </Swiper>
    </section>
  );
};
