// utils
import { useState, useEffect } from 'react';
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

// Components
import UserLoader from '@userpage-pages/UserLoader';
import Header from '@common/Header';
import Footer from '@common/Footer';
import { allApi } from "@api/api";
import { API_CONSTANTS } from "@constants/apiurl";
import { useCompanyInfo } from '@hooks/useCompanyInfo';

const ReturnExchangePolicyPage = () => {
  const companyInfo = useCompanyInfo();
  const [loader, setLoader] = useState(false);
  const { t } = useTranslation("msg");
  const [menuList, setMenuList] = useState([]);
  const [footerRangeList, setFooterRangeList] = useState([]);
  const navigate = useNavigate();

  const handleSearch = (query) => {
  };

  const fetchMenuList = () => {
    setLoader(true);
    allApi(API_CONSTANTS.MENU_LIST_URL, "", "get")
      .then((response) => {
        if (response.status === 200) {
          let data = response?.data?.filter((item, index) => index <= 6);
          setFooterRangeList(data);
          data.push({ name: "About Us" });
          setMenuList(data);
        }
      })
      .catch(() => setLoader(false))
      .finally(() => setLoader(false));
  };

  useEffect(() => {
    fetchMenuList();
  }, []);

  return (
    <>
      {loader ? <UserLoader /> :
        <>
          <Header onSearch={handleSearch} />

          <section className="container mx-auto px-4 mt-16 pt-8 items-center w-full">
              <div className="text-center mb-6">
                <h1 className="text-[2.1rem] sm:text-4xl text-[#1D2E43] font-[playfair] font-bold">
                    {t("return_and_exchange_policy")}
                </h1>
                <div className="text-xs sm:text-sm text-gray-600 mt-5">
                    <span
                    className="hover:cursor-pointer"
                    onClick={() => navigate("/")}
                    >
                    {t("home")}
                    </span>
                    <span className="mx-2">&gt;</span>
                    <span>{t("return_and_exchange_policy")}</span>
                </div>
              </div>
          </section>

          <section className='p-4 max-w-4xl mx-auto'>
            <p className='mt-4 text-[0.9rem] leading-7 font-[500] text-gray-700'>
              We aim for 100% satisfaction with every order. However, if something doesn't go right, here's how we handle it:
            </p>

            <div className='mt-8'>
              <h2 className='uppercase font-[600] text-[1.2rem] text-[#1D2E43] mb-3'>Order Cancellation</h2>
              <p className='text-[0.9rem] leading-7 font-[500] text-gray-700'>
                Orders can be cancelled within 10 minutes of placement by contacting us directly. Once the order is dispatched, cancellation may not be possible.
              </p>
            </div>

            <div className='mt-8'>
              <h2 className='uppercase font-[600] text-[1.2rem] text-[#1D2E43] mb-3'>Refund Eligibility</h2>
              <ul className='list-disc list-inside text-[0.9rem] leading-7 font-[500] text-gray-700 space-y-2'>
                <li>Items that are damaged or expired at the time of delivery</li>
                <li>Incorrectly delivered items (wrong item or quantity)</li>
              </ul>
            </div>

            <div className='mt-8'>
              <h2 className='uppercase font-[600] text-[1.2rem] text-[#1D2E43] mb-3'>Refund Process</h2>
              <p className='text-[0.9rem] leading-7 font-[500] text-gray-700'>
                Contact us within 24 hours of delivery with a photo and order details. Approved refunds will be processed within 5–7 business days via your original payment method or store credit.
              </p>
              <p className='text-[0.9rem] leading-7 font-[500] text-gray-700 mt-4'>
                We reserve the right to refuse refunds in cases of abuse or repeated refund claims.
              </p>
            </div>

            <div className='mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg'>
              <p className='text-[0.9rem] leading-7 font-[500] text-gray-800'>
                <strong>Contact Us:</strong> For any questions or to initiate a return/refund, please email us at{' '}
                <a className='underline text-[#C7A756] hover:text-[#b4974c]' href={`mailto:${companyInfo.email}`}>
                  {companyInfo.email}
                </a>
              </p>
            </div>
          </section>

          <Footer data={footerRangeList}/>
        </>
      }
    </>
  );
};

export default ReturnExchangePolicyPage;