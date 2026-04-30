// Utils
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Sidebar } from 'primereact/sidebar';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { allApiWithHeaderToken } from "@api/api";
import { API_CONSTANTS } from "@constants/apiurl";
import { handleUnauthorized } from "../../utils/authUtils";

// Components
import AvatarProfile from "@common/AvatarProfile";
import NotificationComponent from "@common/Notification";
import InputTextComponent from "@common/InputTextComponent";

// Custom Hook for Debouncing
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const Topbar = ({ toggleExpansionSwitch, searchField, searchChangeHandler }) => {
  const { t } = useTranslation("msg");
  const location = useLocation();
  const [expand, setExpand] = useState(true);
  const [theme, setTheme] = useState(false);
  const [searchvalue, setSearchValue] = useState("");
  const [visibleRight, setVisibleRight] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [unreadOrders, setUnreadOrders] = useState([]);
  const [unreadOrdersCount, setUnreadOrdersCount] = useState(0);
  const [visibleOrderNotifications, setVisibleOrderNotifications] = useState(false);
  const [viewedOrders, setViewedOrders] = useState(new Set());
  const [notifications, setNotifications] = useState([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [isPollingNotifications, setIsPollingNotifications] = useState(false);
  const [userOrders, setUserOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Get user details from localStorage to check role
  const userDetails = JSON.parse(localStorage.getItem('userDetails') || '{}');
  const isAdmin = userDetails?.role_id === 1;
  const token = JSON.parse(localStorage.getItem('token') || '""');
  const apiBaseURL = process.env.REACT_APP_BASE_URL;
  const debouncedSearchValue = useDebounce(searchvalue, 800);

  const toggleTheme = () => {
    setTheme(!theme);
    if (theme) {
      document.querySelector("body").setAttribute("data-theme", "light");
      localStorage.setItem("theme", "light");
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } else {
      document.querySelector("body").setAttribute("data-theme", "dark");
      localStorage.setItem("theme", "dark");
    }
  };

  useEffect(() => {
    searchChangeHandler(debouncedSearchValue);
  }, [debouncedSearchValue, searchChangeHandler]);

  const readNotification = () => {
    setVisibleRight(true);
  };

  // Fetch notifications
  const fetchNotifications = async (isPolling = false) => {
    if (!token) {
      return;
    }

    if (isPolling) {
      setIsPollingNotifications(true);
    }

    try {
      const response = await axios.get(`${apiBaseURL}/${API_CONSTANTS.COMMON_NOTIFICATIONS_URL}`, {
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        }
      });

      if (response.data && response.data.data) {
        setNotifications(response.data.data);
        setNotificationCount(response.data.unread_count || 0);
      } else {
        setNotifications([]);
        setNotificationCount(0);
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        handleUnauthorized();
        return;
      }
      setNotifications([]);
      setNotificationCount(0);
    } finally {
      if (isPolling) {
        setIsPollingNotifications(false);
      }
    }
  };

  // Fetch unread orders (orders in 'in_review' status) - only for admin users
  const fetchUnreadOrders = async () => {
    if (!isAdmin) {
      return;
    }

    try {
      const response = await allApiWithHeaderToken(
        `${API_CONSTANTS.COMMON_ORDER_URL}/filter?order_status=in_review&skip=0&limit=10`,
        {},
        "get"
      );

      if (response.status === 200 && response.data) {
        const orders = response.data.data || response.data;
        setUnreadOrders(orders);
        
        // Count only non-viewed orders
        const unviewedCount = orders.filter(order => !viewedOrders.has(order.id)).length;
        setUnreadOrdersCount(unviewedCount);
      } else {
        setUnreadOrders([]);
        setUnreadOrdersCount(0);
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        handleUnauthorized();
        return;
      }
      setUnreadOrders([]);
      setUnreadOrdersCount(0);
    }
  };

  // Fetch user orders - for regular users
  const fetchUserOrders = async () => {
    if (!userDetails?.id) {
      return;
    }

    setOrdersLoading(true);
    try {
      const response = await allApiWithHeaderToken(
        `${API_CONSTANTS.COMMON_ORDER_URL}/get_by_user`,
        { user_id: userDetails.id },
        "post"
      );

      if (response.status === 200) {
        // Transform API response to component format
        const transformedOrders = response?.data?.data?.map(order => ({
          id: order.id,
          orderId: order.order_id,
          status: order.payment_status,
          orderStatus: order.order_status,
          paymentStatus: order.payment_status,
          totalPrice: order.total_price, // Use stored total_price (grand total)
          totalAmount: order.total_price, // Use stored total_price (grand total)
          createdAt: order.created_at,
          estimatedDeliveryDate: order.estimated_delivery_date,
          orderFulfilledDate: order.order_fulfilled_date,
          orderItems: order.order_items || [],
          orderHistory: order.order_history || [],
          shippingCostPerCarton: order.shipping_cost_per_carton,
          totalCartons: order.total_cartons,
          totalShippingCost: order.total_shipping_cost
        })) || [];

        setUserOrders(transformedOrders);
      }
    } catch (err) {
      console.error("Error fetching user orders:", err);
      setUserOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  const openOrderNotifications = () => {
    setVisibleOrderNotifications(true);
  };

  // Mark notification as read and navigate to view order
  const markAsReadAndView = async (notificationId, orderId) => {
    try {
      // Mark notification as read in backend
      await axios.patch(`${apiBaseURL}/${API_CONSTANTS.COMMON_NOTIFICATIONS_URL}/${notificationId}/mark_as_read`, {}, {
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        }
      });
      
      // Update local state
      setNotifications(prev => prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, is_read: true, read_at: new Date().toISOString() }
          : notification
      ));
      
      // Update notification count
      setNotificationCount(prev => Math.max(0, prev - 1));
      
      // Close notification panel
      setVisibleOrderNotifications(false);
      
      // Navigate to orders list with highlighted order
      window.location.href = `/dashboard/orders?highlightOrder=${orderId}`;
    } catch (error) {
      if (error.response && error.response.status === 401) {
        handleUnauthorized();
        return;
      }
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      // Mark all notifications as read in backend
      await axios.patch(`${apiBaseURL}/${API_CONSTANTS.COMMON_NOTIFICATIONS_URL}/mark_all_as_read`, {}, {
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        }
      });
      
      // Update local state
      setNotifications(prev => prev.map(notification => ({
        ...notification,
        is_read: true,
        read_at: new Date().toISOString()
      })));
      
      // Reset notification count
      setNotificationCount(0);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        handleUnauthorized();
        return;
      }
      console.error('Error marking all notifications as read:', error);
    }
  };

  useEffect(() => {
    setSearchValue(searchField);
  }, [searchField]);

  useEffect(() => {
    const selectedTheme = localStorage.getItem("theme");
    if (selectedTheme === "dark") {
      setTheme(true);
      document.querySelector("body").setAttribute("data-theme", "dark");
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      setTheme(false);
      document.querySelector("body").setAttribute("data-theme", "light");
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, []);

  useEffect(() => {
    setSearchValue("");
  }, [location]);

  // Fetch notifications and user orders on component mount and periodically
  useEffect(() => {
    fetchNotifications();
    // Removed fetchUserOrders() - not needed, notifications API handles this
    // Removed fetchUnreadOrders() - not needed, notifications API handles this
    
    // Set up polling to check for new notifications every 30 seconds
    const interval = setInterval(() => {
      console.log('Polling notifications...', new Date().toLocaleTimeString());
      fetchNotifications(true); // Pass true to indicate this is polling
    }, 30000);
    
    // Listen for custom order update events
    const handleOrderUpdate = () => {
      fetchNotifications();
    };
    
    window.addEventListener('orderCreated', handleOrderUpdate);
    window.addEventListener('orderUpdated', handleOrderUpdate);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('orderCreated', handleOrderUpdate);
      window.removeEventListener('orderUpdated', handleOrderUpdate);
    };
  }, []); // Removed isAdmin dependency

  const customHeader = (
     <div className="bg-white p-4">
        <div className="flex items-center justify-between">
          <h6 className="text-1.2rem">
            {t("notifications")}
          </h6>
        </div>
      </div>
  );

  return (
    <div className="flex items-center justify-between w-full px-4 sm:px-5 py-4 bg-BgTertiaryColor shadow-custom z-10 flex-wrap gap-4">
      {/* Left: Toggle button */}
      <button
        className={`text-2xl text-TextPrimaryColor`}
        onClick={() => {
          setExpand(!expand);
          toggleExpansionSwitch(!expand);
        }}
      >
        <i className={`${expand ? "ri-menu-fold-2-line rotate" : "ri-menu-unfold-2-line"}`}></i>
      </button>

      {/* Middle & Right: Search and Avatar/Theme */}
      <div className="flex items-center justify-between flex-1 flex-wrap gap-4">
        {/* Search bar (hidden on mobile) */}
        {location?.pathname !== "/dashboard" && (
          <div className="hidden sm:block flex-1 min-w-[150px]">
            <InputTextComponent
              type="text"
              placeholder={t("search")}
              value={searchvalue}
              onChange={(e) => setSearchValue(e.target.value)}
              name="searchvalue"
              className="w-full rounded border-[1px] border-[#ddd] px-[1rem] py-[8px] text-[11px] focus:outline-none"
            />
          </div>
        )}

        {/* Right: Order notifications, Theme toggle and Avatar */}
        <div className="flex items-center gap-4 text-TextPrimaryColor ml-auto">
          {/* Order Notification Icon - Only show for admin users */}
          {isAdmin && (
            <button 
              onClick={openOrderNotifications} 
              className="relative text-xl hover:text-TextPrimaryColor transition-colors"
              title="New Orders"
            >
              <i className={`ri-notification-3-line ${isPollingNotifications ? 'animate-pulse text-TextPrimaryColor' : ''}`}></i>
              {notificationCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                  {notificationCount > 99 ? '99+' : notificationCount}
                </span>
              )}
            </button>
          )}
          
          <AvatarProfile shape="circle" userDetails={userDetails} />
        </div>
      </div>

      {/* Sidebar for Order Notifications - Only show for admin users */}
      {isAdmin && (
        <Sidebar 
          visible={visibleOrderNotifications} 
          position="right" 
          header={customHeader}
          onHide={() => setVisibleOrderNotifications(false)}
          className="notification-sidebar"
          style={{ width: '400px' }}
        >
          <div className="h-full bg-white">
            {/* Content */}
            <div className="h-full overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <div className="bg-gray-100 rounded-full p-6 mb-4">
                    <i className="ri-inbox-line text-4xl text-gray-400"></i>
                  </div>
                  <h4 className="text-lg font-medium mb-2 text-gray-600">{t("no_new_notifications")}</h4>
                  <p className="text-sm text-center">{t("all_orders_reviewed")}</p>
                </div>
              ) : (
                <div>
                  <div className="p-4 space-y-4">
                    {notifications.map((notification, index) => {
                      const isRead = notification.is_read;
                      return (
                        <div 
                          key={notification.id} 
                          className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
                            isRead 
                              ? 'bg-white border-gray-200 hover:bg-gray-50' 
                              : 'bg-orange-50 border-orange-200 hover:bg-orange-100'
                          }`}
                        >
                          {/* Content */}
                          <div className="flex-1 min-w-0 space-y-1">
                            {/* Order Number and Date/Time Row */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-baseline gap-1">
                                <span className="text-[10px] text-gray-400 uppercase font-medium">{t("order_no")}:</span>
                                <span className={`text-xs font-semibold ${isRead ? 'text-gray-700' : 'text-gray-900'}`}>
                                  #{notification.order?.batch_number || notification.order?.id}
                                </span>
                              </div>

                              <div className="flex items-baseline gap-1">
                                <span className="text-[10px] text-gray-400 uppercase font-medium">{t("total_price")}:</span>
                                <span className={`text-xs font-semibold ${isRead ? 'text-gray-700' : 'text-green-600'}`}>
                                  ₹{parseFloat(notification.order?.total_price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </div>

                              <button 
                                  onClick={() => markAsReadAndView(notification.id, notification.order?.id)}
                                  className={`flex min-h-[1rem] align-center rounded-full transition-colors flex-shrink-0 ${
                                    isRead 
                                      ? 'text-gray-400 hover:text-gray-600 hover:bg-gray-100' 
                                      : 'text-TextPrimaryColor hover:text-TextPrimaryColor hover:bg-orange-100'
                                  }`}
                                  title={t("view_order")}
                                >
                                  <i className="ri-eye-line text-sm"></i>
                              </button>
                            </div>
                            
                            <div className="flex items-baseline gap-1">
                              <span className="text-[10px] text-gray-400 uppercase font-medium">{t("customer_name")}:</span>
                              <span className={`text-xs font-medium ${isRead ? 'text-gray-600' : 'text-gray-800'}`}>
                                {notification.order?.user?.name || notification.order?.user?.email || t("unknown_customer")}
                              </span>
                            </div>

                            <div className="flex items-baseline gap-1">
                                <span className="text-[10px] text-gray-400 uppercase font-medium">{t("date_time")}:</span>
                                <span className={`text-[10px] font-medium ${isRead ? 'text-gray-500' : 'text-gray-700'}`}>
                                  {new Date(notification.created_at).toLocaleString('en-IN', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: true
                                  })}
                                </span>
                            </div>

                            {/* Show payment mode and receipt link for banking receipt notifications */}
                            {notification.notification_type === 'banking_receipt_uploaded' && (
                              <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded">
                                <div className="flex items-baseline gap-1 mb-1">
                                  <span className="text-[10px] text-gray-400 uppercase font-medium">{t("payment_mode")}:</span>
                                  <span className="text-xs font-medium text-TextPrimaryColor">Banking Receipt</span>
                                </div>
                                <button 
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    try {
                                      // Get banking receipt with proper authentication
                                      const token = JSON.parse(localStorage.getItem('token'));
                                      const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/v1/orders/${notification.order?.id}/banking_receipt`, {
                                        method: 'GET',
                                        headers: {
                                          'Authorization': `${token}`,
                                          'Content-Type': 'application/json'
                                        }
                                      });
                                      
                                      if (!response.ok) {
                                        throw new Error('Failed to fetch banking receipt');
                                      }
                                      
                                      // Get the blob from response
                                      const blob = await response.blob();
                                      
                                      // Create blob URL and open in new tab
                                      const url = window.URL.createObjectURL(blob);
                                      const newWindow = window.open(url, '_blank');
                                      
                                      // Clean up the blob URL after a delay to ensure it loads
                                      setTimeout(() => {
                                        window.URL.revokeObjectURL(url);
                                      }, 1000);
                                      
                                    } catch (error) {
                                      console.error('View banking receipt error:', error);
                                      // You might want to show a toast notification here
                                    }
                                  }}
                                  className="text-xs text-TextPrimaryColor hover:text-TextPrimaryColor underline font-medium"
                                >
                                  <i className="ri-file-text-line mr-1"></i>
                                  {t("view_banking_receipt")}
                                </button>
                              </div>
                            )}

                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Sidebar>
      )}
    </div>
  );
};

export default Topbar;