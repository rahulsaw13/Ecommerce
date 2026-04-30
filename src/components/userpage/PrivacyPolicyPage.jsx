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

const PrivacyPolicyPage = () => {
  const [loader, setLoader] = useState(false);
  const { t } = useTranslation("msg");
  const [footerRangeList, setFooterRangeList] = useState([]);
  const [menuList, setMenuList] = useState([]);
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
                    {t("privacy_policy")}
                </h1>
                <div className="text-xs sm:text-sm text-gray-600 mt-5">
                    <span
                    className="hover:cursor-pointer"
                    onClick={() => navigate("/")}
                    >
                    {t("home")}
                    </span>
                    <span className="mx-2">&gt;</span>
                    <span>{t("privacy_policy")}</span>
                </div>
              </div>
          </section>

          <section className='p-4 max-w-4xl mx-auto'>
            <p className='mt-4 text-[0.9rem] leading-7 font-[500] text-gray-700'>
              Your privacy matters to us. At Srirammart, we are committed to protecting your personal information.
            </p>

            <div className='mt-8'>
              <h2 className='uppercase font-[600] text-[1.2rem] text-[#1D2E43] mb-3'>Information We Collect</h2>
              <ul className='list-disc list-inside text-[0.9rem] leading-7 font-[500] text-gray-700 space-y-2'>
                <li>Name, phone number, address, email (for order delivery and support)</li>
                <li>Order history and feedback to improve service</li>
              </ul>
            </div>

            <div className='mt-8'>
              <h2 className='uppercase font-[600] text-[1.2rem] text-[#1D2E43] mb-3'>How We Use It</h2>
              <ul className='list-disc list-inside text-[0.9rem] leading-7 font-[500] text-gray-700 space-y-2'>
                <li>To fulfill and manage orders</li>
                <li>To improve our platform and personalize your experience</li>
                <li>To send important updates and offers (you can opt out anytime)</li>
              </ul>
            </div>

            <div className='mt-8 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg'>
              <p className='text-[0.9rem] leading-7 font-[500] text-gray-800'>
                <strong className='text-blue-900'>Data Protection:</strong> We do not sell, rent, or share your data with third parties without your consent, except where required by law.
              </p>
            </div>

            <div className='mt-8 p-6 bg-gradient-to-r from-green-50 to-teal-50 border-l-4 border-green-500 rounded-lg'>
              <p className='text-[1rem] leading-7 font-[600] text-[#1D2E43] text-center'>
                Your trust is important. We protect your data with industry-standard security measures.
              </p>
            </div>

            <div className='mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg'>
              <p className='text-[0.9rem] leading-7 font-[500] text-gray-800'>
                <strong>Privacy Concerns?</strong> Contact us at{' '}
                <a className='underline text-[#C7A756] hover:text-[#b4974c]' href='mailto:support@srirammart.com'>
                  support@srirammart.com
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

export default PrivacyPolicyPage;