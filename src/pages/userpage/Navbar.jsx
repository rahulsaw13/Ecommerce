import { useState, useEffect, useRef, useCallback } from 'react';
import { Sidebar } from 'primereact/sidebar';
import { useNavigate } from "react-router-dom";
import { TieredMenu } from 'primereact/tieredmenu';
import { Avatar } from "primereact/avatar";
import { useTranslation } from "react-i18next";

// Components
import OrderDetailsComponent from "@adminpage-layouts/Order/OrderDetailsComponent.jsx";
// import NavbarSubmenu from '@userpage-components/NavbarSubmenu.jsx';
import ButtonComponent from "@common/ButtonComponent";
import { allApiWithHeaderToken } from "@api/api";
import { API_CONSTANTS } from "@constants/apiurl";
import useCartStore from "@store";
import { ROUTES_CONSTANTS } from "@constants/routesurl";
import Logo from "@assets/logo.webp";

const Navbar = ({ data }) => {
  const [visibleOrderDetails, setVisibleOrderDetails] = useState(false);
  const [cart, setCart] = useState([]);
  const [MobileMenuShow, setMobileMenuShow] = useState(false);
  const [showNavbar, setShowNavbar] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [userOrders, setUserOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState(new Set());

  // Safe token parsing
  let token = null;
  try {
    const raw = localStorage.getItem('token');
    token = raw ? JSON.parse(raw) : null;
  } catch (e) {
    token = null;
  }

  const { triggerUpdate } = useCartStore();
  const navigate = useNavigate();
  const { t } = useTranslation("msg");
  const menu = useRef(null);

  // Safe localStorage parsing
  let userDetails = null;
  try {
    const raw = localStorage.getItem("userDetails");
    userDetails = raw ? JSON.parse(raw) : null;
  } catch (e) {
    userDetails = null;
  }

  const loggedInItems = [
    {
      label: userDetails?.name,
      icon: <Avatar className="mr-2" label={userDetails?.name?.[0]} shape="circle" />,
      command: () => { }
    },
    { separator: true },
    {
      label: t("edit_profile"),
      icon: "ri-user-3-line",
      command: () => navigate(`/edit-profile`),
      className: "text-[0.8rem] user-profile-menu-item-list"
    },
    {
      label: t("order_history"),
      icon: "ri-file-list-3-line",
      command: () => navigate('/order-history'),
      className: "text-[0.8rem] user-profile-menu-item-list"
    },
    {
      label: t("track_order"),
      icon: "ri-map-pin-line",
      command: () => navigate('/track-order'),
      className: "text-[0.8rem] user-profile-menu-item-list"
    },
    {
      label: t("change_password"),
      icon: "ri-lock-password-line",
      command: () => navigate('/change-password'),
      className: "text-[0.8rem] user-profile-menu-item-list"
    },
    {
      label: t("help"),
      icon: "ri-questionnaire-line",
      command: () => navigate('/user-help'),
      className: "text-[0.8rem] user-profile-menu-item-list"
    },
    {
      label: t("logout"),
      icon: "ri-logout-circle-r-line",
      command: () => {
        // Clear cart from localStorage only
        localStorage.removeItem("cart");
        // Dispatch cart updated event
        window.dispatchEvent(new CustomEvent('cartUpdated', { detail: [] }));
        logout();
        let theme = localStorage.getItem("theme");
        localStorage.removeItem("userDetails");
        localStorage.removeItem("token");
        localStorage.setItem("theme", theme);
      },
      className: "text-[0.8rem] user-profile-menu-item-list"
    }
  ];

  // Fetch pending orders count for badge
  const fetchUserOrders = useCallback(async () => {
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
        const transformedOrders = response?.data?.data?.map(order => {
          const basePrice = Number(order.total_price || 0);
          const taxPrice = Number(order.tax_price || 0);
          const originalHandlingFee = Number(order.handling_fee || 0);
          const shippingCost = Number(order.total_shipping_cost || 0);

          // Calculate handling fee as shipping_cost_per_carton * total_cartons if available
          const calculatedHandlingFee = order.shipping_cost_per_carton && order.total_cartons
            ? Number(order.shipping_cost_per_carton) * Number(order.total_cartons)
            : originalHandlingFee;

          // Calculate final total including calculated handling fee
          const finalTotal = order.order_status === 'packed' || order.order_status === 'shipped' || order.order_status === 'delivered'
            ? basePrice + taxPrice + calculatedHandlingFee
            : basePrice + taxPrice + calculatedHandlingFee;

          return {
            id: order.id,
            orderId: order.order_id,
            status: order.payment_status,
            orderStatus: order.order_status,
            paymentStatus: order.payment_status,
            totalPrice: finalTotal,
            basePrice: basePrice,
            handlingFee: calculatedHandlingFee,
            shippingFee: taxPrice,
            totalAmount: finalTotal,
            createdAt: order.created_at,
            estimatedDeliveryDate: order.estimated_delivery_date,
            orderFulfilledDate: order.order_fulfilled_date,
            orderItems: order.order_items || [],
            orderHistory: order.order_history || [],
            shippingCostPerCarton: order.shipping_cost_per_carton,
            totalCartons: order.total_cartons,
            totalShippingCost: shippingCost
          };
        }) || [];

        setUserOrders(transformedOrders);

        // Count orders that are not delivered, cancelled, or rejected for pending count
        const pendingCount = transformedOrders.filter(order =>
          !['delivered', 'cancelled', 'rejected'].includes(order.orderStatus?.toLowerCase())
        ).length;
        setPendingOrdersCount(pendingCount);
      }
    } catch (error) {
      setUserOrders([]);
      setPendingOrdersCount(0);
    } finally {
      setOrdersLoading(false);
    }
  }, [userDetails?.id]);

  const fetchPendingOrdersCount = fetchUserOrders;

  // Fetch cart from backend when component mounts (only once) - and only if cart is empty
  // Update local cart state on mount
  useEffect(() => {
      const savedCart = JSON.parse(localStorage.getItem('cart')) || [];
      setCart(savedCart);
  }, []);

  // Handle trigger updates and pending orders
  useEffect(() => {
    setShowNavbar(true);
    fetchUserOrders();
  }, [triggerUpdate, token, userDetails?.id, fetchUserOrders]);

  // Listen to custom cart update events
  useEffect(() => {
    const handleCartUpdate = (event) => {
      setCart(event.detail || []);
    };

    const handleOrderUpdate = () => {
      fetchUserOrders();
    };

    window.addEventListener('cartUpdated', handleCartUpdate);
    window.addEventListener('orderUpdated', handleOrderUpdate);

    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
      window.removeEventListener('orderUpdated', handleOrderUpdate);
    };
  }, [fetchUserOrders]); // Only set up listeners once

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userDetails");
    navigate("/");
  };

  const handleCart = () => {
    setSideCartVisible(true);
  };

  const handlePendingPaymentOrders = () => {
    if (!token) {
      return;
    }
    setVisibleOrderDetails(true);
    // Don't fetch orders here - data is already loaded on component mount
  }

  // Scroll effect: hide on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setShowNavbar(false); // hide on scroll down
      } else {
        setShowNavbar(true); // show on scroll up
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  const handleOrderSuccess = () => {
    // Refresh pending orders count after successful order
    fetchPendingOrdersCount();
  }

  return (
    <div className={`${data?.length > 0 ? "" : 'hidden'}`}>
      <div
        className={`
          fixed top-0 left-0 right-0 bg-white shadow-md z-50 transition-transform duration-300 ease-in-out
          ${showNavbar ? 'translate-y-0' : '-translate-y-full'}
        `}
      >
        <div className="grid grid-cols-12 gap-2 sm:gap-4 items-center px-3 sm:px-4 py-1.5 sm:py-2 bg-white">
          {/* Logo */}
          <div className="col-span-6 md:col-span-2 flex items-center">
            <img
              className="hover:cursor-pointer w-[120px] sm:w-[160px] md:w-[120px]"
              onClick={() => navigate("/")}
              src={Logo}
              alt="logo-image"
            />
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex col-span-8 flex-wrap gap-4 items-center">
            {data?.map((item, index) => (
              <div key={index} className="text-sm">{item.name || item.title}</div>
            ))}
          </div>

          {/* Right Side (Cart / User) */}
          <div className="col-span-6 md:col-span-2 flex justify-end gap-2 sm:gap-4 items-center">
            <div className='relative'>
              <ButtonComponent
                onClick={handlePendingPaymentOrders}
                type="button"
                isBadge={token && pendingOrdersCount > 0}
                className="text-[18px] sm:text-[22px] text-black w-[1.5rem] sm:w-[2rem] mt-[2px]"
                icon="ri-notification-3-line"
              />
            </div>

            <div className='relative'>
              <ButtonComponent
                onClick={handleCart}
                type="button"
                className="text-[18px] sm:text-[22px] text-black w-[1.5rem] sm:w-[2rem]"
                icon="ri-shopping-bag-line"
              />
              {
                (cart?.length > 0 || (backendCart && backendCart.length > 0)) ? (
                  <span className="absolute top-[-0.5rem] sm:top-[-0.7rem] right-0 text-white bg-red-500 text-[10px] sm:text-xs w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center">
                    {backendCart && backendCart.length > 0
                      ? backendCart.reduce((sum, item) => sum + (item.quantity || 0), 0)
                      : cart?.length || 0}
                  </span>
                ) : null
              }
            </div>

            {/* User Avatar */}
            {userDetails ? (
              <Avatar
                className="mr-1 sm:mr-2 text-sm sm:text-base"
                label={userDetails?.name?.[0]}
                shape="circle"
                size="small"
                onClick={(e) => menu?.current.toggle(e)}
              />
            ) : (
              <ButtonComponent
                onClick={() => navigate(ROUTES_CONSTANTS.SIGN_IN)}
                type="button"
                className="text-[18px] sm:text-[22px] text-black w-[1.5rem] sm:w-[2rem] mt-[2px]"
                icon="ri-user-3-line"
              />
            )}

            {/* Mobile Menu Icon */}
            <button
              className="md:hidden text-xl sm:text-2xl"
              onClick={() => setMobileMenuShow(true)}
            >
              <i className="ri-menu-line" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Menu */}
      <Sidebar
        visible={MobileMenuShow}
        onHide={() => {
          setMobileMenuShow(false);
          setExpandedCategories(new Set());
        }}
        blockScroll
        position="left"
        className="w-[80vw] sm:w-[60vw]"
        header={<span className="text-base font-semibold">{t("categories") || "Categories"}</span>}
        contentStyle={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: '0'
        }}
      >
        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {/* Categories Section */}
          <div className="space-y-0 pb-4">
            {data?.map((item, index) => {
              const isExpanded = expandedCategories.has(item.id);
              const hasSubCategories = item?.sub_categories?.length > 0;

              return (
                <div key={index} className="border-b border-gray-100 last:border-b-0 overflow-hidden">
                  {/* Main Category Header */}
                  <div
                    className="flex items-center justify-between py-3 px-3 hover:bg-gray-50 cursor-pointer transition-all duration-200 active:bg-gray-100"
                    onClick={() => {
                      if (hasSubCategories) {
                        const newExpanded = new Set(expandedCategories);
                        if (isExpanded) {
                          newExpanded.delete(item.id);
                        } else {
                          newExpanded.add(item.id);
                        }
                        setExpandedCategories(newExpanded);
                      } else {
                        // Navigate to category if no subcategories
                        navigate(`${ROUTES_CONSTANTS?.VIEW_CATEGORY_DESCRIPTION}/${item?.name}`);
                        setMobileMenuShow(false);
                      }
                    }}
                  >
                    <span className="text-gray-800 font-medium text-sm">{item?.name}</span>
                    {hasSubCategories && (
                      <i className={`ri-arrow-${isExpanded ? 'up' : 'down'}-s-line text-gray-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : 'rotate-0'}`}></i>
                    )}
                  </div>

                  {/* Accordion Subcategories */}
                  {hasSubCategories && (
                    <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded
                        ? 'max-h-[500px] opacity-100'
                        : 'max-h-0 opacity-0'
                      }`}>
                      <div className="bg-gray-50">
                        {item.sub_categories.map((subCategory, subIndex) => (
                          <div
                            key={subIndex}
                            className="py-2.5 px-6 pl-8 hover:bg-gray-100 cursor-pointer transition-colors duration-200 border-b border-gray-200 last:border-b-0 relative"
                            onClick={() => {
                              navigate(`${ROUTES_CONSTANTS?.VIEW_SUB_CATEGORY_DESCRIPTION}/${subCategory?.name}`);
                              setMobileMenuShow(false);
                              setExpandedCategories(new Set());
                            }}
                          >
                            {/* Indent indicator */}
                            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 w-2 h-px bg-gray-300"></div>
                            <span className="text-gray-600 text-sm">{subCategory?.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Fixed User Section at Bottom */}
        <div className="flex-shrink-0 mt-auto pt-4 border-t border-gray-200 bg-white">
          {userDetails ? (
            <div className="space-y-3 px-3 pb-4">
              <div className="px-2">
                <div className="font-semibold text-gray-800 text-sm truncate">{userDetails?.name}</div>
                <div className="text-xs text-gray-500 truncate">{userDetails?.email}</div>
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => {
                    navigate('/edit-profile');
                    setMobileMenuShow(false);
                  }}
                  className="w-full text-left py-2 px-2 hover:bg-gray-50 rounded text-sm text-gray-700 transition-colors duration-200"
                >
                  <i className="ri-user-3-line mr-2"></i>
                  {t("edit_profile")}
                </button>
                <button
                  onClick={() => {
                    navigate('/order-history');
                    setMobileMenuShow(false);
                  }}
                  className="w-full text-left py-2 px-2 hover:bg-gray-50 rounded text-sm text-gray-700 transition-colors duration-200"
                >
                  <i className="ri-file-list-3-line mr-2"></i>
                  {t("order_history")}
                </button>
                <button
                  onClick={() => {
                    navigate('/track-order');
                    setMobileMenuShow(false);
                  }}
                  className="w-full text-left py-2 px-2 hover:bg-gray-50 rounded text-sm text-gray-700 transition-colors duration-200"
                >
                  <i className="ri-map-pin-line mr-2"></i>
                  {t("track_order")}
                </button>
                <button
                  onClick={() => {
                    navigate('/change-password');
                    setMobileMenuShow(false);
                  }}
                  className="w-full text-left py-2 px-2 hover:bg-gray-50 rounded text-sm text-gray-700 transition-colors duration-200"
                >
                  <i className="ri-lock-password-line mr-2"></i>
                  {t("change_password")}
                </button>
                <button
                  onClick={() => {
                    navigate('/user-help');
                    setMobileMenuShow(false);
                  }}
                  className="w-full text-left py-2 px-2 hover:bg-gray-50 rounded text-sm text-gray-700 transition-colors duration-200"
                >
                  <i className="ri-questionnaire-line mr-2"></i>
                  {t("help")}
                </button>
                <button
                  onClick={() => {
                    logout();
                    let theme = localStorage.getItem("theme");
                    localStorage.removeItem("userDetails");
                    localStorage.removeItem("token");
                    localStorage.setItem("theme", theme);
                    setMobileMenuShow(false);
                  }}
                  className="w-full text-left py-2 px-2 hover:bg-red-50 rounded text-sm text-red-600 transition-colors duration-200"
                >
                  <i className="ri-logout-circle-r-line mr-2"></i>
                  {t("logout")}
                </button>
              </div>
            </div>
          ) : (
            <div className="px-3 pb-4">
              <button
                onClick={() => {
                  navigate('/login');
                  setMobileMenuShow(false);
                }}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded text-sm font-medium hover:bg-blue-700 transition-colors duration-200"
              >
                {t("login") || "Login"}
              </button>
            </div>
          )}
        </div>
      </Sidebar>

      {/* Cart Sidebar */}
      <Sidebar
        visible={sideCartVisible}
        blockScroll={true}
        position="right"
        header={<span className="text-sm sm:text-base">{t("shopping_cart")}</span>}
        className="w-[95vw] sm:w-[420px] max-w-[420px]"
        onHide={() => setSideCartVisible(false)}
      >
        <div className="p-4 text-center text-gray-500">
          <i className="ri-shopping-cart-line text-4xl mb-2"></i>
          <p>Cart component removed</p>
        </div>
      </Sidebar>

      {/* Order Sidebar */}
      <Sidebar
        visible={visibleOrderDetails}
        blockScroll
        position="right"
        header={<span className="text-sm sm:text-base">{t("view_orders")}</span>}
        className="w-[95vw] sm:w-[420px] max-w-[420px]"
        onHide={() => setVisibleOrderDetails(false)}
      >
        <OrderDetailsComponent
          onCheckoutClose={handleOrderSuccess}
          onOrderUpdate={fetchPendingOrdersCount}
          orders={userOrders}
          loading={ordersLoading}
          onRefresh={fetchUserOrders}
        />
      </Sidebar>

      <TieredMenu
        model={loggedInItems}
        popup
        ref={menu}
        breakpoint="767px"
        className="p-0 text-[0.8rem] user-avatar-menu !z-[100000]"
      />
    </div>
  );
};

export default Navbar;
