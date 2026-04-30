// import axios from 'axios';
// import { handleUnauthorized } from '../utils/authUtils';
// const apiBaseURL = process.env.REACT_APP_BASE_URL;

// function appendFormData(formData, data, parentKey = "") {
//   Object.entries(data).forEach(([key, value]) => {
//     const formKey = parentKey ? `${parentKey}[${key}]` : key;
//     if (key === "image" || key === "file") {
//         if (value instanceof File) {
//             formData.append(formKey, value);
//         }
//         // else: skip if it's not a File
//         } else if (typeof value === "object" && value !== null && !(value instanceof File)) {
//         appendFormData(formData, value, formKey); // recurse
//         } else {
//         formData.append(formKey, value);
//     }
//   });
// }

// export const allApi = (dataurl, data, method, contentType) => {
//     const headers = {
//         'Content-Type': 'application/json',
//     }
//     if(contentType){
//         headers['Content-Type'] = 'multipart/form-data';
//         let requestData = new FormData();
//         Object.keys(data).forEach((key) => {
//             requestData.append(key, data[key]);
//         });
//         if ('post' === method) {
//             return axios.post(`${apiBaseURL}/${dataurl}`, requestData, { headers: headers });
//         }
//     }
//     if ('post' === method) {
//         return axios.post(`${apiBaseURL}/${dataurl}`, JSON.stringify(data), { headers: headers });
//     }
//     if ('get' === method) {
//         return axios.get(`${apiBaseURL}/${dataurl}`);
//     }
//     if ('delete' === method) {
//         return axios.delete(`${apiBaseURL}/${dataurl}`);
//     }
//     if ('put' === method) {
//         return axios?.put(`${apiBaseURL}/${dataurl}`, data);
//     }
// };

// export const allApiWithHeaderToken = (dataurl, data, method, contentType, responseType) => {
//     let token = localStorage.getItem('token');
//     // Clean up token - remove quotes and extra Bearer prefix
//     if (token) {
//         try {
//             // Try to parse if it's JSON, otherwise use as is
//             token = JSON.parse(token);
//         } catch (e) {
//             // Token is already a string, keep as is
//         }
//         if (typeof token === 'string') {
//             token = token.replace(/"/g, ''); // Remove quotes
//             token = token.replace(/^Bearer\s+Bearer\s+/, 'Bearer '); // Fix double Bearer
//             if (!token.startsWith('Bearer ')) {
//                 token = `Bearer ${token}`;
//             }
//         }
//     }
//     const headers = {
//         'Content-Type': 'application/json',
//         'Authorization': token
//     }
//     const axiosInstance = axios.create({
//         baseURL: apiBaseURL,
//         headers: headers,
//         responseType: responseType ? responseType : "json"
//     });
//     // Handle File content
//     if(contentType){
//         headers['Content-Type'] = 'multipart/form-data';
//         let requestData = new FormData();
//         appendFormData(requestData, data);
//         if ('post' === method) {
//             return axios.post(`${apiBaseURL}/${dataurl}`, requestData, { headers: headers });
//         }
//         if ('put' === method) {
//             return axios?.put(`${apiBaseURL}/${dataurl}`, requestData, { headers: headers });
//         }
//         if ('patch' === method) {
//             return axios?.patch(`${apiBaseURL}/${dataurl}`, requestData, { headers: headers });
//         }
//     }
//     else {
//         // Interceptor
//         axiosInstance.interceptors.response.use(
//         (response) => {
//             // Return the response if successful
//             return response;
//         },
//         (error) => {
//             // If error response has a status of 401 (Unauthorized), handle logout
//             if (error.response && error.response.status === 401) {
//                 handleUnauthorized();
//             }
//             return Promise.reject(error); // Reject promise if something goes wrong
//         }
//         );
        
//         if ('post' === method) {
//             return axiosInstance.post(dataurl, JSON.stringify(data), { headers: headers });
//         }
//         if ('get' === method) {
//             return axiosInstance.get(dataurl, { headers: headers });
//         }
//         if ('delete' === method) {
//             return axiosInstance.delete(dataurl, { headers: headers });
//         }
//         if ('put' === method) {
//             return axiosInstance?.put(dataurl, data, { headers: headers });
//         }
//         if ('patch' === method) {
//             return axiosInstance.patch(dataurl, JSON.stringify(data), { headers: headers });
//         }
        
//         // If no method matches, return a rejected promise
//         return Promise.reject(new Error('Invalid method: ' + method));
//     }
// };




import axios from "axios";

const BASE_URL = "http://localhost:8070/api/v1/ecommerce";

// ✅ normal api
const allApi = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    "X-Tenant-Domain": "localhost"
  }
});

// ✅ token api
const allApiWithHeaderToken = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    "X-Tenant-Domain": "localhost"
  }
});

// 🔥 token attach (FIXED)
allApiWithHeaderToken.interceptors.request.use((config) => {
  const tokenStr = localStorage.getItem("token");
  if (tokenStr) {
    let token = tokenStr;
    try {
      token = JSON.parse(tokenStr);
    } catch (e) {
      // It's a plain string
    }
    
    if (token) {
      config.headers["Authorization"] = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
    }
  }

  return config;
});

// 🔥 response error handle
allApiWithHeaderToken.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      console.log("Unauthorized");
    }
    return Promise.reject(err);
  }
);

// ✅ exports
export default allApi;
export { allApi, allApiWithHeaderToken };