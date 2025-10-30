"use client";
import "swiper/css";
import { Autoplay } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import ProfileCard from "../profileCard/ProfileCard";

export const BigPeekCarousel = ({ profiles }: any) => {
  return (
    <div className="relative w-full">
      {/* 🌫 Gradient fade hai bên */}
      <div className="pointer-events-none absolute top-0 left-0 z-20 h-full w-24 bg-gradient-to-r from-black/30 via-transparent to-transparent"></div>
      <div className="pointer-events-none absolute top-0 right-0 z-20 h-full w-24 bg-gradient-to-l from-black/30 via-transparent to-transparent"></div>

      <Swiper
        slidesPerView={5}
        centeredSlides
        spaceBetween={30}
        loop
        autoplay={{
          delay: 3000,
          disableOnInteraction: false,
        }}
        speed={1000}
        modules={[Autoplay]}
        className="relative w-full py-10"
        breakpoints={{
          320: { slidesPerView: 1 },
          640: { slidesPerView: 2 },
          1024: { slidesPerView: 3 },
          1440: { slidesPerView: 5 },
        }}
      >
        {profiles.map((item: any, index: number) => (
          <SwiperSlide
            key={item.profileId}
            className="flex justify-center transition-all duration-300"
          >
            <div className="relative flex h-[320px] w-[280px] items-center justify-center transition-transform duration-300 ease-out hover:scale-105">
              <ProfileCard
                profile={{
                  projectCount: item.projectCount,
                  certificateCount: item.certificateCount,
                  profileId: item.profileId,
                  owner: item.owner,
                  name: item.name,
                  createdAt: item.createdAt,
                }}
              />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};
