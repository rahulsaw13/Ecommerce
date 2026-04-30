// Utils
import { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { useTranslation } from "react-i18next";

const errorDetails = {
  errorCode: "PAYMENT-4012",
  errorMessage: "Payment processing failed. Your card was declined.",
  orderReference: "#REF-38291",
  timestamp: "April 5, 2025 • 14:32 PM",
  attemptedAmount: "$124.95",
  paymentMethod: "Visa ending in 4242",
};

const PaymentRejected = () => {
  const { t } = useTranslation("msg");
  const navigate = useNavigate();

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8 md:py-16">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Header */}
        <div className="bg-red-50 p-6 md:p-10 text-center border-b">
          <div className="inline-flex items-center justify-center mb-4">          
            <i className="ri-alert-line text-[2.5rem] text-red-500"></i>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
            {t("payment_unsuccessful")}
          </h1>
          <p className="text-gray-600 mb-1 text-[0.8rem]">
            {t("we_were_unable_to_process_your_payment")}
          </p>
          <p className="text-gray-500 text-[0.7rem]">
            {t("reference")} {errorDetails.orderReference} • {errorDetails.timestamp}
          </p>
        </div>

        {/* Body content */}
        <div className="p-6 md:p-10 space-y-8">
          {/* Error summary */}
          <div variant="destructive" className="mb-6">
            <h3 className="text-base font-semibold">{t("transaction_failed")}</h3>
            <p className="text-[0.9rem]">
              {errorDetails.errorMessage} {t("please_check_payment_details_desc")} 
            </p>
          </div>

          {/* Payment details section */}
          <section>
            <h2 className="text-[1rem] font-semibold text-gray-800 mb-4">{t("payment_information")}</h2>
            <div className="p-4 bg-gray-50 rounded-md space-y-2">
              <div className="flex justify-between text-[0.8rem]">
                <span className="text-gray-600">{t("attempted_amount")}:</span>
                <span className="font-medium">{errorDetails.attemptedAmount}</span>
              </div>
              <div className="flex justify-between text-[0.8rem]">
                <span className="text-gray-600">{t("payment_method")}:</span>
                <span className="font-medium">{errorDetails.paymentMethod}</span>
              </div>
              <div className="flex justify-between text-[0.8rem]">
                <span className="text-gray-600">{t("error_code")}:</span>
                <span className="font-medium text-red-600">{errorDetails.errorCode}</span>
              </div>
            </div>
          </section>

          {/* Common reasons for rejection */}
          <section>
            <h2 className="text-[1rem] font-semibold text-gray-800 mb-4">
               {t("common_reasons_for_payment_failure")}
            </h2>
            <ul className="list-disc pl-5 space-y-2 text-gray-700 text-[0.8rem]">
              <li>{t("insufficient_funds_in_your_account")}</li>
              <li>{t("card_has_expired")}</li>
              <li>{t("security_code_entered_incorrectly")}</li>
              <li>{t("billing_address_doesnt_match")}</li>
              <li>{t("your_card_issuer_has_declined_transaction")}</li>
            </ul>
          </section>

          {/* Actions */}
          <section className="text-center bg-gray-50 p-6 rounded-md">
            <p className="text-gray-600 mb-6 text-[0.8rem]">
              {t("please_try_again_or_choose_different_payment_method")}
            </p>
            <div className="text-[0.8rem] flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-4 justify-center">
              <button className="btn-primary">{t("try_again")}</button>
              <button className="btn-primary">{t("use_different_payment_method")}</button>
              <button className="btn-primary">{t("need_help")}</button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PaymentRejected;