import { useState, useEffect } from 'react';

const BannerSlider = ({ banners = [] }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const defaultBanners = [
    {
      id: 1,
      image: 'https://via.placeholder.com/1200x300/FFD700/000000?text=Sale+20%+Off',
      title: 'Big Sale',
      subtitle: 'Up to 20% Off'
    },
    {
      id: 2,
      image: 'https://via.placeholder.com/1200x300/FF6B6B/FFFFFF?text=Fresh+Products',
      title: 'Fresh Products',
      subtitle: 'Daily Fresh Delivery'
    }
  ];

  const slides = banners.length > 0 ? banners : defaultBanners;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <div className="relative w-full h-48 md:h-64 bg-gray-100 rounded-lg overflow-hidden">
      {slides.map((banner, index) => (
        <div
          key={banner.id}
          className={`absolute inset-0 transition-opacity duration-500 ${
            index === currentSlide ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <img
            src={banner.image}
            alt={banner.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent flex items-center">
            <div className="text-white px-8">
              <h2 className="text-3xl md:text-4xl font-bold mb-2">{banner.title}</h2>
              <p className="text-lg md:text-xl">{banner.subtitle}</p>
            </div>
          </div>
        </div>
      ))}
      
      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentSlide ? 'bg-white w-6' : 'bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default BannerSlider;
