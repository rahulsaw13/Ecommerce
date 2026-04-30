// Utils
import { useLayoutEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { API_CONSTANTS } from "@constants/apiurl";
import { ROUTES_CONSTANTS } from "@constants/routesurl";
import { Swiper, SwiperSlide } from 'swiper/react';
import { useTranslation } from "react-i18next";
import { allApi } from "@api/api";
import 'swiper/css/bundle';

// Components
import UserLoader from '@userpage-pages/UserLoader';
import Header from '@common/Header';
import Footer from '@common/Footer';
import HorizontalProductCard from "@common/HorizontalProductCard";

const features = [
{ icon: "ri-truck-line", text: "National Shipping in 3-5 days" },
{ icon: "ri-timer-line", text: "15 Days Shelf Life" },
{ icon: "ri-earth-line", text: "International Shipping in 5-7 Days" },
{ icon: "ri-leaf-line", text: "No Preservatives" },
];

const CollectionDescription = () => {
  const location = useLocation();
  const { t } = useTranslation("msg");
  const { subCategoryId, name, subCategory } = location?.state || {};
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loader, setLoader] = useState(false);
  const [menuList, setMenuList] = useState([]);
  const [footerRangeList, setFooterRangeList] = useState([]);
  const navigate = useNavigate();

  const handleSearch = (query) => {
  };

  useLayoutEffect(()=>{
      fetchData();
  },[]);

  const fetchData = async () => {
    setLoader(true);
    const promises = [
      getAllCategories(),
      getCategoryProducts(),
      fetchMenuList()
    ]
    const settledResults = await Promise.all(promises);
    if(settledResults){
      setLoader(false);
    }
  }

  const getCategoryProducts = () =>{
    let body = {
      subcategory_id: subCategoryId
    };
    return allApi(API_CONSTANTS.GET_PRODUCT_BY_SUBCATEGORY_ID_URL, body, "post")
    .then((response) => {
      if(response?.status === 200){
        setProducts(response?.data)
      }
    });
  };

  const getAllCategories = ()=>{
    let url = subCategory ? API_CONSTANTS.ALL_SUB_CATEGORY_URL : API_CONSTANTS.ALL_CATEGORY_URL;
    return allApi(url, "", "get")
    .then((response) => {
      if(response?.status === 200){
        setCategories(response?.data)
      }
    });
  };

  const collectionDescription=(item)=>{
    navigate(
        `${ROUTES_CONSTANTS.VIEW_COLLECTION_DESCRIPTION}/${item?.name}`, 
    { 
    state: { 
        category_id: item?.id,
        name: item?.name
    } })
  };

  const fetchMenuList = () => {
    return allApi(API_CONSTANTS.MENU_LIST_URL, "" , "get")
    .then((response) => {
      if (response.status === 200) {
          let data = response?.data.filter((item, index) => index <= 6);
          setFooterRangeList(data);
          data.push({name: "About Us"});
          setMenuList(data)
      } 
    });
  };

  return (
    <>
    {loader ? <UserLoader/> : 
      <>
        <Header onSearch={handleSearch}/>
        <div className="bg-[#fdfaf2] text-center py-8 mt-16">
            {/* Breadcrumb */}
            <nav className="text-gray-600 text-[12px] sm:text-[14px] md:text-[16px]">
                <span className='hover:cursor-pointer' onClick={()=>{ navigate("/") }}>{t("home")}</span> <span className='px-2 sm:px-4'>&gt;</span> <span className="text-gray-600 hover:cursor-pointer">{name}</span>
            </nav>

            {/* Product Count */}
            <h2 className="font-[600] text-lg mt-2"><span className='font-[Tektur] me-1'>{products?.length}</span>{products?.length === 1 ? t("product") : t("products")}</h2>

            {/* Features Section */}
            <div className="flex justify-evenly items-center mt-6 w-full">
                {features?.map((feature, index) => (
                <div key={index} className="flex flex-col items-center">
                    {/* Icon Wrapper */}
                    <div className="w-14 h-14 bg-[#b89550] text-white flex items-center justify-center rounded-full text-2xl">
                    <i className={`${feature.icon}`}></i>
                    </div>
                    {/* Feature Text */}
                    <p className="mt-2 text-black text-[1rem] font-[600]">{feature.text}</p>
                </div>
                ))}
            </div>
        </div>

        <div className='grid grid-cols-2 gap-4 p-4'>
            {products?.map((item)=>{
                return(
                    <HorizontalProductCard product={item} imageHeight="48rem"/>
                )
            })}
        </div>

        <div className="bg-[#ede9dd] py-8 px-4">
            <h1 className="text-[#1D2E43] font-[playfair] text-[2.25rem] sm:text-[36px] font-bold text-center mb-8 px-6 sm:px-10">{t("shop_our_other_range")}</h1>
            <Swiper
                spaceBetween={10}
                breakpoints={{
                  0: {
                    slidesPerView: 2,
                  },
                  480: {
                    slidesPerView: 3,
                  },
                  640: {
                    slidesPerView: 4,
                  },
                  768: {
                    slidesPerView: 4,
                  },
                  1024: {
                    slidesPerView: 6,
                  },
                }}
                >
                {categories?.map((item, index) => (
                  <SwiperSlide key={item?.id}>
                    <div key={item?.id} className="text-center w-full">
                        {/* Image */}
                        <div className="relative w-full">
                          <img onClick={() => { collectionDescription(item?.category) }}
                              src={item?.category?.image_url}
                              alt={item?.category?.name}
                              className="w-full h-40 object-cover rounded-xl shadow-md hover:cursor-pointer"
                          />
                        </div>
                        {/* Text */}
                        <h3 className="mt-3 text-lg font-semibold font-[playfair] text-gray-600">{item?.category?.name}</h3>
                        <p className="text-sm text-gray-600">{item?.category?.count}</p>
                    </div>
                  </SwiperSlide>
                ))}
            </Swiper>
        </div>

        <Footer data={footerRangeList}/>
      </>
    }
    </>
  )
}

export default CollectionDescription;