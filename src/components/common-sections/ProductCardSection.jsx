import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { addToCart as reduxAddToCart, getCart, removeFromCart, updateCartQuantity } from '../../redux/slices/cartSlice';
import { allApiWithHeaderToken } from "@api/api";
import { API_CONSTANTS } from "@constants/apiurl";
import { Toast } from 'primereact/toast';
import { decodeHtml } from "@helper";

const ProductCardSection = ({ title, products, icon = "ri-shopping-bag-line", onProductClick }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector(state => state.auth);
  const reduxCart = useSelector(state => state.cart.items || []);

  const toast = useRef(null);
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartItems, setCartItems] = useState({});
  const [updatingQuantity, setUpdatingQuantity] = useState({});

  // Build local cartItems lookup from a cart array
  const updateCartItemsFromArray = (cartArray) => {
    const items = {};
    cartArray.forEach(item => {
      const key = item.weight ? `${item.product_id}_${item.weight}` : String(item.product_id);
      items[key] = { quantity: item.quantity, cart_item_id: item.cart_item_id };
      // Also index by product_variant_id for reliable per-variant lookup
      if (item.product_variant_id != null) {
        items[`variant_${item.product_variant_id}`] = { quantity: item.quantity, cart_item_id: item.cart_item_id };
      }
    });
    setCartItems(items);
  };

  const getCartItemByVariantId = (variantId) =>
    variantId != null ? cartItems[`variant_${variantId}`] : null;

  // Sync from Redux cart whenever it changes (covers initial load + updates)
  useEffect(() => {
    if (reduxCart.length > 0) {
      updateCartItemsFromArray(reduxCart);
    }
  }, [reduxCart]);

  useEffect(() => {
    const handleCartUpdate = (event) => {
      if (event.detail) {
        updateCartItemsFromArray(event.detail);
      }
    };
    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => window.removeEventListener('cartUpdated', handleCartUpdate);
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

  // Get cart item for a product (product card — allows weight fallback for single-variant)
  const getCartItem = (productId, weight) => {
    if (weight) {
      return cartItems[`${productId}_${weight}`] || cartItems[String(productId)];
    }
    return cartItems[String(productId)];
  };

  // Exact lookup for variant modal — no product-level fallback to avoid cross-variant contamination
  const getCartItemForVariant = (productId, variantId, weight) =>
    cartItems[`variant_${variantId}`] ||
    (weight ? cartItems[`${productId}_${weight}`] : null);

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
        quantity: 1,
        selected_weight: variant?.weight || null
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
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          {products.length > 8 && (
            <button
              onClick={() => navigate('/products')}
              className="text-sm font-semibold flex items-center gap-0.5"
              style={{ color: '#0c831f' }}
            >
              See all <i className="ri-arrow-right-s-line"></i>
            </button>
          )}
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-3">
          {products.map((product) => {
            // Get first variant for display
            const firstVariant = product.originalProduct?.variants?.[0];
            const hasMultipleVariants = product.originalProduct?.variants?.length > 1;

            return (
              <div
                key={product.id}
                onClick={() => handleProductClick(product)}
                className="bg-white rounded-2xl overflow-hidden cursor-pointer transition-all hover:shadow-md"
                style={{ border: '1px solid #e5e7eb' }}
              >
                {/* Image */}
                <div className="relative p-2 md:p-3" style={{ backgroundColor: '#f8f9fa' }}>
                  {product.discount > 0 && (
                    <div className="absolute top-1.5 left-1.5 text-white rounded-md font-bold z-10 text-[9px] px-1.5 py-0.5 leading-tight" style={{ backgroundColor: '#e23744' }}>
                      {product.discount}% off
                    </div>
                  )}
                  <div className="relative w-full h-16 md:h-28 flex items-center justify-center">
                    <i className={`${icon} text-3xl text-gray-200 absolute`}></i>
                    {product.image && (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="relative z-10 w-full h-full object-contain"
                        loading="lazy"
                        decoding="async"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="px-2 md:px-2.5 pt-1 pb-2 md:pb-2.5">
                  <p className="text-gray-400 text-[9px] md:text-[10px] leading-tight mb-0.5">{firstVariant?.net_weight > 0 ? `${firstVariant.net_weight} ${firstVariant.weight}` : (firstVariant?.weight || product.weight)}</p>
                  <h3 className="text-gray-900 text-[10px] md:text-xs leading-tight font-semibold line-clamp-2 min-h-[24px] md:min-h-[30px] mb-1">
                    {decodeHtml(product.name)}
                  </h3>
                  <p className="font-bold text-sm leading-tight mb-1.5">
                    ₹{product.price.toFixed(0)}
                    {product.originalPrice > product.price && (
                      <span className="text-gray-400 line-through font-normal text-[10px] ml-1">₹{product.originalPrice.toFixed(0)}</span>
                    )}
                  </p>

                  {hasMultipleVariants ? (
                    (() => {
                      const allOut = product.originalProduct?.variants?.every(v => v.in_stock === false);
                      return allOut ? (
                        <button disabled className="w-full rounded-xl py-1 md:py-1.5 text-[10px] font-bold text-gray-400 bg-gray-100 cursor-not-allowed">Out of Stock</button>
                      ) : (
                        <button onClick={(e) => handleOptionsClick(e, product)} className="w-full rounded-xl py-1 md:py-1.5 text-[10px] font-bold bg-white hover:bg-green-50 transition-colors" style={{ border: '1.5px solid #0c831f', color: '#0c831f' }}>
                          Options
                        </button>
                      );
                    })()
                  ) : (() => {
                    const availableQty = firstVariant?.available_qty ?? null;
                    const inStock = firstVariant?.in_stock !== false && availableQty !== 0;
                    const cartItem = getCartItem(product.originalProduct?.id || product.id, firstVariant?.weight || product.weight);
                    const key = `${product.originalProduct?.id || product.id}_${firstVariant?.weight || product.weight}`;
                    const isUpdating = updatingQuantity[key];

                    if (!inStock) return (
                      <button disabled className="w-full rounded-xl py-1 md:py-1.5 text-[10px] font-bold text-gray-400 bg-gray-100 cursor-not-allowed">Out of Stock</button>
                    );

                    if (cartItem) return (
                      <div className="w-full flex items-center justify-between rounded-xl py-1 px-2" style={{ border: '1.5px solid #0c831f', backgroundColor: '#f0fdf4' }}>
                        <button onClick={(e) => { e.stopPropagation(); updateQuantity(product.originalProduct?.id || product.id, firstVariant?.weight || product.weight, cartItem.quantity - 1, cartItem.cart_item_id); }} disabled={isUpdating} className="font-bold text-lg disabled:opacity-50" style={{ color: '#0c831f' }}>−</button>
                        {isUpdating
                          ? <div className="w-3 h-3 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#0c831f' }}></div>
                          : <span className="font-bold text-xs" style={{ color: '#0c831f' }}>{cartItem.quantity}</span>}
                        <button onClick={(e) => { e.stopPropagation(); updateQuantity(product.originalProduct?.id || product.id, firstVariant?.weight || product.weight, cartItem.quantity + 1, cartItem.cart_item_id); }} disabled={isUpdating || (availableQty !== null && cartItem.quantity >= availableQty)} className="font-bold text-lg disabled:opacity-50" style={{ color: '#0c831f' }}>+</button>
                      </div>
                    );

                    return (
                      <>
                        {availableQty !== null && availableQty <= 10 && availableQty > 0 && (
                          <p className="text-[9px] text-orange-500 font-medium mb-0.5 text-center">Only {availableQty} left</p>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); addToCart(product, firstVariant); }} disabled={addingToCart} className="w-full rounded-xl py-1 md:py-1.5 text-[10px] font-bold bg-white hover:bg-green-50 transition-colors disabled:opacity-50" style={{ border: '1.5px solid #0c831f', color: '#0c831f' }}>
                          + Add
                        </button>
                      </>
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
                <h3 className="text-sm md:text-lg font-bold text-gray-900">{decodeHtml(selectedProduct.name)}</h3>
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

                  const productId = selectedProduct.originalProduct?.id || selectedProduct.id;
                  // Match by product_variant_id first (most reliable), then by product+weight
                  const reduxCartItem = reduxCart.find(ci =>
                    (variant.productVariantId != null && ci.product_variant_id != null &&
                      Number(ci.product_variant_id) === Number(variant.productVariantId)) ||
                    (ci.product_id != null && String(ci.product_id) === String(productId) &&
                      ci.weight != null && ci.weight === variant.weight)
                  );
                  const cartItem = reduxCartItem
                    ? { quantity: reduxCartItem.quantity, cart_item_id: reduxCartItem.cart_item_id }
                    : null;
                  const key = `${productId}_${variant.weight}`;
                  const isUpdating = updatingQuantity[key];

                  const variantInStock = variant.in_stock !== false;
                  const variantAvailableQty = variant.available_qty ?? null;

                  return (
                    <div
                      key={variant.id}
                      className={`border rounded-lg p-3 md:p-4 transition-all ${!variantInStock ? 'border-gray-200 bg-gray-50 opacity-75' : 'border-gray-200 hover:border-green-500 hover:bg-green-50'}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 md:mb-2">
                            <span className="text-xs md:text-sm font-semibold text-gray-900">{variant.weight}</span>
                            {discount > 0 && variantInStock && (
                              <span className="text-white font-bold text-[10px] md:text-xs font-bold px-1.5 md:px-2 py-0.5 rounded">
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
                              onClick={() => updateQuantity(productId, variant.weight, cartItem.quantity - 1, cartItem.cart_item_id)}
                              disabled={isUpdating}
                              className="text-yellow-500 hover:text-yellow-600 font-bold text-base md:text-lg disabled:opacity-50"
                            >-</button>
                            <span className="text-gray-900 font-bold text-xs md:text-sm px-1 md:px-2">{cartItem.quantity}</span>
                            <button
                              onClick={() => updateQuantity(productId, variant.weight, cartItem.quantity + 1, cartItem.cart_item_id)}
                              disabled={isUpdating || (variantAvailableQty !== null && cartItem.quantity >= variantAvailableQty)}
                              className="text-yellow-500 hover:text-yellow-600 font-bold text-base md:text-lg disabled:opacity-50"
                            >+</button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addToCart(selectedProduct, variant)}
                            disabled={addingToCart}
                            className="text-white font-bold px-3 md:px-4 py-1.5 md:py-2 rounded-lg font-bold hover:bg-yellow-500 transition-colors text-xs md:text-sm disabled:opacity-50"
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
