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
//                       {product.name ? product.name.substring(0, 2).toUpperCase() : 'BR'}
//                     </span>
//                   </div>
//                 </div>
//                 <div className="bg-[#FFB700] rounded-b-2xl p-1.5 md:p-4 pt-4 md:pt-8 text-center flex flex-col items-center justify-center h-16 md:h-32">
//                   <h3 className="text-[9px] md:text-[11px] font-bold text-gray-900 mb-0.5 md:mb-1 line-clamp-2 px-1">{product.name}</h3>
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
//                 className="bg-yellow-400 text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-yellow-500 transition-colors flex items-center gap-2"
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
//                       <div className="w-14 h-14 bg-yellow-400 rounded-xl flex items-center justify-center shadow-sm border-2 border-yellow-500">
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
//                       <div className="w-10 h-10 bg-yellow-400 rounded-md flex items-center justify-center shadow-sm flex-shrink-0">
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
//             className="w-full bg-[#FFC107] text-gray-900 rounded-full font-bold shadow-lg flex items-center justify-between hover:bg-yellow-500 transition-all px-4 py-2.5"
//           >
//             <div className="flex flex-col items-start">
//               <span className="text-sm font-bold">View cart</span>
//               <span className="text-xs font-semibold">
//                 {cartItemCount} ITEM{cartItemCount > 1 ? 'S' : ''}
//               </span>
//             </div>
//             <div className="w-9 h-9 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0">
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
//               className="w-full bg-yellow-400 text-gray-900 py-3 rounded-lg font-bold hover:bg-yellow-500 transition-colors"
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
//                       {product.name ? product.name.substring(0, 2).toUpperCase() : 'BR'}
//                     </span>
//                   </div>
//                 </div>
//                 <div className="bg-[#FFB700] rounded-b-2xl p-1.5 md:p-4 pt-4 md:pt-8 text-center flex flex-col items-center justify-center h-16 md:h-32">
//                   <h3 className="text-[9px] md:text-[11px] font-bold text-gray-900 mb-0.5 md:mb-1 line-clamp-2 px-1">{product.name}</h3>
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
//             className="mt-4 bg-yellow-400 text-gray-900 px-6 py-2 rounded"
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
//           <button onClick={() => window.location.reload()} className="bg-yellow-400 text-gray-900 px-6 py-3 rounded-lg">
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
//                         <div className="w-14 h-14 bg-yellow-400 rounded-xl flex items-center justify-center shadow-sm border-2 border-yellow-500">
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
//                         <div className="w-10 h-10 bg-yellow-400 rounded-md flex items-center justify-center shadow-sm flex-shrink-0">
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
//                         className="mt-2 w-full bg-yellow-400 text-gray-900 py-1.5 rounded-md text-sm font-semibold hover:bg-yellow-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
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
//             className="w-full bg-[#FFC107] text-gray-900 rounded-full font-bold shadow-lg flex items-center justify-between hover:bg-yellow-500 transition-all px-4 py-2.5"
//           >
//             <div className="flex flex-col items-start">
//               <span className="text-sm font-bold">View cart</span>
//               <span className="text-xs font-semibold">
//                 {cartItemCount} ITEM{cartItemCount > 1 ? 'S' : ''}
//               </span>
//             </div>
//             <div className="w-9 h-9 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0">
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







import { useState, useEffect } from 'react';
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
  clearCart
} from '../../redux/slices/cartSlice';

const HomePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Products Redux state
  const { 
    products, 
    categories, 
    homeSections,
    loading: productsLoading,
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
  const [searchQuery, setSearchQuery] = useState('');
  const [cartItemCount, setCartItemCount] = useState(0);
  const [addingToCart, setAddingToCart] = useState(false);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 8; // Show 8 products per page (4 per row in desktop, 2 per row in mobile)

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

    await dispatch(addToCart({
      user_id: userId,
      product_variant_id: productVariantId,
      quantity: 1
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
    
    return () => {
      dispatch(clearProducts());
      dispatch(clearCategories());
      dispatch(clearHomeSections());
      dispatch(clearCart());
    };
  }, [dispatch]);

  // Reset to page 1 when products change
  useEffect(() => {
    setCurrentPage(1);
  }, [products]);

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
          <h2 className="text-xl font-bold text-gray-900">{section.name}</h2>
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
                  {imageUrl ? (
                    <img 
                      src={imageUrl} 
                      alt={product.name} 
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <i className="ri-store-line text-2xl md:text-5xl text-gray-400"></i>
                    </div>
                  )}
                  <div className="absolute -bottom-3 md:-bottom-6 left-1/2 transform -translate-x-1/2 bg-white rounded-full w-6 h-6 md:w-12 md:h-12 flex items-center justify-center shadow-lg border-2 md:border-3 border-yellow-400">
                    <span className="text-[8px] md:text-sm font-bold text-gray-700">
                      {product.name ? product.name.substring(0, 2).toUpperCase() : 'BR'}
                    </span>
                  </div>
                </div>
                <div className="bg-[#FFB700] rounded-b-2xl p-1.5 md:p-4 pt-4 md:pt-8 text-center flex flex-col items-center justify-center h-16 md:h-32">
                  <h3 className="text-[9px] md:text-[11px] font-bold text-gray-900 mb-0.5 md:mb-1 line-clamp-2 px-1">{product.name}</h3>
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
          <h2 className="text-xl font-bold text-gray-900">{section.name}</h2>
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
                <div className="relative mb-1 md:mb-2">
                  {imageUrl ? (
                    <img 
                      src={imageUrl} 
                      alt={product.name} 
                      className="w-full h-16 md:h-24 object-contain"
                    />
                  ) : (
                    <div className="w-full h-16 md:h-24 bg-gray-100 flex items-center justify-center">
                      <i className="ri-image-line text-xl md:text-2xl text-gray-300"></i>
                    </div>
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
            className="mt-4 bg-yellow-400 text-gray-900 px-6 py-2 rounded"
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

  // Pagination calculations
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = products.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(products.length / productsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    // Scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Empty state
  if (!hasProducts && !hasSections) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header onSearch={handleSearch} />
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mb-6">
            <i className="ri-store-3-line text-6xl text-gray-400"></i>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">No Products Available</h2>
          <p className="text-gray-600 mb-6">We're currently updating our site. Please check back later.</p>
          <button onClick={() => window.location.reload()} className="bg-yellow-400 text-gray-900 px-6 py-3 rounded-lg">
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
      
      <main className="pt-[160px] md:pt-20 pb-20 md:pb-8">
        <div className="max-w-[1320px] mx-auto px-4">
          
          {/* Debug Info Panel */}
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-xs">
              <p className="font-semibold">Debug Info:</p>
              <p>✅ Products in Redux: {products?.length || 0}</p>
              <p>✅ Categories: {categories?.length || 0}</p>
              <p>✅ Home Sections: {homeSections?.length || 0}</p>
              <p>✅ Cart Items: {cartItems?.length || 0}</p>
              <p>✅ User Logged In: {isUserLoggedIn ? 'Yes' : 'No'}</p>
            </div>
          )}

          {/* Categories Bar */}
          {hasCategories && (
            <section className="mb-2 mt-2">
              <div className="py-3 px-0">
                <div className="md:hidden flex gap-4 overflow-x-auto pb-2 scrollbar-hide px-2">
                  {categories.slice(0, 10).map((category) => {
                    const categoryName = category.name || category.category?.name;
                    const categoryId = category.id || category.category?.id;
                    return (
                      <div
                        key={categoryId || categoryName}
                        onClick={() => navigate(`/category?id=${categoryId}`)}
                        className="flex flex-col items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
                      >
                        <div className="w-14 h-14 bg-yellow-400 rounded-xl flex items-center justify-center shadow-sm border-2 border-yellow-500">
                          <i className="ri-restaurant-line text-2xl text-gray-800"></i>
                        </div>
                        <span className="text-[10px] font-semibold text-gray-800 text-center leading-tight max-w-[60px]">
                          {categoryName}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="hidden md:flex gap-8 overflow-x-auto pb-2 scrollbar-hide justify-center items-center">
                  {categories.slice(0, 10).map((category) => {
                    const categoryName = category.name || category.category?.name;
                    const categoryId = category.id || category.category?.id;
                    return (
                      <div
                        key={categoryId || categoryName}
                        onClick={() => navigate(`/category?id=${categoryId}`)}
                        className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
                      >
                        <div className="w-10 h-10 bg-yellow-400 rounded-md flex items-center justify-center shadow-sm flex-shrink-0">
                          <i className="ri-restaurant-line text-xl text-gray-800"></i>
                        </div>
                        <span className="text-[10px] font-medium text-gray-800 whitespace-nowrap">
                          {categoryName}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          <BannerSection image={headerBanner} alt="Header Banner" className="hidden md:block" />

          {/* Default Product Grid with Pagination */}
          {showDefaultProductGrid && (
            <section className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">All Products</h2>
                <p className="text-sm text-gray-500">
                  Showing {indexOfFirstProduct + 1} to {Math.min(indexOfLastProduct, products.length)} of {products.length} products
                </p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
                {currentProducts.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => handleProductClick(product)}
                    className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                  >
                    <div className="aspect-square bg-gray-100 flex items-center justify-center p-4">
                      {product.image_url ? (
                        <img 
                          src={product.image_url} 
                          alt={product.name} 
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <i className="ri-image-line text-4xl text-gray-400"></i>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="font-semibold text-gray-800 text-sm line-clamp-2">{product.name}</h3>
                      {product.variants && product.variants[0] && (
                        <p className="text-lg font-bold text-green-600 mt-1">
                          ₹{product.variants[0].actualPrice || product.variants[0].price || 0}
                        </p>
                      )}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(product);
                        }}
                        disabled={addingToCart}
                        className="mt-2 w-full bg-yellow-400 text-gray-900 py-1.5 rounded-md text-sm font-semibold hover:bg-yellow-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {addingToCart ? (
                          <div className="flex items-center justify-center gap-1">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                            Adding...
                          </div>
                        ) : (
                          'Add to Cart'
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      currentPage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    ← Previous
                  </button>
                  
                  <div className="flex gap-1">
                    {(() => {
                      const pageNumbers = [];
                      const maxVisible = 5;
                      let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
                      let endPage = Math.min(totalPages, startPage + maxVisible - 1);
                      
                      if (endPage - startPage + 1 < maxVisible) {
                        startPage = Math.max(1, endPage - maxVisible + 1);
                      }
                      
                      if (startPage > 1) {
                        pageNumbers.push(
                          <button
                            key={1}
                            onClick={() => handlePageChange(1)}
                            className="w-10 h-10 rounded-md text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
                          >
                            1
                          </button>
                        );
                        if (startPage > 2) {
                          pageNumbers.push(<span key="dots1" className="px-2 text-gray-400">...</span>);
                        }
                      }
                      
                      for (let i = startPage; i <= endPage; i++) {
                        pageNumbers.push(
                          <button
                            key={i}
                            onClick={() => handlePageChange(i)}
                            className={`w-10 h-10 rounded-md text-sm font-medium transition-colors ${
                              currentPage === i
                                ? 'bg-yellow-400 text-gray-900 font-bold'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {i}
                          </button>
                        );
                      }
                      
                      if (endPage < totalPages) {
                        if (endPage < totalPages - 1) {
                          pageNumbers.push(<span key="dots2" className="px-2 text-gray-400">...</span>);
                        }
                        pageNumbers.push(
                          <button
                            key={totalPages}
                            onClick={() => handlePageChange(totalPages)}
                            className="w-10 h-10 rounded-md text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
                          >
                            {totalPages}
                          </button>
                        );
                      }
                      
                      return pageNumbers;
                    })()}
                  </div>
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      currentPage === totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Next →
                  </button>
                </div>
              )}
            </section>
          )}

          {/* Render sections normally */}
          {!showDefaultProductGrid && (
            <>
              {renderProductGridSection('order_our_best_food', false, 4)}
              {renderProductGridSection('explore_quick_caving', true)}
              {renderProductGridSection('starters_appetizers')}
              {renderProductGridSection('main_courses', true)}
              {renderCardSection('combo_meal_deals', 'ri-shopping-bag-line')}
              {renderCardSection('rice_biryani', 'ri-restaurant-line')}

              {carouselImages.length > 0 && (
                <div className="hidden md:block">
                  <PromoCarousel images={carouselImages} />
                </div>
              )}

              {renderBreadSection()}
              {renderCardSection('beverages', 'ri-cup-line')}
              {renderChefRecommendation()}
              {renderCardSection('deserts', 'ri-cake-3-line')}
            </>
          )}

          <BannerSection image={footerBanner} alt="Footer Banner" className="hidden md:block" />

        </div>
      </main>

      {/* Floating View Cart Button - Mobile Only */}
      {cartItemCount > 0 && (
        <div className="md:hidden fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50 w-[40%] max-w-xs">
          <button
            onClick={() => navigate('/view-cart')}
            className="w-full bg-[#FFC107] text-gray-900 rounded-full font-bold shadow-lg flex items-center justify-between hover:bg-yellow-500 transition-all px-4 py-2.5"
          >
            <div className="flex flex-col items-start">
              <span className="text-sm font-bold">View cart</span>
              <span className="text-xs font-semibold">
                {cartItemCount} ITEM{cartItemCount > 1 ? 'S' : ''}
              </span>
            </div>
            <div className="w-9 h-9 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0">
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
};

export default HomePage;