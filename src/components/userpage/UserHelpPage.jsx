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

const Register = () => {
  const [loader, setLoader] = useState(false);
  const { t } = useTranslation("msg");
  const navigate = useNavigate();
  const [menuList, setMenuList] = useState([]);
  const [footerRangeList, setFooterRangeList] = useState([]);

  const handleSearch = (query) => {
  };

  const fetchMenuList = () => {
    setLoader(true);
    allApi(API_CONSTANTS.MENU_LIST_URL, "" , "get")
    .then((response) => {
      if (response.status === 200) {
          let data = response?.data.filter((item, index)=> index <= 6);
          setFooterRangeList(data);
          data.push({name: t("about_us")});
          setMenuList(data)
      } 
    })
    .catch((err) => {
      setLoader(false);
    }).finally(()=>{
      setLoader(false);
    });
  };

  useEffect(()=>{
    fetchMenuList();
  },[]);

  return (
    <>
      {loader ? <UserLoader/> : 
      <>
        <Header onSearch={handleSearch}/>
        <div className="mt-[8rem] flex flex-col items-center justify-center bg-white px-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl text-[#1D2E43] font-[playfair] font-bold">{t("help_desk")}</h1>
          <div className="text-sm text-gray-600 mt-2">
            <span className="hover:cursor-pointer" onClick={()=>{ navigate("/") }}>{t("home")}</span> <span className="mx-1 text-[11px]">&gt;</span> <span>{t("help_desk")}</span>
          </div>
        </div>

        <div className="w-full max-w-3xl mb-12">
            <div className="text-xl text-[#1D2E43] mb-6 font-[playfair] text-center font-semibold">
                If you have any questions or need assistance, please refer to the following resources:
            </div>
            
            <div className="space-y-6 bg-gray-50 p-8 rounded-lg border border-gray-200">
                {/* FAQs */}
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0">
                        <i className="ri-question-line text-xl text-gray-900"></i>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-[#1D2E43] mb-1">FAQs</h3>
                        <p className="text-gray-700">Check our frequently asked questions for quick answers.</p>
                    </div>
                </div>

                {/* Contact Us */}
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0">
                        <i className="ri-mail-line text-xl text-gray-900"></i>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-[#1D2E43] mb-1">Contact Us</h3>
                        <p className="text-gray-700">
                            Reach out to our support team via email at{' '}
                            <a href={`mailto:${SHOP_INFO.email}`} className="text-blue-600 underline hover:text-blue-700">
                                {SHOP_INFO.email}
                            </a>
                        </p>
                    </div>
                </div>

                {/* Live Chat */}
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0">
                        <i className="ri-chat-3-line text-xl text-gray-900"></i>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-[#1D2E43] mb-1">Live Chat</h3>
                        <p className="text-gray-700">Use the live chat feature on our website for immediate assistance.</p>
                    </div>
                </div>
            </div>

            <div className="text-center mt-8">
                <p className="text-lg text-[#1D2E43] font-semibold">We are here to help you!</p>
            </div>
        </div>
        </div>
        <Footer data={footerRangeList}/>
      </>
      }
    </>
  )
}

export default Register;