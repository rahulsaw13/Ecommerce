// import { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { allApi, allApiWithHeaderToken } from "@api/api";
// import { API_CONSTANTS } from "@constants/apiurl";
// import UserLoader from '@userpage-pages/UserLoader';
// import Header from '@common/Header';
// import Footer from '@common/Footer';
// import { SRIRAMMART_CONFIG } from '@config/srirammart.config';
// import { hasLocationSaved, requestAndSaveLocation, getLocationFromCookie } from '@services/locationService';
// import { Swiper, SwiperSlide } from 'swiper/react';
// import { Pagination } from 'swiper/modules';
// import 'swiper/css';
// import 'swiper/css/pagination';
// import useBackendCartStore from '../../useBackendCartStore';

// // Import reusable components
// import ProductGridSection from '@common-sections/ProductGridSection';
// import ProductCardSection from '@common-sections/ProductCardSection';
// import PromoCarousel from '@common-sections/PromoCarousel';
// import BannerSection from '@common-sections/BannerSection';

// const HomePage = () => {
//   const [loader, setLoader] = useState(true);
//   const [products, setProducts] = useState([]);
//   const [categories, setCategories] = useState([]);
//   const [menuList, setMenuList] = useState([]);
//   const [homeSections, setHomeSections] = useState([]);
//   const [carouselImages, setCarouselImages] = useState([]);
//   const [headerBanner, setHeaderBanner] = useState(null);
//   const [footerBanner, setFooterBanner] = useState(null);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [showNotDelivering, setShowNotDelivering] = useState(false);
//   const [cartItemCount, setCartItemCount] = useState(0);
//   const navigate = useNavigate();

//   // Fetch cart once for the entire homepage
//   const fetchCartForHomepage = async () => {
//     const token = localStorage.getItem('token');
//     const userDetails = localStorage.getItem('userDetails');
    
//     if (token && userDetails) {
//       try {
//         const response = await allApiWithHeaderToken(API_CONSTANTS.CART_URL, "", "get");
//         if (response.status === 200 && response.data.success) {
//           const cartItems = response.data.data.items || [];
//           // Update Zustand store with cart items
//           useBackendCartStore.setState({ cart: cartItems });
//           // Update cart count
//           setCartItemCount(cartItems.length);
//           // Trigger cart update event for all ProductCardSection components
//           window.dispatchEvent(new CustomEvent('cartUpdated', { detail: cartItems }));
//         }
//       } catch (error) {
//         // Silently fail
//       }
//     }
//   };

//   useEffect(() => {
//     // Listen for cart updates
//     const handleCartUpdate = (event) => {
//       if (event.detail) {
//         setCartItemCount(event.detail.length);
//       }
//     };
//     window.addEventListener('cartUpdated', handleCartUpdate);
//     return () => window.removeEventListener('cartUpdated', handleCartUpdate);
//   }, []);

//   useEffect(() => {
//     // Disabled location check for now
//     // checkAndRequestLocation();
//     fetchData();
//     fetchCartForHomepage();
//   }, []);

//   const checkAndRequestLocation = async () => {
//     if (hasLocationSaved()) {
//       const savedLocation = getLocationFromCookie();
//       if (savedLocation && !savedLocation.deliveryAvailable) {
//         setShowNotDelivering(true);
//       }
//     } else {
//       const result = await requestAndSaveLocation();
//       if (result.success && !result.data.deliveryAvailable) {
//         setShowNotDelivering(true);
//       }
//     }
//   };

//   const fetchData = async () => {
//     setLoader(true);
//     try {
//       await Promise.all([fetchProducts(), fetchCategories(), fetchMenuList(), fetchHomeSections()]);
//     } catch (error) {
//     } finally {
//       setLoader(false);
//     }
//   };

//   const fetchProducts = async () => {
//     try {
//       const userDetails = JSON.parse(localStorage.getItem('userDetails'));
//       const body = { user_id: userDetails?.id };
//       const response = await allApi(API_CONSTANTS.ALL_PRODUCTS_URL, body, "post");
//       if (response?.status === 200) {
//         setProducts(response?.data?.products || response?.data || []);
//       }
//     } catch (err) {
//     }
//   };

//   const fetchCategories = async () => {
//     try {
//       const response = await allApi(API_CONSTANTS.ALL_CATEGORY_URL, "", "get");
//       if (response?.status === 200) {
//         setCategories(response?.data || []);
//       }
//     } catch (err) {
//     }
//   };

//   const fetchMenuList = async () => {
//     try {
//       const response = await allApi(API_CONSTANTS.MENU_LIST_URL, "", "get");
//       if (response?.status === 200) {
//         setMenuList(response?.data.filter((_, index) => index <= 6));
//       }
//     } catch (err) {
//     }
//   };

//   const fetchHomeSections = async () => {
//     try {
//       const response = await allApi(API_CONSTANTS.HOME_SECTIONS_URL, "", "get");
//       if (response?.status === 200) {
//         // Response structure: { data: [{ id, attributes: {...} }], settings: {...} }
//         const sections = response?.data?.data?.map(section => ({
//           id: section.id,
//           ...section.attributes
//         })) || [];
//         setHomeSections(sections);
        
//         // Extract settings data (banners and carousel images)
//         const settings = response?.data?.settings;
//         if (settings) {
//           // Set header banner
//           if (settings.header_banner) {
//             setHeaderBanner(settings.header_banner);
//           }
          
//           // Set footer banner
//           if (settings.footer_banner) {
//             setFooterBanner(settings.footer_banner);
//           }
          
//           // Set carousel images
//           if (settings.carousel_images && settings.carousel_images.length > 0) {
//             setCarouselImages(settings.carousel_images);
//           }
//         }
//       }
//     } catch (err) {
//       console.error("Error fetching home sections:", err);
//     }
//   };

//   const handleSearch = (query) => {
//     setSearchQuery(query);
//   };

//   const handleProductClick = (product) => {
//     const productSlug = product.slug || product.name?.toLowerCase().replace(/\s+/g, '-') || product.id;
//     navigate(`/product/${productSlug}`, {
//       state: {
//         id: product.id,
//         image_url: product.image_url,
//         name: product.name,
//         description: product.description,
//         sub_category_id: product.sub_category_id,
//         category_name: product.category_name,
//         variants: product.variants || [],
//         product_variants: product.product_variants || []
//       }
//     });
//   };

//   // Helper function to get section by key
//   const getSectionByKey = (key) => {
//     return homeSections.find(section => section.key === key);
//   };

//   // Helper function to render product grid section
//   const renderProductGridSection = (sectionKey, promoAfter = false, mobileColumns = 3) => {
//     const section = getSectionByKey(sectionKey);
//     if (!section || !section.products || section.products.length === 0) return null;

//     return (
//       <>
//         <ProductGridSection 
//           title={section.name} 
//           products={section.products} 
//           onProductClick={handleProductClick}
//           mobileColumns={mobileColumns}
//         />
//         {promoAfter}
//       </>
//     );
//   };

//   // Helper function to render special sections (evening meal with yellow gradient design)
//   const renderBreadSection = () => {
//     const section = getSectionByKey('evening_meal');
//     if (!section || !section.products || section.products.length === 0) return null;

//     return (
//       <section className="mb-6">
//         <div className="flex items-center justify-between mb-4">
//           <h2 className="text-xl font-bold text-gray-900">{section.name}</h2>
//           <button
//             onClick={() => navigate('/products')}
//             className="text-sm text-yellow-600 hover:text-yellow-700 font-medium"
//           >
//             See All
//           </button>
//         </div>
//         <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-4">
//           {section.products.slice(0, 6).map((product) => {
//             const imageUrl = product.image_url || product.thumbnail_url || '';
//             return (
//               <div
//                 key={product.id}
//                 onClick={() => handleProductClick(product)}
//                 className="cursor-pointer hover:opacity-90 transition-all"
//               >
//                 <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-t-2xl p-2 md:p-6 h-20 md:h-40 flex items-center justify-center relative">
//                   {imageUrl ? (
//                     <img 
//                       src={imageUrl} 
//                       alt={product.name} 
//                       className="w-full h-full object-contain"
//                     />
//                   ) : (
//                     <div className="w-full h-full flex items-center justify-center">
//                       <i className="ri-store-line text-2xl md:text-5xl text-gray-400"></i>
//                     </div>
//                   )}
//                   <div className="absolute -bottom-3 md:-bottom-6 left-1/2 transform -translate-x-1/2 bg-white rounded-full w-6 h-6 md:w-12 md:h-12 flex items-center justify-center shadow-lg border-2 md:border-3 border-yellow-400">
//                     <span className="text-[8px] md:text-sm font-bold text-gray-700">
//                       {product.name ? decodeHtml(product.name).substring(0, 2).toUpperCase() : 'BR'}
//                     </span>
//                   </div>
//                 </div>
//                 <div className="bg-[#FFB700] rounded-b-2xl p-1.5 md:p-4 pt-4 md:pt-8 text-center flex flex-col items-center justify-center h-16 md:h-32">
//                   <h3 className="text-[9px] md:text-[11px] font-bold text-gray-900 mb-0.5 md:mb-1 line-clamp-2 px-1">{decodeHtml(product.name)}</h3>
//                   <p className="text-[8px] md:text-[9px] text-gray-700 font-medium">Shop Now</p>
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       </section>
//     );
//   };

//   const renderChefRecommendation = () => {
//     const section = getSectionByKey('chef_recommendation');
//     if (!section || !section.products || section.products.length === 0) return null;

//     return (
//       <section className="mb-6">
//         <div className="flex items-center justify-between mb-4">
//           <h2 className="text-xl font-bold text-gray-900">{section.name}</h2>
//           <button
//             onClick={() => navigate('/products')}
//             className="text-sm text-yellow-600 hover:text-yellow-700 font-medium"
//           >
//             See All
//           </button>
//         </div>
//         <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-2 md:gap-3">
//           {section.products.slice(0, 12).map((product) => {
//             const imageUrl = product.image_url || product.thumbnail_url || '';
//             return (
//               <div
//                 key={product.id}
//                 onClick={() => handleProductClick(product)}
//                 className="overflow-hidden cursor-pointer transition-all p-2 md:p-3"
//               >
//                 <div className="relative mb-1 md:mb-2">
//                   {imageUrl ? (
//                     <img 
//                       src={imageUrl} 
//                       alt={product.name} 
//                       className="w-full h-16 md:h-24 object-contain"
//                     />
//                   ) : (
//                     <div className="w-full h-16 md:h-24 bg-gray-100 flex items-center justify-center">
//                       <i className="ri-image-line text-xl md:text-2xl text-gray-300"></i>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       </section>
//     );
//   };

//   // Helper function to render card sections (combos, rice, beverages, desserts)
//   const renderCardSection = (sectionKey, icon) => {
//     const section = getSectionByKey(sectionKey);
//     if (!section || !section.products || section.products.length === 0) return null;

//     // Transform products to match ProductCardSection format
//     const formattedProducts = section.products.map(product => {
//       // Get the first variant for pricing
//       const firstVariant = product.variants && product.variants.length > 0 ? product.variants[0] : null;
      
//       return {
//         id: product.id,
//         name: product.name,
//         weight: firstVariant?.weight || 'N/A',
//         price: firstVariant?.selling_price || firstVariant?.price || 0,
//         originalPrice: firstVariant?.mrp || (firstVariant?.price * 1.2) || 0,
//         discount: firstVariant?.mrp && firstVariant?.price 
//           ? Math.round(((firstVariant.mrp - firstVariant.price) / firstVariant.mrp) * 100)
//           : 0,
//         image: product.image_url || product.thumbnail_url || '',
//         // Keep original product data for navigation
//         originalProduct: product
//       };
//     });

//     const handleCardClick = (formattedProduct) => {
//       handleProductClick(formattedProduct.originalProduct);
//     };

//     return (
//       <ProductCardSection 
//         title={section.name} 
//         products={formattedProducts} 
//         icon={icon}
//         onProductClick={handleCardClick}
//       />
//     );
//   };

//   if (loader) {
//     return <UserLoader />;
//   }

//   // Check if there's any content to display
//   const hasCategories = categories && categories.length > 0;
//   const hasProducts = products && products.length > 0;
//   const hasSections = homeSections && homeSections.length > 0;
//   const hasAnyContent = hasCategories || hasProducts || hasSections;

//   // Show empty state if no content
//   if (!hasAnyContent) {
//     return (
//       <div className="min-h-screen bg-gray-50">
//         <Header onSearch={handleSearch} />
        
//         <main className="pt-20 pb-8">
//           <div className="max-w-[1320px] mx-auto px-4">
//             <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
//               <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mb-6">
//                 <i className="ri-store-3-line text-6xl text-gray-400"></i>
//               </div>
//               <h2 className="text-2xl font-bold text-gray-800 mb-3">
//                 No Products Available
//               </h2>
//               <p className="text-gray-600 mb-6 max-w-md">
//                 We're currently updating our site. Please check back later or contact us for more information.
//               </p>
//               <button
//                 onClick={() => window.location.reload()}
//                 className="bg-[#0c831f] text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-green-800 transition-colors flex items-center gap-2"
//               >
//                 <i className="ri-refresh-line"></i>
//                 Refresh Page
//               </button>
//             </div>
//           </div>
//         </main>

//         <Footer data={menuList} />
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-50">
//       <Header onSearch={handleSearch} />
      
//       <main className="pt-[160px] md:pt-20 pb-20 md:pb-8">
//         <div className="max-w-[1320px] mx-auto px-4">
          
//           {/* Categories Bar */}
//           <section className="mb-2 mt-2">
//             <div className="py-3 px-0">
//               {/* Mobile View - Horizontal Scroll */}
//               <div className="md:hidden flex gap-4 overflow-x-auto pb-2 scrollbar-hide px-2">
//                 {categories.map((item) => {
//                   const category = item.category || item;
                  
//                   return (
//                     <div
//                       key={category.name}
//                       onClick={() => {
//                         console.log("Category clicked:", category);
//                         const categoryIdentifier = category.id || category.name;
//                         navigate(`/category?id=${categoryIdentifier}`);
//                       }}
//                       className="flex flex-col items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
//                     >
//                       <div className="w-14 h-14 bg-[#0c831f] rounded-xl flex items-center justify-center shadow-sm border-2 border-yellow-500">
//                         {category.icon ? (
//                           <i className={`${category.icon} text-2xl text-gray-800`}></i>
//                         ) : category.image_url ? (
//                           <img 
//                             src={category.image_url} 
//                             alt={category.name} 
//                             className="w-8 h-8 object-contain"
//                           />
//                         ) : (
//                           <i className="ri-restaurant-line text-2xl text-gray-800"></i>
//                         )}
//                       </div>
//                       <span className="text-[10px] font-semibold text-gray-800 text-center leading-tight max-w-[60px]">
//                         {category.name}
//                       </span>
//                     </div>
//                   );
//                 })}
//               </div>

//               {/* Desktop View - Centered */}
//               <div className="hidden md:flex gap-8 overflow-x-auto pb-2 scrollbar-hide justify-center items-center">
//                 {categories.map((item) => {
//                   const category = item.category || item;
                  
//                   return (
//                     <div
//                       key={category.name}
//                       onClick={() => {
//                         console.log("Category clicked:", category);
//                         const categoryIdentifier = category.id || category.name;
//                         navigate(`/category?id=${categoryIdentifier}`);
//                       }}
//                       className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
//                     >
//                       <div className="w-10 h-10 bg-[#0c831f] rounded-md flex items-center justify-center shadow-sm flex-shrink-0">
//                         {category.icon ? (
//                           <i className={`${category.icon} text-xl text-gray-800`}></i>
//                         ) : category.image_url ? (
//                           <img 
//                             src={category.image_url} 
//                             alt={category.name} 
//                             className="w-6 h-6 object-contain"
//                           />
//                         ) : (
//                           <i className="ri-restaurant-line text-xl text-gray-800"></i>
//                         )}
//                       </div>
//                       <span className="text-[10px] font-medium text-gray-800 whitespace-nowrap">
//                         {category.name}
//                       </span>
//                     </div>
//                   );
//                 })}
//               </div>
//             </div>
//           </section>

//           <BannerSection image={headerBanner} alt="Header Banner" className="hidden md:block" />

//           {/* Top offers today - Show all categories */}
//           {getSectionByKey('top_offers_today') && (
//             <section className="mb-6">
//               <h2 className="text-xl font-bold text-gray-900 mb-4">
//                 {getSectionByKey('top_offers_today').name}
//               </h2>
              
//               {/* Mobile View - 3 columns grid */}
//               <div className="grid grid-cols-3 gap-2 md:hidden">
//                 {categories.slice(0, 6).map((item) => {
//                   const category = item.category || item;
                  
//                   const categoryProducts = products.filter(p => p.category_id === category.id);
//                   const displayProducts = categoryProducts.slice(0, 4);
//                   const remainingCount = categoryProducts.length > 4 ? categoryProducts.length - 4 : 0;
                  
//                   return (
//                     <div
//                       key={category.id || category.name}
//                       onClick={() => {
//                         console.log("Top Offers card clicked:", category);
//                         const categoryIdentifier = category.id || category.name;
//                         navigate(`/category?id=${categoryIdentifier}`);
//                       }}
//                       className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl p-2 cursor-pointer hover:shadow-lg transition-all relative"
//                     >
//                       <div className="grid grid-cols-2 gap-1 mb-2">
//                         {displayProducts.map((product) => (
//                           <div key={product.id} className="relative bg-white rounded-lg p-1.5 shadow-sm">
//                             {product.image_url || product.thumbnail_url ? (
//                               <img 
//                                 src={product.image_url || product.thumbnail_url} 
//                                 alt={product.name} 
//                                 className="w-full h-16 object-contain"
//                               />
//                             ) : (
//                               <div className="w-full h-16 bg-gray-100 rounded flex items-center justify-center">
//                                 <i className="ri-image-line text-xl text-gray-300"></i>
//                               </div>
//                             )}
//                           </div>
//                         ))}
//                         {displayProducts.length < 4 && [...Array(4 - displayProducts.length)].map((_, i) => (
//                           <div key={`empty-${i}`} className="bg-white rounded-lg p-1.5 shadow-sm">
//                             <div className="w-full h-16 bg-gray-100 rounded flex items-center justify-center">
//                               <i className="ri-image-line text-xl text-gray-300"></i>
//                             </div>
//                           </div>
//                         ))}
//                       </div>
                      
//                       {remainingCount > 0 && (
//                         <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
//                           <div className="bg-white rounded-full px-2 py-0.5 shadow-md border border-gray-200 flex items-center justify-center">
//                             <span className="text-[10px] font-medium text-gray-700 leading-none">+{remainingCount} more</span>
//                           </div>
//                         </div>
//                       )}
                      
//                       <h3 className="text-[11px] font-bold text-gray-900 text-center leading-tight">{category.name}</h3>
//                     </div>
//                   );
//                 })}
//               </div>

//               {/* Desktop View - Swiper */}
//               <div className="hidden md:block">
//                 <Swiper
//                   modules={[Pagination]}
//                   spaceBetween={16}
//                   slidesPerView={6}
//                   breakpoints={{
//                     640: { slidesPerView: 2 },
//                     768: { slidesPerView: 3 },
//                     1024: { slidesPerView: 6 },
//                   }}
//                 >
//                   {categories.slice(0, 6).map((item) => {
//                     const category = item.category || item;
                    
//                     const categoryProducts = products.filter(p => p.category_id === category.id);
//                     const displayProducts = categoryProducts.slice(0, 4);
//                     const remainingCount = categoryProducts.length > 4 ? categoryProducts.length - 4 : 0;
                    
//                     return (
//                       <SwiperSlide key={category.id || category.name}>
//                         <div
//                           onClick={() => {
//                             console.log("Top Offers card clicked:", category);
//                             const categoryIdentifier = category.id || category.name;
//                             navigate(`/category?id=${categoryIdentifier}`);
//                           }}
//                           className="w-full bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl p-2 cursor-pointer hover:shadow-xl transition-all relative"
//                         >
//                           <div className="grid grid-cols-2 gap-1 mb-4">
//                             {displayProducts.map((product) => (
//                               <div key={product.id} className="relative bg-white rounded-xl p-2 shadow-sm">
//                                 {product.image_url || product.thumbnail_url ? (
//                                   <img 
//                                     src={product.image_url || product.thumbnail_url} 
//                                     alt={product.name} 
//                                     className="w-full h-20 object-contain"
//                                   />
//                                 ) : (
//                                   <div className="w-full h-20 bg-gray-100 rounded flex items-center justify-center">
//                                     <i className="ri-image-line text-2xl text-gray-300"></i>
//                                   </div>
//                                 )}
//                               </div>
//                             ))}
//                             {displayProducts.length < 4 && [...Array(4 - displayProducts.length)].map((_, i) => (
//                               <div key={`empty-${i}`} className="bg-white rounded-xl p-2 shadow-sm">
//                                 <div className="w-full h-20 bg-gray-100 rounded flex items-center justify-center">
//                                   <i className="ri-image-line text-2xl text-gray-300"></i>
//                                 </div>
//                               </div>
//                             ))}
//                           </div>
                          
//                           {remainingCount > 0 && (
//                             <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-10">
//                               <div className="bg-white rounded-full px-4 py-0.5 shadow-md border border-gray-200 flex items-center justify-center">
//                                 <span className="text-[8px] font-medium text-gray-700 leading-none">+{remainingCount} more</span>
//                               </div>
//                             </div>
//                           )}
                          
//                           <h3 className="text-[12px] font-bold text-gray-900 text-center">{category.name}</h3>
//                         </div>
//                       </SwiperSlide>
//                     );
//                   })}
//                 </Swiper>
//               </div>
//             </section>
//           )}

//           <div className="hidden md:block">
//             <PromoCarousel images={carouselImages} />
//           </div>

//           {renderProductGridSection('order_our_best_food', false, 4)}
//           {renderProductGridSection('explore_quick_caving', true)}

//           {renderProductGridSection('starters_appetizers')}
//           {renderProductGridSection('main_courses', true)}

//           {renderCardSection('combo_meal_deals', 'ri-shopping-bag-line')}
//           {renderCardSection('rice_biryani', 'ri-restaurant-line')}

//           <div className="hidden md:block">
//             <PromoCarousel images={carouselImages} />
//           </div>

//           {renderBreadSection()}

//           {renderCardSection('beverages', 'ri-cup-line')}

//           {renderChefRecommendation()}

//           {renderCardSection('deserts', 'ri-cake-3-line')}

//           <BannerSection image={footerBanner} alt="Footer Banner" className="hidden md:block" />

//         </div>
//       </main>

//       {/* Floating View Cart Button - Mobile Only */}
//       {cartItemCount > 0 && (
//         <div className="md:hidden fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50 w-[40%] max-w-xs">
//           <button
//             onClick={() => navigate('/view-cart')}
//             className="w-full bg-[#0c831f] text-white rounded-full font-bold shadow-lg flex items-center justify-between hover:bg-green-800 transition-all px-4 py-2.5"
//           >
//             <div className="flex flex-col items-start">
//               <span className="text-sm font-bold">View cart</span>
//               <span className="text-xs font-semibold">
//                 {cartItemCount} ITEM{cartItemCount > 1 ? 'S' : ''}
//               </span>
//             </div>
//             <div className="w-9 h-9 bg-green-700 rounded-full flex items-center justify-center flex-shrink-0">
//               <i className="ri-arrow-right-line text-lg text-gray-900"></i>
//             </div>
//           </button>
//         </div>
//       )}

//       <Footer data={menuList} />

//       {/* Not Delivering Modal */}
//       {showNotDelivering && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//           <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 text-center">
//             <div className="mb-6">
//               <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
//                 <i className="ri-map-pin-line text-4xl text-red-500"></i>
//               </div>
//               <h2 className="text-2xl font-bold text-gray-900 mb-2">
//                 {SRIRAMMART_CONFIG.messages.notDelivering.title}
//               </h2>
//               <p className="text-gray-600">
//                 {SRIRAMMART_CONFIG.messages.notDelivering.message}
//               </p>
//             </div>

//             <button
//               onClick={() => setShowNotDelivering(false)}
//               className="w-full bg-[#0c831f] text-gray-900 py-3 rounded-lg font-bold hover:bg-green-800 transition-colors"
//             >
//               {SRIRAMMART_CONFIG.messages.notDelivering.buttonText}
//             </button>
//           </div>
//         </div>
//       )}

//       <style jsx>{`
//         .scrollbar-hide::-webkit-scrollbar {
//           display: none;
//         }
//         .scrollbar-hide {
//           -ms-overflow-style: none;
//           scrollbar-width: none;
//         }
//       `}</style>
//     </div>
//   );
// };

// export default HomePage;








// import { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { useDispatch, useSelector } from 'react-redux';
// import toast, { Toaster } from 'react-hot-toast';
// import UserLoader from '@userpage-pages/UserLoader';
// import Header from '@common/Header';
// import Footer from '@common/Footer';
// import { Swiper, SwiperSlide } from 'swiper/react';
// import { Pagination } from 'swiper/modules';
// import 'swiper/css';
// import 'swiper/css/pagination';

// // Import reusable components
// import ProductGridSection from '@common-sections/ProductGridSection';
// import ProductCardSection from '@common-sections/ProductCardSection';
// import PromoCarousel from '@common-sections/PromoCarousel';
// import BannerSection from '@common-sections/BannerSection';

// // Redux actions - Products
// import { 
//   fetchAllActiveProducts, 
//   fetchAllCategories, 
//   fetchHomeSections,
//   clearProducts,
//   clearCategories,
//   clearHomeSections
// } from '../../redux/slices/productSlice';

// // Redux actions - Cart
// import { 
//   getCart,
//   addToCart,
//   clearCart
// } from '../../redux/slices/cartSlice';

// const HomePage = () => {
//   const dispatch = useDispatch();
//   const navigate = useNavigate();
  
//   // Products Redux state
//   const { 
//     products, 
//     categories, 
//     homeSections,
//     loading: productsLoading,
//     error: productsError
//   } = useSelector((state) => state.products);
  
//   // Cart Redux state
//   const { 
//     items: cartItems,
//     loading: cartLoading
//   } = useSelector((state) => state.cart);
  
//   // Auth state
//   const { user, isAuthenticated: reduxIsAuthenticated } = useSelector((state) => state.auth);
  
//   // UI-only local state
//   const [carouselImages, setCarouselImages] = useState([]);
//   const [headerBanner, setHeaderBanner] = useState(null);
//   const [footerBanner, setFooterBanner] = useState(null);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [cartItemCount, setCartItemCount] = useState(0);
//   const [addingToCart, setAddingToCart] = useState(false);
//   const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);

//   // Check if user is logged in from localStorage (most reliable)
//  const checkUserLoginStatus = () => {
//   try {
//     const userDetails = localStorage.getItem('userDetails');

//     if (!userDetails) {
//       setIsUserLoggedIn(false);
//       return false;
//     }

//     const parsedUser = JSON.parse(userDetails);

//     if (parsedUser && parsedUser.id) {
//       setIsUserLoggedIn(true);
//       return true;
//     }

//     setIsUserLoggedIn(false);
//     return false;
//   } catch (error) {
//     console.error("Error checking login status:", error);
//     setIsUserLoggedIn(false);
//     return false;
//   }
// };

//   // Get current user ID from localStorage
//   const getCurrentUserId = () => {
//     try {
//       const userDetails = localStorage.getItem('userDetails');
//       if (userDetails) {
//         const parsedUser = JSON.parse(userDetails);
//         return parsedUser?.id || parsedUser?.user?.id;
//       }
//       return user?.id || null;
//     } catch (error) {
//       return null;
//     }
//   };

//   // Show toast functions
//   const showSuccessToast = (message) => {
//     toast.success(message, {
//       duration: 3000,
//       position: 'top-center',
//       style: {
//         background: '#4CAF50',
//         color: '#fff',
//         fontSize: '16px',
//         padding: '16px',
//         borderRadius: '12px',
//         boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
//       },
//       icon: '✅',
//     });
//   };

//   const showErrorToast = (message) => {
//     toast.error(message, {
//       duration: 4000,
//       position: 'top-center',
//       style: {
//         background: '#f44336',
//         color: '#fff',
//         fontSize: '16px',
//         padding: '16px',
//         borderRadius: '12px',
//         boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
//       },
//       icon: '❌',
//     });
//   };

//   const showInfoToast = (message) => {
//     toast(message, {
//       duration: 3000,
//       position: 'top-center',
//       style: {
//         background: '#2196F3',
//         color: '#fff',
//         fontSize: '16px',
//         padding: '16px',
//         borderRadius: '12px',
//         boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
//       },
//       icon: 'ℹ️',
//     });
//   };

//   // Update cart count when cart items change
//   useEffect(() => {
//     if (cartItems && cartItems.length > 0) {
//       setCartItemCount(cartItems.length);
//     } else {
//       setCartItemCount(0);
//     }
//   }, [cartItems]);

//   // Check login status on mount
//   useEffect(() => {
//     checkUserLoginStatus();
//   }, []);

//   // Fetch cart data
//   const fetchCartData = async () => {
//     const userId = getCurrentUserId();
//     const isLoggedIn = checkUserLoginStatus();
    
//     if (userId && isLoggedIn) {
//       try {
//         await dispatch(getCart()).unwrap();
//       } catch (error) {
//         console.error("Error fetching cart:", error);
//       }
//     }
//   };

//   // Add to cart handler
// const handleAddToCart = async (product) => {
//   const isLoggedIn = checkUserLoginStatus();

//   if (!isLoggedIn) {
//     showInfoToast("Please login first");
//     navigate('/sign-in');
//     return;
//   }

//   try {
//     const userId = getCurrentUserId();

//     const productVariantId =
//       product?.variants?.[0]?.productVariantId ||
//       product?.variants?.[0]?.id ||
//       product?.product_variants?.[0]?.id;

//     if (!productVariantId) {
//       console.log("❌ PRODUCT DATA:", product);
//       showErrorToast("Variant not found");
//       return;
//     }

//     await dispatch(addToCart({
//       user_id: userId,
//       product_variant_id: productVariantId,
//       quantity: 1
//     })).unwrap();
    

//     showSuccessToast("Item added to cart");
//     await dispatch(getCart()).unwrap();

//   } catch (err) {
//     showErrorToast(err);
//   }
// };

//   // Fetch all data using Redux
//   useEffect(() => {
//     dispatch(fetchAllActiveProducts());
//     dispatch(fetchAllCategories());
//     dispatch(fetchHomeSections());
    
//     return () => {
//       dispatch(clearProducts());
//       dispatch(clearCategories());
//       dispatch(clearHomeSections());
//       dispatch(clearCart());
//     };
//   }, [dispatch]);

//   // Fetch cart data when component mounts and user is logged in
//   useEffect(() => {
//     if (isUserLoggedIn) {
//       fetchCartData();
//     }
//   }, [isUserLoggedIn]);

//   // Process home sections to extract settings
//   useEffect(() => {
//     if (homeSections && homeSections.length > 0) {
//       const settingsSection = homeSections.find(section => section.key === 'settings');
//       if (settingsSection) {
//         if (settingsSection.header_banner) setHeaderBanner(settingsSection.header_banner);
//         if (settingsSection.footer_banner) setFooterBanner(settingsSection.footer_banner);
//         if (settingsSection.carousel_images) setCarouselImages(settingsSection.carousel_images);
//       }
//     }
//   }, [homeSections]);

//   const handleSearch = (query) => {
//     setSearchQuery(query);
//   };

//   const handleProductClick = (product) => {
//     const productSlug = product.slug || product.name?.toLowerCase().replace(/\s+/g, '-') || product.id;
//     navigate(`/product/${productSlug}`, {
//       state: {
//         id: product.id,
//         image_url: product.image_url,
//         name: product.name,
//         description: product.description,
//         sub_category_id: product.sub_category_id,
//         category_name: product.category_name,
//         variants: product.variants || [],
//         product_variants: product.product_variants || []
//       }
//     });
//   };

//   const getSectionByKey = (key) => {
//     return homeSections.find(section => section.key === key);
//   };

//   const renderProductGridSection = (sectionKey, promoAfter = false, mobileColumns = 3) => {
//     const section = getSectionByKey(sectionKey);
//     if (!section || !section.products || section.products.length === 0) return null;

//     const productsWithCart = section.products.map(product => ({
//       ...product,
//       onAddToCart: () => handleAddToCart(product)
//     }));

//     return (
//       <>
//         <ProductGridSection 
//           title={section.name} 
//           products={productsWithCart} 
//           onProductClick={handleProductClick}
//           mobileColumns={mobileColumns}
//         />
//         {promoAfter}
//       </>
//     );
//   };

//   const renderBreadSection = () => {
//     const section = getSectionByKey('evening_meal');
//     if (!section || !section.products || section.products.length === 0) return null;

//     return (
//       <section className="mb-6">
//         <div className="flex items-center justify-between mb-4">
//           <h2 className="text-xl font-bold text-gray-900">{section.name}</h2>
//           <button
//             onClick={() => navigate('/products')}
//             className="text-sm text-yellow-600 hover:text-yellow-700 font-medium"
//           >
//             See All
//           </button>
//         </div>
//         <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-4">
//           {section.products.slice(0, 6).map((product) => {
//             const imageUrl = product.image_url || product.thumbnail_url || '';
//             return (
//               <div
//                 key={product.id}
//                 onClick={() => handleProductClick(product)}
//                 className="cursor-pointer hover:opacity-90 transition-all"
//               >
//                 <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-t-2xl p-2 md:p-6 h-20 md:h-40 flex items-center justify-center relative">
//                   {imageUrl ? (
//                     <img 
//                       src={imageUrl} 
//                       alt={product.name} 
//                       className="w-full h-full object-contain"
//                     />
//                   ) : (
//                     <div className="w-full h-full flex items-center justify-center">
//                       <i className="ri-store-line text-2xl md:text-5xl text-gray-400"></i>
//                     </div>
//                   )}
//                   <div className="absolute -bottom-3 md:-bottom-6 left-1/2 transform -translate-x-1/2 bg-white rounded-full w-6 h-6 md:w-12 md:h-12 flex items-center justify-center shadow-lg border-2 md:border-3 border-yellow-400">
//                     <span className="text-[8px] md:text-sm font-bold text-gray-700">
//                       {product.name ? decodeHtml(product.name).substring(0, 2).toUpperCase() : 'BR'}
//                     </span>
//                   </div>
//                 </div>
//                 <div className="bg-[#FFB700] rounded-b-2xl p-1.5 md:p-4 pt-4 md:pt-8 text-center flex flex-col items-center justify-center h-16 md:h-32">
//                   <h3 className="text-[9px] md:text-[11px] font-bold text-gray-900 mb-0.5 md:mb-1 line-clamp-2 px-1">{decodeHtml(product.name)}</h3>
//                   <p className="text-[8px] md:text-[9px] text-gray-700 font-medium">Shop Now</p>
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       </section>
//     );
//   };

//   const renderChefRecommendation = () => {
//     const section = getSectionByKey('chef_recommendation');
//     if (!section || !section.products || section.products.length === 0) return null;

//     return (
//       <section className="mb-6">
//         <div className="flex items-center justify-between mb-4">
//           <h2 className="text-xl font-bold text-gray-900">{section.name}</h2>
//           <button
//             onClick={() => navigate('/products')}
//             className="text-sm text-yellow-600 hover:text-yellow-700 font-medium"
//           >
//             See All
//           </button>
//         </div>
//         <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-2 md:gap-3">
//           {section.products.slice(0, 12).map((product) => {
//             const imageUrl = product.image_url || product.thumbnail_url || '';
//             return (
//               <div
//                 key={product.id}
//                 onClick={() => handleProductClick(product)}
//                 className="overflow-hidden cursor-pointer transition-all p-2 md:p-3"
//               >
//                 <div className="relative mb-1 md:mb-2">
//                   {imageUrl ? (
//                     <img 
//                       src={imageUrl} 
//                       alt={product.name} 
//                       className="w-full h-16 md:h-24 object-contain"
//                     />
//                   ) : (
//                     <div className="w-full h-16 md:h-24 bg-gray-100 flex items-center justify-center">
//                       <i className="ri-image-line text-xl md:text-2xl text-gray-300"></i>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       </section>
//     );
//   };

//   const renderCardSection = (sectionKey, icon) => {
//     const section = getSectionByKey(sectionKey);
//     if (!section || !section.products || section.products.length === 0) return null;

//     const formattedProducts = section.products.map(product => {
//       const firstVariant = product.variants && product.variants.length > 0 ? product.variants[0] : null;
      
//       return {
//         id: product.id,
//         name: product.name,
//         weight: firstVariant?.weight || 'N/A',
//         price: firstVariant?.selling_price || firstVariant?.price || 0,
//         originalPrice: firstVariant?.mrp || (firstVariant?.price * 1.2) || 0,
//         discount: firstVariant?.mrp && firstVariant?.price 
//           ? Math.round(((firstVariant.mrp - firstVariant.price) / firstVariant.mrp) * 100)
//           : 0,
//         image: product.image_url || product.thumbnail_url || '',
//         originalProduct: product,
//         onAddToCart: () => handleAddToCart(product)
//       };
//     });

//     const handleCardClick = (formattedProduct) => {
//       handleProductClick(formattedProduct.originalProduct);
//     };

//     return (
//       <ProductCardSection 
//         title={section.name} 
//         products={formattedProducts} 
//         icon={icon}
//         onProductClick={handleCardClick}
//       />
//     );
//   };

//   // Loading state
//   if (productsLoading || cartLoading) {
//     return <UserLoader />;
//   }

//   // Error state
//   if (productsError) {
//     return (
//       <div className="min-h-screen bg-gray-50">
//         <Header onSearch={handleSearch} />
//         <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
//           <div className="text-red-600 text-xl mb-4">Error loading data</div>
//           <p className="text-gray-600">{typeof productsError === 'string' ? productsError : 'Please try again later'}</p>
//           <button 
//             onClick={() => window.location.reload()} 
//             className="mt-4 bg-[#0c831f] text-white px-6 py-2 rounded-xl font-semibold"
//           >
//             Retry
//           </button>
//         </div>
//         <Footer data={[]} />
//       </div>
//     );
//   }

//   // Check content availability
//   const hasCategories = categories && categories.length > 0;
//   const hasProducts = products && products.length > 0;
//   const hasSections = homeSections && homeSections.length > 0;
//   const hasProductsInSections = homeSections.some(section => section.products && section.products.length > 0);
//   const showDefaultProductGrid = hasProducts && !hasProductsInSections;

//   // Empty state
//   if (!hasProducts && !hasSections) {
//     return (
//       <div className="min-h-screen bg-gray-50">
//         <Header onSearch={handleSearch} />
//         <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
//           <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mb-6">
//             <i className="ri-store-3-line text-6xl text-gray-400"></i>
//           </div>
//           <h2 className="text-2xl font-bold text-gray-800 mb-3">No Products Available</h2>
//           <p className="text-gray-600 mb-6">We're currently updating our site. Please check back later.</p>
//           <button onClick={() => window.location.reload()} className="bg-[#0c831f] text-white px-6 py-3 rounded-xl font-semibold">
//             Refresh Page
//           </button>
//         </div>
//         <Footer data={[]} />
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-50">
//       <Toaster 
//         position="top-center"
//         reverseOrder={false}
//         gutter={8}
//         containerStyle={{
//           top: 20,
//           left: '50%',
//           transform: 'translateX(-50%)',
//         }}
//         toastOptions={{
//           duration: 3000,
//           style: {
//             background: '#363636',
//             color: '#fff',
//             borderRadius: '12px',
//             padding: '16px',
//           },
//           success: {
//             duration: 3000,
//             iconTheme: {
//               primary: '#4CAF50',
//               secondary: '#fff',
//             },
//           },
//           error: {
//             duration: 4000,
//             iconTheme: {
//               primary: '#f44336',
//               secondary: '#fff',
//             },
//           },
//         }}
//       />
      
//       <Header onSearch={handleSearch} />
      
//       <main className="pt-[160px] md:pt-20 pb-20 md:pb-8">
//         <div className="max-w-[1320px] mx-auto px-4">
          
//           {/* Debug Info Panel */}
//           {process.env.NODE_ENV === 'development' && (
//             <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-xs">
//               <p className="font-semibold">Debug Info:</p>
//               <p>✅ Products in Redux: {products?.length || 0}</p>
//               <p>✅ Categories: {categories?.length || 0}</p>
//               <p>✅ Home Sections: {homeSections?.length || 0}</p>
//               <p>✅ Cart Items: {cartItems?.length || 0}</p>
//               <p>✅ User Logged In: {isUserLoggedIn ? 'Yes' : 'No'}</p>
//             </div>
//           )}

//           {/* Categories Bar */}
//           {hasCategories && (
//             <section className="mb-2 mt-2">
//               <div className="py-3 px-0">
//                 <div className="md:hidden flex gap-4 overflow-x-auto pb-2 scrollbar-hide px-2">
//                   {categories.slice(0, 10).map((category) => {
//                     const categoryName = category.name || category.category?.name;
//                     const categoryId = category.id || category.category?.id;
//                     return (
//                       <div
//                         key={categoryId || categoryName}
//                         onClick={() => navigate(`/category?id=${categoryId}`)}
//                         className="flex flex-col items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
//                       >
//                         <div className="w-14 h-14 bg-[#0c831f] rounded-xl flex items-center justify-center shadow-sm border-2 border-yellow-500">
//                           <i className="ri-restaurant-line text-2xl text-gray-800"></i>
//                         </div>
//                         <span className="text-[10px] font-semibold text-gray-800 text-center leading-tight max-w-[60px]">
//                           {categoryName}
//                         </span>
//                       </div>
//                     );
//                   })}
//                 </div>

//                 <div className="hidden md:flex gap-8 overflow-x-auto pb-2 scrollbar-hide justify-center items-center">
//                   {categories.slice(0, 10).map((category) => {
//                     const categoryName = category.name || category.category?.name;
//                     const categoryId = category.id || category.category?.id;
//                     return (
//                       <div
//                         key={categoryId || categoryName}
//                         onClick={() => navigate(`/category?id=${categoryId}`)}
//                         className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
//                       >
//                         <div className="w-10 h-10 bg-[#0c831f] rounded-md flex items-center justify-center shadow-sm flex-shrink-0">
//                           <i className="ri-restaurant-line text-xl text-gray-800"></i>
//                         </div>
//                         <span className="text-[10px] font-medium text-gray-800 whitespace-nowrap">
//                           {categoryName}
//                         </span>
//                       </div>
//                     );
//                   })}
//                 </div>
//               </div>
//             </section>
//           )}

//           <BannerSection image={headerBanner} alt="Header Banner" className="hidden md:block" />

//           {/* Default Product Grid */}
//           {showDefaultProductGrid && (
//             <section className="mb-8">
//               <h2 className="text-2xl font-bold text-gray-900 mb-6">All Products</h2>
//               <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
//                 {products.slice(0, 20).map((product) => (
//                   <div
//                     key={product.id}
//                     onClick={() => handleProductClick(product)}
//                     className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
//                   >
//                     <div className="aspect-square bg-gray-100 flex items-center justify-center p-4">
//                       {product.image_url ? (
//                         <img 
//                           src={product.image_url} 
//                           alt={product.name} 
//                           className="w-full h-full object-contain"
//                         />
//                       ) : (
//                         <i className="ri-image-line text-4xl text-gray-400"></i>
//                       )}
//                     </div>
//                     <div className="p-3">
//                       <h3 className="font-semibold text-gray-800 text-sm line-clamp-2">{product.name}</h3>
//                       {product.variants && product.variants[0] && (
//                         <p className="text-lg font-bold text-green-600 mt-1">
//                           ₹{product.variants[0].actualPrice || product.variants[0].price || 0}
//                         </p>
//                       )}
//                       <button 
//                         onClick={(e) => {
//                           e.stopPropagation();
//                           handleAddToCart(product);
//                         }}
//                         disabled={addingToCart}
//                         className="mt-2 w-full bg-[#0c831f] text-gray-900 py-1.5 rounded-md text-sm font-semibold hover:bg-green-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
//                       >
//                         {addingToCart ? (
//                           <div className="flex items-center justify-center gap-1">
//                             <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
//                             Adding...
//                           </div>
//                         ) : (
//                           'Add to Cart'
//                         )}
//                       </button>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </section>
//           )}

//           {/* Render sections normally */}
//           {!showDefaultProductGrid && (
//             <>
//               {renderProductGridSection('order_our_best_food', false, 4)}
//               {renderProductGridSection('explore_quick_caving', true)}
//               {renderProductGridSection('starters_appetizers')}
//               {renderProductGridSection('main_courses', true)}
//               {renderCardSection('combo_meal_deals', 'ri-shopping-bag-line')}
//               {renderCardSection('rice_biryani', 'ri-restaurant-line')}

//               {carouselImages.length > 0 && (
//                 <div className="hidden md:block">
//                   <PromoCarousel images={carouselImages} />
//                 </div>
//               )}

//               {renderBreadSection()}
//               {renderCardSection('beverages', 'ri-cup-line')}
//               {renderChefRecommendation()}
//               {renderCardSection('deserts', 'ri-cake-3-line')}
//             </>
//           )}

//           <BannerSection image={footerBanner} alt="Footer Banner" className="hidden md:block" />

//         </div>
//       </main>

//       {/* Floating View Cart Button - Mobile Only */}
//       {cartItemCount > 0 && (
//         <div className="md:hidden fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50 w-[40%] max-w-xs">
//           <button
//             onClick={() => navigate('/view-cart')}
//             className="w-full bg-[#0c831f] text-white rounded-full font-bold shadow-lg flex items-center justify-between hover:bg-green-800 transition-all px-4 py-2.5"
//           >
//             <div className="flex flex-col items-start">
//               <span className="text-sm font-bold">View cart</span>
//               <span className="text-xs font-semibold">
//                 {cartItemCount} ITEM{cartItemCount > 1 ? 'S' : ''}
//               </span>
//             </div>
//             <div className="w-9 h-9 bg-green-700 rounded-full flex items-center justify-center flex-shrink-0">
//               <i className="ri-arrow-right-line text-lg text-gray-900"></i>
//             </div>
//           </button>
//         </div>
//       )}

//       <Footer data={[]} />

//       <style jsx="true">{`
//         .scrollbar-hide::-webkit-scrollbar {
//           display: none;
//         }
//         .scrollbar-hide {
//           -ms-overflow-style: none;
//           scrollbar-width: none;
//         }
//       `}</style>
//     </div>
//   );
// };

// export default HomePage;







import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import toast, { Toaster } from 'react-hot-toast';
import UserLoader from '@userpage-pages/UserLoader';
import Header from '@common/Header';
import Footer from '@common/Footer';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';

// Import reusable components
import ProductGridSection from '@common-sections/ProductGridSection';
import ProductCardSection from '@common-sections/ProductCardSection';
import PromoCarousel from '@common-sections/PromoCarousel';
import BannerSection from '@common-sections/BannerSection';

// Redux actions - Products
import { 
  fetchAllActiveProducts, 
  fetchAllCategories, 
  fetchHomeSections,
  clearProducts,
  clearCategories,
  clearHomeSections
} from '../../redux/slices/productSlice';

// Redux actions - Cart
import {
  getCart,
  addToCart,
  clearCart,
  removeFromCart,
  updateCartQuantity
} from '../../redux/slices/cartSlice';
import { decodeHtml } from "@helper";
import { allApi } from '@api/api';
import { API_CONSTANTS } from '@constants/apiurl';

const TILE_COLORS = ['#fef9c3','#dcfce7','#dbeafe','#fce7f3','#ede9fe','#ffedd5','#d1fae5','#fef3c7','#e0f2fe','#f3e8ff'];

function CategoryTabBar({ categories, activeCategoryId, onCategoryChange }) {
  const navigate = useNavigate();
  return (
    <div className="flex overflow-x-auto scrollbar-hide border-b border-gray-100">
      <div
        onClick={() => onCategoryChange ? onCategoryChange(null, null) : navigate('/')}
        className={`flex flex-col items-center gap-0.5 px-4 py-2 cursor-pointer flex-shrink-0 border-b-2 transition-colors ${
          !activeCategoryId ? 'border-[#0c831f] text-[#0c831f]' : 'border-transparent text-gray-500 hover:text-gray-800'
        }`}
      >
        <i className="ri-apps-line text-xl"></i>
        <span className="text-[11px] font-semibold whitespace-nowrap">All</span>
      </div>
      {categories.map((category) => {
        const categoryName = category.name || category.category?.name;
        const categoryId = category.id || category.category?.id;
        const imageUrl = category.image_url || category.category?.image_url;
        const isActive = activeCategoryId === categoryId;
        return (
          <div
            key={categoryId || categoryName}
            onClick={() => onCategoryChange ? onCategoryChange(categoryId, categoryName) : navigate(`/category?id=${categoryId}`)}
            className={`flex flex-col items-center gap-0.5 px-4 py-2 cursor-pointer flex-shrink-0 border-b-2 transition-colors ${
              isActive ? 'border-[#0c831f] text-[#0c831f]' : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {imageUrl ? (
              <img src={imageUrl} alt={categoryName} className="w-6 h-6 object-contain" loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            ) : (
              <i className={`${category.icon || 'ri-store-3-line'} text-xl`}></i>
            )}
            <span className="text-[11px] font-semibold whitespace-nowrap">{decodeHtml(categoryName)}</span>
          </div>
        );
      })}
    </div>
  );
}

function HomePage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Products Redux state
  const {
    products,
    categories,
    homeSections,
    loading: productsLoading,
    productsLoaded,
    error: productsError
  } = useSelector((state) => state.products);
  
  // Cart Redux state
  const { 
    items: cartItems,
    loading: cartLoading
  } = useSelector((state) => state.cart);
  
  // Auth state
  const { user, isAuthenticated: reduxIsAuthenticated } = useSelector((state) => state.auth);
  
  // UI-only local state
  const [carouselImages, setCarouselImages] = useState([]);
  const [headerBanner, setHeaderBanner] = useState(null);
  const [footerBanner, setFooterBanner] = useState(null);
  const [banners, setBanners] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [cartItemCount, setCartItemCount] = useState(0);
  const [addingToCart, setAddingToCart] = useState(false);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  
  // Infinite scroll state
  const [visibleCount, setVisibleCount] = useState(20);
  const loadMoreRef = useRef(null);

  // Active category filter (sidebar / tab bar)
  const [activeCategoryId, setActiveCategoryId] = useState(null);
  const [activeCategoryName, setActiveCategoryName] = useState(null);

  // Filtered + visible products — declared early so useEffect dep arrays can reference them
  const filteredProducts = activeCategoryName
    ? products.filter(p => p.category_name === activeCategoryName)
    : products;
  const currentProducts = filteredProducts.slice(0, visibleCount);

  // Selected variant index per product for the All Products grid
  const [selectedVariants, setSelectedVariants] = useState({});

  // Check if user is logged in from localStorage (most reliable)
 const checkUserLoginStatus = () => {
  try {
    const userDetails = localStorage.getItem('userDetails');

    if (!userDetails) {
      setIsUserLoggedIn(false);
      return false;
    }

    const parsedUser = JSON.parse(userDetails);

    if (parsedUser && parsedUser.id) {
      setIsUserLoggedIn(true);
      return true;
    }

    setIsUserLoggedIn(false);
    return false;
  } catch (error) {
    console.error("Error checking login status:", error);
    setIsUserLoggedIn(false);
    return false;
  }
};

  // Get current user ID from localStorage
  const getCurrentUserId = () => {
    try {
      const userDetails = localStorage.getItem('userDetails');
      if (userDetails) {
        const parsedUser = JSON.parse(userDetails);
        return parsedUser?.id || parsedUser?.user?.id;
      }
      return user?.id || null;
    } catch (error) {
      return null;
    }
  };

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
      icon: '✅',
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

  const showInfoToast = (message) => {
    toast(message, {
      duration: 3000,
      position: 'top-center',
      style: {
        background: '#2196F3',
        color: '#fff',
        fontSize: '16px',
        padding: '16px',
        borderRadius: '12px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
      },
      icon: 'ℹ️',
    });
  };

  // Update cart count when cart items change
  useEffect(() => {
    if (cartItems && cartItems.length > 0) {
      setCartItemCount(cartItems.length);
    } else {
      setCartItemCount(0);
    }
  }, [cartItems]);

  // Check login status on mount
  useEffect(() => {
    checkUserLoginStatus();
  }, []);

  // Fetch cart data
  const fetchCartData = async () => {
    const userId = getCurrentUserId();
    const isLoggedIn = checkUserLoginStatus();
    
    if (userId && isLoggedIn) {
      try {
        await dispatch(getCart()).unwrap();
      } catch (error) {
        console.error("Error fetching cart:", error);
      }
    }
  };

  // Add to cart handler
const handleAddToCart = async (product) => {
  const isLoggedIn = checkUserLoginStatus();

  if (!isLoggedIn) {
    showInfoToast("Please login first");
    navigate('/sign-in');
    return;
  }

  try {
    const userId = getCurrentUserId();

    const productVariantId =
      product?.variants?.[0]?.productVariantId ||
      product?.variants?.[0]?.id ||
      product?.product_variants?.[0]?.id;

    if (!productVariantId) {
      console.log("❌ PRODUCT DATA:", product);
      showErrorToast("Variant not found");
      return;
    }

    const selectedWeight = product?.variants?.[0]?.weight || null;
    await dispatch(addToCart({
      user_id: userId,
      product_variant_id: productVariantId,
      quantity: 1,
      selected_weight: selectedWeight
    })).unwrap();

    showSuccessToast("Item added to cart");
    await dispatch(getCart()).unwrap();

  } catch (err) {
    showErrorToast(err);
  }
};

  // Fetch all data using Redux
  useEffect(() => {
    dispatch(fetchAllActiveProducts());
    dispatch(fetchAllCategories());
    dispatch(fetchHomeSections());
    allApi.get(API_CONSTANTS.BANNERS_GET).then(res => {
      if (res.data?.banners?.length > 0) {
        setBanners(res.data.banners.map(b => ({ url: b.logo })));
      }
    }).catch(() => {});

    return () => {
      dispatch(clearProducts());
      dispatch(clearCategories());
      dispatch(clearHomeSections());
      dispatch(clearCart());
    };
  }, [dispatch]);

  // Re-fetch products when user changes delivery location (new branch → new stock)
  useEffect(() => {
    const handleLocationChange = () => {
      dispatch(fetchAllActiveProducts());
    };
    window.addEventListener('userLocationChanged', handleLocationChange);
    return () => window.removeEventListener('userLocationChanged', handleLocationChange);
  }, [dispatch]);

  // Reset visible count when products or active category changes
  useEffect(() => {
    setVisibleCount(20);
  }, [products, activeCategoryId]);

  // Fetch cart data when component mounts and user is logged in
  useEffect(() => {
    if (isUserLoggedIn) {
      fetchCartData();
    }
  }, [isUserLoggedIn]);

  // Process home sections to extract settings
  useEffect(() => {
    if (homeSections && homeSections.length > 0) {
      const settingsSection = homeSections.find(section => section.key === 'settings');
      if (settingsSection) {
        if (settingsSection.header_banner) setHeaderBanner(settingsSection.header_banner);
        if (settingsSection.footer_banner) setFooterBanner(settingsSection.footer_banner);
        if (settingsSection.carousel_images) setCarouselImages(settingsSection.carousel_images);
      }
    }
  }, [homeSections]);

  // Infinite scroll — load 20 more when sentinel enters viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount(prev => Math.min(prev + 20, filteredProducts.length));
        }
      },
      { threshold: 0.1 }
    );
    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [filteredProducts.length]);

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const handleProductClick = (product) => {
    const productSlug = product.slug || product.name?.toLowerCase().replace(/\s+/g, '-') || product.id;
    navigate(`/product/${productSlug}`, {
      state: {
        id: product.id,
        image_url: product.image_url,
        name: product.name,
        description: product.description,
        sub_category_id: product.sub_category_id,
        category_name: product.category_name,
        variants: product.variants || [],
        product_variants: product.product_variants || []
      }
    });
  };

  const getSectionByKey = (key) => {
    return homeSections.find(section => section.key === key);
  };

  const renderProductGridSection = (sectionKey, promoAfter = false, mobileColumns = 3) => {
    const section = getSectionByKey(sectionKey);
    if (!section || !section.products || section.products.length === 0) return null;

    const productsWithCart = section.products.map(product => ({
      ...product,
      onAddToCart: () => handleAddToCart(product)
    }));

    return (
      <>
        <ProductGridSection 
          title={section.name} 
          products={productsWithCart} 
          onProductClick={handleProductClick}
          mobileColumns={mobileColumns}
        />
        {promoAfter}
      </>
    );
  };

  const renderBreadSection = () => {
    const section = getSectionByKey('evening_meal');
    if (!section || !section.products || section.products.length === 0) return null;

    return (
      <section className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">{decodeHtml(section.name)}</h2>
          <button
            onClick={() => navigate('/products')}
            className="text-sm text-yellow-600 hover:text-yellow-700 font-medium"
          >
            See All
          </button>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-4">
          {section.products.slice(0, 6).map((product) => {
            const imageUrl = product.image_url || product.thumbnail_url || '';
            return (
              <div
                key={product.id}
                onClick={() => handleProductClick(product)}
                className="cursor-pointer hover:opacity-90 transition-all"
              >
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-t-2xl p-2 md:p-6 h-20 md:h-40 flex items-center justify-center relative">
                  <i className="ri-store-line text-2xl md:text-5xl text-gray-400 absolute"></i>
                  {imageUrl && (
                    <img
                      src={imageUrl}
                      alt={product.name}
                      className="relative z-10 w-full h-full object-contain"
                      loading="lazy"
                      decoding="async"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  )}
                  <div className="absolute -bottom-3 md:-bottom-6 left-1/2 transform -translate-x-1/2 bg-white rounded-full w-6 h-6 md:w-12 md:h-12 flex items-center justify-center shadow-lg border-2 md:border-3 border-yellow-400">
                    <span className="text-[8px] md:text-sm font-bold text-gray-700">
                      {product.name ? decodeHtml(product.name).substring(0, 2).toUpperCase() : 'BR'}
                    </span>
                  </div>
                </div>
                <div className="bg-[#FFB700] rounded-b-2xl p-1.5 md:p-4 pt-4 md:pt-8 text-center flex flex-col items-center justify-center h-16 md:h-32">
                  <h3 className="text-[9px] md:text-[11px] font-bold text-gray-900 mb-0.5 md:mb-1 line-clamp-2 px-1">{decodeHtml(product.name)}</h3>
                  <p className="text-[8px] md:text-[9px] text-gray-700 font-medium">Shop Now</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    );
  };

  const renderChefRecommendation = () => {
    const section = getSectionByKey('chef_recommendation');
    if (!section || !section.products || section.products.length === 0) return null;

    return (
      <section className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">{decodeHtml(section.name)}</h2>
          <button
            onClick={() => navigate('/products')}
            className="text-sm text-yellow-600 hover:text-yellow-700 font-medium"
          >
            See All
          </button>
        </div>
        <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-2 md:gap-3">
          {section.products.slice(0, 12).map((product) => {
            const imageUrl = product.image_url || product.thumbnail_url || '';
            return (
              <div
                key={product.id}
                onClick={() => handleProductClick(product)}
                className="overflow-hidden cursor-pointer transition-all p-2 md:p-3"
              >
                <div className="relative mb-1 md:mb-2 w-full h-16 md:h-24 bg-gray-100 flex items-center justify-center">
                  <i className="ri-image-line text-xl md:text-2xl text-gray-300 absolute"></i>
                  {imageUrl && (
                    <img
                      src={imageUrl}
                      alt={product.name}
                      className="relative z-10 w-full h-full object-contain"
                      loading="lazy"
                      decoding="async"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    );
  };

  const renderCardSection = (sectionKey, icon) => {
    const section = getSectionByKey(sectionKey);
    if (!section || !section.products || section.products.length === 0) return null;

    const formattedProducts = section.products.map(product => {
      const firstVariant = product.variants && product.variants.length > 0 ? product.variants[0] : null;
      
      return {
        id: product.id,
        name: product.name,
        weight: firstVariant?.weight || 'N/A',
        price: firstVariant?.selling_price || firstVariant?.price || 0,
        originalPrice: firstVariant?.mrp || (firstVariant?.price * 1.2) || 0,
        discount: firstVariant?.mrp && firstVariant?.price
          ? Math.round(((firstVariant.mrp - firstVariant.price) / firstVariant.mrp) * 100)
          : 0,
        image: product.image_url || product.thumbnail_url || '',
        originalProduct: product,
        onAddToCart: () => handleAddToCart(product)
      };
    });

    const handleCardClick = (formattedProduct) => {
      handleProductClick(formattedProduct.originalProduct);
    };

    return (
      <ProductCardSection 
        title={section.name} 
        products={formattedProducts} 
        icon={icon}
        onProductClick={handleCardClick}
      />
    );
  };

  // Loading state
  if (productsLoading || cartLoading) {
    return <UserLoader />;
  }

  // Error state
  if (productsError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header onSearch={handleSearch} />
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="text-red-600 text-xl mb-4">Error loading data</div>
          <p className="text-gray-600">{typeof productsError === 'string' ? productsError : 'Please try again later'}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 bg-[#0c831f] text-white px-6 py-2 rounded-xl font-semibold"
          >
            Retry
          </button>
        </div>
        <Footer data={[]} />
      </div>
    );
  }

  // Check content availability
  const hasCategories = categories && categories.length > 0;
  const hasProducts = products && products.length > 0;
  const hasSections = homeSections && homeSections.length > 0;
  const hasProductsInSections = homeSections.some(section => section.products && section.products.length > 0);
  const showDefaultProductGrid = hasProducts && !hasProductsInSections;

  // Empty state — only after products have actually been fetched
  if (productsLoaded && !hasProducts && !hasSections) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header onSearch={handleSearch} />
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mb-6">
            <i className="ri-store-3-line text-6xl text-gray-400"></i>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">No Products Available</h2>
          <p className="text-gray-600 mb-6">We're currently updating our site. Please check back later.</p>
          <button onClick={() => window.location.reload()} className="bg-[#0c831f] text-white px-6 py-3 rounded-xl font-semibold">
            Refresh Page
          </button>
        </div>
        <Footer data={[]} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
      
      <Header onSearch={handleSearch} />
      
      <main className="pt-[160px] md:pt-20 pb-20 md:pb-8 bg-white">

        {/* Mobile sticky category tab bar — navigates to category page */}
        {hasCategories && (
          <div className="md:hidden sticky top-[100px] z-30 bg-white border-b border-gray-100 shadow-sm">
            <CategoryTabBar
              categories={categories}
              activeCategoryId={null}
            />
          </div>
        )}

        {/* ── HOMEPAGE VIEW: Blinkit-style full width ── */}
        <div className="px-3 md:px-6">

          {/* Desktop category tab bar — navigates to category page */}
          {hasCategories && (
            <div className="hidden md:block mb-4 mt-2">
              <CategoryTabBar
                categories={categories}
                activeCategoryId={null}
              />
            </div>
          )}

            {/* Hero banner */}
            <div className="mb-4">
              {banners.length > 0 ? (
                <PromoCarousel images={banners} />
              ) : headerBanner ? (
                <BannerSection image={headerBanner} alt="Header Banner" className="rounded-2xl overflow-hidden" />
              ) : (
                <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-[#0c831f] to-[#15803d] h-44 md:h-60 flex items-center px-6 md:px-10 relative">
                  <div className="z-10 max-w-xs md:max-w-sm">
                    <h2 className="text-white text-xl md:text-3xl font-bold mb-1 md:mb-2 leading-tight">Stock up on daily essentials</h2>
                    <p className="text-green-100 text-xs md:text-sm mb-3 md:mb-4">Get fresh groceries delivered fast to your door</p>
                    <button onClick={() => window.scrollTo({ top: 600, behavior: 'smooth' })} className="bg-white text-[#0c831f] font-bold px-5 py-2 rounded-xl text-sm hover:bg-green-50 transition">
                      Shop Now
                    </button>
                  </div>
                  <div className="absolute right-4 md:right-10 top-0 h-full flex items-center opacity-30 md:opacity-50">
                    <i className="ri-shopping-basket-2-fill text-white" style={{ fontSize: '8rem' }}></i>
                  </div>
                </div>
              )}
            </div>

            {/* 4 colorful promo cards */}
            {hasCategories && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {categories.slice(0, 4).map((category, i) => {
                  const categoryName = category.name || category.category?.name;
                  const categoryId = category.id || category.category?.id;
                  const catProducts = products.filter(p => p.category_name === categoryName);
                  const categoryImg = category.image_url || category.category?.image_url;
                  const featuredImg = categoryImg || catProducts.find(p => p.image_url)?.image_url;
                  const PROMO_BG = ['#1c60ff', '#0ea5e9', '#f59e0b', '#e2e8f0'];
                  const PROMO_TEXT = ['#ffffff', '#ffffff', '#1e293b', '#1e293b'];
                  const bg = PROMO_BG[i % PROMO_BG.length];
                  const textColor = PROMO_TEXT[i % PROMO_TEXT.length];
                  return (
                    <div
                      key={categoryId || categoryName}
                      onClick={() => navigate(`/category?id=${categoryId}`)}
                      className="rounded-2xl p-4 cursor-pointer relative overflow-hidden h-36 md:h-44 flex flex-col justify-between hover:opacity-95 active:scale-[.98] transition-all"
                      style={{ backgroundColor: bg }}
                    >
                      <div className="relative z-10">
                        <p className="font-bold text-sm md:text-base leading-tight pr-16" style={{ color: textColor }}>{decodeHtml(categoryName)}</p>
                        <p className="text-xs mt-1 opacity-70 pr-16" style={{ color: textColor }}>{catProducts.length} items available</p>
                      </div>
                      <button
                        className="w-fit bg-white text-gray-900 text-xs font-bold px-3 py-1.5 rounded-full hover:bg-gray-100 transition relative z-10"
                        onClick={(e) => { e.stopPropagation(); navigate(`/category?id=${categoryId}`); }}
                      >
                        Order Now
                      </button>
                      {featuredImg ? (
                        <img
                          src={featuredImg}
                          alt={categoryName}
                          className="absolute right-1 bottom-0 h-24 md:h-32 w-24 md:w-32 object-contain"
                          loading="lazy"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : (
                        <i className={`${category.icon || category.category?.icon || 'ri-store-3-line'} absolute right-4 bottom-4 text-6xl md:text-7xl opacity-20`} style={{ color: textColor }}></i>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* All Products grid */}
            {showDefaultProductGrid && (
              <section className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base md:text-lg font-bold text-gray-900">All Products</h2>
                  <span className="text-sm text-gray-400">{products.length} items</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3">
                  {currentProducts.map((product) => {
                    const hasMultipleVariants = product.variants?.length > 1;
                    const inStockVariants = product.variants?.filter(v => v.in_stock !== false) || [];
                    const allOutOfStock = inStockVariants.length === 0;
                    const selectedIdx = selectedVariants[product.id] ?? 0;
                    const activeVariant = product.variants?.[selectedIdx] || product.variants?.[0];
                    const displayPrice = activeVariant?.discountedPrice || activeVariant?.actualPrice || activeVariant?.price || 0;
                    return (
                      <div key={product.id} onClick={() => handleProductClick(product)} className="bg-white rounded-2xl border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md transition-shadow flex flex-col">
                        <div className="aspect-square bg-gray-50 flex items-center justify-center p-3 relative">
                          <i className="ri-image-line text-3xl text-gray-200 absolute"></i>
                          {product.image_url && (<img src={product.image_url} alt={product.name} className="relative z-10 w-full h-full object-contain" loading="lazy" decoding="async" onError={(e) => { e.currentTarget.style.display='none'; }} />)}
                          {activeVariant?.discountedPrice > 0 && activeVariant?.actualPrice > activeVariant.discountedPrice && (
                            <div className="absolute top-2 left-2 bg-[#0c831f] text-white text-[9px] font-bold px-1.5 py-0.5 rounded z-20">
                              {Math.round((1 - activeVariant.discountedPrice / activeVariant.actualPrice) * 100)}% OFF
                            </div>
                          )}
                        </div>
                        <div className="p-2.5 flex flex-col flex-1">
                          <h3 className="font-semibold text-gray-800 text-xs line-clamp-2 leading-tight">{product.name}</h3>
                          {activeVariant?.weight && (<p className="text-[10px] text-gray-400 mt-0.5">{activeVariant.net_weight > 0 ? `${activeVariant.net_weight} ${activeVariant.weight}` : activeVariant.weight}</p>)}
                          <div className="flex items-center justify-between mt-auto pt-2">
                            <div>
                              <p className="text-sm font-bold text-gray-900">₹{displayPrice}</p>
                              {activeVariant?.actualPrice > displayPrice && (<p className="text-[10px] text-gray-400 line-through">₹{activeVariant.actualPrice}</p>)}
                            </div>
                            {(() => {
                              if (allOutOfStock || activeVariant?.in_stock === false) {
                                return (<span className="text-[10px] text-gray-400 font-medium">Out of stock</span>);
                              }
                              const cartItem = cartItems?.find(ci => ci.product_variant_id === activeVariant?.productVariantId);
                              if (cartItem) {
                                return (
                                  <div className="flex items-center gap-2 bg-[#0c831f] rounded-lg px-2 py-1">
                                    <button onClick={(e) => { e.stopPropagation(); if (cartItem.quantity <= 1) { dispatch(removeFromCart({ cartItemId: cartItem.cart_item_id })).then(() => dispatch(getCart())); } else { dispatch(updateCartQuantity({ cartItemId: cartItem.cart_item_id, productId: cartItem.product_id, weight: cartItem.weight, quantity: cartItem.quantity - 1 })).then(() => dispatch(getCart())); } }} className="text-white font-bold text-sm leading-none">−</button>
                                    <span className="text-white font-bold text-xs">{cartItem.quantity}</span>
                                    <button onClick={(e) => { e.stopPropagation(); dispatch(updateCartQuantity({ cartItemId: cartItem.cart_item_id, productId: cartItem.product_id, weight: cartItem.weight, quantity: cartItem.quantity + 1 })).then(() => dispatch(getCart())); }} className="text-white font-bold text-sm leading-none">+</button>
                                  </div>
                                );
                              }
                              return (
                                <button onClick={(e) => { e.stopPropagation(); handleAddToCart({ ...product, variants: [activeVariant, ...(product.variants || [])] }); }} disabled={addingToCart} className="bg-white border-2 border-[#0c831f] text-[#0c831f] font-bold text-lg w-8 h-8 rounded-lg flex items-center justify-center hover:bg-green-50 transition disabled:opacity-50">+</button>
                              );
                            })()}
                          </div>
                          {hasMultipleVariants && (
                            <select className="mt-1.5 w-full border border-gray-200 rounded-md text-[10px] py-0.5 px-1 bg-white text-gray-600 focus:outline-none focus:border-green-500" value={selectedIdx} onClick={(e) => e.stopPropagation()} onChange={(e) => { e.stopPropagation(); setSelectedVariants(prev => ({ ...prev, [product.id]: Number(e.target.value) })); }}>
                              {product.variants.map((v, i) => (<option key={v.productVariantId} value={i} disabled={v.in_stock === false}>{v.weight || `Variant ${i+1}`}{v.in_stock === false ? ' (OOS)' : ''}</option>))}
                            </select>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {visibleCount < filteredProducts.length && (
                  <div ref={loadMoreRef} className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0c831f]"></div>
                  </div>
                )}
              </section>
            )}

            <BannerSection image={footerBanner} alt="Footer Banner" className="hidden md:block mb-4" />
          </div>

      </main>

      {/* Floating View Cart Button - Mobile Only */}
      {cartItemCount > 0 && (
        <div className="md:hidden fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50 w-[40%] max-w-xs">
          <button
            onClick={() => navigate('/view-cart')}
            className="w-full bg-[#0c831f] text-white rounded-full font-bold shadow-lg flex items-center justify-between hover:bg-green-800 transition-all px-4 py-2.5"
          >
            <div className="flex flex-col items-start">
              <span className="text-sm font-bold">View cart</span>
              <span className="text-xs font-semibold">
                {cartItemCount} ITEM{cartItemCount > 1 ? 'S' : ''}
              </span>
            </div>
            <div className="w-9 h-9 bg-green-700 rounded-full flex items-center justify-center flex-shrink-0">
              <i className="ri-arrow-right-line text-lg text-gray-900"></i>
            </div>
          </button>
        </div>
      )}

      <Footer data={[]} />

      <style jsx="true">{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

export default HomePage;