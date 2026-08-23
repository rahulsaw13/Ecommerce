// // Utils
// import { useState, useEffect, useRef } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { TieredMenu } from 'primereact/tieredmenu';
// import { Avatar } from "primereact/avatar";
// import { useTranslation } from "react-i18next";
// import useBackendCartStore from '../../useBackendCartStore';
// import { SRIRAMMART_CONFIG, getDeliveryTimeMessage } from '@config/srirammart.config';
// import { getLocationFromCookie } from '@services/locationService';
// import { allApiWithHeaderToken } from "@api/api";
// import { API_CONSTANTS } from "@constants/apiurl";

// const Header = ({ onSearch }) => {
//   const [searchQuery, setSearchQuery] = useState('');
//   const [placeholder, setPlaceholder] = useState('');
//   const [isListening, setIsListening] = useState(false);
//   const [cartCount, setCartCount] = useState(0);
//   const [isScrolled, setIsScrolled] = useState(false);
//   const navigate = useNavigate();
//   const { cart } = useBackendCartStore();
//   const { t } = useTranslation("msg");
//   const menu = useRef(null);
//   const searchTimeoutRef = useRef(null);
  
//   // Safe localStorage parsing
//   let userDetails = null;
//   try {
//     const raw = localStorage.getItem("userDetails");
//     userDetails = raw ? JSON.parse(raw) : null;
//   } catch (e) {
//     userDetails = null;
//   }
  
//   const userLocation = getLocationFromCookie();

//   // Scroll effect for mobile header
//   useEffect(() => {
//     const handleScroll = () => {
//       if (window.innerWidth < 768) { // Only on mobile
//         setIsScrolled(window.scrollY > 50);
//       }
//     };

//     window.addEventListener('scroll', handleScroll);
//     window.addEventListener('resize', handleScroll);
    
//     return () => {
//       window.removeEventListener('scroll', handleScroll);
//       window.removeEventListener('resize', handleScroll);
//     };
//   }, []);

//   // Update cart count from store's cart array
//   useEffect(() => {
//     setCartCount(cart.length);
//   }, [cart]);

//   // Listen for cart updates and extract count from event data
//   useEffect(() => {
//     const handleCartUpdate = (event) => {
//       if (event.detail) {
//         // Get count from event data instead of making API call
//         setCartCount(event.detail.length);
//       }
//     };

//     window.addEventListener('cartUpdated', handleCartUpdate);

//     return () => {
//       window.removeEventListener('cartUpdated', handleCartUpdate);
//     };
//   }, [userDetails]);

//   // Animated placeholder
//   const products = ['Milk', 'Bread', 'Eggs', 'Rice', 'Vegetables', 'Fruits', 'Snacks', 'Beverages'];
  
//   useEffect(() => {
//     let currentProductIndex = 0;
//     let currentCharIndex = 0;
//     let isDeleting = false;
//     let timeout;

//     const animatePlaceholder = () => {
//       const currentProduct = products[currentProductIndex];
      
//       if (!isDeleting) {
//         // Typing
//         if (currentCharIndex < currentProduct.length) {
//           setPlaceholder('Search ' + currentProduct.substring(0, currentCharIndex + 1));
//           currentCharIndex++;
//           timeout = setTimeout(animatePlaceholder, 150);
//         } else {
//           // Wait before deleting
//           timeout = setTimeout(() => {
//             isDeleting = true;
//             animatePlaceholder();
//           }, 2000);
//         }
//       } else {
//         // Deleting
//         if (currentCharIndex > 0) {
//           setPlaceholder('Search ' + currentProduct.substring(0, currentCharIndex - 1));
//           currentCharIndex--;
//           timeout = setTimeout(animatePlaceholder, 100);
//         } else {
//           // Move to next product
//           isDeleting = false;
//           currentProductIndex = (currentProductIndex + 1) % products.length;
//           timeout = setTimeout(animatePlaceholder, 500);
//         }
//       }
//     };

//     animatePlaceholder();

//     return () => clearTimeout(timeout);
//   }, []);

//   // ESC key listener for voice search modal
//   useEffect(() => {
//     const handleEscKey = (event) => {
//       if (event.key === 'Escape' && isListening) {
//         setIsListening(false);
//         // Stop speech recognition if active
//         if (window.recognition) {
//           window.recognition.stop();
//         }
//       }
//     };

//     // Add event listener
//     document.addEventListener('keydown', handleEscKey);

//     // Cleanup
//     return () => {
//       document.removeEventListener('keydown', handleEscKey);
//     };
//   }, [isListening]);

//   // Debounced search - navigate after user stops typing
//   useEffect(() => {
//     // Clear existing timeout
//     if (searchTimeoutRef.current) {
//       clearTimeout(searchTimeoutRef.current);
//     }

//     // Only search if there's a query with at least 2 characters
//     if (searchQuery.trim().length >= 2) {
//       // Set new timeout for 500ms debounce
//       searchTimeoutRef.current = setTimeout(() => {
//         try {
//           navigate(`/category?search=${encodeURIComponent(searchQuery.trim())}`);
//         } catch (error) {
//           console.error('Navigation error:', error);
//         }
//       }, 500);
//     }

//     // Cleanup timeout on unmount or when searchQuery changes
//     return () => {
//       if (searchTimeoutRef.current) {
//         clearTimeout(searchTimeoutRef.current);
//       }
//     };
//   }, [searchQuery, navigate]);

//   const handleSearchSubmit = (e) => {
//     e.preventDefault();
//     // Immediate search on form submit
//     if (searchQuery.trim().length >= 2) {
//       // Clear debounce timeout
//       if (searchTimeoutRef.current) {
//         clearTimeout(searchTimeoutRef.current);
//       }
//       try {
//         navigate(`/category?search=${encodeURIComponent(searchQuery.trim())}`);
//       } catch (error) {
//         console.error('Navigation error:', error);
//       }
//     }
//   };

//   // Voice search functionality
//   const handleVoiceSearch = () => {
//     if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
//       alert('Voice search is not supported in your browser. Please use Chrome or Edge.');
//       return;
//     }

//     const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
//     const recognition = new SpeechRecognition();
    
//     recognition.lang = 'en-US';
//     recognition.continuous = false;
//     recognition.interimResults = false;

//     // Store recognition instance globally so we can stop it
//     window.recognition = recognition;

//     recognition.onstart = () => {
//       setIsListening(true);
//     };

//     recognition.onresult = (event) => {
//       const transcript = event.results[0][0].transcript;
//       setSearchQuery(transcript);
//       setIsListening(false);
//       if (transcript.trim()) {
//         // Navigate to category page with search query
//         navigate(`/category?search=${encodeURIComponent(transcript.trim())}`);
//       }
//     };

//     recognition.onerror = (event) => {
//       setIsListening(false);
//     };

//     recognition.onend = () => {
//       setIsListening(false);
//       window.recognition = null;
//     };

//     recognition.start();
//   };

//   const cartItemCount = cartCount;

//   // Logout function
//   const logout = () => {
//     allApiWithHeaderToken(API_CONSTANTS.LOGOUT, "", "delete")
//       .then((response) => {
//         if (response.status === 200) {
//           navigate("/");
//         }
//       })
//       .catch(() => { });
//   };

//   // Menu items for logged-in users
//   const loggedInItems = userDetails ? [
//     // User Header
//     {
//       template: () => (
//         <div className="px-4 py-3 border-b border-gray-100">
//           <div className="flex items-center gap-3">
//             <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FFC107] to-[#FFD54F] text-gray-900 flex items-center justify-center font-semibold text-base shadow-sm">
//               {userDetails?.name?.[0]?.toUpperCase() || 'U'}
//             </div>
//             <div className="flex-1 min-w-0">
//               <p className="text-sm font-semibold text-gray-900 truncate">{userDetails?.name}</p>
//               <p className="text-xs text-gray-500 truncate">{userDetails?.email}</p>
//             </div>
//           </div>
//         </div>
//       )
//     },
//     // Dashboard - Only show for admin users (role_id === 1)
//     ...(userDetails?.role_id === 1 ? [{
//       template: () => (
//         <button
//           onClick={() => navigate('/dashboard')}
//           className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors group"
//         >
//           <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FFC107] to-[#FFD54F] flex items-center justify-center group-hover:shadow-md transition-all">
//             <i className="ri-dashboard-line text-gray-900 text-base font-semibold"></i>
//           </div>
//           <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{t("go_to_dashboard") || "Go to Dashboard"}</span>
//         </button>
//       )
//     }] : []),
//     // Delivery Agent menu - Only show "Go to Dashboard" for delivery agents (role_id === 3)
//     ...(userDetails?.role_id === 3 ? [
//       {
//         template: () => (
//           <button
//             onClick={() => navigate('/delivery-dashboard')}
//             className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors group"
//           >
//             <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
//               <i className="ri-dashboard-line text-blue-600 text-base"></i>
//             </div>
//             <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{t("go_to_dashboard") || "Go to Dashboard"}</span>
//           </button>
//         )
//       }
//     ] : []),
//     // User-specific menu items - Only show for regular users (role_id === 2)
//     ...(userDetails?.role_id === 2 ? [
//       // Edit Profile
//       {
//         template: () => (
//           <button
//             onClick={() => navigate('/edit-profile')}
//             className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors group"
//           >
//             <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
//               <i className="ri-user-3-line text-gray-600 text-base"></i>
//             </div>
//             <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{t("edit_profile")}</span>
//           </button>
//         )
//       },
//       // Order History
//       {
//         template: () => (
//           <button
//             onClick={() => navigate('/order-history')}
//             className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors group"
//           >
//             <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
//               <i className="ri-file-list-3-line text-gray-600 text-base"></i>
//             </div>
//             <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{t("order_history")}</span>
//           </button>
//         )
//       },
//       // Track Order
//       {
//         template: () => (
//           <button
//             onClick={() => navigate('/track-order')}
//             className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors group"
//           >
//             <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
//               <i className="ri-map-pin-line text-gray-600 text-base"></i>
//             </div>
//             <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{t("track_order")}</span>
//           </button>
//         )
//       },
//       // Change Password
//       {
//         template: () => (
//           <button
//             onClick={() => navigate('/change-password')}
//             className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors group"
//           >
//             <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
//               <i className="ri-lock-password-line text-gray-600 text-base"></i>
//             </div>
//             <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{t("change_password")}</span>
//           </button>
//         )
//       },
//       // Help
//       {
//         template: () => (
//           <button
//             onClick={() => navigate('/user-help')}
//             className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors group"
//           >
//             <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
//               <i className="ri-questionnaire-line text-gray-600 text-base"></i>
//             </div>
//             <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{t("help")}</span>
//           </button>
//         )
//       }
//     ] : []),
//     // Logout
//     {
//       template: () => (
//         <div className="border-t border-gray-100 mt-1">
//           <button
//             onClick={() => {
//               // Clear cart from localStorage only (not backend)
//               localStorage.removeItem("cart");
//               // Clear cart store state
//               const { setSideCartVisible } = useBackendCartStore.getState();
//               useBackendCartStore.setState({ cart: [], sideCartVisible: false });
//               // Dispatch cart updated event
//               window.dispatchEvent(new CustomEvent('cartUpdated', { detail: [] }));
//               logout();
//               let theme = localStorage.getItem("theme");
//               localStorage.removeItem("userDetails");
//               localStorage.removeItem("token");
//               localStorage.setItem("theme", theme);
//               navigate('/');
//             }}
//             className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-red-50 transition-colors group"
//           >
//             <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center group-hover:bg-red-200 transition-colors">
//               <i className="ri-logout-circle-r-line text-red-600 text-base"></i>
//             </div>
//             <span className="text-sm font-medium text-red-600 group-hover:text-red-700">{t("logout")}</span>
//           </button>
//         </div>
//       )
//     }
//   ] : [];

//   return (
//     <>
//     <header className="fixed top-0 left-0 right-0 z-50">
//       <div 
//         className="shadow-md md:rounded-b-2xl"
//         style={{
//           background: 'linear-gradient(180deg, #FFC107 0%, #FFD54F 100%)'
//         }}
//       >
//         <div className="max-w-[1320px] mx-auto px-3 md:px-4 py-3 md:py-4">
//           {/* Mobile Layout */}
//           <div className="md:hidden">
//             {/* Top Row: Logo and User Icon - Hidden when scrolled */}
//             <div 
//               className="flex items-center justify-between mb-2 transition-all duration-300 overflow-hidden"
//               style={{
//                 maxHeight: isScrolled ? '0' : '40px',
//                 marginBottom: isScrolled ? '0' : '8px',
//                 opacity: isScrolled ? 0 : 1
//               }}
//             >
//               {/* Logo */}
//               <div
//                 className="cursor-pointer"
//                 onClick={() => navigate('/')}
//               >
//                 <h1 className="text-2xl font-bold leading-tight">
//                   <span className="text-gray-900">Sriram</span>
//                   <span className="text-green-600">mart</span>
//                 </h1>
//               </div>

//               {/* User Icon */}
//               {userDetails ? (
//                 <button
//                   onClick={(e) => {
//                     e.preventDefault();
//                     e.stopPropagation();
//                     if (menu.current) {
//                       menu.current.toggle(e);
//                     }
//                   }}
//                   className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm overflow-hidden"
//                   type="button"
//                 >
//                   {userDetails.image_url ? (
//                     <img 
//                       src={userDetails.image_url} 
//                       alt={userDetails.name} 
//                       className="w-full h-full object-cover"
//                     />
//                   ) : (
//                     <span className="text-base font-bold text-gray-700">
//                       {userDetails.name?.[0]?.toUpperCase() || 'U'}
//                     </span>
//                   )}
//                 </button>
//               ) : (
//                 <button
//                   onClick={() => navigate('/sign-in')}
//                   className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm"
//                 >
//                   <i className="ri-user-line text-xl text-gray-700"></i>
//                 </button>
//               )}
//             </div>

//             {/* Second Row: Location and Delivery Time - Hidden when scrolled */}
//             <div 
//               className="flex items-end justify-between mb-3 transition-all duration-300 overflow-hidden"
//               style={{
//                 maxHeight: isScrolled ? '0' : '60px',
//                 marginBottom: isScrolled ? '0' : '12px',
//                 opacity: isScrolled ? 0 : 1
//               }}
//             >
//               {/* Location */}
//               <div className="flex items-start gap-1 text-xs flex-1">
//                 <i className="ri-map-pin-line text-gray-800 mt-0.5 flex-shrink-0"></i>
//                 <div>
//                   <p className="text-gray-800 font-medium leading-tight">Deliver to Selected Location</p>
//                   <p className="text-gray-700 text-[11px] leading-tight">
//                     {userLocation ? userLocation.address : 'Ahmedabad, Gujarat, 380060'}
//                   </p>
//                 </div>
//               </div>

//               {/* Delivery Time Badge */}
//               <div className="bg-white px-3 py-1 rounded-md shadow-sm ml-2 flex-shrink-0">
//                 <p className="text-[10px] text-gray-600 font-medium leading-tight">Delivers in</p>
//                 <p className="text-sm font-bold text-gray-900 leading-tight whitespace-nowrap">30 minutes</p>
//               </div>
//             </div>

//             {/* Search Bar - Always visible */}
//             <form onSubmit={handleSearchSubmit} className="mb-0">
//               <div className="relative">
//                 <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg"></i>
//                 <input
//                   type="text"
//                   value={searchQuery}
//                   onChange={(e) => setSearchQuery(e.target.value)}
//                   placeholder={placeholder}
//                   className="w-full pl-10 pr-12 py-2.5 bg-white border-none rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 text-sm"
//                 />
//                 <button
//                   type="button"
//                   onClick={handleVoiceSearch}
//                   className={`absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer hover:text-gray-600 transition-colors ${
//                     isListening ? 'text-red-500 animate-pulse' : 'text-gray-400'
//                   }`}
//                   title="Voice search"
//                 >
//                   <i className={`${isListening ? 'ri-mic-fill' : 'ri-mic-line'} text-lg`}></i>
//                 </button>
//               </div>
//             </form>
//           </div>

//           {/* Desktop Layout */}
//           <div className="hidden md:flex items-center justify-between gap-4">
//             {/* Logo and Location */}
//             <div className="flex items-start gap-4 flex-shrink-0">
//               {/* Logo */}
//               <div
//                 className="cursor-pointer"
//                 onClick={() => navigate('/')}
//               >
//                 <div className="flex items-baseline gap-0.5">
//                   <span className="text-[1.6rem] font-bold text-gray-900 leading-none">Sriram</span>
//                   <span className="text-2xl font-bold text-green-600 leading-none">Mart</span>
//                 </div>
//                 <div className="text-[9px] text-center text-gray-800 leading-tight -mt-0.5 max-w-[120px]">
//                   Fresh Grocery Delivery in 30 minutes
//                 </div>
//               </div>

//               {/* Location */}
//               <div 
//                 className="cursor-pointer hover:opacity-80 transition-opacity pt-0.5"
//                 onClick={() => navigate('/')}
//               >
//                 <div className="text-xs font-bold text-gray-900 leading-tight">
//                   {SRIRAMMART_CONFIG.company.name} in
//                 </div>
//                 <div className="text-lg font-bold text-gray-900 leading-tight">
//                   30 minutes
//                 </div>
//                 <div className="text-[10px] text-gray-800 leading-tight">
//                   {userLocation ? userLocation.address : 'Ahmedabad, Gujarat, 380060'}
//                 </div>
//               </div>
//             </div>

//             {/* Search Bar */}
//             <form onSubmit={handleSearchSubmit} className="flex-1 max-w-xl">
//               <div className="relative">
//                 <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg"></i>
//                 <input
//                   type="text"
//                   value={searchQuery}
//                   onChange={(e) => setSearchQuery(e.target.value)}
//                   placeholder={placeholder}
//                   className="w-full pl-10 pr-20 py-2 bg-white border-none rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 text-sm"
//                 />
//                 <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
//                   <button
//                     type="button"
//                     onClick={handleVoiceSearch}
//                     className={`cursor-pointer hover:text-gray-600 transition-colors ${
//                       isListening ? 'text-red-500 animate-pulse' : 'text-gray-400'
//                     }`}
//                     title="Voice search"
//                   >
//                     <i className={`${isListening ? 'ri-mic-fill' : 'ri-mic-line'} text-lg`}></i>
//                   </button>
//                 </div>
//               </div>
//             </form>

//             {/* Account and Order Buttons */}
//             <div className="flex items-center gap-2 flex-shrink-0">
//               {/* Account Button */}
//               {userDetails ? (
//                 // Logged-in user - show avatar with menu
//                 <div className="relative">
//                   <button
//                     onClick={(e) => {
//                       e.preventDefault();
//                       e.stopPropagation();
//                       if (menu.current) {
//                         menu.current.toggle(e);
//                       }
//                     }}
//                     className="flex items-center gap-1.5 px-4 py-2 bg-white rounded-lg hover:bg-gray-50 transition-colors"
//                     type="button"
//                   >
//                     <i className="ri-user-line text-lg"></i>
//                     <span className="text-sm font-medium">{userDetails.name}</span>
//                   </button>
//                 </div>
//               ) : (
//                 <button
//                   onClick={() => navigate('/sign-in')}
//                   className="flex items-center gap-1.5 px-4 py-2 bg-white rounded-lg hover:bg-gray-50 transition-colors"
//                 >
//                   <i className="ri-user-line text-lg"></i>
//                   <span className="text-sm font-medium">Account</span>
//                 </button>
//               )}

//               {/* My Order Button - Only show for regular users (not admin) */}
//               {userDetails?.role_id !== 1 && (
//                 <button
//                   onClick={() => navigate('/view-cart')}
//                   className="flex items-center gap-1.5 px-4 py-2 bg-white rounded-lg hover:bg-gray-50 transition-colors"
//                 >
//                   <div className="relative">
//                     <i className="ri-shopping-cart-line text-lg"></i>
//                     {cartItemCount > 0 && (
//                       <span className="absolute -top-3 -right-3 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
//                         {cartItemCount}
//                       </span>
//                     )}
//                   </div>
//                   <span className="text-sm font-medium">My Order</span>
//                 </button>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>
//     </header>

//     {/* Voice Search Modal */}
//     {isListening && (
//       <div 
//         className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-[60]"
//         onClick={() => {
//           setIsListening(false);
//           // Stop speech recognition if active
//           if (window.recognition) {
//             window.recognition.stop();
//           }
//         }}
//       >
//         <div className="flex flex-col items-center justify-center">
//           {/* Animated Microphone Icon */}
//           <div className="relative mb-6">
//             {/* Pulsing rings */}
//             <div className="absolute inset-0 flex items-center justify-center">
//               <div className="w-40 h-40 rounded-full bg-cyan-400 opacity-20 animate-ping"></div>
//             </div>
//             <div className="absolute inset-0 flex items-center justify-center">
//               <div className="w-32 h-32 rounded-full bg-cyan-400 opacity-30 animate-pulse"></div>
//             </div>
            
//             {/* Microphone Icon */}
//             <div className="relative w-32 h-32 flex items-center justify-center">
//               <i className="ri-mic-fill text-8xl text-cyan-400 animate-pulse"></i>
//             </div>
//           </div>

//           {/* Listening Text */}
//           <h3 className="text-2xl font-bold text-white">Listening...</h3>
//         </div>
//       </div>
//     )}

//     {/* TieredMenu for Logged-in Users */}
//     {userDetails && (
//       <>
//         <TieredMenu
//           model={loggedInItems}
//           popup
//           ref={menu}
//           breakpoint="767px"
//           className="user-avatar-menu-modern"
//           style={{ zIndex: 100000 }}
//         />
        
//         <style>{`
//           /* Modern User Avatar Menu Styling */
//           .user-avatar-menu-modern {
//             border-radius: 12px !important;
//             box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12) !important;
//             border: 1px solid #e5e7eb !important;
//             overflow: hidden !important;
//             min-width: 280px !important;
//             padding: 0 !important;
//           }
//           .user-avatar-menu-modern .p-tieredmenu-root-list {
//             padding: 0 !important;
//           }
//           .user-avatar-menu-modern .p-menuitem {
//             margin: 0 !important;
//           }
//           .user-avatar-menu-modern .p-menuitem-link {
//             padding: 0 !important;
//             border-radius: 0 !important;
//           }
//           .user-avatar-menu-modern .p-menuitem-link:hover {
//             background-color: transparent !important;
//           }
//           .user-avatar-menu-modern .p-menuitem-content {
//             border-radius: 0 !important;
//           }
//         `}</style>
//       </>
//     )}
//     </>
//   );
// };

// export default Header;





import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { TieredMenu } from 'primereact/tieredmenu';
import { useTranslation } from "react-i18next";
import toast, { Toaster } from 'react-hot-toast';
import { getLocationFromCookie } from '@services/locationService';
import LocationPickerPopup from './LocationPickerPopup';
import useWishlistStore from '../../useWishlistStore';

// Redux actions
import { logoutUser, clearUserProfile, fetchUserProfile } from '../../redux/slices/authSlice';
import { clearCart } from '../../redux/slices/cartSlice';

const Header = ({ onSearch }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation("msg");
  
  // Redux state
  const { user: userProfile, isAuthenticated, loading: authLoading } = useSelector((state) => state.auth);
  const { items: cartItems } = useSelector((state) => state.cart);
  
  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [placeholder, setPlaceholder] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [userLocation, setUserLocation] = useState(() => getLocationFromCookie());
  const [showLocationPicker, setShowLocationPicker] = useState(() => !getLocationFromCookie());

  const menu = useRef(null);
  const searchTimeoutRef = useRef(null);
  const locationBtnRef = useRef(null);

  const locationLabel = userLocation?.shortName || userLocation?.address?.split(',')[0] || null;
  
  // Get user details from Redux or localStorage (fallback for backward compatibility)
  const userDetails = userProfile || (() => {
    try {
      const raw = localStorage.getItem("userDetails");
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  })();

  // Show toast functions
  const showSuccessToast = (message) => {
    toast.success(message, {
      duration: 3000,
      position: 'top-center',
      style: {
        background: '#4CAF50',
        color: '#fff',
        fontSize: '16px',
        padding: '16px',
        borderRadius: '12px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
      },
      icon: '👋',
    });
  };

  const showErrorToast = (message) => {
    toast.error(message, {
      duration: 4000,
      position: 'top-center',
      style: {
        background: '#f44336',
        color: '#fff',
        fontSize: '16px',
        padding: '16px',
        borderRadius: '12px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
      },
      icon: '❌',
    });
  };

  // Fetch user profile on mount if token exists (skip for delivery agents - role_id 3)
  useEffect(() => {
    const token = localStorage.getItem('token');
    const raw = localStorage.getItem("userDetails");
    let details = null;
    try { details = raw ? JSON.parse(raw) : null; } catch (e) {}
    const userId = userDetails?.id || details?.id;
    const roleId = userDetails?.role_id ?? details?.role_id;

    if (token && userId && !userProfile && roleId !== 3) {
      dispatch(fetchUserProfile(userId));
    }
  }, [dispatch, userProfile, userDetails]);

  // Logout handler using Redux
  const handleLogout = async () => {
    // Clear cart event for other components
    window.dispatchEvent(new CustomEvent('cartUpdated', { detail: [] }));
    
    try {
      // Dispatch logout action
      await dispatch(logoutUser()).unwrap();
      
      // Clear Redux cart
      dispatch(clearCart());
      dispatch(clearUserProfile());
      
      // Clear localStorage
      let theme = localStorage.getItem("theme");
      localStorage.removeItem("userDetails");
      localStorage.removeItem("token");
      if (theme) localStorage.setItem("theme", theme);
      
      showSuccessToast(t("logged_out_successfully") || "Logged out successfully! See you soon!");
      
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (error) {
      console.error('Logout error:', error);
      
      // Even if API fails, clear local data for better UX
      let theme = localStorage.getItem("theme");
      localStorage.removeItem("userDetails");
      localStorage.removeItem("token");
      if (theme) localStorage.setItem("theme", theme);
      
      dispatch(clearCart());
      dispatch(clearUserProfile());
      
      showSuccessToast(t("logged_out_successfully") || "Logged out successfully! See you soon!");
      
      setTimeout(() => {
        navigate('/');
      }, 1500);
    }
  };

  // Scroll effect for mobile header
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerWidth < 768) {
        setIsScrolled(window.scrollY > 50);
      }
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  // Update cart count from Redux cart items
  useEffect(() => {
    setCartCount(cartItems.length);
  }, [cartItems]);

  // Listen for cart updates from Zustand (for backward compatibility)
  useEffect(() => {
    const handleCartUpdate = (event) => {
      if (event.detail) {
        setCartCount(event.detail.length);
      }
    };

    window.addEventListener('cartUpdated', handleCartUpdate);

    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, []);

  // Animated placeholder
  const products = ['Milk', 'Bread', 'Eggs', 'Rice', 'Vegetables', 'Fruits', 'Snacks', 'Beverages'];
  
  useEffect(() => {
    let currentProductIndex = 0;
    let currentCharIndex = 0;
    let isDeleting = false;
    let timeout;

    const animatePlaceholder = () => {
      const currentProduct = products[currentProductIndex];
      
      if (!isDeleting) {
        if (currentCharIndex < currentProduct.length) {
          setPlaceholder('Search ' + currentProduct.substring(0, currentCharIndex + 1));
          currentCharIndex++;
          timeout = setTimeout(animatePlaceholder, 150);
        } else {
          timeout = setTimeout(() => {
            isDeleting = true;
            animatePlaceholder();
          }, 2000);
        }
      } else {
        if (currentCharIndex > 0) {
          setPlaceholder('Search ' + currentProduct.substring(0, currentCharIndex - 1));
          currentCharIndex--;
          timeout = setTimeout(animatePlaceholder, 100);
        } else {
          isDeleting = false;
          currentProductIndex = (currentProductIndex + 1) % products.length;
          timeout = setTimeout(animatePlaceholder, 500);
        }
      }
    };

    animatePlaceholder();

    return () => clearTimeout(timeout);
  }, []);

  // ESC key listener for voice search modal
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape' && isListening) {
        setIsListening(false);
        if (window.recognition) {
          window.recognition.stop();
        }
      }
    };

    document.addEventListener('keydown', handleEscKey);

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isListening]);

  // Search only on Enter / submit — no auto-navigate on typing
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim().length >= 2) {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      try {
        navigate(`/category?search=${encodeURIComponent(searchQuery.trim())}`);
      } catch (error) {
        console.error('Navigation error:', error);
      }
    }
  };

  const handleVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      showErrorToast('Voice search is not supported in your browser.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    window.recognition = recognition;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setSearchQuery(transcript);
      setIsListening(false);
      if (transcript.trim()) {
        navigate(`/category?search=${encodeURIComponent(transcript.trim())}`);
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
      showErrorToast('Voice recognition failed. Please try again.');
    };

    recognition.onend = () => {
      setIsListening(false);
      window.recognition = null;
    };

    recognition.start();
  };

  const cartItemCount = cartCount;
  const { items: wishlistItems } = useWishlistStore();
  const wishlistCount = wishlistItems.length;

  const loggedInItems = userDetails ? [
    {
      template: () => (
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FFC107] to-[#FFD54F] text-gray-900 flex items-center justify-center font-semibold text-base shadow-sm overflow-hidden">
              {userDetails?.image_url ? (
                <img src={userDetails.image_url} alt={userDetails.name} className="w-full h-full object-cover" />
              ) : (
                userDetails?.name?.[0]?.toUpperCase() || userDetails?.user?.name?.[0]?.toUpperCase() || 'U'
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{userDetails?.name || userDetails?.user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{userDetails?.email || userDetails?.user?.email}</p>
            </div>
          </div>
        </div>
      )
    },
    ...((userDetails?.role_id === 1 || userDetails?.user?.role_id === 1) ? [{
      template: () => (
        <button
          onClick={() => navigate('/dashboard')}
          className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors group"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FFC107] to-[#FFD54F] flex items-center justify-center group-hover:shadow-md transition-all">
            <i className="ri-dashboard-line text-gray-900 text-base font-semibold"></i>
          </div>
          <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{t("go_to_dashboard") || "Go to Dashboard"}</span>
        </button>
      )
    }] : []),
    ...((userDetails?.role_id === 3 || userDetails?.user?.role_id === 3) ? [
      {
        template: () => (
          <button
            onClick={() => navigate('/delivery-dashboard')}
            className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors group"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
              <i className="ri-dashboard-line text-blue-600 text-base"></i>
            </div>
            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{t("go_to_dashboard") || "Go to Dashboard"}</span>
          </button>
        )
      }
    ] : []),
    ...((userDetails?.role_id !== 1 && userDetails?.role_id !== 3 &&
         userDetails?.user?.role_id !== 1 && userDetails?.user?.role_id !== 3) ? [
      {
        template: () => (
          <button
            onClick={() => navigate('/edit-profile')}
            className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors group"
          >
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
              <i className="ri-user-3-line text-gray-600 text-base"></i>
            </div>
            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{t("edit_profile")}</span>
          </button>
        )
      },
      {
        template: () => (
          <button
            onClick={() => navigate('/order-history')}
            className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors group"
          >
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
              <i className="ri-file-list-3-line text-gray-600 text-base"></i>
            </div>
            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{t("order_history")}</span>
          </button>
        )
      },
      {
        template: () => (
          <button
            onClick={() => navigate('/my-returns')}
            className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors group"
          >
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
              <i className="ri-arrow-go-back-line text-gray-600 text-base"></i>
            </div>
            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">My Returns</span>
          </button>
        )
      },
      {
        template: () => (
          <button
            onClick={() => navigate('/wallet-recharge')}
            className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors group"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
              <i className="ri-wallet-3-line text-blue-600 text-base"></i>
            </div>
            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">My Wallet</span>
          </button>
        )
      },
      {
        template: () => (
          <button
            onClick={() => navigate('/track-order')}
            className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors group"
          >
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
              <i className="ri-map-pin-line text-gray-600 text-base"></i>
            </div>
            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{t("track_order")}</span>
          </button>
        )
      },
      {
        template: () => (
          <button
            onClick={() => navigate('/change-password')}
            className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors group"
          >
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
              <i className="ri-lock-password-line text-gray-600 text-base"></i>
            </div>
            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{t("change_password")}</span>
          </button>
        )
      },
      {
        template: () => (
          <button
            onClick={() => navigate('/user-help')}
            className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors group"
          >
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
              <i className="ri-questionnaire-line text-gray-600 text-base"></i>
            </div>
            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{t("help")}</span>
          </button>
        )
      }
    ] : []),
    {
      template: () => (
        <div className="border-t border-gray-100 mt-1">
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-red-50 transition-colors group"
          >
            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center group-hover:bg-red-200 transition-colors">
              <i className="ri-logout-circle-r-line text-red-600 text-base"></i>
            </div>
            <span className="text-sm font-medium text-red-600 group-hover:text-red-700">{t("logout")}</span>
          </button>
        </div>
      )
    }
  ] : [];

  return (
    <>
      <Toaster 
        position="top-center"
        reverseOrder={false}
        gutter={8}
        containerStyle={{
          top: 20,
          left: '50%',
          transform: 'translateX(-50%)',
        }}
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
            borderRadius: '12px',
            padding: '16px',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#4CAF50',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#f44336',
              secondary: '#fff',
            },
          },
        }}
      />
      
      <header className="fixed top-0 left-0 right-0 z-50">
        <div 
          className="shadow-md md:rounded-b-2xl"
          style={{
            background: 'linear-gradient(180deg, #FFC107 0%, #FFD54F 100%)'
          }}
        >
          <div className="w-full px-3 md:px-6 py-3 md:py-4">
            {/* Mobile Layout */}
            <div className="md:hidden">
              <div 
                className="flex items-center justify-between mb-2 transition-all duration-300 overflow-hidden"
                style={{
                  maxHeight: isScrolled ? '0' : '40px',
                  marginBottom: isScrolled ? '0' : '8px',
                  opacity: isScrolled ? 0 : 1
                }}
              >
                <div
                  className="cursor-pointer"
                  onClick={() => navigate('/')}
                >
                  <h1 className="text-2xl font-bold leading-tight">
                    <span className="text-gray-900">Sriram</span>
                    <span className="text-green-600">mart</span>
                  </h1>
                </div>

                {userDetails ? (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (menu.current) {
                        menu.current.toggle(e);
                      }
                    }}
                    className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm overflow-hidden"
                    type="button"
                  >
                    {userDetails.image_url ? (
                      <img 
                        src={userDetails.image_url} 
                        alt={userDetails.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-base font-bold text-gray-700">
                        {userDetails.name?.[0]?.toUpperCase() || userDetails.user?.name?.[0]?.toUpperCase() || 'U'}
                      </span>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={() => navigate('/sign-in')}
                    className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm"
                  >
                    <i className="ri-user-line text-xl text-gray-700"></i>
                  </button>
                )}
              </div>

              <div 
                className="flex items-end justify-between mb-3 transition-all duration-300 overflow-hidden"
                style={{
                  maxHeight: isScrolled ? '0' : '60px',
                  marginBottom: isScrolled ? '0' : '12px',
                  opacity: isScrolled ? 0 : 1
                }}
              >
                <button
                  ref={locationBtnRef}
                  className="flex items-center gap-1 text-left"
                  onClick={() => setShowLocationPicker(true)}
                >
                  <i className="ri-map-pin-2-fill text-green-600 text-base flex-shrink-0"></i>
                  <div className="min-w-0">
                    <p className="text-[10px] text-gray-500 leading-tight font-medium uppercase tracking-wide">Deliver to</p>
                    <div className="flex items-center gap-0.5">
                      <p className="text-sm font-bold text-gray-900 leading-tight truncate max-w-[160px]">
                        {locationLabel || 'Set location'}
                      </p>
                      <i className="ri-arrow-down-s-line text-gray-700 text-base flex-shrink-0"></i>
                    </div>
                  </div>
                </button>

                <div className="bg-white px-3 py-1 rounded-md shadow-sm ml-2 flex-shrink-0">
                  <p className="text-[10px] text-gray-600 font-medium leading-tight">Delivers in</p>
                  <p className="text-sm font-bold text-gray-900 leading-tight whitespace-nowrap">30 minutes</p>
                </div>
              </div>

              <form onSubmit={handleSearchSubmit} className="mb-0">
                <div className="relative">
                  <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg"></i>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={placeholder}
                    className="w-full pl-10 pr-12 py-2.5 bg-white border-none rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleVoiceSearch}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer hover:text-gray-600 transition-colors ${
                      isListening ? 'text-red-500 animate-pulse' : 'text-gray-400'
                    }`}
                    title="Voice search"
                  >
                    <i className={`${isListening ? 'ri-mic-fill' : 'ri-mic-line'} text-lg`}></i>
                  </button>
                </div>
              </form>
            </div>

            {/* Desktop Layout */}
            <div className="hidden md:flex items-center justify-between gap-4">
              <div className="flex items-start gap-4 flex-shrink-0">
                <div
                  className="cursor-pointer"
                  onClick={() => navigate('/')}
                >
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-[1.6rem] font-bold text-gray-900 leading-none">Sriram</span>
                    <span className="text-2xl font-bold text-green-600 leading-none">Mart</span>
                  </div>
                  <div className="text-[9px] text-center text-gray-800 leading-tight -mt-0.5 max-w-[120px]">
                    Fresh Grocery Delivery in 30 minutes
                  </div>
                </div>

                <button
                  ref={locationBtnRef}
                  className="text-left hover:opacity-80 transition-opacity"
                  onClick={() => setShowLocationPicker(true)}
                >
                  <div className="font-bold text-gray-900 text-base leading-tight">
                    Delivery in 30 minutes
                  </div>
                  <div className="flex items-center gap-0.5 mt-0.5">
                    <span className="text-sm text-gray-700 leading-tight">
                      {locationLabel ? locationLabel : 'Select Location'}
                    </span>
                    <i className="ri-arrow-down-s-line text-gray-700 text-base flex-shrink-0"></i>
                  </div>
                </button>
              </div>

              <form onSubmit={handleSearchSubmit} className="flex-1 max-w-xl">
                <div className="relative">
                  <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg"></i>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={placeholder}
                    className="w-full pl-10 pr-20 py-2 bg-white border-none rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 text-sm"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleVoiceSearch}
                      className={`cursor-pointer hover:text-gray-600 transition-colors ${
                        isListening ? 'text-red-500 animate-pulse' : 'text-gray-400'
                      }`}
                      title="Voice search"
                    >
                      <i className={`${isListening ? 'ri-mic-fill' : 'ri-mic-line'} text-lg`}></i>
                    </button>
                  </div>
                </div>
              </form>

              <div className="flex items-center gap-2 flex-shrink-0">
                {userDetails ? (
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (menu.current) {
                          menu.current.toggle(e);
                        }
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 bg-white rounded-lg hover:bg-gray-50 transition-colors"
                      type="button"
                    >
                      <i className="ri-user-line text-lg"></i>
                      <span className="text-sm font-medium">{userDetails.name || userDetails.user?.name}</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => navigate('/sign-in')}
                    className="flex items-center gap-1.5 px-4 py-2 bg-white rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <i className="ri-user-line text-lg"></i>
                    <span className="text-sm font-medium">Account</span>
                  </button>
                )}

                {(userDetails?.role_id !== 1 && userDetails?.user?.role_id !== 1) && (
                  <>
                    <button
                      onClick={() => navigate('/wishlist')}
                      className="flex items-center gap-1.5 px-3 py-2 bg-white rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="relative">
                        <i className="ri-heart-line text-lg"></i>
                        {wishlistCount > 0 && (
                          <span className="absolute -top-3 -right-3 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                            {wishlistCount}
                          </span>
                        )}
                      </div>
                    </button>
                    <button
                      onClick={() => navigate('/view-cart')}
                      className="flex items-center gap-1.5 px-4 py-2 bg-white rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="relative">
                        <i className="ri-shopping-cart-line text-lg"></i>
                        {cartItemCount > 0 && (
                          <span className="absolute -top-3 -right-3 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                            {cartItemCount}
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-medium">My Cart</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {isListening && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-[60]"
          onClick={() => {
            setIsListening(false);
            if (window.recognition) {
              window.recognition.stop();
            }
          }}
        >
          <div className="flex flex-col items-center justify-center">
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-40 h-40 rounded-full bg-cyan-400 opacity-20 animate-ping"></div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 rounded-full bg-cyan-400 opacity-30 animate-pulse"></div>
              </div>
              <div className="relative w-32 h-32 flex items-center justify-center">
                <i className="ri-mic-fill text-8xl text-cyan-400 animate-pulse"></i>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white">Listening...</h3>
          </div>
        </div>
      )}

      {userDetails && (
        <>
          <TieredMenu
            model={loggedInItems}
            popup
            ref={menu}
            breakpoint="767px"
            className="user-avatar-menu-modern"
            style={{ zIndex: 100000 }}
          />
          
          <style>{`
            .user-avatar-menu-modern {
              border-radius: 12px !important;
              box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12) !important;
              border: 1px solid #e5e7eb !important;
              overflow: hidden !important;
              min-width: 280px !important;
              padding: 0 !important;
            }
            .user-avatar-menu-modern .p-tieredmenu-root-list {
              padding: 0 !important;
            }
            .user-avatar-menu-modern .p-menuitem {
              margin: 0 !important;
            }
            .user-avatar-menu-modern .p-menuitem-link {
              padding: 0 !important;
              border-radius: 0 !important;
            }
            .user-avatar-menu-modern .p-menuitem-link:hover {
              background-color: transparent !important;
            }
            .user-avatar-menu-modern .p-menuitem-content {
              border-radius: 0 !important;
            }
          `}</style>
        </>
      )}

      <LocationPickerPopup
        isOpen={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        onLocationSelected={(loc) => setUserLocation(loc)}
        anchorRef={locationBtnRef}
      />
    </>
  );
};

export default Header;