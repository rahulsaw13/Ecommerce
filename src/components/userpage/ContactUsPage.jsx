// utils
import { useState, useEffect } from 'react';
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import * as yup from "yup";
import { useFormik } from "formik";

// Components
import UserLoader from '@userpage-pages/UserLoader';
import Header from '@common/Header';
import Footer from '@common/Footer';
import { allApi } from "@api/api";
import { API_CONSTANTS } from "@constants/apiurl";
import ContactFromBannerImage from "@assets/contact-from-banner.webp";
import Image from "@common/Image";
import InputTextComponent from "@common/InputTextComponent";
import InputTextAreaComponent from "@common/InputTextAreaComponent";
import { SHOP_INFO, SRIRAMMART_CONFIG } from '@config/srirammart.config';
import { ROUTES_CONSTANTS } from "@constants/routesurl";

const initialValues = {
  name: "",
  email: "",
  phoneNumber: "",
  message: "",
  rememberMe: ""
};

const ContactUsPage = () => {
  const navigate = useNavigate();
  const [loader, setLoader] = useState(false);
  const { t } = useTranslation("msg");
  const [data, setData] = useState(initialValues);
  const [menuList, setMenuList] = useState([]);
  const [footerRangeList, setFooterRangeList] = useState([]);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSearch = (query) => {
  };

  const validationSchema = yup.object().shape({
    name: yup.string().required(t("name_is_required")),
    email: yup.string().required(t("email_is_required")),
    phoneNumber: yup.string().required(t("phone_number_is_required")),
    message: yup.string().required(t("message_is_required"))
  });

  const fetchMenuList = () => {
    setLoader(true);
    allApi(API_CONSTANTS.MENU_LIST_URL, "", "get")
      .then((response) => {
        if (response.status === 200) {
          let data = response?.data.filter((item, index) => index <= 6);
          setFooterRangeList(data);
          data?.push({ name: "About Us" });
          setMenuList(data);
        }
      })
      .catch(() => setLoader(false))
      .finally(() => setLoader(false));
  };

  const onHandleSubmit = (value) => {
      let body = {
        name: value?.name,
        email: value?.email,
        phone_number: value?.phoneNumber,
        message: value?.message,
        remember_me: value?.rememberMe
      }
      setLoader(true);
      allApi(API_CONSTANTS.ADD_CONTACT_DETAILS, body, "post")
      .then((response) => {
        if(response?.status === 201){
          resetForm(); 
          setIsSubmitted(true);
        }
      })
      .catch((err) => {})
      .finally(() => {
        setLoader(false);
      });
  }

  const formik = useFormik({
    initialValues: data,
    onSubmit: onHandleSubmit,
    validationSchema: validationSchema,
    enableReinitialize: true,
    validateOnBlur: true,
  });

  const { values, errors, resetForm, handleSubmit, handleChange, touched } = formik;

  useEffect(() => {
    fetchMenuList();
  }, []);

  return (
    <>
      {loader ? <UserLoader /> :
        <>
          <Header onSearch={handleSearch} />

           {/* Excellence Section */}
           <section className="container mx-auto text-center py-10 px-4 mt-16">
            <h2 className="text-[#1D2E43] font-[playfair] text-[2rem] sm:text-[2.5rem] md:text-[3rem] font-bold">
              {t("contact_us") || "Contact Us"}
            </h2>
            <p className="mt-4 text-[0.9rem] leading-7 font-[500] text-gray-700 max-w-2xl mx-auto">
              Have a question, feedback, or need assistance? We're here to help!
            </p>
          </section>

          <section className="max-w-6xl mx-auto px-4 py-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column - Contact Information */}
              <div className="space-y-6">
                <div className="bg-white rounded-lg border p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#FFC107] to-[#FFD54F] rounded-lg flex items-center justify-center flex-shrink-0">
                      <i className="ri-phone-line text-2xl text-gray-900"></i>
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#1D2E43] text-lg mb-2">Phone</h3>
                      <a href={`tel:${SHOP_INFO.phoneNumber}`} className="text-gray-700 hover:text-[#C7A756] transition-colors">
                        {SHOP_INFO.phoneNumber}
                      </a>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg border p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#FFC107] to-[#FFD54F] rounded-lg flex items-center justify-center flex-shrink-0">
                      <i className="ri-mail-line text-2xl text-gray-900"></i>
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#1D2E43] text-lg mb-2">Email</h3>
                      <a href={`mailto:${SHOP_INFO.email}`} className="text-gray-700 hover:text-[#C7A756] transition-colors break-all">
                        {SHOP_INFO.email}
                      </a>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg border p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#FFC107] to-[#FFD54F] rounded-lg flex items-center justify-center flex-shrink-0">
                      <i className="ri-map-pin-line text-2xl text-gray-900"></i>
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#1D2E43] text-lg mb-2">Address</h3>
                      <p className="text-gray-700">
                        {SHOP_INFO.address}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-l-4 border-blue-500 p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                      <i className="ri-time-line text-2xl text-blue-600"></i>
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#1D2E43] text-lg mb-2">Business Hours</h3>
                      <p className="text-gray-700">
                        {SHOP_INFO.timing.days}<br />
                        {SHOP_INFO.timing.time}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg border p-6">
                  <h3 className="font-semibold text-[#1D2E43] text-lg mb-4">Follow Us</h3>
                  <div className="flex gap-3">
                    {SHOP_INFO.social.map((item, index) => (
                      <a
                        key={index}
                        href={item?.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 bg-gradient-to-br from-[#FFC107] to-[#FFD54F] rounded-lg flex items-center justify-center hover:shadow-lg transition-all"
                      >
                        <i className={`${item?.icon} text-xl text-gray-900`}></i>
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column - Contact Form */}
              <div className="bg-white rounded-lg border p-6 md:p-8">
                <h2 className="text-2xl font-semibold font-[playfair] text-[#1D2E43] mb-6">
                  {t("send_us_a_message") || "Send Us a Message"}
                </h2>
                <div className="space-y-4">
                  <InputTextComponent
                    value={values?.name}
                    onChange={handleChange}
                    type="text"
                    placeholder={t("name") || "Your Name"}
                    name="name"
                    error={errors?.name}
                    touched={touched?.name}
                    className="text-[0.9rem] w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#C7A756] focus:border-transparent"
                  />
                  <InputTextComponent
                    value={values?.email}
                    onChange={handleChange}
                    type="email"
                    placeholder={t("email") || "Your Email"}
                    name="email"
                    error={errors?.email}
                    touched={touched?.email}
                    className="text-[0.9rem] w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#C7A756] focus:border-transparent"
                  />
                  <InputTextComponent
                    value={values?.phoneNumber}
                    onChange={handleChange}
                    type="tel"
                    placeholder={t("phone_number") || "Your Phone Number"}
                    name="phoneNumber"
                    error={errors?.phoneNumber}
                    touched={touched?.phoneNumber}
                    className="text-[0.9rem] w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#C7A756] focus:border-transparent"
                  />
                  <InputTextAreaComponent
                    value={values?.message}
                    onChange={handleChange}
                    type="text"
                    rows={4}
                    placeholder={t("message") || "Your Message"}
                    name="message"
                    error={errors?.message}
                    touched={touched?.message}
                    className="text-[0.9rem] w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#C7A756] focus:border-transparent resize-none"
                  />

                  <div className="flex items-start gap-2">
                    <input 
                      type="checkbox" 
                      className="mt-1 w-4 h-4 text-[#C7A756] border-gray-300 rounded focus:ring-[#C7A756]" 
                      value={values?.rememberMe}
                      onChange={handleChange}
                      name="rememberMe"
                    />
                    <label className="text-[0.85rem] text-gray-600">
                      {t("save_my_details") || "Save my details for future inquiries"}
                    </label>
                  </div>

                  {isSubmitted && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-[0.85rem] text-green-700 flex items-center gap-2">
                        <i className="ri-checkbox-circle-line text-lg"></i>
                        {t("contact_details_shared_successfully") || "Thank you! We'll get back to you soon."}
                      </p>
                    </div>
                  )}

                  <button
                    type="submit"
                    onClick={() => handleSubmit()}
                    className="w-full bg-[#C7A756] hover:bg-[#b4974c] text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <i className="ri-send-plane-line"></i>
                    {t("submit_now") || "Send Message"}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-8 p-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-[#C7A756] rounded-lg text-center">
              <p className="text-[1rem] leading-7 font-[600] text-[#1D2E43]">
                Let's connect
              </p>
            </div>
          </section>

          <Footer data={footerRangeList}/>
        </>
      }
    </>
  );
};

export default ContactUsPage;