import { Skeleton } from 'primereact/skeleton';

// Product Card Skeleton
export const ProductCardSkeleton = () => (
  <div className="bg-white rounded-lg border border-gray-100 overflow-hidden w-36 sm:w-40">
    <Skeleton width="100%" height="8rem" />
    <div className="p-1.5 sm:p-2">
      <Skeleton width="100%" height="1rem" className="mb-2" />
      <Skeleton width="60%" height="0.75rem" className="mb-1" />
      <Skeleton width="40%" height="0.75rem" />
    </div>
  </div>
);

// Category Skeleton
export const CategorySkeleton = () => (
  <div className="flex flex-col items-center min-w-[70px] sm:min-w-[80px]">
    <Skeleton shape="circle" size="3rem" className="mb-2" />
    <Skeleton width="60px" height="0.75rem" />
  </div>
);

// Subcategory Skeleton
export const SubcategorySkeleton = () => (
  <div className="flex-shrink-0 w-28 sm:w-32">
    <Skeleton width="100%" height="7rem" className="rounded-lg mb-2" />
    <Skeleton width="80%" height="0.75rem" />
  </div>
);

// Product Grid Skeleton
export const ProductGridSkeleton = ({ count = 12 }) => (
  <div className="px-2 sm:px-4 py-4">
    <Skeleton width="200px" height="1.5rem" className="mb-4" />
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  </div>
);

// Home Section Skeleton
export const HomeSectionSkeleton = () => (
  <div className="px-2 sm:px-4 py-4">
    <Skeleton width="200px" height="1.5rem" className="mb-4" />
    <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2">
      {Array.from({ length: 6 }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  </div>
);

// Categories Row Skeleton
export const CategoriesRowSkeleton = () => (
  <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
    <div className="flex gap-4 px-4 py-3 overflow-x-auto">
      {Array.from({ length: 8 }).map((_, index) => (
        <CategorySkeleton key={index} />
      ))}
    </div>
  </div>
);

// Subcategories Carousel Skeleton
export const SubcategoriesCarouselSkeleton = () => (
  <div className="px-2 sm:px-4 py-3">
    <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2">
      {Array.from({ length: 6 }).map((_, index) => (
        <SubcategorySkeleton key={index} />
      ))}
    </div>
  </div>
);

// Full Page Skeleton
export const HomePageSkeleton = () => (
  <div className="min-h-screen bg-gray-50">
    {/* Header Skeleton */}
    <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="px-4 py-3">
        <Skeleton width="100%" height="2.5rem" />
      </div>
    </div>

    {/* Categories Skeleton */}
    <CategoriesRowSkeleton />

    {/* Subcategories Skeleton */}
    <SubcategoriesCarouselSkeleton />

    {/* Home Sections Skeleton */}
    <HomeSectionSkeleton />
    <HomeSectionSkeleton />
    <HomeSectionSkeleton />
  </div>
);
