const ProductGridCard = ({ product, onClick }) => {
  const imageUrl = product.image_url || product.thumbnail_url || product.image || '';
  const price = product.discounted_price || product.price || 0;
  const actualPrice = product.actual_price || product.price || price;
  const discount = actualPrice > price ? Math.round(((actualPrice - price) / actualPrice) * 100) : 0;

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-all border border-gray-100 group"
    >
      <div className="relative">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-32 bg-gray-100 flex items-center justify-center">
            <i className="ri-image-line text-3xl text-gray-300"></i>
          </div>
        )}
        {discount > 0 && (
          <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
            {discount}% Off
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="text-xs font-medium text-gray-900 mb-2 line-clamp-2 h-8">
          {product.name}
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-bold text-gray-900">₹{price}</div>
            {actualPrice > price && (
              <div className="text-xs text-gray-500 line-through">₹{actualPrice}</div>
            )}
          </div>
          <button className="bg-yellow-400 hover:bg-yellow-500 px-3 py-1 rounded text-xs font-medium transition-colors">
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductGridCard;
