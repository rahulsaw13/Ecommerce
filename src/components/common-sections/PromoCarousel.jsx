import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';

const PromoCarousel = ({ images }) => {
  // Only use dynamic images if provided
  const promos = images && images.length > 0 
    ? images.map((img, index) => ({
        id: img.id || index,
        image: img.url || img.image_url
      }))
    : [];

  // Don't render if no images
  if (!promos || promos.length === 0) {
    return null;
  }

  return (
    <section className="mb-6">
      <Swiper
        modules={[Autoplay, Pagination]}
        spaceBetween={16}
        slidesPerView={3}
        pagination={{ clickable: true }}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
        }}
        loop={promos.length > 1}
        breakpoints={{
          320: { slidesPerView: 1 },
          640: { slidesPerView: 2 },
          1024: { slidesPerView: 3 },
        }}
      >
        {promos.map((promo) => (
          <SwiperSlide key={promo.id}>
            <div className="rounded-xl overflow-hidden shadow-lg">
              <img 
                src={promo.image} 
                alt={`Promo ${promo.id}`} 
                className="w-full h-48 object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      <style jsx>{`
        .swiper-pagination-bullet {
          background: #FFC107;
          opacity: 0.5;
        }
        .swiper-pagination-bullet-active {
          background: #FFC107;
          opacity: 1;
        }
      `}</style>
    </section>
  );
};

export default PromoCarousel;
