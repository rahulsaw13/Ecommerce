// Utils
import { Suspense, useState, lazy } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

// Components
import { Topbar, ReviewList, Sidebar, CategoryList, ProductList, DashboardStats, SubCategoryList, OrderList, CustomerList, CustomerEnquiryList, MastersList, SettingsList, HomeSectionList } from "@adminpage-components/index";
import Loading from "@common/Loading";
import { ROUTES_CONSTANTS } from "@constants/routesurl";

const CategoryForm = lazy(() => import("@adminpage-layouts/Category/CategoryForm"));
const SubCategoryForm = lazy(() => import("@adminpage-layouts/SubCategory/SubCategoryForm"));
const ProductForm = lazy(() => import("@adminpage-layouts/Product/ProductForm"));
const ProductVariantForm = lazy(() => import("@adminpage-layouts/Product/ProductVariantForm"));
const OrderForm = lazy(() => import("@adminpage-layouts/Order/OrderForm"));
const CustomerForm = lazy(() => import("@adminpage-layouts/User/UserForm"));
const MastersForm = lazy(() => import("@adminpage-layouts/Master/MastersForm"));
const SettingsForm = lazy(() => import("@adminpage-layouts/Settings/SettingsForm"));
const HomeSectionForm = lazy(() => import("@adminpage-layouts/HomeSection/HomeSectionForm"));
const NewDiscountList = lazy(() => import("@adminpage-layouts/Discount/NewDiscountList"));
const NewDiscountForm = lazy(() => import("@adminpage-layouts/Discount/NewDiscountForm"));

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
      label: t("home_sections"),
      icon: "ri-layout-grid-line",
      filledIcon: "ri-layout-grid-fill",
      route: ROUTES_CONSTANTS.HOME_SECTIONS,
    },
    {
      label: t("categories"),
      icon: "ri-folder-6-line",
      filledIcon: "ri-folder-6-fill",
      route: ROUTES_CONSTANTS.CATEGORIES,
    },
    {
      label: t("sub_categories"),
      icon: "ri-folders-line",
      filledIcon: "ri-folders-fill",
      route: ROUTES_CONSTANTS.SUB_CATEGORIES,
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
    {
      label: t("customers"),
      icon: "ri-group-line",
      filledIcon: "ri-group-fill",
      route: ROUTES_CONSTANTS.CUSTOMERS,
    },
    {
      label: t("discounts"),
      icon: "ri-coupon-line",
      filledIcon: "ri-coupon-fill",
      route: ROUTES_CONSTANTS.DISCOUNTS,
    },
    {
      label: t("reviews"),
      icon: "ri-draft-line",
      filledIcon: "ri-draft-fill",
      route: ROUTES_CONSTANTS.REVIEWS,
    },
    {
      label: "Settings",
      icon: "ri-settings-4-line",
      filledIcon: "ri-settings-4-fill",
      route: ROUTES_CONSTANTS.SETTINGS,
    },
    {
      label: t("customer_enquiries"),
      icon: "ri-question-line",
      filledIcon: "ri-question-fill",
      route: ROUTES_CONSTANTS.CUSTOMER_ENQUIRIES,
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
              <Route path="/categories" element={<CategoryList search={searchField}/>} />
              <Route path="/sub-categories" element={<SubCategoryList search={searchField}/>} />
              <Route path="/products" element={<ProductList search={searchField}/>} />
              <Route path="/home-sections" element={<HomeSectionList search={searchField}/>} />
              <Route path="/discounts" element={<NewDiscountList search={searchField}/>} />
              <Route path="/orders" element={<OrderList search={searchField}/>} />
              <Route path="/customers" element={<CustomerList search={searchField}/>} />
              <Route path="/reviews" element={<ReviewList search={searchField}/>} />
              <Route path="/customer-enquiries" element={<CustomerEnquiryList search={searchField}/>} />
              <Route path="/masters" element={<MastersList search={searchField}/>} />
              <Route path="/settings" element={<SettingsList search={searchField}/>} />

              {/* Create / Update forms */}
              <Route path="/create-category" element={<CategoryForm />} />
              <Route path="/edit-category/:id" element={<CategoryForm />} />
              <Route path="/create-sub-category" element={<SubCategoryForm />} />
              <Route path="/edit-sub-category/:id" element={<SubCategoryForm />} />
              <Route path="/create-product" element={<ProductForm />} />
              <Route path="/edit-product/:id" element={<ProductForm />} />
              <Route path="/edit-product-variant/:productId/:variantId" element={<ProductVariantForm />} />
              <Route path="/add-home-section" element={<HomeSectionForm />} />
              <Route path="/edit-home-section/:id" element={<HomeSectionForm />} />
              <Route path="/add-discount" element={<NewDiscountForm />} />
              <Route path="/edit-discount/:id" element={<NewDiscountForm />} />
              <Route path="/view-discount/:id" element={<NewDiscountForm />} />
              <Route path="/create-order" element={<OrderForm />} />
              <Route path="/edit-order/:id" element={<OrderForm />} />
              <Route path="/edit-customer/:id" element={<CustomerForm />} />
              <Route path="/create-customer" element={<CustomerForm />} />
              <Route path="/create-master" element={<MastersForm />} />
              <Route path="/edit-master/:id" element={<MastersForm />} />
              <Route path="/edit-settings/:id" element={<SettingsForm />} />
            </Routes>
          </Suspense>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;