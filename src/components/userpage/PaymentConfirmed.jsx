// Utils
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { refactorPrefilledDate } from '@helper';
import { useEffect } from "react";

// Components
import { allApiWithHeaderToken } from "@api/api";
import { API_CONSTANTS } from "@constants/apiurl";
import useCartStore from "@store";

const OrderItem = ({ item }) => {
  const { t } = useTranslation("msg");

  return (
    <div className="flex items-start space-x-4 py-3">
      <div className="w-16 h-16 flex-shrink-0 overflow-hidden rounded border bg-gray-100">
        <img 
          src={item?.image} 
          alt={item?.name} 
          className="h-full w-full object-cover"
        />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-[0.8rem] font-medium text-gray-900 truncate">{item?.name}</h3>
        <p className="mt-1 text-[0.8rem] text-gray-500">{t("qty")}: {item?.quantity}</p>
      </div>
      <div className="text-[0.8rem] font-medium text-gray-900"> {item?.quantity} x {item?.discountedPrice}</div>
    </div>
  );
};

const PaymentConfirmed = () => {
  const navigate = useNavigate();
  const { t } = useTranslation("msg");
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const orderDetails = JSON.parse(localStorage.getItem('orderDetails')) || [];
  const userDetails = JSON.parse(localStorage.getItem("userDetails"));

  // Get clearCart method from cart store
  const { clearCart } = useCartStore();

  const continueShopping=()=>{
    navigate("/");
    localStorage.removeItem("orderDetails");
    clearCart(); // Use cart store method instead of manual removal
  }

  useEffect(()=>{
    let body = {
      order_id: orderDetails?.id
    }
    allApiWithHeaderToken(`${API_CONSTANTS.COMMON_ORDER_URL}/update_payment_status`, body , "post")
    .then((response) => {
    })
    .catch((err) => {
    }).finally(()=>{
    }); 
  },[]);

  // Deivery Date
  const today = new Date();
  const fiveDaysFromToday = new Date();
  fiveDaysFromToday.setDate(today.getDate() + 5);
  const eightDaysFromToday = new Date();
  eightDaysFromToday.setDate(today.getDate() + 8);
  const optionsDate = { month: 'long', day: 'numeric' };
  const formattedRange = `${fiveDaysFromToday.toLocaleDateString("en-US", optionsDate)}–${eightDaysFromToday.toLocaleDateString("en-US", optionsDate)}, ${today.getFullYear()}`;

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8 md:py-16">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Header */}
        <div className="bg-green-50 p-6 md:p-10 text-center border-b">
          <div className="inline-flex items-center justify-center mb-4">
            <i className="ri-checkbox-circle-line text-[2.5rem] text-green-500"></i>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
            {t("payment_successfull")}
          </h1>
          <p className="text-gray-600 mb-1 text-[0.8rem]">
            {t("thank_you_for_your_purchase_your_order_has_been_confirmed")}
          </p>
          <p className="text-gray-500 text-[0.7rem]">
            {t("order")} {orderDetails?.id} • {refactorPrefilledDate(orderDetails?.created_at)}
          </p>
        </div>

        {/* Body content */}
        <div className="p-6 md:p-10 space-y-8">
          {/* Order summary section */}
          <section>
            <h2 className="text-[1rem] font-semibold text-gray-800 mb-4">{t("order_summary")}</h2>
            <div className="space-y-4">
              {cart?.map((item) => (
                <OrderItem key={item?.id} item={item} />
              ))}
            </div>
            
            <div className="mt-6 space-y-2">
              <div className="flex justify-between text-[0.8rem]">
                <span className="text-gray-600">{t("subtotal")}</span>
                <span className="font-medium">₹ {orderDetails?.total_price}</span>
              </div>
              <div className="flex justify-between text-[0.8rem]">
                <span className="text-gray-600">{t("shipping")}</span>
                <span className="font-medium">₹ {orderDetails?.handling_fee}</span>
              </div>
              <div className="flex justify-between text-[0.8rem]">
                <span className="text-gray-600">{t("tax")}</span>
                <span className="font-medium">₹ {orderDetails?.tax_price}</span>
              </div>
              <hr className="my-2"/>
              <div className="flex justify-between font-semibold text-[1rem]">
                <span>{t("total")}</span>
                <span>₹ {Number(orderDetails?.total_price) + Number(orderDetails?.handling_fee) + Number(orderDetails?.tax_price)}</span>
              </div>
            </div>
          </section>

          {/* Payment and Shipping */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Payment information */}
            <section>
              <h2 className="font-semibold text-gray-800 mb-4 text-[1rem]">{t("payment_information")}</h2>
              <div className="p-4 bg-gray-50 rounded-md text-[0.8rem]">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">{t("method")}:</span>
                  <span className="font-medium">{orderDetails?.payment_mode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t("billing_name")}:</span>
                  <span className="font-medium">{userDetails?.name}</span>
                </div>
              </div>
            </section>

            {/* Shipping information */}
            <section>
              <h2 className="text-[1rem] font-semibold text-gray-800 mb-4">{t("shipping_information")}</h2>
              <div className="p-4 bg-gray-50 rounded-md text-[0.8rem]">
                <p className="font-medium">{userDetails?.name}</p>
                <p>{orderDetails?.shipping_address?.flat_no}</p>
                <p>
                  {orderDetails?.shipping_address?.city}, {orderDetails?.shipping_address?.state} {orderDetails?.shipping_address?.zip_code}
                </p>
                <p>{orderDetails?.shipping_address?.country}</p>
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <p className="text-gray-600">
                    <span className="font-medium">{t("estimated_delivery")}:</span> {formattedRange}
                  </p>
                  <p className="text-gray-600 text-sm mt-1">
                    <span className="font-medium">{t("shipping_information")}:</span> {orderDetails?.trackingNumber}
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* Receipt and support */}
          <section className="text-center bg-gray-50 p-6 rounded-md text-[0.8rem]">
            <p className="text-gray-600 mb-4">
              {t("we_sent_receipt_to")} <span className="font-medium">{userDetails?.email}</span>
            </p>
            <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-4 justify-center mt-2">
              <button>{t("track_order")}</button>
              <button onClick={continueShopping}>{t("continue_shopping")}</button>
            </div>
            <p className="text-gray-500 text-sm mt-6">
              {t("need_help_contact_our_support")} <a href="mailto:support@example.com" className="text-blue-600 hover:underline">support@example.com</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

export default PaymentConfirmed;