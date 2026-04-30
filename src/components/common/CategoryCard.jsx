const CategoryCard = ({ category, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg p-3 cursor-pointer hover:shadow-lg transition-all border border-gray-100 group"
    >
      <div className="relative mb-2 overflow-hidden rounded-lg bg-gray-50">
        {category.image_url ? (
          <img
            src={category.image_url}
            alt={category.name}
            className="w-full h-24 object-cover group-hover:scale-110 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-24 flex items-center justify-center">
            <i className="ri-store-line text-3xl text-gray-300"></i>
          </div>
        )}
        {category.product_count && (
          <div className="absolute top-1 right-1 bg-yellow-400 px-2 py-0.5 rounded-full text-xs font-bold">
            +{category.product_count}
          </div>
        )}
      </div>
      <h3 className="text-xs font-medium text-gray-900 text-center line-clamp-2">
        {category.name}
      </h3>
    </div>
  );
};

export default CategoryCard;
