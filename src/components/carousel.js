import { projectList } from "./projectdata";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/effect-coverflow";
import { EffectCoverflow, Navigation, Pagination } from "swiper/modules"; // Add Navigation and Pagination modules
import { register } from "swiper/element/bundle";
import { isMobile } from "react-device-detect";
import { useEffect } from "react";

register();

export const Carousel = () => {
  useEffect(() => {
    console.log("Is Mobile: ", isMobile); // Logs true/false based on device
  }, []);

  return (
    <section className="pageCarouselPage">
      <Swiper
        pagination={{ clickable: true }} // Pagination needs an object to enable clicking
        grabCursor={true}
        centeredSlides={true}
        slidesPerView="auto"
        effect="coverflow"
        loop={true}
        navigation={!isMobile}
        coverflowEffect={{
          rotate: 50,
          stretch: 0,
          depth: 100,
          modifier: 1,
          // slideShadows: true,
        }}
        modules={[EffectCoverflow, Navigation, Pagination]}
      >
        <div className="swiperWrapper">
          {projectList.map((project) => (
            <SwiperSlide
              key={project.name}
              style={{
                backgroundImage: `url(${project.img})`,
              }}
            >
              <div className="swiperSlideContent">
                <h3>{project.name}</h3>
                <a
                  href={project.githubLink}
                  target={project.description}
                  rel="noopener noreferrer"
                >
                  <p>{project.description}</p>
                </a>
              </div>
            </SwiperSlide>
          ))}
        </div>
      </Swiper>
    </section>
  );
};
