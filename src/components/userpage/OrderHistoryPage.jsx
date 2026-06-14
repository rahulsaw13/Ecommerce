import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Dialog } from 'primereact/dialog';
import { allApiWithHeaderToken } from '@api/api';
import { API_CONSTANTS } from '@constants/apiurl';
import Header from '@common/Header';
import Footer from '@common/Footer';
import UserLoader from '@userpage-pages/UserLoader';

const RETURN_REASONS = [
  { value: 'DAMAGED', label: 'Item arrived damaged' },
  { value: 'WRONG_ITEM', label: 'Wrong item received' },
  { value: 'MISSING_ITEM', label: 'Item missing from order' },
  { value: 'QUALITY_ISSUE', label: 'Quality not as expected' },
  { value: 'CHANGED_MIND', label: 'Changed my mind' },
];

const RESOLUTION_OPTIONS = [
  { value: 'REFUND_WALLET', label: 'Refund to wallet' },
  { value: 'REPLACEMENT', label: 'Replace the item' },
  { value: 'REFUND_ORIGINAL', label: 'Refund to original payment' },
];

const OrderHistoryPage = () => {
  const { t } = useTranslation('msg');
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [menuList, setMenuList] = useState([]);
  const [showReceipt, setShowReceipt] = useState(false);

  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnOrder, setReturnOrder] = useState(null);
  const [returnReason, setReturnReason] = useState('');
  const [returnComment, setReturnComment] = useState('');
  const [returnResolution, setReturnResolution] = useState('REFUND_WALLET');
  const [returnSubmitting, setReturnSubmitting] = useState(false);
  const [returnSuccess, setReturnSuccess] = useState(null);
  const [returnError, setReturnError] = useState('');

  let userDetails = null;
  try {
    const raw = localStorage.getItem('userDetails');
    userDetails = raw ? JSON.parse(raw) : null;
  } catch (e) {
    userDetails = null;
  }

  useEffect(() => {
    if (!userDetails?.id) {
      navigate('/sign-in');
      return;
    }
    fetchOrders();
    fetchMenuList();
  }, [userDetails?.id]);

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

  const fetchOrders = async () => {
    setLoading(true);
    try {
      // Backend endpoint: POST /orders/get_by_user with { user_id }
      // Returns array of orders with payment_status field set by backend
      // Payment status values: "PENDING", "paid_online", "paid_offline", "failed", "refunded"
      // To update payment_status, use: PUT /orders/{orderId}/status with { payment_status: value }
      const response = await allApiWithHeaderToken(
        `${API_CONSTANTS.COMMON_ORDER_URL}/get_by_user`,
        { user_id: userDetails.id },
        'post'
      );

      if (response.status === 200) {
        const transformedOrders = response?.data?.data?.map(order => {
          const totalPrice = Number(order.total_price || 0);
          const taxPrice = Number(order.tax_price || 0);
          const handlingFee = Number(order.handling_fee || 0);
          const deliveryCharge = Number(order.delivery_charge || 0);
          const totalShippingCost = Number(order.total_shipping_cost || 0);

          const subtotalMrp = Number(order.subtotal_mrp || 0);
          const subtotalSellingPrice = Number(order.subtotal_selling_price || 0);
          const productDiscount = Number(order.product_discount || 0);
          const promoDiscount = Number(order.promo_discount || 0);
          const couponDiscount = Number(order.coupon_discount || 0);

          return {
            id: order.id,
            orderId: order.order_id,
            status: order.order_status,
            orderStatus: order.order_status,
            paymentStatus: order.payment_status,
            paymentMode: order.payment_mode,
            orderType: order.order_type,

            totalPrice: totalPrice,
            totalAmount: totalPrice,

            subtotalMrp: subtotalMrp,
            subtotalSellingPrice: subtotalSellingPrice,
            productDiscount: productDiscount,
            promoDiscount: promoDiscount,
            couponCode: order.coupon_code,
            couponDiscount: couponDiscount,

            basePrice: subtotalSellingPrice,
            taxPrice: taxPrice,
            handlingFee: handlingFee,
            deliveryCharge: deliveryCharge,
            shippingFee: taxPrice,

            createdAt: order.created_at || order.createdAt,
            estimatedDeliveryDate: order.estimated_delivery_date || order.estimatedDeliveryDate,
            orderFulfilledDate: order.order_fulfilled_date || order.orderFulfilledDate,

            orderItems: order.order_items || [],
            orderHistory: order.order_history || [],
            shippingAddress: order.shipping_address,
            deliveryNotes: order.delivery_notes,

            shippingCostPerCarton: order.shipping_cost_per_carton,
            totalCartons: order.total_cartons,
            totalShippingCost: totalShippingCost
          };
        }) || [];

        transformedOrders.sort((a, b) => {
          const dateA = normalizeDateValue(a.createdAt);
          const dateB = normalizeDateValue(b.createdAt);
          const timeA = dateA ? dateA.getTime() : 0;
          const timeB = dateB ? dateB.getTime() : 0;
          return timeB - timeA;
        });
        setOrders(transformedOrders);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const statusColors = {
      initiated: 'bg-blue-100 text-blue-800 border-blue-200',
      processing: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      shipped: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      delivered: 'bg-green-100 text-green-800 border-green-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200',
      refunded: 'bg-orange-100 text-orange-800 border-orange-200',
      failed: 'bg-gray-100 text-gray-800 border-gray-200',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      packed: 'bg-purple-100 text-purple-800 border-purple-200',
      created: 'bg-gray-100 text-gray-700 border-gray-300',
      paid: 'bg-blue-100 text-blue-700 border-blue-300',
      rejected: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return statusColors[status?.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getPaymentStatusColor = (status) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid_online: 'bg-green-100 text-green-800',
      paid_offline: 'bg-blue-100 text-blue-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-orange-100 text-orange-800',
      paid: 'bg-green-100 text-green-800',
      due: 'bg-yellow-100 text-yellow-800',
      overdue: 'bg-red-100 text-red-800',
      'partial refund': 'bg-orange-100 text-orange-800',
      'credit note generated': 'bg-purple-100 text-purple-800',
      cleared: 'bg-green-100 text-green-800',
    };
    return statusColors[status?.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentStatusLabel = (status) => {
    const labels = {
      pending: 'Pending',
      paid_online: 'Paid Online',
      paid_offline: 'Paid (Cash)',
      failed: 'Payment Failed',
      refunded: 'Refunded',
      paid: 'Paid',
      due: 'Due',
      overdue: 'Overdue',
      'partial refund': 'Partial Refund',
      'credit note generated': 'Credit Note',
      cleared: 'Cleared',
    };
    const key = status?.toLowerCase();
    return labels[key] || status?.replace(/_/g, ' ')?.replace(/\b\w/g, c => c.toUpperCase()) || 'Unknown';
  };

  const getOrderStatusLabel = (status) => {
    const labels = {
      in_review: 'In Review',
      pending: 'Pending',
      initiated: 'Initiated',
      processing: 'Processing',
      manufacturing_started: 'Manufacturing',
      manufacturing_completed: 'Manufactured',
      packaging: 'Packaging',
      packed: 'Packed',
      shipped: 'Shipped',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
      failed: 'Failed',
      created: 'Created',
      rejected: 'Rejected',
      refunded: 'Refunded',
    };
    const key = status?.toLowerCase();
    return labels[key] || status?.replace(/_/g, ' ')?.replace(/\b\w/g, c => c.toUpperCase()) || 'Unknown';
  };

  const normalizeDateValue = (value) => {
    if (value === null || value === undefined || value === '') return null;

    if (typeof value === 'number' && !Number.isNaN(value)) {
      return new Date(value);
    }

    if (typeof value === 'object') {
      if (value instanceof Date) return value;
      if (value.seconds != null) {
        return new Date(value.seconds * 1000 + (value.nanos ? value.nanos / 1e6 : 0));
      }
      value = String(value);
    }

    let dateString = String(value).trim();
    if (dateString === '') return null;

    // Handle Java 8+ timestamp format: "2026-05-09T23:41:40.135428+05:30[Asia/Kolkata]"
    // Strip timezone and zone info
    dateString = dateString.replace(/\[.*?\]$/, '').trim();
    
    // Handle ISO 8601 with timezone offset
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?[+-]\d{2}:\d{2}$/.test(dateString)) {
      // Parse directly - JavaScript Date handles ISO 8601 with offset
      const parsed = new Date(dateString);
      if (!isNaN(parsed.getTime())) return parsed;
    }

    // Handle space-separated format: "2026-05-09 23:41:40.135428+05:30"
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(\.\d+)?[+-]\d{2}:\d{2}$/.test(dateString)) {
      dateString = dateString.replace(' ', 'T');
      const parsed = new Date(dateString);
      if (!isNaN(parsed.getTime())) return parsed;
    }

    // Handle simple ISO date: "2026-05-09"
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      dateString = `${dateString}T00:00:00`;
    }

    const parsed = new Date(dateString);
    if (!isNaN(parsed.getTime())) return parsed;

    const fallback = Date.parse(dateString);
    return Number.isNaN(fallback) ? null : new Date(fallback);
  };

  const formatDate = (dateValue) => {
    if (dateValue === null || dateValue === undefined || dateValue === '') return 'N/A';
    const date = normalizeDateValue(dateValue);
    return date ? date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }) : 'Invalid Date';
  };

  const formatCurrency = (amount) => {
    return `₹${Number(amount || 0).toFixed(2)}`;
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.orderId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.orderItems?.some(item =>
                           item.name?.toLowerCase().includes(searchQuery.toLowerCase())
                         );
    return matchesSearch;
  });

  const handleViewReceipt = (order) => {
    setSelectedOrder(order);
    setShowReceipt(true);
  };

  const canRaiseReturn = (order) => {
    if (order.orderStatus?.toLowerCase() !== 'delivered') return false;
    const deliveredAt = normalizeDateValue(order.orderFulfilledDate || order.createdAt);
    if (!deliveredAt) return true;
    const hoursSince = (Date.now() - deliveredAt.getTime()) / (1000 * 60 * 60);
    return hoursSince <= 48;
  };

  const handleOpenReturn = (order) => {
    setReturnOrder(order);
    setReturnReason('');
    setReturnComment('');
    setReturnResolution('REFUND_WALLET');
    setReturnSuccess(null);
    setReturnError('');
    setShowReturnModal(true);
  };

  const handleSubmitReturn = async () => {
    if (!returnReason) { setReturnError('Please select a reason.'); return; }
    setReturnSubmitting(true);
    setReturnError('');
    try {
      const response = await allApiWithHeaderToken(
        `${API_CONSTANTS.RETURN_REQUEST_URL}/${returnOrder.orderId}/return`,
        { reason: returnReason, comment: returnComment, preferred_resolution: returnResolution },
        'post'
      );
      if (response.status === 200) {
        setReturnSuccess(response.data?.data);
      } else {
        setReturnError(response.data?.message || 'Failed to raise return request.');
      }
    } catch (err) {
      setReturnError(err?.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setReturnSubmitting(false);
    }
  };

  const ReceiptContent = ({ order }) => {
    if (!order) return null;

    const formatAddress = (address) => {
      if (!address) return 'N/A';
      const parts = [
        address.flat_no,
        address.landmark,
        address.city,
        address.state,
        address.zip_code,
        address.country
      ].filter(Boolean);
      return parts.join(', ');
    };

    const products = order.orderItems || [];

    const subtotalMrp = Number(order.subtotalMrp || 0);
    const subtotalSellingPrice = Number(order.subtotalSellingPrice || 0);
    const productDiscount = Number(order.productDiscount || 0);
    const promoDiscount = Number(order.promoDiscount || 0);
    const couponDiscount = Number(order.couponDiscount || 0);
    const taxPrice = Number(order.taxPrice || 0);
    const handlingFee = Number(order.handlingFee || 0);
    const deliveryCharge = Number(order.deliveryCharge || 0);
    const finalTotal = Number(order.totalAmount || 0);

    const totalDiscounts = productDiscount + promoDiscount + couponDiscount;

    return (
      <div className="bg-white p-6">
        <div className="text-center mb-6 border-b pb-4">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">INVOICE</h1>
          <div className="h-1 w-full bg-gray-300"></div>
        </div>

        <div className="grid grid-cols-2 gap-6 text-sm text-gray-700 mb-6">
          <div>
            <p className="mb-1"><strong>Invoice ID:</strong> #{order.orderId}</p>
            <p className="mb-1"><strong>Date:</strong> {formatDate(order.createdAt)}</p>
            {order.estimatedDeliveryDate && (
              <p className="mb-1"><strong>Delivery Date:</strong> {formatDate(order.estimatedDeliveryDate)}</p>
            )}
          </div>
          <div className="text-right">
            <p className="mb-1"><strong>Order Status:</strong> {getOrderStatusLabel(order.orderStatus)}</p>
            <p className="mb-1"><strong>Payment Status:</strong> {getPaymentStatusLabel(order.paymentStatus)}</p>
            <p className="mb-1"><strong>Payment Mode:</strong> <span className="capitalize">{order.paymentMode?.replace(/_/g, ' ')}</span></p>
          </div>
        </div>

        {order.shippingAddress && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-1">Shipping Information</h2>
            <div className="text-sm text-gray-700">
              <p className="mb-1"><strong>Name:</strong> {order.shippingAddress.name || 'N/A'}</p>
              <p className="mb-1"><strong>Phone:</strong> {order.shippingAddress.phone_number || 'N/A'}</p>
              <p className="mb-1"><strong>Address:</strong> {formatAddress(order.shippingAddress)}</p>
            </div>
          </div>
        )}

        {order.deliveryNotes && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-1">Delivery Notes</h2>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
              <p className="text-sm text-gray-700 italic">{order.deliveryNotes}</p>
            </div>
          </div>
        )}

        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Order Details</h2>

          <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 border-b-2 border-gray-300 font-semibold text-sm text-gray-700">
            <div className="col-span-1">#</div>
            <div className="col-span-5">Product</div>
            <div className="col-span-2 text-center">Qty</div>
            <div className="col-span-2 text-center">Unit Price</div>
            <div className="col-span-2 text-right">Subtotal</div>
          </div>

          <div className="divide-y divide-gray-200">
            {products.map((item, index) => {
              const itemPrice = Number(item.price || 0);
              const itemQuantity = Number(item.quantity || 1);
              const itemSubtotal = itemPrice * itemQuantity;

              return (
                <div key={item.id || index} className="grid grid-cols-12 gap-4 px-4 py-4 text-sm">
                  <div className="col-span-1 text-gray-600">{index + 1}</div>
                  <div className="col-span-5">
                    <p className="font-medium text-gray-900">{item.product_name || item.name}</p>
                    {item.weight && (
                      <p className="text-xs text-gray-500 mt-1">Weight: {item.weight}</p>
                    )}
                  </div>
                  <div className="col-span-2 text-center text-gray-700">{itemQuantity}</div>
                  <div className="col-span-2 text-center text-gray-700">₹{itemPrice.toFixed(2)}</div>
                  <div className="col-span-2 text-right font-medium text-gray-900">
                    ₹{itemSubtotal.toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end mb-6">
          <div className="w-80 border-t-2 border-gray-300 pt-4">
            <div className="space-y-2">
              {subtotalMrp > 0 && (
                <div className="flex justify-between text-sm text-gray-700">
                  <span>Subtotal (MRP):</span>
                  <span>₹{subtotalMrp.toFixed(2)}</span>
                </div>
              )}
              {productDiscount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Product Discount:</span>
                  <span>- ₹{productDiscount.toFixed(2)}</span>
                </div>
              )}
              {subtotalSellingPrice > 0 && (
                <div className="flex justify-between text-sm text-gray-700">
                  <span>Subtotal (Selling Price):</span>
                  <span>₹{subtotalSellingPrice.toFixed(2)}</span>
                </div>
              )}
              {promoDiscount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Promo Discount:</span>
                  <span>- ₹{promoDiscount.toFixed(2)}</span>
                </div>
              )}
              {couponDiscount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Coupon Discount {order.couponCode ? `(${order.couponCode})` : ''}:</span>
                  <span>- ₹{couponDiscount.toFixed(2)}</span>
                </div>
              )}
              {totalDiscounts > 0 && (
                <div className="flex justify-between text-sm font-semibold text-green-700 pt-1 border-t border-gray-200">
                  <span>Total Discounts:</span>
                  <span>- ₹{totalDiscounts.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-medium text-gray-800 pt-1 border-t border-gray-200">
                <span>Subtotal (After Discounts):</span>
                <span>₹{(subtotalSellingPrice - promoDiscount - couponDiscount).toFixed(2)}</span>
              </div>
              {taxPrice > 0 && (
                <div className="flex justify-between text-sm text-gray-700">
                  <span>Tax:</span>
                  <span>₹{taxPrice.toFixed(2)}</span>
                </div>
              )}
              {handlingFee > 0 && (
                <div className="flex justify-between text-sm text-gray-700">
                  <span>Handling Fee:</span>
                  <span>₹{handlingFee.toFixed(2)}</span>
                </div>
              )}
              {deliveryCharge > 0 && (
                <div className="flex justify-between text-sm text-gray-700">
                  <span>Delivery Charge:</span>
                  <span>₹{deliveryCharge.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t-2 border-gray-400">
                <span>Grand Total:</span>
                <span>₹{finalTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-300 text-center text-xs text-gray-500">
          <p>Thank you for your business!</p>
          <p className="mt-2">This is a computer generated invoice.</p>
        </div>
      </div>
    );
  };

  if (loading) {
    return <UserLoader />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="pt-[160px] md:pt-20 pb-20 md:pb-8">
        <div className="p-4 md:p-6 mt-4 w-full max-w-screen-xl mx-auto">
          <h1 className="text-[20px] sm:text-[24px] md:text-[36px] font-bold text-center mb-4 text-[#1D2E43] font-[playfair]">
            {t('order_history') || 'Order History'}
          </h1>

          <div className="flex justify-center mb-6 text-gray-600 text-sm">
            <p className="text-[#1D2E43]">
              <span onClick={() => navigate('/')} className="cursor-pointer hover:text-yellow-600">
                Home
              </span>
              {" / "}
              <span className="text-gray-600">{t('order_history') || 'Order History'}</span>
            </p>
          </div>

          <div className="bg-white rounded-lg border p-4 mb-6">
            <div className="relative max-w-md">
              <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                placeholder={t('search_orders') || 'Search by order ID or product name...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center border">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-shopping-bag-line text-4xl text-gray-400"></i>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {t('no_orders_found') || 'No orders found'}
              </h2>
              <p className="text-gray-600 mb-6">
                {searchQuery
                  ? t('try_different_search') || 'Try a different search term'
                  : t('start_shopping') || 'Start shopping to see your orders here'}
              </p>
              <button
                onClick={() => navigate('/')}
                className="bg-yellow-400 text-gray-900 px-6 py-3 rounded-lg font-bold hover:bg-yellow-500 transition-colors"
              >
                {t('continue_shopping') || 'Continue Shopping'}
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-lg border overflow-hidden">
              <div className="p-4 border-b bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900">
                  Your Orders ({filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'})
                </h2>
              </div>

              <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <div className="col-span-2">Order ID</div>
                <div className="col-span-2">Date</div>
                <div className="col-span-1">Items</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2">Payment</div>
                <div className="col-span-2 text-right">Total</div>
                <div className="col-span-1 text-center">Actions</div>
              </div>

              <div className="divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <div key={order.id} className="p-4 md:p-6 hover:bg-gray-50 transition-colors">
                    {/* Desktop */}
                    <div className="hidden md:grid grid-cols-12 gap-4 items-center">
                      <div className="col-span-2">
                        <span className="text-sm font-bold text-gray-900">#{order.orderId}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-sm text-gray-600">{formatDate(order.createdAt)}</span>
                      </div>
                      <div className="col-span-1">
                        <span className="text-sm text-gray-600">{order.orderItems?.length || 0} item(s)</span>
                      </div>
                      <div className="col-span-2">
                        <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(order.orderStatus)}`}>
                          {getOrderStatusLabel(order.orderStatus)}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${getPaymentStatusColor(order.paymentStatus)}`}>
                          {getPaymentStatusLabel(order.paymentStatus)}
                        </span>
                      </div>
                      <div className="col-span-2 text-right">
                        <span className="text-sm font-bold text-gray-900">{formatCurrency(order.totalAmount)}</span>
                      </div>
                      <div className="col-span-1 flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleViewReceipt(order)}
                          className="p-2 text-gray-600 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                          title="View Receipt"
                        >
                          <i className="ri-file-text-line text-lg"></i>
                        </button>
                        <button
                          onClick={() => navigate(`/track-order?orderId=${order.orderId}`)}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Track Order"
                        >
                          <i className="ri-map-pin-line text-lg"></i>
                        </button>
                        {canRaiseReturn(order) && (
                          <button
                            onClick={() => handleOpenReturn(order)}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Return / Refund"
                          >
                            <i className="ri-arrow-go-back-line text-lg"></i>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Mobile */}
                    <div className="md:hidden space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-sm font-bold text-gray-900">#{order.orderId}</span>
                          <p className="text-xs text-gray-500 mt-1">{formatDate(order.createdAt)}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewReceipt(order)}
                            className="p-2 text-gray-600 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                            title="View Receipt"
                          >
                            <i className="ri-file-text-line text-lg"></i>
                          </button>
                          <button
                            onClick={() => navigate(`/track-order?orderId=${order.orderId}`)}
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Track Order"
                          >
                            <i className="ri-map-pin-line text-lg"></i>
                          </button>
                          {canRaiseReturn(order) && (
                            <button
                              onClick={() => handleOpenReturn(order)}
                              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Return / Refund"
                            >
                              <i className="ri-arrow-go-back-line text-lg"></i>
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <span>{order.orderItems?.length || 0} item(s)</span>
                        <span>•</span>
                        <span className={`inline-flex px-2 py-1 font-medium rounded-full ${getStatusColor(order.orderStatus)}`}>
                          {getOrderStatusLabel(order.orderStatus)}
                        </span>
                        <span>•</span>
                        <span className={`inline-flex px-2 py-1 font-medium rounded-full ${getPaymentStatusColor(order.paymentStatus)}`}>
                          {getPaymentStatusLabel(order.paymentStatus)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t">
                        <span className="text-xs text-gray-600">Total</span>
                        <span className="text-sm font-bold text-gray-900">{formatCurrency(order.totalAmount)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <Dialog
        visible={showReceipt}
        onHide={() => setShowReceipt(false)}
        header={`Invoice - #${selectedOrder?.orderId}`}
        style={{ width: '90vw', maxWidth: '800px' }}
        modal
        dismissableMask
        draggable={false}
      >
        <ReceiptContent order={selectedOrder} />
      </Dialog>

      <Dialog
        visible={showReturnModal}
        onHide={() => { if (!returnSubmitting) { setShowReturnModal(false); setReturnSuccess(null); } }}
        header={`Return / Refund — #${returnOrder?.orderId}`}
        style={{ width: '90vw', maxWidth: '520px' }}
        modal
        dismissableMask={!returnSubmitting}
        draggable={false}
      >
        {returnSuccess ? (
          <div className="text-center py-6 px-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-checkbox-circle-line text-4xl text-green-500"></i>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Return Request Raised!</h3>
            <p className="text-gray-600 text-sm mb-4">
              Your return request <span className="font-semibold text-gray-800">{returnSuccess.return_id}</span> has been submitted.
              We will review it within 24–48 hours.
            </p>
            <div className="bg-gray-50 rounded-lg p-4 text-left text-sm mb-6 space-y-1">
              <p><span className="text-gray-500">Reason:</span> <span className="font-medium text-gray-800">{RETURN_REASONS.find(r => r.value === returnSuccess.reason)?.label || returnSuccess.reason}</span></p>
              <p><span className="text-gray-500">Resolution requested:</span> <span className="font-medium text-gray-800">{RESOLUTION_OPTIONS.find(r => r.value === returnSuccess.preferred_resolution)?.label || returnSuccess.preferred_resolution}</span></p>
              <p><span className="text-gray-500">Status:</span> <span className="inline-flex px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">Initiated</span></p>
            </div>
            <button
              onClick={() => { setShowReturnModal(false); setReturnSuccess(null); fetchOrders(); }}
              className="bg-yellow-400 text-gray-900 px-6 py-2 rounded-lg font-bold hover:bg-yellow-500 transition-colors w-full"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="p-2 space-y-5">
            <p className="text-sm text-gray-600">
              Raise a return request for order <span className="font-semibold text-gray-800">#{returnOrder?.orderId}</span>.
              Returns must be raised within <span className="font-semibold">48 hours</span> of delivery.
            </p>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Reason for return <span className="text-red-500">*</span></label>
              <select
                value={returnReason}
                onChange={e => setReturnReason(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
              >
                <option value="">-- Select a reason --</option>
                {RETURN_REASONS.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Preferred resolution</label>
              <div className="space-y-2">
                {RESOLUTION_OPTIONS.map(r => (
                  <label key={r.value} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="resolution"
                      value={r.value}
                      checked={returnResolution === r.value}
                      onChange={() => setReturnResolution(r.value)}
                      className="w-4 h-4 text-yellow-500 accent-yellow-400"
                    />
                    <span className="text-sm text-gray-700">{r.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Additional comments <span className="text-gray-400 font-normal">(optional)</span></label>
              <textarea
                value={returnComment}
                onChange={e => setReturnComment(e.target.value)}
                placeholder="Describe the issue in more detail..."
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none"
              />
            </div>

            {returnError && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                <i className="ri-error-warning-line mr-2"></i>{returnError}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowReturnModal(false)}
                disabled={returnSubmitting}
                className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReturn}
                disabled={returnSubmitting || !returnReason}
                className="flex-1 bg-yellow-400 text-gray-900 px-4 py-2 rounded-lg font-bold text-sm hover:bg-yellow-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {returnSubmitting && <i className="ri-loader-4-line animate-spin"></i>}
                Submit Return
              </button>
            </div>
          </div>
        )}
      </Dialog>

      <Footer data={menuList} />
    </div>
  );
};

export default OrderHistoryPage;
