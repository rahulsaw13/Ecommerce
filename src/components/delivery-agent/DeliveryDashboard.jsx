import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Menu } from "primereact/menu";
import { RadioButton } from "primereact/radiobutton";
import { Skeleton } from "primereact/skeleton";
import { allApiWithHeaderToken } from "@api/api";
import { API_CONSTANTS } from "@constants/apiurl";
import InputTextComponent from "@common/InputTextComponent";
import FileUpload from "@common/FileUpload";
import { useFormik } from "formik";
import * as yup from "yup";

const normalizeDate = (value) => {
  if (!value) return null;
  const cleaned = String(value).replace(/\[.*?\]$/, '');
  const d = new Date(cleaned);
  return isNaN(d.getTime()) ? null : d;
};

const DeliveryDashboard = () => {
  const toast = useRef(null);
  const navigate = useNavigate();
  const menuRight = useRef(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [viewMode, setViewMode] = useState("pending"); // "pending" or "history"
  const [showMapDialog, setShowMapDialog] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); // Today's date
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [expandedOrderId, setExpandedOrderId] = useState(null); // For accordion

  // Get user details from localStorage
  const userDetails = JSON.parse(localStorage.getItem('userDetails') || '{}');

  // Profile form validation
  const validationSchema = yup.object().shape({
    name: yup.string().required("Name is required"),
  });

  const formik = useFormik({
    initialValues: {
      name: "",
      phoneNumber: "",
      email: "",
      image: null,
      image_url: ""
    },
    validationSchema,
    onSubmit: (values) => {
      const updatedUserDetails = {
        ...userDetails,
        name: values.name,
        phone_number: values.phoneNumber,
      };
      localStorage.setItem("userDetails", JSON.stringify(updatedUserDetails));
      toast.current.show({
        severity: "success",
        summary: "Success",
        detail: "Profile updated successfully",
        life: 3000,
      });
      setShowProfileDialog(false);
      window.location.reload();
    }
  });

  const handleEditProfile = () => {
    formik.setValues({
      name: userDetails?.name || "",
      phoneNumber: userDetails?.phone_number || "",
      email: userDetails?.email || "",
      image: null,
      image_url: userDetails?.image_url || ""
    });
    setShowProfileDialog(true);
  };

  // User menu items
  const userMenuItems = [
    {
      template: () => (
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-800">{userDetails?.name || 'Delivery Agent'}</p>
          <p className="text-xs text-gray-500">{userDetails?.email || ''}</p>
        </div>
      )
    },
    {
      separator: true
    },
    {
      template: () => (
        <button
          onClick={handleEditProfile}
          className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors group text-left"
        >
          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
            <i className="ri-user-3-line text-gray-600 text-base"></i>
          </div>
          <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Edit Profile</span>
        </button>
      )
    },
    {
      template: () => (
        <button
          onClick={handleLogout}
          className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors group text-left"
        >
          <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center group-hover:bg-red-200 transition-colors">
            <i className="ri-logout-box-line text-red-600 text-base"></i>
          </div>
          <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Logout</span>
        </button>
      )
    }
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userDetails');
    localStorage.removeItem('cart');
    navigate('/sign-in');
  };

  useEffect(() => {
    fetchAssignedOrders();
  }, [debouncedSearch, selectedDate, viewMode]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 800);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchAssignedOrders = async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams();
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (selectedDate) params.append('delivery_date', selectedDate); // Send for both pending and history
      params.append('status', viewMode); // 'pending' or 'history'
      
      const queryString = params.toString();
      const url = queryString ? `api/v1/delivery_agent/orders?${queryString}` : "api/v1/delivery_agent/orders";
      
      const response = await allApiWithHeaderToken(url, "", "get");

      if (response.status === 200) {
        setOrders(response.data.orders ?? []);
      }
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Failed to fetch assigned orders",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const viewOrderDetails = (orderId) => {
    navigate(`/delivery-order/${orderId}`);
  };

  const showMapLocation = (address) => {
    setSelectedAddress(address);
    setShowMapDialog(true);
  };

  // No client-side filtering needed - all filtering is done server-side
  const filteredOrders = orders ?? [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Toast ref={toast} />

      {/* Header */}
      <div 
        className="shadow-md sticky top-0 z-50"
        style={{
          background: 'linear-gradient(180deg, #FFC107 0%, #FFD54F 100%)'
        }}
      >
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center cursor-pointer" onClick={() => navigate('/delivery-dashboard')}>
              <div className="flex items-baseline gap-0.5">
                <span className="text-xl sm:text-2xl font-bold text-gray-900 leading-none">Sriram</span>
                <span className="text-xl sm:text-2xl font-bold text-green-600 leading-none">mart</span>
              </div>
              <span className="ml-3 text-sm sm:text-lg font-semibold text-gray-800 hidden md:block">Delivery Dashboard</span>
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-gray-900">{userDetails?.name || 'Delivery Agent'}</p>
                  <p className="text-xs text-gray-700">Delivery Agent</p>
                </div>
                <button
                  onClick={(e) => menuRight.current.toggle(e)}
                  className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm overflow-hidden"
                >
                  {userDetails?.image_url ? (
                    <img 
                      src={userDetails.image_url} 
                      alt={userDetails.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-base font-bold text-gray-700">
                      {userDetails?.name?.[0]?.toUpperCase() || 'D'}
                    </span>
                  )}
                </button>
                <Menu model={userMenuItems} popup ref={menuRight} className="w-64" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
        {/* Radio Buttons for View Mode */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex items-center">
              <RadioButton
                inputId="pending"
                name="viewMode"
                value="pending"
                onChange={(e) => setViewMode(e.value)}
                checked={viewMode === "pending"}
              />
              <label htmlFor="pending" className="ml-2 text-sm font-medium text-gray-700 cursor-pointer">
                Pending Deliveries
              </label>
            </div>
            <div className="flex items-center">
              <RadioButton
                inputId="history"
                name="viewMode"
                value="history"
                onChange={(e) => setViewMode(e.value)}
                checked={viewMode === "history"}
              />
              <label htmlFor="history" className="ml-2 text-sm font-medium text-gray-700 cursor-pointer">
                Orders History
              </label>
            </div>
          </div>

          {/* Filters Section */}
          <div className="flex flex-row gap-3 pt-3">
            {/* Search Filter */}
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  id="search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder=" "
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent peer"
                />
                <label
                  htmlFor="search-input"
                  className="absolute left-3 -top-2 bg-white px-1 text-xs text-gray-600 transition-all peer-placeholder-shown:top-2 peer-placeholder-shown:text-gray-400 peer-focus:-top-2 peer-focus:text-gray-600 peer-focus:text-xs"
                >
                  Search
                </label>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <i className="ri-close-line text-base"></i>
                  </button>
                )}
              </div>
            </div>

            {/* Date Filter - For both Pending and History */}
            <div className="flex-1">
              <div className="relative">
                <input
                  type="date"
                  id="date-input"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent peer"
                />
                <label
                  htmlFor="date-input"
                  className="absolute left-3 -top-2 bg-white px-1 text-xs text-gray-600"
                >
                  {viewMode === "pending" ? "Delivery Date" : "Completed Date"}
                </label>
              </div>
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-1 pt-3">
            <p className="text-xs text-gray-600">
              Showing <span className="font-semibold text-gray-800">{filteredOrders.length}</span> {filteredOrders.length === 1 ? 'order' : 'orders'}
              {debouncedSearch && <span> matching "{debouncedSearch}"</span>}
              {viewMode === "pending" && selectedDate && (
                <span> for {new Date(selectedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              )}
            </p>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4">
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-2">
                  <div className="flex justify-between items-center mb-1.5">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Skeleton width="3rem" height="0.75rem" />
                        <Skeleton width="8rem" height="0.875rem" />
                      </div>
                      <div className="flex gap-3 items-center">
                        <Skeleton width="6rem" height="0.75rem" />
                        <Skeleton width="2rem" height="0.625rem" />
                      </div>
                    </div>
                    <Skeleton width="4rem" height="1.25rem" />
                  </div>
                  <div className="mb-1.5 pb-1.5 border-b">
                    <Skeleton width="100%" height="2rem" className="mb-1" />
                  </div>
                  <div className="flex justify-between items-center">
                    <Skeleton width="6rem" height="0.75rem" />
                    <Skeleton width="6rem" height="0.75rem" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-8">
              <i className="ri-inbox-line text-4xl sm:text-5xl text-gray-300"></i>
              <p className="text-gray-500 mt-4 text-sm">
                {viewMode === "pending" ? "No pending deliveries" : "No delivery history"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredOrders.map((order) => (
                <div 
                  key={order.id} 
                  className={`border border-gray-200 rounded-lg p-2 transition-shadow ${
                    viewMode === "pending" ? "hover:shadow-md cursor-pointer" : "bg-gray-50"
                  }`}
                  onClick={viewMode === "pending" ? () => viewOrderDetails(order.id) : undefined}
                >
                  {/* Header - Always Visible */}
                  <div 
                    className={viewMode === "history" ? "cursor-pointer" : ""}
                    onClick={viewMode === "history" ? () => setExpandedOrderId(expandedOrderId === order.id ? null : order.id) : undefined}
                  >
                    {/* Single Row: Order ID, Name, Price */}
                    <div className="flex justify-between items-center mb-1.5">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">#{order.id}</span>
                          <span className="text-sm font-semibold text-gray-800">{order.customer.name}</span>
                        </div>
                        {/* Single Row: Phone and Payment Mode */}
                        <div className="flex gap-3 items-center">
                          <span className="text-xs text-gray-600">{order.customer.phone_number}</span>
                          <span className="text-[10px] font-[600] text-gray-500 uppercase">
                            {order.payment_mode === 'cash_on_delivery' ? 'COD' : order.payment_mode?.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <div className="text-base font-bold text-gray-800">₹{parseFloat(order.total_price).toFixed(2)}</div>
                          {/* Order Status Badge - History Only (Always Visible) */}
                          {viewMode === "history" && (
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full inline-block mt-1 ${
                              order.order_status === 'delivered' ? 'bg-green-100 text-green-700' :
                              order.order_status === 'damaged' ? 'bg-red-100 text-red-700' :
                              order.order_status === 'cancelled' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {order.order_status?.toUpperCase()}
                            </span>
                          )}
                        </div>
                        {viewMode === "history" && (
                          <button className="ml-2">
                            <i className={`ri-arrow-${expandedOrderId === order.id ? 'up' : 'down'}-s-line text-xl text-gray-600`}></i>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Date Info - Always Visible */}
                    <div className="flex justify-between items-center text-xs">
                      <div>
                        <span className="text-[10px] text-gray-500">{viewMode === "pending" ? "Ordered: " : "Delivered: "}</span>
                        <span className="font-medium text-gray-800">
                          {viewMode === "pending" ? (
                            normalizeDate(order.created_at)?.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) ?? '-'
                          ) : (
                            normalizeDate(order.order_fulfilled_date)?.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) ?? '-'
                          )}
                        </span>
                        <span className="text-[10px] text-gray-600 ml-1">
                          {viewMode === "pending" ? (
                            normalizeDate(order.created_at)?.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase() ?? ''
                          ) : (
                            normalizeDate(order.order_fulfilled_date)?.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase() ?? ''
                          )}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-gray-500">{viewMode === "pending" ? "Est. Delivery: " : "Ordered: "}</span>
                        <span className="font-medium text-gray-800">
                          {viewMode === "pending" ? (
                            normalizeDate(order.estimated_delivery_date)?.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) ?? '-'
                          ) : (
                            normalizeDate(order.created_at)?.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) ?? '-'
                          )}
                        </span>
                        {viewMode === "pending" && order.delivery_time_slot && (
                          <span className="text-[10px] text-gray-600 ml-1">{order.delivery_time_slot}</span>
                        )}
                        {viewMode === "history" && (
                          <span className="text-[10px] text-gray-600 ml-1">
                            {normalizeDate(order.created_at)?.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase() ?? ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expandable Content - Only for History */}
                  {viewMode === "history" && expandedOrderId === order.id && (
                    <div className="mt-2 pt-2 border-t space-y-2">
                      {/* Delivery Address */}
                      {order.shipping_address && (
                        <div className="pb-2 border-b">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="text-[10px] text-gray-500 mb-0.5">Delivery Address</p>
                              <p className="text-xs text-gray-700 leading-relaxed">
                                {order.shipping_address.flat_no && `${order.shipping_address.flat_no}, `}
                                {order.shipping_address.landmark && `${order.shipping_address.landmark}, `}
                                {order.shipping_address.city && `${order.shipping_address.city}, `}
                                {order.shipping_address.state && `${order.shipping_address.state} `}
                                {order.shipping_address.zip_code && order.shipping_address.zip_code}
                              </p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedAddress(order.shipping_address);
                                setShowMapDialog(true);
                              }}
                              className="ml-2 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                              title="View on Map"
                            >
                              <i className="ri-map-pin-line text-lg text-blue-600"></i>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Delivery Proof Image */}
                      {order.delivery && (order.delivery.delivery_image_url || order.delivery.damage_image_url || order.delivery.cancellation_image_url) && (
                        <div className="pb-2 border-b">
                          <p className="text-[10px] text-gray-500 mb-1">
                            {order.order_status === 'delivered' && 'Delivery Proof'}
                            {order.order_status === 'damaged' && 'Damage Photo'}
                            {order.order_status === 'cancelled' && 'Cancellation Photo'}
                          </p>
                          <img
                            src={order.delivery.delivery_image_url || order.delivery.damage_image_url || order.delivery.cancellation_image_url}
                            alt="Proof"
                            className="w-full h-24 object-cover rounded border border-gray-200 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(order.delivery.delivery_image_url || order.delivery.damage_image_url || order.delivery.cancellation_image_url, '_blank');
                            }}
                          />
                        </div>
                      )}

                      {/* Delivery Notes / Damage Reason / Cancellation Reason */}
                      {order.delivery && (order.delivery.delivery_notes || order.delivery.damage_reason || order.delivery.cancellation_reason) && (
                        <div className="pb-2 border-b">
                          <p className="text-[10px] text-gray-500 mb-1">
                            {order.order_status === 'delivered' && 'Delivery Notes'}
                            {order.order_status === 'damaged' && 'Damage Reason'}
                            {order.order_status === 'cancelled' && 'Cancellation Reason'}
                          </p>
                          <p className="text-[10px] text-gray-700 italic bg-white p-2 rounded border border-gray-200">
                            {order.delivery.delivery_notes || order.delivery.damage_reason || order.delivery.cancellation_reason}
                          </p>
                        </div>
                      )}

                      {/* Payment Collection Details */}
                      {order.payment_mode === 'cash_on_delivery' && order.delivery && (
                        <div className="space-y-1">
                          <p className="text-[10px] font-semibold text-gray-700 mb-1">Payment Collection</p>
                          
                          {order.delivery.cod_payment_method && (
                            <div className="flex justify-between text-[10px]">
                              <span className="text-gray-500">Method:</span>
                              <span className="font-medium text-gray-800 uppercase">
                                {order.delivery.cod_payment_method}
                              </span>
                            </div>
                          )}
                          
                          {order.delivery.cash_received_amount && (
                            <div className="flex justify-between text-[10px]">
                              <span className="text-gray-500">Amount:</span>
                              <span className="font-medium text-gray-800">
                                ₹{parseFloat(order.delivery.cash_received_amount).toFixed(2)}
                              </span>
                            </div>
                          )}
                          
                          {order.delivery.cash_receiver_name && (
                            <div className="flex justify-between text-[10px]">
                              <span className="text-gray-500">Received By:</span>
                              <span className="font-medium text-gray-800">
                                {order.delivery.cash_receiver_name}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Pending Orders - Show Address (Not Accordion) */}
                  {viewMode === "pending" && order.shipping_address && (
                    <div className="mt-1.5 pt-1.5 border-t">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="text-[10px] text-gray-500 mb-0.5">Delivery Address</p>
                          <p className="text-xs text-gray-700 leading-relaxed">
                            {order.shipping_address.flat_no && `${order.shipping_address.flat_no}, `}
                            {order.shipping_address.landmark && `${order.shipping_address.landmark}, `}
                            {order.shipping_address.city && `${order.shipping_address.city}, `}
                            {order.shipping_address.state && `${order.shipping_address.state} `}
                            {order.shipping_address.zip_code && order.shipping_address.zip_code}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAddress(order.shipping_address);
                            setShowMapDialog(true);
                          }}
                          className="ml-2 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                          title="View on Map"
                        >
                          <i className="ri-map-pin-line text-lg text-blue-600"></i>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog
        header="Edit Profile"
        visible={showProfileDialog}
        style={{ width: "90vw", maxWidth: "500px" }}
        onHide={() => setShowProfileDialog(false)}
        breakpoints={{ '960px': '75vw', '640px': '95vw' }}
      >
        <form onSubmit={formik.handleSubmit} className="space-y-4">
          {/* Profile Image */}
          <div className="flex justify-center mb-4">
            <div className="relative">
              {formik.values.image_url || formik.values.image ? (
                <img
                  src={formik.values.image ? URL.createObjectURL(formik.values.image) : formik.values.image_url}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center border-4 border-gray-200">
                  <i className="ri-user-line text-4xl text-blue-600"></i>
                </div>
              )}
              <FileUpload
                name="image"
                onChange={(file) => formik.setFieldValue('image', file)}
                className="absolute bottom-0 right-0"
                accept="image/*"
              />
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <InputTextComponent
              name="name"
              value={formik.values.name}
              onChange={formik.handleChange}
              placeholder="Enter your name"
              className="w-full"
            />
            {formik.touched.name && formik.errors.name && (
              <small className="text-red-500">{formik.errors.name}</small>
            )}
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <InputTextComponent
              name="phoneNumber"
              value={formik.values.phoneNumber}
              onChange={formik.handleChange}
              placeholder="Enter phone number"
              className="w-full"
            />
          </div>

          {/* Email (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <InputTextComponent
              name="email"
              value={formik.values.email}
              disabled
              className="w-full bg-gray-100"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              label="Cancel"
              className="p-button-text"
              onClick={() => setShowProfileDialog(false)}
            />
            <Button
              type="submit"
              label="Save Changes"
              className="p-button-success"
              loading={loading}
            />
          </div>
        </form>
      </Dialog>

      {/* Map Dialog */}
      <Dialog
        header="Delivery Location"
        visible={showMapDialog}
        style={{ width: "90vw", maxWidth: "600px" }}
        onHide={() => setShowMapDialog(false)}
        breakpoints={{ '960px': '75vw', '640px': '95vw' }}
      >
        {selectedAddress && (
          <div className="space-y-3">
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm font-semibold text-gray-800 mb-1">Address</p>
              <p className="text-sm text-gray-700">
                {selectedAddress.flat_no}, {selectedAddress.landmark}, {selectedAddress.city}, {selectedAddress.state} {selectedAddress.zip_code}
              </p>
            </div>
            <div className="w-full h-64 bg-gray-200 rounded flex items-center justify-center">
              <iframe
                width="100%"
                height="100%"
                frameBorder="0"
                style={{ border: 0 }}
                src={`https://www.google.com/maps?q=${encodeURIComponent(`${selectedAddress.flat_no}, ${selectedAddress.landmark}, ${selectedAddress.city}, ${selectedAddress.state} ${selectedAddress.zip_code}`)}&output=embed`}
                allowFullScreen
              ></iframe>
            </div>
            <Button
              label="Open in Google Maps"
              icon="ri-external-link-line"
              className="p-button-sm w-full"
              onClick={() => {
                const address = `${selectedAddress.flat_no}, ${selectedAddress.landmark}, ${selectedAddress.city}, ${selectedAddress.state} ${selectedAddress.zip_code}`;
                window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank');
              }}
            />
          </div>
        )}
      </Dialog>
    </div>
  );
};

export default DeliveryDashboard;
