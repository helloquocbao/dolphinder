"use client";
import "swiper/css";
import "swiper/css/autoplay";
import "swiper/css/navigation";
import { Autoplay } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { useRef, useEffect } from "react";
import ProfileCard from "../profileCard/ProfileCard";

export const BigPeekCarousel = ({ profiles }: any) => {
  const swiperRef = useRef<any>(null);

  useEffect(() => {
    if (swiperRef.current && profiles.length > 0) {
      setTimeout(() => {
        const swiper = swiperRef.current.swiper;
        swiper.update();
        swiper.autoplay.start(); // ⚙️ ép autoplay khởi động lại
      }, 800);
    }
  }, [profiles]);

  return (
    <div className="relative w-full overflow-hidden">
      {/* 🌫 Gradient fade hai bên */}
      <div className="pointer-events-none absolute top-0 left-0 z-20 h-full w-24 bg-gradient-to-r from-black/30 via-transparent to-transparent"></div>
      <div className="pointer-events-none absolute top-0 right-0 z-20 h-full w-24 bg-gradient-to-l from-black/30 via-transparent to-transparent"></div>

      <Swiper
        ref={swiperRef}
        slidesPerView={5}
        centeredSlides
        spaceBetween={30}
        loop={true}
        grabCursor={true}
        autoplay={{
          delay: 3000,
          disableOnInteraction: false,
        }}
        speed={1000}
        observer={true}
        observeParents={true}
        modules={[Autoplay]}
        onInit={swiper => swiper.update()}
        onResize={swiper => swiper.update()}
        className="relative w-full py-10"
        breakpoints={{
          320: { slidesPerView: 1 },
          640: { slidesPerView: 2 },
          1024: { slidesPerView: 3 },
          1440: { slidesPerView: 5 },
        }}
      >
        {[...profiles, ...profiles].map((item: any) => (
          <SwiperSlide
            key={item.profileId}
            className="flex justify-center transition-all duration-300"
          >
            <div className="relative flex h-[370px] w-[280px] items-center justify-center transition-transform duration-300 ease-out hover:scale-105">
              <ProfileCard profile={item} />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};
