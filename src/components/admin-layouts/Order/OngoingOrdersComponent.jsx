import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ButtonComponent from '@common/ButtonComponent';
import { refactorPrefilledDate } from '@helper';

const OngoingOrdersComponent = ({ 
  orders, 
  loader, 
  expandedOrders, 
  setExpandedOrders,
  uploadingReceipt,
  uploadingInProgress,
  getStatusInfo,
  toggleOrderDetails,
  handlePayment,
  handleBankingReceiptUpload,
  handleCancelOrder
}) => {
  const { t } = useTranslation("msg");
  const [processingPayments, setProcessingPayments] = useState(new Set());

  // Wrapper function to handle payment with per-order loading state
  const handlePaymentWithLoading = async (orderId, notificationId) => {
    // Add this order to processing set
    setProcessingPayments(prev => new Set([...prev, orderId]));
    
    try {
      // Call the original handlePayment function
      await handlePayment(orderId, notificationId);
    } finally {
      // Remove this order from processing set
      setProcessingPayments(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] sm:min-h-[400px] px-4">
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4 sm:mb-6">
          <i className="ri-shopping-bag-line text-2xl sm:text-3xl text-gray-400"></i>
        </div>
        <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-2 sm:mb-3">{t("no_ongoing_orders")}</h3>
        <p className="text-gray-500 text-xs sm:text-sm mb-6 sm:mb-8 text-center max-w-md leading-relaxed">
          {t("all_your_orders_have_been_completed_or_cancelled")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2 sm:space-y-3 pr-1 sm:pr-3 pb-8">
      {orders.map((notification) => {
        const statusInfo = getStatusInfo(notification.orderStatus, notification.paymentStatus);
        const isExpanded = expandedOrders.has(notification.id);

        return (
          <div key={notification.id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200">
            {/* Order Header - Mobile Optimized */}
            <div className="p-3 sm:p-4 border-b border-gray-100">
              <div className="flex items-start justify-between gap-2 sm:gap-3">
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <i className="ri-shopping-bag-3-line text-blue-600 text-xs"></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 justify-between">
                      <span className="text-xs sm:text-sm font-semibold text-gray-900 truncate">
                        {notification.orderId}
                      </span>
                    
                      <button
                        onClick={() => toggleOrderDetails(notification.id)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 flex-shrink-0 px-1 py-0.5 rounded hover:bg-blue-50 transition-colors"
                      >
                        <span className="hidden sm:inline">{isExpanded ? t('hide_details') : t('view_details')}</span>
                        <span className="sm:hidden">{isExpanded ? 'Hide' : 'View'}</span>
                        <i className={`ri-arrow-${isExpanded ? 'up' : 'down'}-s-line text-xs`}></i>
                      </button>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                      <div className={`px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0 w-fit ${statusInfo.color}`}>
                          {t(statusInfo.text)}
                      </div>
                      {notification.createdAt && (
                        <div className="text-xs text-gray-500 mt-1 sm:mt-0">
                          {refactorPrefilledDate(notification.createdAt)}
                        </div>
                      )}
                    </div>
                   
                  </div>
                </div>
              </div>

              {/* Order Fulfilled Date - Mobile Optimized */}
              {notification.orderFulfilledDate && (
                <div className="w-full flex flex-col sm:flex-row sm:items-center gap-1 text-xs text-green-600 mt-2 bg-green-50 px-2 py-1.5 sm:py-1 rounded">
                  <div className="flex items-center gap-1">
                    <i className="ri-calendar-check-line"></i>
                    <span className="font-medium">{t("delivery_time")}:</span>
                  </div>
                  <span className="sm:ml-1">
                    {new Date(notification.orderFulfilledDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </span>
                </div>
              )}
            </div>

            {/* Expandable Order Details */}
            {isExpanded && (
              <div className="px-3 sm:px-4 py-3 bg-gray-50 border-b border-gray-100">
                {/* Order Items Section */}
                <div className="mb-3 sm:mb-4">
                  <h4 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2 sm:mb-3">{t("order_items")}</h4>
                  <div className="space-y-2">
                    {notification.orderItems?.map((item, index) => (
                      <div key={index} className="flex sm:flex-row sm:items-center gap-2 sm:gap-3 p-2 bg-white rounded border">
                        <div className="flex items-center gap-2 sm:gap-3 flex-1">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 rounded flex-shrink-0 flex items-center justify-center">
                            {item.image_url ? (
                              <img
                                src={item.image_url}
                                alt={item.name}
                                className="w-full h-full object-cover rounded"
                              />
                            ) : (
                              <i className="ri-image-line text-gray-400 text-xs"></i>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="text-xs font-medium text-gray-900 truncate">{item.name}</h5>
                            <p className="text-xs text-gray-500">{t("weight")}: {item.weight}</p>
                          </div>
                        </div>
                        <div className="text-right sm:flex-shrink-0">
                          <div className="text-xs font-medium text-gray-900">
                            {item.quantity} × ₹{Number(item.discounted_price || item.price)}
                            {item.discounted_price && Number(item.discounted_price) < Number(item.price) && (
                              <span className="ml-1 text-gray-400 line-through">₹{Number(item.price)}</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            ₹{(Number(item.discounted_price || item.price) * item.quantity).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Modification History */}
                {notification?.orderHistory && notification.orderHistory.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <i className="ri-history-line text-blue-600 text-xs"></i>
                      <span className="hidden sm:inline">{t("order_modifications_by_admin")}</span>
                      <span className="sm:hidden">Modifications</span>
                    </h4>
                    <div className="space-y-1.5">
                      {notification.orderHistory.map((history, index) => {
                        return (
                        <div key={index} className="p-1.5 bg-white rounded border border-l-4 border-l-blue-500">
                          <div className="flex flex-col gap-1">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1">
                              <div className="flex-1">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 mb-0.5">
                                  <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded-full w-fit ${
                                    history.change_type === 'product_added' ? 'bg-green-100 text-green-700' :
                                    history.change_type === 'product_removed' ? 'bg-red-100 text-red-700' :
                                    history.change_type === 'quantity_changed' ? 'bg-blue-100 text-blue-700' :
                                    history.change_type === 'price_changed' ? 'bg-orange-100 text-orange-700' :
                                    history.change_type === 'shipping_details_updated' ? 'bg-purple-100 text-purple-700' :
                                    'bg-gray-100 text-gray-700'
                                  }`}>
                                    {history.change_type === 'product_added' ? t('product_added') :
                                     history.change_type === 'product_removed' ? t('product_removed') :
                                     history.change_type === 'quantity_changed' ? t('quantity_changed') :
                                     history.change_type === 'price_changed' ? t('price_changed') :
                                     history.change_type === 'shipping_details_updated' ? t('shipping_updated') :
                                     t('change')}
                                  </span>
                                  <span className="text-[10px] text-gray-600">{t("by")} {history.changed_by}</span>
                                </div>
                                <div>
                                  <p className="text-[10px] text-gray-800 mb-0.5 leading-relaxed">{history.change_description}</p>
                                </div>
                                {/* Show detailed old vs new values for quantity and price changes */}
                                {(history.change_type === 'quantity_changed' || history.change_type === 'price_changed') && 
                                 history.old_value && history.new_value && (
                                  <div className='flex items-center gap-1.5'>
                                      <div className="text-[10px] text-gray-600 mt-0.5 p-1 bg-gray-50 rounded border">
                                        {history.change_type === 'quantity_changed' && (
                                          <div className="flex items-center gap-1.5">
                                            <span className="text-red-600">Old Qty: {history.old_value.quantity}</span>
                                            <i className="ri-arrow-right-line text-gray-400 text-[8px]"></i>
                                            <span className="text-green-600">New Qty: {history.new_value.quantity}</span>
                                          </div>
                                        )}
                                        {history.change_type === 'price_changed' && (
                                          <div className="flex items-center gap-1.5">
                                            <span className="text-red-600">Old Price: ₹{history.old_value.price}</span>
                                            <i className="ri-arrow-right-line text-gray-400 text-[8px]"></i>
                                            <span className="text-green-600">New Price: ₹{history.new_value.price}</span>
                                          </div>
                                        )}
                                      </div>
                                      <div className='text-[10px] text-gray-600'>
                                        {new Date(history.changed_at).toLocaleDateString('en-US', {
                                          month: 'short',
                                          day: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })}
                                      </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Order Summary - Compact */}
            <div className="px-3 sm:px-4 py-2">
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">{t("base_price")}</span>
                  <span className="font-medium">₹{notification.basePrice || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t("handling_fee")}</span>
                  <span className="font-medium"> ₹{notification.handlingFee || 0}</span>
                </div>
                {notification.totalCartons && notification.shippingCostPerCarton && (
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>({notification.totalCartons} cartons × ₹{notification.shippingCostPerCarton})</span>
                    <span></span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">{t("estimated_delivery_date")}</span>
                  <span className="font-medium">
                    {notification.estimatedDeliveryDate ? new Date(notification.estimatedDeliveryDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    }) : "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t("tax_price")}</span>
                  <span className="font-medium">₹{notification.shippingFee || 0}</span>
                </div>
                {notification.orderStatus !== 'packed' && notification.orderStatus !== 'shipped' && notification.orderStatus !== 'delivered' && notification.orderStatus !== 'cancelled' && notification.orderStatus !== 'rejected' && !notification.handlingFee && (
                  <div className="mt-1 p-1 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-xs text-yellow-800">
                      <i className="ri-information-line mr-1"></i>
                      {t("shipping_cost_will_be_calculated_after_review")}
                    </p>
                  </div>
                )}
              </div>

              {/* Total - Prominent */}
              <div className="mt-2 pt-2 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-900">{t("total_price")}</span>
                  <span className={`text-lg font-bold ${
                    notification.orderStatus === 'rejected' || notification.orderStatus === 'cancelled'
                      ? 'text-red-600 line-through'
                      : 'text-green-600'
                  }`}>
                    ₹{notification.totalPrice}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons - Mobile Optimized */}
            <div className="px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 border-t border-gray-100">
              <div className="flex gap-2">
                {/* Only show cancel button if order is not cancelled and payment is not completed */}
                {['in_review', 'pending'].includes(notification.orderStatus?.toLowerCase()) && notification.orderStatus?.toLowerCase() !== 'cancelled' && (
                  <ButtonComponent
                    onClick={() => handleCancelOrder(notification.orderId, notification.id)}
                    label={t("cancel")}
                    disabled={loader}
                    className="w-full rounded-lg border border-red-300 text-red-600 hover:bg-red-50 px-3 py-2 sm:py-1.5 text-xs sm:text-sm font-medium transition-colors duration-200 disabled:opacity-50 min-h-[36px] sm:min-h-[32px]"
                  />
                )}

                {statusInfo.showPayButton ? (
                  <div className="flex sm:flex-row gap-2">
                    <ButtonComponent
                      onClick={() => handlePaymentWithLoading(notification.orderId, notification.id)}
                      label={processingPayments.has(notification.orderId) ? t("processing") : t("pay_now")}
                      disabled={processingPayments.has(notification.orderId)}
                      className={`flex-1 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs sm:text-[0.8rem] font-medium transition-colors duration-200 disabled:opacity-50 min-h-[36px] sm:min-h-[32px] ${
                        processingPayments.has(notification.orderId) ? 'px-4 py-2' : 'px-3 py-2 sm:py-1.5'
                      }`}
                    />
                    <ButtonComponent
                      onClick={() => handleBankingReceiptUpload(notification.orderId, notification.id)}
                      icon={uploadingInProgress === notification.id ? "ri-loader-4-line animate-spin" : "ri-upload-2-line"}
                      disabled={loader || uploadingReceipt === notification.orderId || uploadingInProgress === notification.id}
                      className={`flex-1 sm:flex-none rounded-lg px-3 py-2 sm:py-1.5 text-xs sm:text-[0.8rem] font-medium transition-all duration-200 min-h-[36px] sm:min-h-[32px] ${
                        uploadingReceipt === notification.orderId || uploadingInProgress === notification.id
                          ? 'bg-blue-500 cursor-not-allowed opacity-75' 
                          : 'bg-blue-600 hover:bg-blue-700 hover:shadow-md'
                      } text-white disabled:opacity-50`}
                      label={
                        uploadingReceipt === notification.orderId || uploadingInProgress === notification.id 
                          ? <span className="hidden sm:inline">{t("uploading")}</span> || <span className="sm:hidden">Uploading...</span>
                          : <span className="hidden sm:inline ps-2">{loader ? "Upload" : t("upload_receipt")}</span> || <span className="sm:hidden">Upload</span>
                      }
                    />
                  </div>
                ) : (
                  notification.orderStatus === 'in_review' && notification.paymentStatus === 'pending' && (
                    <div className="w-full rounded-lg bg-blue-50 border border-blue-200 px-3 py-2 sm:py-1.5 text-xs sm:text-sm text-blue-700 font-medium text-center min-h-[36px] sm:min-h-[32px] flex items-center justify-center">
                      <i className="ri-time-line mr-1 text-sm"></i>
                      <span className="hidden sm:inline">{t("payment_available_after_review")}</span>
                      <span className="sm:hidden">Under Review</span>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default OngoingOrdersComponent;
