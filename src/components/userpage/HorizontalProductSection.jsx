import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import { useState, useEffect } from 'react';
import 'swiper/css';
import 'swiper/css/navigation';
import CollectionCard from '../common/HorizontalProductCard';

// Utility function to fix image URLs
const fixImageUrl = (url) => {
  if (!url) return url;
  // Return the URL as-is since it's already correct from the backend
  return url;
};

const CollectionSection = ({ 
  sectionData,
  homeSections = [],
  onProductClick,
  onMoreItemsClick,
  isCategoryTab = false // Flag to indicate if this is from category tab (not All tab)
}) => {
  // Use dynamic data from homeSections if available, otherwise use static sectionData
  const getSectionData = () => {
    if (homeSections && homeSections.length > 0) {
      const saleSection = homeSections[0]; // Use first sale section
      return {
        categoryLabel: saleSection.title?.toUpperCase() || "COFFEE LOVERS",
        title: saleSection.description?.split(' ').slice(0, 2).join(' ') || "Dive into the",
        subtitle: saleSection.description?.split(' ').slice(2).join(' ') || "world of fresh brew",
        backgroundColor: saleSection.background_color,
        textColor: saleSection.color,
        products: saleSection.products ? saleSection.products.map(product => ({
          id: product.id,
          name: product.name,
          originalPrice: product.price || 0,
          discountedPrice: product.discounted_price || product.price || 0,
          volume: product.weight || "1 piece",
          type: product.category || "Product",
          rating: 4.0,
          reviews: 50,
          image: product.image ? fixImageUrl(product.image) : "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=200&h=200&fit=crop",
          isVeg: true,
          variants: []
        })) : [],
        moreItemsText: "More Items"
      };
    }
    
    // Fallback to sectionData if provided
    if (sectionData) {
      return {
        categoryLabel: sectionData.categoryLabel || "PRODUCTS",
        title: sectionData.title || "Explore",
        subtitle: sectionData.subtitle || "",
        backgroundColor: sectionData.backgroundColor,
        textColor: sectionData.textColor,
        products: (sectionData.products || []).map(product => ({
          id: product.id,
          name: product.name,
          originalPrice: product.originalPrice || product.price || 0,
          discountedPrice: product.discountedPrice || product.discounted_price || product.price || 0,
          volume: product.volume || product.weight || "1 piece",
          type: product.type || product.category || "Product",
          rating: product.rating || 4.0,
          reviews: product.reviews || 50,
          image: product.image ? fixImageUrl(product.image) : "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=200&h=200&fit=crop",
          isVeg: product.isVeg !== undefined ? product.isVeg : true,
          variants: product.variants || []
        })),
        moreItemsText: sectionData.moreItemsText || "More Items"
      };
    }
    
    // Return null if no data found
    return null;
  };

  const [swiperInstance, setSwiperInstance] = useState(null);
  const [isBeginning, setIsBeginning] = useState(true);
  const [isEnd, setIsEnd] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  const dynamicSectionData = getSectionData();
  
  // If no section data, don't render anything
  if (!dynamicSectionData) {
    return null;
  }

  const {
    categoryLabel,
    title,
    subtitle,
    products,
    moreItemsText = "More Items",
    backgroundColor,
    textColor
  } = dynamicSectionData;

  const handleNext = () => {
    if (swiperInstance) {
      swiperInstance.slideNext();
    }
  };

  const handlePrev = () => {
    if (swiperInstance) {
      swiperInstance.slidePrev();
    }
  };

  const updateNavigation = (swiper) => {
    setIsBeginning(swiper.isBeginning);
    setIsEnd(swiper.isEnd);
  };

  return (
    <div 
      className="mx-2 sm:mx-4 md:mx-8 my-3 sm:my-4 md:my-8 rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6"
      style={{
        backgroundColor: backgroundColor || '#f5ebe0',
        color: textColor || '#000000'
      }}
    >
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">
        {/* Left Section - Label, Title, Button */}
        <div className="flex-shrink-0 w-full md:w-56">
          <div 
            className="text-xs font-medium mb-3 tracking-[0.2em] uppercase"
            style={{ color: textColor ? `${textColor}80` : '#a67c52' }}
          >
            {categoryLabel}
          </div>
          <h2 
            className="text-xl md:text-3xl font-bold leading-tight mb-0"
            style={{ color: textColor || '#8b5a3c' }}
          >
            {title}
          </h2>
          {subtitle && (
            <h2 
              className={isCategoryTab 
                ? "text-xs font-medium mb-3 tracking-[0.2em] uppercase" 
                : "text-xl md:text-3xl font-bold leading-tight mb-4 md:mb-6"}
              style={{ 
                color: isCategoryTab 
                  ? (textColor ? `${textColor}80` : '#a67c52')
                  : (textColor || '#8b5a3c')
              }}
            >
              {subtitle}
            </h2>
          )}
          <button 
            onClick={onMoreItemsClick}
            className="hidden md:flex px-4 md:px-5 py-2 md:py-2.5 rounded-lg font-medium transition-colors duration-200 items-center gap-2 text-xs md:text-sm"
            style={{
              backgroundColor: textColor || '#8b5a3c',
              color: backgroundColor || '#ffffff'
            }}
          >
            {moreItemsText}
            <span className="text-base md:text-lg">›</span>
          </button>
        </div>

        {/* Products Swiper */}
        <div className="flex-1 relative overflow-hidden w-full" style={{ minHeight: isMobile ? '200px' : '300px' }}>
          <Swiper
            onSwiper={(swiper) => {
              setSwiperInstance(swiper);
              updateNavigation(swiper);
            }}
            onSlideChange={(swiper) => updateNavigation(swiper)}
            modules={[Navigation]}
            spaceBetween={isMobile ? 6 : 12}
            slidesPerView={'auto'}
            allowTouchMove={true}
            className="collection-swiper"
          >
            {products.map((product) => (
              <SwiperSlide key={product.id} style={{ width: 'auto' }}>
                <div 
                  onClick={() => onProductClick && onProductClick(product)}
                  className="cursor-pointer"
                >
                  <CollectionCard
                    product={product}
                  />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Left navigation arrow */}
          {!isBeginning && (
            <button
              onClick={handlePrev}
              type="button"
              aria-label="Previous"
              className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50 transition-colors"
            >
              <i className="ri-arrow-left-s-line text-gray-600 text-lg"></i>
            </button>
          )}

          {/* Right navigation arrow */}
          {!isEnd && (
            <button
              onClick={handleNext}
              type="button"
              aria-label="Next"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50 transition-colors"
            >
              <i className="ri-arrow-right-s-line text-gray-600 text-lg"></i>
            </button>
          )}
        </div>
      </div>

      <style>{`
        .collection-swiper {
          width: 100%;
          height: 100%;
        }
        .collection-swiper .swiper-wrapper {
          display: flex;
          align-items: stretch;
        }
        .collection-swiper .swiper-slide {
          width: auto !important;
          height: 100%;
          display: flex;
        }
        .collection-swiper .swiper-slide > div {
          height: 100%;
          width: 100%;
        }
      `}</style>
    </div>
  );
};

export default CollectionSection;
