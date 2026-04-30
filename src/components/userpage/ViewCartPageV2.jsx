// New Cart & Checkout Flow - Matches design from screenshots
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Toast } from "primereact/toast";
import { Dialog } from 'primereact/dialog';

// Components
import Header from '@common/Header';
import Footer from '@common/Footer';
import UserLoader from '@userpage-pages/UserLoader';
import { API_CONSTANTS } from "@constants/apiurl";
import { ROUTES_CONSTANTS } from "@constants/routesurl";
import { allApi, allApiWithHeaderToken } from "@api/api";
import { SHOP_INFO } from "@config/srirammart.config";
import { useDispatch, useSelector } from "react-redux";
import { updateCartQuantity, removeFromCart, getCart } from "../../redux/slices/cartSlice";
import { SHOP_INFO } from "@config/srirammart.config";

const ViewCartV2 = () => {
  const [menuList, setMenuList] = useState([]);
  const [loader, setLoader] = useState(false);
  const [updatingItems, setUpdatingItems] = useState({});
  const [cartTotals, setCartTotals] = useState({ subtotal: 0, savings: 0, total: 0 });
  const [applicableDiscounts, setApplicableDiscounts] = useState([]);
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [handlingCharge] = useState(10); // Fixed handling charge
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [showItemsAccordion, setShowItemsAccordion] = useState(false);
  
  // Delivery & Address states
  const [deliveryAddress, setDeliveryAddress] = useState(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [orderType, setOrderType] = useState('home_delivery'); // 'home_delivery' or 'in_store_pickup'
  const [orderingFor, setOrderingFor] = useState('myself'); // 'myself' or 'someone_else'
  const [addressType, setAddressType] = useState('home'); // 'home', 'office', 'hotel'
  
  // Address form states
  const [addressForm, setAddressForm] = useState({
    name: '',
    flatHouseNo: '',
    floor: '',
    area: '',
    city: '',
    state: ''
  });
  
  const { t } = useTranslation("msg");
  const navigate = useNavigate();
  const toast = useRef(null);
  const dispatch = useDispatch();
  const cart = useSelector(state => state.cart.items || []);

  const handleSearch = (query) => {
  };

  // Time slots
  const timeSlots = [
    { id: 1, label: '8 AM - 11 AM', value: '08:00-11:00' },
    { id: 2, label: '11 AM - 1 PM', value: '11:00-13:00' },
    { id: 3, label: '1 PM - 3 PM', value: '13:00-15:00' },
    { id: 4, label: '3 PM - 5 PM', value: '15:00-17:00' },
    { id: 5, label: '7 PM - 9 PM', value: '19:00-21:00' }
  ];

  const updateQuantity = async (cartItemId, productId, weight, amount) => {
    const item = cart.find(i => i.cart_item_id === cartItemId);
    if (!item) return;
    
    const newQuantity = item.quantity + amount;
    if (newQuantity < 1) return;
    
    setUpdatingItems(prev => ({ ...prev, [cartItemId]: true }));
    try {
      await dispatch(updateCartQuantity({ productId, weight, quantity: newQuantity })).unwrap();
    } catch (error) {
      // Error handled by store
    } finally {
      setUpdatingItems(prev => ({ ...prev, [cartItemId]: false }));
    }
  };

  const removeItem = async (cartItemId) => {
    setUpdatingItems(prev => ({ ...prev, [cartItemId]: true }));
    try {
      await dispatch(removeFromCart({ cartItemId })).unwrap();
    } catch (error) {
      // Error handled by store
    } finally {
      setUpdatingItems(prev => ({ ...prev, [cartItemId]: false }));
    }
  };

  // Fetch cart with totals
  const fetchCartWithTotals = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await allApiWithHeaderToken(API_CONSTANTS.CART_URL, "", "get");
        if (response?.status === 200 && response.data.success) {
          const cartData = response.data.data;
          
          setCartTotals({
            subtotal: parseFloat(cartData.subtotal || 0),
            savings: parseFloat(cartData.savings || 0),
            total: parseFloat(cartData.total || 0)
          });
          // Update redux cart
          dispatch(getCart());
          window.dispatchEvent(new CustomEvent('cartUpdated', { detail: cartData.items || [] }));
          
          fetchApplicableDiscounts();
        }
      } catch (error) {
        // Error handled
      }
    }
  };

  // Fetch applicable discounts
  const fetchApplicableDiscounts = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await allApiWithHeaderToken(API_CONSTANTS.CART_APPLICABLE_DISCOUNTS_URL, "", "get");
        if (response?.status === 200 && response.data.success) {
          const discounts = response.data.data.discounts || [];
          setApplicableDiscounts(discounts);
          
          const qualifiedDiscounts = discounts.filter(d => d.is_qualified);
          if (qualifiedDiscounts.length > 0) {
            const bestDiscount = qualifiedDiscounts.reduce((best, current) => 
              current.discount_amount > best.discount_amount ? current : best
            );
            setAppliedDiscount(bestDiscount);
          } else {
            setAppliedDiscount(null);
          }
        }
      } catch (error) {
        // Error handled
      }
    }
  };

  const fetchMenuList = useCallback(() => {
    setLoader(true);
    allApi(API_CONSTANTS.MENU_LIST_URL, "", "get")
      .then((response) => {
        if (response.status === 200) {
          let data = response?.data.filter((item, index) => index <= 6);
          data.push({ name: t("about_us") });
          setMenuList(data);
        }
      })
      .finally(() => setLoader(false));
  }, [t]);

  // Fetch user's saved addresses
  const fetchSavedAddresses = async () => {
    const token = localStorage.getItem('token');
    const userDetails = JSON.parse(localStorage.getItem("userDetails"));
    
    if (token && userDetails?.id) {
      try {
        const response = await allApiWithHeaderToken(`${API_CONSTANTS.COMMON_CUSTOMERS_URL}/${userDetails.id}`, "", "get");
        if (response?.status === 200) {
          const addresses = response?.data?.addresses || [];
          setSavedAddresses(addresses);
          
          // Auto-select first address if available
          if (addresses.length > 0 && !deliveryAddress) {
            const firstAddress = addresses[0];
            setSelectedAddressId(firstAddress.id);
            setDeliveryAddress(`${firstAddress.landmark}, ${firstAddress.city}, ${firstAddress.state}, ${firstAddress.zip_code}, ${firstAddress.country}`);
          }
        }
      } catch (error) {
        console.error("Failed to fetch addresses:", error);
      }
    }
  };

  // Handle address selection from modal
  const handleSelectAddress = (address) => {
    setSelectedAddressId(address.id);
    setDeliveryAddress(`${address.landmark}, ${address.city}, ${address.state}, ${address.zip_code}, ${address.country}`);
    setShowAddressModal(false);
    
    toast.current?.show({
      severity: "success",
      summary: "Address Selected",
      detail: "Delivery address updated",
      life: 2000,
    });
  };

  // Handle use current location
  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          
          // Use Google Maps Geocoding to get address from coordinates
          if (window.google && window.google.maps) {
            const geocoder = new window.google.maps.Geocoder();
            const latlng = { lat: latitude, lng: longitude };
            
            geocoder.geocode({ location: latlng }, (results, status) => {
              if (status === 'OK' && results[0]) {
                setDeliveryAddress(results[0].formatted_address);
                setShowAddressModal(false);
                
                toast.current?.show({
                  severity: "success",
                  summary: "Location Detected",
                  detail: "Using your current location",
                  life: 2000,
                });
              }
            });
          } else {
            setDeliveryAddress(`Lat: ${latitude}, Lng: ${longitude}`);
            setShowAddressModal(false);
          }
        },
        (error) => {
          toast.current?.show({
            severity: "error",
            summary: "Location Error",
            detail: "Unable to get your location. Please enable location services.",
            life: 3000,
          });
        }
      );
    } else {
      toast.current?.show({
        severity: "error",
        summary: "Not Supported",
        detail: "Geolocation is not supported by your browser",
        life: 3000,
      });
    }
  };

  useEffect(() => {
    fetchMenuList();
    fetchCartWithTotals();
    fetchSavedAddresses();
    
    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setSelectedDate(tomorrow.toISOString().split('T')[0]);
    
    // Load Google Maps API for location services
    const googleMapsScript = document.createElement('script');
    googleMapsScript.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&libraries=places`;
    googleMapsScript.async = true;
    document.body.appendChild(googleMapsScript);
    
    return () => {
      if (document.body.contains(googleMapsScript)) {
        document.body.removeChild(googleMapsScript);
      }
    };
  }, [fetchMenuList]);

  // Calculate grand total
  const grandTotal = cartTotals.total - Number(appliedDiscount?.discount_amount || 0) + deliveryCharge + handlingCharge;

  return (
    <>
      <Toast ref={toast} position="top-right" />
      {loader ? (
        <UserLoader />
      ) : (
        <>
          <Header onSearch={handleSearch} />
          
          <div className="p-4 md:p-6 mt-16 w-full max-w-screen-xl mx-auto">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <i className="ri-shopping-cart-line text-6xl text-gray-300 mb-4"></i>
                <p className="text-xl text-gray-500 mb-6">{t("no_product_added")}</p>
                <button 
                  onClick={() => navigate('/')}
                  className="px-6 py-3 bg-[#C7A756] text-white rounded-lg hover:bg-[#b4974c] transition-colors"
                >
                  {t("continue_shopping")}
                </button>
              </div>
            ) : (
              <div className="max-w-2xl mx-auto space-y-4">
                {/* Bill Details Card */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <i className="ri-file-list-3-line text-xl"></i>
                    <h2 className="text-xl font-bold">Bill details</h2>
                  </div>
                  
                  <div className="space-y-3">
                    {/* Sub total */}
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Sub total</span>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 line-through">₹{cartTotals.subtotal.toFixed(0)}</span>
                        <span className="font-semibold">₹{cartTotals.total.toFixed(0)}</span>
                      </div>
                    </div>
                    
                    {/* MRP */}
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 ml-6">MRP</span>
                      <span className="text-gray-500">₹{cartTotals.subtotal.toFixed(0)}</span>
                    </div>
                    
                    {/* Product Discount */}
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 ml-6">Product Discount</span>
                      <span className="text-green-600">₹{cartTotals.savings.toFixed(0)}</span>
                    </div>
                    
                    {/* Promo discount */}
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <i className="ri-gift-line text-lg"></i>
                        <span className="text-gray-700">Promo discount</span>
                      </div>
                      <span className="text-green-600">
                        {appliedDiscount ? `-₹${Number(appliedDiscount.discount_amount).toFixed(0)}` : '-₹0'}
                      </span>
                    </div>
                    
                    {/* Delivery charge */}
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <i className="ri-truck-line text-lg"></i>
                        <span className="text-gray-700">Delivery charge</span>
                      </div>
                      <span className="font-semibold">₹{deliveryCharge.toFixed(0)}</span>
                    </div>
                    
                    {/* Handling charge */}
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <i className="ri-hand-heart-line text-lg"></i>
                        <span className="text-gray-700">Handling charge</span>
                      </div>
                      <span className="font-semibold">₹{handlingCharge}</span>
                    </div>
                    
                    {/* Apply Coupon */}
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="font-semibold">Apply Coupon</span>
                      <button className="text-yellow-600 font-semibold flex items-center gap-1">
                        Select <i className="ri-arrow-down-s-line"></i>
                      </button>
                    </div>
                  </div>
                  
                  {/* Grand total */}
                  <div className="flex justify-between items-center mt-4 pt-4 border-t">
                    <span className="text-lg font-bold">Grand total</span>
                    <span className="text-lg font-bold">₹{grandTotal.toFixed(0)}</span>
                  </div>
                  
                  {/* Your total savings */}
                  <div className="bg-black text-white rounded-lg p-3 mt-4 flex justify-between items-center">
                    <span className="font-semibold">Your total savings</span>
                    <span className="font-bold">₹{(cartTotals.savings + Number(appliedDiscount?.discount_amount || 0)).toFixed(0)}</span>
                  </div>
                </div>

                {/* Delivery Location Card */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg mb-2">Delivery Location</h3>
                      {deliveryAddress ? (
                        <div className="flex items-start gap-2">
                          <i className="ri-map-pin-line text-green-600 text-xl mt-1"></i>
                          <p className="text-gray-700">{deliveryAddress}</p>
                        </div>
                      ) : (
                        <p className="text-gray-500">No address selected</p>
                      )}
                    </div>
                    <button 
                      onClick={() => setShowAddressModal(true)}
                      className="text-blue-600 font-semibold hover:underline"
                    >
                      Change
                    </button>
                  </div>
                </div>

                {/* Expected Date & Time Card */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-bold text-lg mb-3">Expected date & Time</h3>
                  
                  {/* Date Picker */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 bg-white rounded-lg p-3 border">
                      <i className="ri-calendar-line text-xl"></i>
                      <input
                        type="date"
                        value={selectedDate || ''}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="flex-1 outline-none"
                      />
                    </div>
                  </div>
                  
                  {/* Time Slots */}
                  <div className="grid grid-cols-2 gap-3">
                    {timeSlots.map((slot) => (
                      <button
                        key={slot.id}
                        onClick={() => setSelectedTimeSlot(slot.value)}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          selectedTimeSlot === slot.value
                            ? 'border-yellow-500 bg-yellow-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        {slot.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Select Order Type Card */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="font-bold text-lg mb-4">Select Order Type</h3>
                  
                  <div className="flex gap-4">
                    <button
                      onClick={() => setOrderType('home_delivery')}
                      className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                        orderType === 'home_delivery'
                          ? 'border-yellow-500 bg-yellow-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          orderType === 'home_delivery' ? 'border-yellow-500' : 'border-gray-300'
                        }`}>
                          {orderType === 'home_delivery' && (
                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                          )}
                        </div>
                        <span className="font-semibold">Home Delivery</span>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => setOrderType('in_store_pickup')}
                      className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                        orderType === 'in_store_pickup'
                          ? 'border-yellow-500 bg-yellow-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          orderType === 'in_store_pickup' ? 'border-yellow-500' : 'border-gray-300'
                        }`}>
                          {orderType === 'in_store_pickup' && (
                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                          )}
                        </div>
                        <span className="font-semibold">In-Store Pick Up</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* See Items Accordion */}
                <div className="bg-blue-50 rounded-lg">
                  <button
                    onClick={() => setShowItemsAccordion(!showItemsAccordion)}
                    className="w-full p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <i className="ri-shopping-basket-line text-xl"></i>
                      <span className="font-semibold">see Itemes</span>
                    </div>
                    <i className={`ri-arrow-${showItemsAccordion ? 'up' : 'down'}-s-line text-xl`}></i>
                  </button>
                  
                  {showItemsAccordion && (
                    <div className="px-4 pb-4 space-y-3">
                      {cart.map((item) => (
                        <div key={item.cart_item_id} className="bg-white rounded-lg p-3 flex gap-3">
                          <img
                            src={item.image_url || item.image}
                            alt={item.name}
                            className="w-16 h-16 object-cover rounded"
                          />
                          <div className="flex-1">
                            <p className="font-semibold text-sm">{item.name}</p>
                            <p className="text-xs text-gray-500">{item.weight}</p>
                            <div className="flex items-center justify-between mt-1">
                              <span className="font-bold">₹{item.price}</span>
                              <div className="flex items-center gap-2 border rounded">
                                <button
                                  onClick={() => updateQuantity(item.cart_item_id, item.id, item.weight, -1)}
                                  className="px-2 py-1"
                                  disabled={item.quantity <= 1}
                                >
                                  <i className="ri-subtract-line"></i>
                                </button>
                                <span className="px-2">{item.quantity}</span>
                                <button
                                  onClick={() => updateQuantity(item.cart_item_id, item.id, item.weight, 1)}
                                  className="px-2 py-1"
                                >
                                  <i className="ri-add-line"></i>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Who you are ordering for? */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="font-bold text-lg mb-4">Who you are ordering for?</h3>
                  
                  <div className="flex gap-4">
                    <button
                      onClick={() => setOrderingFor('myself')}
                      className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                        orderingFor === 'myself'
                          ? 'border-yellow-500 bg-yellow-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          orderingFor === 'myself' ? 'border-yellow-500' : 'border-gray-300'
                        }`}>
                          {orderingFor === 'myself' && (
                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                          )}
                        </div>
                        <span className="font-semibold">Myself</span>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => setOrderingFor('someone_else')}
                      className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                        orderingFor === 'someone_else'
                          ? 'border-yellow-500 bg-yellow-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          orderingFor === 'someone_else' ? 'border-yellow-500' : 'border-gray-300'
                        }`}>
                          {orderingFor === 'someone_else' && (
                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                          )}
                        </div>
                        <span className="font-semibold">Someone else</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Save address as */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="font-bold text-lg mb-2">Save address as *</h3>
                  
                  <div className="grid grid-cols-3 gap-3 mt-4">
                    <button
                      onClick={() => setAddressType('home')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        addressType === 'home'
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <i className="ri-home-4-line text-2xl"></i>
                        <span className="font-semibold">Home</span>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => setAddressType('office')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        addressType === 'office'
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <i className="ri-briefcase-line text-2xl"></i>
                        <span className="font-semibold">Office</span>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => setAddressType('hotel')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        addressType === 'hotel'
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <i className="ri-hotel-line text-2xl"></i>
                        <span className="font-semibold">Hotel</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Address Form */}
                <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
                  <input
                    type="text"
                    placeholder="Enter Name"
                    value={addressForm.name}
                    onChange={(e) => setAddressForm({...addressForm, name: e.target.value})}
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-yellow-500 focus:outline-none"
                  />
                  
                  <input
                    type="text"
                    placeholder="Flat / House no / Building name *"
                    value={addressForm.flatHouseNo}
                    onChange={(e) => setAddressForm({...addressForm, flatHouseNo: e.target.value})}
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-yellow-500 focus:outline-none"
                  />
                  
                  <input
                    type="text"
                    placeholder="Floor ( optional )"
                    value={addressForm.floor}
                    onChange={(e) => setAddressForm({...addressForm, floor: e.target.value})}
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-yellow-500 focus:outline-none"
                  />
                  
                  <input
                    type="text"
                    placeholder="Ognaj"
                    value={addressForm.area}
                    onChange={(e) => setAddressForm({...addressForm, area: e.target.value})}
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-yellow-500 focus:outline-none"
                  />
                  
                  <input
                    type="text"
                    placeholder="Ahmedabad"
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({...addressForm, city: e.target.value})}
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-yellow-500 focus:outline-none"
                  />
                  
                  <input
                    type="text"
                    placeholder="Gujarat"
                    value={addressForm.state}
                    onChange={(e) => setAddressForm({...addressForm, state: e.target.value})}
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-yellow-500 focus:outline-none"
                  />
                </div>

                {/* Map View - Placeholder */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="h-64 bg-gray-200 relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <i className="ri-map-pin-line text-6xl text-gray-400 mb-2"></i>
                        <p className="text-gray-500">Map will load here</p>
                        <p className="text-xs text-gray-400 mt-1">Google Maps Integration</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-white">
                    <h3 className="font-bold text-lg mb-2">Delivering your order to</h3>
                    <div className="bg-green-50 border-2 border-green-500 rounded-lg p-3">
                      <p className="font-semibold">
                        {addressForm.flatHouseNo || '197/4272'} {addressForm.area || 'Ognaj'} {addressForm.area || 'Ognaj'}
                      </p>
                      <p className="text-gray-600">
                        {addressForm.city || 'Ahmedabad'}, {addressForm.state || 'Gujarat'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Proceed Button */}
                <button
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-4 rounded-lg text-lg transition-colors"
                  onClick={() => {
                    toast.current?.show({
                      severity: "info",
                      summary: "Coming Soon",
                      detail: "Checkout flow in progress",
                      life: 3000,
                    });
                  }}
                >
                  Proceed to Payment
                </button>
              </div>
            )}
          </div>

          <div className="mt-16">
            <Footer data={menuList}/>
          </div>
          
          {/* Address Selection Modal */}
          <Dialog
            header="Select address"
            visible={showAddressModal}
            style={{ width: '90vw', maxWidth: '500px' }}
            onHide={() => setShowAddressModal(false)}
            draggable={false}
          >
            <div className="space-y-4">
              {/* Add new address button */}
              <button
                onClick={() => {
                  setShowAddressModal(false);
                  // Scroll to address form
                  window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                }}
                className="w-full p-4 border-2 border-yellow-500 rounded-lg flex items-center justify-between hover:bg-yellow-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <i className="ri-add-circle-line text-2xl text-yellow-600"></i>
                  <span className="font-semibold text-yellow-600">Add new address</span>
                </div>
                <i className="ri-arrow-right-s-line text-xl text-yellow-600"></i>
              </button>
              
              {/* Use current location button */}
              <button
                onClick={handleUseCurrentLocation}
                className="w-full p-4 border-2 border-gray-300 rounded-lg flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <i className="ri-map-pin-user-line text-2xl text-gray-700"></i>
                  <span className="font-semibold text-gray-700">Use current location</span>
                </div>
              </button>
              
              {/* Your saved addresses */}
              {savedAddresses.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-700 mb-3">Your saved addresses</h3>
                  <div className="space-y-3">
                    {savedAddresses.map((address) => (
                      <div
                        key={address.id}
                        onClick={() => handleSelectAddress(address)}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          selectedAddressId === address.id
                            ? 'border-yellow-500 bg-yellow-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                            <i className={`ri-${address.address_type === 'home' ? 'home' : address.address_type === 'office' ? 'briefcase' : 'hotel'}-line text-yellow-600`}></i>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-semibold capitalize">{address.address_type || 'Home'}</span>
                              <button className="text-gray-400 hover:text-gray-600">
                                <i className="ri-more-2-fill"></i>
                              </button>
                            </div>
                            <p className="text-sm text-gray-600">
                              {address.landmark}, {address.city}, {address.state}, {address.zip_code}, {address.country}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Proceed button */}
              <button
                onClick={() => setShowAddressModal(false)}
                disabled={!selectedAddressId && !deliveryAddress}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Proceed
              </button>
              
              {/* Choose address at next step */}
              <button
                onClick={() => setShowAddressModal(false)}
                className="w-full bg-gray-800 hover:bg-gray-900 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Choose address at next step
              </button>
            </div>
          </Dialog>
        </>
      )}
    </>
  );
};

export default ViewCartV2;
