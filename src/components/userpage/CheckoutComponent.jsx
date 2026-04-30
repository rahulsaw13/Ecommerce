// Components
import InputTextComponent from "@common/InputTextComponent";
import UserLoader from '@userpage-pages/UserLoader';
import { allApiWithHeaderToken } from "@api/api";
import { API_CONSTANTS } from "@constants/apiurl";
import { ROUTES_CONSTANTS } from "@constants/routesurl";
import useCartStore from "@store";
import { SHOP_INFO } from "@config/srirammart.config";

// Utils
import { useState, useEffect, useRef } from 'react';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { useTranslation } from "react-i18next";
import { useFormik } from "formik";
import { useNavigate } from "react-router-dom";
import * as yup from "yup";
import { Toast } from "primereact/toast";

const initialValues = {
  coupon: "",
  phoneNumber: "",
  addressType: "home", // New field: home, office, other
  addressLabel: "", // For custom label when "other" is selected
  // Customer address
  flatLandmark: "",
  city: "",
  state: "",
  zipCode: "",
  country: "",
};

const CartItem = ({ item, onQuantityChange, onRemove }) => {
  const { t } = useTranslation("msg");
 
  return (
    <div className="flex sm:flex-row sm:items-center justify-between border-b pb-3 pe-3 sm:pe-0 sm:pb-4 mb-3 sm:mb-4 gap-3 sm:gap-0">
      {/* Product Image and Details */}
      <div className="flex items-start sm:items-center flex-1">
        <img src={item.image} alt={item.name} className="w-14 h-14 sm:w-16 sm:h-16 rounded-md flex-shrink-0" />
        <div className="ml-2 sm:ml-3 flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium truncate pr-2">{item.name}</p>
          <span className="text-gray-500 text-xs sm:text-sm font-[Tektur] block">{item.weight}</span>
          {/* Quantity Control */}
          <div className="flex items-center border rounded-lg w-fit mt-1 sm:mt-2">
            <button
              className="p-1 sm:p-1.5 text-gray-600 bg-[#e7e7e7] rounded-l-lg min-w-[28px] sm:min-w-[32px] h-7 sm:h-8 flex items-center justify-center"
              onClick={() => onQuantityChange(item.id, -1)}
            >
              <i className="ri-subtract-line text-xs sm:text-sm"></i>
            </button>
            <span className="px-2 sm:px-3 font-[Tektur] text-center text-xs sm:text-sm h-7 sm:h-8 flex items-center justify-center min-w-[32px] sm:min-w-[40px] bg-white">{item.quantity}</span>
            <button
              className="p-1 sm:p-1.5 text-gray-600 bg-[#e7e7e7] rounded-r-lg min-w-[28px] sm:min-w-[32px] h-7 sm:h-8 flex items-center justify-center"
              onClick={() => onQuantityChange(item.id, 1)}
            >
              <i className="ri-add-line text-xs sm:text-sm"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Price and Remove Button */}
      <div className="flex items-center justify-between sm:justify-end sm:space-x-3 sm:flex-shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center">
          {item?.discountedPrice < item?.actualPrice && (
            <span className="text-gray-500 font-thin line-through text-xs sm:text-sm font-[Tektur] sm:mr-2">
              ₹{item?.quantity * Number(item?.actualPrice)}
            </span>
          )}
          <span className="font-semibold font-[Tektur] text-sm sm:text-base">
            ₹{item?.quantity * Number(item?.discountedPrice)}
          </span>
        </div>
        <button 
          onClick={() => onRemove(item.id)}
          className="ml-3 sm:ml-2 p-1 hover:bg-gray-100 rounded transition-colors"
        >
          <i className="ri-delete-bin-line text-gray-500 text-base sm:text-lg"></i>
        </button>
      </div>
    </div>
  );
};

const CheckoutComponent = ({onOrderSuccess, cartItems = [], cartTotals = { subtotal: 0, savings: 0, total: 0 }, appliedDiscount = null}) => {
  const navigate = useNavigate();
  const [toggle, setToggle] = useState(false);
  const [addressToggle, setAddressToggle] = useState(false);
  const { t } = useTranslation("msg");
  const [cart, setCart] = useState([]);
  const [userData, setUserData] = useState({});
  const userDetails = JSON.parse(localStorage.getItem("userDetails"));
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [loader, setLoader] = useState(false);

  // Get clearCart and setGlobalCart methods from cart store
  const { clearCart, setCart: setGlobalCart } = useCartStore();
  const toast = useRef(null);

  const [finalTotal, setFinalTotal] = useState({
    totalPrice: 0,
    discount: 0,
    couponPrice: 0,
    finalPrice: 0
  });
  
  // Shipping calculation states
  const [shippingCostPerKm, setShippingCostPerKm] = useState(0);
  const [distance, setDistance] = useState(null);
  const [shippingCost, setShippingCost] = useState(0);
  const [isCalculatingDistance, setIsCalculatingDistance] = useState(false);
  const [addressSaved, setAddressSaved] = useState(false);

  const validationSchema = yup.object().shape({
    coupon: yup.string(),
    phoneNumber: yup.string().required(t("phone_number_is_required")),
    addressType: yup.string().required(t("address_type_is_required")),
    addressLabel: yup.string().when('addressType', {
      is: 'other',
      then: (schema) => schema.required(t("address_label_is_required")),
      otherwise: (schema) => schema
    }),
    flatLandmark: yup.string().required(t("flat_landmark_is_required")),
    city: yup.string().required(t("city_is_required")),
    state: yup.string().required(t("state_is_required")),
    zipCode: yup.string().required(t("zipcode_is_required")),
    country: yup.string().required(t("country_is_required"))
  });

  const onHandleSubmit = (value) =>{
    addOrder(value);
  };

  const formik = useFormik({
    initialValues: initialValues,
    onSubmit: onHandleSubmit,
    validationSchema: validationSchema,
    enableReinitialize: true,
    validateOnBlur: true,
  });

  const { values, errors, handleSubmit, handleChange, setFieldValue, touched } = formik;

  const addOrder = async (value) => {
    setIsProcessing(true);

    // Optimize product array creation and price calculation
    const products = cart.map(item => ({
      product_id: Number(item?.id),
      qty: Number(item?.quantity),
      weight: item?.weight || null
    }));
    
    // Use the actual selling price total (cartTotals.total), not MRP subtotal
    const sellingPriceTotal = cartTotals.total || cart.reduce((acc, item) => acc + Number(item.discountedPrice) * item.quantity, 0);
    
    // Calculate final total with cart discount
    const finalTotal = sellingPriceTotal - Number(appliedDiscount?.discount_amount || 0);
    
    console.log("Order Data:", {
      products,
      sellingPriceTotal,
      finalTotal,
      appliedDiscount
    });
    
    const orderData = {
      user_id: userDetails?.id,
      coupon: value?.coupon || "",
      tax_price: 0,
      handling_fee: 0,
      payment_status: "pending",
      order_status: "in_review",
      payment_mode: "online",
      products: products,
      total_price: finalTotal,
      discount_id: appliedDiscount?.id || null,
      discount_amount: Number(appliedDiscount?.discount_amount || 0),
      shipping_address: {
        address_type: value?.addressType || "home",
        address_label: value?.addressType === "other" ? value?.addressLabel : value?.addressType,
        flat_no: value?.flatLandmark || "",
        landmark: value?.flatLandmark || "",
        city: value?.city || "",
        state: value?.state || "",
        zip_code: value?.zipCode || "",
        country: value?.country || ""
      }
    };
    
    // Validate required fields
    if (!value?.flatLandmark || !value?.city || !value?.state || !value?.zipCode || !value?.country) {
      toast.current?.show({
        severity: "error",
        summary: t("error"),
        detail: "Please fill in all address fields",
        life: 3000,
      });
      setIsProcessing(false);
      return;
    }

    try {
      console.log("Creating payment intent with amount:", finalTotal);
      
      // Create payment intent first
      const paymentResponse = await allApiWithHeaderToken(
        API_CONSTANTS.PAYMENT_INTENT_CREATE,
        { amount: finalTotal },
        "post"
      );

      console.log("Payment response:", paymentResponse);
      console.log("Payment response data:", paymentResponse?.data);

      if (paymentResponse?.status === 200 && paymentResponse?.data) {
        const paymentData = paymentResponse.data;
        
        console.log("Payment data:", paymentData);
        
        // Check if Razorpay is loaded
        if (!window.Razorpay) {
          toast.current?.show({
            severity: "error",
            summary: t("error"),
            detail: "Payment gateway not loaded. Please refresh and try again.",
            life: 3000,
          });
          setIsProcessing(false);
          return;
        }
        
        // Initialize Razorpay
        const options = {
          key: paymentData.razorpay_key_id,
          amount: paymentData.amount,
          currency: "INR",
          name: "Srirammart",
          description: "Order Payment",
          order_id: paymentData.id, // Changed from razorpay_order_id to id
          handler: async function (response) {
            try {
              console.log("Payment success response:", response);
              
              // Verify payment
              const verifyRes = await allApiWithHeaderToken(
                API_CONSTANTS.PAYMENT_VERIFY,
                {
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                },
                "post"
              );

              console.log("Verify response:", verifyRes);

              if (verifyRes?.status === 200) {
                // Payment verified, now create order
                orderData.payment_status = "payment_paid";
                orderData.order_status = "paid";
                orderData.razorpay_payment_id = response.razorpay_payment_id;
                orderData.razorpay_order_id = response.razorpay_order_id;
                orderData.razorpay_signature = response.razorpay_signature;
                
                console.log("Creating order with data:", orderData);
                
                const orderResponse = await allApiWithHeaderToken(
                  API_CONSTANTS.COMMON_ORDER_URL,
                  orderData,
                  "post"
                );

                console.log("Order response:", orderResponse);

                if (orderResponse?.status === 201) {
                  // Clear the local cart state
                  setCart([]);
                  
                  // Show success message
                  toast.current?.show({
                    severity: "success",
                    summary: t("success"),
                    detail: "Payment successful! Order created.",
                    life: 3000,
                  });
                  
                  // Dispatch cart update event to sync across components
                  window.dispatchEvent(new CustomEvent('cartUpdated', { detail: [] }));
                  
                  // Close modal
                  onOrderSuccess();
                  
                  // Navigate to track order page after a short delay
                  setTimeout(() => {
                    navigate(ROUTES_CONSTANTS.TRACK_ORDER);
                  }, 1000);
                }
              }
            } catch (error) {
              console.error("Payment verification error:", error);
              toast.current?.show({
                severity: "error",
                summary: t("error"),
                detail: error?.response?.data?.message || "Payment verification failed",
                life: 3000,
              });
            } finally {
              setIsProcessing(false);
            }
          },
          prefill: {
            name: userDetails?.name,
            email: userDetails?.email,
            contact: value?.phoneNumber || userDetails?.phone_number
          },
          theme: {
            color: "#FFC107"
          },
          modal: {
            ondismiss: function() {
              setIsProcessing(false);
              toast.current?.show({
                severity: "warn",
                summary: "Payment Cancelled",
                detail: "You cancelled the payment",
                life: 3000,
              });
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        throw new Error(paymentResponse?.data?.message || "Failed to create payment intent");
      }
    } catch (err) {
      console.error("Order creation error:", err);
      console.error("Error response:", err?.response);
      const errorMessage = err?.response?.data?.message || 
                          err?.response?.data?.errors || 
                          err?.message || 
                          t("order_creation_failed");
      toast.current?.show({
        severity: "error",
        summary: t("error"),
        detail: errorMessage,
        life: 3000,
      });
      setIsProcessing(false);
    }
  };

  const accordianHandler=()=>{
    setToggle(!toggle)
  };

  const addressAccordianHandler=()=>{
    setAddressToggle(!addressToggle)
  };

  const updateQuantity = async (id, amount) => {
    const item = cart.find(i => i.id === id);
    if (!item) return;
    
    const newQuantity = item.quantity + amount;
    if (newQuantity < 1) return;
    
    try {
      // Call backend API to update quantity
      await allApiWithHeaderToken(
        API_CONSTANTS.CART_UPDATE_QUANTITY_URL,
        { product_id: id, weight: item.weight, quantity: newQuantity },
        "patch"
      );
      
      // Update local state
      const updatedCart = cart
        .map((cartItem) =>
          cartItem.id === id ? { ...cartItem, quantity: newQuantity } : cartItem
        )
        .filter((cartItem) => cartItem.quantity > 0);

      setCart(updatedCart);
      
      // Trigger cart update event
      window.dispatchEvent(new CustomEvent('cartUpdated', { detail: updatedCart }));
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to update quantity',
        life: 3000,
      });
    }
  };

  const removeItem = async (id) => {
    const item = cart.find(i => i.id === id);
    if (!item) return;
    
    try {
      // Find cart_item_id from the item
      const cartItemId = item.cart_item_id || item.id;
      
      // Call backend API to remove item
      await allApiWithHeaderToken(`${API_CONSTANTS.CART_URL}/${cartItemId}`, "", "delete");
      
      // Update local state
      const updatedCart = cart.filter((cartItem) => cartItem.id !== id);
      setCart(updatedCart);
      
      // Trigger cart update event
      window.dispatchEvent(new CustomEvent('cartUpdated', { detail: updatedCart }));
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to remove item',
        life: 3000,
      });
    }
  };

  const fetchUserList = async () => {
    setLoader(true);
    let userId = userDetails?.id;
    try{
        if(userId){
          allApiWithHeaderToken(`${API_CONSTANTS.COMMON_CUSTOMERS_URL}/${userId}`, "", "get")
          .then((response) => {
            if (response.status === 200) {
                let data = {
                    phoneNumber: response?.data?.phone_number,
                    addressId: response?.data?.addresses[0]?.id,
                    flatLandmark: response?.data?.addresses[0]?.landmark,
                    city: response?.data?.addresses[0]?.city,
                    zipCode: response?.data?.addresses[0]?.zip_code,
                    state: response?.data?.addresses[0]?.state,
                    country: response?.data?.addresses[0]?.country
                }
                setUserData(data);
                
                // Auto-prefill the form with user data
                if (data.phoneNumber) {
                  setFieldValue("phoneNumber", data.phoneNumber);
                }
                if (data.flatLandmark) {
                  setFieldValue("flatLandmark", data.flatLandmark);
                }
                if (data.city) {
                  setFieldValue("city", data.city);
                }
                if (data.zipCode) {
                  setFieldValue("zipCode", data.zipCode);
                }
                if (data.state) {
                  setFieldValue("state", data.state);
                }
                if (data.country) {
                  setFieldValue("country", data.country);
                }
            } 
          });
        }
    } catch (err){
      toast.current.show({
        severity: "error",
        summary: t("error"),
        detail: t("something_went_wrong"),
        life: 3000,
      });
    }finally {
      setLoader(false);
    }
  };
  
  // Fetch settings to get shipping cost per km and shop address
  const fetchSettings = async () => {
    try {
      const response = await allApiWithHeaderToken(API_CONSTANTS.COMMON_SETTINGS_URL, "", "get");
      if (response?.status === 200) {
        const settings = response?.data?.data || [];
        settings.forEach((setting) => {
          const attrs = setting.attributes || setting;
          if (attrs.key === "shipping_cost_per_km") {
            setShippingCostPerKm(parseFloat(attrs.value) || 0);
          }
          // You can add shop address setting here if needed
          // For now, we'll use a default address
        });
      }
    } catch (err) {
      console.error("Failed to fetch settings:", err);
    }
  };
  
  // Calculate distance using Google Maps Distance Matrix API with coordinates
  const calculateDistance = async (userAddress) => {
    if (!userAddress || !userAddress.city || !userAddress.state) {
      toast.current?.show({
        severity: "warn",
        summary: "Incomplete Address",
        detail: "Please fill all address fields",
        life: 3000,
      });
      return;
    }
    
    if (!window.google || !window.google.maps) {
      toast.current?.show({
        severity: "error",
        summary: "Maps Not Loaded",
        detail: "Google Maps is still loading. Please try again in a moment.",
        life: 3000,
      });
      return;
    }
    
    setIsCalculatingDistance(true);
    
    try {
      // Shop coordinates from SHOP_INFO
      const shopLat = parseFloat(SHOP_INFO.latitude);
      const shopLng = parseFloat(SHOP_INFO.longitude);
      
      // Construct full user address
      const destination = `${userAddress.flatLandmark}, ${userAddress.city}, ${userAddress.state}, ${userAddress.zipCode}, ${userAddress.country}`;
      
      // Create shop location from coordinates
      const shopLocation = new window.google.maps.LatLng(shopLat, shopLng);
      
      // Use Google Maps Distance Matrix API
      const service = new window.google.maps.DistanceMatrixService();
      
      service.getDistanceMatrix(
        {
          origins: [shopLocation],
          destinations: [destination],
          travelMode: window.google.maps.TravelMode.DRIVING,
          unitSystem: window.google.maps.UnitSystem.METRIC,
        },
        (response, status) => {
          if (status === 'OK' && response.rows[0].elements[0].status === 'OK') {
            const distanceInMeters = response.rows[0].elements[0].distance.value;
            const distanceInKm = (distanceInMeters / 1000).toFixed(2);
            
            setDistance(parseFloat(distanceInKm));
            
            // Calculate shipping cost
            const calculatedShippingCost = parseFloat(distanceInKm) * shippingCostPerKm;
            setShippingCost(calculatedShippingCost);
            
            toast.current?.show({
              severity: "success",
              summary: "Distance Calculated",
              detail: `Distance: ${distanceInKm} km, Shipping: ₹${calculatedShippingCost.toFixed(2)}`,
              life: 3000,
            });
          } else {
            console.error("Distance Matrix API error:", status, response);
            toast.current?.show({
              severity: "warn",
              summary: "Distance Calculation",
              detail: "Unable to calculate distance. Please check the address or try again.",
              life: 3000,
            });
          }
          setIsCalculatingDistance(false);
        }
      );
    } catch (err) {
      console.error("Distance calculation error:", err);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Failed to calculate distance",
        life: 3000,
      });
      setIsCalculatingDistance(false);
    }
  };
  
  // Handle save address button
  const handleSaveAddress = () => {
    // Validate address fields
    const addressFields = ['flatLandmark', 'city', 'state', 'zipCode', 'country'];
    const hasErrors = addressFields.some(field => errors[field]);
    const hasEmptyFields = addressFields.some(field => !values[field]);
    
    if (hasErrors || hasEmptyFields) {
      toast.current?.show({
        severity: "error",
        summary: "Validation Error",
        detail: "Please fill all address fields correctly",
        life: 3000,
      });
      return;
    }
    
    setAddressSaved(true);
    
    // Calculate distance
    calculateDistance({
      flatLandmark: values.flatLandmark,
      city: values.city,
      state: values.state,
      zipCode: values.zipCode,
      country: values.country
    });
  }; 

  useEffect(() => {
    // Use cart items passed from ViewCartPage
    if (cartItems && cartItems.length > 0) {
      // Transform backend cart format to checkout format
      const transformedCart = cartItems.map(item => ({
        id: item.id,
        cart_item_id: item.cart_item_id,
        name: item.name,
        image: item.image_url || item.image,
        weight: item.weight,
        quantity: item.quantity,
        discountedPrice: item.price,
        actualPrice: item.original_price || item.price
      }));
      setCart(transformedCart);
    }
    
    // Fetch user data and prefill
    fetchUserList();
    
    // Fetch settings for shipping cost per km
    fetchSettings();
    
    // Load Razorpay script
    const razorpayScript = document.createElement('script');
    razorpayScript.src = 'https://checkout.razorpay.com/v1/checkout.js';
    razorpayScript.async = true;
    document.body.appendChild(razorpayScript);
    
    // Load Google Maps API
    const googleMapsScript = document.createElement('script');
    googleMapsScript.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&libraries=places`;
    googleMapsScript.async = true;
    document.body.appendChild(googleMapsScript);
    
    return () => {
      if (document.body.contains(razorpayScript)) {
        document.body.removeChild(razorpayScript);
      }
      if (document.body.contains(googleMapsScript)) {
        document.body.removeChild(googleMapsScript);
      }
    };
  }, [cartItems]);

  // Listen for cart updates from global store
  useEffect(() => {
    const handleCartUpdate = (event) => {
      setCart(event.detail);
    };

    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, []);

  // Use selling price total from props for calculations
  const sellingPriceTotal = cartTotals.total > 0 
    ? cartTotals.total 
    : cart.reduce((acc, item) => acc + Number(item.discountedPrice) * item.quantity, 0);
  
  // MRP subtotal for display
  const subtotal = cartTotals.subtotal > 0 
    ? cartTotals.subtotal 
    : cart.reduce((acc, item) => acc + Number(item.actualPrice || item.discountedPrice) * item.quantity, 0);

  return (
    <>
       {loader && <UserLoader/>}
      <Toast ref={toast} position="top-right" style={{scale: '0.7'}}/>
      {/* Order Summary Accordion */}
      <Accordion
        className="custom-checkout-accordian-header"
        onTabOpen={accordianHandler}
        onTabClose={accordianHandler}
        activeIndex={0}
      >
        <AccordionTab
          header={
            <div className="flex items-center justify-between w-full gap-2">
              <div className="flex items-center flex-shrink-0">
                <i className="ri-shopping-cart-line text-base sm:text-lg me-1 sm:me-2"></i>
                <span className="font-medium text-sm sm:text-base whitespace-nowrap">Order Summary</span>
              </div>
              <div className="flex items-center flex-shrink-0">
                <span className="font-[Tektur] me-1 sm:me-2 font-medium text-sm sm:text-base">{cart?.length}</span>
                <span className="me-1 sm:me-2 font-medium text-sm sm:text-base">{t("items")}</span>
                <i
                  className={`icon text-xl sm:text-2xl transition-transform duration-300 ${
                    toggle ? "ri-arrow-drop-down-fill" : "ri-arrow-drop-up-fill"
                  }`}
                ></i>
              </div>
            </div>
          }
        >
          <div className="bg-white max-h-[40vh] overflow-y-auto user-scrollbar pe-3 sm:pe-0">
            {cart?.map((item) => (
              <CartItem
                key={item?.id}
                item={item}
                onQuantityChange={updateQuantity}
                onRemove={removeItem}
              />
            ))}

            <div className="pt-3 sm:pt-4 mt-3 sm:mt-4 text-gray-700 text-xs sm:text-sm">
              <div className="flex justify-between mb-2">
                <span>{t("subtotal")}</span>
                <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
              </div>
              
              {cartTotals.savings > 0 && (
                <div className="flex justify-between mb-2 text-green-600">
                  <span>{t("savings") || "Product Savings"}</span>
                  <span className="font-semibold">-₹{cartTotals.savings.toFixed(2)}</span>
                </div>
              )}
              
              {appliedDiscount && (
                <div className="flex justify-between mb-2 text-green-600">
                  <div className="flex items-center gap-1">
                    <i className="ri-gift-line"></i>
                    <span>{appliedDiscount.name}</span>
                  </div>
                  <span className="font-semibold">-₹{Number(appliedDiscount.discount_amount).toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="flex justify-between font-semibold text-base sm:text-lg mt-3 sm:mt-4 pt-2 border-t">
              <span>{t("total")}</span>
              <span>₹{(sellingPriceTotal - Number(appliedDiscount?.discount_amount || 0)).toFixed(2)}</span>
            </div>
          </div>
        </AccordionTab>
      </Accordion>

      {/* Coupon and Phone Input Section */}
      <div className="w-full max-w-[600px] mx-auto mt-3 sm:mt-4 sm:px-0">
        {/* Address Add */}
 
        <Accordion 
          className="custom-checkout-accordian-header mt-3 sm:mt-4"
          onTabOpen={addressAccordianHandler}
          onTabClose={addressAccordianHandler}
          activeIndex={0} 
        >
          <AccordionTab
            header={
              <div className="flex justify-between items-center w-full">
                <div className="flex items-center">
                  <i className="ri-earth-line text-base sm:text-lg me-1 sm:me-2"></i>
                  <span className="font-medium text-sm sm:text-base whitespace-nowrap">{t("add_address")}</span>
                </div>
                <i
                  className={`icon text-xl sm:text-2xl transition-transform duration-300 ${
                    addressToggle ? "ri-arrow-drop-down-fill" : "ri-arrow-drop-up-fill"
                  }`}
                ></i>
              </div>
            }
          >
            <div className="bg-white space-y-3 sm:space-y-4">
              {/* Address Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("address_type") || "Address Type"}
                </label>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setFieldValue("addressType", "home");
                      setFieldValue("addressLabel", "");
                    }}
                    className={`px-3 py-3 rounded-lg border-2 transition-all flex flex-col items-center justify-center ${
                      values.addressType === "home"
                        ? "border-yellow-500 bg-yellow-50 text-yellow-700"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    <i className="ri-home-line text-xl mb-1"></i>
                    <p className="text-xs sm:text-sm font-medium">{t("home") || "Home"}</p>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setFieldValue("addressType", "office");
                      setFieldValue("addressLabel", "");
                    }}
                    className={`px-3 py-3 rounded-lg border-2 transition-all flex flex-col items-center justify-center ${
                      values.addressType === "office"
                        ? "border-yellow-500 bg-yellow-50 text-yellow-700"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    <i className="ri-building-line text-xl mb-1"></i>
                    <p className="text-xs sm:text-sm font-medium">{t("office") || "Office"}</p>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setFieldValue("addressType", "other")}
                    className={`px-3 py-3 rounded-lg border-2 transition-all flex flex-col items-center justify-center ${
                      values.addressType === "other"
                        ? "border-yellow-500 bg-yellow-50 text-yellow-700"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    <i className="ri-map-pin-line text-xl mb-1"></i>
                    <p className="text-xs sm:text-sm font-medium">{t("other") || "Other"}</p>
                  </button>
                </div>
                {errors?.addressType && touched?.addressType && (
                  <p className="text-xs text-red-600 mt-1">{errors?.addressType}</p>
                )}
              </div>

              {/* Custom Label Input (shown only when "other" is selected) */}
              {values.addressType === "other" && (
                <div>
                  <InputTextComponent
                    value={values.addressLabel}
                    onChange={handleChange}
                    type="text"
                    placeholder={t("enter_address_label") || "Enter address label (e.g., Gym, Friend's House)"}
                    name="addressLabel"
                    error={errors.addressLabel}
                    touched={touched.addressLabel}
                    className="text-xs sm:text-sm w-full border border-gray-300 px-3 sm:px-4 py-2 sm:py-2.5 focus:outline-none focus:ring-1 focus:ring-gray-700 rounded-md"
                  />
                </div>
              )}

              {/* Address Fields */}
              <InputTextComponent
                value={values.flatLandmark}
                onChange={handleChange}
                type="text"
                placeholder={t("flatLandmark") || "Flat/Landmark"}
                name="flatLandmark"
                error={errors.flatLandmark}
                touched={touched.flatLandmark}
                className="text-xs sm:text-sm w-full border border-gray-300 px-3 sm:px-4 py-2 sm:py-2.5 focus:outline-none focus:ring-1 focus:ring-gray-700 rounded-md"
              />
              
              <InputTextComponent
                value={values.city}
                onChange={handleChange}
                type="text"
                placeholder={t("city") || "City"}
                name="city"
                error={errors.city}
                touched={touched.city}
                className="text-xs sm:text-sm w-full border border-gray-300 px-3 sm:px-4 py-2 sm:py-2.5 focus:outline-none focus:ring-1 focus:ring-gray-700 rounded-md"
              />
              
              <InputTextComponent
                value={values.state}
                onChange={handleChange}
                type="text"
                placeholder={t("state") || "State"}
                name="state"
                error={errors.state}
                touched={touched.state}
                className="text-xs sm:text-sm w-full border border-gray-300 px-3 sm:px-4 py-2 sm:py-2.5 focus:outline-none focus:ring-1 focus:ring-gray-700 rounded-md"
              />
              
              <InputTextComponent
                value={values.zipCode}
                onChange={handleChange}
                type="text"
                placeholder={t("zipCode") || "Zip Code"}
                name="zipCode"
                error={errors.zipCode}
                touched={touched.zipCode}
                className="text-xs sm:text-sm w-full border border-gray-300 px-3 sm:px-4 py-2 sm:py-2.5 focus:outline-none focus:ring-1 focus:ring-gray-700 rounded-md"
              />
              
              <InputTextComponent
                value={values.country}
                onChange={handleChange}
                type="text"
                placeholder={t("country") || "Country"}
                name="country"
                error={errors.country}
                touched={touched.country}
                className="text-xs sm:text-sm w-full border border-gray-300 px-3 sm:px-4 py-2 sm:py-2.5 focus:outline-none focus:ring-1 focus:ring-gray-700 rounded-md"
              />
              
              {/* Save Address Button */}
              <button
                type="button"
                onClick={handleSaveAddress}
                disabled={isCalculatingDistance}
                className={`w-full py-2.5 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                  addressSaved
                    ? "bg-green-600 text-white"
                    : "bg-gray-900 text-white hover:bg-gray-800"
                }`}
              >
                {isCalculatingDistance ? (
                  <>
                    <i className="ri-loader-4-line animate-spin"></i>
                    <span>Calculating Distance...</span>
                  </>
                ) : addressSaved ? (
                  <>
                    <i className="ri-check-line"></i>
                    <span>Address Saved</span>
                  </>
                ) : (
                  <>
                    <i className="ri-save-line"></i>
                    <span>Save Address & Calculate Delivery</span>
                  </>
                )}
              </button>
              
              {/* Delivery Charges Display */}
              {addressSaved && distance !== null && (
                <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <i className="ri-truck-line text-blue-600 text-xl"></i>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-2 text-sm">Delivery Charges</h4>
                      <div className="space-y-1 text-xs text-gray-700">
                        <div className="flex justify-between">
                          <span>Distance:</span>
                          <span className="font-semibold">{distance} km</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Rate per km:</span>
                          <span className="font-semibold">₹{shippingCostPerKm.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-blue-300">
                          <span className="font-semibold">Shipping Cost:</span>
                          <span className="font-bold text-blue-700">₹{shippingCost.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </AccordionTab>
        </Accordion>

        <div className="flex bg-white items-center border rounded-lg p-2 sm:p-3 mt-3 sm:mt-4 overflow-hidden">
                <span className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                  <img
                    src="https://flagcdn.com/w40/in.png"
                    alt="India Flag"
                    className="w-5 h-3 sm:w-6 sm:h-4"
                  />
                  <span className="text-gray-700 text-sm sm:text-base">+91</span>
                </span>
                <InputTextComponent
                  value={values?.phoneNumber}
                  onChange={handleChange}
                  type="number"
                  placeholder={t("phone_number")}
                  name="phoneNumber"
                  className="w-full ml-2 sm:ml-4 pr-2 sm:pr-4 py-1 sm:py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-gray-400"
                />
        </div>
        {errors?.phoneNumber && touched?.phoneNumber && (
          <p className="text-xs text-red-600 mt-1 px-1">{errors?.phoneNumber}</p>
        )}

        <button
          type="submit"
          onClick={handleSubmit}
          disabled={isProcessing}
          className={`w-full mt-4 sm:mt-6 text-white py-3 sm:py-4 rounded-lg flex items-center justify-center text-sm sm:text-base font-medium min-h-[48px] sm:min-h-[52px] transition-all duration-200 ${
            isProcessing ? "bg-gray-700 cursor-not-allowed" : "bg-gray-900 hover:bg-gray-800 active:bg-gray-950 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          }`}
        >
          {isProcessing ? (
            <div className="flex items-center gap-2">
              <svg
                className="animate-spin h-4 w-4 sm:h-5 sm:w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                ></path>
              </svg>
              <span className="text-sm sm:text-base">Loading...</span>
            </div>
          ) : (
            t("proceed")
          )}
        </button>

        {/* Newsletter Checkbox */}
        <div className="flex items-center justify-center mt-4 sm:mt-5 px-2">
          <input type="checkbox" className="mr-2 sm:mr-3 scale-110 sm:scale-125" />
          <label htmlFor="offers" className="text-gray-700 text-xs sm:text-sm text-center cursor-pointer">
            {t("keep_me_poster_about_sales_and_offers")}
          </label>
        </div>

        {/* Footer Section */}
        <div className="text-center text-gray-600 mt-6 sm:mt-8 pb-12 sm:pb-16 px-2">
          <div className="flex justify-center space-x-8 sm:space-x-12 mb-4 sm:mb-6">
            <div className="flex flex-col items-center">
              <i className="ri-truck-line text-xl sm:text-2xl mb-1"></i>
              <span className="text-xs sm:text-sm text-center">{t("delivers_in_days", { days: "5-7" })}</span>
            </div>
            <div className="flex flex-col items-center">
              <i className="ri-global-line text-xl sm:text-2xl mb-1"></i>
              <span className="text-xs sm:text-sm text-center">{t("shipping_worldwide")}</span>
            </div>
          </div>

          <p className="text-xs sm:text-sm mt-8 sm:mt-12 leading-relaxed px-4">
            {t("by_proceeding_i_accept")}{" "}
            <span className="font-semibold text-[#382C2C] underline cursor-pointer">{t("T&C")}</span>{" "}
            {t("and")}{" "}
            <span className="font-semibold text-[#382C2C] underline cursor-pointer">{t("privacy_policy")}</span>
          </p>

        </div>
      </div>
    </>
  );
  
}

export default CheckoutComponent;