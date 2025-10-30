import "swiper/css";
import { Autoplay } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import ProfileCard from "../profileCard/ProfileCard";

export const BigPeekCarousel = ({ profiles }: any) => {
  return (
    <Swiper
      slidesPerView={3} // ✅ Hiển thị 3 item một lần
      centeredSlides={true} // ✅ Căn giữa slide hiện tại
      spaceBetween={40} // ✅ Khoảng cách giữa các card
      loop={true}
      autoplay={{
        delay: 3000,
        disableOnInteraction: false,
      }}
      speed={1000}
      modules={[Autoplay]}
      className="w-full py-10" // ✅ Thêm khoảng padding để thoáng hơn
      breakpoints={{
        320: { slidesPerView: 1 }, // Mobile: 1 card
        768: { slidesPerView: 2 }, // Tablet: 2 card
        1024: { slidesPerView: 3 }, // Desktop: 3 card
      }}
    >
      {profiles.map((item: any) => (
        <SwiperSlide
          key={item.profileId}
          className="flex justify-center transition-transform duration-300 hover:scale-105"
        >
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
        </SwiperSlide>
      ))}
    </Swiper>
  );
};
