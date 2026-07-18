// Utils
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from 'react-redux';
import { ROUTES_CONSTANTS } from "@constants/routesurl";

const Footer = ({ data }) => {
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const companyInfo = useSelector((state) => state.company?.info) || {};

  // Get user details from localStorage
  const getUserDetails = () => {
    try {
      const raw = localStorage.getItem("userDetails");
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  };

  const handleAccountClick = () => {
    const userDetails = getUserDetails();
    if (userDetails) {
      // User is logged in, navigate to edit profile
      navigate('/edit-profile');
    } else {
      // User is not logged in, show login modal
      setShowLoginModal(true);
    }
  };

  const handleLoginNow = () => {
    setShowLoginModal(false);
    navigate('/sign-in');
  };

  const handleCancel = () => {
    setShowLoginModal(false);
  };

    return (
        <>
        {/* Desktop Footer */}
        <footer className="w-full bg-yellow-400 py-12 hidden md:block">
            <div className="max-w-7xl mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    
                    {/* Left Section - Logo and Description */}
                    <div className="text-gray-900">
                        <div className="flex items-center gap-1 mb-4">
                            <span className="text-3xl font-bold text-gray-900">{(companyInfo.name || 'Dukaansarthi').replace('Mart', '').replace('mart', '')}</span>
                            <span className="text-3xl font-bold text-green-600">{(companyInfo.name || '').includes('art') ? 'mart' : ''}</span>
                        </div>
                        <p className="text-sm leading-relaxed mb-2">
                            Your trusted source for quality products delivered fresh to your doorstep.
                        </p>
                    </div>

                    {/* Middle Section - Quick Links */}
                    <div className="text-gray-900">
                        <h3 className="text-lg font-bold mb-4">Quick Links</h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <span 
                                    onClick={() => navigate('/')} 
                                    className="hover:text-gray-700 cursor-pointer"
                                >
                                    Home
                                </span>
                            </li>
                            <li>
                                <span 
                                    onClick={() => navigate(ROUTES_CONSTANTS?.ABOUT_US)} 
                                    className="hover:text-gray-700 cursor-pointer"
                                >
                                    About Us
                                </span>
                            </li>
                            <li>
                                <span 
                                    onClick={() => navigate(ROUTES_CONSTANTS?.CONTACT_US)} 
                                    className="hover:text-gray-700 cursor-pointer"
                                >
                                    Contact Us
                                </span>
                            </li>
                            <li>
                                <span 
                                    onClick={() => navigate(ROUTES_CONSTANTS?.RETURN_AND_EXCHANGE_POLICY)} 
                                    className="hover:text-gray-700 cursor-pointer"
                                >
                                    Refund & Cancellation Policy
                                </span>
                            </li>
                            <li>
                                <span 
                                    onClick={() => navigate(ROUTES_CONSTANTS?.SHIPPING_POLICY)} 
                                    className="hover:text-gray-700 cursor-pointer"
                                >
                                    Shipping and Delivery Policy
                                </span>
                            </li>
                            <li>
                                <span 
                                    onClick={() => navigate(ROUTES_CONSTANTS?.PRIVACY_POLICY)} 
                                    className="hover:text-gray-700 cursor-pointer"
                                >
                                    Privacy Policy
                                </span>
                            </li>
                            <li>
                                <span 
                                    onClick={() => navigate(ROUTES_CONSTANTS?.TERMS_AND_CONDITION)} 
                                    className="hover:text-gray-700 cursor-pointer"
                                >
                                    Terms and Conditions
                                </span>
                            </li>
                        </ul>
                    </div>

                    {/* Right Section - Get Connected and Map */}
                    <div className="text-gray-900">
                        <h3 className="text-lg font-bold mb-4">Get connected</h3>
                        <p className="text-sm mb-4">
                            Join the conversation on social media and stay updated with our latest products and services.
                        </p>
                        
                        {/* Social Media Icons */}
                        <div className="flex gap-3 mb-6">
                            <a
                                href={"#"}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-8 h-8 rounded-full bg-gray-900 text-white flex justify-center items-center hover:bg-gray-700 transition-colors"
                            >
                                <i className="ri-facebook-fill text-sm"></i>
                            </a>
                            <a
                                href={"#"}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-8 h-8 rounded-full bg-gray-900 text-white flex justify-center items-center hover:bg-gray-700 transition-colors"
                            >
                                <i className="ri-instagram-line text-sm"></i>
                            </a>
                            <a
                                href={"#"}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-8 h-8 rounded-full bg-gray-900 text-white flex justify-center items-center hover:bg-gray-700 transition-colors"
                            >
                                <i className="ri-twitter-fill text-sm"></i>
                            </a>
                            <a
                                href={"#"}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-8 h-8 rounded-full bg-gray-900 text-white flex justify-center items-center hover:bg-gray-700 transition-colors"
                            >
                                <i className="ri-youtube-fill text-sm"></i>
                            </a>
                        </div>

                        {/* Map */}
                        <div className="rounded-lg overflow-hidden">
                            <iframe
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d235013.74842653308!2d72.41493075!3d23.020474!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x395e848aba5bd449%3A0x4fcedd11614f6516!2sAhmedabad%2C%20Gujarat!5e0!3m2!1sen!2sin!4v1705234567890!5m2!1sen!2sin"
                                width="100%"
                                height="150"
                                style={{ border: 0, display: 'block' }}
                                allowFullScreen=""
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                title="Ahmedabad Location"
                            ></iframe>
                        </div>
                    </div>

                </div>
            </div>
        </footer>

        {/* Mobile Sticky Bottom Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
            <div className="flex items-center justify-around py-3">
                {/* Home */}
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center justify-center p-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                    <i className="ri-home-line text-[26px]"></i>
                </button>

                {/* Categories */}
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center justify-center p-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                    <i className="ri-apps-fill text-[26px]"></i>
                </button>

                {/* Brands of the Day - Center with special styling */}
                <button
                    onClick={() => navigate('/brands')}
                    className="flex"
                >
                    <div className="w-14 h-14 p-[8px] rounded-full flex items-center justify-center shadow-lg border-2 border-yellow-500">
                        <div className="text-center leading-tight">
                            <div className="text-[8px] font-bold text-gray-800">BRANDS</div>
                            <div className="text-[8px] font-bold text-gray-800">OF THE</div>
                            <div className="text-[12px] font-bold text-yellow-600">DAY</div>
                        </div>
                    </div>
                </button>

                {/* Cart/Orders */}
                <button
                    onClick={() => navigate('/view-cart')}
                    className="flex items-center justify-center p-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                    <i className="ri-shopping-bag-2-line text-[26px]"></i>
                </button>

                {/* Account */}
                <button
                    onClick={handleAccountClick}
                    className="flex items-center justify-center p-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                    <i className="ri-user-line text-[26px]"></i>
                </button>
            </div>
        </nav>

        {/* Login Modal - Slides from Bottom */}
        {showLoginModal && (
            <>
                {/* Backdrop */}
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 z-[60] md:hidden"
                    onClick={handleCancel}
                ></div>
                
                {/* Modal Content */}
                <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-[70] md:hidden animate-slide-up">
                    <div className="p-6">
                        {/* Alert Icon */}
                        <div className="flex justify-center mb-4">
                            <div className="w-16 h-16 bg-red-500 rounded-xl flex items-center justify-center transform rotate-45">
                                <i className="ri-alert-line text-3xl text-white transform -rotate-45"></i>
                            </div>
                        </div>

                        {/* Title */}
                        <h2 className="text-xl font-bold text-gray-900 mb-2 text-center">
                            Please Login First
                        </h2>

                        {/* Description */}
                        <p className="text-sm text-gray-600 mb-6 text-center">
                            To add items to your cart, you need to be logged in.
                        </p>

                        {/* Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={handleLoginNow}
                                className="flex-1 bg-yellow-400 text-gray-900 py-3 rounded-lg font-semibold text-base hover:bg-yellow-500 transition-colors"
                            >
                                Login Now
                            </button>
                            <button
                                onClick={handleCancel}
                                className="flex-1 bg-yellow-400 text-gray-900 py-3 rounded-lg font-semibold text-base hover:bg-yellow-500 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>

                {/* Animation Styles */}
                <style jsx>{`
                    @keyframes slide-up {
                        from {
                            transform: translateY(100%);
                        }
                        to {
                            transform: translateY(0);
                        }
                    }
                    .animate-slide-up {
                        animation: slide-up 0.3s ease-out;
                    }
                `}</style>
            </>
        )}
        </>
    );
};

export default Footer;