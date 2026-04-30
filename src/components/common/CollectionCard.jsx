// Utils
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

// Components
import { ROUTES_CONSTANTS } from "@constants/routesurl";
import Image from "@common/Image";

const CollectionCard = ({ data }) => {
  const { t } = useTranslation("msg");
  const navigate = useNavigate();

  const collectionDescription = (item) => {
    navigate(
      `${ROUTES_CONSTANTS.VIEW_COLLECTION_DESCRIPTION}/${item?.name}`,
      {
        state: {
          subCategoryId: item?.id,
          name: item?.name,
          subCategory: true
        }
      }
    );
  };

  return (
    <div className="flex flex-col cursor-pointer select-none pb-2 sm:pb-4 px-1 sm:px-2 md:px-4">
      <div className="flex-shrink-0 w-full h-[12rem] sm:h-[25rem] rounded-md sm:rounded-lg overflow-hidden bg-white shadow-sm sm:shadow-md">
        <Image
          src={data?.image_url}
          className="w-full object-cover object-center aspect-[9/12] transform transition-transform duration-1000 ease-in-out hover:scale-110 hover:cursor-pointer"
          alt={data?.name}
          draggable="false"
          onClick={() => collectionDescription(data)}
        />
      </div>
      <div className="p-2 sm:p-3 md:p-4">
        <div className="text-[#242323] text-center font-semibold text-sm sm:text-lg md:text-xl lg:text-[1.3rem] truncate">
          {data?.name}
        </div>
        <div className="text-center text-xs sm:text-sm md:text-base text-[#020202] line-clamp-2 mt-1">
          {data?.description}
        </div>
      </div>
      <div className="mt-1 sm:mt-2">
        <button
          onClick={() => collectionDescription(data)}
          className="w-full px-3 sm:px-5 py-1.5 sm:py-2 md:py-3 text-xs sm:text-sm md:text-base text-[#242323] border border-gray-900 rounded-md transition-all duration-300 hover:bg-gray-900 hover:text-white"
        >
          {t("view_collection")}
        </button>
      </div>
    </div>
  );
};

export default CollectionCard;
