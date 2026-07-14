import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllCategories } from '../../redux/slices/productSlice';
import Header from '@common/Header';
import Footer from '@common/Footer';
import { decodeHtml } from "@helper";

const TILE_COLORS = ['#fef9c3','#dcfce7','#dbeafe','#fce7f3','#ede9fe','#ffedd5','#d1fae5','#fef3c7','#e0f2fe','#f3e8ff'];

const AllCategoriesPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { categories, productsLoaded } = useSelector((state) => state.products);

  useEffect(() => {
    if (!productsLoaded) {
      dispatch(fetchAllCategories());
    }
  }, [dispatch, productsLoaded]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="pt-[160px] md:pt-20 pb-20 md:pb-8">
        <div className="p-4 md:p-6 mt-4 w-full max-w-screen-xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <i className="ri-arrow-left-line text-xl text-gray-700"></i>
            </button>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">All Categories</h1>
          </div>

          {categories.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <i className="ri-apps-line text-5xl mb-3"></i>
              <p className="text-sm">No categories found</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-10 gap-3">
              {categories.map((category, idx) => {
                const categoryName = category.name || category.category?.name;
                const categoryId = category.id || category.category?.id;
                const imageUrl = category.image_url || category.category?.image_url;
                return (
                  <div
                    key={categoryId || categoryName}
                    onClick={() => navigate(`/category?id=${categoryId}`)}
                    className="flex flex-col items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <div
                      className="w-full aspect-square rounded-2xl flex items-center justify-center overflow-hidden"
                      style={{ backgroundColor: TILE_COLORS[idx % TILE_COLORS.length] }}
                    >
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={categoryName}
                          className="w-3/4 h-3/4 object-contain"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <i className={`${category.icon || 'ri-restaurant-line'} text-2xl text-gray-600`}></i>
                      )}
                    </div>
                    <span className="text-[10px] md:text-xs font-semibold text-gray-700 text-center leading-tight">
                      {decodeHtml(categoryName)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer data={[]} />
    </div>
  );
};

export default AllCategoriesPage;
