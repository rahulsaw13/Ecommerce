// Utils
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_CONSTANTS } from "@constants/apiurl";
import { ROUTES_CONSTANTS } from "@constants/routesurl";
import { useTranslation } from "react-i18next";
import { allApi } from "@api/api";

// Components
import UserLoader from '@userpage-pages/UserLoader';
import Header from '@common/Header';
import Footer from '@common/Footer';
import HorizontalProductCard from "@common/HorizontalProductCard";
import ShopOurSnackRange from "@userpage-pages/ShopOurSnackRange";

const features = [
{ icon: "ri-truck-line", text: "National Shipping in 3-5 days" },
{ icon: "ri-timer-line", text: "15 Days Shelf Life" },
{ icon: "ri-earth-line", text: "International Shipping in 5-7 Days" },
{ icon: "ri-leaf-line", text: "No Preservatives" },
];

const CategoryDescriptionPage = () => {
  const { t } = useTranslation("msg");
  const { name } = useParams();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loader, setLoader] = useState(false);
  const [menuList, setMenuList] = useState([]);
  const [footerRangeList, setFooterRangeList] = useState([]);
  const [snacksRangeData, setSnacksRangeData] = useState([]);
  const navigate = useNavigate();

  const handleSearch = (query) => {
  };

  useEffect(()=>{
      fetchData();
  },[]);

  const fetchData = async () => {
    setLoader(true);
    const promises = [
      getAllSubCategoriesByCategoryname(),
      getCategoryProducts(),
      fetchMenuList(),
      getSnackData()
    ]
    const settledResults = await Promise.allSettled(promises);
    if(settledResults){
      setLoader(false);
    }
  };

  const getCategoryProducts = () =>{
    let body = {
      category_name: name
    };
    return allApi(API_CONSTANTS.GET_PRODUCT_BY_CATEGORY_NAME_URL, body, "post")
    .then((response) => {
      if(response?.status === 200){
        setProducts(response?.data)
      }
    })
    .catch((err) => {
    }).finally(()=> {
    });
  };

  const getSnackData=()=>{
    return allApi(API_CONSTANTS.SNACK_RANGE_URL, "", "get")
    .then((response) => {
      if(response?.status === 200){
        setSnacksRangeData(response?.data)
      }
    })
    .catch((err) => {
    }).finally(()=> {
    });
  };

  const getAllSubCategoriesByCategoryname = ()=>{
    let body = {
      category_name: name
    };
    return allApi(API_CONSTANTS.GET_ALL_SUBCATEGORY_BY_CATEGORY_NAME_URL, body, "post")
    .then((response) => {
      if(response?.status === 200){
        setCategories(response?.data?.category);
      }
    })
    .catch((err) => {
    }).finally(()=> {
    });
  };

  const collectionDescription=(item)=>{
    navigate(
        `${ROUTES_CONSTANTS.VIEW_SUB_CATEGORY_DESCRIPTION}/${item?.name}`, 
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
    })
    .catch((err) => {
    }).finally(()=>{
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
            <h2 className="font-[600] text-sm sm:text-base md:text-lg mt-2"><span className='font-[Tektur] me-1'>{categories?.total_products}</span>{categories?.total_products === 1 ? t("product") : t("products")}</h2>

            {/* Features Section */}
            <div className="flex justify-evenly items-center mt-4 sm:mt-6 w-full px-2">
                {features?.map((feature, index) => (
                <div key={feature?.id} className="flex flex-col items-center">
                    {/* Icon Wrapper */}
                    <div className="w-8 h-8 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-[#b89550] text-white flex items-center justify-center rounded-full text-sm sm:text-xl md:text-2xl">
                    <i className={`${feature.icon}`}></i>
                    </div>
                    {/* Feature Text */}
                    <p className="mt-1 sm:mt-2 text-black text-[0.7rem] sm:text-[0.9rem] md:text-[1rem] font-[600] text-center leading-tight">{feature.text}</p>
                </div>
                ))}
            </div>
        </div>

        <div className="bg-[#fdfaf2] py-4 sm:py-8 px-2 sm:px-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 sm:gap-6">
                {categories?.subcategories?.map((item, index) => (
                  <div key={item?.id} className="text-center">
                      {/* Image */}
                      <div className="relative">
                      <img onClick={() => { collectionDescription(item?.category) }}
                          src={item?.image_url}
                          alt={item?.name}
                          className="w-full h-24 sm:h-32 md:h-40 object-cover rounded-xl shadow-md hover:cursor-pointer"
                      />
                      </div>
                      {/* Text */}
                      <h3 className="mt-2 sm:mt-3 text-sm sm:text-base md:text-lg font-semibold font-[playfair] text-gray-600">{item?.name}</h3>
                  </div>
                ))}
            </div>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 p-2 sm:p-4'>
            {products?.map((item)=>{
                return(
                    <HorizontalProductCard product={item} imageHeight="48rem"/>
                )
            })}
        </div>

        <div className="mt-24">
          <ShopOurSnackRange title={t('shop_our_range')} data={snacksRangeData}/> 
        </div>

        <Footer data={footerRangeList}/>
      </>
    }
    </>
  )
}

export default CategoryDescriptionPage;