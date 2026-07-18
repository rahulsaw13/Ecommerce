import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { allApiWithHeaderToken } from "@api/api";
import { API_CONSTANTS } from "@constants/apiurl";
import { useTranslation } from "react-i18next";
import { useCompanyInfo } from '@hooks/useCompanyInfo';
import Header from '@common/Header';
import Footer from '@common/Footer';
import UserLoader from '@userpage-pages/UserLoader';

const TrackOrderPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation("msg");
  const companyInfo = useCompanyInfo();
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loader, setLoader] = useState(true);
  const [menuList, setMenuList] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [showAllOrders, setShowAllOrders] = useState(false);
  const [actualRoadDistance, setActualRoadDistance] = useState(null);

  const storeLocation = {
    lat: companyInfo.latitude || 0,
    lng: companyInfo.longitude || 0,
  };

  useEffect(() => {
    fetchOrders();
    fetchMenuList();
    getUserLocation();

    const googleMapsScript = document.createElement('script');
    googleMapsScript.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&libraries=places`;
    googleMapsScript.async = true;
    document.body.appendChild(googleMapsScript);

    return () => {
      if (document.body.contains(googleMapsScript)) {
        document.body.removeChild(googleMapsScript);
      }
    };
  }, []);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        () => {
          setUserLocation(null);
        }
      );
    }
  };

  const fetchOrders = async () => {
    setLoader(true);
    try {
      const userDetails = JSON.parse(localStorage.getItem('userDetails'));
      if (!userDetails?.id) {
        navigate('/sign-in');
        return;
      }

      const response = await allApiWithHeaderToken(
        `${API_CONSTANTS.COMMON_ORDER_URL}/get_by_user`,
        { user_id: userDetails.id },
        "post"
      );

      if (response?.status === 200) {
        const ordersList = response?.data?.data || response?.data || [];

        const nonTrackableStatuses = ['delivered', 'cancelled', 'failed', 'refunded'];
        const trackableOrders = ordersList.filter(order =>
          !nonTrackableStatuses.includes(order.order_status?.toLowerCase())
        );

        setOrders(trackableOrders);

        if (trackableOrders.length > 0) {
          setSelectedOrder(trackableOrders[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoader(false);
    }
  };

  const fetchMenuList = async () => {
    try {
      const response = await allApiWithHeaderToken(API_CONSTANTS.MENU_LIST_URL, "", "get");
      if (response?.status === 200) {
        const menuData = response?.data || [];
        setMenuList(menuData.filter((_, index) => index <= 6));
      }
    } catch (err) {
      console.error("Error fetching menu:", err);
    }
  };

  const getStatusColor = (status) => {
    const statusColors = {
      created: 'bg-gray-100 text-gray-700 border-gray-300',
      paid: 'bg-blue-100 text-blue-700 border-blue-300',
      processing: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      shipped: 'bg-purple-100 text-purple-700 border-purple-300',
      delivered: 'bg-green-100 text-green-700 border-green-300',
      cancelled: 'bg-red-100 text-red-700 border-red-300',
      refunded: 'bg-orange-100 text-orange-700 border-orange-300',
      failed: 'bg-red-100 text-red-700 border-red-300'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-700 border-gray-300';
  };

  const getStatusSteps = () => {
    return [
      { key: 'created', label: 'Order Placed', icon: 'ri-file-list-3-line' },
      { key: 'paid', label: 'Payment Done', icon: 'ri-secure-payment-line' },
      { key: 'processing', label: 'Processing', icon: 'ri-tools-line' },
      { key: 'shipped', label: 'Shipped', icon: 'ri-truck-line' },
      { key: 'delivered', label: 'Delivered', icon: 'ri-checkbox-circle-line' }
    ];
  };

  const getStepStatus = (stepKey, currentStatus) => {
    const statusOrder = ['created', 'paid', 'processing', 'shipped', 'delivered'];
    const normalized = (currentStatus || '').toLowerCase();
    const currentIndex = statusOrder.indexOf(normalized);
    const stepIndex = statusOrder.indexOf(stepKey);

    if (normalized === 'cancelled' || normalized === 'failed') {
      return stepIndex === 0 ? 'completed' : 'inactive';
    }

    if (currentIndex === -1) return stepIndex === 0 ? 'current' : 'inactive';
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'inactive';
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const straightLineDistance = R * c;
    const roadDistanceMultiplier = 1.4;
    return (straightLineDistance * roadDistanceMultiplier).toFixed(2);
  };

  const getDeliveryDistance = () => {
    if (userLocation) {
      return calculateDistance(
        storeLocation.lat,
        storeLocation.lng,
        userLocation.lat,
        userLocation.lng
      );
    }
    return null;
  };

  useEffect(() => {
    if (userLocation && window.google && window.google.maps) {
      const service = new window.google.maps.DistanceMatrixService();
      const origin = new window.google.maps.LatLng(storeLocation.lat, storeLocation.lng);
      const destination = new window.google.maps.LatLng(userLocation.lat, userLocation.lng);

      service.getDistanceMatrix(
        {
          origins: [origin],
          destinations: [destination],
          travelMode: window.google.maps.TravelMode.DRIVING,
          unitSystem: window.google.maps.UnitSystem.METRIC,
        },
        (response, status) => {
          if (status === 'OK' && response.rows[0].elements[0].status === 'OK') {
            const distanceInMeters = response.rows[0].elements[0].distance.value;
            setActualRoadDistance((distanceInMeters / 1000).toFixed(2));
          }
        }
      );
    }
  }, [userLocation]);

  const calculateDeliveryCharge = () => {
    const distance = actualRoadDistance || getDeliveryDistance();
    if (distance) {
      const costPerKm = 10;
      return (parseFloat(distance) * costPerKm).toFixed(2);
    }
    return null;
  };

  const getMapUrl = () => {
    const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    const storeCoords = `${storeLocation.lat},${storeLocation.lng}`;
    if (userLocation) {
      const userCoords = `${userLocation.lat},${userLocation.lng}`;
      return `https://www.google.com/maps/embed/v1/directions?key=${apiKey}&origin=${storeCoords}&destination=${userCoords}&mode=driving`;
    }
    return `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${storeCoords}&zoom=15`;
  };

  if (loader) {
    return <UserLoader />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="pt-[160px] md:pt-20 pb-20 md:pb-8">
        <div className="p-4 md:p-6 mt-4 w-full max-w-screen-xl mx-auto">
          <h1 className="text-[20px] sm:text-[24px] md:text-[36px] font-bold text-center mb-4 text-[#1D2E43] font-[playfair]">
            {t("track_order") || "Track Your Orders"}
          </h1>

          <div className="flex justify-center mb-6 text-gray-600 text-sm">
            <p className="text-[#1D2E43]">
              <span onClick={() => navigate('/')} className="cursor-pointer hover:text-yellow-600">
                Home
              </span>
              {" / "}
              <span className="text-gray-600">{t("track_order") || "Track Order"}</span>
            </p>
          </div>

          {selectedOrder && (
            <div className="mb-6">
              <div className="relative max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-2">
                  {getStatusSteps().map((step, index) => {
                    const status = getStepStatus(step.key, selectedOrder.order_status);
                    const isLast = index === getStatusSteps().length - 1;

                    return (
                      <div key={step.key} className="flex flex-col items-center flex-1 relative">
                        {!isLast && (
                          <div
                            className={`absolute top-5 left-1/2 w-full h-0.5 ${
                              status === 'completed' ? 'bg-green-500' : 'bg-gray-200'
                            }`}
                            style={{ zIndex: 0 }}
                          />
                        )}
                        <div
                          className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                            status === 'completed'
                              ? 'bg-green-500 text-white'
                              : status === 'current'
                              ? 'bg-yellow-400 text-gray-900'
                              : 'bg-gray-200 text-gray-400'
                          }`}
                        >
                          <i className={`${step.icon} text-xl`}></i>
                        </div>
                        <span
                          className={`text-sm font-medium text-center ${
                            status === 'inactive' ? 'text-gray-400' : 'text-gray-900'
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {(selectedOrder.order_status === 'cancelled' || selectedOrder.order_status === 'failed') && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg max-w-4xl mx-auto">
                  <div className="flex items-center gap-3">
                    <i className="ri-error-warning-line text-2xl text-red-600"></i>
                    <div>
                      <h4 className="text-sm font-bold text-red-900">
                        Order {selectedOrder.order_status === 'cancelled' ? 'Cancelled' : 'Failed'}
                      </h4>
                      <p className="text-xs text-red-700 mt-1">
                        {selectedOrder.order_status === 'cancelled'
                          ? 'This order has been cancelled'
                          : 'Payment failed for this order'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {orders.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center border">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-shopping-bag-line text-4xl text-gray-400"></i>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">No Orders Yet</h2>
              <p className="text-gray-600 mb-6">You haven't placed any orders yet</p>
              <button
                onClick={() => navigate('/')}
                className="bg-yellow-400 text-gray-900 px-6 py-3 rounded-lg font-bold hover:bg-yellow-500 transition-colors"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {/* Orders list */}
                <div className="bg-white rounded-lg border">
                  <div className="p-4 border-b bg-gray-50">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Your Orders ({orders.length} {orders.length === 1 ? 'order' : 'orders'} to track)
                    </h2>
                  </div>
                  <div className="p-4">
                    <div className="space-y-2">
                      {(showAllOrders ? orders : orders.slice(0, 3)).map((order) => (
                        <div
                          key={order.id}
                          onClick={() => setSelectedOrder(order)}
                          className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                            selectedOrder?.id === order.id
                              ? 'border-yellow-400 bg-yellow-50'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                              selectedOrder?.id === order.id ? 'bg-yellow-400' : 'bg-gray-100'
                            }`}>
                              <i className="ri-file-list-3-line text-lg"></i>
                            </div>
                            <div>
                              <div className="text-sm font-bold text-gray-900">Order #{order.id}</div>
                              <div className="text-xs text-gray-600">
                                {order.created_at ? (() => {
                                  const d = new Date(String(order.created_at).replace(/\[.*?\]$/, ''));
                                  return isNaN(d) ? 'Date not available' : d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
                                })() : 'Date not available'}
                              </div>
                            </div>
                          </div>
                          <div className="text-right px-4">
                            <div className="text-sm font-bold text-gray-900">
                              ₹{order.total_price ? parseFloat(order.total_price).toFixed(2) : '0.00'}
                            </div>
                          </div>
                          <div>
                            <span className={`text-xs px-3 py-1 rounded-full font-medium border whitespace-nowrap ${getStatusColor(order.order_status)}`}>
                              {order.order_status ? order.order_status.charAt(0).toUpperCase() + order.order_status.slice(1) : 'Unknown'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {orders.length > 3 && (
                      <div className="mt-4 text-center">
                        <button
                          onClick={() => setShowAllOrders(!showAllOrders)}
                          className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors inline-flex items-center gap-2"
                        >
                          {showAllOrders ? (
                            <><i className="ri-arrow-up-s-line"></i> Show Less</>
                          ) : (
                            <><i className="ri-arrow-down-s-line"></i> Show More ({orders.length - 3} more)</>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Order items */}
                {selectedOrder && (
                  <div className="bg-white rounded-lg border">
                    <div className="p-4 border-b bg-gray-50">
                      <h2 className="text-lg font-semibold text-gray-900">Order Items</h2>
                    </div>
                    <div className="p-4">
                      <div className="space-y-3">
                        {selectedOrder.order_items && selectedOrder.order_items.length > 0 ? (
                          selectedOrder.order_items.map((item) => (
                            <div key={item.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border">
                              <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center flex-shrink-0 border">
                                {item.image_url ? (
                                  <img
                                    src={item.image_url}
                                    alt={item.name}
                                    className="w-full h-full object-contain rounded-lg"
                                  />
                                ) : (
                                  <i className="ri-shopping-bag-line text-2xl text-gray-300"></i>
                                )}
                              </div>
                              <div className="flex-1">
                                <h3 className="text-sm font-bold text-gray-900">{item.name}</h3>
                                <p className="text-xs text-gray-600">Quantity: {item.quantity}</p>
                                {item.weight && <p className="text-xs text-gray-500">{item.weight}</p>}
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-bold text-gray-900">
                                  ₹{(parseFloat(item.price) * item.quantity).toFixed(2)}
                                </p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <i className="ri-shopping-bag-line text-4xl mb-2"></i>
                            <p>No items in this order</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Bill details */}
                {selectedOrder && (
                  <div className="bg-white rounded-lg border">
                    <div className="p-4 border-b bg-gray-50">
                      <h2 className="text-lg font-semibold text-gray-900">Bill Details</h2>
                    </div>
                    <div className="p-4 space-y-3">
                      {selectedOrder.subtotal_mrp && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Subtotal (MRP)</span>
                          <span className="text-gray-900 font-medium">₹{parseFloat(selectedOrder.subtotal_mrp).toFixed(2)}</span>
                        </div>
                      )}
                      {selectedOrder.product_discount && parseFloat(selectedOrder.product_discount) > 0 && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Product Discount</span>
                          <span className="text-green-600 font-medium">-₹{parseFloat(selectedOrder.product_discount).toFixed(2)}</span>
                        </div>
                      )}
                      {selectedOrder.subtotal_selling_price && (
                        <div className="flex items-center justify-between text-sm pt-2 border-t">
                          <span className="text-gray-900 font-semibold">Subtotal (Selling Price)</span>
                          <span className="text-gray-900 font-semibold">₹{parseFloat(selectedOrder.subtotal_selling_price).toFixed(2)}</span>
                        </div>
                      )}
                      {selectedOrder.promo_discount && parseFloat(selectedOrder.promo_discount) > 0 && (
                        <div className="flex items-center justify-between text-sm bg-green-50 -mx-4 px-4 py-2">
                          <div className="flex items-center gap-2">
                            <i className="ri-gift-line text-green-600"></i>
                            <span className="text-gray-900 font-medium">Promo Discount</span>
                          </div>
                          <span className="text-green-600 font-bold">-₹{parseFloat(selectedOrder.promo_discount).toFixed(2)}</span>
                        </div>
                      )}
                      {selectedOrder.coupon_code && selectedOrder.coupon_discount && parseFloat(selectedOrder.coupon_discount) > 0 && (
                        <div className="flex items-center justify-between text-sm bg-yellow-50 -mx-4 px-4 py-2">
                          <div className="flex items-center gap-2">
                            <i className="ri-coupon-line text-yellow-600"></i>
                            <div>
                              <span className="text-gray-900 font-medium">Coupon Applied</span>
                              <span className="text-xs text-gray-600 ml-2">({selectedOrder.coupon_code})</span>
                            </div>
                          </div>
                          <span className="text-green-600 font-bold">-₹{parseFloat(selectedOrder.coupon_discount).toFixed(2)}</span>
                        </div>
                      )}
                      {selectedOrder.tax_price && parseFloat(selectedOrder.tax_price) > 0 && (
                        <div className="flex items-center justify-between text-sm pt-2 border-t">
                          <span className="text-gray-600">Tax</span>
                          <span className="text-gray-900">₹{parseFloat(selectedOrder.tax_price).toFixed(2)}</span>
                        </div>
                      )}
                      {selectedOrder.handling_fee && parseFloat(selectedOrder.handling_fee) > 0 && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Handling Charge</span>
                          <span className="text-gray-900">₹{parseFloat(selectedOrder.handling_fee).toFixed(2)}</span>
                        </div>
                      )}
                      {selectedOrder.delivery_charge && parseFloat(selectedOrder.delivery_charge) > 0 && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Delivery Charge</span>
                          <span className="text-gray-900">₹{parseFloat(selectedOrder.delivery_charge).toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-base font-bold pt-3 border-t-2 border-gray-300">
                        <span className="text-gray-900">Grand Total</span>
                        <span className="text-gray-900">₹{selectedOrder.total_price ? parseFloat(selectedOrder.total_price).toFixed(2) : '0.00'}</span>
                      </div>
                      {selectedOrder.payment_mode && (
                        <div className="flex items-center justify-between text-sm pt-2 border-t">
                          <span className="text-gray-600">Payment Mode</span>
                          <span className="text-gray-900 font-medium">
                            {selectedOrder.payment_mode === 'online_payment' ? 'Online Payment' : 'Cash on Delivery'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Right column — map */}
              <div className="lg:col-span-1">
                {selectedOrder && (
                  <div className="bg-white rounded-lg border p-6 sticky top-20">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                      {userLocation ? 'Delivery Route' : 'Store Location'}
                    </h2>

                    <div className="w-full h-[400px] rounded-lg overflow-hidden border border-gray-200">
                      <iframe
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        src={getMapUrl()}
                        allowFullScreen
                        title="Store Location"
                      ></iframe>
                    </div>

                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-start gap-3">
                        <i className="ri-map-pin-line text-xl text-yellow-500 mt-0.5"></i>
                        <div>
                          <h4 className="text-sm font-bold text-gray-900 mb-1">Store Address</h4>
                          <p className="text-sm text-gray-600">{companyInfo.address}</p>
                          <p className="text-xs text-gray-500 mt-1">Pincode: {companyInfo.pincode}</p>
                          {userLocation && (
                            <>
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs font-semibold text-gray-700">Delivery Distance:</span>
                                  <span className="text-sm font-bold text-blue-600">
                                    {actualRoadDistance || getDeliveryDistance()} km
                                    {!actualRoadDistance && <span className="text-xs text-gray-500"> (estimated)</span>}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-semibold text-gray-700">Delivery Charge:</span>
                                  <span className="text-sm font-bold text-green-600">₹{calculateDeliveryCharge()}</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                  <i className="ri-information-line"></i> Rate: ₹10 per km
                                </p>
                              </div>
                              <p className="text-xs text-green-600 mt-2">
                                <i className="ri-navigation-line"></i> Both locations shown on map
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer data={menuList} />
    </div>
  );
};

export default TrackOrderPage;
