// Utils
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

// components
import ButtonComponent from "@common/ButtonComponent";

const NotAuthorizedPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation("msg");
  const redirection=()=>{
    let role = JSON.parse(localStorage.getItem("user"))?.role;
    let navigationUrl = "/";
    if(['super_admin', 'admin']?.includes(role)){
        navigationUrl = '/dashboard/sector-master';
    }
    if(['super_admin', 'viewer']?.includes(role)){
        navigationUrl = '/dashboard';
    }
    navigate(navigationUrl);
  }
  return (
    <div className="my-16 mt-[10rem] flex justify-center max-sm:px-4">
      <div className="w-1/3 max-lg:w-1/2 max-sm:w-full border px-5 py-5 max-lg:px-10 max-md:px-5">
        <div className="text-center text-[1.5rem] font-semibold tracking-wide max-lg:text-[1.4em] max-sm:text-[1rem] text-red-600">
          {t("not_authorized")}
        </div>
        <div className="mt-2 text-center text-gray-600 text-sm max-sm:text-[0.9rem]">
          {t("no_permission")}
        </div>
        <div className="mt-4">
          <ButtonComponent
            onClick={() => redirection()}
            type="submit"
            label={t("back_to_home")}
            className="w-full rounded bg-TextPrimaryColor px-6 py-2 text-[12px] text-white"
            icon="pi pi-arrow-right"
            iconPos="right"
          />
        </div>
      </div>
    </div>
  )
}

export default NotAuthorizedPage