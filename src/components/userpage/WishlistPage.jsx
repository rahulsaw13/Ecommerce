import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@common/Header';
import Footer from '@common/Footer';
import useWishlistStore from '../../useWishlistStore';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart as reduxAddToCart, getCart } from '../../redux/slices/cartSlice';
import { decodeHtml } from '@helper';

const WishlistPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector(state => state.auth);
  const { items, removeFromWishlist } = useWishlistStore();
  const [addingToCart, setAddingToCart] = useState({});
  const [successMsg, setSuccessMsg] = useState({});

  const handleAddToCart = async (item) => {
    if (!isAuthenticated) {
      navigate('/sign-in');
      return;
    }

    const key = `${item.id}_${item.weight}`;
    setAddingToCart(prev => ({ ...prev, [key]: true }));

    try {
      const userDetails = JSON.parse(localStorage.getItem('userDetails') || '{}');
      const userId = userDetails?.id || user?.id || user?.user?.id;

      await dispatch(reduxAddToCart({
        user_id: userId,
        product_variant_id: item.productVariantId,
        quantity: 1,
        selected_weight: item.weight || null,
      })).unwrap();

      await dispatch(getCart()).unwrap();

      setSuccessMsg(prev => ({ ...prev, [key]: true }));
      setTimeout(() => setSuccessMsg(prev => ({ ...prev, [key]: false })), 2000);
    } catch (e) {
      // silently ignore
    } finally {
      setAddingToCart(prev => ({ ...prev, [key]: false }));
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center px-4 pb-24 pt-36">
          <div className="w-24 h-24 rounded-full bg-red-50 flex items-center justify-center mb-4">
            <i className="ri-heart-line text-5xl text-red-300"></i>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Your wishlist is empty</h2>
          <p className="text-sm text-gray-500 mb-6 text-center">
            Save items you love by tapping the heart icon on any product.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2.5 rounded-xl font-semibold text-white text-sm"
            style={{ backgroundColor: '#0c831f' }}
          >
            Start Shopping
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1 pt-32 pb-28 px-3 md:px-6 max-w-4xl mx-auto w-full">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-bold text-gray-900">
            My Wishlist <span className="text-gray-400 font-normal text-sm">({items.length})</span>
          </h1>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {items.map((item) => {
            const key = `${item.id}_${item.weight}`;
            return (
              <div
                key={key}
                className="bg-white rounded-2xl overflow-hidden"
                style={{ border: '1px solid #e5e7eb' }}
              >
                {/* Image */}
                <div className="relative p-3" style={{ backgroundColor: '#f8f9fa' }}>
                  {item.discount > 0 && (
                    <div className="absolute top-1.5 left-1.5 text-white rounded-md font-bold z-10 text-[9px] px-1.5 py-0.5 leading-tight" style={{ backgroundColor: '#e23744' }}>
                      {item.discount}% off
                    </div>
                  )}
                  {/* Remove button */}
                  <button
                    onClick={() => removeFromWishlist(item.id, item.weight)}
                    className="absolute top-1.5 right-1.5 z-10 w-6 h-6 flex items-center justify-center rounded-full bg-white shadow-sm"
                    title="Remove from wishlist"
                  >
                    <i className="ri-heart-fill text-red-500 text-sm"></i>
                  </button>
                  <div className="w-full h-24 flex items-center justify-center">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-contain"
                        loading="lazy"
                        decoding="async"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : (
                      <i className="ri-shopping-bag-line text-3xl text-gray-200"></i>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="px-2.5 pt-1.5 pb-2.5">
                  <p className="text-gray-400 text-[9px] leading-tight mb-0.5">{item.weight}</p>
                  <h3 className="text-gray-900 text-[11px] leading-tight font-semibold line-clamp-2 min-h-[28px] mb-1">
                    {decodeHtml(item.name)}
                  </h3>
                  <p className="font-bold text-sm leading-tight mb-2">
                    ₹{(item.price || 0).toFixed(0)}
                    {item.originalPrice > item.price && (
                      <span className="text-gray-400 line-through font-normal text-[10px] ml-1">₹{(item.originalPrice || 0).toFixed(0)}</span>
                    )}
                  </p>

                  {item.in_stock === false ? (
                    <button disabled className="w-full rounded-xl py-1.5 text-[10px] font-bold text-gray-400 bg-gray-100 cursor-not-allowed">
                      Out of Stock
                    </button>
                  ) : successMsg[key] ? (
                    <button disabled className="w-full rounded-xl py-1.5 text-[10px] font-bold text-white" style={{ backgroundColor: '#0c831f' }}>
                      ✓ Added
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAddToCart(item)}
                      disabled={addingToCart[key]}
                      className="w-full rounded-xl py-1.5 text-[10px] font-bold bg-white hover:bg-green-50 transition-colors disabled:opacity-50"
                      style={{ border: '1.5px solid #0c831f', color: '#0c831f' }}
                    >
                      {addingToCart[key] ? '...' : '+ Add to Cart'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default WishlistPage;
