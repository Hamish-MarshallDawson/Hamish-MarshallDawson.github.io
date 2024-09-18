import { projectList } from "./projectdata";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/effect-coverflow";
import { EffectCoverflow } from "swiper/modules";

export const Carousel = () => {
  return (
    <section className="pageCarouselPage">
      <Swiper
        grabCursor
        centeredSlides
        slidesPerView="auto"
        effect="coverflow"
        loop
        coverflowEffect={{
          rotate: 50,
          stretch: 0,
          depth: 100,
          modifier: 1,
          slideShadows: true,
        }}
        modules={[EffectCoverflow]}
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
                <p>{project.description}</p>
              </div>
            </SwiperSlide>
          ))}
        </div>
      </Swiper>
    </section>
  );
};
