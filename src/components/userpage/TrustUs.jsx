import Since1988 from "@assets/since_1988.webp";
import MakeInIndia from "@assets/make_in_india.webp";
import EcoFriendly from "@assets/eco_friendly.webp";
import FastDelivery from "@assets/fast_delivery.webp";
import { useTranslation } from "react-i18next";

const TrustUs = () => {
  const { t } = useTranslation("msg");
  
  return (
    <div className="flex flex-col justify-center items-center p-6 sm:p-10">
      <h2 className="font-sans font-semibold text-center mt-2 text-sm sm:text-base md:text-lg">
        {t("you_can_trust_us")}
      </h2>
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mt-1 text-[#1D2E43] font-[playfair]">
        {t("clean_authentic_sustainable")}
      </h1>
      <div className="grid grid-cols-4 gap-2 sm:gap-6 md:gap-8 lg:gap-10 px-2 sm:px-6 md:px-10 py-4 sm:py-6 justify-center items-center">
        <img
          src={MakeInIndia}
          alt={t("make_in_india")}
          className="w-14 sm:w-20 md:w-24 lg:w-32 h-auto object-contain"
        />
        <img
          src={Since1988}
          alt={t("since_1988")}
          className="w-16 sm:w-20 md:w-28 lg:w-36 h-auto object-contain"
        />
        <img
          src={EcoFriendly}
          alt={t("eco_friendly")}
          className="w-14 sm:w-20 md:w-24 lg:w-32 h-auto object-contain"
        />
        <img
          src={FastDelivery}
          alt={t("fast_delivery")}
          className="w-14 sm:w-20 md:w-24 lg:w-32 h-auto object-contain"
        />
      </div>
    </div>
  );
};
  
  export default TrustUs;  