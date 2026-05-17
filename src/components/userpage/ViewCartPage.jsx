// utils
import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

// Components
import Header from '@common/Header';
import Footer from '@common/Footer';
import UserLoader from '@userpage-pages/UserLoader';
import { ROUTES_CONSTANTS } from "@constants/routesurl";
import { useDispatch, useSelector } from "react-redux";
import { updateCartQuantity, removeFromCart, getCart, clearCart } from "../../redux/slices/cartSlice";
import { fetchAllActiveProducts } from "../../redux/slices/productSlice";

const ViewCart = () => {
  const [visible, setVisible] = useState(false);
  const [loader, setLoader] = useState(false);
  const [updatingItems, setUpdatingItems] = useState({});
  const [cartTotals, setCartTotals] = useState({ 
    subtotal_mrp: 0,
    subtotal_selling_price: 0,
    product_discount: 0, 
    promo_discount: 0, 
    savings: 0, 
    total: 0 
  });
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [nextDiscount, setNextDiscount] = useState(null);
  const [showAddressMenu, setShowAddressMenu] = useState(null);
  const [showLocationMap, setShowLocationMap] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [detectedAddress, setDetectedAddress] = useState(null);
  const [cartItemsWithDetails, setCartItemsWithDetails] = useState([]);
  const [removingItem, setRemovingItem] = useState(null);
  const [toastMessage, setToastMessage] = useState({ show: false, message: '', type: '' });
  const { t } = useTranslation("msg");
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const cart = useSelector(state => state.cart.items || []);
  const { products, loading: productsLoading } = useSelector((state) => state.products);
  const { isAuthenticated } = useSelector(state => state.auth);

  // Show toast
  const showToast = (message, type = 'success') => {
    setToastMessage({ show: true, message, type });
    setTimeout(() => {
      setToastMessage({ show: false, message: '', type: '' });
    }, 3000);
  };

  // Get current user ID
  const getCurrentUserId = useCallback(() => {
    try {
      const userDetails = localStorage.getItem("userDetails");
      if (userDetails) {
        const parsedUser = JSON.parse(userDetails);
        return parsedUser?.id || parsedUser?.user?.id;
      }
      return null;
    } catch (e) {
      return null;
    }
  }, []);

  // Check if user is logged in
  const checkUserLoginStatus = useCallback(() => {
    try {
      const userDetails = localStorage.getItem("userDetails");
      if (userDetails) {
        const parsedUser = JSON.parse(userDetails);
        return !!(parsedUser && parsedUser.id);
      }
      return false;
    } catch (error) {
      return false;
    }
  }, []);

  const handleSearch = () => {};

  // Block body scroll when checkout modal is open
  useEffect(() => {
    if (visible) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
    } else {
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
    };
  }, [visible]);

  // Enrich cart items with product details from Redux products
  useEffect(() => {
    if (cart.length > 0 && products.length > 0) {
      const enriched = cart.map((cartItem) => {
        const product = products.find(p => p.id === cartItem.product_id);
        const variant = product?.variants?.find(v => v.productVariantId === cartItem.product_variant_id)
                     || product?.variants?.[0] || {};

        const fallbackCartPrice = Number(cartItem?.price || 0);
        const resolvedSellingPrice = Number(variant?.discountedPrice || variant?.actualPrice || fallbackCartPrice || 0);
        const resolvedMrp = Number(variant?.actualPrice || variant?.discountedPrice || fallbackCartPrice || 0);

        return {
          ...cartItem,
          name: product?.name || cartItem.name || `Product ${cartItem.product_id}`,
          image_url: product?.image_url || '',
          selling_price: resolvedSellingPrice,
          mrp: resolvedMrp,
          weight: cartItem.weight || variant?.weight || ''
        };
      });
      
      setCartItemsWithDetails(enriched);
      
      // Calculate totals
      const subtotal_selling_price = enriched.reduce((sum, item) => sum + ((item.selling_price || 0) * (item.quantity || 1)), 0);
      const subtotal_mrp = enriched.reduce((sum, item) => sum + ((item.mrp || 0) * (item.quantity || 1)), 0);
      
      setCartTotals({
        subtotal_mrp: subtotal_mrp,
        subtotal_selling_price: subtotal_selling_price,
        product_discount: subtotal_mrp - subtotal_selling_price,
        promo_discount: 0,
        savings: subtotal_mrp - subtotal_selling_price,
        total: subtotal_selling_price
      });
    } else if (cart.length === 0) {
      setCartItemsWithDetails([]);
      setCartTotals({
        subtotal_mrp: 0,
        subtotal_selling_price: 0,
        product_discount: 0,
        promo_discount: 0,
        savings: 0,
        total: 0
      });
    }
  }, [cart, products]);

  const updateQuantity = async (cartItemId, productId, weight, amount) => {
    const item = cartItemsWithDetails.find(i => i.cart_item_id === cartItemId)
              || cart.find(i => i.cart_item_id === cartItemId);
    if (!item) return;
    
    const newQuantity = item.quantity + amount;
    
    if (newQuantity < 1) {
      await removeItem(cartItemId);
      return;
    }
    
    setUpdatingItems(prev => ({ ...prev, [cartItemId]: true }));
    try {
      await dispatch(updateCartQuantity({ cartItemId, productId, weight, quantity: newQuantity })).unwrap();
      await fetchCartData();
    } catch (error) {
      console.error("Update quantity error:", error);
      showToast("Failed to update quantity", "error");
    } finally {
      setUpdatingItems(prev => ({ ...prev, [cartItemId]: false }));
    }
  };

  const setDirectQuantity = async (cartItemId, productId, weight, newQuantity) => {
    if (newQuantity === '') return;
    if (String(newQuantity).length > 1 && String(newQuantity).startsWith('0')) return;

    const quantity = parseInt(newQuantity);
    if (isNaN(quantity) || quantity < 1) return;

    setUpdatingItems(prev => ({ ...prev, [cartItemId]: true }));
    try {
      await dispatch(updateCartQuantity({ cartItemId, productId, weight, quantity })).unwrap();
      await fetchCartData();
    } catch (error) {
      console.error("Set quantity error:", error);
      showToast("Failed to update quantity", "error");
    } finally {
      setUpdatingItems(prev => ({ ...prev, [cartItemId]: false }));
    }
  };

  const handleQuantityBlur = async (cartItemId, productId, weight, value) => {
    if (value === '' || parseInt(value) < 1) {
      setUpdatingItems(prev => ({ ...prev, [cartItemId]: true }));
      try {
        await dispatch(updateCartQuantity({ cartItemId, productId, weight, quantity: 1 })).unwrap();
        await fetchCartData();
      } catch (error) {
        console.error("Quantity blur error:", error);
      } finally {
        setUpdatingItems(prev => ({ ...prev, [cartItemId]: false }));
      }
    }
  };

  const removeItem = async (cartItemId) => {
    setRemovingItem(cartItemId);
    try {
      await dispatch(removeFromCart({ cartItemId })).unwrap();
      showToast("Item removed from cart", "success");
      await fetchCartData();
    } catch (error) {
      console.error("Remove item error:", error);
      showToast("Failed to remove item. Please try again.", "error");
    } finally {
      setRemovingItem(null);
    }
  };

  // Fetch cart data from Redux
  const fetchCartData = useCallback(async () => {
    const isLoggedIn = checkUserLoginStatus();
    if (isLoggedIn) {
      setLoader(true);
      try {
        await dispatch(getCart()).unwrap();
      } catch (error) {
        console.error("Fetch cart error:", error);
      } finally {
        setLoader(false);
      }
    }
  }, [dispatch, checkUserLoginStatus]);

  // Fetch user addresses
  const fetchAddresses = useCallback(async () => {
    try {
      const userDetails = JSON.parse(localStorage.getItem('userDetails'));
      if (!userDetails?.id) return;

      const response = await fetch(`http://localhost:8070/api/v1/ecommerce/addresses?user_id=${userDetails.id}`, {
        headers: {
          'X-Tenant-Domain': 'localhost',
          'Content-Type': 'application/json'
        }
      });
      
      if (response?.ok) {
        const data = await response.json();
        setAddresses(data || []);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    }
  }, []);

  // Handle address selection
  const handleAddressSelect = (address) => {
    setSelectedAddress(address);
  };

  // Handle address edit
  const handleEditAddress = (address) => {
    setShowAddressMenu(null);
    setVisible(false);
    navigate(`/add-address?from=place-order&address_id=${address.id}`);
  };

  // Handle address delete
  const handleDeleteAddress = async (addressId) => {
    setShowAddressMenu(null);
    try {
      const response = await fetch(`http://localhost:8070/api/v1/ecommerce/addresses/${addressId}`, {
        method: 'DELETE',
        headers: {
          'X-Tenant-Domain': 'localhost',
          'Content-Type': 'application/json'
        }
      });
      
      if (response?.ok) {
        await fetchAddresses();
        showToast("Address deleted successfully", "success");
      }
    } catch (error) {
      console.error('Error deleting address:', error);
      showToast("Failed to delete address", "error");
    }
  };

  // Handle use current location
  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ lat: latitude, lng: longitude });
          
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            const data = await response.json();
            
            setDetectedAddress({
              display_name: data.display_name || 'Current Location',
              city: data.address?.city || data.address?.town || data.address?.village || '',
              state: data.address?.state || '',
              country: data.address?.country || '',
              postcode: data.address?.postcode || ''
            });
            
            setVisible(false);
            setShowLocationMap(true);
          } catch (error) {
            console.error('Error getting address:', error);
            setDetectedAddress({
              display_name: 'Current Location',
              city: '',
              state: '',
              country: '',
              postcode: ''
            });
            setVisible(false);
            setShowLocationMap(true);
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to get your location. Please enable location services.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  // Handle continue from location map
  const handleContinueFromMap = () => {
    setShowLocationMap(false);
    const params = new URLSearchParams({
      from: 'place-order',
      use_location: 'true',
      lat: currentLocation?.lat || '',
      lng: currentLocation?.lng || '',
      city: detectedAddress?.city || '',
      state: detectedAddress?.state || '',
      postcode: detectedAddress?.postcode || ''
    });
    navigate(`/add-address?${params.toString()}`);
  };

  // Handle proceed with selected address
  const handleProceed = () => {
    if (selectedAddress) {
      setVisible(false);
      navigate(`/place-order?address_id=${selectedAddress.id}`);
    }
  };

  // Open modal and fetch addresses
  const handleOpenAddressModal = () => {
    setVisible(true);
    fetchAddresses();
  };

  useEffect(() => {
    const isLoggedIn = checkUserLoginStatus();
    if (isLoggedIn) {
      fetchCartData();
    }
    // Always refresh products on cart page so variant prices are available
    dispatch(fetchAllActiveProducts());
  }, [dispatch, fetchCartData, checkUserLoginStatus]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      dispatch(clearCart());
    };
  }, [dispatch]);

  const displayItems = cartItemsWithDetails.length > 0 ? cartItemsWithDetails : cart;

  const sortedDisplayItems = useMemo(() => {
    return [...displayItems].sort((a, b) => {
      const nameA = (a?.name || a?.product_name || '').toString().toLowerCase();
      const nameB = (b?.name || b?.product_name || '').toString().toLowerCase();
      const nameCompare = nameA.localeCompare(nameB);
      if (nameCompare !== 0) return nameCompare;

      const weightA = (a?.weight || '').toString().toLowerCase();
      const weightB = (b?.weight || '').toString().toLowerCase();
      const weightCompare = weightA.localeCompare(weightB);
      if (weightCompare !== 0) return weightCompare;

      return (a?.cart_item_id || a?.id || 0) - (b?.cart_item_id || b?.id || 0);
    });
  }, [displayItems]);

  if (loader || productsLoading) {
    return <UserLoader />;
  }

  return (
    <>
      {/* Toast Notification */}
      {toastMessage.show && (
        <div className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-[100] px-6 py-3 rounded-lg shadow-lg transition-all duration-300 ${
          toastMessage.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          <div className="flex items-center gap-2">
            <i className={toastMessage.type === 'success' ? 'ri-checkbox-circle-line' : 'ri-error-warning-line'}></i>
            <span>{toastMessage.message}</span>
          </div>
        </div>
      )}

      {/* Mobile Checkout Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white shadow-sm z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => navigate(-1)} className="text-gray-700">
            <i className="ri-arrow-left-line text-2xl"></i>
          </button>
          <h1 className="text-lg font-semibold text-gray-800">My Cart</h1>
          <div className="w-8"></div>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:block">
        <Header onSearch={handleSearch} />
      </div>
      
      <div className="p-4 md:p-6 mt-14 md:mt-16 w-full max-w-screen-xl mx-auto">
        <h1 className="hidden md:block text-[28px] font-bold text-center mb-2 text-gray-800">
          My Shopping Cart
        </h1>
        <div className="hidden md:flex justify-center mb-8 text-gray-500 text-sm">
          <p>
            <span onClick={() => navigate("/")} className="cursor-pointer hover:text-gray-700">Home</span>
            <span className="mx-2">/</span>
            <span className="text-gray-800">Shopping Cart</span>
          </p>
        </div>

        {displayItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <i className="ri-shopping-cart-line text-5xl text-gray-400"></i>
            </div>
            <p className="text-xl text-gray-500 mb-6">Your cart is empty</p>
            <button 
              onClick={() => navigate('/')}
              className="px-8 py-3 bg-[#FFC107] hover:bg-[#FFB300] text-gray-900 font-semibold rounded-lg transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items Section */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Header */}
                <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 border-b border-gray-100 text-sm font-medium text-gray-600">
                  <div className="col-span-6">Product</div>
                  <div className="col-span-2 text-center">Price</div>
                  <div className="col-span-2 text-center">Quantity</div>
                  <div className="col-span-2 text-right">Total</div>
                </div>
                
                {/* Cart Items */}
                <div className="divide-y divide-gray-100">
                  {sortedDisplayItems.map((item) => {
                    const imageUrl = item.image_url || '';
                    const sellingPrice = item.selling_price || 0;
                    const mrp = item.mrp || sellingPrice;
                    const productName = item.name || item.product_name || `Product ${item.product_id}`;
                    const isUpdating = updatingItems[item.cart_item_id];
                    const isRemoving = removingItem === item.cart_item_id;
                    
                    return (
                      <div key={item?.cart_item_id || item?.id} className="p-4 md:p-6">
                        <div className="flex gap-4">
                          {/* Product Image */}
                          <div className="flex-shrink-0">
                            <div className="w-24 h-24 md:w-28 md:h-28 bg-gray-50 rounded-xl border border-gray-100 p-2 flex items-center justify-center">
                              {imageUrl ? (
                                <img
                                  src={imageUrl}
                                  alt={productName}
                                  className="w-full h-full object-contain"
                                  onError={(e) => {
                                    e.target.src = 'https://via.placeholder.com/100?text=No+Image';
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <i className="ri-image-line text-3xl text-gray-300"></i>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Product Details */}
                          <div className="flex-1">
                            <div className="flex flex-col h-full">
                              <div>
                                <h3 className="text-gray-800 font-semibold text-base mb-1 line-clamp-2">
                                  {productName}
                                </h3>
                                {item.weight && item.weight !== 'N/A' && (
                                  <p className="text-gray-500 text-sm">
                                    Weight: {item.weight}
                                  </p>
                                )}
                              </div>
                              
                              <div className="flex items-center justify-between mt-3">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-gray-400 line-through text-sm">
                                    ₹{Number(mrp).toFixed(0)}
                                  </span>
                                  <span className="text-green-600 font-bold text-base">
                                    ₹{Number(sellingPrice).toFixed(0)}
                                  </span>
                                  {mrp > sellingPrice && (
                                    <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
                                      Save ₹{Number(mrp - sellingPrice).toFixed(0)}
                                    </span>
                                  )}
                                </div>
                                
                                {/* Mobile: Show total price */}
                                <div className="md:hidden">
                                  <p className="text-gray-800 font-bold">
                                    ₹{Number(sellingPrice * item.quantity).toFixed(0)}
                                  </p>
                                </div>
                              </div>
                              
                              {/* Quantity Controls and Remove Button */}
                              <div className="flex items-center justify-between mt-4">
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center bg-gray-100 rounded-lg">
                                    <button
                                      onClick={() => updateQuantity(item.cart_item_id, item.product_id, item.weight, -1)}
                                      disabled={isUpdating || isRemoving}
                                      className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 rounded-l-lg transition-colors disabled:opacity-50"
                                    >
                                      <span className="text-gray-700 font-bold text-lg">−</span>
                                    </button>
                                    <input
                                      type="text"
                                      value={item.quantity}
                                      onChange={(e) => setDirectQuantity(item.cart_item_id, item.product_id, item.weight, e.target.value)}
                                      onBlur={(e) => handleQuantityBlur(item.cart_item_id, item.product_id, item.weight, e.target.value)}
                                      className="w-12 h-8 text-center border-none outline-none bg-transparent font-semibold text-gray-800 text-sm"
                                      disabled={isUpdating || isRemoving}
                                    />
                                    <button
                                      onClick={() => updateQuantity(item.cart_item_id, item.product_id, item.weight, 1)}
                                      disabled={isUpdating || isRemoving}
                                      className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 rounded-r-lg transition-colors disabled:opacity-50"
                                    >
                                      <span className="text-gray-700 font-bold text-lg">+</span>
                                    </button>
                                  </div>
                                  
                                  <button
                                    onClick={() => removeItem(item.cart_item_id)}
                                    disabled={isRemoving}
                                    className="text-red-500 hover:text-red-700 transition-colors text-sm flex items-center gap-1 disabled:opacity-50"
                                  >
                                    {isRemoving ? (
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                                    ) : (
                                      <i className="ri-delete-bin-line text-lg"></i>
                                    )}
                                    <span className="hidden md:inline">Remove</span>
                                  </button>
                                </div>
                                
                                {/* Desktop: Show total price */}
                                <div className="hidden md:block">
                                  <p className="text-gray-800 font-bold text-lg">
                                    ₹{Number(sellingPrice * item.quantity).toFixed(0)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Order Summary Section */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-24">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Order Summary</h2>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal (MRP)</span>
                    <span className="text-gray-800">₹{Number(cartTotals.subtotal_mrp).toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Product Discount</span>
                    <span className="text-green-600">-₹{Number(cartTotals.product_discount).toFixed(0)}</span>
                  </div>
                  {/* <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Delivery Charges</span>
                    <span className="text-green-600">Free</span>
                  </div> */}
                  
                  <div className="border-t border-gray-100 pt-3 mt-3">
                    <div className="flex justify-between text-base font-bold">
                      <span className="text-gray-800">Total Amount</span>
                      <span className="text-gray-900">₹{Number(cartTotals.total).toFixed(0)}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Inclusive of all taxes</p>
                  </div>
                </div>
                
                <button
                  className="w-full mt-6 bg-[#FFC107] hover:bg-[#FFB300] text-gray-900 font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => {
                    const isLoggedIn = checkUserLoginStatus();
                    if (!isLoggedIn) {
                      navigate(ROUTES_CONSTANTS.SIGN_IN);
                      return;
                    }
                    handleOpenAddressModal();
                  }}
                  disabled={displayItems.length === 0}
                >
                  Proceed to Checkout
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Sheet Modal for Address Selection */}
        {visible && (
          <>
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-[9998] transition-opacity"
              onClick={() => {
                setVisible(false);
                setShowAddressMenu(null);
              }}
              style={{ 
                opacity: visible ? 1 : 0,
                pointerEvents: visible ? 'auto' : 'none'
              }}
            />
            
            <div 
              className={`
                fixed z-[9999] bg-white
                md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2
                md:rounded-2xl md:w-[90vw] md:max-w-[500px] md:max-h-[85vh]
                bottom-0 left-0 right-0 rounded-t-3xl max-h-[85vh]
                transition-transform duration-300 ease-out
                ${visible ? 'translate-y-0' : 'translate-y-full md:translate-y-0'}
              `}
              style={{
                boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.15)'
              }}
            >
              <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 rounded-t-3xl md:rounded-t-2xl z-10">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg md:text-xl font-bold text-gray-900">Select address</h2>
                  <button 
                    onClick={() => {
                      setVisible(false);
                      setShowAddressMenu(null);
                    }}
                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <i className="ri-close-line text-xl text-gray-600"></i>
                  </button>
                </div>
              </div>

              <div className="overflow-y-auto px-4 py-3" style={{ maxHeight: 'calc(85vh - 120px)' }}>
                <button 
                  onClick={() => {
                    setVisible(false);
                    navigate('/add-address');
                  }}
                  className="w-full bg-white border border-gray-200 rounded-lg p-2.5 mb-2.5 flex items-center justify-between hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <i className="ri-add-line text-lg text-[#FFC107]"></i>
                    <span className="text-[#FFC107] font-semibold text-sm">Add new address</span>
                  </div>
                  <i className="ri-arrow-right-s-line text-lg text-[#FFC107] group-hover:translate-x-1 transition-transform"></i>
                </button>

                <button 
                  onClick={handleUseCurrentLocation}
                  className="w-full bg-white border border-gray-200 rounded-lg p-2.5 mb-3 flex items-center gap-2 hover:bg-gray-50 transition-colors"
                >
                  <i className="ri-map-pin-line text-lg text-[#FFC107]"></i>
                  <span className="text-[#FFC107] font-semibold text-sm">Use current location</span>
                </button>

                <h3 className="text-sm font-semibold text-gray-700 mb-2.5">Your saved addresses</h3>
                
                <div className="space-y-2 mb-3">
                  {addresses.length === 0 ? (
                    <p className="text-xs text-gray-500 text-center py-4">No saved addresses found</p>
                  ) : (
                    addresses.map((address) => (
                      <div key={address.id} className="relative">
                        <div 
                          onClick={() => handleAddressSelect(address)}
                          className={`bg-white border rounded-lg p-2.5 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer ${
                            selectedAddress?.id === address.id ? 'border-[#FFC107] bg-yellow-50' : 'border-gray-200'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 flex-1 min-w-0">
                            <div className="w-9 h-9 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <i className={`text-base text-[#FFC107] ${
                                address.address_type === 'office' ? 'ri-building-line' : 
                                address.address_type === 'hotel' ? 'ri-hotel-line' : 
                                'ri-home-line'
                              }`}></i>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-900 text-xs mb-0.5 capitalize">
                                {address.address_label || address.address_type || 'Address'}
                              </h4>
                              <p className="text-xs text-gray-600 truncate">
                                {[
                                  address.flat_no || address.building,
                                  address.landmark,
                                  address.city,
                                  address.state,
                                  address.zip_code || address.pinCode
                                ].filter(Boolean).join(', ')}
                              </p>
                            </div>
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowAddressMenu(showAddressMenu === address.id ? null : address.id);
                            }}
                            className="ml-2 p-1 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
                          >
                            <i className="ri-more-2-fill text-base text-gray-600"></i>
                          </button>
                        </div>

                        {showAddressMenu === address.id && (
                          <div className="absolute right-2 top-12 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[120px]">
                            <button
                              onClick={() => handleEditAddress(address)}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 rounded-t-lg"
                            >
                              <i className="ri-edit-line text-base"></i>
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteAddress(address.id)}
                              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 rounded-b-lg"
                            >
                              <i className="ri-delete-bin-line text-base"></i>
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-3">
                <button 
                  onClick={handleProceed}
                  disabled={!selectedAddress}
                  className="w-full bg-[#FFC107] hover:bg-[#FFB300] text-gray-900 font-bold py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Proceed
                </button>
              </div>
            </div>
          </>
        )}

        {/* Location Map Modal */}
        {showLocationMap && (
          <>
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-[9998]"
              onClick={() => setShowLocationMap(false)}
            />
            
            <div className="fixed inset-0 z-[9999] bg-white">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 z-10">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setShowLocationMap(false)}
                    className="text-gray-700"
                  >
                    <i className="ri-arrow-left-line text-2xl"></i>
                  </button>
                  <h2 className="text-lg font-semibold text-gray-900">Add Address</h2>
                </div>
              </div>

              <div className="relative h-[60vh] bg-gray-100">
                <div className="absolute top-4 left-4 bg-white rounded-lg shadow-md flex z-10">
                  <button className="px-4 py-2 text-sm font-semibold text-gray-900 border-r border-gray-200">
                    Map
                  </button>
                  <button className="px-4 py-2 text-sm text-gray-600">
                    Satellite
                  </button>
                </div>

                <button className="absolute top-4 right-4 bg-white p-2 rounded-lg shadow-md z-10">
                  <i className="ri-fullscreen-line text-xl text-gray-700"></i>
                </button>

                <div className="w-full h-full bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center relative">
                  <div className="absolute inset-0 opacity-20">
                    <div className="w-full h-full" style={{
                      backgroundImage: 'repeating-linear-gradient(0deg, #e5e7eb 0px, #e5e7eb 1px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, #e5e7eb 0px, #e5e7eb 1px, transparent 1px, transparent 40px)',
                    }}></div>
                  </div>
                  
                  <div className="relative z-10">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                      <div className="w-48 h-48 bg-blue-300 rounded-full opacity-30 animate-pulse"></div>
                    </div>
                    <div className="relative">
                      <i className="ri-map-pin-fill text-6xl text-green-500" style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' }}></i>
                    </div>
                  </div>

                  <button className="absolute bottom-4 left-4 bg-white p-2 rounded-full shadow-md">
                    <i className="ri-focus-3-line text-xl text-gray-700"></i>
                  </button>

                  <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-md">
                    <button className="p-2 border-b border-gray-200">
                      <i className="ri-add-line text-xl text-gray-700"></i>
                    </button>
                    <button className="p-2">
                      <i className="ri-subtract-line text-xl text-gray-700"></i>
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-4">
                <div className="flex items-start gap-3 mb-4">
                  <div className="flex-shrink-0 mt-1">
                    <i className="ri-refresh-line text-xl text-gray-600"></i>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-gray-900 mb-1">
                      Delivering your order to
                    </h3>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-sm font-semibold text-gray-900 mb-1">
                        {detectedAddress?.display_name || 'Current Location'}
                      </p>
                      <p className="text-xs text-gray-600">
                        {[detectedAddress?.city, detectedAddress?.state].filter(Boolean).join(', ')}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleContinueFromMap}
                  className="w-full bg-[#FFC107] hover:bg-[#FFB300] text-gray-900 font-bold py-3 rounded-lg text-base transition-colors"
                >
                  Continue
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="mt-16">
        <Footer data={[]} />
      </div>
    </>
  );
};

export default ViewCart;
