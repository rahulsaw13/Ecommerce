// PrintWorkOrder.js
import React from 'react';

const PrintWorkOrder = ({ data }) => {
  // Helper function to format address
  const formatAddress = (address) => {
    if (!address) return '';
    const { flat_no, landmark, city, state, zip_code, country } = address;
    return `${flat_no || ''}, ${landmark || ''}, ${city || ''}, ${state || ''} ${zip_code || ''}, ${country || ''}`;
  };

  // Calculate subtotal using discounted prices if available
  const subtotal = data?.products?.reduce((sum, item) => {
    const price = item.discounted_price ? parseFloat(item.discounted_price) : parseFloat(item.price);
    return sum + (item.quantity * price);
  }, 0) || 0;
  
  const taxPrice = data?.tax_price ? parseFloat(data.tax_price) : 0;
  const handlingFee = data?.handling_fee ? parseFloat(data.handling_fee) : 0;
  
  // Calculate total
  const finalTotal = subtotal + taxPrice + handlingFee;

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
          <h1 className="text-4xl font-bold text-gray-800 mb-2">WORK ORDER</h1>
          <div className="h-1 bg-blue-500 w-full"></div>
        </div>

        {/* Header Information */}
        <div className="grid grid-cols-2 gap-6 text-sm text-gray-700 mb-8">
          <div>
            <p className="mb-1"><strong>Work Order ID:</strong> WO-{data?.id}</p>
            <p className="mb-1"><strong>Order Date:</strong> {data?.created_at ? new Date(data.created_at).toLocaleDateString() : ''}</p>
            <p className="mb-1"><strong>Batch Number:</strong> {data?.batch_number || 'Not Assigned'}</p>
          </div>
          <div className="text-right">
            <p className="mb-1"><strong>Status:</strong> <span className="capitalize text-blue-600">{data?.order_status?.replace(/_/g, ' ')}</span></p>
            <p className="mb-1"><strong>Priority:</strong> <span className="text-orange-600">Standard</span></p>
            <p className="mb-1"><strong>Warehouse:</strong> {data?.warehouse?.name || 'Main Warehouse'}</p>
          </div>
        </div>

        {/* Customer Information */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-1">Customer Information</h2>
          <div className="grid grid-cols-2 gap-6 text-sm text-gray-700">
            <div>
              <p className="mb-1"><strong>Name:</strong> {data?.user?.name}</p>
              <p className="mb-1"><strong>Email:</strong> {data?.user?.email}</p>
              <p className="mb-1"><strong>Phone:</strong> {data?.user?.phone_number}</p>
            </div>
            <div>
              <p className="mb-1"><strong>Delivery Date:</strong> {data?.estimated_delivery_date ? new Date(data.estimated_delivery_date).toLocaleDateString() : 'TBD'}</p>
              <p className="mb-1"><strong>Payment Mode:</strong> {data?.payment_mode || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        <div className="mb-8">
          <h3 className="font-semibold text-gray-800 mb-2 border-b pb-1">Shipping Address</h3>
          <p className="text-sm text-gray-700 leading-relaxed">{formatAddress(data?.shipping_address)}</p>
        </div>

        {/* Manufacturing Items Table */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-1">Items to Manufacture</h2>
          <table className="w-full border-collapse border border-gray-300 text-sm">
            <thead>
              <tr className="bg-blue-50">
                <th className="border border-gray-300 p-3 text-left">#</th>
                <th className="border border-gray-300 p-3 text-left">Product Details</th>
                <th className="border border-gray-300 p-3 text-center">Quantity</th>
                <th className="border border-gray-300 p-3 text-center">Unit Price</th>
                <th className="border border-gray-300 p-3 text-center">Manufacturing Notes</th>
              </tr>
            </thead>
            <tbody>
              {data?.products?.map((item, index) => (
                <tr key={item.product_id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 p-3">{index + 1}</td>
                  <td className="border border-gray-300 p-3">
                    <div>
                      <p className="font-medium text-blue-800">{item.name}</p>
                      {item.description && (
                        <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                      )}
                      {item.weight && (
                        <p className="text-xs text-gray-600 bg-gray-100 inline-block px-2 py-1 rounded mt-1">
                          Weight: {item.weight}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="border border-gray-300 p-3 text-center">
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                      {item.quantity}
                    </span>
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
                        <span className="font-medium">Rs. {parseFloat(item.price).toFixed(2)}</span>
                      )}
                    </div>
                  </td>
                  <td className="border border-gray-300 p-3 text-center">
                    <span className="text-xs text-gray-600">Standard Quality</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Manufacturing Instructions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-1">Manufacturing Instructions</h2>
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Quality Standards:</h4>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>Follow standard manufacturing procedures</li>
                  <li>Quality check required before packaging</li>
                  <li>Ensure proper hygiene standards</li>
                  <li>Check expiry dates on raw materials</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Process Notes:</h4>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>Notify supervisor upon completion</li>
                  <li>Update order status after each stage</li>
                  <li>Package items according to shipping requirements</li>
                  <li>Label packages with order ID</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-1">Order Summary</h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="mb-2"><strong>Total Items:</strong> {data?.products?.reduce((sum, item) => sum + item.quantity, 0) || 0}</p>
                <p className="mb-2"><strong>Estimated Production Time:</strong> 2-3 hours</p>
              </div>
              <div>
                <p className="mb-2"><strong>Order Value:</strong> Rs. {finalTotal.toFixed(2)}</p>
                <p className="mb-2"><strong>Cartons Required:</strong> {data?.total_cartons || 1}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Supervisor Sign-off */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-1">Supervisor Sign-off</h2>
          <div className="grid grid-cols-3 gap-6 text-sm">
            <div className="border border-gray-300 p-4 text-center">
              <p className="font-semibold mb-2">Manufacturing Started</p>
              <div className="border-t border-gray-300 mt-8 pt-2">
                <p>Signature & Date</p>
              </div>
            </div>
            <div className="border border-gray-300 p-4 text-center">
              <p className="font-semibold mb-2">Quality Check</p>
              <div className="border-t border-gray-300 mt-8 pt-2">
                <p>Signature & Date</p>
              </div>
            </div>
            <div className="border border-gray-300 p-4 text-center">
              <p className="font-semibold mb-2">Packaging Complete</p>
              <div className="border-t border-gray-300 mt-8 pt-2">
                <p>Signature & Date</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-gray-300 text-center text-xs text-gray-500">
          <p>This is a manufacturing work order. Please complete all items as specified.</p>
          <p className="mt-2">For queries contact: production@logosweets.com</p>
        </div>
      </div>

      {/* Action Buttons - Hidden when printing */}
      <div className="no-print mt-6 text-center">
        <button
          onClick={() => window.print()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium mr-4"
        >
          Print Work Order
        </button>
        <button
          onClick={() => window.close()}
          className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default PrintWorkOrder;
