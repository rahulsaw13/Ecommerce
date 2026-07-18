// utils
import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Toast } from "primereact/toast";
import { useFormik } from "formik";
import { Dialog } from 'primereact/dialog';

// components
import Breadcrum from "@common/Breadcrum";
import DataTable from "@common/DataTable";
import ButtonComponent from "@common/ButtonComponent";
import InputTextComponent from "@common/InputTextComponent";
import Confirmbox from "@common/Confirmbox";
import { allApiWithHeaderToken } from "@api/api";
import { ROUTES_CONSTANTS } from "@constants/routesurl";
import { API_CONSTANTS } from "@constants/apiurl";
import { refactorPrefilledDate } from '@helper';
import AutocompleteComponent from "@common/Autocomplete";
import { INVOICE_CONFIG, numberToWords } from "@config/srirammart.config";

// Add custom styles for order table
const orderTableStyles = `
  .order-table-container .p-datatable .p-datatable-tbody > tr {
    border-bottom: 2px solid #e5e7eb !important;
  }
  
  .order-table-container .p-datatable .p-datatable-tbody > tr:nth-child(even) {
    background-color: #f9fafb !important;
  }
  
  .order-table-container .p-datatable .p-datatable-tbody > tr:nth-child(odd) {
    background-color: #ffffff !important;
  }
  
  .order-table-container .p-datatable .p-datatable-tbody > tr:hover {
    background-color: #f3f4f6 !important;
  }
  
  .order-table-container .p-datatable .p-datatable-tbody > tr.highlighted-order-row {
    background-color: #fef3c7 !important;
    animation: highlight-fade 3s ease-in-out;
  }
  
  @keyframes highlight-fade {
    0% { background-color: #fef3c7; }
    100% { background-color: inherit; }
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleId = 'order-table-custom-styles';
  if (!document.getElementById(styleId)) {
    const styleTag = document.createElement('style');
    styleTag.id = styleId;
    styleTag.innerHTML = orderTableStyles;
    document.head.appendChild(styleTag);
  }
}

const initialData = {
  orderStatus: {name: "Select Order Status", value: ""},
  paymentStatus: {name: "Select Payment Status", value: ""},
  orderType: {name: "Select Order Type", value: ""},
  batchNumber: ""
};

const orderList = [
  {name: "Select Order Status", value: ""},
  {name: "Initiated", value: "initiated"},
  {name: "Processing", value: "processing"},
  {name: "Shipped", value: "shipped"},
  {name: "Delivered", value: "delivered"},
  {name: "Cancelled", value: "cancelled"},
  {name: "Refunded", value: "refunded"},
  {name: "Failed", value: "failed"}
];

const paymentStatusList = [
  {name: "Select Payment Status", value: ""},
  {name: "Pending", value: "pending"},
  {name: "Paid (Online)", value: "paid_online"},
  {name: "Paid (Offline)", value: "paid_offline"},
  {name: "Failed", value: "failed"},
  {name: "Refunded", value: "refunded"}
];

const orderTypeList = [
  {name: "Select Order Type", value: ""},
  {name: "Home Delivery", value: "home_delivery"},
  {name: "In-Store Pickup", value: "in_store_pickup"}
];

const openPrintWindow = (orderData) => {
  const printWindow = window.open('', '_blank', 'width=800,height=600');

  if (printWindow) {
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Workorder #${orderData.workorder_number || orderData.batch_number}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          @media print {
            body { margin: 0; }
            .no-print { display: none !important; }
            .print-container { 
              box-shadow: none !important; 
              border: none !important;
              margin: 0 !important;
              padding: 0 !important;
            }
          }
        </style>
      </head>
      <body>
        <div id="print-content"></div>
        <script>
          // Order data
          const orderData = ${JSON.stringify(orderData)};

          // Generate HTML content for Workorder
          const content = \`
            <div class="max-w-4xl mx-auto p-8 bg-white">
              <div class="print-container border rounded-lg p-6">
                <!-- Header -->
                <div class="text-center mb-6">
                  <h1 class="text-4xl font-bold text-gray-800 mb-2">WORKORDER</h1>
                  <div class="h-1 bg-gray-300 w-full"></div>
                </div>

                <!-- Header Information -->
                <div class="grid grid-cols-2 gap-6 text-sm text-gray-700 mb-8">
                  <div>
                    <p class="mb-1"><strong>Workorder ID:</strong> \${orderData.workorder_number || orderData.batch_number}</p>
                    <p class="mb-1"><strong>Order ID:</strong> #\${orderData.order_id}</p>
                    <p class="mb-1"><strong>Date:</strong> \${orderData.created_at ? new Date(String(orderData.created_at).replace(/\\[.*?\\]$/, '')).toLocaleDateString() : ''}</p>
                    \${orderData.estimated_delivery_date ? \`
                      <p class="mb-1"><strong>Estimated Delivery:</strong> \${new Date(orderData.estimated_delivery_date).toLocaleDateString()} at \${new Date(orderData.estimated_delivery_date).toLocaleTimeString()}</p>
                    \` : ''}
                  </div>
                  <div class="text-right">
                    <p class="mb-1"><strong>Status:</strong> <span class="capitalize">\${orderData.order_status ? orderData.order_status.replace(/_/g, ' ') : ''}</span></p>
                    <p class="mb-1"><strong>Payment:</strong> \${orderData.payment_status} (\${orderData.payment_mode})</p>
                  </div>
                </div>

                <!-- Customer Information -->
                <div class="mb-8">
                  <h2 class="text-lg font-semibold text-gray-800 mb-3 border-b pb-1">Customer Information</h2>
                  <div class="text-sm text-gray-700">
                    <p class="mb-1"><strong>Name:</strong> \${orderData.user?.name || ''}</p>
                    <p class="mb-1"><strong>Email:</strong> \${orderData.user?.email || ''}</p>
                    <p class="mb-1"><strong>Phone:</strong> \${orderData.user?.phone_number || ''}</p>
                    \${orderData.user?.discount_category ? \`
                      <p class="mb-1"><strong>Discount Category:</strong> \${orderData.user.discount_category.name} (\${orderData.user.discount_category.discount_percent}%)</p>
                    \` : ''}
                  </div>
                </div>



                <!-- Products Table -->
                <div class="mb-8">
                  <h2 class="text-lg font-semibold text-gray-800 mb-4 border-b pb-1">Order Details</h2>
                  <table class="w-full border-collapse border border-gray-300 text-sm">
                    <thead>
                      <tr class="bg-gray-100">
                        <th class="border border-gray-300 p-3 text-left">#</th>
                        <th class="border border-gray-300 p-3 text-left">Product</th>
                        <th class="border border-gray-300 p-3 text-center">Qty</th>
                        <th class="border border-gray-300 p-3 text-right">Unit Price</th>
                        <th class="border border-gray-300 p-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      \${orderData.order_items?.map((item, index) => \`
                        <tr>
                          <td class="border border-gray-300 p-3">\${index + 1}</td>
                          <td class="border border-gray-300 p-3">
                            <div>
                              <p class="font-medium">\${item.product_name}</p>
                            </div>
                          </td>
                          <td class="border border-gray-300 p-3 text-center">\${item.quantity}</td>
                          <td class="border border-gray-300 p-3 text-right">₹\${parseFloat(item.price).toFixed(2)}</td>
                          <td class="border border-gray-300 p-3 text-right font-medium">
                            ₹\${(item.quantity * parseFloat(item.price)).toFixed(2)}
                          </td>
                        </tr>
                      \`).join('') || ''}
                    </tbody>
                  </table>
                </div>

                <!-- Summary -->
                <div class="flex justify-end">
                  <div class="w-64">
                    <div class="border-t border-gray-300 pt-4">
                      <div class="flex justify-between mb-2 text-sm">
                        <span>Subtotal:</span>
                        <span>₹\${orderData.total_price ? parseFloat(orderData.total_price).toFixed(2) : '0.00'}</span>
                      </div>
                      <div class="flex justify-between mb-2 text-sm">
                        <span>Tax:</span>
                        <span>₹\${orderData.tax_price ? parseFloat(orderData.tax_price).toFixed(2) : '0.00'}</span>
                      </div>
                      <div class="flex justify-between mb-2 text-sm">
                        <span>Handling Fee:</span>
                        <span>₹\${orderData.handling_fee ? parseFloat(orderData.handling_fee).toFixed(2) : '0.00'}</span>
                      </div>
                      <div class="flex justify-between text-lg font-bold border-t border-gray-300 pt-2">
                        <span>Grand Total:</span>
                        <span>₹\${orderData.grand_total ? parseFloat(orderData.grand_total).toFixed(2) : '0.00'}</span>
                      </div>
                    </div>
                  </div>
                </div>

              <!-- Print Buttons -->
              <div class="no-print mt-6 text-center">
                <button
                  onclick="window.print()"
                  class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium mr-4"
                >
                  Print Workorder
                </button>
                <button
                  onclick="window.close()"
                  class="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          \`;

          document.getElementById('print-content').innerHTML = content;
        </script>
      </body>
      </html>
    `);
  }
};

/**
 * Fetches order data and opens print window
 * @param {number} orderId - The ID of the order to print
 */
export const printOrderInvoice = async (orderId) => {
  try {
    const response = await allApiWithHeaderToken(`${API_CONSTANTS.COMMON_ORDER_URL}/${orderId}`, "", "get");
    
    if (response.status === 200) {
      const orderData = response.data.data;
      openPrintWindow(orderData);
    } else {
      throw new Error('Failed to fetch order data');
    }
  } catch (error) {
    alert('Failed to load order data for printing. Please try again.');
  }
};

const normalizeDate = (val) => {
  if (!val) return null;
  // Strip Java ZonedDateTime suffix like [Asia/Kolkata]
  const clean = String(val).replace(/\[.*?\]$/, '');
  const d = new Date(clean);
  return isNaN(d.getTime()) ? null : d;
};

const OrderList = ({search}) => {
  const toast = useRef(null);
  const { t } = useTranslation("msg");
  const navigate = useNavigate();
  const companyInfo = useSelector((state) => state.company?.info) || {};
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightOrderId = searchParams.get('highlightOrder');
  const highlightedRowRef = useRef(null);
  const [isConfirm, setIsConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [loader, setLoader] = useState(false);
  const [skip, setSkip] = useState(0);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newStatus, setNewStatus] = useState({});
  const [showRejectionDialog, setShowRejectionDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [orderToReject, setOrderToReject] = useState(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);
  const [deliveryAgents, setDeliveryAgents] = useState([]);

  const item = {
    heading: t("order"),
    routes: [
      { label: t("dashboard"), route: ROUTES_CONSTANTS.DASHBOARD },
      { label: t("order"), route: ROUTES_CONSTANTS.ORDERS },
    ],
  };

  const [data, setData] = useState([]);

  const actionBodyTemplate = (rowData) => {
    const status = rowData.order_status?.toLowerCase();
    const payStatus = rowData.payment_status?.toLowerCase();
    const isCOD = rowData.payment_mode === 'cash_on_delivery';
    const isPaid = payStatus === 'paid_online' || payStatus === 'paid_offline';

    // Primary action button config based on order status
    const primaryAction = {
      initiated:  { label: 'Accept',        icon: 'ri-check-line',       color: 'bg-blue-600',   next: 'processing' },
      processing: { label: 'Out for Delivery', icon: 'ri-truck-line',    color: 'bg-indigo-600', next: 'shipped'    },
      shipped:    { label: 'Mark Delivered', icon: 'ri-checkbox-circle-line', color: 'bg-green-600', next: 'delivered' },
    }[status];

    return (
      <div className="flex flex-col gap-2 min-w-[170px]">

        {/* Primary action button */}
        {primaryAction && (
          <button
            onClick={() => updateOrderStatus(rowData, primaryAction.next)}
            className={`flex items-center gap-1.5 ${primaryAction.color} text-white text-[11px] font-medium px-3 py-1.5 rounded-md hover:opacity-90 transition-opacity`}
          >
            <i className={`${primaryAction.icon} text-sm`}></i>
            {primaryAction.label}
          </button>
        )}

        {/* Cancel button for active orders */}
        {['initiated', 'processing', 'shipped'].includes(status) && (
          <button
            onClick={() => handleStatusChangeDirectly(rowData, 'cancelled')}
            className="flex items-center gap-1.5 bg-red-50 text-red-600 border border-red-200 text-[11px] font-medium px-3 py-1.5 rounded-md hover:bg-red-100 transition-colors"
          >
            <i className="ri-close-circle-line text-sm"></i>
            Cancel
          </button>
        )}

        {/* COD: Mark paid when delivered */}
        {status === 'delivered' && isCOD && !isPaid && (
          <button
            onClick={() => handlePaymentStatusChange(rowData, 'paid_offline')}
            className="flex items-center gap-1.5 bg-green-50 text-green-700 border border-green-300 text-[11px] font-medium px-3 py-1.5 rounded-md hover:bg-green-100 transition-colors"
          >
            <i className="ri-money-rupee-circle-line text-sm"></i>
            Collect COD
          </button>
        )}

        {/* Delivered badge */}
        {status === 'delivered' && isPaid && (
          <span className="flex items-center gap-1 text-[11px] font-medium text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-md">
            <i className="ri-checkbox-circle-fill"></i> Completed
          </span>
        )}

        {/* Cancelled / refunded badge */}
        {['cancelled', 'refunded', 'failed'].includes(status) && (
          <span className="flex items-center gap-1 text-[11px] font-medium text-red-600 bg-red-50 border border-red-200 px-3 py-1.5 rounded-md">
            <i className="ri-close-circle-fill"></i> {rowData.order_status}
          </span>
        )}

        {/* Payment status select */}
        <div className="relative">
          <select
            value={rowData?.payment_status || ''}
            onChange={(e) => handlePaymentStatusChange(rowData, e.target.value)}
            className="w-full px-2 py-1 pt-3 border border-gray-300 rounded bg-white text-[11px] appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-green-400"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 0.5rem center',
              paddingRight: '1.75rem'
            }}
          >
            {paymentStatusList.map((s) => (
              <option key={s.value} value={s.value}>{s.name}</option>
            ))}
          </select>
          <label className="absolute top-0.5 left-2 text-[9px] text-gray-500 font-medium">Payment</label>
        </div>

        {/* Icon buttons row */}
        <div className="flex gap-2">
          <button
            onClick={() => handleViewDetails(rowData)}
            className="text-blue-600 hover:text-blue-800 text-lg"
            title="View Details"
          >
            <i className="ri-eye-line"></i>
          </button>
          <button
            onClick={() => printOrder(rowData)}
            className="text-purple-600 hover:text-purple-800 text-lg"
            title="Print Invoice"
          >
            <i className="ri-printer-line"></i>
          </button>
        </div>

      </div>
    );
  };

  const confirmPrintOrder = async (item) => {
    try {
      // Use the new workorder endpoint
      const response = await allApiWithHeaderToken(`${API_CONSTANTS.COMMON_ORDER_URL}/${item?.id}/print_workorder`, "", "get");
      if (response.status === 200) {
        openPrintWindow(response.data.data);
      } else {
        throw new Error("Failed to fetch workorder data");
      }
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Failed to print workorder. Please try again.",
        life: 3000,
      });
    }
  };

  const acceptOfflinePayment = async (item) => {
    try {
      setLoader(true);
      const response = await allApiWithHeaderToken(`${API_CONSTANTS.COMMON_ORDER_URL}/${item?.id}/accept_offline_payment`, {}, "post");
      if (response.status === 200) {
        toast.current.show({
          severity: "success",
          summary: "Success",
          detail: "Offline payment accepted successfully",
          life: 3000,
        });
        fetchOrderList(); // Refresh the list
      }
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: error?.response?.data?.errors || "Failed to accept offline payment",
        life: 3000,
      });
    } finally {
      setLoader(false);
    }
  };

  const changeOrderStatus = (order) => {
    setSelectedOrder(order);
    setNewStatus({ name: order.order_status?.replace(/_/g, ' '), value: order.order_status });
    setShowStatusDialog(true);
  };

  const handleStatusChangeDirectly = async (order, newStatusValue) => {
    console.log("=== handleStatusChangeDirectly called ===");
    console.log("Order:", order);
    console.log("New Status Value:", newStatusValue);
    
    if (!order || !newStatusValue) {
      console.log("Missing order or newStatusValue, returning");
      return;
    }
    
    // If status is being changed to 'cancelled', 'refunded', or 'failed', show rejection dialog
    if (['cancelled', 'refunded', 'failed'].includes(newStatusValue.toLowerCase())) {
      setOrderToReject(order);
      setNewStatus({ name: newStatusValue, value: newStatusValue });
      setRejectionReason('');
      setShowRejectionDialog(true);
      return;
    }
    
    // For other statuses, proceed normally
    await updateOrderStatus(order, newStatusValue, null);
  };

  const handlePaymentStatusChange = async (order, newPaymentStatusValue) => {
    console.log("=== handlePaymentStatusChange called ===");
    console.log("Order:", order);
    console.log("New Payment Status Value:", newPaymentStatusValue);
    
    if (!order || !newPaymentStatusValue) {
      console.log("Missing order or newPaymentStatusValue, returning");
      return;
    }
    
    // Update payment status
    await updatePaymentStatus(order, newPaymentStatusValue);
  };

  const updateOrderStatus = async (order, newStatusValue, reason = null) => {
    setLoader(true);
    try {
      console.log("Making API call to:", `${API_CONSTANTS.COMMON_ORDER_URL}/${order.id}`);
      const requestData = { order_status: newStatusValue };
      if (reason) {
        requestData.rejection_reason = reason;
      }
      console.log("With data:", requestData);
      
      const response = await allApiWithHeaderToken(
        `${API_CONSTANTS.COMMON_ORDER_URL}/${order.id}`,
        requestData,
        "put"
      );
      
      console.log("API Response:", response);
      
      if (response.status === 200) {
        toast.current.show({
          severity: "success",
          summary: "Success",
          detail: "Order status updated successfully",
          life: 3000,
        });
        fetchOrderList();
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Failed to update order status",
        life: 3000,
      });
    } finally {
      setLoader(false);
    }
  };

  const updatePaymentStatus = async (order, newPaymentStatusValue) => {
    setLoader(true);
    try {
      console.log("Making API call to:", `${API_CONSTANTS.COMMON_ORDER_URL}/${order.id}`);
      const requestData = { payment_status: newPaymentStatusValue };
      console.log("With data:", requestData);
      
      const response = await allApiWithHeaderToken(
        `${API_CONSTANTS.COMMON_ORDER_URL}/${order.id}`,
        requestData,
        "put"
      );
      
      console.log("API Response:", response);
      
      if (response.status === 200) {
        toast.current.show({
          severity: "success",
          summary: "Success",
          detail: "Payment status updated successfully",
          life: 3000,
        });
        fetchOrderList();
      }
    } catch (error) {
      console.error("Error updating payment status:", error);
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Failed to update payment status",
        life: 3000,
      });
    } finally {
      setLoader(false);
    }
  };

  const handleDeliveryAgentAssignment = async (order, deliveryAgentId) => {
    if (!deliveryAgentId) return;
    
    setLoader(true);
    try {
      const response = await allApiWithHeaderToken(
        `${API_CONSTANTS.COMMON_ORDER_URL}/${order.id}`,
        { delivery_agent_id: deliveryAgentId },
        "put"
      );
      
      if (response.status === 200) {
        toast.current.show({
          severity: "success",
          summary: "Success",
          detail: "Delivery agent assigned successfully",
          life: 3000,
        });
        fetchOrderList();
      }
    } catch (error) {
      console.error("Error assigning delivery agent:", error);
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Failed to assign delivery agent",
        life: 3000,
      });
    } finally {
      setLoader(false);
    }
  };

  const handleRejectionSubmit = async () => {
    if (!rejectionReason.trim()) {
      toast.current.show({
        severity: "warn",
        summary: "Warning",
        detail: "Please provide a reason for rejection",
        life: 3000,
      });
      return;
    }

    await updateOrderStatus(orderToReject, newStatus.value, rejectionReason);
    setShowRejectionDialog(false);
    setRejectionReason('');
    setOrderToReject(null);
  };

  const handleStatusChange = async () => {
    if (!selectedOrder || !newStatus.value) return;
    
    try {
      setLoader(true);
      const response = await allApiWithHeaderToken(
        `${API_CONSTANTS.COMMON_ORDER_URL}/${selectedOrder.id}`,
        { order_status: newStatus.value },
        "patch"
      );
      
      if (response.status === 200) {
        toast.current.show({
          severity: "success",
          summary: "Success",
          detail: "Order status updated successfully",
          life: 3000,
        });
        setShowStatusDialog(false);
        fetchOrderList();
      }
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: error?.response?.data?.errors || "Failed to update order status",
        life: 3000,
      });
    } finally {
      setLoader(false);
    }
  };

  const handleViewDetails = async (order) => {
    try {
      // Don't show loader for view details
      const response = await allApiWithHeaderToken(`${API_CONSTANTS.COMMON_ORDER_URL}/${order.id}`, "", "get");
      if (response.status === 200) {
        setOrderDetails(response.data.data);
        setShowDetailsDialog(true);
      }
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Failed to load order details",
        life: 3000,
      });
    }
  };

  const printOrder = async (order) => {
    try {
      const response = await allApiWithHeaderToken(`${API_CONSTANTS.COMMON_ORDER_URL}/${order.id}`, "", "get");
      if (response.status === 200) {
        const orderData = response.data.data;
        openPrintOrderWindow(orderData);
      }
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Failed to load order data for printing",
        life: 3000,
      });
    }
  };

  const openPrintOrderWindow = (orderData) => {
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    
    // Calculate totals from stored pricing breakdown
    const subtotalMrp = parseFloat(orderData.subtotal_mrp || 0);
    const subtotalSelling = parseFloat(orderData.subtotal_selling_price || 0);
    const productDiscount = parseFloat(orderData.product_discount || 0);
    const promoDiscount = parseFloat(orderData.promo_discount || 0);
    const couponDiscount = parseFloat(orderData.coupon_discount || 0);
    const igstAmount = parseFloat(orderData.igst_amount || 0);
    const cgstAmount = parseFloat(orderData.cgst_amount || 0);
    const sgstAmount = parseFloat(orderData.sgst_amount || 0);
    const taxAmount = parseFloat(orderData.tax_price || 0);
    const handlingFee = parseFloat(orderData.handling_fee || 0);
    const deliveryCharge = parseFloat(orderData.delivery_charge || 0);
    const grandTotal = parseFloat(orderData.total_price || 0);
    
    // Generate invoice number: YYYYMMDD-XXX
    const invoiceNumber = INVOICE_CONFIG.generateInvoiceNumber(orderData.created_at, orderData.id);
    
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${INVOICE_CONFIG.title}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; padding: 20px; font-size: 12px; }
            .invoice-container { max-width: 900px; margin: 0 auto; border: 2px solid #000; }
            .header { text-align: center; padding: 15px; border-bottom: 2px solid #000; background-color: #f8f9fa; }
            .header h1 { font-size: 28px; margin: 0; font-weight: bold; }
            .section { padding: 15px; border-bottom: 1px solid #000; }
            .section-title { font-size: 14px; font-weight: bold; margin-bottom: 10px; color: #333; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
            .info-item { margin-bottom: 8px; }
            .info-label { font-weight: bold; color: #555; font-size: 11px; }
            .info-value { color: #000; margin-top: 2px; }
            table { width: 100%; border-collapse: collapse; margin: 0; }
            th, td { border: 1px solid #000; padding: 8px; text-align: left; font-size: 11px; }
            th { background-color: #e9ecef; font-weight: bold; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .tax-section { padding: 15px; background-color: #f8f9fa; }
            .tax-row { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px dotted #ccc; }
            .tax-label { font-weight: 500; }
            .tax-value { font-weight: bold; }
            .grand-total { font-size: 16px; font-weight: bold; border-top: 2px solid #000; padding-top: 10px; margin-top: 10px; background-color: #fff3cd; padding: 10px; }
            .footer { padding: 20px 15px; }
            .signature-section { display: flex; justify-content: space-between; margin-top: 30px; }
            .signature-box { text-align: center; }
            @media print {
              body { padding: 0; }
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <!-- Header -->
            <div class="header">
              <h1>${INVOICE_CONFIG.title}</h1>
            </div>

            <!-- Invoice Details Section -->
            <div class="section">
              <div class="info-grid">
                <div>
                  <div class="info-item">
                    <div class="info-label">Invoice No:</div>
                    <div class="info-value">${invoiceNumber}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Date of Invoice:</div>
                    <div class="info-value">${orderData.created_at ? new Date(String(orderData.created_at).replace(/\[.*?\]$/, '')).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">HSN Code:</div>
                    <div class="info-value">996331</div>
                  </div>
                </div>
                <div>
                  <div class="info-item">
                    <div class="info-label">Service Description:</div>
                    <div class="info-value">Retail Service</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Category:</div>
                    <div class="info-value">B2C</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Reverse Charges Applicable:</div>
                    <div class="info-value">No</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Customer & Company Details Section -->
            <div class="section">
              <div class="info-grid">
                <div>
                  <div class="section-title">Invoice To:</div>
                  <div class="info-item">
                    <div class="info-label">Customer Name:</div>
                    <div class="info-value">${orderData.user?.name || 'N/A'}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">GSTIN:</div>
                    <div class="info-value">Unregistered</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Customer Address:</div>
                    <div class="info-value">${orderData.shipping_address ? 
                      `${orderData.shipping_address.flat_no || ''}, ${orderData.shipping_address.city || ''}, ${orderData.shipping_address.state || ''} - ${orderData.shipping_address.zip_code || ''}` 
                      : 'N/A'}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Order ID:</div>
                    <div class="info-value">#${orderData.id || 'N/A'}</div>
                  </div>
                </div>
                <div>
                  <div class="section-title">Invoice Issued By:</div>
                  <div class="info-item">
                    <div class="info-label">Company Name:</div>
                    <div class="info-value">${companyInfo.name || 'Dukaansarthi'}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Restaurant Name:</div>
                    <div class="info-value">${companyInfo.name || 'Dukaansarthi'}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Restaurant GSTIN:</div>
                    <div class="info-value">${companyInfo.gstin || ''}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Address:</div>
                    <div class="info-value">${companyInfo.address || ''}, ${companyInfo.pincode || ''}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Phone:</div>
                    <div class="info-value">${companyInfo.phone || ''}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Email:</div>
                    <div class="info-value">${companyInfo.email || ''}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Products Table -->
            <table>
              <thead>
                <tr>
                  <th style="width: 40px;">Sr No</th>
                  <th>Description</th>
                  <th style="width: 80px;">Variant</th>
                  <th style="width: 60px;" class="text-center">Qty</th>
                  <th style="width: 90px;" class="text-right">MRP (₹)</th>
                  <th style="width: 100px;" class="text-right">Selling Price (₹)</th>
                  <th style="width: 100px;" class="text-right">Amount (₹)</th>
                  <th style="width: 80px;" class="text-right">Discount</th>
                  <th style="width: 120px;" class="text-right">Net Value (₹)</th>
                </tr>
              </thead>
              <tbody>
                ${orderData.products?.map((item, index) => {
                  const mrp = parseFloat(item.mrp || item.original_price || item.price || 0);
                  const sellingPrice = parseFloat(item.price || 0);
                  const itemDiscount = mrp > sellingPrice ? mrp - sellingPrice : 0;
                  
                  return `
                  <tr>
                    <td class="text-center">${index + 1}</td>
                    <td>${item.name || 'N/A'}</td>
                    <td>${item.weight || item.variant || 'N/A'}</td>
                    <td class="text-center">${item.quantity || 0}</td>
                    <td class="text-right">₹${mrp.toFixed(2)}</td>
                    <td class="text-right">₹${sellingPrice.toFixed(2)}</td>
                    <td class="text-right">₹${(item.quantity * sellingPrice).toFixed(2)}</td>
                    <td class="text-right">₹${(item.quantity * itemDiscount).toFixed(2)}</td>
                    <td class="text-right">₹${(item.quantity * sellingPrice).toFixed(2)}</td>
                  </tr>
                `}).join('') || '<tr><td colspan="9" class="text-center">No items</td></tr>'}
                <tr style="background-color: #f8f9fa;">
                  <td colspan="8" class="text-right" style="font-weight: bold;">Subtotal (Selling Price):</td>
                  <td class="text-right" style="font-weight: bold;">₹${subtotalSelling.toFixed(2)}</td>
                </tr>
                ${promoDiscount > 0 ? `
                <tr style="background-color: #dcfce7;">
                  <td colspan="8" class="text-right" style="font-weight: bold; color: #166534;">Promo Discount:</td>
                  <td class="text-right" style="font-weight: bold; color: #166534;">-₹${promoDiscount.toFixed(2)}</td>
                </tr>
                ` : ''}
                ${couponDiscount > 0 ? `
                <tr style="background-color: #fef3c7;">
                  <td colspan="8" class="text-right" style="font-weight: bold; color: #92400e;">Coupon Discount (${orderData.coupon_code || ''}):</td>
                  <td class="text-right" style="font-weight: bold; color: #92400e;">-₹${couponDiscount.toFixed(2)}</td>
                </tr>
                ` : ''}
              </tbody>
            </table>

            <!-- Tax Section -->
            <div class="tax-section">
              <div class="section-title" style="margin-bottom: 15px;">Tax & Charges Breakdown</div>
              ${igstAmount > 0 ? `
              <div class="tax-row">
                <div class="tax-label">IGST (${orderData.igst_rate || 0}%)</div>
                <div class="tax-value">₹${igstAmount.toFixed(2)}</div>
              </div>
              ` : ''}
              ${cgstAmount > 0 ? `
              <div class="tax-row">
                <div class="tax-label">CGST (${orderData.cgst_rate || 0}%)</div>
                <div class="tax-value">₹${cgstAmount.toFixed(2)}</div>
              </div>
              ` : ''}
              ${sgstAmount > 0 ? `
              <div class="tax-row">
                <div class="tax-label">SGST/UTGST (${orderData.sgst_rate || 0}%)</div>
                <div class="tax-value">₹${sgstAmount.toFixed(2)}</div>
              </div>
              ` : ''}
              ${handlingFee > 0 ? `
              <div class="tax-row">
                <div class="tax-label">Handling Charge</div>
                <div class="tax-value">₹${handlingFee.toFixed(2)}</div>
              </div>
              ` : ''}
              ${deliveryCharge > 0 ? `
              <div class="tax-row">
                <div class="tax-label">Delivery Charge</div>
                <div class="tax-value">₹${deliveryCharge.toFixed(2)}</div>
              </div>
              ` : ''}
              <div class="grand-total">
                <div style="display: flex; justify-content: space-between;">
                  <div style="font-size: 18px;">Invoice Total:</div>
                  <div style="font-size: 18px;">₹${grandTotal.toFixed(2)}</div>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div class="footer">
              <div class="info-item" style="margin-bottom: 20px;">
                <div class="info-label">Invoice Total in Words:</div>
                <div class="info-value" style="font-style: italic; text-transform: capitalize;">${numberToWords(grandTotal)}</div>
              </div>
              
              <div class="signature-section">
                <div class="signature-box">
                  <div style="border-top: 1px solid #000; padding-top: 5px; margin-top: 50px; width: 200px;">
                    <div style="font-weight: bold;">Customer Signature</div>
                  </div>
                </div>
                <div class="signature-box">
                  <div style="text-align: right;">
                    <div style="font-weight: bold; margin-bottom: 5px;">Authorized Signature</div>
                    <div style="font-size: 10px; color: #666;">Digitally Signed by</div>
                    <div style="font-weight: bold;">${companyInfo.name || 'Dukaansarthi'}</div>
                    <div style="font-size: 10px; color: #666;">${new Date().toLocaleDateString('en-IN')}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Print Buttons -->
            <div class="no-print" style="text-align: center; padding: 20px; border-top: 2px solid #000;">
              <button onclick="window.print()" style="padding: 10px 30px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; margin-right: 10px; font-size: 14px; font-weight: bold;">Print Invoice</button>
              <button onclick="window.close()" style="padding: 10px 30px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px; font-weight: bold;">Close</button>
            </div>
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const downloadBankingReceipt = async (orderId) => {
    try {
      setLoader(true);
      // Download banking receipt with proper authentication using fetch
      let token = localStorage.getItem('token');
      // Clean up token - remove quotes and extra Bearer prefix
      if (token) {
        token = token.replace(/"/g, ''); // Remove quotes
        token = token.replace(/^Bearer\s+Bearer\s+/, 'Bearer '); // Fix double Bearer
        if (!token.startsWith('Bearer ')) {
          token = `Bearer ${token}`;
        }
      }
      
      const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/v1/orders/${orderId}/banking_receipt`, {
        method: 'GET',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download banking receipt');
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `banking_receipt_order_${orderId}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.current.show({
        severity: "success",
        summary: "Success",
        detail: "Banking receipt downloaded successfully",
        life: 3000,
      });
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Failed to download banking receipt",
        life: 3000,
      });
    } finally {
      setLoader(false);
    }
  };

  const downloadBillOrWorkOrder = async (order) => {
    let token = localStorage.getItem("token");
    // Clean up token - remove quotes and extra Bearer prefix
    if (token) {
      token = token.replace(/"/g, ''); // Remove quotes
      token = token.replace(/^Bearer\s+Bearer\s+/, 'Bearer '); // Fix double Bearer
      if (!token.startsWith('Bearer ')) {
        token = `Bearer ${token}`;
      }
    }
    
    const isShipped = order.order_status?.toLowerCase() === 'shipped' || order.order_status?.toLowerCase() === 'delivered';
    
    if (isShipped) {
      // Download bill as PDF
      try {
        const response = await fetch(
          `${process.env.REACT_APP_BASE_URL}/api/v1/orders/${order.id}/generate_bill`,
          {
            method: "GET",
            headers: {
              Authorization: token,
            },
          }
        );

        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `bill_${order.order_number || order.id}.pdf`;
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.URL.revokeObjectURL(url);
          
          toast.current?.show({
            severity: "success",
            summary: "Success",
            detail: "Bill downloaded successfully",
            life: 3000,
          });
        } else {
          const errorData = await response.json();
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail: errorData.message || "Failed to download bill",
            life: 3000,
          });
        }
      } catch (error) {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "Network error occurred",
          life: 3000,
        });
      }
    } else {
      // Navigate to work order page
      try {
        // Navigate to work order page using React Router
        window.location.href = `/print-invoice/${order.id}?type=workorder`;
        
        toast.current?.show({
          severity: "success",
          summary: "Success",
          detail: "Navigating to Work Order",
          life: 3000,
        });
      } catch (error) {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "Failed to navigate to work order",
          life: 3000,
        });
      }
    }
  };


  const paymentAndOrderStatusBodyTemplate = (rowData) => {
    // Order status
    const orderStatus = rowData?.order_status?.toLowerCase();
    const orderStatusColors = {
      initiated: "text-blue-600",
      processing: "text-yellow-600",
      shipped: "text-indigo-600",
      delivered: "text-green-700",
      cancelled: "text-red-600",
      refunded: "text-orange-600",
      failed: "text-red-700",
    };
    const displayOrderStatus =
      rowData?.order_status?.replace(/_/g, " ") || "Unknown";

    // Payment status
    const paymentStatus = rowData?.payment_status?.toLowerCase();
    const paymentStatusColors = {
      pending: "text-yellow-600",
      paid_online: "text-green-600",
      paid_offline: "text-blue-600",
      failed: "text-red-600",
      refunded: "text-orange-600",
    };
    
    // Format payment status display
    let displayPaymentStatus = rowData?.payment_status || "Unknown";
    if (displayPaymentStatus === "paid_online") {
      displayPaymentStatus = "Paid (Online)";
    } else if (displayPaymentStatus === "paid_offline") {
      displayPaymentStatus = "Paid (Offline)";
    } else {
      displayPaymentStatus = displayPaymentStatus.replace(/_/g, " ");
    }

    return (
      <div className="flex flex-col gap-1">
        <span
          className={`${orderStatusColors[orderStatus] || "text-gray-500"} capitalize`}
        >
          <b>Order</b>: {displayOrderStatus}
        </span>
        <span
          className={`${paymentStatusColors[paymentStatus] || "text-gray-500"}`}
        >
          <b>Payment</b>: {displayPaymentStatus}
        </span>
      </div>
    );
  };

  const orderInfoBodyTemplate = (rowData) => {
    // Get order type and payment mode
    const rawOrderType = rowData.order_type;
    const rawPaymentMode = rowData.payment_mode;
    const orderType = String(rawOrderType || '').toLowerCase().trim();
    const paymentMode = String(rawPaymentMode || '').toLowerCase().trim();
    
    // Order type display
    let orderTypeDisplay = '';
    let orderTypeIcon = '';
    if (orderType === 'home_delivery') {
      orderTypeIcon = 'ri-truck-line text-blue-600';
      orderTypeDisplay = 'Home';
    } else if (orderType === 'in_store_pickup') {
      orderTypeIcon = 'ri-store-2-line text-green-600';
      orderTypeDisplay = 'Store';
    } else {
      orderTypeDisplay = rawOrderType || 'N/A';
      orderTypeIcon = 'ri-question-line text-gray-400';
    }
    
    // Payment mode display
    let paymentDisplay = '';
    let paymentDot = '';
    if (paymentMode === 'online_payment') {
      paymentDot = 'bg-blue-500';
      paymentDisplay = 'Online';
    } else if (paymentMode === 'cash_on_delivery') {
      paymentDot = 'bg-green-500';
      paymentDisplay = 'COD';
    } else {
      paymentDisplay = rawPaymentMode || 'N/A';
      paymentDot = 'bg-gray-400';
    }
    
    const orderDate = normalizeDate(rowData.created_at);
    const expectedDeliveryDate = normalizeDate(rowData.estimated_delivery_date);
    const deliveryTimeSlot = rowData.delivery_time_slot;
    
    const itemsSummary = rowData.items_summary || '';
    const itemsCount = rowData.items_count || 0;

    return (
      <div className="text-xs flex flex-col gap-1">
        {/* Order Type & Payment Mode */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <i className={`${orderTypeIcon} text-sm`}></i>
            <span className="font-medium text-gray-700">{orderTypeDisplay}</span>
          </div>
          <span className="text-gray-300">|</span>
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${paymentDot}`}></div>
            <span className="font-medium text-gray-700">{paymentDisplay}</span>
          </div>
        </div>

        {/* Items summary */}
        {itemsSummary && (
          <div className="text-[10px] text-gray-800 font-medium leading-tight line-clamp-2 max-w-[150px]" title={itemsSummary}>
            <i className="ri-shopping-bag-line text-orange-500 mr-0.5"></i>
            {itemsSummary}
          </div>
        )}
        {!itemsSummary && itemsCount > 0 && (
          <div className="text-[10px] text-gray-500">{itemsCount} item{itemsCount > 1 ? 's' : ''}</div>
        )}

        {/* Order & Expected Dates */}
        <div className="flex flex-col gap-0.5">
          {orderDate && (
            <div className="flex items-center gap-1">
              <span className="text-gray-500 text-[10px]">Order:</span>
              <span className="text-blue-600 font-medium text-[10px]">
                {orderDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
              </span>
              <span className="text-gray-500 text-[10px]">
                {orderDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
              </span>
            </div>
          )}
          {expectedDeliveryDate && (
            <div className="flex items-center gap-1">
              <span className="text-gray-500 text-[10px]">Exp:</span>
              <span className="text-green-600 font-medium text-[10px]">
                {expectedDeliveryDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
              </span>
              {deliveryTimeSlot ? (
                <span className="text-gray-500 text-[10px]">{deliveryTimeSlot}</span>
              ) : (
                <span className="text-gray-500 text-[10px]">
                  {expectedDeliveryDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const actualDeliveryDateBodyTemplate = (rowData) => {
    // Check if order type is in-store pickup
    const orderType = String(rowData.order_type || '').toLowerCase().trim();
    const isInStorePickup = orderType === 'in_store_pickup';
    
    // If in-store pickup, show "-"
    if (isInStorePickup) {
      return (
        <div className="text-xs flex items-center justify-center">
          <span className="text-gray-400 text-xs">-</span>
        </div>
      );
    }
    
    // For home delivery, show delivery date and delivered by
    const actualDeliveryDate = normalizeDate(rowData.order_fulfilled_date);
    const deliveredBy = rowData.delivery_agent?.name || 'N/A';
    
    return (
      <div className="text-xs flex flex-col gap-1">
        {actualDeliveryDate ? (
          <>
            <div className="flex gap-1">
              <div className="text-purple-600 font-medium">
                {actualDeliveryDate.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric'
                })}
              </div>
              <div className="text-gray-500">
                {actualDeliveryDate.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true
                })}
              </div>
            </div>
            <div className="text-gray-500 text-[10px]">By: {deliveredBy}</div>
          </>
        ) : (
          <div className="text-gray-500 text-[10px]">
            By: {rowData?.delivery_agent?.name || 'Not assigned'}
          </div>
        )}
      </div>
    );
  };

  const orderPaymentTypeBodyTemplate = (rowData) => {
    // Get raw values without modification first
    const rawOrderType = rowData.order_type;
    const rawPaymentMode = rowData.payment_mode;
    
    // Debug logging
    console.log('Order ID:', rowData.id, 'Raw order_type:', rawOrderType, 'Type:', typeof rawOrderType);
    
    // Normalize for comparison
    const orderType = String(rawOrderType || '').toLowerCase().trim();
    const paymentMode = String(rawPaymentMode || '').toLowerCase().trim();
    
    console.log('Order ID:', rowData.id, 'Normalized order_type:', orderType);
    
    // Determine order type display
    let orderTypeDisplay = '';
    let orderTypeIcon = '';
    if (orderType === 'home_delivery') {
      orderTypeIcon = 'ri-truck-line text-blue-600';
      orderTypeDisplay = 'Home';
    } else if (orderType === 'in_store_pickup') {
      orderTypeIcon = 'ri-store-2-line text-green-600';
      orderTypeDisplay = 'Store';
    } else {
      // Fallback - show raw value for debugging
      orderTypeDisplay = rawOrderType || 'N/A';
      orderTypeIcon = 'ri-question-line text-gray-400';
      console.warn('Unknown order type:', rawOrderType, 'for order:', rowData.id);
    }
    
    // Determine payment mode display
    let paymentDisplay = '';
    let paymentDot = '';
    if (paymentMode === 'online_payment') {
      paymentDot = 'bg-blue-500';
      paymentDisplay = 'Online';
    } else if (paymentMode === 'cash_on_delivery') {
      paymentDot = 'bg-green-500';
      paymentDisplay = 'COD';
    } else {
      paymentDisplay = rawPaymentMode || 'N/A';
      paymentDot = 'bg-gray-400';
    }
    
    return (
      <div className="flex flex-col gap-1.5">
        {/* Order Type */}
        {orderTypeDisplay && (
          <div className="flex items-center gap-1.5">
            <i className={`${orderTypeIcon} text-sm`}></i>
            <span className="text-xs font-medium text-gray-700">{orderTypeDisplay}</span>
          </div>
        )}
        {/* Payment Type */}
        {paymentDisplay && (
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${paymentDot}`}></div>
            <span className="text-xs font-medium text-gray-700">{paymentDisplay}</span>
          </div>
        )}
      </div>
    );
  };

  const paymentModeBodyTemplate = (rowData) => {
    const paymentMode = rowData.payment_mode;
    
    if (paymentMode === 'online_payment') {
      return (
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
          <span className="text-xs font-medium text-blue-700">Online</span>
        </div>
      );
    } else if (paymentMode === 'cash_on_delivery') {
      return (
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <span className="text-xs font-medium text-green-700">COD</span>
        </div>
      );
    }
    return <span className="text-gray-400 text-xs">N/A</span>;
  };

  const orderTypeBodyTemplate = (rowData) => {
    const orderType = rowData.order_type;
    
    if (orderType === 'home_delivery') {
      return (
        <div className="flex items-center gap-2">
          <i className="ri-truck-line text-blue-600"></i>
          <span className="text-xs font-medium text-gray-700">Home</span>
        </div>
      );
    } else if (orderType === 'in_store_pickup') {
      return (
        <div className="flex items-center gap-2">
          <i className="ri-store-2-line text-green-600"></i>
          <span className="text-xs font-medium text-gray-700">Store</span>
        </div>
      );
    }
    return <span className="text-gray-400 text-xs">N/A</span>;
  };

  const columns = [
    { field: "id", header: "No.", bodyClassName: "font-semibold", style: { width: "60px"}},
    { field: "total_price", header: "Price", style: { width: "75px"}},
    { 
      field: "user", 
      header: t("Customer"), 
      body: (rowData) => (
        <div className="text-xs">
          <div className="font-medium">{rowData.user?.name}</div>
          {rowData.user?.email && (
            <div className="text-gray-500">{rowData.user?.email}</div>
          )}
        </div>
      ),
      style: { width: "240px"}
    },
    { header: "Order Info & Dates", body: orderInfoBodyTemplate, style: { width: "160px"}},
    { header: "Delivery Date / By", body: actualDeliveryDateBodyTemplate, style: { width: "160px"}},
    { header: "Status", body: paymentAndOrderStatusBodyTemplate, style: { width: "150px"}},
    { header: t("action"), body: actionBodyTemplate, style: { width: "220px"}, headerStyle: { paddingLeft: '3%' } },
  ];

  const editOrder = (item) => {
    navigate(`${ROUTES_CONSTANTS.EDIT_ORDER}/${item?.id}`);
  };

  const confirmDeleteOrder = (item) => {
    setIsConfirm(!isConfirm);
    setDeleteId(item?.id);
  };

  const closeDialogbox = () => {
    setDeleteId(null);
    setIsConfirm(!isConfirm);
  };

  const confirmDialogbox = () => {
    setLoader(true);
    setIsConfirm(!isConfirm);
    allApiWithHeaderToken(`${API_CONSTANTS.COMMON_ORDER_URL}/${deleteId}`, '', "delete")
      .then((response) => {
        if (response.status === 200) {
          fetchOrderList();
        } 
      })
      .catch((err) => {
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: err?.response?.data?.errors,
          life: 3000,
        });
        setLoader(false);
      })
  };

  const fetchOrderList = (sk=skip, li=limit) => {
    setLoader(true);
    let body = {
      search: search,
      skip: sk,
      limit: li,
      order_status: values?.orderStatus?.value || null,
      payment_status: values?.paymentStatus?.value || null,
      order_type: values?.orderType?.value || null,
      batch_number: values?.batchNumber || null
    }
    allApiWithHeaderToken(`${API_CONSTANTS.COMMON_ORDER_URL}/filter`, body , "post")
      .then((response) => {
        if (response.status === 200) {
           // Don't transform the dates - keep them as ISO strings for proper parsing
            setData(response?.data.data);
            setTotal(response?.data?.total);
        } 
      })
      .catch((err) => {
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: err?.response?.data?.errors,
          life: 3000,
        });
        setLoader(false);
      }).finally(()=>{
        setLoader(false);
      });
  };

  const paginationChangeHandler = (skip, limit) => {
    setSkip(skip);
    setLimit(limit);
    fetchOrderList(skip, limit);
  };

  const formik = useFormik({
    initialValues: initialData,
    enableReinitialize: true,
    validateOnBlur: true,
  });

  const { values, errors, handleChange, setFieldValue, touched } = formik;

  useEffect(() => {
    fetchOrderList(0,10);
    fetchDeliveryAgents();
  }, [search, values.orderStatus, values.paymentStatus, values.orderType]);

  const fetchDeliveryAgents = async () => {
    try {
      const response = await allApiWithHeaderToken(`${API_CONSTANTS.COMMON_CUSTOMERS_URL}/delivery_agents`, "", "get");
      if (response.status === 200) {
        setDeliveryAgents(response.data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch delivery agents:", error);
    }
  };

  // Scroll to highlighted order and remove highlight after delay
  useEffect(() => {
    if (highlightOrderId && data.length > 0) {
      // Small delay to ensure DOM is rendered
      setTimeout(() => {
        if (highlightedRowRef.current) {
          highlightedRowRef.current.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }
        
        // Remove highlight parameter after 5 seconds
        setTimeout(() => {
          setSearchParams({});
        }, 5000);
      }, 300);
    }
  }, [highlightOrderId, data]);

  return (
    <div className="text-TextPrimaryColor">
      <Toast ref={toast} position="top-right" />
      <Confirmbox
        isConfirm={isConfirm}
        closeDialogbox={closeDialogbox}
        confirmDialogbox={confirmDialogbox}
      />
      
      {/* Change Status Dialog */}
      <Dialog
        header="Change Order Status"
        visible={showStatusDialog}
        style={{ width: '400px' }}
        onHide={() => setShowStatusDialog(false)}
      >
        <div className="p-4">
          <AutocompleteComponent
            value={newStatus}
            onChange={(field, value) => setNewStatus(value)}
            name="newStatus"
            data={orderList}
            dropdown={true}
            placeholder="Select new status"
            showLabel={true}
            label="Order Status"
            className="w-full mb-4"
          />
          <div className="flex justify-end gap-2 mt-4">
            <ButtonComponent
              onClick={() => setShowStatusDialog(false)}
              label="Cancel"
              className="rounded bg-gray-500 px-4 py-2 text-white"
            />
            <ButtonComponent
              onClick={handleStatusChange}
              label="Update Status"
              className="rounded bg-TextPrimaryColor px-4 py-2 text-white"
            />
          </div>
        </div>
      </Dialog>

      {/* Rejection Reason Dialog */}
      <Dialog
        header="Order Rejection Reason"
        visible={showRejectionDialog}
        style={{ width: '500px' }}
        onHide={() => {
          setShowRejectionDialog(false);
          setRejectionReason('');
          setOrderToReject(null);
        }}
      >
        <div className="p-4">
          <p className="text-sm text-gray-600 mb-4">
            Please provide a reason for rejecting this order. This will be communicated to the customer.
          </p>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rejection Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter reason for rejection..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
              rows={4}
            />
          </div>
          <div className="flex justify-end gap-2">
            <ButtonComponent
              onClick={() => {
                setShowRejectionDialog(false);
                setRejectionReason('');
                setOrderToReject(null);
              }}
              label="Cancel"
              className="rounded bg-gray-500 px-4 py-2 text-white hover:bg-gray-600"
            />
            <ButtonComponent
              onClick={handleRejectionSubmit}
              label="Submit & Reject"
              className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
            />
          </div>
        </div>
      </Dialog>

      {/* Order Details Dialog */}
      <Dialog
        visible={showDetailsDialog}
        onHide={() => setShowDetailsDialog(false)}
        header="Order Details"
        style={{ width: '90vw', maxWidth: '800px' }}
        modal
        draggable={false}
        className="order-details-dialog"
      >
        {orderDetails && (
          <div className="p-3">
            {/* Order Header - Simplified */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 mb-4 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">Order ID</p>
                  <p className="text-lg font-bold text-gray-900">#{orderDetails.id}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-600">Order Date</p>
                  <p className="text-sm font-medium text-gray-900">
                    {normalizeDate(orderDetails.created_at)?.toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    }) || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Customer & Delivery Info - Compact */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              {/* Customer Info */}
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <h3 className="text-xs font-bold text-gray-900 mb-2 flex items-center gap-1.5">
                  <i className="ri-user-line text-blue-600 text-sm"></i>
                  Customer
                </h3>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium text-gray-900">{orderDetails.user?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phone:</span>
                    <span className="font-medium text-gray-900">{orderDetails.user?.phone_number}</span>
                  </div>
                </div>
              </div>

              {/* Delivery Info */}
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <h3 className="text-xs font-bold text-gray-900 mb-2 flex items-center gap-1.5">
                  <i className="ri-truck-line text-green-600 text-sm"></i>
                  Delivery
                </h3>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium text-gray-900">
                      {orderDetails.order_type === 'home_delivery' ? 'Home Delivery' : 'In-Store Pickup'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium text-gray-900">
                      {normalizeDate(orderDetails.estimated_delivery_date)?.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      }) || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Shipping Address - Compact */}
            {orderDetails.shipping_address && (
              <div className="bg-white border border-gray-200 rounded-lg p-3 mb-4">
                <h3 className="text-xs font-bold text-gray-900 mb-2 flex items-center gap-1.5">
                  <i className="ri-map-pin-line text-orange-600 text-sm"></i>
                  Address
                </h3>
                <p className="text-xs text-gray-700 leading-relaxed">
                  {[
                    orderDetails.shipping_address.flat_no,
                    orderDetails.shipping_address.landmark,
                    orderDetails.shipping_address.city,
                    orderDetails.shipping_address.state,
                    orderDetails.shipping_address.zip_code
                  ].filter(Boolean).join(', ')}
                </p>
              </div>
            )}

            {/* Order Items - Invoice Style Table */}
            <div className="bg-white border border-gray-200 rounded-lg p-3 mb-3">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Order Details</h3>
              
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-gray-100 border-b-2 border-gray-300 font-semibold text-xs text-gray-700">
                <div className="col-span-1">#</div>
                <div className="col-span-3">Product</div>
                <div className="col-span-2 text-center">Variant</div>
                <div className="col-span-1 text-center">Qty</div>
                <div className="col-span-1 text-right">MRP</div>
                <div className="col-span-2 text-right">Selling</div>
                <div className="col-span-2 text-right">Amount</div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-gray-200">
                {orderDetails.products?.map((item, index) => {
                  const mrp = parseFloat(item.mrp || item.original_price || item.price || 0);
                  const sellingPrice = parseFloat(item.price || item.final_price || 0);
                  const quantity = parseInt(item.quantity || 0);
                  const amount = sellingPrice * quantity;
                  const imageUrl = item.image_url || item.imageUrl || item.image || null;
                  
                  return (
                    <div key={index} className="grid grid-cols-12 gap-2 px-3 py-3 text-xs hover:bg-gray-50">
                      <div className="col-span-1 text-gray-600 flex items-center">{index + 1}</div>
                      <div className="col-span-3">
                        <div className="flex items-center gap-2">
                          <img
                            src={imageUrl || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"%3E%3Crect fill="%23f3f4f6" width="40" height="40"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="9" fill="%239ca3af"%3ENo Img%3C/text%3E%3C/svg%3E'}
                            alt={item.name || item.product_name || 'Product'}
                            className="w-10 h-10 object-cover rounded border border-gray-300 flex-shrink-0"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"%3E%3Crect fill="%23f3f4f6" width="40" height="40"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="9" fill="%239ca3af"%3ENo Img%3C/text%3E%3C/svg%3E';
                            }}
                          />
                          <p className="font-medium text-gray-900 text-xs leading-tight">{item.name || item.product_name || 'Unknown Product'}</p>
                        </div>
                      </div>
                      <div className="col-span-2 text-center text-gray-700 flex items-center justify-center">
                        {item.variant || item.weight || '-'}
                      </div>
                      <div className="col-span-1 text-center text-gray-700 font-semibold flex items-center justify-center">
                        {quantity}
                      </div>
                      <div className="col-span-1 text-right text-gray-500 flex items-center justify-end line-through text-[10px]">
                        ₹{mrp.toFixed(2)}
                      </div>
                      <div className="col-span-2 text-right text-blue-700 font-medium flex items-center justify-end">
                        ₹{sellingPrice.toFixed(2)}
                      </div>
                      <div className="col-span-2 text-right font-semibold text-gray-900 flex items-center justify-end">
                        ₹{amount.toFixed(2)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pricing Summary - Detailed Breakdown */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-3">
              <div className="space-y-2">
                {/* Subtotal */}
                <div className="flex justify-between text-xs pb-2 border-b border-gray-300">
                  <span className="text-gray-700 font-medium">Subtotal (Selling Price):</span>
                  <span className="text-gray-900 font-semibold">
                    ₹{orderDetails.products?.reduce((sum, item) => {
                      return sum + (parseFloat(item.price) * item.quantity);
                    }, 0).toFixed(2)}
                  </span>
                </div>

                {/* Tax & Charges Breakdown */}
                <div className="pt-1">
                  <p className="text-xs font-semibold text-gray-700 mb-1.5">Tax & Charges Breakdown</p>
                  <div className="space-y-1 pl-3">
                    {parseFloat(orderDetails.tax_price || 0) > 0 && (
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">Tax</span>
                        <span className="text-gray-900">₹{parseFloat(orderDetails.tax_price).toFixed(2)}</span>
                      </div>
                    )}
                    {parseFloat(orderDetails.handling_fee || 0) > 0 && (
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">Handling Charge</span>
                        <span className="text-gray-900">₹{parseFloat(orderDetails.handling_fee).toFixed(2)}</span>
                      </div>
                    )}
                    {parseFloat(orderDetails.delivery_charge || 0) > 0 && (
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">Delivery Charge</span>
                        <span className="text-gray-900">₹{parseFloat(orderDetails.delivery_charge).toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Invoice Total */}
                <div className="flex justify-between pt-2 border-t-2 border-gray-400">
                  <span className="text-sm font-bold text-gray-900">Invoice Total:</span>
                  <span className="text-base font-bold text-gray-900">₹{parseFloat(orderDetails.total_price).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Dialog>

      <Breadcrum item={item} />
      <div className="mt-4 flex justify-end bg-BgSecondaryColor border rounded border-BorderColor p-2">
         <div className="flex justify-items-end gap-4">
              <AutocompleteComponent
                  value={values.orderStatus}
                  onChange={(field, value) => setFieldValue("orderStatus", value)}
                  name="orderStatus"
                  data={orderList}
                  dropdown={true}
                  placeholder="Select Order Status"
                  showLabel={false}
                  className="custom-dropdown col-span-2 w-full rounded border-[1px] border-[#ddd] focus:outline-none"
              />
              <AutocompleteComponent
                  value={values.paymentStatus}
                  onChange={(field, value) => setFieldValue("paymentStatus", value)}
                  name="paymentStatus"
                  data={paymentStatusList}
                  dropdown={true}
                  placeholder="Select Payment Status"
                  showLabel={false}
                  className="custom-dropdown col-span-2 w-full rounded border-[1px] border-[#ddd] focus:outline-none"
              />
              <AutocompleteComponent
                  value={values.orderType}
                  onChange={(field, value) => setFieldValue("orderType", value)}
                  name="orderType"
                  data={orderTypeList}
                  dropdown={true}
                  placeholder="Select Order Type"
                  showLabel={false}
                  className="custom-dropdown col-span-2 w-full rounded border-[1px] border-[#ddd] focus:outline-none"
              />
        </div>
      </div>
      <div className="mt-4 order-table-container">
        <DataTable
          className="bg-BgPrimaryColor border rounded border-BorderColor"
          columns={columns}
          data={data}
          skip={skip}
          rows={limit}
          total={total}
          paginationChangeHandler={paginationChangeHandler}
          loader={loader}
          showGridlines={true}
          stripedRows={true}
          rowClassName={(rowData) => {
            const baseClass = highlightOrderId && rowData.id === parseInt(highlightOrderId) 
              ? 'highlighted-order-row' 
              : '';
            return baseClass;
          }}
          onRowClick={(e) => {
            if (highlightOrderId && e.data.id === parseInt(highlightOrderId)) {
              highlightedRowRef.current = e.originalEvent.currentTarget;
            }
          }}
        />
      </div>
    </div>
  );
};

export default OrderList;
