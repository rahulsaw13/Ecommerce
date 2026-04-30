import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';

const CarouselSection = ({ images }) => {
  if (!images || images.length === 0) {
    return null;
  }

  return (
    <section className="mb-6">
      <Swiper
        modules={[Pagination, Autoplay]}
        spaceBetween={0}
        slidesPerView={1}
        pagination={{ clickable: true }}
        autoplay={{
          delay: 3000,
          disableOnInteraction: false,
        }}
        loop={images.length > 1}
        className="rounded-2xl overflow-hidden shadow-lg"
      >
        {images.map((image, index) => (
          <SwiperSlide key={image.id || index}>
            <div className="relative w-full h-[400px] bg-gray-100">
              <img
                src={image.url}
                alt={`Carousel ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      <style jsx>{`
        .swiper-pagination-bullet {
          background: white;
          opacity: 0.5;
        }
        .swiper-pagination-bullet-active {
          background: white;
          opacity: 1;
        }
      `}</style>
    </section>
  );
};

export default CarouselSection;
