import './App.css';
import './styles/user-scrollbar.css';
import './styles/admin-scrollbar.css';

// components
import RouteLoader from '@common/RouteLoader';

// utils
import { lazy, Suspense, useEffect } from "react";
import { Routes, Route, Navigate } from 'react-router-dom';
import 'remixicon/fonts/remixicon.css';
import "primereact/resources/themes/lara-light-cyan/theme.css";
import { loadThemeColors, initializeThemeFromStorage } from '@utils/themeUtils';
import { useDispatch } from 'react-redux';
import { checkAuth } from './redux/slices/authSlice';

// Admin pages
const DashboardPage = lazy(() => import("@pages/DashboardPage"));
const AdminLogin = lazy(() => import("@adminpage-layouts/Login"));
const NotAuthorizedPage = lazy(() => import("@pages/NotAuthorizedPage"));
const HelpdeskPage = lazy(() => import("@userpage-pages/HelpdeskPage"));
const ProfilePage = lazy(() => import("@userpage-pages/ProfilePage"));

// Delivery Agent pages
const DeliveryDashboard = lazy(() => import("@adminpage-components/delivery-agent/DeliveryDashboard"));
const DeliveryOrderDetails = lazy(() => import("@adminpage-components/delivery-agent/DeliveryOrderDetails"));

// User pages
const MainPage = lazy(()=> import("@pages/MainPage"));
const ViewCart = lazy(() => import("@userpage-pages/ViewCartPage"));
const SignIn = lazy(() => import("@userpage-pages/SignIn"));
const Register = lazy(() => import("@userpage-pages/Register"));
const CollectionDescription = lazy(() => import("@userpage-pages/CollectionDescription"));
const LatestBlogDescription = lazy(() => import("@userpage-pages/LatestBlogDescription"));
const ProductDescription = lazy(() => import("@userpage-pages/ProductDescription"));
const PaymentConfirmed = lazy(() => import("@userpage-pages/PaymentConfirmed"));
const PaymentRejected = lazy(() => import("@userpage-pages/PaymentRejected"));
const UserProfilePage = lazy(() => import("@userpage-pages/UserProfilePage"));
const UserHelpPage = lazy(() => import("@userpage-pages/UserHelpPage"));
const UserResetPasswordPage = lazy(() => import("@userpage-pages/UserResetPasswordPage"));
const ChangePasswordPage = lazy(() => import("@userpage-pages/ChangePasswordPage"));
const AboutUs = lazy(() => import("@userpage-pages/AboutUs"));
const TermsAndCondition = lazy(() => import("@userpage-pages/TermsAndCondition"));
const CategoryDescriptionPage = lazy(() => import("@userpage-pages/CategoryDescriptionPage"));
const SubCategoryDescriptionPage = lazy(() => import("@userpage-pages/SubCategoryDescriptionPage"));
const ReturnExchangePolicyPage = lazy(() => import("@userpage-pages/ReturnExchangePolicyPage"));
const ProductsPage = lazy(() => import("@userpage-pages/ProductsPage"));
const ShippingPolicyPage = lazy(() => import("@userpage-pages/ShippingPolicyPage"));
const PrivacyPolicyPage = lazy(() => import("@userpage-pages/PrivacyPolicyPage"));
const ContactUsPage = lazy(() => import("@userpage-pages/ContactUsPage"));
const TrackOrderPage = lazy(() => import("@userpage-pages/TrackOrderPage"));
const OrderHistoryPage = lazy(() => import("@userpage-pages/OrderHistoryPage"));
const PrintInvoiceComponent = lazy(() => import("@adminpage-layouts/Order/PrintInvoiceComponent"));
const CategoryProductsPage = lazy(() => import("@userpage-pages/CategoryProductsPage"));
const DealsPage = lazy(() => import("@userpage-pages/DealsPage"));
const AddAddressPage = lazy(() => import("@userpage-pages/AddAddressPage"));
const PlaceOrderPage = lazy(() => import("@userpage-pages/PlaceOrderPage"));

export function PrivateRoute({ children, role, type }) {
  const authorization = JSON.parse(localStorage.getItem('userDetails'));
  return authorization ? (
      role == authorization?.role_id ? (
          children
      ) : (
        <Navigate to="/" />
      )
  ) : (
      <Navigate to="/" />
  );
}

function App() {
  const theme = localStorage.getItem('theme');
  if (theme === 'dark') {
      document.body.classList.add('dark-theme');
  }

  // Initialize theme from localStorage immediately (synchronous, no flash)
  initializeThemeFromStorage();

  const dispatch = useDispatch();

  // Load theme colors from API only if user is logged in
  useEffect(() => {
    dispatch(checkAuth());
    const token = localStorage.getItem('token');
    if (token) {
      loadThemeColors();
    }
  }, []);

  return (
    <Suspense fallback={<RouteLoader />}>
        <Routes>
          {/* Admin login */}
          <Route path="/admin/login" element={<AdminLogin />}/>

          {/* Routes for user screen */}
          <Route path="/" element={<MainPage />}/>
          <Route path="/sign-in" element={<SignIn />}/>
          <Route path="/register" element={<Register />}/>
          <Route path="/view-cart" element={<ViewCart />}/>
          <Route path="/view-blog" element={<LatestBlogDescription />}/>
          <Route path="/collection/:name" element={<CollectionDescription />}/>
          <Route path="/products" element={<ProductsPage />}/>
          <Route path="/product/:name" element={<ProductDescription />}/>
          <Route path="/payment-confirmed" element={<PaymentConfirmed />}/>
          <Route path="/payment-rejected" element={<PaymentRejected />}/>
          <Route path="/edit-profile" element={<UserProfilePage />}/>
          <Route path="/change-password" element={<ChangePasswordPage />}/>
          <Route path="/user-help" element={<UserHelpPage />}/>
          <Route path="/user-reset-password" element={<UserResetPasswordPage />}/>
          <Route path="/about-us" element={<AboutUs />}/>
          <Route path="/terms-condition" element={<TermsAndCondition />}/>
          <Route path="/category-description/:name" element={<CategoryDescriptionPage />}/>
          <Route path="/sub-category-description/:name" element={<SubCategoryDescriptionPage />}/>
          <Route path="/return-exchange-policy" element={<ReturnExchangePolicyPage />}/>
          <Route path="/shipping-policy" element={<ShippingPolicyPage />}/>
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />}/>
          <Route path="/contact-us" element={<ContactUsPage />}/>
          <Route path="/track-order" element={<TrackOrderPage />}/>
          <Route path="/order-history" element={<OrderHistoryPage />}/>
          <Route path="/print-invoice/:id" element={<PrintInvoiceComponent />}/>
          <Route path="/category" element={<CategoryProductsPage />}/>
          <Route path="/deals/:id" element={<DealsPage />}/>
          <Route path="/add-address" element={<AddAddressPage />}/>
          <Route path="/place-order" element={<PlaceOrderPage />}/>
          
          {/* Routes for delivery agent screen */}
          <Route path="/delivery-dashboard" element={
             <PrivateRoute role={3}>
                <DeliveryDashboard />
            </PrivateRoute>
          }/>
          <Route path="/delivery-order/:orderId" element={
             <PrivateRoute role={3}>
                <DeliveryOrderDetails />
            </PrivateRoute>
          }/>
          
          {/* Routes for admin screen */}
          <Route path="/dashboard/*" element={
             <PrivateRoute
                role={1}>
                <DashboardPage />
            </PrivateRoute>
            }/>
          <Route path="/profile/:id" element={<PrivateRoute
                role={1}>
                <ProfilePage />
            </PrivateRoute>
            }/>
          <Route path="/not-authorized" element={<PrivateRoute
                role={1}>
                <NotAuthorizedPage />
            </PrivateRoute>
          }/>
          <Route path="/help" element={<PrivateRoute
                role={1}>
                <HelpdeskPage />
            </PrivateRoute>
          }/>
        </Routes>
    </Suspense>
  );
}

export default App;
