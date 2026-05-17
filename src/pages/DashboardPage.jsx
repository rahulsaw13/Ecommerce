// Utils
import { Suspense, useState, lazy } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

// Components
import { Topbar, Sidebar, ProductList, DashboardStats, OrderList } from "@adminpage-components/index";
import Loading from "@common/Loading";
import { ROUTES_CONSTANTS } from "@constants/routesurl";

const ProductForm = lazy(() => import("@adminpage-layouts/Product/ProductForm"));
const ProductVariantForm = lazy(() => import("@adminpage-layouts/Product/ProductVariantForm"));
const OrderForm = lazy(() => import("@adminpage-layouts/Order/OrderForm"));

const DashboardPage = () => {
  const [toggle, setToggle] = useState(true);
  const { t } = useTranslation("msg");
  const location = useLocation(); // Get the current route
  const [searchField, setSearchField] = useState("");

  const toggleExpansionSwitch = (key) => {
    setToggle(key);
  };

  const searchChangeHandler=(data)=>{
    setSearchField(data);
  }

  // Check if the current route is an edit or create route
  const isCreateOrEditPage = /\/(create|edit|view|add)-/.test(location.pathname);

  // Define menu items with their corresponding routes
  const items = [
    {
      label: t("dashboard"),
      icon: "ri-dashboard-line",
      filledIcon: "ri-dashboard-fill",
      route: ROUTES_CONSTANTS.DASHBOARD,
    },
    {
      label: t("products"),
      icon: "ri-instance-line",
      filledIcon: "ri-instance-fill",
      route: ROUTES_CONSTANTS.PRODUCTS,
    },
    {
      label: t("orders"),
      icon: "ri-typhoon-line",
      filledIcon: "ri-typhoon-fill",
      route: ROUTES_CONSTANTS.ORDERS,
    },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-BgPrimaryColor admin-panel">
      {/* Conditionally render sidebar */}
      {!isCreateOrEditPage && (
        <div className={`sidebar ${toggle ? "w-[300px]" : "w-[103px]"} h-full overflow-hidden`}>
          <Sidebar toggle={toggle} items={items}/>
        </div>
      )}
      <div className="w-full">
        {/* Conditionally render topbar */}
        {!isCreateOrEditPage && <Topbar toggleExpansionSwitch={toggleExpansionSwitch} searchChangeHandler={searchChangeHandler} searchField={searchField}/>}
        <div className={`${isCreateOrEditPage ? "": "h-full bg-BgPrimaryColor px-5 py-2"}`}>
          <Suspense fallback={<Loading loadingText={t("loading")} />}>
            <Routes>
              <Route path="/" element={<DashboardStats />} />

              {/* Listings */}
              <Route path="/products" element={<ProductList search={searchField}/>} />
              <Route path="/orders" element={<OrderList search={searchField}/>} />

              {/* Create / Update forms */}
              <Route path="/create-product" element={<ProductForm />} />
              <Route path="/edit-product/:id" element={<ProductForm />} />
              <Route path="/edit-product-variant/:productId/:variantId" element={<ProductVariantForm />} />
              <Route path="/create-order" element={<OrderForm />} />
              <Route path="/edit-order/:id" element={<OrderForm />} />
            </Routes>
          </Suspense>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;