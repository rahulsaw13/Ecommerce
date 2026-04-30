// Authentication utility functions

/**
 * Handle unauthorized response (401 error)
 * Clears localStorage and redirects to root page
 */
export const handleUnauthorized = () => {
  // Clear all user-related data from localStorage
  const theme = localStorage.getItem("theme"); // Preserve theme setting
  localStorage.clear(); // Clear everything
  
  if (theme) {
    localStorage.setItem("theme", theme); // Restore theme
  }
  
  // Redirect to root page
  window.location.href = '/';
};

/**
 * Check if user is authenticated
 * @returns {boolean} - true if user has valid token
 */
export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  const userDetails = localStorage.getItem('userDetails');
  return !!(token && userDetails);
};

/**
 * Get current user details from localStorage
 * @returns {Object|null} - user details or null if not found
 */
export const getCurrentUser = () => {
  try {
    const userDetails = localStorage.getItem('userDetails');
    return userDetails ? JSON.parse(userDetails) : null;
  } catch (error) {
    return null;
  }
};

/**
 * Get current auth token from localStorage
 * @returns {string|null} - auth token or null if not found
 */
export const getAuthToken = () => {
  try {
    const token = localStorage.getItem('token');
    return token ? JSON.parse(token) : null;
  } catch (error) {
    return null;
  }
};

/**
 * Logout user - clear localStorage and redirect
 */
export const logoutUser = () => {
  handleUnauthorized();
};
