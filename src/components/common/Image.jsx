import { useState } from 'react';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';

// Tiny 1x1 gray placeholder as base64
const BLUR_PLACEHOLDER = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNmM2Y0ZjYiLz48L3N2Zz4=';

const Image = ({ alt, height, src, width, className, onClick, loading = "lazy", placeholderSrc }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
  };

  return (
    <div className="relative h-full w-full overflow-hidden bg-gray-100">
      {/* Blur placeholder - shown immediately */}
      {!isLoaded && (
        <div 
          className="absolute inset-0 bg-cover bg-center blur-sm animate-pulse"
          style={{
            backgroundImage: `url(${placeholderSrc || BLUR_PLACEHOLDER})`,
            filter: 'blur(10px)',
            transform: 'scale(1.1)'
          }}
        />
      )}
      
      {/* Actual image */}
      <LazyLoadImage
        alt={alt}
        height={height}
        src={src}
        width={width}
        onClick={onClick}
        afterLoad={handleLoad}
        onError={handleError}
        loading={loading}
        threshold={100}
        className={`${className} relative z-10 transition-opacity duration-500 ease-in-out ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          objectFit: 'cover',
          imageRendering: 'auto'
        }}
      />
      
      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400 z-20">
          <i className="ri-image-line text-2xl" />
        </div>
      )}
    </div>
  );
};

export default Image;