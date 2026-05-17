import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart as reduxAddToCart, updateCartQuantity as reduxUpdateQuantity, removeFromCart as reduxRemoveFromCart, getCart } from '../../redux/slices/cartSlice';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const CollectionCard = ({ product }) => {
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [showOptionsPopup, setShowOptionsPopup] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [addingToCart, setAddingToCart] = useState(false);

  // Support variants provided as `options` or `variants`
  const optionsArray = Array.isArray(product.options) && product.options.length > 0
    ? product.options
    : Array.isArray(product.variants) && product.variants.length > 0
      ? product.variants
      : [];

  const hasOptions = optionsArray.length > 0;

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector(state => state.auth);
  const cart = useSelector(state => state.cart?.items || []);

  // Determine weight identifier used in cart store (use weight or volume fallback)
  const weight = product.weight || product.volume || 'default';

  // Check if item is in cart and get quantity
  useEffect(() => {
    const cartItem = cart.find(item => item.id === product.id && item.weight === weight);
    if (cartItem && cartItem.quantity > 0) {
      setIsAdded(true);
      setQuantity(cartItem.quantity);
    } else {
      setIsAdded(false);
      setQuantity(1);
    }
  }, [cart, product.id, weight]);

  const handleAddToCart = async (e) => {
    e && e.stopPropagation(); // Prevent navigation

    if (!isAuthenticated) {
      toast.error('Please sign in to add items to your cart');
      setTimeout(() => {
        navigate('/sign-in');
      }, 1500);
      return;
    }

    if (hasOptions && !isAdded) {
      // Open options modal instead of directly adding
      setShowOptionsPopup(true);
      // default select first variant
      setSelectedVariant(optionsArray[0]);
      return;
    }

    if (!isAdded && !addingToCart) {
      setAddingToCart(true);
      try {
        console.log('handleAddToCart: Adding product', product.name);
        const userDetails = JSON.parse(localStorage.getItem('userDetails') || '{}');
        const userId = userDetails?.id;
        const variantId = optionsArray[0]?.productVariantId || optionsArray[0]?.id || product?.productVariantId;
        if (!userId || !variantId) {
          toast.error(!userId ? 'Please sign in first' : 'Product variant not found');
          return;
        }
        // Add to cart via Redux
        await dispatch(reduxAddToCart({
          user_id: userId,
          product_variant_id: variantId,
          quantity: 1
        })).unwrap();

        // Refresh cart
        const cartResponse = await dispatch(getCart()).unwrap();
        window.dispatchEvent(new CustomEvent('cartUpdated', { detail: cartResponse.data?.items || cartResponse.items || cartResponse || [] }));
        
        setIsAdded(true);
        toast.success(`${product.name} added to cart`);
        console.log('handleAddToCart: Successfully added');
      } catch (error) {
        console.error('handleAddToCart: Error adding to cart:', error);
        toast.error(typeof error === 'string' ? error : error?.message || 'Failed to add to cart');
      } finally {
        setAddingToCart(false);
      }
    }
  };

  const handleOptionSelect = (option) => {
    // select variant without closing modal
    setSelectedVariant(option);
  };

  const confirmVariantAndAdd = async (e) => {
    e && e.stopPropagation();
    e && e.preventDefault();
    
    if (!isAuthenticated) {
      toast.error('Please sign in to add items to your cart');
      setTimeout(() => {
        navigate('/sign-in');
      }, 1500);
      return;
    }

    if (!selectedVariant || addingToCart) {
      return;
    }

    setAddingToCart(true);
    try {
      const userDetails = JSON.parse(localStorage.getItem('userDetails') || '{}');
      const userId = userDetails?.id;
      const variantId = selectedVariant?.productVariantId || selectedVariant?.id;
      if (!userId || !variantId) {
        toast.error(!userId ? 'Please sign in first' : 'Variant not found');
        return;
      }
      // Add to cart via Redux
      await dispatch(reduxAddToCart({
        user_id: userId,
        product_variant_id: variantId,
        quantity: 1
      })).unwrap();
      
      // Refresh cart
      const cartResponse = await dispatch(getCart()).unwrap();
      window.dispatchEvent(new CustomEvent('cartUpdated', { detail: cartResponse.data?.items || cartResponse.items || cartResponse || [] }));
      
      setIsAdded(true);
      setShowOptionsPopup(false);
      setSelectedVariant(null);
      toast.success(`${product.name} added to cart`);
    } catch (error) {
      console.error('confirmVariantAndAdd: Error adding variant to cart:', error);
      toast.error(typeof error === 'string' ? error : error?.message || 'Failed to add to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleQuantityChange = async (change, e) => {
    e && e.stopPropagation();
    if (!isAdded || addingToCart) return;

    if (!isAuthenticated) {
      toast.error('Please sign in to update your cart');
      setTimeout(() => {
        navigate('/sign-in');
      }, 1500);
      return;
    }

    setAddingToCart(true);
    try {
      const cartItem = cart.find(item => item.product_id === product.id && item.weight === weight);
      if (!cartItem) return;

      if (change === 'increase') {
        await dispatch(reduxUpdateQuantity({ productId: product.id, weight, quantity: cartItem.quantity + 1 })).unwrap();
      } else if (change === 'decrease') {
        if (cartItem.quantity > 1) {
          await dispatch(reduxUpdateQuantity({ productId: product.id, weight, quantity: cartItem.quantity - 1 })).unwrap();
        } else {
          await dispatch(reduxRemoveFromCart({ cartItemId: cartItem.id })).unwrap();
          setIsAdded(false);
        }
      }
      
      // Refresh cart
      const cartResponse = await dispatch(getCart()).unwrap();
      window.dispatchEvent(new CustomEvent('cartUpdated', { detail: cartResponse.data?.items || cartResponse.items || cartResponse || [] }));
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast.error(typeof error === 'string' ? error : error?.message || 'Failed to update quantity');
    } finally {
      setAddingToCart(false);
    }
  };

  // Compute save amount safely
  const original = Number(product.originalPrice) || 0;
  const discounted = Number(product.discountedPrice) || 0;
  const saveAmt = original > discounted ? original - discounted : 0;

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden w-28 sm:w-36 md:w-40 lg:w-44 flex-shrink-0 border border-gray-100 p-[2px] sm:p-[3px] flex flex-col h-full" style={{ transform: 'scale(1)' }}>
      {/* Image area: make square */}
      <div className="relative bg-white flex items-center justify-center w-full flex-shrink-0" style={{ paddingTop: '100%' }}>
        <img
          src={product.thumbnail_url || product.image}
          alt={product.name}
          className="absolute top-0 left-0 w-full h-full object-cover rounded-md"
          loading="lazy"
        />

        {/* Veg Indicator small */}
        {product.isVeg && (
          <div className="absolute top-1 right-1 sm:top-2 sm:right-2 w-3 h-3 sm:w-3.5 sm:h-3.5 border-2 border-green-600 rounded-sm flex items-center justify-center bg-white">
            <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-green-600 rounded-full"></div>
          </div>
        )}

        {/* ADD pill / compact quantity control */}
        <div className="absolute right-1 bottom-1 sm:right-2 sm:bottom-2">
          {!isAdded ? (
            <button
              onClick={handleAddToCart}
              disabled={addingToCart}
              className="bg-pink-500 text-white rounded-lg text-[9px] sm:text-[11px] font-semibold shadow-md flex flex-col items-center justify-center px-2 sm:px-3 h-7 sm:h-9 disabled:opacity-50"
            >
              <span className="leading-none">{addingToCart ? 'ADDING...' : 'ADD'}</span>
              {hasOptions && !addingToCart && (
                <span className="mt-0.5 text-[8px] sm:text-[9px] text-white rounded px-0.5 sm:px-1 pt-0.5">{optionsArray.length} options</span>
              )}
            </button>
          ) : (
            <div className="flex items-center bg-pink-500 text-white rounded-lg shadow px-1 sm:px-1.5 h-7 sm:h-9">
              <button 
                onClick={(e) => handleQuantityChange('decrease', e)} 
                disabled={addingToCart}
                className="w-5 h-5 sm:w-7 sm:h-7 text-white rounded-full flex items-center justify-center text-sm sm:text-lg font-bold leading-none disabled:opacity-50"
              >
                −
              </button>
              <span className="px-1 sm:px-2 text-xs sm:text-sm font-bold text-white">{quantity}</span>
              <button 
                onClick={(e) => handleQuantityChange('increase', e)} 
                disabled={addingToCart}
                className="w-5 h-5 sm:w-7 sm:h-7 text-white rounded-full flex items-center justify-center text-sm sm:text-lg font-bold leading-none disabled:opacity-50"
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-1.5 sm:px-2 pt-1.5 sm:pt-2 pb-1 flex-1 flex flex-col justify-between min-h-0">
        <div className="flex-1 flex flex-col">
          {/* Product name with fixed height */}
          <h3 className="text-[10px] sm:text-[12px] font-semibold text-gray-800 min-h-[2.2em] sm:min-h-[2.4em]" style={{display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.1em'}}>{product.name}</h3>

          {/* Price row */}
          <div className="mt-0.5 sm:mt-1 flex items-end justify-between">
            <div className="min-h-[2.5em] flex flex-col justify-end">
              <div className="flex items-center gap-0.5 sm:gap-1 flex-wrap">
                <span className="text-xs sm:text-sm font-bold text-gray-900">₹{discounted || product.discountedPrice || 0}</span>
                <span className="text-[9px] sm:text-[10px] text-gray-400 line-through">₹{original || product.originalPrice || 0}</span>
                {saveAmt > 0 && (
                  <span className="text-[8px] sm:text-[10px] text-green-600 font-semibold">SAVE {saveAmt}</span>
                )}
              </div>
              <div className="text-[9px] sm:text-[10px] text-gray-500 mt-0.5">{product.volume || ' '}</div>
            </div>
          </div>
        </div>

        {/* Meta row: type and rating (fixed height) */}
        <div className="mt-auto pt-1 sm:pt-1.5 flex items-center justify-between min-h-[1.2em]">
          <div className="text-[9px] sm:text-[10px] text-green-600 font-medium truncate flex-1">{product.type || ' '}</div>

          <div className="flex items-center gap-0.5 sm:gap-1 text-[9px] sm:text-[10px] text-gray-600 flex-shrink-0 ml-1">
            <span className="flex items-center text-green-600">{product.rating} <i className="ri-star-fill ml-0.5 sm:ml-1 text-[9px] sm:text-[10px]"></i></span>
            <span className="text-gray-400">({product.reviews})</span>
          </div>
        </div>

      </div>

      {/* Options modal/popup (variant selector) */}
      {showOptionsPopup && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowOptionsPopup(false)} />

          <div className="bg-white rounded-xl shadow-2xl z-10 w-full max-w-sm max-h-[90vh] relative overflow-hidden flex flex-col">
            {/* Header with close button */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Choose Variant</h2>
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowOptionsPopup(false);
                }} 
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors"
                type="button"
              >
                ×
              </button>
            </div>

            {/* Product image */}
            <div className="w-full h-32 bg-gray-100">
              <img 
                src={selectedVariant?.thumbnail_url || selectedVariant?.image || product.thumbnail_url || product.image} 
                alt={product.name} 
                className="w-full h-full object-cover" 
              />
            </div>

            {/* Content area */}
            <div className="p-4 space-y-3 flex-1 overflow-y-auto">
              {/* Product name and description */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{product.name}</h3>
                <p className="text-sm text-gray-600 line-clamp-2">{product.description || 'Delicious product'}</p>
              </div>

              {/* Variant selection */}
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Select Variant</div>
                <div className="grid grid-cols-2 gap-2">
                  {optionsArray && optionsArray.map((opt) => (
                    <button 
                      key={opt.id}
                      onClick={(e) => { e.stopPropagation(); handleOptionSelect(opt); }}
                      className={`p-2 rounded-lg border-2 transition-all ${
                        selectedVariant?.id === opt.id 
                          ? 'border-pink-500 bg-pink-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded overflow-hidden flex-shrink-0">
                          <img 
                            src={opt.image || product.image} 
                            alt={opt.name} 
                            className="w-full h-full object-cover" 
                          />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="text-xs font-medium text-gray-900">{opt.name}</div>
                          <div className="text-xs text-gray-500">{opt.weight || opt.volume}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Price display */}
              <div className="bg-gray-50 rounded-lg p-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-base font-bold text-gray-900">
                      ₹{selectedVariant?.discountedPrice || selectedVariant?.discounted_price || product.discountedPrice}
                    </div>
                    {(selectedVariant?.originalPrice || selectedVariant?.price || product.originalPrice) && (
                      <div className="text-xs text-gray-500 line-through">
                        ₹{selectedVariant?.originalPrice || selectedVariant?.price || product.originalPrice}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500">Per piece</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer with Add to Cart button */}
            <div className="p-4 border-t border-gray-100 bg-gray-50">
              <button 
                type="button"
                onClick={(e) => confirmVariantAndAdd(e)} 
                disabled={addingToCart}
                className="w-full bg-pink-500 hover:bg-pink-600 text-white py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{addingToCart ? 'Adding...' : 'Add to Cart'}</span>
                {!addingToCart && <span className="text-lg">+</span>}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default CollectionCard;
