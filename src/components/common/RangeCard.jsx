// Utils
import { useNavigate } from 'react-router-dom';
import { ROUTES_CONSTANTS } from "@constants/routesurl";
import { useTranslation } from "react-i18next";

const RangeCard = ({ data }) => {
  const navigate = useNavigate();
  const { t } = useTranslation("msg");

  const collectionDescription=(item)=>{
      navigate(`${ROUTES_CONSTANTS.VIEW_CATEGORY_DESCRIPTION}/${item?.name}`);
  };

  return (
    <div className="flex flex-col cursor-pointer select-none">
    {/* Image Card */}
    <div className="relative w-[85px] h-[85px] sm:w-[110px] sm:h-[110px] md:w-full md:h-[360px] lg:h-[380px] rounded-full sm:rounded-full md:rounded-lg overflow-hidden bg-white shadow-md mx-auto">
      {/* Diagonal Banner */}
      {data?.products_count === 0 && (
        <div className="absolute left-[-2rem] sm:left-[-2.3rem] top-[1.2rem] sm:top-[2.8rem] w-[120px] sm:w-[140px] md:w-[200px] transform -rotate-45 bg-red-500 text-white text-[0.4rem] sm:text-[0.6rem] md:text-[0.75rem] font-semibold text-center py-0.5 sm:py-1 shadow-lg z-10">
          {t("no_product_available")}
        </div>
      )}
  
      <img
        src={data?.category?.image_url}
        className="w-full h-full object-cover"
        alt={data?.category?.name}
        onClick={() => {
          if(data?.products_count !== 0){
            collectionDescription(data?.category);
          };
        }}
        draggable="false"
      />
    </div>
  
    {/* Content */}
    <div className="pt-1 px-1 text-center">
      <div className="text-[#242323] font-semibold text-[10px] sm:text-xs md:text-[1.1rem] leading-tight">
        {data?.category?.name}
      </div>
      <div className="text-[#020202] text-[9px] sm:text-xs md:text-base mt-0.5">
        {data?.products_count} {t("products")}
      </div>
    </div>
  </div>
  
  );
};

export default RangeCard;
