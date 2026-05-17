import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { addToCart as reduxAddToCart, getCart, removeFromCart, updateCartQuantity } from '../../redux/slices/cartSlice';
import { allApiWithHeaderToken } from "@api/api";
import { API_CONSTANTS } from "@constants/apiurl";
import { Toast } from 'primereact/toast';

const ProductCardSection = ({ title, products, icon = "ri-shopping-bag-line", onProductClick }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector(state => state.auth);
  
  const toast = useRef(null);
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartItems, setCartItems] = useState({});
  const [updatingQuantity, setUpdatingQuantity] = useState({});

  // Update local cart items from cart array
  const updateCartItemsFromArray = (cartArray) => {
    const items = {};
    cartArray.forEach(item => {
      const key = `${item.id}_${item.weight}`;
      items[key] = {
        quantity: item.quantity,
        cart_item_id: item.cart_item_id
      };
    });
    setCartItems(items);
  };

  useEffect(() => {
    // Listen for cart updates from the store
    const handleCartUpdate = (event) => {
      if (event.detail) {
        updateCartItemsFromArray(event.detail);
      }
    };

    window.addEventListener('cartUpdated', handleCartUpdate);

    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, []);

  const handleProductClick = (product) => {
    if (onProductClick) {
      onProductClick(product);
    }
  };

  const handleOptionsClick = (e, product) => {
    e.stopPropagation();
    setSelectedProduct(product);
    setShowVariantModal(true);
  };

  const closeModal = () => {
    setShowVariantModal(false);
    setSelectedProduct(null);
  };

  // Get cart item for a product
  const getCartItem = (productId, weight) => {
    const key = `${productId}_${weight}`;
    return cartItems[key];
  };

  // Update quantity in cart
  const updateQuantity = async (productId, weight, newQuantity, cartItemId) => {
    const key = `${productId}_${weight}`;
    setUpdatingQuantity(prev => ({ ...prev, [key]: true }));

    try {
      if (newQuantity === 0) {
        // Remove item from cart
        await dispatch(removeFromCart({ cartItemId })).unwrap();
        toast.current?.show({
          severity: 'info',
          summary: 'Removed from Cart',
          detail: 'Item has been removed from your cart',
          life: 2000,
        });
      } else {
        // Update quantity
        await dispatch(updateCartQuantity({ cartItemId, productId, weight, quantity: newQuantity })).unwrap();
      }

      // Refresh cart
      const result = await dispatch(getCart()).unwrap();
      const updatedItems = result?.data?.items || result?.items || [];
      window.dispatchEvent(new CustomEvent('cartUpdated', { detail: updatedItems }));
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to update quantity',
        life: 3000,
      });
    } finally {
      setUpdatingQuantity(prev => ({ ...prev, [key]: false }));
    }
  };

  // Add to cart function
  const addToCart = async (product, variant = null) => {
    // Check if user is logged in
    if (!isAuthenticated) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Authentication Required',
        detail: 'Please sign in to add items to your cart',
        life: 4000,
      });
      setTimeout(() => {
        navigate('/sign-in');
      }, 1500);
      return;
    }

    setAddingToCart(true);

    try {
      const userDetails = JSON.parse(localStorage.getItem('userDetails') || '{}');
      const userId = userDetails?.id || user?.id || user?.user?.id;
      const variantId = variant?.productVariantId;

      // Use Redux action
      await dispatch(reduxAddToCart({
        user_id: userId,
        product_variant_id: variantId,
        quantity: 1
      })).unwrap();

      // Refresh cart items from API by dispatching getCart
      const cartResponse = await dispatch(getCart()).unwrap();
      window.dispatchEvent(new CustomEvent('cartUpdated', { detail: cartResponse.data?.items || cartResponse.items || cartResponse || [] }));
        
      // Close modal if open
      if (showVariantModal) {
        closeModal();
      }
      
      toast.current?.show({
        severity: 'success',
        summary: 'Added to Cart',
        detail: 'Item successfully added to your cart',
        life: 2000,
      });
    } catch (error) {
      const errorMessage = typeof error === 'string' ? error : error?.message || 'Failed to add item to cart';
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: errorMessage,
        life: 3000,
      });
    } finally {
      setAddingToCart(false);
    }
  };

  return (
    <>
      <Toast ref={toast} position="top-right" />
      <section className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          {products.length > 8 && (
            <button
              onClick={() => navigate('/products')}
              className="text-sm text-yellow-600 hover:text-yellow-700 font-medium"
            >
              View All
            </button>
          )}
        </div>
        <div className="grid grid-cols-3 md:grid-cols-8 gap-2 md:gap-3">
          {products.map((product) => {
            // Get first variant for display
            const firstVariant = product.originalProduct?.variants?.[0];
            const hasMultipleVariants = product.originalProduct?.variants?.length > 1;

            return (
              <div
                key={product.id}
                onClick={() => handleProductClick(product)}
                className="bg-white rounded-xl overflow-hidden cursor-pointer hover:shadow-xl transition-all"
                style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
              >
                <div className="relative pt-2 md:pt-4 px-2 md:px-3 pb-2 md:pb-3">
                  {product.discount > 0 && (
                    <div 
                      className="absolute top-2 md:top-3 left-2 md:left-3 bg-yellow-400 text-gray-900 rounded-full font-bold z-10 md:!text-[10px] md:!px-[10px] md:!py-[4px]"
                      style={{ 
                        padding: '2px 6px',
                        fontSize: '8px',
                        lineHeight: '1.2'
                      }}
                    >
                      {product.discount}% Off
                    </div>
                  )}
                  {product.image ? (
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className="w-full h-16 md:h-[120px] object-contain"
                    />
                  ) : (
                    <div className="w-full h-16 md:h-[120px] flex items-center justify-center">
                      <i className={`${icon} text-2xl md:text-4xl text-gray-200`}></i>
                    </div>
                  )}
                </div>
                <div className="px-2 md:px-3 pb-2 md:pb-3">
                  <h3 
                    className="text-gray-800 mb-1 md:mb-1.5 line-clamp-2 text-[10px] md:text-xs leading-tight md:leading-[1.3] font-bold md:font-medium min-h-[24px] md:min-h-[32px]"
                  >
                    {product.name}
                  </h3>
                  <div 
                    className="text-gray-500 mb-1 md:mb-2 text-[9px] md:text-[10px] leading-tight"
                  >
                    {firstVariant?.weight || product.weight}
                  </div>
                  <div className="mb-1 md:mb-2">
                    <div 
                      className="text-gray-900 font-bold text-sm md:text-base leading-tight mb-0.5"
                    >
                      ₹{product.price.toFixed(2)}
                    </div>
                    {product.originalPrice > product.price && (
                      <div 
                        className="text-gray-400 line-through text-[10px] md:text-xs leading-tight"
                      >
                        ₹{product.originalPrice.toFixed(2)}
                      </div>
                    )}
                  </div>
                  {hasMultipleVariants ? (
                    (() => {
                      const allOutOfStock = product.originalProduct?.variants?.every(v => v.in_stock === false);
                      return allOutOfStock ? (
                        <button disabled className="w-full bg-gray-100 text-gray-400 rounded-lg font-bold border-2 border-gray-200 py-1 md:py-2 text-[11px] md:text-sm cursor-not-allowed">
                          Out of Stock
                        </button>
                      ) : (
                        <button
                          onClick={(e) => handleOptionsClick(e, product)}
                          disabled={addingToCart}
                          className="w-full bg-white text-yellow-500 rounded-lg font-bold hover:bg-yellow-50 transition-colors disabled:opacity-50 border-2 border-yellow-400 py-1 md:py-2 text-[11px] md:text-sm"
                        >
                          Options
                        </button>
                      );
                    })()
                  ) : (() => {
                    const inStock = firstVariant?.in_stock !== false;
                    const availableQty = firstVariant?.available_qty ?? null;
                    const cartItem = getCartItem(product.originalProduct?.id || product.id, firstVariant?.weight || product.weight);
                    const key = `${product.originalProduct?.id || product.id}_${firstVariant?.weight || product.weight}`;
                    const isUpdating = updatingQuantity[key];

                    if (!inStock) {
                      return (
                        <button disabled className="w-full bg-gray-100 text-gray-400 rounded-lg font-bold border-2 border-gray-200 py-1 md:py-2 text-[11px] md:text-sm cursor-not-allowed">
                          Out of Stock
                        </button>
                      );
                    }

                    if (cartItem) {
                      return (
                        <div className="w-full flex items-center justify-between bg-white rounded-lg border-2 border-yellow-400 py-0.5 md:py-1 px-1 md:px-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); updateQuantity(product.originalProduct?.id || product.id, firstVariant?.weight || product.weight, cartItem.quantity - 1, cartItem.cart_item_id); }}
                            disabled={isUpdating}
                            className="text-yellow-500 hover:text-yellow-600 font-bold text-base md:text-lg disabled:opacity-50"
                          >−</button>
                          <span className="text-gray-900 font-bold text-[11px] md:text-sm px-1 md:px-3">{cartItem.quantity}</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); updateQuantity(product.originalProduct?.id || product.id, firstVariant?.weight || product.weight, cartItem.quantity + 1, cartItem.cart_item_id); }}
                            disabled={isUpdating || (availableQty !== null && cartItem.quantity >= availableQty)}
                            className="text-yellow-500 hover:text-yellow-600 font-bold text-base md:text-lg disabled:opacity-50"
                          >+</button>
                        </div>
                      );
                    }

                    return (
                      <div>
                        {availableQty !== null && availableQty <= 10 && availableQty > 0 && (
                          <p className="text-[9px] md:text-[10px] text-orange-500 font-medium mb-0.5 text-center">
                            Only {availableQty} left
                          </p>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); addToCart(product, firstVariant); }}
                          disabled={addingToCart}
                          className="w-full bg-white text-yellow-500 rounded-lg font-bold hover:bg-yellow-50 transition-colors disabled:opacity-50 border-2 border-yellow-400 py-1 md:py-2 text-[11px] md:text-sm"
                        >
                          Add
                        </button>
                      </div>
                    );
                  })()}
                </div>
              </div>
            );
          })}
        </div>

        {/* Variant Options Modal */}
        {showVariantModal && selectedProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={closeModal}>
            <div className="bg-white rounded-xl p-4 md:p-6 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <h3 className="text-sm md:text-lg font-bold text-gray-900">{selectedProduct.name}</h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <i className="ri-close-line text-xl md:text-2xl"></i>
                </button>
              </div>

              <div className="space-y-2 md:space-y-3">
                {selectedProduct.originalProduct?.variants?.map((variant) => {
                  // Handle both API field name formats
                  const mrp = variant.actualPrice || variant.mrp || 0;
                  const sellingPrice = variant.discountedPrice || variant.selling_price || variant.price || 0;
                  const discount = mrp && sellingPrice && mrp > sellingPrice
                    ? Math.round(((mrp - sellingPrice) / mrp) * 100)
                    : 0;
                  
                  const cartItem = getCartItem(selectedProduct.originalProduct?.id || selectedProduct.id, variant.weight);
                  const key = `${selectedProduct.originalProduct?.id || selectedProduct.id}_${variant.weight}`;
                  const isUpdating = updatingQuantity[key];

                  const variantInStock = variant.in_stock !== false;
                  const variantAvailableQty = variant.available_qty ?? null;

                  return (
                    <div
                      key={variant.id}
                      className={`border rounded-lg p-3 md:p-4 transition-all ${!variantInStock ? 'border-gray-200 bg-gray-50 opacity-75' : 'border-gray-200 hover:border-yellow-400 hover:bg-yellow-50'}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 md:mb-2">
                            <span className="text-xs md:text-sm font-semibold text-gray-900">{variant.weight}</span>
                            {discount > 0 && variantInStock && (
                              <span className="bg-yellow-400 text-gray-900 text-[10px] md:text-xs font-bold px-1.5 md:px-2 py-0.5 rounded">
                                {discount}% OFF
                              </span>
                            )}
                            {!variantInStock && (
                              <span className="bg-gray-200 text-gray-500 text-[10px] md:text-xs font-bold px-1.5 md:px-2 py-0.5 rounded">
                                Out of Stock
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm md:text-lg font-bold text-gray-900">
                              ₹{(sellingPrice || 0).toFixed(2)}
                            </span>
                            {mrp && mrp > sellingPrice && (
                              <span className="text-xs md:text-sm text-gray-400 line-through">
                                ₹{mrp.toFixed(2)}
                              </span>
                            )}
                          </div>
                          {variantInStock && variantAvailableQty !== null && variantAvailableQty <= 10 && (
                            <p className="text-[10px] text-orange-500 font-medium mt-0.5">Only {variantAvailableQty} left</p>
                          )}
                        </div>

                        {!variantInStock ? (
                          <button disabled className="bg-gray-200 text-gray-400 px-3 md:px-4 py-1.5 md:py-2 rounded-lg font-bold text-xs md:text-sm cursor-not-allowed">
                            Out of Stock
                          </button>
                        ) : cartItem ? (
                          <div className="flex items-center gap-1 md:gap-2 bg-white rounded-lg border-2 border-yellow-400 px-2 md:px-3 py-1">
                            <button
                              onClick={() => updateQuantity(selectedProduct.originalProduct?.id || selectedProduct.id, variant.weight, cartItem.quantity - 1, cartItem.cart_item_id)}
                              disabled={isUpdating}
                              className="text-yellow-500 hover:text-yellow-600 font-bold text-base md:text-lg disabled:opacity-50"
                            >−</button>
                            <span className="text-gray-900 font-bold text-xs md:text-sm px-1 md:px-2">{cartItem.quantity}</span>
                            <button
                              onClick={() => updateQuantity(selectedProduct.originalProduct?.id || selectedProduct.id, variant.weight, cartItem.quantity + 1, cartItem.cart_item_id)}
                              disabled={isUpdating || (variantAvailableQty !== null && cartItem.quantity >= variantAvailableQty)}
                              className="text-yellow-500 hover:text-yellow-600 font-bold text-base md:text-lg disabled:opacity-50"
                            >+</button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addToCart(selectedProduct, variant)}
                            disabled={addingToCart}
                            className="bg-yellow-400 text-gray-900 px-3 md:px-4 py-1.5 md:py-2 rounded-lg font-bold hover:bg-yellow-500 transition-colors text-xs md:text-sm disabled:opacity-50"
                          >
                            Add
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </section>
    </>
  );
};

export default ProductCardSection;
