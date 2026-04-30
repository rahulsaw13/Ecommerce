import { useNavigate } from 'react-router-dom';

const ProductGridSection = ({ title, products, onProductClick, mobileColumns = 3 }) => {
  const navigate = useNavigate();

  // Determine grid classes based on mobileColumns
  const gridClasses = mobileColumns === 4 
    ? "grid grid-cols-4 md:grid-cols-8 gap-2 md:gap-3"
    : "grid grid-cols-3 md:grid-cols-8 gap-2 md:gap-3";

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        <button
          onClick={() => navigate('/products')}
          className="text-sm text-yellow-600 hover:text-yellow-700 font-medium"
        >
          View All
        </button>
      </div>
      <div className={gridClasses}>
        {products.slice(0, 8).map((product) => {
          const imageUrl = product.image_url || product.thumbnail_url || '';
          return (
            <div
              key={product.id}
              onClick={() => onProductClick(product)}
              className="cursor-pointer hover:opacity-80 transition-all"
            >
              <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-lg p-2 md:p-3 mb-1 md:mb-2 h-20 md:h-28 flex items-center justify-center">
                {imageUrl ? (
                  <img 
                    src={imageUrl} 
                    alt={product.name} 
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <i className="ri-restaurant-line text-2xl md:text-4xl text-gray-300"></i>
                  </div>
                )}
              </div>
              <h3 className="text-[10px] md:text-xs font-bold md:font-medium text-gray-900 text-center line-clamp-2 leading-tight">{product.name}</h3>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default ProductGridSection;
