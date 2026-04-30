import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Dialog } from 'primereact/dialog';
import Header from '@common/Header';
import Footer from '@common/Footer';
import { getCart, clearCart } from '../../redux/slices/cartSlice';
import { placeOrderFromCart, clearOrderStatus } from '../../redux/slices/orderSlice';
import { fetchUserAddresses } from '../../redux/slices/addressSlice';

const PlaceOrderPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const addressId = searchParams.get('address_id');
  const hasFetchedData = useRef(false);
  
  // Redux state
  const { items: cartItems, loading: cartLoading } = useSelector((state) => state.cart);
  const { addresses } = useSelector((state) => state.address);
  const { loading: orderLoading, orderSuccess, orderId, error: orderError } = useSelector((state) => state.order);
  
  const [address, setAddress] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [orderType, setOrderType] = useState('home_delivery');
  const [paymentMethod, setPaymentMethod] = useState('cash_on_delivery');
  const [minDate, setMinDate] = useState('');
  const [cartTotals, setCartTotals] = useState({ 
    subtotal_mrp: 0,
    subtotal_selling_price: 0,
    product_discount: 0, 
    promo_discount: 0, 
    savings: 0, 
    total: 0,
    handling_fee: 10,
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
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

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
      const handling_fee = 10;
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
      
      const token = localStorage.getItem('token');
      const userDetails = JSON.parse(localStorage.getItem('userDetails') || '{}');
      
      if (token && userDetails?.id) {
        await dispatch(getCart());
        await dispatch(fetchUserAddresses(userDetails.id));
      }
    };
    
    fetchData();
  }, [dispatch]);

  // ✅ FIXED: Address set from Redux addresses - no infinite loop
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
          fullAddress: addressParts.join(', ')
        });
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
    try {
      console.log('Update quantity - needs cartSlice implementation');
      await dispatch(getCart());
    } catch (error) {
      console.error('Error updating quantity:', error);
    } finally {
      setUpdatingItems(prev => ({ ...prev, [cartItemId]: false }));
    }
  };

  const setDirectQuantity = async (cartItemId, productId, weight, newQuantity) => {
    if (newQuantity === '') return;
    if (newQuantity.length > 1 && newQuantity.startsWith('0')) return;

    const quantity = parseInt(newQuantity);
    if (isNaN(quantity) || quantity < 1) return;

    setUpdatingItems(prev => ({ ...prev, [cartItemId]: true }));
    try {
      console.log('Set quantity - needs cartSlice implementation');
      await dispatch(getCart());
    } catch (error) {
      console.error('Error updating quantity:', error);
    } finally {
      setUpdatingItems(prev => ({ ...prev, [cartItemId]: false }));
    }
  };

  const handleQuantityBlur = async (cartItemId, productId, weight, value) => {
    if (value === '' || parseInt(value) < 1) {
      setUpdatingItems(prev => ({ ...prev, [cartItemId]: true }));
      try {
        console.log('Quantity blur - needs cartSlice implementation');
        await dispatch(getCart());
      } catch (error) {
        console.error('Error updating quantity:', error);
      } finally {
        setUpdatingItems(prev => ({ ...prev, [cartItemId]: false }));
      }
    }
  };

  const fetchAvailableCoupons = async () => {
    setAvailableCoupons([]);
  };

  const handleApplyCoupon = async (code) => {
    if (!code) {
      alert('Please enter a coupon code');
      return;
    }
    alert('Coupon functionality coming soon');
    setShowCouponModal(false);
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
      
      await dispatch(placeOrderFromCart({
        userId: userDetails.id,
        totalPrice: cartTotals.grand_total.toFixed(2),
        addressId: addressId,
        paymentMethod: paymentMethod
      })).unwrap();
      
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Failed to place order. Please try again.');
      setPlacingOrder(false);
    }
  };

  // Handle order success
  useEffect(() => {
    if (orderSuccess && orderId) {
      dispatch(clearCart());
      setShowSuccessModal(true);
      dispatch(clearOrderStatus());
    }
  }, [orderSuccess, orderId, dispatch]);

  // Handle order error
  useEffect(() => {
    if (orderError) {
      alert(typeof orderError === 'string' ? orderError : 'Failed to place order. Please try again.');
      dispatch(clearOrderStatus());
      setPlacingOrder(false);
    }
  }, [orderError, dispatch]);

  const handleOnlinePayment = async (orderData) => {
    alert('Online payment coming soon. Please use Cash on Delivery.');
    setPlacingOrder(false);
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

          {/* Select Order Type */}
          <div className="bg-white rounded-lg">
            <h3 className="font-bold text-gray-900 mb-4 text-base">Select Order Type</h3>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  orderType === 'home_delivery' ? 'border-[#FFC107]' : 'border-gray-300'
                }`}>
                  {orderType === 'home_delivery' && (
                    <div className="w-3 h-3 rounded-full bg-[#FFC107]"></div>
                  )}
                </div>
                <input
                  type="radio"
                  name="orderType"
                  value="home_delivery"
                  checked={orderType === 'home_delivery'}
                  onChange={(e) => setOrderType(e.target.value)}
                  className="hidden"
                />
                <span className="text-sm text-gray-900 font-medium">Home Delivery</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  orderType === 'in_store_pickup' ? 'border-[#FFC107]' : 'border-gray-300'
                }`}>
                  {orderType === 'in_store_pickup' && (
                    <div className="w-3 h-3 rounded-full bg-[#FFC107]"></div>
                  )}
                </div>
                <input
                  type="radio"
                  name="orderType"
                  value="in_store_pickup"
                  checked={orderType === 'in_store_pickup'}
                  onChange={(e) => setOrderType(e.target.value)}
                  className="hidden"
                />
                <span className="text-sm text-gray-900 font-medium">In-Store Pick Up</span>
              </label>
            </div>

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
                          <div className="w-16 h-16 bg-white rounded-lg border border-gray-200 p-1 flex items-center justify-center">
                            <img
                              src={imageUrl}
                              alt={item.name}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                e.target.src = 'https://via.placeholder.com/100?text=No+Image';
                              }}
                            />
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
                <span className="text-gray-900 font-bold text-base">₹{cartTotals.grand_total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="bg-black text-white rounded-lg p-3 flex justify-between items-center">
            <span className="text-sm">Your total savings</span>
            <span className="font-bold text-base">₹{cartTotals.savings.toFixed(2)}</span>
          </div>

          <button
            onClick={handleCheckout}
            disabled={placingOrder}
            className="w-full bg-[#FFC107] hover:bg-[#FFB300] text-gray-900 font-bold py-4 rounded-lg text-base transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {placingOrder ? 'Processing...' : `Checkout ₹${cartTotals.grand_total.toFixed(2)}`}
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
                        {coupon.min_cart_value > 0 && (
                          <p className="text-xs text-gray-500">Min. cart value: ₹{coupon.min_cart_value}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleApplyCoupon(coupon.code)}
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

      <div className="mt-16">
        <Footer data={[]} />
      </div>
    </div>
  );
};

export default PlaceOrderPage;