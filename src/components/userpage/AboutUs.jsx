// utils
import { useState, useEffect } from 'react';

// Components
import UserLoader from '@userpage-pages/UserLoader';
import Header from '@common/Header';
import Footer from '@common/Footer';
import { allApi } from "@api/api";
import { API_CONSTANTS } from "@constants/apiurl";
import AboutUsFrontImage from "@assets/about-us.webp";
import AboutUsBannerImage from "@assets/about-us-banner.webp";
import AboutUs1Image from "@assets/about-us1.webp";
import AboutUs2Image from "@assets/about-us2.webp";
import AboutUs3Image from "@assets/about-us3.webp";
import AboutUs1Svg from "@assets/about-us1.svg";
import AboutUs2Svg from "@assets/about-us2.svg";
import AboutUs3Svg from "@assets/about-us3.svg";
import AboutUs4Svg from "@assets/about-us4.svg";
import Image from "@common/Image";

const AboutUs = () => {
  const [loader, setLoader] = useState(false);
  const [menuList, setMenuList] = useState([]);
  const [footerRangeList, setFooterRangeList] = useState([]);

  const handleSearch = (query) => {
  };

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

  useEffect(() => {
    fetchMenuList();
  }, []);

  return (
    <>
      {loader ? <UserLoader /> :
        <>
          <Header onSearch={handleSearch} />

          {/* Hero Section */}
          <div className="container mx-auto mt-16 px-4 py-12 text-center">
            <h1 className="text-[#1D2E43] font-[playfair] text-[2.5rem] sm:text-[3rem] md:text-[3.5rem] font-bold">
              About Us
            </h1>
            <p className="mt-6 text-[1.1rem] leading-8 font-[500] text-gray-700 max-w-4xl mx-auto">
              Welcome to our grocery app! We are dedicated to providing you with the freshest produce and the best grocery items at your convenience. Our mission is to make grocery shopping easy and accessible for everyone.
            </p>
          </div>

          {/* Mission Section */}
          <section className="bg-gradient-to-r from-yellow-50 to-orange-50 py-12">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <div className="grid md:grid-cols-3 gap-8 text-center">
                  <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-xl transition-shadow">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#FFC107] to-[#FFD54F] rounded-full flex items-center justify-center mx-auto mb-4">
                      <i className="ri-leaf-line text-3xl text-gray-900"></i>
                    </div>
                    <h3 className="text-xl font-semibold text-[#1D2E43] mb-2">Fresh Produce</h3>
                    <p className="text-gray-600 text-sm">
                      We source the freshest fruits, vegetables, and groceries daily
                    </p>
                  </div>

                  <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-xl transition-shadow">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#FFC107] to-[#FFD54F] rounded-full flex items-center justify-center mx-auto mb-4">
                      <i className="ri-price-tag-3-line text-3xl text-gray-900"></i>
                    </div>
                    <h3 className="text-xl font-semibold text-[#1D2E43] mb-2">Competitive Prices</h3>
                    <p className="text-gray-600 text-sm">
                      Best prices in town without compromising on quality
                    </p>
                  </div>

                  <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-xl transition-shadow">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#FFC107] to-[#FFD54F] rounded-full flex items-center justify-center mx-auto mb-4">
                      <i className="ri-shield-check-line text-3xl text-gray-900"></i>
                    </div>
                    <h3 className="text-xl font-semibold text-[#1D2E43] mb-2">Quality Commitment</h3>
                    <p className="text-gray-600 text-sm">
                      Every product is carefully selected and quality-checked
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Our Story Section */}
          <section className="container mx-auto px-4 py-12">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-[#1D2E43] font-[playfair] text-[2rem] sm:text-[2.5rem] font-bold text-center mb-8">
                Our Story
              </h2>
              <div className="bg-white rounded-lg border p-8 shadow-sm">
                <p className="text-[1rem] leading-8 text-gray-700 mb-6">
                  With a wide range of products, competitive prices, and a commitment to quality, we strive to be your go-to source for all your grocery needs.
                </p>
                <p className="text-[1rem] leading-8 text-gray-700">
                  We understand that your time is valuable, which is why we've made it our mission to bring the grocery store to your doorstep. From fresh vegetables to daily essentials, we've got everything you need in one convenient app.
                </p>
              </div>
            </div>
          </section>

          {/* Why Choose Us Section */}
          <section className="bg-gray-50 py-12">
            <div className="container mx-auto px-4">
              <h2 className="text-[#1D2E43] font-[playfair] text-[2rem] sm:text-[2.5rem] font-bold text-center mb-8">
                Why Choose Us
              </h2>
              <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg p-6 border-l-4 border-[#C7A756]">
                  <div className="flex items-start gap-4">
                    <i className="ri-time-line text-3xl text-[#C7A756] flex-shrink-0"></i>
                    <div>
                      <h3 className="text-lg font-semibold text-[#1D2E43] mb-2">Fast Delivery</h3>
                      <p className="text-gray-600 text-sm">
                        Get your groceries delivered within 30 minutes to 1 hour
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-6 border-l-4 border-[#C7A756]">
                  <div className="flex items-start gap-4">
                    <i className="ri-shopping-basket-line text-3xl text-[#C7A756] flex-shrink-0"></i>
                    <div>
                      <h3 className="text-lg font-semibold text-[#1D2E43] mb-2">Wide Selection</h3>
                      <p className="text-gray-600 text-sm">
                        Thousands of products across all categories
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-6 border-l-4 border-[#C7A756]">
                  <div className="flex items-start gap-4">
                    <i className="ri-customer-service-line text-3xl text-[#C7A756] flex-shrink-0"></i>
                    <div>
                      <h3 className="text-lg font-semibold text-[#1D2E43] mb-2">24/7 Support</h3>
                      <p className="text-gray-600 text-sm">
                        Our customer service team is always here to help
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-6 border-l-4 border-[#C7A756]">
                  <div className="flex items-start gap-4">
                    <i className="ri-secure-payment-line text-3xl text-[#C7A756] flex-shrink-0"></i>
                    <div>
                      <h3 className="text-lg font-semibold text-[#1D2E43] mb-2">Secure Payments</h3>
                      <p className="text-gray-600 text-sm">
                        Multiple payment options with secure transactions
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Thank You Section */}
          <section className="container mx-auto px-4 py-12">
            <div className="max-w-4xl mx-auto text-center">
              <div className="bg-gradient-to-r from-green-50 to-teal-50 border-l-4 border-green-500 rounded-lg p-8">
                <h2 className="text-[2rem] font-[playfair] font-bold text-[#1D2E43] mb-4">
                  Thank You for Choosing Us
                </h2>
                <p className="text-[1.1rem] leading-8 text-gray-700">
                  We're committed to making your grocery shopping experience seamless, convenient, and enjoyable. Your trust and satisfaction are our top priorities.
                </p>
              </div>
            </div>
          </section>

          <Footer data={footerRangeList}/>
        </>
      }
    </>
  );
};

export default AboutUs;