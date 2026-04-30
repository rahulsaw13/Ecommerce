// external libraries
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

// components
import ButtonComponent from "@common/ButtonComponent";

const HelpdeskPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation("msg");

  const redirection = () => {
    navigate('/dashboard');
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center px-4">
      <div className="w-1/3 max-lg:w-1/2 max-sm:w-full border px-5 py-5 max-lg:px-10 max-md:px-5">
        <div className="text-center text-[1.5rem] font-semibold tracking-wide text-indigo-600">
          {t("help_desk")}
        </div>
        <div className="mt-2 text-center text-gray-600 text-sm max-sm:text-[0.9rem]">
          {t("help_desk_assitance")}
          <a href="mailto:hiteshsukhpal03@gmail.com" className="text-blue-500"> hiteshsukhpal03@gmail.com</a>
        </div>
        <div className="mt-4">
          <ButtonComponent
            onClick={redirection}
            type="submit"
            label={t("back_to_home")}
            className="w-full rounded bg-TextPrimaryColor px-6 py-2 text-[12px] text-white"
            icon="pi pi-arrow-right"
            iconPos="right"
          />
        </div>
      </div>
    </div>
  );
}

export default HelpdeskPage;
