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

const TermsAndCondition = () => {
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
          data.push({ name: t("about_us") });
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

          <section className="container mx-auto px-4 pt-8 items-center w-full mt-16">
              <div className="text-center mb-6">
                <h1 className="text-[2.1rem] sm:text-4xl text-[#1D2E43] font-[playfair] font-bold">
                    {t("terms_and_conditions")}
                </h1>
                <div className="text-xs sm:text-sm text-gray-600 mt-5">
                    <span
                    className="hover:cursor-pointer"
                    onClick={() => navigate("/")}
                    >
                    {t("home")}
                    </span>
                    <span className="mx-2">&gt;</span>
                    <span>{t("terms_and_conditions")}</span>
                </div>
              </div>
          </section>

          <section className='p-4 max-w-4xl mx-auto'>
            <p className='mt-4 text-[0.9rem] leading-7 font-[500] text-gray-700'>
              Welcome to Srirammart! By using our website and services, you agree to the following terms:
            </p>

            <div className='mt-8'>
              <h2 className='uppercase font-[600] text-[1.2rem] text-[#1D2E43] mb-3'>Eligibility</h2>
              <p className='text-[0.9rem] leading-7 font-[500] text-gray-700'>
                You must be 18 or older to place an order.
              </p>
            </div>

            <div className='mt-8'>
              <h2 className='uppercase font-[600] text-[1.2rem] text-[#1D2E43] mb-3'>Service Scope</h2>
              <p className='text-[0.9rem] leading-7 font-[500] text-gray-700'>
                Delivery is currently limited to specified areas in Ranchi.
              </p>
            </div>

            <div className='mt-8'>
              <h2 className='uppercase font-[600] text-[1.2rem] text-[#1D2E43] mb-3'>Product Availability</h2>
              <p className='text-[0.9rem] leading-7 font-[500] text-gray-700'>
                Items are subject to availability. Substitutions may occur with your consent.
              </p>
            </div>

            <div className='mt-8'>
              <h2 className='uppercase font-[600] text-[1.2rem] text-[#1D2E43] mb-3'>Payment</h2>
              <p className='text-[0.9rem] leading-7 font-[500] text-gray-700'>
                All orders must be paid in full at the time of purchase via online methods or Cash on Delivery.
              </p>
            </div>

            <div className='mt-8'>
              <h2 className='uppercase font-[600] text-[1.2rem] text-[#1D2E43] mb-3'>Conduct</h2>
              <p className='text-[0.9rem] leading-7 font-[500] text-gray-700'>
                Users must not misuse the platform (e.g., false orders, abuse, fraud).
              </p>
            </div>

            <div className='mt-8'>
              <h2 className='uppercase font-[600] text-[1.2rem] text-[#1D2E43] mb-3'>Modifications</h2>
              <p className='text-[0.9rem] leading-7 font-[500] text-gray-700'>
                We reserve the right to update these terms without prior notice.
              </p>
            </div>

            <div className='mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-[#1D2E43] rounded-lg'>
              <p className='text-[1rem] leading-7 font-[600] text-[#1D2E43] text-center'>
                Use of our service implies acceptance of these terms.
              </p>
            </div>

            <div className='mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg'>
              <p className='text-[0.9rem] leading-7 font-[500] text-gray-800'>
                <strong>Questions?</strong> Contact us at{' '}
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

export default TermsAndCondition;