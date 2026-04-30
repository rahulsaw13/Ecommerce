import { useLayoutEffect, useState, useEffect } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from "react-i18next";

// Components
import Header from "@common/Header";
import Footer from "@common/Footer";
import CustomerReview from "@userpage-pages/CustomerReview";
import { allApi, allApiWithHeaderToken } from "@api/api";
import { API_CONSTANTS } from "@constants/apiurl";
import UserLoader from '@userpage-pages/UserLoader';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart as reduxAddToCart, getCart } from '../../redux/slices/cartSlice';

const ProductDescription = () => {
  const location = useLocation();
  const { name: productSlug } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation("msg");
  
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector(state => state.auth);
  
  // State from navigation (if available)
  const stateData = location?.state || {};
  
  // Product data state
  const [product, setProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [loader, setLoader] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [overallRating, setOverallRating] = useState(0);
  const [footerRangeList, setFooterRangeList] = useState([]);
  const [productReviews, setProductReviews] = useState({
    rating: 0,
    overallReviews: 0
  });
  const [showProductDetails, setShowProductDetails] = useState(false);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [addingToCart, setAddingToCart] = useState(false);
  
  const cart = useSelector(state => state.cart?.items || []);
  
  // Check if current variant is already in cart
  const isAdded = cart.some(item => 
    (item.product_id === product?.id || item.product_id === product?.id?.toString()) && 
    (item.weight === selectedVariant?.weight || item.volume === selectedVariant?.weight)
  );

  const reviewData = (rating, overallReviews) => {
    setProductReviews({
      rating: rating,
      overallReviews: overallReviews
    });
  }

  // Normalize product variants to handle both API response formats
  const normalizeProductVariants = (productData) => {
    try {
      // Check if product has variants array (new API format)
      if (productData.variants && Array.isArray(productData.variants)) {
        console.log('Normalizing variants array:', productData.variants);
        return productData.variants.map((variant, index) => ({
          id: variant.product_id || `variant-${productData.id}-${index}`,
          product_id: variant.product_id || productData.id,
          weight: variant.weight || '',
          selling_price: variant.discountedPrice || 0,
          price: variant.discountedPrice || 0,
          mrp: variant.actualPrice || variant.discountedPrice || 0,
          shelf_life: productData.shelf_life || null,
          is_active: true
        }));
      }
      
      // Check if product has product_variants array (old format)
      if (productData.product_variants && Array.isArray(productData.product_variants)) {
        console.log('Using existing product_variants array');
        return productData.product_variants;
      }
      
      // No variants found
      console.warn('No variants found for product:', productData.name);
      return [];
    } catch (error) {
      console.error('Error normalizing product variants:', error, productData);
      return [];
    }
  };

  // Fetch product by slug
  const fetchProductBySlug = async () => {
    try {
      // Only show loader if we don't have product data yet
      if (!product) {
        setLoader(true);
      }
      
      const userDetails = JSON.parse(localStorage.getItem('userDetails'));
      const body = { user_id: userDetails?.id };
      const response = await allApi(API_CONSTANTS.ALL_PRODUCTS_URL, body, "post");
      
      if (response?.status === 200) {
        const products = response?.data?.products || response?.data || [];
        console.log("All products fetched:", products.length);
        console.log("Product IDs in response:", products.map(p => p.id));
        console.log("Looking for product ID:", stateData.id);
        
        // Find product by slug or name or ID
        let foundProduct = products.find(p => {
          const slug = p.slug || p.name?.toLowerCase().replace(/\s+/g, '-');
          return slug === productSlug;
        });
        
        // If not found by slug, try to find by ID from state
        if (!foundProduct && stateData.id) {
          foundProduct = products.find(p => p.id === stateData.id);
          console.log("Found product by ID:", foundProduct);
        }
        
        if (foundProduct) {
          console.log("Found complete product data:", foundProduct);
          console.log("Product sub_category_id:", foundProduct.sub_category_id);
          
          // Normalize variants
          const normalizedVariants = normalizeProductVariants(foundProduct);
          console.log("Normalized variants:", normalizedVariants);
          
          // Update product with complete data
          setProduct(prevProduct => {
            // Set first variant as default if not already set
            if (!selectedVariant && normalizedVariants.length > 0) {
              setSelectedVariant(normalizedVariants[0]);
            }
            
            return {
              ...prevProduct,
              ...foundProduct,
              product_variants: normalizedVariants
            };
          });
          
          // Get recommended products from same category
          if (foundProduct.sub_category_id) {
            const categoryProducts = products.filter(p => {
              const isSameCategory = p.sub_category_id === foundProduct.sub_category_id;
              const isDifferentProduct = p.id !== foundProduct.id;
              return isSameCategory && isDifferentProduct;
            }).slice(0, 6);
            
            console.log("Recommended products found:", categoryProducts.length);
            setRecommendedProducts(categoryProducts);
          } else {
            console.log("No sub_category_id, cannot fetch recommendations");
          }
        } else {
          console.log("Product not found in API response");
          console.log("This is OK - using state data. Recommendations won't be available.");
          // Product not in API response, but we have state data, so it's fine
          // Just won't have recommendations
        }
      }
    } catch (error) {
      console.error("Error fetching product:", error);
    } finally {
      setLoader(false);
    }
  };

  useEffect(() => {
    console.log("useEffect triggered, stateData:", stateData);
    console.log("State has sub_category_id:", stateData.sub_category_id);
    
    // If we have state data with ID, use it immediately and fetch for recommendations
    if (stateData.id) {
      console.log("Using state data:", stateData);
      
      // Normalize variants from state data
      const normalizedVariants = normalizeProductVariants(stateData);
      console.log("Normalized variants from state:", normalizedVariants);
      
      const productData = {
        id: stateData.id,
        name: stateData.name,
        image_url: stateData.image_url,
        sub_category_id: stateData.sub_category_id,
        category_name: stateData.category_name,
        description: stateData.description,
        shelf_life: stateData.shelf_life,
        product_variants: normalizedVariants
      };
      
      setProduct(productData);
      
      // Set first variant as default
      if (normalizedVariants.length > 0) {
        setSelectedVariant(normalizedVariants[0]);
      }
      
      setLoader(false);
      
      // If we have sub_category_id in state, fetch recommendations directly
      if (stateData.sub_category_id) {
        console.log("State has sub_category_id, fetching recommendations for category:", stateData.sub_category_id);
        fetchRecommendedProductsByCategory(stateData.sub_category_id, stateData.id);
      } else {
        console.log("No sub_category_id in state, trying API fetch");
        // Always fetch from API to get complete product data and recommendations
        fetchProductBySlug();
      }
    } else {
      // Otherwise fetch from API
      fetchProductBySlug();
    }
  }, [productSlug]);

  // Fetch recommended products by category ID
  const fetchRecommendedProductsByCategory = async (subCategoryId, currentProductId) => {
    try {
      const userDetails = JSON.parse(localStorage.getItem('userDetails'));
      const body = { user_id: userDetails?.id };
      const response = await allApi(API_CONSTANTS.ALL_PRODUCTS_URL, body, "post");
      
      if (response?.status === 200) {
        const products = response?.data?.products || response?.data || [];
        console.log("Fetching recommendations from", products.length, "products");
        console.log("Looking for sub_category_id:", subCategoryId);
        
        const categoryProducts = products.filter(p => {
          console.log(`Product ${p.name} (ID: ${p.id}): sub_category_id=${p.sub_category_id}`);
          const isSameCategory = p.sub_category_id === subCategoryId;
          const isDifferentProduct = p.id !== currentProductId;
          return isSameCategory && isDifferentProduct;
        }).slice(0, 6);
        
        console.log("Recommended products found:", categoryProducts.length, categoryProducts);
        setRecommendedProducts(categoryProducts);
      }
    } catch (error) {
      console.error("Error fetching recommended products:", error);
    }
  };

  useLayoutEffect(() => {
    fetchData();
  }, [product?.id]);

  const fetchData = async () => {
    if (!product?.id) return;
    
    const promises = [
      fetchMenuList(),
      getProductReview()
    ];
    await Promise.allSettled(promises);
  }

  const changeHandler = (variant) => {
    setSelectedVariant(variant);
  };

  const fetchMenuList = () => {
    return allApi(API_CONSTANTS.MENU_LIST_URL, "", "get")
      .then((response) => {
        if (response.status === 200) {
          let data = response?.data.filter((_, index) => index <= 6);
          setFooterRangeList(data);
        }
      })
      .catch(() => {})
      .finally(() => {});
  };

  const getProductReview = () => {
    if (!product?.id) return Promise.resolve();
    
    let data = {
      id: product.id
    }
    return allApi(API_CONSTANTS.PRODUCT_REVIEW_BY_ID_URL, data, "post")
      .then((response) => {
        if (response?.status === 200) {
          let averageRating = 0;
          response?.data?.forEach((item) => {
            averageRating = averageRating + item?.rating;
          });
          const roundedRating = Math.round(averageRating / response?.data?.length);
          setOverallRating(roundedRating);
          reviewData(roundedRating, response?.data?.length);
          setReviews(response?.data);
        }
      })
      .catch(() => {})
      .finally(() => {});
  };

  // Add to cart functionality
  const handleAddToCart = async () => {
    if (!selectedVariant) {
      alert("Please select a variant");
      return;
    }

    if (!isAuthenticated) {
      navigate('/sign-in');
      return;
    }
    
    if (isAdded) return;

    setAddingToCart(true);
    try {
      // Add to cart via Redux
      await dispatch(reduxAddToCart({ 
        product, 
        variant: selectedVariant, 
        quantity: 1 
      })).unwrap();
      
      // Refresh cart
      const cartResponse = await dispatch(getCart()).unwrap();
      window.dispatchEvent(new CustomEvent('cartUpdated', { detail: cartResponse.data?.items || cartResponse.items || cartResponse || [] }));
      
      console.log("Product added to cart successfully");
    } catch (error) {
      console.error("Error adding to cart:", error);
      alert(typeof error === 'string' ? error : error?.message || "Failed to add product to cart");
    } finally {
      setAddingToCart(false);
    }
  };

  if (loader) {
    return <UserLoader />;
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Product Not Found</h2>
          <p className="text-gray-600 mb-4">The product you're looking for doesn't exist.</p>
          <button 
            onClick={() => navigate('/')}
            className="bg-[#FFC107] text-gray-900 px-6 py-2 rounded-lg font-semibold"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  // Check if product has valid variants
  if (!product.product_variants || product.product_variants.length === 0) {
    console.warn(`Product ${product.name} has no valid variants`);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Price Unavailable</h2>
          <p className="text-gray-600 mb-4">Pricing information is not available for this product.</p>
          <button 
            onClick={() => navigate(-1)}
            className="bg-[#FFC107] text-gray-900 px-6 py-2 rounded-lg font-semibold"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const selectedMrp = parseFloat(selectedVariant?.mrp || 0);
  const selectedSellingPrice = parseFloat(selectedVariant?.selling_price || selectedVariant?.price || 0);
  const selectedDiscount = selectedMrp > selectedSellingPrice
    ? Math.round(((selectedMrp - selectedSellingPrice) / selectedMrp) * 100)
    : 0;

  return (
    <>
      {/* Simple Navigation Bar - Mobile Only */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white z-50 px-4 py-3 flex items-center justify-between shadow-sm">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 bg-[#FFC107] rounded-full flex items-center justify-center"
        >
          <i className="ri-arrow-left-line text-xl text-gray-900"></i>
        </button>
        <button className="w-10 h-10 bg-[#FFC107] rounded-full flex items-center justify-center">
          <i className="ri-search-line text-xl text-gray-900"></i>
        </button>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:block">
        <Header />
      </div>
      
      {/* Main Content */}
      <div className="pt-16 md:pt-24 pb-32 md:pb-0">
        {/* Desktop Layout */}
        <div className="hidden md:block max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column - Image */}
            <div>
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full rounded-lg object-cover"
              />
            </div>

            {/* Right Column - Product Details */}
            <div>
              {/* Product Name */}
              <h1 className="text-2xl font-bold text-gray-900 mb-2 uppercase">
                {product.name}
              </h1>

              {/* Rating */}
              {productReviews.overallReviews > 0 && (
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-500">⭐⭐⭐⭐⭐</span>
                    <span className="text-sm text-gray-600">({productReviews.overallReviews})</span>
                  </div>
                </div>
              )}

              {/* Price */}
              {selectedVariant && (
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-3xl font-bold text-gray-900">
                      ₹{selectedSellingPrice.toFixed(0)}
                    </span>
                    {selectedMrp > selectedSellingPrice && (
                      <>
                        <span className="text-lg text-gray-500 line-through">
                          MRP ₹{selectedMrp.toFixed(0)}
                        </span>
                        <span className="bg-[#FFC107] text-gray-900 text-sm font-bold px-3 py-1 rounded">
                          {selectedDiscount}% Off
                        </span>
                      </>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">Inclusive of all taxes</p>
                </div>
              )}

              {/* Select Unit Section */}
              <div className="mb-6">
                <h2 className="text-base font-semibold text-gray-900 mb-3">Select Unit</h2>
                <div className='flex gap-3 flex-wrap'>
                  {product.product_variants?.map((variant) => {
                    const isSelected = selectedVariant?.id === variant?.id;
                    const mrp = parseFloat(variant?.mrp || 0);
                    const sellingPrice = parseFloat(variant?.selling_price || variant?.price || 0);
                    const discount = mrp > sellingPrice
                      ? Math.round(((mrp - sellingPrice) / mrp) * 100)
                      : 0;
                    
                    return (
                      <div 
                        key={variant?.id} 
                        onClick={() => { changeHandler(variant) }}  
                        className={`relative hover:cursor-pointer rounded-xl overflow-hidden w-[120px] transition-all duration-300
                          ${isSelected ? 'bg-[#FFC107]' : 'bg-white border-2 border-[#FFC107]'}`}
                      >
                        {discount > 0 && (
                          <div 
                            className={`text-xs font-bold py-1.5 px-2 ${isSelected ? 'text-gray-900' : 'text-gray-900'}`}
                            style={{
                              background: isSelected 
                                ? 'rgba(255, 193, 7, 0.6)'
                                : '#FFC107'
                            }}
                          >
                            {discount} % OFF
                          </div>
                        )}
                        
                        <div className={`p-3 ${discount > 0 ? '' : 'pt-3'}`}>
                          <p className={`text-sm font-semibold mb-1.5 ${isSelected ? 'text-gray-900' : 'text-gray-500'}`}>
                            {variant?.weight}
                          </p>
                          <div className="flex items-center gap-1.5">
                            <span className={`text-base font-bold ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>
                              ₹{sellingPrice.toFixed(sellingPrice % 1 === 0 ? 0 : 1)}
                            </span>
                            {mrp > sellingPrice && (
                              <span className={`text-xs line-through ${isSelected ? 'text-gray-700' : 'text-gray-400'}`}>
                                MRP₹{mrp.toFixed(0)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Add to Cart Button - Desktop */}
              <button 
                onClick={handleAddToCart}
                disabled={!selectedVariant || selectedVariant.stock === 0 || isAdded || addingToCart}
                className={`w-full font-bold py-3 px-6 rounded-lg transition-all duration-300 text-base shadow-md mb-6 flex items-center justify-center gap-2 ${!selectedVariant || selectedVariant.stock === 0 || isAdded || addingToCart ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-[#FFC107] text-gray-900 hover:bg-[#E6A800]'}`}
              >
                {addingToCart ? (
                  <>
                    <i className="ri-loader-4-line animate-spin text-xl"></i>
                    Adding...
                  </>
                ) : isAdded ? (
                  <>
                    <i className="ri-check-line text-xl"></i>
                    Added to Cart
                  </>
                ) : (
                  <>
                    <i className="ri-shopping-cart-2-line text-xl"></i>
                    Add to Cart
                  </>
                )}
              </button>

              {/* View Product Details - Desktop */}
              <div className="border border-gray-300 rounded-lg mb-4">
                <button 
                  onClick={() => setShowProductDetails(!showProductDetails)}
                  className="w-full flex items-center justify-between p-4 text-left"
                >
                  <span className="text-[#FFC107] font-semibold text-base">View product details</span>
                  <i className={`ri-arrow-${showProductDetails ? 'up' : 'down'}-s-line text-[#FFC107] text-xl transition-transform duration-300`}></i>
                </button>
                
                {showProductDetails && (
                  <div className="px-4 pb-4 border-t border-gray-200 pt-4">
                    {product.description && (
                      <div className="mb-4">
                        <h3 className="text-base font-semibold text-gray-900 mb-2">Description</h3>
                        <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
                      </div>
                    )}
                    
                    {selectedVariant && (
                      <div className="mb-4">
                        <h3 className="text-base font-semibold text-gray-900 mb-2">Pricing Details</h3>
                        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Weight</span>
                            <span className="text-sm font-semibold text-gray-900">{selectedVariant.weight}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Selling Price</span>
                            <span className="text-sm font-semibold text-gray-900">₹{selectedSellingPrice.toFixed(2)}</span>
                          </div>
                          {selectedMrp > selectedSellingPrice && (
                            <>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">MRP</span>
                                <span className="text-sm text-gray-500 line-through">₹{selectedMrp.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">You Save</span>
                                <span className="text-sm font-semibold text-green-600">₹{(selectedMrp - selectedSellingPrice).toFixed(2)} ({selectedDiscount}%)</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {product.product_variants && product.product_variants.length > 1 && (
                      <div>
                        <h3 className="text-base font-semibold text-gray-900 mb-2">Available Units</h3>
                        <div className="space-y-2">
                          {product.product_variants.map((variant) => {
                            const mrp = parseFloat(variant?.mrp || 0);
                            const sellingPrice = parseFloat(variant?.selling_price || variant?.price || 0);
                            const discount = mrp > sellingPrice
                              ? Math.round(((mrp - sellingPrice) / mrp) * 100)
                              : 0;
                            
                            return (
                              <div key={variant.id} className="flex justify-between items-center bg-gray-50 rounded p-3">
                                <span className="text-sm font-medium text-gray-700">{variant.weight}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-gray-900">₹{sellingPrice.toFixed(0)}</span>
                                  {mrp > sellingPrice && (
                                    <>
                                      <span className="text-xs text-gray-500 line-through">₹{mrp.toFixed(0)}</span>
                                      <span className="text-xs font-bold text-green-600">{discount}% off</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Category Navigation - Desktop */}
              {product.category_name && (
                <div 
                  onClick={() => {
                    navigate(`/category?id=${encodeURIComponent(product.category_name)}`);
                  }}
                  className="border border-gray-200 rounded-lg p-4 flex items-center justify-between bg-white cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#FFC107] rounded-lg flex items-center justify-center flex-shrink-0">
                      <i className="ri-shopping-basket-line text-xl text-gray-900"></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-bold text-gray-900">{product.category_name}</p>
                      <p className="text-sm text-gray-500">Explore all products</p>
                    </div>
                  </div>
                  <i className="ri-arrow-right-s-line text-2xl text-gray-400 flex-shrink-0"></i>
                </div>
              )}
            </div>
          </div>

          {/* Recommended Products - Desktop */}
          {recommendedProducts.length > 0 && (
            <div className="mt-12">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Recommended Products</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {recommendedProducts.map((recProduct) => {
                  const firstVariant = recProduct.product_variants?.[0];
                  const recMrp = parseFloat(firstVariant?.mrp || 0);
                  const recSellingPrice = parseFloat(firstVariant?.selling_price || firstVariant?.price || 0);
                  const recDiscount = recMrp > recSellingPrice
                    ? Math.round(((recMrp - recSellingPrice) / recMrp) * 100)
                    : 0;
                  
                  return (
                    <div 
                      key={recProduct.id}
                      onClick={() => {
                        const slug = recProduct.slug || recProduct.name?.toLowerCase().replace(/\s+/g, '-');
                        navigate(`/product/${slug}`, { state: recProduct });
                      }}
                      className="bg-white border rounded-lg p-3 cursor-pointer hover:shadow-lg transition-shadow"
                    >
                      <div className="relative mb-2">
                        <img 
                          src={recProduct.image_url} 
                          alt={recProduct.name}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <div className="absolute top-2 left-2 bg-yellow-400 rounded px-2 py-1 flex items-center gap-1">
                          <i className="ri-time-line text-xs"></i>
                          <span className="text-xs font-semibold">30 min</span>
                        </div>
                      </div>
                      
                      <h3 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2 min-h-[40px]">
                        {recProduct.name}
                      </h3>
                      
                      {firstVariant && (
                        <p className="text-xs text-gray-600 mb-2">{firstVariant.weight}</p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-base font-bold text-gray-900">
                              ₹{recSellingPrice.toFixed(0)}
                            </span>
                            {recMrp > recSellingPrice && (
                              <span className="text-xs text-gray-500 line-through">
                                ₹{recMrp.toFixed(0)}
                              </span>
                            )}
                          </div>
                          {recDiscount > 0 && (
                            <span className="text-xs font-bold text-green-600">
                              {recDiscount}% off
                            </span>
                          )}
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                          className="text-[#FFC107] text-xs font-bold border border-[#FFC107] px-3 py-1.5 rounded hover:bg-[#FFC107] hover:text-gray-900 transition-colors"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Reviews Section - Desktop */}
          <div className="mt-12">
            <CustomerReview id={product.id} getProductReview={getProductReview} reviews={reviews} overallRating={overallRating} />
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden">
          {/* Product Container */}
          <div className="max-w-7xl mx-auto px-4">
          {/* Product Image */}
          <div className="w-full mb-3">
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full rounded-lg object-cover"
            />
            {/* Rating Badge */}
            {productReviews.overallReviews > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center gap-1 bg-yellow-400 px-2 py-1 rounded">
                  <span className="text-xs font-semibold">⏱ 30 MINS</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-yellow-500">⭐⭐⭐⭐⭐</span>
                  <span className="text-xs text-gray-600">({productReviews.overallReviews})</span>
                </div>
              </div>
            )}
          </div>

          {/* Product Name */}
          <h1 className="text-lg font-bold text-gray-900 mb-4 uppercase">
            {product.name}
          </h1>

          {/* Select Unit Section */}
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Select Unit</h2>
          
          {/* Variant Cards - Matching Image Design */}
          <div className='flex gap-2 mb-4 overflow-x-auto pb-2'>
            {product.product_variants?.map((variant) => {
              const isSelected = selectedVariant?.id === variant?.id;
              const mrp = parseFloat(variant?.mrp || 0);
              const sellingPrice = parseFloat(variant?.selling_price || variant?.price || 0);
              const discount = mrp > sellingPrice
                ? Math.round(((mrp - sellingPrice) / mrp) * 100)
                : 0;
              
              return (
                <div 
                  key={variant?.id} 
                  onClick={() => { changeHandler(variant) }}  
                  className={`relative flex-shrink-0 hover:cursor-pointer rounded-xl overflow-hidden w-[105px] transition-all duration-300
                    ${isSelected ? 'bg-[#FFC107]' : 'bg-white border-2 border-[#FFC107]'}`}
                >
                  {/* Discount Badge */}
                  {discount > 0 && (
                    <div 
                      className={`text-[10px] font-bold py-1 px-2 ${isSelected ? 'text-gray-900' : 'text-gray-900'}`}
                      style={{
                        background: isSelected 
                          ? 'rgba(255, 193, 7, 0.6)'
                          : '#FFC107'
                      }}
                    >
                      {discount} % OFF
                    </div>
                  )}
                  
                  {/* Content */}
                  <div className={`p-2 ${discount > 0 ? '' : 'pt-2.5'}`}>
                    {/* Weight */}
                    <p className={`text-xs font-semibold mb-1 ${isSelected ? 'text-gray-900' : 'text-gray-500'}`}>
                      {variant?.weight}
                    </p>
                    
                    {/* Price Row - Selling Price and MRP side by side */}
                    <div className="flex items-center gap-1">
                      <span className={`text-sm font-bold ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>
                        ₹{sellingPrice.toFixed(sellingPrice % 1 === 0 ? 0 : 1)}
                      </span>
                      {mrp > sellingPrice && (
                        <span className={`text-[10px] line-through ${isSelected ? 'text-gray-700' : 'text-gray-400'}`}>
                          MRP₹{mrp.toFixed(0)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* View Product Details - Expandable */}
          <div className="border border-gray-300 rounded-lg mb-4">
            <button 
              onClick={() => setShowProductDetails(!showProductDetails)}
              className="w-full flex items-center justify-between p-3 text-left"
            >
              <span className="text-[#FFC107] font-semibold text-sm">View product details</span>
              <i className={`ri-arrow-${showProductDetails ? 'up' : 'down'}-s-line text-[#FFC107] text-xl transition-transform duration-300`}></i>
            </button>
            
            {/* Expandable Content */}
            {showProductDetails && (
              <div className="px-3 pb-3 border-t border-gray-200 pt-3">
                {/* Product Description */}
                {product.description && (
                  <div className="mb-3">
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">Description</h3>
                    <p className="text-xs text-gray-600 leading-relaxed">{product.description}</p>
                  </div>
                )}
                
                {/* Selected Variant Details */}
                {selectedVariant && (
                  <div className="mb-3">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Pricing Details</h3>
                    <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">Weight</span>
                        <span className="text-xs font-semibold text-gray-900">{selectedVariant.weight}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">Selling Price</span>
                        <span className="text-xs font-semibold text-gray-900">₹{selectedSellingPrice.toFixed(2)}</span>
                      </div>
                      {selectedMrp > selectedSellingPrice && (
                        <>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-600">MRP</span>
                            <span className="text-xs text-gray-500 line-through">₹{selectedMrp.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-600">You Save</span>
                            <span className="text-xs font-semibold text-green-600">₹{(selectedMrp - selectedSellingPrice).toFixed(2)} ({selectedDiscount}%)</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
                
                {/* All Variants */}
                {product.product_variants && product.product_variants.length > 1 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Available Units</h3>
                    <div className="space-y-2">
                      {product.product_variants.map((variant) => {
                        const mrp = parseFloat(variant?.mrp || 0);
                        const sellingPrice = parseFloat(variant?.selling_price || variant?.price || 0);
                        const discount = mrp > sellingPrice
                          ? Math.round(((mrp - sellingPrice) / mrp) * 100)
                          : 0;
                        
                        return (
                          <div key={variant.id} className="flex justify-between items-center bg-gray-50 rounded p-2">
                            <span className="text-xs font-medium text-gray-700">{variant.weight}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-gray-900">₹{sellingPrice.toFixed(0)}</span>
                              {mrp > sellingPrice && (
                                <>
                                  <span className="text-[10px] text-gray-500 line-through">₹{mrp.toFixed(0)}</span>
                                  <span className="text-[10px] font-bold text-green-600">{discount}% off</span>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Category Navigation */}
          {product.category_name && (
            <div 
              onClick={() => {
                // Navigate to category page with query parameter
                navigate(`/category?id=${encodeURIComponent(product.category_name)}`);
              }}
              className="border border-gray-200 rounded-lg p-3 mb-4 flex items-center justify-between bg-white cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#FFC107] rounded-lg flex items-center justify-center flex-shrink-0">
                  <i className="ri-shopping-basket-line text-lg text-gray-900"></i>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900">{product.category_name}</p>
                  <p className="text-xs text-gray-500">Explore all products</p>
                </div>
              </div>
              <i className="ri-arrow-right-s-line text-xl text-gray-400 flex-shrink-0"></i>
            </div>
          )}

          {/* Recommended Products Section */}
          {recommendedProducts.length > 0 && (
            <div className="mb-6">
              <h2 className="text-base font-bold text-gray-900 mb-3">Recommended product</h2>
              <div className="grid grid-cols-2 gap-3">
                {recommendedProducts.map((recProduct) => {
                  const firstVariant = recProduct.product_variants?.[0];
                  const recMrp = parseFloat(firstVariant?.mrp || 0);
                  const recSellingPrice = parseFloat(firstVariant?.selling_price || firstVariant?.price || 0);
                  const recDiscount = recMrp > recSellingPrice
                    ? Math.round(((recMrp - recSellingPrice) / recMrp) * 100)
                    : 0;
                  
                  return (
                    <div 
                      key={recProduct.id}
                      onClick={() => {
                        const slug = recProduct.slug || recProduct.name?.toLowerCase().replace(/\s+/g, '-');
                        navigate(`/product/${slug}`, { state: recProduct });
                      }}
                      className="bg-gray-50 rounded-lg p-2.5 cursor-pointer hover:shadow-md transition-shadow"
                    >
                      {/* Product Image */}
                      <div className="relative mb-2">
                        <img 
                          src={recProduct.image_url} 
                          alt={recProduct.name}
                          className="w-full h-28 object-cover rounded-lg"
                        />
                        {/* 30 mins badge */}
                        <div className="absolute top-1.5 left-1.5 bg-yellow-400 rounded px-1.5 py-0.5 flex items-center gap-0.5">
                          <i className="ri-time-line text-[10px]"></i>
                          <span className="text-[9px] font-semibold">30 min</span>
                        </div>
                      </div>
                      
                      {/* Product Name */}
                      <h3 className="text-[11px] font-semibold text-gray-900 mb-1 line-clamp-2 min-h-[28px]">
                        {recProduct.name}
                      </h3>
                      
                      {/* Rating */}
                      {recProduct.rating && (
                        <div className="flex items-center gap-0.5 mb-1.5">
                          <span className="text-yellow-500 text-[10px]">⭐</span>
                          <span className="text-[10px] text-gray-600">({recProduct.reviews_count || 0})</span>
                        </div>
                      )}
                      
                      {/* Weight */}
                      {firstVariant && (
                        <p className="text-[10px] text-gray-600 mb-1">{firstVariant.weight}</p>
                      )}
                      
                      {/* Price and Add Button */}
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-bold text-gray-900">
                              ₹{recSellingPrice.toFixed(0)}
                            </span>
                            {recMrp > recSellingPrice && (
                              <span className="text-[9px] text-gray-500 line-through">
                                ₹{recMrp.toFixed(0)}
                              </span>
                            )}
                          </div>
                          {recDiscount > 0 && (
                            <span className="text-[9px] font-bold text-green-600">
                              {recDiscount}% off
                            </span>
                          )}
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            // Add to cart logic here
                          }}
                          className="text-[#FFC107] text-[11px] font-bold border border-[#FFC107] px-2.5 py-1 rounded hover:bg-[#FFC107] hover:text-gray-900 transition-colors"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Reviews Section */}
        <div className="mt-8">
          <CustomerReview id={product.id} getProductReview={getProductReview} reviews={reviews} overallRating={overallRating} />
        </div>
        </div>
      </div>

      {/* Fixed Bottom Bar - Mobile Only */}
      {selectedVariant && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-lg z-50">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              {/* Left Side - Price Info */}
              <div className="flex-1">
                <p className="text-xs text-gray-600 mb-0.5">{selectedVariant.weight}</p>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-2xl font-bold text-gray-900">
                    ₹{selectedSellingPrice.toFixed(0)}
                  </span>
                  {selectedMrp > selectedSellingPrice && (
                    <>
                      <span className="text-sm text-gray-500 line-through">
                        MRP ₹{selectedMrp.toFixed(0)}
                      </span>
                      <span className="bg-[#FFC107] text-gray-900 text-[10px] font-bold px-2 py-0.5 rounded">
                        {selectedDiscount}% Off
                      </span>
                    </>
                  )}
                </div>
                <p className="text-[10px] text-gray-500">Inclusive of all taxes</p>
              </div>
              
              {/* Right Side - Add to Cart Button */}
              <button 
                onClick={handleAddToCart}
                disabled={!selectedVariant || selectedVariant.stock === 0 || isAdded || addingToCart}
                className={`${!selectedVariant || selectedVariant.stock === 0 || isAdded || addingToCart ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-[#FFC107] text-gray-900 hover:bg-[#E6A800]'} font-bold py-3 px-6 rounded-lg transition-all duration-300 text-sm whitespace-nowrap shadow-md flex items-center gap-2`}
              >
                {addingToCart ? (
                  <>
                    <i className="ri-loader-4-line animate-spin text-lg"></i>
                    Adding...
                  </>
                ) : isAdded ? (
                  <>
                    <i className="ri-check-line text-lg"></i>
                    Added
                  </>
                ) : (
                  'Add to cart'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer - Desktop Only */}
      <div className="hidden md:block">
        <Footer data={footerRangeList}/>
      </div>
    </>
  );
}

export default ProductDescription;