// Utils
import { useState } from "react";
import { Menu } from "primereact/menu";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

// Components
import { ROUTES_CONSTANTS } from "@constants/routesurl";

const Sidebar = ({ toggle, items }) => {
  const { t } = useTranslation("msg");
  const navigate = useNavigate();
  const location = useLocation(); 
  const [hoveredItem, setHoveredItem] = useState(null);

  // Check if route is active - match exact route or any sub-route
  const isActive = (route) => {
    // For Dashboard, only match exact route
    if (route === ROUTES_CONSTANTS.DASHBOARD) {
      return location.pathname === route;
    }
    
    // For other routes, match exact route or sub-routes
    if (location.pathname === route) return true;
    
    // Check if current path starts with the route (for sub-routes)
    if (location.pathname.startsWith(route + '/')) {
      return true;
    }
    
    return false;
  };

  const handleMouseEnter = (item) => {
    setHoveredItem(item.route);
  };

  const handleMouseLeave = () => {
    setHoveredItem(null);
  };

  const removeFocusClass = () => {
    const firstFocusedItem = document.querySelector(".p-menuitem.p-focus");
    if (firstFocusedItem) {
      firstFocusedItem.classList.remove("p-focus");
    }
  };

  return (
    <div className="bg-BgTertiaryColor text-TextPrimaryColor h-screen">
      {/* Logo & Title */}
      <div
        className={`p-5 flex items-center gap-3 ${
          toggle ? "" : "justify-center"
        }`}
      >
        <i
          className="ri-shopping-bag-3-line text-[24px] hover:cursor-pointer"
          onClick={() => {
            navigate(ROUTES_CONSTANTS.DASHBOARD);
          }}
        ></i>
        {toggle && (
          <div>
            <div>{t("ecommerce")}</div>
            <div className="text-[0.6rem]">{t("management_system")}</div>
          </div>
        )}
      </div>

      {!toggle && (
        <div className="flex w-full justify-center">
          <hr className="w-[90%]" />
        </div>
      )}

      {/* Sidebar Menu - Hide scrollbar */}
      <div className="px-4 h-[88vh] overflow-y-auto overflow-x-hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <style>{`
          .px-4::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        <Menu
          model={items.map((item, index) => {
            const active = isActive(item.route);
            const hovered = hoveredItem === item.route;
            const showFilledIcon = active || hovered;

            return {
              ...item,
              icon: showFilledIcon ? item.filledIcon : item.icon,
              className: "",
              template: (
                <div
                  key={item.route}
                  onMouseEnter={() => handleMouseEnter(item)}
                  onMouseLeave={handleMouseLeave}
                  onClick={() => {
                    navigate(item.route);
                    setTimeout(() => {
                      if (item.route !== ROUTES_CONSTANTS.DASHBOARD) {
                        removeFocusClass();
                      }
                    }, 0);
                  }}
                  className={`p-menuitem-content group sidebar-menu-content flex items-center transition-all duration-200 ease-in-out rounded-md cursor-pointer ${
                    active
                      ? "bg-TextPrimaryColor text-white"
                      : "hover:bg-TextPrimaryColor hover:text-white"
                  } ${toggle ? "w-full px-3 py-2" : "w-[57px] justify-center p-2"}`}
                >
                  <i
                    className={`${showFilledIcon ? item.filledIcon : item.icon} text-[1.2rem] custom-target-icon-${index}`}
                  ></i>
                  {toggle && (
                    <span className="ml-3">{item.label}</span>
                  )}
                </div>
              ),
            };
          })}
          className="custom-menu-container bg-BgTertiaryColor p-0 text-[0.8rem]"
        />
      </div>
    </div>
  );
};

export default Sidebar;