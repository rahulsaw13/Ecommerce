import { useLocation } from 'react-router-dom';
import Loading from '@common/Loading';
import UserLoader from '@userpage-pages/UserLoader';

const RouteLoader = () => {
  const location = useLocation();
  
  // Admin routes that should use the admin loader
  const adminRoutes = ['/login', '/dashboard', '/forgot-password', '/reset-password', '/profile', '/not-authorized', '/help'];
  
  // Check if current path is an admin route
  const isAdminRoute = adminRoutes.some(route => location.pathname.startsWith(route));
  
  // Use admin loader for admin routes, user loader for everything else
  return isAdminRoute ? <Loading /> : <UserLoader />;
};

export default RouteLoader;
