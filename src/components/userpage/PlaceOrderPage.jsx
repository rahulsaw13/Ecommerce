import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Dialog } from 'primereact/dialog';
import Header from '@common/Header';
import Footer from '@common/Footer';
import LocationPickerPopup from '@common/LocationPickerPopup';
import { getCart, clearCart, updateCartQuantity } from '../../redux/slices/cartSlice';
import { placeOrderFromCart, clearOrderStatus } from '../../redux/slices/orderSlice';
import { fetchUserAddresses } from '../../redux/slices/addressSlice';
import { fetchAllActiveProducts, fetchAllCategories } from '../../redux/slices/productSlice';
import { fetchWalletSettings, fetchWalletBalance } from '../../redux/slices/walletSlice';
import { getLocationFromCookie, saveLocationToCookie } from '@services/locationService';
import { allApi } from '@api/api';
import { loadRazorpayScript, openRazorpayModal } from '@utils/razorpay';
import { API_CONSTANTS } from '@constants/apiurl';

const PlaceOrderPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const addressId = searchParams.get('address_id');
  const hasFetchedData = useRef(false);
  
  // Redux state
  const { items: cartItems, loading: cartLoading } = useSelector((state) => state.cart);
  const { addresses } = useSelector((state) => state.address);
  const { loading: orderLoading, orderSuccess, orderId, ecomOrderId, error: orderError } = useSelector((state) => state.order);
  const allProducts = useSelector((state) => state.products?.products || []);
  const allCategories = useSelector((state) => state.products?.categories || []);
  const { enabled: walletEnabled, balance: walletBalance } = useSelector((state) => state.wallet);
  
  const [address, setAddress] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash_on_delivery');
  const [useWallet, setUseWallet] = useState(false);
  const [minDate, setMinDate] = useState('');
  const [cartTotals, setCartTotals] = useState({ 
    subtotal_mrp: 0,
    subtotal_selling_price: 0,
    product_discount: 0, 
    promo_discount: 0, 
    savings: 0, 
    total: 0,
    handling_fee: 0,
    delivery_charge: 0,
    igst_rate: 0,
    cgst_rate: 0,
    sgst_rate: 0,
    igst_amount: 0,
    cgst_amount: 0,
    sgst_amount: 0,
    tax_amount: 0,
    grand_total: 0
  });
  const [cartItemsLocal, setCartItemsLocal] = useState([]);
  const [showItems, setShowItems] = useState(false);
  const [updatingItems, setUpdatingItems] = useState({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const walletAmountUsed = useWallet ? Math.min(walletBalance, Math.max(0, cartTotals.grand_total - couponDiscount)) : 0;
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [expandedCouponCategories, setExpandedCouponCategories] = useState({});

  // Delivery availability — backend is the authoritative check; frontend only tracks location name
  const [deliveryCheck, setDeliveryCheck] = useState({ checked: true, available: true, locationName: '' });
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const changeLocationBtnRef = useRef(null);

  // Branch stock check for selected address
  const [stockCheck, setStockCheck] = useState({ loading: false, unavailable: [] });

  useEffect(() => {
    const loc = getLocationFromCookie();
    const name = loc?.shortName || loc?.address?.split(',')[0] || '';
    setDeliveryCheck({ checked: true, available: true, locationName: name });
  }, []);

  const handleLocationSelected = (loc) => {
    saveLocationToCookie(loc);
    const name = loc.shortName || loc.address?.split(',')[0] || '';
    setDeliveryCheck({ checked: true, available: true, locationName: name });
    setShowLocationPicker(false);
  };

  const timeSlots = [
    '8 AM - 11 AM',
    '11 AM - 1 PM',
    '1 PM - 3 PM',
    '3 PM - 5 PM',
    '7 PM - 9 PM'
  ];

  const isTimeSlotPassed = (slot) => {
    const today = new Date().toISOString().split('T')[0];
    if (selectedDate !== today) return false;

    const endTimeStr = slot.split(' - ')[1];
    const [time, period] = endTimeStr.split(' ');
    let [hours] = time.split(':').map(Number);
    
    if (period === 'PM' && hours !== 12) hours += 12;
    else if (period === 'AM' && hours === 12) hours = 0;

    return new Date().getHours() >= hours;
  };

  // Update cart totals and items from Redux
  useEffect(() => {
    if (cartItems && cartItems.length > 0) {
      const subtotal_mrp = cartItems.reduce((sum, item) => sum + ((item.mrp || item.original_price || 0) * (item.quantity || 1)), 0);
      const subtotal_selling_price = cartItems.reduce((sum, item) => sum + ((item.selling_price || item.price || 0) * (item.quantity || 1)), 0);
      const product_discount = subtotal_mrp - subtotal_selling_price;
      const handling_fee = 0;
      const grand_total = subtotal_selling_price + handling_fee;
      
      setCartTotals({
        subtotal_mrp: subtotal_mrp,
        subtotal_selling_price: subtotal_selling_price,
        product_discount: product_discount,
        promo_discount: 0,
        savings: product_discount,
        total: subtotal_selling_price,
        handling_fee: handling_fee,
        delivery_charge: 0,
        igst_rate: 0,
        cgst_rate: 0,
        sgst_rate: 0,
        igst_amount: 0,
        cgst_amount: 0,
        sgst_amount: 0,
        tax_amount: 0,
        grand_total: grand_total
      });
      setCartItemsLocal(cartItems);
    }
  }, [cartItems]);

  // ✅ FIXED: Data fetch only once on mount
  useEffect(() => {
    const fetchData = async () => {
      if (hasFetchedData.current) return;
      hasFetchedData.current = true;
      
      const userDetails = JSON.parse(localStorage.getItem('userDetails') || '{}');

      if (userDetails?.id) {
        await dispatch(getCart());
        await dispatch(fetchUserAddresses(userDetails.id));
      }
      // Ensure products and categories are loaded for coupon validation and display
      dispatch(fetchAllActiveProducts());
      dispatch(fetchAllCategories());
      dispatch(fetchWalletSettings());
      const uid = userDetails?.id || userDetails?.user?.id;
      if (uid) dispatch(fetchWalletBalance(uid));
    };
    
    fetchData();
  }, [dispatch]);

  // Resolve address and derive branch from its coordinates (Blinkit-style)
  useEffect(() => {
    if (addressId && addresses && addresses.length > 0) {
      const selectedAddr = addresses.find(addr => addr.id === parseInt(addressId));
      if (selectedAddr) {
        const addressParts = [
          selectedAddr.address_type?.toUpperCase() || 'ADDRESS',
          selectedAddr.name,
          selectedAddr.flat_no,
          selectedAddr.floor,
          selectedAddr.address,
          selectedAddr.landmark,
          selectedAddr.city,
          selectedAddr.state,
          selectedAddr.zip_code,
          selectedAddr.phone_number
        ].filter(Boolean);

        setAddress({
          type: selectedAddr.address_type || 'Address',
          fullAddress: addressParts.join(', '),
          latitude: selectedAddr.latitude,
          longitude: selectedAddr.longitude
        });

        // If address has coordinates, resolve nearest branch → update cookie → check stock
        if (selectedAddr.latitude && selectedAddr.longitude) {
          setStockCheck({ loading: true, unavailable: [] });
          allApi.get(`/user_dashboard/nearest_branch?latitude=${selectedAddr.latitude}&longitude=${selectedAddr.longitude}`)
            .then(async res => {
              if (res.data?.available && res.data?.branch_id) {
                const existing = getLocationFromCookie() || {};
                saveLocationToCookie({ ...existing, branch_id: res.data.branch_id });

                // Re-fetch products for this branch and cross-check cart
                try {
                  const productsRes = await allApi.get('/user_dashboard/all_active_products', {
                    headers: { 'X-Branch-Id': String(res.data.branch_id) }
                  });
                  const variants = {};
                  (productsRes.data?.products || []).forEach(p =>
                    (p.variants || []).forEach(v => { variants[v.productVariantId] = v; })
                  );

                  const cartSnapshot = cartItems || [];
                  const unavailable = cartSnapshot
                    .filter(item => {
                      const v = variants[item.product_variant_id];
                      if (!v) return false;
                      if (v.in_stock === false) return true;
                      if (v.available_qty !== undefined && v.available_qty < item.quantity) return true;
                      return false;
                    })
                    .map(item => {
                      const v = variants[item.product_variant_id];
                      return {
                        cart_item_id: item.cart_item_id,
                        name: item.name,
                        requested: item.quantity,
                        available: v?.available_qty ?? 0
                      };
                    });

                  setStockCheck({ loading: false, unavailable });
                } catch {
                  setStockCheck({ loading: false, unavailable: [] });
                }
              } else {
                setStockCheck({ loading: false, unavailable: [] });
              }
            })
            .catch(() => setStockCheck({ loading: false, unavailable: [] }));
        }
      }
    }
  }, [addressId, addresses]);

  // ✅ FIXED: Date initialization only once
  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const today = `${year}-${month}-${day}`;
    
    const allSlotsDisabled = timeSlots.every(slot => {
      const endTimeStr = slot.split(' - ')[1];
      const [time, period] = endTimeStr.split(' ');
      let [hours] = time.split(':').map(Number);
      
      if (period === 'PM' && hours !== 12) hours += 12;
      else if (period === 'AM' && hours === 12) hours = 0;
      
      return now.getHours() >= hours;
    });
    
    if (allSlotsDisabled) {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
      setSelectedDate(tomorrowStr);
      setMinDate(tomorrowStr);
    } else {
      setSelectedDate(today);
      setMinDate(today);
    }
  }, []);

  const updateQuantity = async (cartItemId, productId, weight, amount) => {
    const item = cartItemsLocal.find(i => i.cart_item_id === cartItemId);
    if (!item) return;
    const newQuantity = item.quantity + amount;
    if (newQuantity < 1) return;
    setUpdatingItems(prev => ({ ...prev, [cartItemId]: true }));
    // Optimistic update
    setCartItemsLocal(prev => prev.map(i => i.cart_item_id === cartItemId ? { ...i, quantity: newQuantity } : i));
    try {
      await dispatch(updateCartQuantity({ cartItemId, productId, weight, quantity: newQuantity }));
    } catch (error) {
      await dispatch(getCart());
    } finally {
      setUpdatingItems(prev => ({ ...prev, [cartItemId]: false }));
    }
  };

  const setDirectQuantity = (cartItemId, productId, weight, newValue) => {
    if (newValue === '' || (newValue.length > 1 && newValue.startsWith('0'))) return;
    const qty = parseInt(newValue);
    if (isNaN(qty) || qty < 1) return;
    setCartItemsLocal(prev => prev.map(i => i.cart_item_id === cartItemId ? { ...i, quantity: qty } : i));
  };

  const handleQuantityBlur = async (cartItemId, productId, weight, value) => {
    const qty = parseInt(value);
    if (!qty || qty < 1) {
      await dispatch(getCart());
      return;
    }
    setUpdatingItems(prev => ({ ...prev, [cartItemId]: true }));
    try {
      await dispatch(updateCartQuantity({ cartItemId, productId, weight, quantity: qty }));
    } catch (error) {
      await dispatch(getCart());
    } finally {
      setUpdatingItems(prev => ({ ...prev, [cartItemId]: false }));
    }
  };

  const buildCategoryMap = () => {
    const map = {};
    allCategories.forEach(c => {
      if (c.category?.id) map[String(c.category.id)] = c.category.name;
    });
    return map;
  };

  const renderCouponScope = (coupon) => {
    if (!coupon.applies_category && !coupon.applies_products) return null;
    if (coupon.applies_products) {
      return <p className="text-xs text-orange-600 mt-1">Applicable on selected products</p>;
    }
    if (coupon.applies_category) {
      const ids = coupon.applies_category.split(',').map(s => s.trim()).filter(Boolean);
      const categoryMap = buildCategoryMap();
      const names = ids.map(id => categoryMap[id]).filter(Boolean);
      if (names.length === 0) return null;
      const isExpanded = expandedCouponCategories[coupon.id];
      const visible = isExpanded ? names : names.slice(0, 3);
      const remaining = names.length - 3;
      return (
        <p className="text-xs text-orange-600 mt-1">
          Applicable on: {visible.join(', ')}
          {!isExpanded && remaining > 0 && (
            <>
              {' '}
              <button
                type="button"
                className="underline font-semibold"
                onClick={(e) => { e.stopPropagation(); setExpandedCouponCategories(prev => ({ ...prev, [coupon.id]: true })); }}
              >
                +{remaining} more
              </button>
            </>
          )}
          {isExpanded && (
            <>
              {' '}
              <button
                type="button"
                className="underline font-semibold"
                onClick={(e) => { e.stopPropagation(); setExpandedCouponCategories(prev => ({ ...prev, [coupon.id]: false })); }}
              >
                show less
              </button>
            </>
          )}
        </p>
      );
    }
    return null;
  };

  const fetchAvailableCoupons = async () => {
    try {
      const res = await allApi.get('/user_dashboard/available_discounts');
      setAvailableCoupons(res.data?.discounts || []);
    } catch {
      setAvailableCoupons([]);
    }
  };

  const handleApplyCoupon = async (code, exact = false) => {
    if (!code) return;
    setApplyingCoupon(true);
    try {
      // Ensure products are loaded so variant→category map is accurate
      let products = allProducts;
      if (!products || products.length === 0) {
        const result = await dispatch(fetchAllActiveProducts());
        products = result.payload || [];
      }

      // Build variant → category_id lookup from products
      const variantCategoryMap = {};
      products.forEach(p => {
        if (p.category_id) {
          (p.variants || []).forEach(v => {
            variantCategoryMap[String(v.productVariantId)] = String(p.category_id);
          });
        }
      });
      const cartItemsPayload = cartItemsLocal.map(item => ({
        product_variant_id: String(item.product_variant_id),
        category_id: variantCategoryMap[String(item.product_variant_id)] || String(item.category_id || ''),
        quantity: item.quantity || 1,
        price: item.selling_price || item.price || 0
      }));
      const res = await allApi.post('/user_dashboard/validate_discount', {
        code: exact ? code.trim() : code.trim().toUpperCase(),
        cart_total: cartTotals.subtotal_selling_price,
        cart_items: cartItemsPayload
      });
      if (res.data?.valid) {
        const discountAmt = res.data.discount_amount || 0;
        setCouponDiscount(discountAmt);
        setAppliedCoupon({ code: res.data.coupon?.code || code, ...res.data.coupon });
        setCouponCode('');
        setShowCouponModal(false);
      } else {
        alert(res.data?.message || 'Invalid coupon code');
      }
    } catch {
      alert('Failed to apply coupon. Please try again.');
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
  };

  const handleOpenCouponModal = () => {
    setShowCouponModal(true);
    fetchAvailableCoupons();
  };

  const handleCheckout = async () => {
    if (!selectedDate || !selectedTimeSlot) {
      alert('Please select delivery date and time slot');
      return;
    }

    setPlacingOrder(true);
    
    try {
      const userDetails = JSON.parse(localStorage.getItem('userDetails'));
      
      if (!userDetails?.id) {
        alert('User not found. Please login again.');
        navigate('/sign-in');
        return;
      }
      
      // Use address coordinates if available (Blinkit-style); fall back to location cookie
      let locationCoords = {};
      if (address?.latitude && address?.longitude) {
        locationCoords = { latitude: address.latitude, longitude: address.longitude };
      } else {
        try {
          const loc = getLocationFromCookie();
          if (loc?.latitude && loc?.longitude) {
            locationCoords = { latitude: loc.latitude, longitude: loc.longitude };
          }
        } catch (_) {}
      }

      const effectiveTotal = Math.max(0, cartTotals.grand_total - couponDiscount);
      await dispatch(placeOrderFromCart({
        userId: userDetails.id,
        totalPrice: effectiveTotal.toFixed(2),
        addressId: addressId,
        paymentMethod: paymentMethod,
        orderType: 'home_delivery',
        couponCode: appliedCoupon?.code || null,
        couponDiscount: couponDiscount || 0,
        ...locationCoords
      })).unwrap();
      
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Failed to place order. Please try again.');
      setPlacingOrder(false);
    }
  };

  // Handle order success — for COD, show success immediately; for online payment, open Razorpay
  useEffect(() => {
    if (orderSuccess && orderId) {
      if (paymentMethod === 'online_payment' && ecomOrderId) {
        handleOnlinePayment(ecomOrderId);
      } else {
        dispatch(clearCart());
        setShowSuccessModal(true);
        dispatch(clearOrderStatus());
      }
    }
  }, [orderSuccess, orderId, ecomOrderId, paymentMethod]);

  // Handle order error
  useEffect(() => {
    if (orderError) {
      alert(typeof orderError === 'string' ? orderError : 'Failed to place order. Please try again.');
      dispatch(clearOrderStatus());
      setPlacingOrder(false);
    }
  }, [orderError, dispatch]);

  const handleOnlinePayment = async (localEcomOrderId) => {
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        alert('Failed to load payment gateway. Please try again.');
        setPlacingOrder(false);
        return;
      }

      const userDetails = JSON.parse(localStorage.getItem('userDetails') || '{}');
      const amountToPay = Math.max(0, cartTotals.grand_total - couponDiscount - (useWallet ? walletAmountUsed : 0));

      const createRes = await allApi.post(`/${API_CONSTANTS.PAYMENT_CREATE_ORDER}`, { amount: amountToPay });
      const { razorpay_key_id, razorpay_order, name, logo } = createRes.data;

      const paymentResponse = await openRazorpayModal({
        keyId: razorpay_key_id,
        order: razorpay_order,
        name,
        logo,
        prefill: { name: userDetails.name, contact: userDetails.phone },
      });

      await allApi.post(`/${API_CONSTANTS.PAYMENT_VERIFY}`, {
        payment_method: 'bank',
        razorpay_payment_id: paymentResponse.razorpay_payment_id,
        razorpay_order_id: paymentResponse.razorpay_order_id,
        razorpay_signature: paymentResponse.razorpay_signature,
        payment_status: 'completed',
        type: 'order',
        ecom_order_id: localEcomOrderId,
        user_id: userDetails.id,
      });

      dispatch(clearCart());
      setShowSuccessModal(true);
      dispatch(clearOrderStatus());
    } catch (err) {
      alert(err?.message || 'Payment failed. Please try again.');
      setPlacingOrder(false);
    }
  };

  const handleContinueShopping = async () => {
    navigate('/');
  };

  // Loading state
  if (cartLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFC107]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Delivery not available — blocking screen */}
      {deliveryCheck.checked && !deliveryCheck.available && (
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center mt-16">
          <div className="w-28 h-28 bg-red-50 rounded-full flex items-center justify-center mb-6">
            <i className="ri-map-pin-2-line text-5xl text-red-400"></i>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
            {deliveryCheck.locationName
              ? `We don't deliver to ${deliveryCheck.locationName}`
              : "Set your delivery location"}
          </h2>
          <p className="text-gray-500 text-sm mb-2 max-w-xs">
            {deliveryCheck.locationName
              ? "Sorry, our delivery isn't available in this area yet."
              : "Please select a location to check if we deliver to you."}
          </p>
          <p className="text-gray-400 text-xs mb-8 max-w-xs">
            Try a different nearby location or check back later.
          </p>
          <button
            ref={changeLocationBtnRef}
            onClick={() => setShowLocationPicker(true)}
            className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white text-sm transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#0c831f' }}
          >
            <i className="ri-map-pin-line"></i>
            {deliveryCheck.locationName ? 'Change Location' : 'Select Location'}
          </button>
          <button
            onClick={() => navigate('/')}
            className="mt-4 text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Back to Home
          </button>
          <LocationPickerPopup
            isOpen={showLocationPicker}
            onClose={() => setShowLocationPicker(false)}
            onLocationSelected={handleLocationSelected}
            anchorRef={changeLocationBtnRef}
          />
        </div>
      )}

      {/* Normal order form — only shown when delivery is available */}
      {(!deliveryCheck.checked || deliveryCheck.available) && (
      <>
      <div className="p-4 md:p-6 mt-16 w-full max-w-screen-xl mx-auto">
        <h1 className="text-[20px] sm:text-[24px] md:text-[36px] font-bold text-center mb-4 text-[#1D2E43] font-[playfair]">
          Place Order
        </h1>
        <div className="flex justify-center mb-6 text-gray-600 text-sm">
          <p className="text-[#1D2E43]">
            <span onClick={() => navigate("/")} className="cursor-pointer hover:underline">Home</span>
            <span className="px-2">&gt;</span>
            Place Order
          </p>
        </div>

        <div className="max-w-2xl mx-auto space-y-4">
          {/* Delivery Location */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-gray-900 text-sm">Delivery Location</h3>
              <button 
                onClick={() => navigate(`/add-address?from=place-order&address_id=${addressId}`)}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Change
              </button>
            </div>
            {address && (
              <div className="flex items-center gap-2">
                <i className="ri-map-pin-line text-green-600 text-base mt-0.5"></i>
                <p className="text-xs text-gray-700">{address.fullAddress}</p>
              </div>
            )}
          </div>

          {/* Expected date & Time */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3 text-sm">Expected date & Time</h3>
            
            <div className="mb-3">
              <div className="relative">
                <i className="ri-calendar-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"></i>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={minDate}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC107] text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {timeSlots.map((slot) => {
                const isPassed = isTimeSlotPassed(slot);
                return (
                  <button
                    key={slot}
                    onClick={() => !isPassed && setSelectedTimeSlot(slot)}
                    disabled={isPassed}
                    className={`py-2.5 px-3 rounded-lg text-sm font-medium transition-colors ${
                      selectedTimeSlot === slot
                        ? 'bg-white text-gray-900 border-2 border-[#FFC107] shadow-sm'
                        : isPassed
                        ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                        : 'bg-white text-gray-600 border border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-white rounded-lg">
            <button
              onClick={() => setShowItems(!showItems)}
              className="w-full mt-4 bg-blue-50 border border-gray-300 rounded-lg py-2.5 flex items-center justify-between px-4 hover:bg-blue-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <i className="ri-shopping-bag-line text-gray-700 text-base"></i>
                <span className="text-xs text-gray-700">See Items</span>
              </div>
              <i className={`ri-arrow-${showItems ? 'up' : 'down'}-s-line text-gray-500 transition-transform text-base`}></i>
            </button>

            {showItems && (
              <div className="mt-3 bg-white border border-gray-200 rounded-lg p-4 max-h-[400px] overflow-y-auto">
                <div className="space-y-4">
                  {cartItemsLocal.map((item) => {
                    const imageUrl = item.image_url || item.image || '';
                    const sellingPrice = item.selling_price || 0;
                    const mrp = item.mrp || sellingPrice;
                    
                    return (
                      <div key={item.cart_item_id || item.id} className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-16 h-16 bg-gray-50 rounded-lg border border-gray-200 p-1 flex items-center justify-center relative overflow-hidden">
                            <i className="ri-image-line text-2xl text-gray-300 absolute"></i>
                            {imageUrl && (
                              <img
                                src={imageUrl}
                                alt={item.name}
                                className="relative z-10 w-full h-full object-contain"
                                loading="lazy"
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                              />
                            )}
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="text-gray-900 text-sm font-normal mb-2 leading-tight">
                            {item.name}
                          </h3>
                          {item.weight && (
                            <p className="text-gray-600 text-sm">
                              {item.weight}
                            </p>
                          )}
                        </div>

                        <div className="flex-shrink-0">
                          <div className="flex items-center bg-[#FFC107] rounded-md mb-2">
                            <button
                              onClick={() => updateQuantity(item.cart_item_id, item.id, item.weight, -1)}
                              disabled={item?.quantity <= 1 || updatingItems[item.cart_item_id]}
                              className="w-8 h-8 flex items-center justify-center hover:bg-[#FFB300] transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-l-md"
                            >
                              <span className="text-gray-900 font-bold text-base">−</span>
                            </button>
                            <input
                              type="text"
                              value={item.quantity}
                              onChange={(e) => setDirectQuantity(item.cart_item_id, item.id, item.weight, e.target.value)}
                              onBlur={(e) => handleQuantityBlur(item.cart_item_id, item.id, item.weight, e.target.value)}
                              className="w-10 h-8 text-center border-none outline-none bg-transparent font-bold text-gray-900 text-sm"
                              disabled={updatingItems[item.cart_item_id]}
                            />
                            <button
                              onClick={() => updateQuantity(item.cart_item_id, item.id, item.weight, 1)}
                              className="w-8 h-8 flex items-center justify-center hover:bg-[#FFB300] transition-colors disabled:opacity-50 rounded-r-md"
                              disabled={updatingItems[item.cart_item_id]}
                            >
                              <span className="text-gray-900 font-bold text-base">+</span>
                            </button>
                          </div>
                          
                          <div className="text-right flex items-center justify-end gap-2">
                            <p className="text-gray-400 line-through text-xs">
                              ₹{Number(mrp * item.quantity).toFixed(0)}
                            </p>
                            <p className="text-gray-900 font-bold text-sm">
                              ₹{Number(sellingPrice * item.quantity).toFixed(0)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Payment Method */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-bold text-gray-900 mb-4 text-base">Payment Method</h3>
            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-lg border-2 border-gray-300 flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-600">UPI</span>
                  </div>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="online_payment"
                    checked={paymentMethod === 'online_payment'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="hidden"
                  />
                  <span className="text-sm text-gray-900">Online Payment</span>
                </div>
                {paymentMethod === 'online_payment' && (
                  <i className="ri-check-line text-[#FFC107] text-xl"></i>
                )}
              </label>
              
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#FFC107] rounded-full flex items-center justify-center">
                    <i className="ri-money-dollar-circle-line text-white text-lg"></i>
                  </div>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cash_on_delivery"
                    checked={paymentMethod === 'cash_on_delivery'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="hidden"
                  />
                  <span className="text-sm text-gray-900">Cash on delivery</span>
                </div>
                {paymentMethod === 'cash_on_delivery' && (
                  <i className="ri-check-line text-[#FFC107] text-xl"></i>
                )}
              </label>

              {walletEnabled && walletBalance > 0 && (
                <div className="flex items-center justify-between cursor-pointer py-1" onClick={() => setUseWallet(w => !w)}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <i className="ri-wallet-3-line text-green-600 text-lg"></i>
                    </div>
                    <div>
                      <span className="text-sm text-gray-900">Pay using Wallet</span>
                      <p className="text-xs text-green-600 font-medium">Balance: ₹{walletBalance.toFixed(2)}</p>
                    </div>
                  </div>
                  {useWallet
                    ? <i className="ri-check-line text-[#FFC107] text-xl"></i>
                    : <span className="text-xs text-green-600 border border-green-500 rounded px-2 py-0.5">Apply</span>
                  }
                </div>
              )}
            </div>
          </div>

          {/* Bill Details */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-bold text-gray-900 mb-4 text-lg">Bill details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <i className="ri-file-list-3-line text-gray-700 text-base"></i>
                  <span className="text-gray-900 font-medium">Sub total</span>
                </div>
                <div className="text-right">
                  <span className="text-gray-400 line-through mr-2">₹{cartTotals.subtotal_mrp.toFixed(0)}</span>
                  <span className="text-gray-900 font-semibold">₹{cartTotals.subtotal_selling_price.toFixed(0)}</span>
                </div>
              </div>

              <div className="flex justify-between pl-7">
                <span className="text-gray-500">MRP</span>
                <span className="text-gray-700">₹{cartTotals.subtotal_mrp.toFixed(0)}</span>
              </div>

              <div className="flex justify-between pl-7">
                <span className="text-gray-500">Product Discount</span>
                <span className="text-green-600 font-medium">-₹{cartTotals.product_discount.toFixed(0)}</span>
              </div>

              {cartTotals.promo_discount > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <i className="ri-gift-line text-gray-700 text-base"></i>
                    <span className="text-gray-900 font-medium">Promo discount</span>
                  </div>
                  <span className="text-green-600 font-medium">-₹{cartTotals.promo_discount.toFixed(0)}</span>
                </div>
              )}

              {couponDiscount > 0 && appliedCoupon && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <i className="ri-coupon-line text-gray-700 text-base"></i>
                    <div className="flex flex-col">
                      <span className="text-gray-900 font-medium">Coupon discount</span>
                      <span className="text-xs text-gray-500">Code: {appliedCoupon.code}</span>
                    </div>
                  </div>
                  <span className="text-green-600 font-medium">-₹{couponDiscount.toFixed(0)}</span>
                </div>
              )}

              {useWallet && walletAmountUsed > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <i className="ri-wallet-3-line text-gray-700 text-base"></i>
                    <span className="text-gray-900 font-medium">Wallet</span>
                  </div>
                  <span className="text-green-600 font-medium">-₹{walletAmountUsed.toFixed(2)}</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <i className="ri-truck-line text-gray-700 text-base"></i>
                  <span className="text-gray-900 font-medium">Delivery charge</span>
                </div>
                <span className="text-gray-700">₹{cartTotals.delivery_charge.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <i className="ri-hand-coin-line text-gray-700 text-base"></i>
                  <span className="text-gray-900 font-medium">Handling charge</span>
                </div>
                <span className="text-gray-700">₹{cartTotals.handling_fee.toFixed(2)}</span>
              </div>

              {cartTotals.igst_amount > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <i className="ri-percent-line text-gray-700 text-base"></i>
                    <span className="text-gray-900 font-medium">IGST ({cartTotals.igst_rate}%)</span>
                  </div>
                  <span className="text-gray-700">₹{cartTotals.igst_amount.toFixed(2)}</span>
                </div>
              )}
              
              {cartTotals.cgst_amount > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <i className="ri-percent-line text-gray-700 text-base"></i>
                    <span className="text-gray-900 font-medium">CGST ({cartTotals.cgst_rate}%)</span>
                  </div>
                  <span className="text-gray-700">₹{cartTotals.cgst_amount.toFixed(2)}</span>
                </div>
              )}
              
              {cartTotals.sgst_amount > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <i className="ri-percent-line text-gray-700 text-base"></i>
                    <span className="text-gray-900 font-medium">SGST/UTGST ({cartTotals.sgst_rate}%)</span>
                  </div>
                  <span className="text-gray-700">₹{cartTotals.sgst_amount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between items-center pt-2 border-t">
                {appliedCoupon ? (
                  <>
                    <div className="flex items-center gap-2">
                      <i className="ri-coupon-line text-green-600 text-base"></i>
                      <span className="text-gray-900 font-medium">Coupon Applied</span>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-semibold">
                        {appliedCoupon.code}
                      </span>
                    </div>
                    <button 
                      onClick={handleRemoveCoupon}
                      className="text-red-600 hover:text-red-700 transition-colors p-1"
                      title="Remove coupon"
                    >
                      <i className="ri-delete-bin-line text-lg"></i>
                    </button>
                  </>
                ) : (
                  <>
                    <span className="text-gray-900 font-medium">Have a coupon?</span>
                    <button 
                      onClick={handleOpenCouponModal}
                      className="text-[#FFC107] font-medium flex items-center gap-1 hover:text-[#FFB300] transition-colors"
                    >
                      Apply Coupon <i className="ri-arrow-right-s-line"></i>
                    </button>
                  </>
                )}
              </div>

              <div className="flex justify-between items-center pt-3 border-t-2 border-gray-300">
                <span className="text-gray-900 font-bold text-base">Grand total</span>
                <span className="text-gray-900 font-bold text-base">₹{Math.max(0, cartTotals.grand_total - couponDiscount - walletAmountUsed).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="bg-black text-white rounded-lg p-3 flex justify-between items-center">
            <span className="text-sm">Your total savings</span>
            <span className="font-bold text-base">₹{(cartTotals.savings + couponDiscount).toFixed(2)}</span>
          </div>

          {/* Branch stock check result */}
          {stockCheck.loading && (
            <div className="flex items-center gap-2 text-sm text-gray-500 px-1">
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
              Checking item availability at your delivery location…
            </div>
          )}
          {!stockCheck.loading && stockCheck.unavailable.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <i className="ri-error-warning-line text-red-500 text-lg"></i>
                <p className="text-sm font-semibold text-red-700">
                  {stockCheck.unavailable.length} item{stockCheck.unavailable.length > 1 ? 's' : ''} not available at your delivery location
                </p>
              </div>
              <div className="space-y-2">
                {stockCheck.unavailable.map(item => (
                  <div key={item.cart_item_id} className="flex items-center justify-between text-xs text-red-600">
                    <span className="truncate flex-1 mr-2">{item.name}</span>
                    <span className="flex-shrink-0 bg-red-100 px-2 py-0.5 rounded font-medium">
                      {item.available === 0 ? 'Out of stock' : `Only ${item.available} left`}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-red-500 mt-3">Please remove these items or choose a different address to continue.</p>
            </div>
          )}

          <button
            onClick={handleCheckout}
            disabled={placingOrder || stockCheck.loading || stockCheck.unavailable.length > 0}
            className="w-full bg-[#FFC107] hover:bg-[#FFB300] text-gray-900 font-bold py-4 rounded-lg text-base transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {placingOrder ? 'Processing...' : `Checkout ₹${Math.max(0, cartTotals.grand_total - couponDiscount - walletAmountUsed).toFixed(2)}`}
          </button>
        </div>
      </div>

      {/* Coupon Modal */}
      <Dialog
        visible={showCouponModal}
        onHide={() => setShowCouponModal(false)}
        style={{ width: '90vw', maxWidth: '500px' }}
        modal
        dismissableMask
        className="coupon-modal"
      >
        {/* Coupon Modal Content - same as original */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Apply Coupon</h2>
            <button 
              onClick={() => setShowCouponModal(false)}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <i className="ri-close-line text-xl text-gray-600"></i>
            </button>
          </div>
          <div className="mb-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="Enter coupon code"
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC107] text-sm"
              />
              <button
                onClick={() => handleApplyCoupon(couponCode)}
                disabled={applyingCoupon || !couponCode}
                className="px-6 py-2.5 bg-[#FFC107] hover:bg-[#FFB300] text-gray-900 font-bold rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {applyingCoupon ? 'Applying...' : 'Apply'}
              </button>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Available Coupons</h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {availableCoupons.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-4">No coupons available</p>
              ) : (
                availableCoupons.map((coupon) => (
                  <div key={coupon.id} className="border border-gray-200 rounded-lg p-3 hover:border-[#FFC107] transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold text-gray-900">{coupon.code}</span>
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                            {coupon.discount_type === 'percentage' ? `${coupon.discount_value}% OFF` : `₹${coupon.discount_value} OFF`}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mb-1">{coupon.description}</p>
                        {renderCouponScope(coupon)}
                        {coupon.min_cart_value > 0 && (
                          <p className="text-xs text-gray-500">Min. cart value: ₹{coupon.min_cart_value}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleApplyCoupon(coupon.code, true)}
                        disabled={applyingCoupon}
                        className="ml-2 px-3 py-1 text-xs bg-[#FFC107] hover:bg-[#FFB300] text-gray-900 font-semibold rounded transition-colors disabled:opacity-50"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </Dialog>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 text-center">
            <div className="mb-6 flex justify-center">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
                <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center">
                  <i className="ri-check-line text-white text-5xl"></i>
                </div>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Your Order Has Been
            </h2>
            <h2 className="text-2xl font-bold text-gray-900 mb-8">
              Successfully Placed
            </h2>
            <button
              onClick={handleContinueShopping}
              className="w-full bg-[#FFC107] hover:bg-[#FFB300] text-gray-900 font-bold py-4 rounded-full text-lg transition-colors flex items-center justify-center gap-2"
            >
              Continue Shopping
              <i className="ri-arrow-right-line text-xl"></i>
            </button>
          </div>
        </div>
      )}

      </>
      )}

      <div className="mt-16">
        <Footer data={[]} />
      </div>
    </div>
  );
};

export default PlaceOrderPage;