// import axios from "axios";

// const API = axios.create({
//   baseURL: "http://localhost:8070/api/v1/ecommerce",
// });

// // Add tenant header automatically
// API.interceptors.request.use((config) => {
//   config.headers["X-Tenant-Domain"] = "localhost";
//   return config;
// });

// export default API;




import axios from "axios";

const API = axios.create({
  baseURL: (process.env.REACT_APP_BASE_URL || "") + "/api/v1/ecommerce",
});

// Interceptor to fix duplicate /api/v1/ in URLs
API.interceptors.request.use((config) => {
  // Remove duplicate 'api/v1' from URL
  if (config.url && config.url.includes('api/v1/')) {
    config.url = config.url.replace('api/v1/', '');
  }
  config.headers["X-Tenant-Domain"] = typeof window !== "undefined" ? window.location.hostname : "localhost";
  return config;
});

export default API;