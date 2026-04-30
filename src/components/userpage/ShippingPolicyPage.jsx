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
import { SHOP_INFO } from '@config/srirammart.config';

const ShippingPolicyPage = () => {
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

          <section className="container mx-auto mt-16 px-4 pt-8 items-center w-full">
              <div className="text-center mb-6">
                <h1 className="text-[2.1rem] sm:text-4xl text-[#1D2E43] font-[playfair] font-bold">
                    {t("shipping_policy")}
                </h1>
                <div className="text-xs sm:text-sm text-gray-600 mt-5">
                    <span
                    className="hover:cursor-pointer"
                    onClick={() => navigate("/")}
                    >
                    {t("home")}
                    </span>
                    <span className="mx-2">&gt;</span>
                    <span>{t("shipping_policy")}</span>
                </div>
              </div>
          </section>

          <section className='p-4 max-w-4xl mx-auto'>
            <p className='mt-4 text-[0.9rem] leading-7 font-[500] text-gray-700'>
              At Srirammart, fast delivery is our promise!
            </p>

            <div className='mt-8'>
              <h2 className='uppercase font-[600] text-[1.2rem] text-[#1D2E43] mb-3'>Service Area</h2>
              <p className='text-[0.9rem] leading-7 font-[500] text-gray-700'>
                Currently available across Ranchi city and surrounding zones in East Ranchi.
              </p>
            </div>

            <div className='mt-8'>
              <h2 className='uppercase font-[600] text-[1.2rem] text-[#1D2E43] mb-3'>Delivery Time</h2>
              <p className='text-[0.9rem] leading-7 font-[500] text-gray-700'>
                Orders placed between 8 AM and 8 PM are typically delivered within 30 minutes to 1 hour.
              </p>
            </div>

            <div className='mt-8'>
              <h2 className='uppercase font-[600] text-[1.2rem] text-[#1D2E43] mb-3'>Delivery Charges</h2>
              <p className='text-[0.9rem] leading-7 font-[500] text-gray-700'>
                Free delivery for orders above ₹699. A minimal fee may apply for orders below this amount.
              </p>
            </div>

            <div className='mt-8'>
              <h2 className='uppercase font-[600] text-[1.2rem] text-[#1D2E43] mb-3'>Delivery Issues</h2>
              <p className='text-[0.9rem] leading-7 font-[500] text-gray-700'>
                If your order is delayed or incomplete, contact us immediately for support.
              </p>
            </div>

            <div className='mt-8 p-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-[#C7A756] rounded-lg'>
              <p className='text-[1rem] leading-7 font-[600] text-[#1D2E43] text-center'>
                Your groceries, your time—delivered right when you need them.
              </p>
            </div>

            <div className='mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg'>
              <p className='text-[0.9rem] leading-7 font-[500] text-gray-800'>
                <strong>Need Help?</strong> Contact us at{' '}
                <a className='underline text-[#C7A756] hover:text-[#b4974c]' href={`mailto:${SHOP_INFO.email}`}>
                  {SHOP_INFO.email}
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

export default ShippingPolicyPage;