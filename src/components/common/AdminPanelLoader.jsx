import { useTranslation } from "react-i18next";

const AdminPanelLoader = () => {
    const { t } = useTranslation("msg");
    return (
      <div className="fixed inset-0 z-[1000] flex items-center justify-center backdrop-blur-[1px] bg-white/10">
        <div className="relative flex flex-col items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-gray-200 border-t-[#522e83]"></div>
          <span className="mt-2 text-sm font-medium hidden sm:block">{t("loading")}...</span>
        </div>
      </div>
    )
  }
  
  export default AdminPanelLoader;