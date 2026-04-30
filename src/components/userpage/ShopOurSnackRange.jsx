import { useNavigate } from 'react-router-dom';
import { ROUTES_CONSTANTS } from "@constants/routesurl";
import { useTranslation } from "react-i18next";
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css/bundle';

const ShopOurSnackRange = ({ title, data }) => {
    const { t } = useTranslation("msg");
    const navigate = useNavigate();

    const collectionDescription = (item) => {
        navigate(`${ROUTES_CONSTANTS.VIEW_SUB_CATEGORY_DESCRIPTION}/${title}`);
    };

    return (
        <section className="relative h-full">
            <div className="absolute w-full h-full z-0 inset-0 bg-[#ede9dd]"></div>
            <div className="relative flex flex-col justify-center items-center">
                <h1 className="text-[#1D2E43] font-[playfair] text-[1.4rem] sm:text-[1.8rem] md:text-[2.5rem] font-bold text-center mt-6 sm:mt-10 px-4 sm:px-6 md:px-10">
                    {title}
                </h1>
                
                {/* Mobile and Tablet: Swiper */}
                <div className="block lg:hidden w-full px-4 sm:px-6 md:px-10 py-6 sm:py-8 md:py-10 z-10">
                    <Swiper
                        loop={true}
                        allowTouchMove={true}
                        spaceBetween={12}
                        breakpoints={{
                            320: {
                                slidesPerView: 2.5,
                                spaceBetween: 8,
                            },
                            480: {
                                slidesPerView: 3,
                                spaceBetween: 10,
                            },
                            640: {
                                slidesPerView: 3.5,
                                spaceBetween: 20,
                            },
                            768: {
                                slidesPerView: 4,
                                spaceBetween: 30,
                            },
                            1024: {
                                slidesPerView: 5,
                                spaceBetween: 40,
                            },
                        }}
                    >
                        {data?.map((item) => (
                            <SwiperSlide key={item?.id}>
                                <div 
                                    className="flex flex-col items-center justify-center hover:cursor-pointer transition-transform duration-200 hover:scale-105"
                                    onClick={() => collectionDescription(item?.category)}
                                >
                                    <div className="w-full h-auto">
                                        <img 
                                            src={item?.image_url} 
                                            alt={t("snacks")} 
                                            className="w-full h-auto rounded-lg shadow-sm"
                                        />
                                    </div>
                                    <div className="mt-2 sm:mt-3">
                                        <p className="font-bold text-[0.7rem] sm:text-sm text-center text-[#1D2E43]">
                                            {item?.name}
                                        </p>
                                    </div>
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </div>

                {/* Desktop: Grid */}
                <div className="hidden lg:grid lg:grid-cols-5 gap-4 px-4 sm:px-6 md:px-10 py-6 sm:py-8 md:py-10 justify-center items-center z-10">
                    {data?.map((item) => (
                        <div
                            key={item?.id}
                            className="flex flex-col items-center justify-center hover:cursor-pointer transition-transform duration-200 hover:scale-105"
                            onClick={() => collectionDescription(item?.category)}
                        >
                            <div className="w-full h-auto">
                                <img 
                                    src={item?.image_url} 
                                    alt={t("snacks")} 
                                    className="w-full h-auto rounded-lg shadow-sm"
                                />
                            </div>
                            <div className="mt-3 md:mt-4">
                                <p className="font-bold text-sm md:text-base text-center text-[#1D2E43]">
                                    {item?.name}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default ShopOurSnackRange;