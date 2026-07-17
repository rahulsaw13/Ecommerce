// PrintInvoice.js
import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';

const PrintInvoice = ({ data }) => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [orderData, setOrderData] = useState(data);
  const isWorkOrder = searchParams.get('type') === 'workorder';

  useEffect(() => {
    const fetchOrderData = async () => {
      if (!data && id) {
        try {
          // Fetch order data from API for dynamic data
          const token = localStorage.getItem('token');
          const response = await fetch(
            `${process.env.REACT_APP_BASE_URL}/api/v1/orders/${id}`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            }
          );

          if (response.ok) {
            const orderResponse = await response.json();
            setOrderData(orderResponse.data);
          } else {
            // Fallback to sessionStorage if API fails
            const storedData = sessionStorage.getItem(`workOrder_${id}`);
            if (storedData) {
              try {
                const parsedData = JSON.parse(storedData);
                setOrderData(parsedData);
              } catch (error) {
              }
            }
          }
        } catch (error) {
          // Fallback to sessionStorage
          const storedData = sessionStorage.getItem(`workOrder_${id}`);
          if (storedData) {
            try {
              const parsedData = JSON.parse(storedData);
              setOrderData(parsedData);
            } catch (error) {
            }
          }
        }
      }
    };

    fetchOrderData();
  }, [data, id]);

  // Use orderData as the current data source
  const currentData = orderData;

  const formatAddress = (address) => {
    if (!address) return '';
    const { flat_no, landmark, city, state, zip_code, country } = address;
    return `${flat_no || ''}, ${landmark || ''}, ${city || ''}, ${state || ''} ${zip_code || ''}, ${country || ''}`;
  };

  // Calculate subtotal using discounted prices if available
  // Handle both API response format (order_items) and sessionStorage format (products)
  const products = currentData?.order_items || currentData?.products || [];
  const subtotal = products?.reduce((sum, item) => {
    const price = item.discounted_price ? parseFloat(item.discounted_price) : parseFloat(item.price);
    return sum + (item.quantity * price);
  }, 0) || 0;
  
  const taxPrice = currentData?.tax_price ? parseFloat(currentData.tax_price) : 0;
  const handlingFee = currentData?.handling_fee ? parseFloat(currentData.handling_fee) : 0;
  const discount = currentData?.discount ? parseFloat(currentData.discount) : 0;
  const couponDiscount = currentData?.coupon_discount ? parseFloat(currentData.coupon_discount) : 0;
  const couponCode = currentData?.coupon_code || null;

  // Calculate total
  const finalTotal = subtotal + taxPrice + handlingFee - couponDiscount;

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white">
      {/* Print Styles */}
      <style jsx>{`
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
      `}</style>

      <div className="print-container shadow-lg border rounded-lg p-6">
        {/* Print Header - Only visible when printing */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">{isWorkOrder ? 'WORK ORDER' : 'INVOICE'}</h1>
          <div className={`h-1 w-full ${isWorkOrder ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
        </div>

        {/* Header Information */}
        <div className="grid grid-cols-2 gap-6 text-sm text-gray-700 mb-8">
          <div>
            <p className="mb-1"><strong>{isWorkOrder ? 'Work Order ID:' : 'Invoice ID:'}</strong> {isWorkOrder ? `WO-${currentData?.id}` : `#${currentData?.id}`}</p>
            <p className="mb-1"><strong>Date:</strong> {currentData?.created_at ? new Date(currentData.created_at).toLocaleDateString() : ''}</p>
            {isWorkOrder && <p className="mb-1"><strong>Batch Number:</strong> {currentData?.batch_number || 'Not Assigned'}</p>}
          </div>
          <div className="text-right">
            <p className="mb-1"><strong>Status:</strong> <span className={`capitalize ${isWorkOrder ? 'text-blue-600' : ''}`}>{currentData?.order_status?.replace(/_/g, ' ')}</span></p>
            {!isWorkOrder && <p className="mb-1"><strong>Payment:</strong> {currentData?.payment_status} ({currentData?.payment_mode})</p>}
            {isWorkOrder && (
              <>
                <p className="mb-1"><strong>Priority:</strong> <span className="text-orange-600">Standard</span></p>
                <p className="mb-1"><strong>Warehouse:</strong> {currentData?.warehouse?.name || 'Main Warehouse'}</p>
              </>
            )}
          </div>
        </div>

        {/* Customer Information */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-1">Customer Information</h2>
          <div className="grid grid-cols-2 gap-6 text-sm text-gray-700">
            <div>
              <p className="mb-1"><strong>Name:</strong> {currentData?.user?.name}</p>
              <p className="mb-1"><strong>Email:</strong> {currentData?.user?.email}</p>
              <p className="mb-1"><strong>Phone:</strong> {currentData?.user?.phone_number}</p>
            </div>
            {isWorkOrder && (
              <div>
                <p className="mb-1"><strong>Delivery Date:</strong> {currentData?.estimated_delivery_date ? new Date(currentData.estimated_delivery_date).toLocaleDateString() : 'TBD'}</p>
                <p className="mb-1"><strong>Payment Mode:</strong> {currentData?.payment_mode || 'N/A'}</p>
              </div>
            )}
          </div>
        </div>

        {/* Addresses */}
        {!isWorkOrder ? (
          <div className="grid grid-cols-2 gap-6 text-sm text-gray-700 mb-8">
            <div>
              <h3 className="font-semibold text-gray-800 mb-2 border-b pb-1">Billing Address</h3>
              <p className="leading-relaxed">{formatAddress(currentData?.billing_address)}</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-2 border-b pb-1">Shipping Address</h3>
              <p className="leading-relaxed">{formatAddress(currentData?.shipping_address)}</p>
            </div>
          </div>
        ) : (
          <div className="mb-8">
            <h3 className="font-semibold text-gray-800 mb-2 border-b pb-1">Customer Address</h3>
            <div className="text-sm text-gray-700 leading-relaxed">
              <p><strong>{currentData?.user?.name}</strong></p>
              <p>{currentData?.user?.company_name}</p>
              <p>{formatAddress(currentData?.shipping_address || currentData?.user?.address)}</p>
            </div>
          </div>
        )}

        {/* Products Table */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-1">{isWorkOrder ? 'Items to Manufacture' : 'Order Details'}</h2>
          <table className="w-full border-collapse border border-gray-300 text-sm">
            <thead>
              <tr className={isWorkOrder ? "bg-blue-50" : "bg-gray-100"}>
                <th className="border border-gray-300 p-3 text-left">#</th>
                <th className="border border-gray-300 p-3 text-left">{isWorkOrder ? 'Product Details' : 'Product'}</th>
                <th className="border border-gray-300 p-3 text-center">Qty</th>
                <th className="border border-gray-300 p-3 text-center">Unit Price</th>
                {isWorkOrder ? (
                  <th className="border border-gray-300 p-3 text-center">Manufacturing Notes</th>
                ) : (
                  <th className="border border-gray-300 p-3 text-right">Subtotal</th>
                )}
              </tr>
            </thead>
            <tbody>
              {products?.map((item, index) => (
                <tr key={item.product?.id || item.product_id || index}>
                  <td className="border border-gray-300 p-3">{index + 1}</td>
                  <td className="border border-gray-300 p-3">
                    <div>
                      <p className="font-medium">{item.product?.name || item.name}</p>
                      {(item.product?.description || item.description) && (
                        <p className="text-xs text-gray-500 mt-1">{item.product?.description || item.description}</p>
                      )}
                      {(item.product?.weight || item.weight) && (
                        <p className={`text-xs ${isWorkOrder ? 'text-gray-600 bg-gray-100 inline-block px-2 py-1 rounded mt-1' : 'text-gray-500'}`}>
                          Weight: {item.product?.weight || item.weight}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="border border-gray-300 p-3 text-center">
                    {isWorkOrder ? (
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                        {item.quantity}
                      </span>
                    ) : (
                      item.quantity
                    )}
                  </td>
                  <td className="border border-gray-300 p-3 text-center">
                    <div>
                      {item.discounted_price && parseFloat(item.discounted_price) < parseFloat(item.price) ? (
                        <>
                          <span className="line-through text-gray-500 text-xs">Rs. {parseFloat(item.price).toFixed(2)}</span>
                          <br />
                          <span className="text-green-600 font-medium">Rs. {parseFloat(item.discounted_price).toFixed(2)}</span>
                        </>
                      ) : (
                        <span className={isWorkOrder ? 'font-medium' : ''}>Rs. {parseFloat(item.price).toFixed(2)}</span>
                      )}
                    </div>
                  </td>
                  {isWorkOrder ? (
                    <td className="border border-gray-300 p-3 text-center">
                      <span className="text-xs text-gray-600">Standard Quality</span>
                    </td>
                  ) : (
                    <td className="border border-gray-300 p-3 text-right font-medium">
                      {item.discounted_price && parseFloat(item.discounted_price) < parseFloat(item.price) ? (
                        <>
                          <div className="line-through text-gray-500 text-xs">
                            Rs. {(item.quantity * parseFloat(item.price)).toFixed(2)}
                          </div>
                          <div className="text-green-600">
                            Rs. {(item.quantity * parseFloat(item.discounted_price)).toFixed(2)}
                          </div>
                        </>
                      ) : (
                        <span>Rs. {(item.quantity * parseFloat(item.price)).toFixed(2)}</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary or Work Order Summary */}
        {isWorkOrder ? (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-1">Order Summary</h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="mb-2"><strong>Order ID:</strong> #{currentData?.id}</p>
                  <p className="mb-2"><strong>Total Items:</strong> {products?.reduce((sum, item) => sum + item.quantity, 0) || 0}</p>
                  <p className="mb-2"><strong>Order Date:</strong> {currentData?.created_at ? new Date(currentData.created_at).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div>
                  <p className="mb-2"><strong>Order Value:</strong> Rs. {finalTotal.toFixed(2)}</p>
                  <p className="mb-2"><strong>Delivery Date:</strong> {currentData?.estimated_delivery_date ? new Date(currentData.estimated_delivery_date).toLocaleDateString() : 'TBD'}</p>
                  <p className="mb-2"><strong>Payment Mode:</strong> {currentData?.payment_mode || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-end">
            <div className="w-64">
              <div className="border-t border-gray-300 pt-4">
                <div className="flex justify-between mb-2 text-sm">
                  <span>Subtotal (after discounts):</span>
                  <span>Rs. {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between mb-2 text-sm">
                  <span>Tax:</span>
                  <span>Rs. {taxPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between mb-2 text-sm">
                  <span>Handling Fee:</span>
                  <span>Rs. {handlingFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between mb-2 text-sm">
                  <span>Discount:</span>
                  <span>Rs. {discount.toFixed(2)}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between mb-2 text-sm text-green-700">
                    <span>Coupon ({couponCode}):</span>
                    <span>- Rs. {couponDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold border-t border-gray-300 pt-2">
                  <span>Total:</span>
                  <span>Rs. {finalTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-gray-300 text-center text-xs text-gray-500">
          {isWorkOrder ? (
            <>
              <p>This is a manufacturing work order. Please complete all items as specified.</p>
              <p className="mt-2">For queries contact: production@logosweets.com</p>
            </>
          ) : (
            <>
              <p>Thank you for your business!</p>
              <p className="mt-2">This is a computer generated invoice.</p>
            </>
          )}
        </div>
      </div>

      {/* Print Button - Hidden when printing */}
      <div className="no-print mt-6 text-center">
        <button
          onClick={() => window.print()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
        >
          {isWorkOrder ? 'Print Work Order' : 'Print Invoice'}
        </button>
        <button
          onClick={() => window.history.back()}
          className="ml-4 bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium"
        >
          Back
        </button>
      </div>
    </div>
  );
};

export default PrintInvoice;