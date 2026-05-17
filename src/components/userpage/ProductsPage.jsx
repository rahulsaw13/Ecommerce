import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import Header from '@common/Header';
import Footer from '@common/Footer';
import UserLoader from '@userpage-pages/UserLoader';
import { allApi, allApiWithHeaderToken } from "@api/api";
import { API_CONSTANTS } from "@constants/apiurl";
import { getCart } from '../../redux/slices/cartSlice';

const ProductsPage = () => {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [cartItems, setCartItems] = useState({});
  const [cartItemIds, setCartItemIds] = useState({});
  const [addingToCart, setAddingToCart] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    fetchProducts();
    fetchCartItems();
  }, []);

  useEffect(() => {
    // Listen for cart updates
    const handleCartUpdate = () => {
      fetchCartItems();
    };
    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => window.removeEventListener('cartUpdated', handleCartUpdate);
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const userDetails = JSON.parse(localStorage.getItem('userDetails'));
      const body = { user_id: userDetails?.id };
      const response = await allApi.get(API_CONSTANTS.ALL_PRODUCTS_URL);
      
      if (response?.status === 200) {
        setProducts(response?.data?.products || response?.data || []);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCartItems = async () => {
    try {
      const userDetails = JSON.parse(localStorage.getItem('userDetails'));
      if (!userDetails?.id) return;

      const result = await dispatch(getCart()).unwrap();
      const items = result?.data?.items || result?.items || [];
      const cartMap = {};
      const idMap = {};
      items.forEach(item => {
        const productId = item.product_id;
        const weight = item.weight;
        const cartKey = weight ? `${productId}_${weight}` : productId;
        cartMap[cartKey] = item.quantity;
        idMap[cartKey] = item.cart_item_id;
      });
      setCartItems(cartMap);
      setCartItemIds(idMap);
    } catch (error) {
      console.error("Error fetching cart items:", error);
    }
  };

  const updateCartQuantity = async (productId, newQuantity) => {
    try {
      const userDetails = JSON.parse(localStorage.getItem('userDetails'));
      const cartItemId = cartItemIds[productId];

      if (newQuantity === 0 && cartItemId) {
        await allApiWithHeaderToken(API_CONSTANTS.CART_REMOVE_URL, {
          user_id: userDetails?.id,
          cart_item_id: cartItemId
        }, "post");
        fetchCartItems();
        window.dispatchEvent(new Event('cartUpdated'));
        return;
      }

      if (!cartItemId) return;

      const response = await allApiWithHeaderToken(API_CONSTANTS.CART_UPDATE_QUANTITY_URL, {
        cart_item_id: cartItemId,
        user_id: userDetails?.id,
        quantity: newQuantity
      }, "put");

      if (response?.status === 200) {
        fetchCartItems();
        window.dispatchEvent(new Event('cartUpdated'));
      }
    } catch (error) {
      console.error("Error updating cart quantity:", error);
    }
  };

  const addToCart = async (product, variant) => {
    if (addingToCart) return;
    
    try {
      setAddingToCart(true);
      const userDetails = JSON.parse(localStorage.getItem('userDetails'));
      
      if (!userDetails?.id) {
        navigate('/sign-in');
        return;
      }

      const sellingPrice = variant.discountedPrice || variant.selling_price || variant.price || 0;
      const mrp = variant.actualPrice || variant.mrp || sellingPrice;

      const body = {
        user_id: userDetails?.id,
        product_variant_id: variant.productVariantId,
        quantity: 1,
      };

      const response = await allApiWithHeaderToken(API_CONSTANTS.CART_ADD_URL, body, "post");
      
      if (response?.status === 200 || response?.status === 201) {
        await fetchCartItems();
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
    } finally {
      setAddingToCart(false);
    }
  };

  const handleProductClick = (product, variant) => {
    if (product.variants && product.variants.length > 1) {
      // Navigate to product detail page for multiple variants
      const slug = product.slug || product.name?.toLowerCase().replace(/\s+/g, '-');
      navigate(`/product/${slug}`, { state: product });
    } else if (variant) {
      // Add single variant to cart
      addToCart(product, variant);
    }
  };

  if (loading) {
    return <UserLoader />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="pt-[160px] md:pt-[100px] px-4 py-8 pb-20 md:pb-8">
        <div className="max-w-[1320px] mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">All Products</h1>
          
          {products.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <i className="ri-inbox-line text-6xl text-gray-300 mb-4"></i>
              <h3 className="text-lg font-medium text-gray-600 mb-2">No Products Found</h3>
              <p className="text-base text-gray-500">Check back later for new products</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
              {products.map((product) => {
                const variants = product.variants || product.product_variants || [];
                const firstVariant = variants[0];
                
                if (!firstVariant) return null;
                
                const mrp = parseFloat(firstVariant?.actualPrice || firstVariant?.mrp || 0);
                const sellingPrice = parseFloat(firstVariant?.discountedPrice || firstVariant?.selling_price || firstVariant?.price || 0);
                
                const discount = mrp > sellingPrice && sellingPrice > 0
                  ? Math.round(((mrp - sellingPrice) / mrp) * 100)
                  : 0;

                return (
                  <div key={product.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-100">
                    {/* Product Image */}
                    <div className="relative pt-2 md:pt-4 px-2 md:px-3 pb-2 md:pb-3">
                      {discount > 0 && (
                        <div 
                          className="absolute top-2 md:top-3 left-2 md:left-3 bg-yellow-400 text-gray-900 rounded-full font-bold z-10"
                          style={{ 
                            padding: '2px 6px',
                            fontSize: '8px',
                            lineHeight: '1.2'
                          }}
                        >
                          {discount}% Off
                        </div>
                      )}
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-16 md:h-[120px] object-contain cursor-pointer"
                          onClick={() => {
                            const slug = product.slug || product.name?.toLowerCase().replace(/\s+/g, '-');
                            navigate(`/product/${slug}`, { state: product });
                          }}
                        />
                      ) : (
                        <div className="w-full h-16 md:h-[120px] flex items-center justify-center bg-gray-100 rounded">
                          <i className="ri-image-line text-2xl md:text-4xl text-gray-300"></i>
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="px-2 md:px-3 pb-2 md:pb-3">
                      <h3 className="text-gray-800 mb-1 md:mb-1.5 line-clamp-2 text-[10px] md:text-xs leading-tight md:leading-[1.3] font-bold md:font-medium min-h-[24px] md:min-h-[32px]">
                        {product.name}
                      </h3>
                      
                      {firstVariant?.weight && (
                        <div className="text-gray-500 mb-1 md:mb-2 text-[9px] md:text-[10px] leading-tight">
                          {firstVariant.weight}
                        </div>
                      )}

                      <div className="mb-1 md:mb-2">
                        {sellingPrice > 0 ? (
                          <>
                            <div className="text-gray-900 font-bold text-sm md:text-base leading-tight mb-0.5">
                              ₹{sellingPrice.toFixed(2)}
                            </div>
                            {mrp > sellingPrice && (
                              <div className="text-gray-400 line-through text-[10px] md:text-xs leading-tight">
                                ₹{mrp.toFixed(2)}
                              </div>
                            )}
                          </>
                        ) : mrp > 0 ? (
                          <div className="text-gray-900 font-bold text-sm md:text-base leading-tight">
                            ₹{mrp.toFixed(2)}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-500">Price not available</div>
                        )}
                      </div>

                      {/* Add Button or Quantity Controls */}
                      {(() => {
                        const inStock = firstVariant?.in_stock !== false;
                        const allOutOfStock = variants.length > 1 && variants.every(v => v.in_stock === false);
                        if (!inStock || allOutOfStock) {
                          return (
                            <button disabled className="w-full bg-gray-100 text-gray-400 rounded-lg font-bold border-2 border-gray-200 py-1 md:py-2 text-[11px] md:text-sm cursor-not-allowed">
                              Out of Stock
                            </button>
                          );
                        }
                        if (variants.length > 1) {
                          return (
                            <button
                              onClick={() => handleProductClick(product, firstVariant)}
                              className="w-full bg-white text-yellow-500 rounded-lg font-bold hover:bg-yellow-50 transition-colors border-2 border-yellow-400 py-1 md:py-2 text-[11px] md:text-sm"
                            >
                              Options
                            </button>
                          );
                        }
                        if (cartItems[firstVariant?.product_id]) {
                          return (
                            <div className="w-full flex items-center justify-between bg-white rounded-lg border-2 border-yellow-400 py-0.5 md:py-1 px-1 md:px-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const newQty = cartItems[firstVariant.product_id] - 1;
                                  updateCartQuantity(firstVariant.product_id, newQty > 0 ? newQty : 0);
                                }}
                                className="text-yellow-500 hover:text-yellow-600 font-bold text-base md:text-lg"
                              >
                                −
                              </button>
                              <span className="text-gray-900 font-bold text-[11px] md:text-sm px-1 md:px-3">
                                {cartItems[firstVariant.product_id]}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateCartQuantity(firstVariant.product_id, cartItems[firstVariant.product_id] + 1);
                                }}
                                className="text-yellow-500 hover:text-yellow-600 font-bold text-base md:text-lg"
                              >
                                +
                              </button>
                            </div>
                          );
                        }
                        return (
                          <button
                            onClick={() => handleProductClick(product, firstVariant)}
                            className="w-full bg-white text-yellow-500 rounded-lg font-bold hover:bg-yellow-50 transition-colors border-2 border-yellow-400 py-1 md:py-2 text-[11px] md:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={!sellingPrice}
                          >
                            Add
                          </button>
                        );
                      })()}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <Footer data={[]} />
    </div>
  );
};

export default ProductsPage;
