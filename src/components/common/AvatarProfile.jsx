// Utils
import { useRef, useState } from "react";
import { TieredMenu } from "primereact/tieredmenu";
import { Avatar } from "primereact/avatar";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Toast } from "primereact/toast";

// Components
import { API_CONSTANTS } from "@constants/apiurl";
import { allApiWithHeaderToken } from "@api/api";

const AvatarProfile = ({ size, shape, userDetails }) => {
  const data = JSON.parse(localStorage.getItem("userDetails"));
  const menu = useRef(null);
  const toast = useRef(null);
  const { t } = useTranslation("msg");
  const [toastType, setToastType] = useState(''); 
  const [showLanguages, setShowLanguages] = useState(false);
  const navigate = useNavigate();
  const currentLang = localStorage.getItem("i18nextLng") || "en";

  const items = [
    {
      template: () => (
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#cca438] to-[#b69754] text-white flex items-center justify-center font-semibold text-base shadow-sm overflow-hidden">
              {data?.image_url ? (
                <img src={data.image_url} alt={data?.name} className="w-full h-full object-cover" />
              ) : (
                data?.name?.[0]?.toUpperCase() || 'U'
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{data?.name}</p>
              <p className="text-xs text-gray-500 truncate">{getRoleDisplayName()}</p>
            </div>
          </div>
        </div>
      )
    },
    {
      template: () => (
        <button
          onClick={() => navigate(`/profile/${data?.id}`)}
          className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors group"
        >
          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
            <i className="ri-id-card-line text-gray-600 text-base"></i>
          </div>
          <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{t("my_profile")}</span>
        </button>
      )
    },
    {
      template: () => (
        <button
          onClick={() => navigate('/help')}
          className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors group"
        >
          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
            <i className="ri-questionnaire-line text-gray-600 text-base"></i>
          </div>
          <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{t("help")}</span>
        </button>
      )
    },
    {
      template: () => (
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowLanguages(!showLanguages);
            }}
            className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors group"
          >
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
              <i className="ri-global-line text-gray-600 text-base"></i>
            </div>
            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 flex-1 text-left">{t("languages")}</span>
            <i className={`ri-arrow-${showLanguages ? 'up' : 'down'}-s-line text-gray-400 text-base transition-transform`}></i>
          </button>
          
          {showLanguages && (
            <div className="px-4 pb-2" onClick={(e) => e.stopPropagation()}>
              <div className="bg-gray-50 rounded-lg p-1 space-y-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    localStorage.setItem("i18nextLng", "en");
                    window.location.reload();
                  }}
                  className={`w-full px-3 py-2 rounded-md text-left text-sm transition-colors ${
                    currentLang === 'en' 
                      ? 'bg-white text-gray-900 font-medium shadow-sm' 
                      : 'text-gray-600 hover:bg-white hover:text-gray-900'
                  }`}
                >
                  <i className="ri-checkbox-blank-circle-fill text-xs mr-2" style={{ color: currentLang === 'en' ? '#cca438' : 'transparent' }}></i>
                  {t("english")}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    localStorage.setItem("i18nextLng", "hi");
                    window.location.reload();
                  }}
                  className={`w-full px-3 py-2 rounded-md text-left text-sm transition-colors ${
                    currentLang === 'hi' 
                      ? 'bg-white text-gray-900 font-medium shadow-sm' 
                      : 'text-gray-600 hover:bg-white hover:text-gray-900'
                  }`}
                >
                  <i className="ri-checkbox-blank-circle-fill text-xs mr-2" style={{ color: currentLang === 'hi' ? '#cca438' : 'transparent' }}></i>
                  {t("hindi")}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    localStorage.setItem("i18nextLng", "gj");
                    window.location.reload();
                  }}
                  className={`w-full px-3 py-2 rounded-md text-left text-sm transition-colors ${
                    currentLang === 'gj' 
                      ? 'bg-white text-gray-900 font-medium shadow-sm' 
                      : 'text-gray-600 hover:bg-white hover:text-gray-900'
                  }`}
                >
                  <i className="ri-checkbox-blank-circle-fill text-xs mr-2" style={{ color: currentLang === 'gj' ? '#cca438' : 'transparent' }}></i>
                  {t("gujrati")}
                </button>
              </div>
            </div>
          )}
        </div>
      )
    },
    {
      template: () => (
        <div className="border-t border-gray-100 mt-1">
          <button
            onClick={() => {
              logout();
              let theme = localStorage.getItem("theme");
              localStorage.clear();
              localStorage.setItem("theme", theme);
            }}
            className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-red-50 transition-colors group"
          >
            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center group-hover:bg-red-200 transition-colors">
              <i className="ri-logout-circle-r-line text-red-600 text-base"></i>
            </div>
            <span className="text-sm font-medium text-red-600 group-hover:text-red-700">{t("logout")}</span>
          </button>
        </div>
      )
    },
  ];

  const logout=()=>{
    // Clear user session from local storage
    localStorage.removeItem("token");
    localStorage.removeItem("userDetails");
    
    // Redirect to login page with state
    navigate("/", { 
      state: { 
        isLogout: "success"
      } 
    });
  }

  // Function to get role display name
  const getRoleDisplayName = () => {
    const roleId = data?.role_id;
    switch (roleId) {
      case 1:
        return t("admin");
      case 2:
        return t("user");
      case 3:
        return t("warehouse_supervisor");
      default:
        return t("user");
    }
  };

  return (
    <div className="card justify-content-center flex text-TextPrimaryColor">
      <div className="me-4">
        <div className="text-[0.8rem] capitalize">{userDetails?.name || '-'}</div>
        <div className="text-[0.6rem] capitalize">{getRoleDisplayName()}</div>
      </div>
      <Toast ref={toast} position="top-right" style={{scale: '0.7'}}/>
      <Avatar
        image={data?.image_url ? data?.image_url : "https://primefaces.org/cdn/primereact/images/avatar/amyelsner.png"}
        className="mr-2"
        size={size}
        shape={shape}
        onClick={(e) => menu.current.toggle(e)}
        style={{ 
          width: size === 'large' ? '3rem' : size === 'xlarge' ? '4rem' : '2.5rem',
          height: size === 'large' ? '3rem' : size === 'xlarge' ? '4rem' : '2.5rem',
          minWidth: size === 'large' ? '3rem' : size === 'xlarge' ? '4rem' : '2.5rem',
          minHeight: size === 'large' ? '3rem' : size === 'xlarge' ? '4rem' : '2.5rem',
          objectFit: 'cover'
        }}
      />
      <TieredMenu
        model={items}
        popup
        ref={menu}
        breakpoint="767px"
        className="admin-avatar-menu"
      />
      
      <style>{`
        /* Modern Admin Avatar Menu Styling */
        .admin-avatar-menu {
          border-radius: 12px !important;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12) !important;
          border: 1px solid #e5e7eb !important;
          overflow: hidden !important;
          min-width: 280px !important;
          padding: 0 !important;
        }
        .admin-avatar-menu .p-tieredmenu-root-list {
          padding: 0 !important;
        }
        .admin-avatar-menu .p-menuitem {
          margin: 0 !important;
        }
        .admin-avatar-menu .p-menuitem-link {
          padding: 0 !important;
          border-radius: 0 !important;
        }
        .admin-avatar-menu .p-menuitem-link:hover {
          background-color: transparent !important;
        }
        .admin-avatar-menu .p-menuitem-content {
          border-radius: 0 !important;
        }
      `}</style>
    </div>
  );
};

export default AvatarProfile;
