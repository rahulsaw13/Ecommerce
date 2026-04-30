import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import AdminPanelLoader from '@common/AdminPanelLoader';

const OrderHistoryComponent = ({ 
  orders, 
  loader,
  getStatusInfo,
  handlePayment,
  handleBankingReceiptUpload,
  handleCancelOrder,
  fetchMoreOrders,
  hasMoreOrders,
  loadingMore,
  onRefresh,
  onFilterChange
}) => {
  const { t } = useTranslation("msg");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  // Remove filteredOrders state since we'll use server-side filtering
  const [filters, setFilters] = useState({
    orderNumber: '',
    deliveryDate: ''
  });

  // Format date for display
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

  // Format total amount
  const formatAmount = (amount) => {
    if (!amount || isNaN(amount)) return '₹0';
    return `₹${Number(amount).toLocaleString('en-IN')}`;
  };

  // View order details in dialog
  const viewOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowOrderDialog(true);
  };

  // Download receipt function
  const downloadReceipt = async (order) => {
    try {
      // Check all possible receipt field names
      const receiptUrl = order.receipt_url || 
                        order.receiptUrl || 
                        order.banking_receipt || 
                        order.bankingReceipt || 
                        order.receipt || 
                        order.receipt_file || 
                        order.receiptFile || 
                        order.payment_receipt || 
                        order.paymentReceipt;
                        
      if (!receiptUrl) {
        return;
      }

      // Create a temporary anchor element to trigger download
      const link = document.createElement('a');
      link.href = receiptUrl;
      
      // Extract filename from URL or create a default name
      const urlParts = receiptUrl.split('/');
      const fileName = urlParts[urlParts.length - 1] || `receipt_${order.orderId || order.id}`;
      
      // Set download attribute with filename
      link.download = fileName;
      
      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
    }
  };

  // Debounce filter changes to avoid too many API calls
  const [debounceTimer, setDebounceTimer] = useState(null);
  
  // Throttle scroll-triggered API calls
  const [lastScrollFetch, setLastScrollFetch] = useState(0);
  const SCROLL_THROTTLE_MS = 2000; // 2 seconds between scroll-triggered fetches

  // Handle server-side filtering with debounce
  const handleServerSideFilter = useCallback((filterType, value) => {
    const newFilters = { ...filters, [filterType]: value };
    setFilters(newFilters);

    // Clear existing timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // Set new timer for debounced API call
    const timer = setTimeout(() => {
      if (onFilterChange) {
        onFilterChange(newFilters);
      }
    }, 500); // 500ms debounce

    setDebounceTimer(timer);
  }, [filters, debounceTimer, onFilterChange]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  // Handle filter input changes with server-side filtering
  const handleFilterInputChange = (field, value) => {
    handleServerSideFilter(field, value);
  };

  // Clear filters and refresh data
  const clearFiltersAndRefresh = () => {
    const clearedFilters = {
      orderNumber: '',
      deliveryDate: ''
    };
    setFilters(clearedFilters);
    
    // Clear debounce timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    
    // Immediately call filter change with cleared filters
    if (onFilterChange) {
      onFilterChange(clearedFilters);
    }
  };

  // Infinite scroll handler with improved logic
  const handleScroll = useCallback((e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    const now = Date.now();
    
    // Only trigger if:
    // 1. User scrolled near bottom (within 100px)
    // 2. Has more orders available
    // 3. Not currently loading
    // 4. Have at least 10 orders already loaded
    // 5. Enough time has passed since last fetch (throttling)
    const shouldLoadMore = scrollHeight - scrollTop <= clientHeight + 100 && 
                          hasMoreOrders && 
                          !loadingMore && 
                          orders.length >= 10 &&
                          (now - lastScrollFetch) >= SCROLL_THROTTLE_MS;
    
    if (shouldLoadMore) {
      setLastScrollFetch(now);
      fetchMoreOrders();
    }
  }, [hasMoreOrders, loadingMore, fetchMoreOrders, orders.length, lastScrollFetch, SCROLL_THROTTLE_MS]);

  if (orders.length === 0 && !loader) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] sm:min-h-[400px] px-4">
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4 sm:mb-6">
          <i className="ri-history-line text-2xl sm:text-3xl text-gray-400"></i>
        </div>
        <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-2 sm:mb-3">{t("no_orders_found")}</h3>
        <p className="text-gray-500 text-xs sm:text-sm mb-6 sm:mb-8 text-center max-w-md leading-relaxed">
          {t("you_havent_placed_any_orders_yet")}
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Filter Section - Mobile Optimized */}
      <div className="bg-white p-2 sm:p-3 border-b border-gray-200 flex-shrink-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Order No.
            </label>
            <input
              type="text"
              value={filters.orderNumber}
              onChange={(e) => handleFilterInputChange('orderNumber', e.target.value)}
              placeholder="Search order..."
              className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className='flex items-end gap-2'>
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {t('delivery_date')}
              </label>
              <input
                type="date"
                value={filters.deliveryDate}
                onChange={(e) => handleFilterInputChange('deliveryDate', e.target.value)}
                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={clearFiltersAndRefresh}
              className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200 rounded hover:bg-gray-100"
              title={t('refresh_and_clear_filters')}
            >
              <i className="ri-refresh-line text-sm sm:text-base"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Table Section - Mobile Responsive */}
      <div className="flex-1 overflow-auto" onScroll={handleScroll}>
        <div className="w-full">
          {/* Mobile Card View */}
          <div className="block sm:hidden">
            {orders.map((order, index) => {
              const statusInfo = getStatusInfo(order.orderStatus, order.paymentStatus);
              return (
                <div key={order.id} className="bg-white border-b border-gray-200 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <button
                          onClick={() => viewOrderDetails(order)}
                          className="text-blue-600 hover:text-blue-900 flex-shrink-0 p-1 rounded hover:bg-blue-50"
                          title={t('view_details')}
                        >
                          <i className="ri-eye-line text-sm"></i>
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-gray-500 truncate">{order.batch_number || order.batchNumber || '-'}</div>
                          <div className="text-sm font-medium truncate">{order.orderId}</div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-600">{t('delivery_date')}: {formatDate(order.estimatedDeliveryDate)}</span>
                        <span className="font-medium">{formatAmount(order.totalPrice)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {order.receipt_url || order.receiptUrl || order.banking_receipt || order.bankingReceipt || order.receipt || order.receipt_file || order.receiptFile || order.payment_receipt || order.paymentReceipt ? (
                        <button
                          onClick={() => downloadReceipt(order)}
                          className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                          title={t('download_receipt')}
                        >
                          <i className="ri-download-line text-sm"></i>
                        </button>
                      ) : (
                        <button
                          disabled
                          className="text-gray-400 cursor-not-allowed p-1"
                          title={t('no_receipt_available')}
                        >
                          <i className="ri-download-line text-sm"></i>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View */}
          <table className="w-full min-w-[400px] text-left hidden sm:table">
            <colgroup>
              <col style={{ width: "35%" }} />
              <col style={{ width: "25%" }} />
              <col style={{ width: "25%" }} />
              <col style={{ width: "15%" }} />
            </colgroup>
            <thead>
              <tr className="border-b bg-gray-100">
                <th className="p-2 sm:p-3 text-xs sm:text-sm font-medium">Batch No./ Order No.</th>
                <th className="p-2 sm:p-3 text-xs sm:text-sm font-medium">{t('delivery_date')}</th>
                <th className="p-2 sm:p-3 text-xs sm:text-sm font-medium">{t('amount')}</th>
                <th className="p-2 sm:p-3 text-xs sm:text-sm font-medium">{t('actions')}</th>
              </tr>
              {orders.map((order, index) => {
                const statusInfo = getStatusInfo(order.orderStatus, order.paymentStatus);
                return (
                  <tr key={order.id} className="border-b hover:bg-gray-50">
                    <td className="p-2 sm:p-3">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <button
                          onClick={() => viewOrderDetails(order)}
                          className="text-blue-600 hover:text-blue-900 flex-shrink-0 p-1 rounded hover:bg-blue-50"
                          title={t('view_details')}
                        >
                          <i className="ri-eye-line text-sm"></i>
                        </button>
                        <div className="flex flex-col gap-1 min-w-0">
                          <span className="text-xs text-gray-500 truncate">{order.batch_number || order.batchNumber || '-'}</span>
                          <span className="text-xs sm:text-sm font-medium truncate">{order.orderId}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-2 sm:p-3 text-xs sm:text-sm">
                      {formatDate(order.estimatedDeliveryDate)}
                    </td>
                    <td className="p-2 sm:p-3 text-xs sm:text-sm font-medium">
                      {formatAmount(order.totalPrice)}
                    </td>
                    <td className="p-2 sm:p-3">
                      <div className="flex items-center gap-2">
                        {order.receipt_url || order.receiptUrl || order.banking_receipt || order.bankingReceipt || order.receipt || order.receipt_file || order.receiptFile || order.payment_receipt || order.paymentReceipt ? (
                          <button
                            onClick={() => downloadReceipt(order)}
                            className="text-green-600 hover:text-green-900 flex-shrink-0 p-1 rounded hover:bg-green-50"
                            title={t('download_receipt')}
                          >
                            <i className="ri-download-line text-sm"></i>
                          </button>
                        ) : (
                          <button
                            disabled
                            className="text-gray-400 cursor-not-allowed flex-shrink-0 p-1"
                            title={t('no_receipt_available')}
                          >
                            <i className="ri-download-line text-sm"></i>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </thead>
          </table>

          {/* Loading More Indicator */}
          {loadingMore && (
            <div className="flex justify-center py-3 sm:py-4">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-blue-600"></div>
                <span className="text-xs sm:text-sm text-gray-600">{t('loading_more')}</span>
              </div>
            </div>
          )}

          {/* No More Data Indicator */}
          {!hasMoreOrders && orders.length > 0 && (
            <div className="text-center py-3 sm:py-4 text-xs sm:text-sm text-gray-500">
              {t('no_more_orders')}
            </div>
          )}

          {/* No Results */}
          {orders.length === 0 && !loader && (
            <div className="text-center py-6 sm:py-8">
              <div className="text-gray-500 text-xs sm:text-sm">{t('no_orders_match_filters')}</div>
            </div>
          )}
        </div>
      </div>

      {/* Order Details Dialog - Mobile Optimized */}
      <Dialog 
        visible={showOrderDialog} 
        onHide={() => setShowOrderDialog(false)}
        header={<span className="text-sm sm:text-base">{selectedOrder ? `${t('order_details')} - ${selectedOrder.orderId}` : t('order_details')}</span>}
        style={{ width: '95vw', maxWidth: '800px' }}
        modal
        className="p-fluid order-history-dialog"
        contentStyle={{ padding: "0.75rem 1rem" }}
      >
        {selectedOrder && (
          <div className="space-y-3 sm:space-y-4">
            {/* Order Status */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-2 sm:p-3 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-semibold text-gray-900 text-sm sm:text-base">{t('order_status')}</h4>
                <div className="mt-1">
                  {(() => {
                    const statusInfo = getStatusInfo(selectedOrder.orderStatus, selectedOrder.paymentStatus);
                    return (
                      <span className={`px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium rounded-full ${statusInfo.color}`}>
                        {t(statusInfo.text)}
                      </span>
                    );
                  })()}
                </div>
              </div>
              <div className="sm:text-right">
                <div className="text-xs sm:text-sm text-gray-600">{t('order_date')}</div>
                <div className="font-medium text-sm">{formatDate(selectedOrder.createdAt)}</div>
              </div>
            </div>

            {/* Order Items */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">{t('order_items')}</h4>
              <div className="space-y-2">
                {selectedOrder.orderItems?.map((item, index) => (
                  <div key={index} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-white border rounded-lg">
                    <div className="flex items-center gap-2 sm:gap-3 flex-1">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded flex-shrink-0 flex items-center justify-center">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-full h-full object-cover rounded"
                          />
                        ) : (
                          <i className="ri-image-line text-gray-400 text-sm"></i>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="font-medium text-gray-900 text-sm sm:text-base truncate">{item.name}</h5>
                        <p className="text-xs sm:text-sm text-gray-500">{t('weight')}: {item.weight}</p>
                      </div>
                    </div>
                    <div className="text-right sm:flex-shrink-0">
                      <div className="font-medium text-sm">
                        {item.quantity} × ₹{Number(item.discounted_price || item.price)}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-500">
                        ₹{(Number(item.discounted_price || item.price) * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">{t('order_summary')}</h4>
              <div className="space-y-1 sm:space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t('base_price')}</span>
                  <span>₹{selectedOrder.basePrice || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t('handling_fee')}</span>
                  <span>₹{selectedOrder.handlingFee || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t('tax_price')}</span>
                  <span>₹{selectedOrder.shippingFee || 0}</span>
                </div>
                <div className="flex justify-between border-t pt-2 font-semibold text-sm sm:text-base">
                  <span>{t('total_price')}</span>
                  <span className="text-green-600">₹{selectedOrder.totalPrice}</span>
                </div>
              </div>
            </div>

            {/* Delivery Information */}
            {selectedOrder.estimatedDeliveryDate && (
              <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">{t('delivery_information')}</h4>
                <div className="text-xs sm:text-sm text-gray-700">
                  <div className="flex items-center gap-2">
                    <i className="ri-calendar-line text-blue-600"></i>
                    <span>{t('estimated_delivery')}: {formatDate(selectedOrder.estimatedDeliveryDate)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              {(() => {
                const statusInfo = getStatusInfo(selectedOrder.orderStatus, selectedOrder.paymentStatus);
                return (
                  <div className="flex">
                    {statusInfo.showPayButton && (
                      <>
                        <Button
                          label={t('pay_now')}
                          icon="ri-money-dollar-circle-line"
                          className="p-button-success"
                          onClick={() => {
                            setShowOrderDialog(false);
                            handlePayment(selectedOrder.orderId, selectedOrder.id);
                          }}
                        />
                        <Button
                          label={t('upload_receipt')}
                          icon="ri-upload-2-line"
                          className="p-button-info"
                          onClick={() => {
                            setShowOrderDialog(false);
                            handleBankingReceiptUpload(selectedOrder.orderId, selectedOrder.id);
                          }}
                        />
                      </>
                    )}
                    {['in_review', 'pending'].includes(selectedOrder.orderStatus?.toLowerCase()) && (
                      <Button
                        label={t('cancel_order')}
                        icon="ri-close-line"
                        className="p-button-danger p-button-outlined"
                        onClick={() => {
                          setShowOrderDialog(false);
                          handleCancelOrder(selectedOrder.orderId, selectedOrder.id);
                        }}
                      />
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
};

export default OrderHistoryComponent;
