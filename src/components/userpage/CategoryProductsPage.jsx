import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import Header from '@common/Header';
import Footer from '@common/Footer';
import { allApi, allApiWithHeaderToken } from "@api/api";
import { API_CONSTANTS } from "@constants/apiurl";
import { getCart } from '../../redux/slices/cartSlice';
import UserLoader from '@userpage-pages/UserLoader';
import { Toast } from 'primereact/toast';
import { decodeHtml } from "@helper";

const CategoryProductsPage = () => {
  const [searchParams] = useSearchParams();
  const categoryName = searchParams.get('id');
  const searchQuery = searchParams.get('search');
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const toast = useRef(null);

  const [categoryData, setCategoryData] = useState(null);
  const [subCategories, setSubCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('default');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [activeFilterTab, setActiveFilterTab] = useState('brands');
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartItems, setCartItems] = useState({});
  const [cartItemIds, setCartItemIds] = useState({}); // productId â†’ cart_item_id
  const [updatingQuantity, setUpdatingQuantity] = useState({});
  
  // Temporary filter states (only applied when user clicks "Apply")
  const [tempSortBy, setTempSortBy] = useState('default');
  const [tempSelectedBrand, setTempSelectedBrand] = useState('all');

  useEffect(() => {
    if (categoryName || searchQuery) {
      fetchCategoryPageData();
      fetchCartItems();
    }
  }, [categoryName, searchQuery]);

  // Re-fetch when user changes delivery location (new branch → new stock)
  useEffect(() => {
    const handleLocationChange = () => {
      if (categoryName || searchQuery) fetchCategoryPageData();
    };
    window.addEventListener('userLocationChanged', handleLocationChange);
    return () => window.removeEventListener('userLocationChanged', handleLocationChange);
  }, [categoryName, searchQuery]);

  useEffect(() => {
    // Listen for cart updates
    const handleCartUpdate = () => {
      fetchCartItems();
    };
    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => window.removeEventListener('cartUpdated', handleCartUpdate);
  }, []);

  useEffect(() => {
    // Filter products based on selected subcategory and search query
    let filtered = [...products];
    
    // Apply search filter if search query exists
    if (searchQuery && searchQuery.trim()) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (selectedSubCategory) {
      filtered = filtered.filter(product => 
        product.subCategoryName === selectedSubCategory.name
      );
    }

    // Apply brand filter
    if (selectedBrand !== 'all') {
      filtered = filtered.filter(product => 
        product.brand === selectedBrand
      );
    }

    // Apply sorting
    if (sortBy === 'price-low') {
      filtered.sort((a, b) => {
        const variantA = a.variants?.[0] || {};
        const variantB = b.variants?.[0] || {};
        const priceA = parseFloat(variantA.discountedPrice || variantA.selling_price || variantA.price || 0);
        const priceB = parseFloat(variantB.discountedPrice || variantB.selling_price || variantB.price || 0);
        return priceA - priceB;
      });
    } else if (sortBy === 'price-high') {
      filtered.sort((a, b) => {
        const variantA = a.variants?.[0] || {};
        const variantB = b.variants?.[0] || {};
        const priceA = parseFloat(variantA.discountedPrice || variantA.selling_price || variantA.price || 0);
        const priceB = parseFloat(variantB.discountedPrice || variantB.selling_price || variantB.price || 0);
        return priceB - priceA;
      });
    } else if (sortBy === 'name-az') {
      filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (sortBy === 'name-za') {
      filtered.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
    }

    setFilteredProducts(filtered);
  }, [selectedSubCategory, products, sortBy, selectedBrand, searchQuery]);

  const fetchCategoryPageData = async () => {
    setLoading(true);
    try {
      if (searchQuery && searchQuery.trim()) {
        const response = await allApi.get("user_dashboard/all_active_products");
        if (response?.status === 200) {
          const allProducts = response?.data?.products || [];
          setProducts(allProducts);
          setCategoryData({ name: 'Search Results' });
          setSubCategories([]);
        }
      } else if (categoryName) {
        const body = { category_name: categoryName };
        const response = await allApi.post("user_dashboard/category_page_data", body);
        if (response?.status === 200) {
          const data = response.data;
          setCategoryData(data.category);
          setSubCategories(data.subcategories || []);
          setProducts(data.products || []);
        }
      }
    } catch (error) {
      console.error("Error fetching category page data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubCategoryClick = async (subCategory) => {
    setSelectedSubCategory(subCategory);
    setLoading(true);

    try {
      const body = { category_name: categoryName, subcategory_name: subCategory.name };
      const response = await allApi.post("user_dashboard/category_page_data", body);

      if (response?.status === 200) {
        const data = response.data;
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error("Error fetching subcategory products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAllClick = async () => {
    setSelectedSubCategory(null);
    setLoading(true);

    try {
      const body = { category_name: categoryName };
      const response = await allApi.post("user_dashboard/category_page_data", body);

      if (response?.status === 200) {
        const data = response.data;
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error("Error fetching all category products:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCartItems = async () => {
    try {
      const userDetails = JSON.parse(localStorage.getItem('userDetails'));
      if (!userDetails?.id) return;
      const result = await dispatch(getCart()).unwrap();
      const items = result?.data?.items || result?.items || [];
      const cartMap = {};
      const idMap = {};
      items.forEach(item => {
        const productId = item.product_id;
        const weight = item.weight;
        const variantId = item.product_variant_id;
        const cartKey = weight ? `${productId}_${weight}` : String(productId);
        cartMap[cartKey] = item.quantity;
        idMap[cartKey] = item.cart_item_id;
        if (variantId != null) {
          cartMap[`variant_${variantId}`] = item.quantity;
          idMap[`variant_${variantId}`] = item.cart_item_id;
        }
      });
      setCartItems(cartMap);
      setCartItemIds(idMap);
    } catch (error) {
      console.error("Error fetching cart items:", error);
    }
  };

  const updateCartQuantity = async (productId, newQuantity) => {
    try {
      const userDetails = JSON.parse(localStorage.getItem('userDetails'));
      const cartItemId = cartItemIds[productId];

      if (newQuantity === 0 && cartItemId) {
        // Remove item
        await allApiWithHeaderToken(API_CONSTANTS.CART_REMOVE_URL, {
          user_id: userDetails?.id,
          cart_item_id: cartItemId
        }, "post");
        fetchCartItems();
        window.dispatchEvent(new Event('cartUpdated'));
        return;
      }

      if (!cartItemId) return;

      const response = await allApiWithHeaderToken(API_CONSTANTS.CART_UPDATE_QUANTITY_URL, {
        cart_item_id: cartItemId,
        user_id: userDetails?.id,
        quantity: newQuantity
      }, "put");

      if (response?.status === 200) {
        fetchCartItems();
        window.dispatchEvent(new Event('cartUpdated'));
      }
    } catch (error) {
      console.error("Error updating cart quantity:", error);
    }
  };

  const handleSearch = (query) => {
    if (query.trim()) {
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  };

  const getBrands = () => {
    const brands = [...new Set(products.map(p => p.brand).filter(Boolean))];
    return brands;
  };

  const handleBrandSelect = (brand) => {
    setTempSelectedBrand(brand);
  };

  const handleSortSelect = (sort) => {
    setTempSortBy(sort);
  };

  const openFilterModal = (tab) => {
    // Sync temporary state with current state when opening modal
    setTempSelectedBrand(selectedBrand);
    setTempSortBy(sortBy);
    setActiveFilterTab(tab);
    setShowFilterModal(true);
  };

  const applyFilters = () => {
    // Apply the temporary filters to actual state
    setSelectedBrand(tempSelectedBrand);
    setSortBy(tempSortBy);
    setShowFilterModal(false);
  };

  const clearFilters = () => {
    setTempSelectedBrand('all');
    setTempSortBy('default');
    setSelectedBrand('all');
    setSortBy('default');
  };

  const handleProductClick = (product) => {
    if (product.variants && product.variants.length > 1) {
      setSelectedProduct(product);
      setSelectedVariant(null);
      setShowVariantModal(true);
    } else if (product.variants && product.variants.length === 1) {
      // Add single variant directly to cart
      addToCart(product, product.variants[0]);
    }
  };

  const addToCart = async (product, variant) => {
    if (addingToCart) return; // Prevent duplicate requests
    
    try {
      setAddingToCart(true);
      const userDetails = JSON.parse(localStorage.getItem('userDetails'));
      
      if (!userDetails?.id) {
        return;
      }

      // Handle both API field name formats
      const sellingPrice = variant.discountedPrice || variant.selling_price || variant.price || 0;
      const mrp = variant.actualPrice || variant.mrp || sellingPrice;

      const body = {
        user_id: userDetails?.id,
        product_variant_id: variant.productVariantId,
        quantity: 1,
        selected_weight: variant.weight || null,
      };

      const response = await allApiWithHeaderToken(API_CONSTANTS.CART_ADD_URL, body, "post");

      if (response?.status === 200 || response?.status === 201) {
        await fetchCartItems();
        toast.current?.show({ severity: 'success', summary: 'Added to Cart', detail: 'Item added to your cart', life: 2000 });
      }
    } catch (error) {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to add item to cart', life: 3000 });
    } finally {
      setAddingToCart(false);
    }
  };

  const handleAddVariantToCart = () => {
    if (selectedVariant && selectedProduct) {
      addToCart(selectedProduct, selectedVariant);
      setShowVariantModal(false);
      setSelectedProduct(null);
      setSelectedVariant(null);
    }
  };

  if (loading) {
    return <UserLoader />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toast ref={toast} position="top-right" />
      {/* Desktop Header */}
      <div className="hidden md:block">
        <Header onSearch={handleSearch} />
      </div>

      {/* Mobile Header - Simple */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white z-50 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center"
          >
            <i className="ri-arrow-left-line text-2xl text-gray-900"></i>
          </button>
          
          <div className="flex items-center gap-2 flex-1 mx-3">
            {searchQuery ? (
              <div className="w-10 h-10 bg-[#0c831f] rounded-lg flex items-center justify-center flex-shrink-0">
                <i className="ri-search-line text-xl text-gray-900"></i>
              </div>
            ) : categoryData?.image_url ? (
              <div className="w-10 h-10 bg-[#0c831f] rounded-lg flex items-center justify-center flex-shrink-0">
                <img 
                  src={categoryData.image_url} 
                  alt={categoryData.name}
                  className="w-8 h-8 object-contain"
                />
              </div>
            ) : (
              <div className="w-10 h-10 bg-[#0c831f] rounded-lg flex items-center justify-center flex-shrink-0">
                <i className="ri-shopping-basket-line text-xl text-gray-900"></i>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-sm font-bold text-gray-900 truncate">
                {searchQuery ? `Search: "${searchQuery}"` : decodeHtml(categoryData?.name) || 'Fresh Grocery'}
              </h1>
              <p className="text-xs text-gray-500">{filteredProducts.length} items</p>
            </div>
          </div>
          
          <button className="w-10 h-10 flex items-center justify-center">
            <i className="ri-search-line text-2xl text-gray-900"></i>
          </button>
        </div>
      </div>

      {/* Breadcrumb - Desktop Only */}
      <div className="hidden md:block fixed top-[80px] left-0 right-0 bg-white py-4 px-4 border-b z-40 shadow-sm">
        <div className="max-w-[1320px] mx-auto">
          <nav className="flex items-center space-x-2 text-sm">
            <button 
              onClick={() => navigate('/')}
              className="text-gray-400 hover:text-gray-600 flex items-center gap-1"
            >
              <i className="ri-home-4-line"></i> Home
            </button>
            <i className="ri-arrow-right-s-line text-gray-400 text-xs"></i>
            {searchQuery ? (
              <span className="text-[#FFC107] font-medium">Search: "{searchQuery}"</span>
            ) : categoryData && (
              <>
                <span className="text-[#FFC107] font-medium">{decodeHtml(categoryData.name)}</span>
                {selectedSubCategory && (
                  <>
                    <i className="ri-arrow-right-s-line text-gray-400 text-xs"></i>
                    <span className="text-gray-900 font-medium">{decodeHtml(selectedSubCategory.name)}</span>
                  </>
                )}
              </>
            )}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="md:pt-[140px] pt-[60px]">
        <div className="max-w-[1320px] mx-auto md:py-4">
          <div className="flex md:gap-4 gap-2">
            {/* Left Sidebar - Desktop and Mobile - Fixed height with own scroller - Hide for search results */}
            {!searchQuery && (
            <div className="md:w-56 w-20 flex-shrink-0 md:sticky md:top-[140px] md:self-start">
              <div className="bg-white md:rounded-lg md:shadow-md overflow-hidden md:border border-gray-200 md:max-h-[calc(100vh-160px)] max-h-[calc(100vh-60px)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {/* All Button - Shows category icon */}
                <button
                  onClick={handleAllClick}
                  className={`w-full text-left md:py-4 py-3 md:px-4 px-2 transition-all duration-200 border-b border-gray-200 ${
                    !selectedSubCategory
                        ? 'bg-[#0c831f] font-bold shadow-sm'
                        : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex md:flex-row flex-col items-center md:gap-3 gap-1">
                      <div className={`md:w-12 md:h-12 w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                        !selectedSubCategory ? 'bg-white' : 'bg-gray-100'
                      }`}>
                        {categoryData?.image_url ? (
                          <img 
                            src={categoryData.image_url} 
                            alt={categoryData.name}
                            className="md:w-10 md:h-10 w-8 h-8 object-contain"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : categoryData?.icon ? (
                          <i className={`${categoryData.icon} md:text-xl text-lg text-gray-700`}></i>
                        ) : (
                          <i className="ri-grid-fill md:text-xl text-lg text-gray-700"></i>
                        )}
                      </div>
                      <span className={`md:text-xs text-[10px] font-medium leading-tight flex-1 text-center md:text-left ${
                        !selectedSubCategory ? 'text-gray-900' : 'text-gray-600'
                      }`}>all</span>
                    </div>
                  </button>

                  {/* Subcategory List - Scrollable */}
                  <div className="overflow-y-auto">
                    {subCategories.length > 0 ? (
                      subCategories.map((subCategory) => {
                        const isActive = selectedSubCategory?.id === subCategory.id;
                        
                        return (
                          <button
                            key={subCategory.id}
                            onClick={() => handleSubCategoryClick(subCategory)}
                            className={`w-full text-left md:py-4 py-3 md:px-4 px-2 transition-all duration-200 border-b border-gray-200 ${
                              isActive
                                ? 'bg-[#0c831f] font-bold shadow-sm'
                                : 'bg-white hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex md:flex-row flex-col items-center md:gap-3 gap-1">
                              <div className={`md:w-12 md:h-12 w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                                isActive ? 'bg-white' : 'bg-gray-100'
                              }`}>
                                {subCategory.image_url ? (
                                  <img 
                                    src={subCategory.image_url} 
                                    alt={subCategory.name}
                                    className="md:w-10 md:h-10 w-8 h-8 object-contain"
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                    }}
                                  />
                                ) : (
                                  <i className="ri-restaurant-line md:text-xl text-lg text-gray-700"></i>
                                )}
                              </div>
                              <span className={`md:text-xs text-[9px] font-medium leading-tight flex-1 text-center md:text-left line-clamp-2 ${
                                isActive ? 'text-gray-900' : 'text-gray-600'
                              }`}>
                                {decodeHtml(subCategory.name)}
                              </span>
                            </div>
                          </button>
                        );
                      })
                    ) : (
                      <div className="p-4 text-center text-sm text-gray-500 hidden md:block">
                        No subcategories available
                      </div>
                    )}
                  </div>
                </div>
            </div>
            )}

            {/* Right Content - Products */}
            <div className="flex-1">
              {/* Mobile Filters - Horizontal Scroll - Aligned Right */}
              <div className="md:hidden sticky top-[60px] bg-gray-50 z-40 px-4 py-3 overflow-x-auto" style={{ marginRight: '6px' }}>
                <div className="flex gap-2 min-w-max justify-end">
                  {getBrands().length > 0 && (
                    <button
                      onClick={() => openFilterModal('brands')}
                      className="px-3 py-1.5 rounded-full bg-[#0c831f] text-white text-xs font-semibold whitespace-nowrap flex items-center gap-1"
                    >
                      Brands <i className="ri-arrow-down-s-line text-sm"></i>
                    </button>
                  )}

                  <button
                    onClick={() => openFilterModal('sortby')}
                    className="px-3 py-1.5 rounded-full bg-[#0c831f] text-white text-xs font-semibold whitespace-nowrap flex items-center gap-1"
                  >
                    Sort By <i className="ri-arrow-down-s-line text-sm"></i>
                  </button>
                </div>
              </div>

              {/* Filter Bar - Desktop Only */}
              <div className="hidden md:flex justify-between items-center mb-4 bg-white p-3 rounded-lg shadow-sm">
                <div className="flex items-center gap-2">
                </div>

                <div className="flex items-center gap-2">
                  {getBrands().length > 0 && (
                    <button
                      onClick={() => openFilterModal('brands')}
                      className="bg-[#0c831f] hover:bg-green-800 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm flex items-center gap-2"
                    >
                      <span>Brands</span>
                      <i className="ri-arrow-down-s-fill text-gray-900"></i>
                    </button>
                  )}

                  <button
                    onClick={() => openFilterModal('sortby')}
                    className="bg-[#0c831f] hover:bg-green-800 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm flex items-center gap-2"
                  >
                    <span>Sort By</span>
                    <i className="ri-arrow-down-s-fill text-gray-900"></i>
                  </button>
                </div>
              </div>

              {/* Products Grid */}
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="relative w-16 h-16">
                    <div 
                      className="absolute w-8 h-8 border-4 border-[#FFC107] bg-transparent"
                      style={{
                        top: '0',
                        left: '0',
                        animation: 'square1 1.5s ease-in-out infinite'
                      }}
                    ></div>
                    <div 
                      className="absolute w-8 h-8 border-4 border-[#FFC107] bg-transparent"
                      style={{
                        bottom: '0',
                        right: '0',
                        animation: 'square2 1.5s ease-in-out infinite'
                      }}
                    ></div>
                  </div>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="bg-white rounded-lg border border-gray-200 p-6 md:p-12 text-center">
                  <i className="ri-inbox-line text-4xl md:text-6xl text-gray-300 mb-2 md:mb-4"></i>
                  <h3 className="text-sm md:text-lg font-medium text-gray-600 mb-1 md:mb-2">No Products Found</h3>
                  <p className="text-xs md:text-base text-gray-500">Try selecting a different category</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 px-4 md:px-0 pb-24 md:pb-4">
                  {filteredProducts.map((product) => {
                    const variants = product.variants || product.product_variants || [];
                    const firstVariant = variants[0];
                    
                    // Debug logging
                    if (!firstVariant) {
                      console.log("Product without variants:", product.name, product);
                    }
                    
                    // Map API fields: actualPrice = MRP, discountedPrice = selling price
                    const mrp = parseFloat(firstVariant?.actualPrice || firstVariant?.mrp || 0);
                    const sellingPrice = parseFloat(firstVariant?.discountedPrice || firstVariant?.selling_price || firstVariant?.price || 0);
                    
                    const discount = mrp > sellingPrice && sellingPrice > 0
                      ? Math.round(((mrp - sellingPrice) / mrp) * 100)
                      : 0;

                    return (
                      <div key={product.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-100">
                        {/* Product Image */}
                        <div className="relative pt-2 md:pt-4 px-2 md:px-3 pb-2 md:pb-3">
                          {discount > 0 && (
                            <div 
                              className="absolute top-2 md:top-3 left-2 md:left-3 bg-[#0c831f] text-white rounded-full font-bold z-10"
                              style={{ 
                                padding: '2px 6px',
                                fontSize: '8px',
                                lineHeight: '1.2'
                              }}
                            >
                              {discount}% Off
                            </div>
                          )}
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-full h-16 md:h-[120px] object-contain cursor-pointer"
                              onClick={() => {
                                const slug = product.slug || product.name?.toLowerCase().replace(/\s+/g, '-');
                                navigate(`/product/${slug}`, { state: product });
                              }}
                            />
                          ) : (
                            <div className="w-full h-16 md:h-[120px] flex items-center justify-center bg-gray-100 rounded">
                              <i className="ri-image-line text-2xl md:text-4xl text-gray-300"></i>
                            </div>
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="px-2 md:px-3 pb-2 md:pb-3">
                          <h3 className="text-gray-800 mb-1 md:mb-1.5 line-clamp-2 text-[10px] md:text-xs leading-tight md:leading-[1.3] font-bold md:font-medium min-h-[24px] md:min-h-[32px]">
                            {decodeHtml(product.name)}
                          </h3>
                          
                          {firstVariant?.weight && (
                            <div className="text-gray-500 mb-1 md:mb-2 text-[9px] md:text-[10px] leading-tight">
                              {firstVariant.net_weight > 0 ? `${firstVariant.net_weight} ${firstVariant.weight}` : firstVariant.weight}
                            </div>
                          )}

                          <div className="mb-1 md:mb-2">
                            {sellingPrice > 0 ? (
                              <>
                                <div className="text-gray-900 font-bold text-sm md:text-base leading-tight mb-0.5">
                                  ₹{sellingPrice.toFixed(2)}
                                </div>
                                {mrp > sellingPrice && (
                                  <div className="text-gray-400 line-through text-[10px] md:text-xs leading-tight">
                                    ₹{mrp.toFixed(2)}
                                  </div>
                                )}
                              </>
                            ) : mrp > 0 ? (
                              <div className="text-gray-900 font-bold text-sm md:text-base leading-tight">
                                ₹{mrp.toFixed(2)}
                              </div>
                            ) : (
                              <div className="text-xs text-gray-500">Price not available</div>
                            )}
                          </div>

                          {/* Add Button or Quantity Controls */}
                          {(() => {
                            const inStock = firstVariant?.in_stock !== false;
                            const allOutOfStock = variants.length > 1 && variants.every(v => v.in_stock === false);
                            if (!inStock || allOutOfStock) {
                              return (
                                <button disabled className="w-full bg-gray-100 text-gray-400 rounded-lg font-bold border-2 border-gray-200 py-1 md:py-2 text-[11px] md:text-sm cursor-not-allowed">
                                  Out of Stock
                                </button>
                              );
                            }
                            if (variants.length > 1) {
                              return (
                                <button
                                  onClick={() => handleProductClick(product)}
                                  className="w-full bg-white text-green-600 rounded-lg font-bold hover:bg-green-50 transition-colors border-2 border-green-500 py-1 md:py-2 text-[11px] md:text-sm"
                                >
                                  Options
                                </button>
                              );
                            }
                            const cartKey = firstVariant?.weight ? `${firstVariant?.product_id}_${firstVariant?.weight}` : String(firstVariant?.product_id);
                            if (cartItems[cartKey]) {
                              return (
                                <div className="w-full flex items-center justify-between bg-white rounded-lg border-2 border-green-500 py-0.5 md:py-1 px-1 md:px-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const newQty = cartItems[cartKey] - 1;
                                      updateCartQuantity(cartKey, newQty > 0 ? newQty : 0);
                                    }}
                                    className="text-green-600 hover:text-green-700 font-bold text-base md:text-lg"
                                  >
                                    -
                                  </button>
                                  <span className="text-gray-900 font-bold text-[11px] md:text-sm px-1 md:px-3">
                                    {cartItems[cartKey]}
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateCartQuantity(cartKey, cartItems[cartKey] + 1);
                                    }}
                                    className="text-green-600 hover:text-green-700 font-bold text-base md:text-lg"
                                  >
                                    +
                                  </button>
                                </div>
                              );
                            }
                            return (
                              <button
                                onClick={() => handleProductClick(product)}
                                className="w-full bg-white text-green-600 rounded-lg font-bold hover:bg-green-50 transition-colors border-2 border-green-500 py-1 md:py-2 text-[11px] md:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={!sellingPrice}
                              >
                                Add
                              </button>
                            );
                          })()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer - Desktop Only */}
      <div className="hidden md:block">
        <Footer data={[]} />
      </div>

      {/* Variant Selection Modal */}
      {showVariantModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => {
          setShowVariantModal(false);
          setSelectedProduct(null);
          setSelectedVariant(null);
        }}>
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">{decodeHtml(selectedProduct.name)}</h3>
              <button
                onClick={() => {
                  setShowVariantModal(false);
                  setSelectedProduct(null);
                  setSelectedVariant(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <i className="ri-close-line text-2xl"></i>
              </button>
            </div>

            <div className="space-y-3">
              {selectedProduct.variants?.map((variant) => {
                // Map API fields: actualPrice = MRP, discountedPrice = selling price
                const mrp = parseFloat(variant?.actualPrice || variant?.mrp || 0);
                const sellingPrice = parseFloat(variant?.discountedPrice || variant?.selling_price || variant?.price || 0);
                
                const discount = mrp > sellingPrice && sellingPrice > 0
                  ? Math.round(((mrp - sellingPrice) / mrp) * 100)
                  : 0;
                
                const vKey = variant.weight
                  ? `${variant.product_id || selectedProduct?.id}_${variant.weight}`
                  : variant.productVariantId != null
                    ? `variant_${variant.productVariantId}`
                    : null;
                const cartItem = vKey ? cartItems[vKey] : null;
                const key = vKey || `${variant.product_id}_${variant.weight}`;
                const isUpdating = updatingQuantity[key];

                return (
                  <div
                    key={variant.weight ? `${variant.productVariantId}_${variant.weight}` : (variant.productVariantId ?? variant.product_id)}
                    className="border border-gray-200 rounded-lg p-4 hover:border-green-500 hover:bg-green-50 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-semibold text-gray-900">{variant.weight}</span>
                          {discount > 0 && (
                            <span className="bg-[#0c831f] text-white text-xs font-bold px-2 py-0.5 rounded">
                              {discount}% OFF
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-gray-900">
                            ₹{sellingPrice.toFixed(2)}
                          </span>
                          {mrp > sellingPrice && (
                            <span className="text-sm text-gray-400 line-through">
                              ₹{mrp.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {variant.in_stock === false ? (
                        <button disabled className="bg-gray-100 text-gray-400 px-4 py-2 rounded-lg font-bold text-sm cursor-not-allowed border border-gray-200">
                          Out of Stock
                        </button>
                      ) : cartItem ? (
                        <div className="flex items-center gap-2 bg-white rounded-lg border-2 border-green-500 px-3 py-1">
                          <button
                            onClick={() => updateCartQuantity(key, cartItem - 1)}
                            disabled={isUpdating}
                            className="text-green-600 hover:text-green-700 font-bold text-lg disabled:opacity-50"
                          >
                            -
                          </button>
                          <span className="text-gray-900 font-bold text-sm px-2">
                            {cartItem}
                          </span>
                          <button
                            onClick={() => updateCartQuantity(key, cartItem + 1)}
                            disabled={isUpdating}
                            className="text-green-600 hover:text-green-700 font-bold text-lg disabled:opacity-50"
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            addToCart(selectedProduct, variant);
                            setShowVariantModal(false);
                            setSelectedProduct(null);
                            setSelectedVariant(null);
                          }}
                          disabled={addingToCart}
                          className="bg-[#0c831f] text-white px-4 py-2 rounded-lg font-bold hover:bg-green-800 transition-colors text-sm disabled:opacity-50"
                        >
                          Add
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Filters</h2>
              <button
                onClick={() => setShowFilterModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                <i className="ri-close-line"></i>
              </button>
            </div>

            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveFilterTab('brands')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  activeFilterTab === 'brands'
                    ? 'text-green-700 border-b-2 border-yellow-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Brands
              </button>
              <button
                onClick={() => setActiveFilterTab('sortby')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  activeFilterTab === 'sortby'
                    ? 'text-green-700 border-b-2 border-yellow-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Sort By
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {activeFilterTab === 'brands' ? (
                <div className="space-y-2">
                  <div className="mb-4">
                    <div className="relative">
                      <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                      <input
                        type="text"
                        placeholder="Search Brands"
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>

                  {getBrands().length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <i className="ri-price-tag-3-line text-3xl mb-2 block"></i>
                      <p className="text-sm">No brands available for this category</p>
                    </div>
                  ) : getBrands().map((brand) => (
                    <label
                      key={brand}
                      className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={tempSelectedBrand === brand}
                        onChange={() => handleBrandSelect(brand)}
                        className="w-4 h-4 text-green-700 border-gray-300 rounded focus:ring-green-500"
                      />
                      <span className="text-sm text-gray-700">{brand}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                    <input
                      type="radio"
                      name="sort"
                      checked={tempSortBy === 'default'}
                      onChange={() => handleSortSelect('default')}
                      className="w-4 h-4 text-green-700 border-gray-300 focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">Relevance (default)</span>
                  </label>

                  <label className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                    <input
                      type="radio"
                      name="sort"
                      checked={tempSortBy === 'price-low'}
                      onChange={() => handleSortSelect('price-low')}
                      className="w-4 h-4 text-green-700 border-gray-300 focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">Price: Low to High</span>
                  </label>

                  <label className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                    <input
                      type="radio"
                      name="sort"
                      checked={tempSortBy === 'price-high'}
                      onChange={() => handleSortSelect('price-high')}
                      className="w-4 h-4 text-green-700 border-gray-300 focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">Price: High to Low</span>
                  </label>

                  <label className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                    <input
                      type="radio"
                      name="sort"
                      checked={tempSortBy === 'name-az'}
                      onChange={() => handleSortSelect('name-az')}
                      className="w-4 h-4 text-green-700 border-gray-300 focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">Name: A to Z</span>
                  </label>

                  <label className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                    <input
                      type="radio"
                      name="sort"
                      checked={tempSortBy === 'name-za'}
                      onChange={() => handleSortSelect('name-za')}
                      className="w-4 h-4 text-green-700 border-gray-300 focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">Name: Z to A</span>
                  </label>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-200 flex gap-2">
              <button
                onClick={clearFilters}
                className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors"
              >
                Clear All
              </button>
              <button
                onClick={applyFilters}
                className="flex-1 py-2 px-4 bg-[#0c831f] hover:bg-green-800 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryProductsPage;


