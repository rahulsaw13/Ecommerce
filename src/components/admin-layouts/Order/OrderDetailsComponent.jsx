// components
import ButtonComponent from "@common/ButtonComponent";
import { allApiWithHeaderToken } from "@api/api";
import { API_CONSTANTS } from "@constants/apiurl";
import AdminPanelLoader from '@common/AdminPanelLoader';
import { refactorPrefilledDate } from '@helper';
import useCartStore from "@store";
import OngoingOrdersComponent from './OngoingOrdersComponent';
import OrderHistoryComponent from './OrderHistoryComponent';

// external libraries
import { useTranslation } from "react-i18next";
import { useState, useEffect, useRef, useCallback } from "react";
import { Toast } from "primereact/toast";
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';

const OrderDetailsComponent = ({ onCheckoutClose, onOrderUpdate, orders = [], loading = false, onRefresh }) => {
  const { t } = useTranslation("msg");
  const userDetails = JSON.parse(localStorage.getItem('userDetails'));
  const [notifications, setNotifications] = useState(orders);
  const [loader, setLoader] = useState(loading);
  const [expandedOrders, setExpandedOrders] = useState(new Set());
  const [uploadingReceipt, setUploadingReceipt] = useState(null);
  const [uploadingInProgress, setUploadingInProgress] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [hasMoreOrders, setHasMoreOrders] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentFilters, setCurrentFilters] = useState({
    orderNumber: '',
    deliveryDate: ''
  });
  const toast = useRef(null);
  const fileInputRef = useRef(null);

  // Get clearCart method from cart store
  const { clearCart } = useCartStore();

  // Handle banking receipt upload
  const handleBankingReceiptUpload = (orderNumber, orderId) => {
    setUploadingReceipt(orderNumber);
    // Create a file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,.pdf,application/pdf';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        // Validate file type
        const allowedTypes = [
          'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
          'application/pdf'
        ];
        
        if (!allowedTypes.includes(file.type)) {
          toast.current?.show({
            severity: "error",
            summary: t("error"),
            detail: t("please_upload_valid_image_or_pdf"),
            life: 3000,
          });
          setUploadingReceipt(null);
          return;
        }
        
        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB in bytes
        if (file.size > maxSize) {
          toast.current?.show({
            severity: "error",
            summary: t("error"),
            detail: t("file_size_too_large_max_10mb"),
            life: 3000,
          });
          setUploadingReceipt(null);
          return;
        }
        
        uploadBankingReceipt(orderId, file);
      } else {
        // Reset uploading state if no file selected (user cancelled)
        setUploadingReceipt(null);
      }
    };
    
    // Handle cancel/close dialog - reset uploading state
    input.oncancel = () => {
      setUploadingReceipt(null);
    };
    
    // Also handle focus events to detect when dialog is closed without selection
    const handleFocus = () => {
      setTimeout(() => {
        if (!input.files || input.files.length === 0) {
          setUploadingReceipt(null);
        }
      }, 300); // Small delay to ensure file dialog has closed
    };
    
    window.addEventListener('focus', handleFocus, { once: true });
    input.click();
  };

  // Upload banking receipt to server
  const uploadBankingReceipt = async (orderId, file) => {
    setUploadingInProgress(orderId);
    try {
      const data = {
        banking_receipt: file
      };
      
      const response = await allApiWithHeaderToken(
        `${API_CONSTANTS.COMMON_ORDER_URL}/${orderId}/upload_banking_receipt`,
        data,
        'post',
        'multipart/form-data'
      );
      
      if (response.status === 200) {
        toast.current?.show({
          severity: "success",
          summary: t("success"),
          detail: t("banking_receipt_uploaded_successfully"),
          life: 3000,
        });
        // Refresh orders to show updated status
        fetchUserOrders();
      }
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: t("error"),
        detail: err?.response?.data?.errors || t("failed_to_upload_banking_receipt"),
        life: 3000,
      });
    } finally {
      // Reset uploading states after upload completes (success or error)
      setUploadingReceipt(null);
      setUploadingInProgress(null);
    }
  };

  // Toggle order details view
  const toggleOrderDetails = (orderId) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  // Fetch user orders with filters
  const fetchUserOrders = async (filterParams = {}) => {
    
    if (orders && orders.length > 0 && !filterParams.orderNumber && !filterParams.deliveryDate) {
      // Use orders from props only if no filters are applied
      const transformedOrders = orders.map(order => {
        const basePrice = Number(order.total_price || 0);
        const taxPrice = Number(order.tax_price || 0);
        const originalHandlingFee = Number(order.handling_fee || 0);
        const shippingCost = Number(order.total_shipping_cost || 0);

        const calculatedHandlingFee = order.shipping_cost_per_carton && order.total_cartons
          ? Number(order.shipping_cost_per_carton) * Number(order.total_cartons)
          : originalHandlingFee;
        return {
          ...order,
          totalAmount: basePrice + taxPrice + calculatedHandlingFee + shippingCost,
          orderHistory: order.order_history || order.orderHistory || [] // Map order_history to orderHistory for consistency
        };
      });
      
      setNotifications(transformedOrders);
      setLoader(false);
      return;
    }

    // API call with filters
    setLoader(true);
    try {
      const requestData = { 
        user_id: userDetails.id,
        page: 1,
        per_page: 20
      };

      // Add filters to request if they exist
      if (filterParams.orderNumber) {
        requestData.order_number = filterParams.orderNumber;
      }
      if (filterParams.deliveryDate) {
        requestData.delivery_date = filterParams.deliveryDate;
      }

      const response = await allApiWithHeaderToken(
        `${API_CONSTANTS.COMMON_ORDER_URL}/get_by_user`,
        requestData,
        "post"
      );

      if (response.status === 200) {
        const fetchedOrders = response?.data?.data || [];
        
        // Transform orders to include calculated total amount and properly map order history
        const transformedOrders = fetchedOrders.map(order => {
          const basePrice = Number(order.total_price || 0);
          const taxPrice = Number(order.tax_price || 0);
          const originalHandlingFee = Number(order.handling_fee || 0);
          const shippingCost = Number(order.total_shipping_cost || 0);

          const calculatedHandlingFee = order.shipping_cost_per_carton && order.total_cartons
            ? Number(order.shipping_cost_per_carton) * Number(order.total_cartons)
            : originalHandlingFee;

          return {
            ...order,
            totalAmount: basePrice + taxPrice + calculatedHandlingFee + shippingCost,
            orderHistory: order.order_history || [] // Map order_history to orderHistory for consistency
          };
        });
        
        setNotifications(transformedOrders);
        setCurrentPage(1);
        setHasMoreOrders(fetchedOrders.length === 20);
        
        // Trigger parent refresh if callback provided
        if (onOrderUpdate) {
          onOrderUpdate();
        }

        // Dispatch global order update event
        window.dispatchEvent(new CustomEvent('orderUpdated'));
      }
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: t("error"),
        detail: err?.response?.data?.errors || t("failed_to_fetch_orders"),
        life: 3000,
      });
    } finally {
      setLoader(false);
    }
  };

  // Fetch more orders for infinite scroll
  const fetchMoreOrders = async () => {
    if (loadingMore || !hasMoreOrders) return;

    setLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const requestData = { 
        user_id: userDetails.id,
        page: nextPage,
        per_page: 20
      };

      // Add current filters to pagination request
      if (currentFilters.orderNumber) {
        requestData.order_number = currentFilters.orderNumber;
      }
      if (currentFilters.deliveryDate) {
        requestData.delivery_date = currentFilters.deliveryDate;
      }

      const response = await allApiWithHeaderToken(
        `${API_CONSTANTS.COMMON_ORDER_URL}/get_by_user`,
        requestData,
        "post"
      );

      if (response.status === 200) {
        const newOrders = response?.data?.data || [];
        
        if (newOrders.length === 0) {
          setHasMoreOrders(false);
        } else {
          // Transform new orders same as in fetchUserOrders
          const transformedNewOrders = newOrders.map(order => {
            const basePrice = Number(order.total_price || 0);
            const taxPrice = Number(order.tax_price || 0);
            const originalHandlingFee = Number(order.handling_fee || 0);
            const shippingCost = Number(order.total_shipping_cost || 0);

            const calculatedHandlingFee = order.shipping_cost_per_carton && order.total_cartons
              ? Number(order.shipping_cost_per_carton) * Number(order.total_cartons)
              : originalHandlingFee;

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
              orderHistory: order.order_histories || [],
              shippingCostPerCarton: order.shipping_cost_per_carton,
              totalCartons: order.total_cartons,
              totalShippingCost: shippingCost
            };
          });

          setNotifications(prev => [...prev, ...transformedNewOrders]);
          setCurrentPage(nextPage);
        }
      }
    } catch (err) {
    } finally {
      setLoadingMore(false);
    }
  };

  // NEW: Call the pay API to update order status from pending to completed
  const callPayAPI = async (orderId) => {
    try {
      const response = await allApiWithHeaderToken(
        `${API_CONSTANTS.COMMON_ORDER_URL}/${orderId}/pay`,
        {},
        "post"
      );

      if (response.status === 200) {
        
        // Clear cart after successful payment using cart store
        clearCart();
        localStorage.removeItem('orderDetails');
        
        toast.current?.show({
          severity: "success",
          summary: t("success"),
          detail: response.data.message || t("order_status_updated_to_completed"),
          life: 4000,
        });

        return response.data;
      }
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: t("error"),
        detail: error?.response?.data?.errors || t("failed_to_update_order_status"),
        life: 3000,
      });
      throw error;
    }
  };

  // Handle payment with Razorpay integration
  const handlePayment = async (orderId, orderApiId) => {
    setLoader(true);
    try {
      // Find the specific order for payment details
      const orderToProcess = notifications.find(n => n.id === orderApiId);
      if (!orderToProcess) {
        throw new Error(t("order_not_found"));
      }

      await loadRazorpay(orderToProcess);
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: t("error"),
        detail: err?.message || t("failed_to_initialize_payment"),
        life: 3000,
      });
      setLoader(false);
    }
  };

  // Razorpay payment integration
  const loadRazorpay = async (order) => {
    try {
      const body = {
        amount: order.totalPrice
      };

      const data = await allApiWithHeaderToken(API_CONSTANTS.PAYMENT_INTENT_CREATE, body, "post");
    
      const options = {
        key: data?.data?.razorpay_key_id,
        amount: data?.data.amount,
        currency: "INR",
        name: t("ecommerce_sweet"),
        description: t("order_payment"),
        order_id: data?.data.id,
        handler: async function (response) {
          try {
            const verifyRes = await allApiWithHeaderToken(API_CONSTANTS.PAYMENT_VERIFY, {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              order_id: order.id,
            }, "post");

            if (verifyRes?.status) {
              // 🎉 Payment verification successful - now call the pay API
              try {
                await callPayAPI(order.id);
                
                // Update local state to reflect completed payment
                setNotifications(prev =>
                  prev.map(notification =>
                    notification.id === order.id
                      ? { ...notification, status: "paid", paymentStatus: "paid", orderStatus: "completed" }
                      : notification
                  )
                );

                // Notify parent component about order update
                if (onOrderUpdate) {
                  onOrderUpdate();
                }

                // Dispatch global order update event
                window.dispatchEvent(new CustomEvent('orderUpdated'));



              } catch (payApiError) {
                // Payment was successful but pay API failed
                toast.current?.show({
                  severity: "warn",
                  summary: t("payment_successful"),
                  detail: t("payment_completed_but_order_status_update_failed"),
                  life: 5000,
                });
              }
            } else {
              toast.current?.show({
                severity: "error",
                summary: t("error"),
                detail: t("payment_verification_failed"),
                life: 3000,
              });
            }
          } catch (error) {
            toast.current?.show({
              severity: "error",
              summary: t("error"),
              detail: t("payment_verification_failed"),
              life: 3000,
            });
          }
        },
        prefill: {
          name: userDetails?.name,
          email: userDetails?.email,
          contact: userDetails?.phone_number,
        },
        theme: {
          color: "#F37254",
        },
        modal: {
          ondismiss: function() {
            setLoader(false);
            toast.current?.show({
              severity: "warn",
              summary: t("warning"),
              detail: t("payment_cancelled"),
              life: 3000,
            });
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: t("error"),
        detail: t("payment_failed_please_try_again"),
        life: 3000,
      });
    } finally {
      setLoader(false);
    }
  };

  // Handle order rejection/cancellation
  const handleCancelOrder = async (orderId, orderApiId) => {
    setLoader(true);
    try {
      const response = await allApiWithHeaderToken(
        `${API_CONSTANTS.COMMON_ORDER_URL}/${orderApiId}`,
        {},
        "delete"
      );

      if (response.status === 200) {
        toast.current?.show({
          severity: "success",
          summary: t("success"),
          detail: response.data.message || "Order has been cancelled",
          life: 3000,
        });

        // Update local state to show cancelled status instead of removing
        setNotifications(prev =>
          prev.map(notification => 
            notification.id === orderApiId
              ? { ...notification, orderStatus: 'cancelled' }
              : notification
          )
        );

        // Notify parent component about order update
        if (onOrderUpdate) {
          onOrderUpdate();
        }

        // Dispatch global order update event
        window.dispatchEvent(new CustomEvent('orderUpdated'));
      }
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: t("error"),
        detail: err?.response?.data?.errors || t("failed_to_cancel_order"),
        life: 3000,
      });
    } finally {
      setLoader(false);
    }
  };

  // Get status color and text
  const getStatusInfo = (orderStatus, paymentStatus) => {
    if (orderStatus === 'cancelled') {
      return {
        color: 'bg-red-100 text-red-800',
        text: t('cancelled'),
        showPayButton: false
      };
    } else if (orderStatus === 'rejected') {
      return {
        color: 'bg-red-100 text-red-800',
        text: t('rejected'),
        showPayButton: false
      };
    } else if (orderStatus === 'in_review') {
      return {
        color: 'bg-blue-100 text-blue-800',
        text: t('under_review'),
        showPayButton: false
      };
    } else if ((orderStatus === 'pending') && paymentStatus === 'payment_pending') {
      return {
        color: 'bg-green-100 text-green-800',
        text: t('ready_for_payment'),
        showPayButton: true // Enable payment after admin review (pending) or when packed
      };
    } else if ((orderStatus === 'pending') && paymentStatus === 'payment_offline') {
      return {
        color: 'bg-blue-100 text-blue-800',
        text: t('payment_receipt_added'),
        showPayButton: false
      };
    } else if (orderStatus === 'manufacturing_started') {
      return {
        color: 'bg-indigo-100 text-indigo-800',
        text: t('manufacturing_started'),
        showPayButton: false
      };
    } else if (orderStatus === 'manufacturing_completed') {
      return {
        color: 'bg-orange-100 text-orange-800',
        text: t('manufacturing_completed'),
        showPayButton: false
      };
    } else if (orderStatus === 'packaging') {
      return {
        color: 'bg-purple-100 text-purple-800',
        text: t('packaging_in_progress'),
        showPayButton: false
      };
    } else if (paymentStatus === 'payment_paid' || paymentStatus === 'payment_offline') {
      return {
        color: 'bg-emerald-100 text-emerald-800',
        text: t('payment_completed'),
        showPayButton: false
      };
    } else if (orderStatus === 'shipped') {
      return {
        color: 'bg-indigo-100 text-indigo-800',
        text: t('shipped'),
        showPayButton: false
      };
    } else if (orderStatus === 'delivered') {
      return {
        color: 'bg-green-200 text-green-900',
        text: t('delivered'),
        showPayButton: false
      };
    } else {
      return {
        color: 'bg-gray-100 text-gray-800',
        text: orderStatus?.replace(/_/g, ' ') || paymentStatus?.replace(/_/g, ' ') || t('unknown'),
        showPayButton: false
      };
    }
  };

  // Filter orders for different tabs
  const ongoingOrders = notifications.filter(order => 
    !['delivered', 'cancelled', 'rejected', 'shipped'].includes(order.orderStatus?.toLowerCase())
  );
  
  const completedOrders = notifications.filter(order => 
    ['delivered', 'cancelled', 'rejected', 'shipped'].includes(order.orderStatus?.toLowerCase())
  );
  
  const allOrders = notifications;

  // Handle filter changes from OrderHistoryComponent
  const handleFilterChange = useCallback((filters) => {
    setCurrentFilters(filters);
    fetchUserOrders(filters);
  }, []);

  // Use effect to fetch orders on mount
  useEffect(() => {
    fetchUserOrders();
  }, [orders]);

  // Update loader when loading prop changes
  useEffect(() => {
    setLoader(loading);
  }, [loading]);



  // View order details in dialog
  const viewOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowOrderDialog(true);
  };

  // Format date for table display
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return '-';
    }
  };

  // Format total amount for table display
  const formatAmount = (amount) => {
    if (!amount || isNaN(amount)) return '₹0';
    return `₹${Number(amount).toLocaleString('en-IN')}`;
  };

  // Status template for table
  const statusTemplate = (rowData) => {
    const statusInfo = getStatusInfo(rowData.orderStatus, rowData.paymentStatus);
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusInfo.color}`}>
        {t(statusInfo.text)}
      </span>
    );
  };

  // Action template for table
  const actionTemplate = (rowData) => {
    return (
      <Button
        icon="ri-eye-line"
        className="p-button-text p-button-sm"
        onClick={() => viewOrderDetails(rowData)}
        tooltip={t('view_details')}
      />
    );
  };

  return (
    <>
      {loader && <AdminPanelLoader />}
      <Toast ref={toast} position="top-right" style={{ scale: '0.7' }} />
      
      {/* Tabbed Interface */}
      <div className="h-full">
        <div className="border-b border-gray-200 px-2 sm:px-0">
          <nav className="-mb-px flex space-x-4 sm:space-x-8">
            <button
              onClick={() => setActiveIndex(0)}
              className={`py-2 sm:py-3 px-1 sm:px-2 border-b-2 font-medium text-xs sm:text-sm transition-colors duration-200 ${
                activeIndex === 0
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {t('ongoing_orders')}
            </button>
            <button
              onClick={() => setActiveIndex(1)}
              className={`py-2 sm:py-3 px-1 sm:px-2 border-b-2 font-medium text-xs sm:text-sm transition-colors duration-200 ${
                activeIndex === 1
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {t('order_history')}
            </button>
            <div className="ml-auto flex items-center">
              <button
                onClick={onRefresh || (() => {})}
                className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200 rounded-md hover:bg-gray-100"
                title={t('refresh')}
              >
                <i className="ri-refresh-line text-base sm:text-lg"></i>
              </button>
            </div>
          </nav>
        </div>

        <div className="h-full px-2 sm:px-0">
          {/* Ongoing Orders Tab Content */}
          {activeIndex === 0 && (
            <div className="h-full overflow-y-auto pt-3 sm:pt-6 pb-4">
              <OngoingOrdersComponent
                orders={ongoingOrders}
                loader={loader}
                expandedOrders={expandedOrders}
                setExpandedOrders={setExpandedOrders}
                uploadingReceipt={uploadingReceipt}
                uploadingInProgress={uploadingInProgress}
                getStatusInfo={getStatusInfo}
                toggleOrderDetails={toggleOrderDetails}
                handlePayment={handlePayment}
                handleBankingReceiptUpload={handleBankingReceiptUpload}
                handleCancelOrder={handleCancelOrder}
              />
            </div>
          )}

          {/* Order History Tab Content */}
          {activeIndex === 1 && (
            <div className="pt-3 sm:pt-4 pb-6">
              <OrderHistoryComponent
                orders={completedOrders}
                loader={loader}
                getStatusInfo={getStatusInfo}
                handlePayment={handlePayment}
                handleBankingReceiptUpload={handleBankingReceiptUpload}
                handleCancelOrder={handleCancelOrder}
                fetchMoreOrders={fetchMoreOrders}
                hasMoreOrders={hasMoreOrders}
                loadingMore={loadingMore}
                onRefresh={onRefresh}
                onFilterChange={handleFilterChange}
              />
            </div>
          )}
        </div>

        {/* Order Details Dialog */}
        <Dialog
          header={t("order_details")}
          visible={showOrderDetails}
          style={{ width: "95vw", maxWidth: "800px" }}
          onHide={() => setShowOrderDetails(false)}
          modal
          className="p-fluid order-details-dialog"
          contentStyle={{ padding: "1rem" }}
        >
          {selectedOrder && (
            <div className="space-y-3 sm:space-y-4">
              {/* Order Header */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                <div className="flex-1">
                  <h3 className="text-base sm:text-lg font-semibold">{selectedOrder.orderId}</h3>
                  <p className="text-gray-600 text-sm">{t("order_date")}: {refactorPrefilledDate(selectedOrder.createdAt)}</p>
                </div>
                <div className="sm:text-right">
                  <div className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${getStatusInfo(selectedOrder.orderStatus, selectedOrder.paymentStatus).color}`}>
                    {t(getStatusInfo(selectedOrder.orderStatus, selectedOrder.paymentStatus).text)}
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h4 className="font-semibold mb-2 sm:mb-3 text-sm sm:text-base">{t("order_items")}</h4>
                <div className="space-y-2 sm:space-y-3">
                  {selectedOrder.orderItems?.map((item, index) => (
                    <div key={index} className="flex flex-col sm:flex-row sm:items-center gap-3 p-2 sm:p-3 border rounded">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded flex-shrink-0 flex items-center justify-center">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="w-full h-full object-cover rounded"
                            />
                          ) : (
                            <i className="ri-image-line text-gray-400 text-lg sm:text-xl"></i>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="font-medium text-sm sm:text-base truncate">{item.name}</h5>
                          <p className="text-gray-600 text-xs sm:text-sm">{t("weight")}: {item.weight}</p>
                          <span className="text-xs sm:text-sm text-gray-600">{t("quantity")}: {item.quantity}</span>
                        </div>
                      </div>
                      <div className="text-right sm:flex-shrink-0">
                        <div className="font-medium text-sm sm:text-base">
                          ₹{Number(item.discounted_price || item.price)} × {item.quantity}
                          {item.discounted_price && Number(item.discounted_price) < Number(item.price) && (
                            <span className="ml-1 sm:ml-2 text-gray-400 line-through text-xs sm:text-sm">₹{Number(item.price)}</span>
                          )}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600">
                          {t("total")}: ₹{(Number(item.discounted_price || item.price) * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className="border-t pt-3 sm:pt-4">
                <h4 className="font-semibold mb-2 sm:mb-3 text-sm sm:text-base">{t("order_summary")}</h4>
                <div className="space-y-1 sm:space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{t("base_price")}</span>
                    <span>₹{selectedOrder.basePrice || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>{t("handling_fee")}</span>
                    <span>₹{selectedOrder.handlingFee || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>{t("tax_price")}</span>
                    <span>₹{selectedOrder.shippingFee || 0}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-base sm:text-lg border-t pt-2">
                    <span>{t("total_amount")}</span>
                    <span>₹{selectedOrder.totalAmount || 0}</span>
                  </div>
                </div>
              </div>

              {/* Delivery Information */}
              {selectedOrder.estimatedDeliveryDate && (
                <div className="border-t pt-3 sm:pt-4">
                  <h4 className="font-semibold mb-2 sm:mb-3 text-sm sm:text-base">{t("delivery_information")}</h4>
                  <p className="text-sm sm:text-base">{t("estimated_delivery_date")}: {new Date(selectedOrder.estimatedDeliveryDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  })}</p>
                </div>
              )}
            </div>
          )}
        </Dialog>
      </div>
    </>
  );
};

export default OrderDetailsComponent;