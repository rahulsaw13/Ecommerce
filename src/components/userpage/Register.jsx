// import { useState, useEffect } from 'react';
// import { useTranslation } from "react-i18next";
// import { useNavigate } from "react-router-dom";
// import * as yup from "yup";
// import { useFormik } from "formik";

// // Components
// import SignInLayout from '@userpage-pages/SignInLayout';
// import allApi from "@api/api";
// import { API_CONSTANTS } from "@constants/apiurl";
// import InputTextComponent from "@common/InputTextComponent";

// const initialValues = {
//   name: "",
//   email: "",
//   password: "",
//   confirmPassword: "",
//   gender: ""
// };

// const Register = () => {
//   const [registerLoader, setRegisterLoader] = useState(false);
//   const [registerError, setRegisterError] = useState("");
//   const [registerSuccess, setRegisterSuccess] = useState(false);
//   const [googleLoading, setGoogleLoading] = useState(false);
//   const [showPassword, setShowPassword] = useState(false);
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
//   const navigate = useNavigate();
//   const { t } = useTranslation("msg");

//   // Load Google Identity Services
//   useEffect(() => {
//     const script = document.createElement('script');
//     script.src = 'https://accounts.google.com/gsi/client';
//     script.async = true;
//     script.defer = true;
//     document.head.appendChild(script);

//     script.onload = () => {
//       if (window.google) {
//         const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
//         if (!clientId || clientId === 'YOUR_GOOGLE_CLIENT_ID') {
//           setRegisterError('Google Sign-In is not configured. Please contact support.');
//           return;
//         }
        
//         // Initialize Google Identity Services for One Tap (optional)
//         window.google.accounts.id.initialize({
//           client_id: clientId,
//           callback: handleGoogleResponse,
//           auto_select: false,
//           cancel_on_tap_outside: false,
//           context: 'signup',
//           ux_mode: 'popup',
//           itp_support: true
//         });
//       }
//     };

//     script.onerror = () => {
//       setRegisterError('Google Sign-In is not available. Please try again.');
//     };

//     return () => {
//       if (document.head.contains(script)) {
//         document.head.removeChild(script);
//       }
//     };
//   }, []);

//   const handleGoogleResponse = async (response) => {
//     setGoogleLoading(true);
//     setRegisterError(""); // Clear any previous errors
    
//     try {
//       // Decode the JWT token to get user info
//       const userInfo = JSON.parse(atob(response.credential.split('.')[1]));
      
//       // Send user info to backend for registration/login
//       const googleUserData = {
//         google_id: userInfo.sub,
//         email: userInfo.email,
//         name: userInfo.name,
//         picture: userInfo.picture,
//         provider: 'google'
//       };

//       const apiResponse = await allApi(API_CONSTANTS.GOOGLE_AUTH, googleUserData, 'post');
          
//       if (apiResponse?.status === 200 || apiResponse?.status === 201) {
//         // Store token (prefer header, fallback to body.token) and user details
//         const authHeader = apiResponse?.headers?.authorization;
//         const bodyToken = apiResponse?.data?.token;
//         const userData = apiResponse?.data?.data || apiResponse?.data?.user;
//         const tokenToSave = authHeader || (bodyToken ? `Bearer ${bodyToken}` : null);
//         if (tokenToSave) localStorage.setItem("token", JSON.stringify(tokenToSave));
//         if (userData) localStorage.setItem("userDetails", JSON.stringify(userData));
//         // Do not navigate automatically
//       } else {
//         setRegisterError("Google authentication failed. Please try again.");
//       }
//     } catch (error) {
//       setRegisterError(`Google authentication failed: ${error.message}`);
//     } finally {
//       setGoogleLoading(false);
//     }
//   };

//   const validationSchema = yup.object().shape({
//     name: yup.string().required(t("name_is_required")),
//     email: yup.string().email(t("invalid_email")).required(t("email_is_required")),
//     password: yup.string().min(6, t("password_must_be_at_least_6_characters")).required(t("password_is_required")),
//     confirmPassword: yup.string()
//       .oneOf([yup.ref('password'), null], t("passwords_must_match"))
//       .required(t("confirm_password_is_required")),
//     gender: yup.string().required(t("gender_is_required"))
//   });

//   // ================= FIXED SUBMIT =================
// const onHandleSubmit = async () => {
//   setRegisterLoader(true);
//   setRegisterError("");

//   const registerData = {
//     name: values.name,
//     email: values.email,
//     password: values.password,
//     gender: values.gender
//   };

//   try {
//     console.log("REGISTER API HIT 🔥");

//     // ✅ FIXED API CALL
//     const response = await allApi.post("/users", registerData);

//     console.log("REGISTER RESPONSE:", response);

//     if (response?.status === 200 || response?.status === 201) {
//       setRegisterSuccess(true);

//       setTimeout(() => {
//         navigate("/sign-in");
//         resetForm();
//       }, 2000);

//     } else {
//       setRegisterError("Registration failed");
//     }

//   } catch (err) {
//     console.log("REGISTER ERROR:", err);

//     setRegisterError(
//       err?.response?.data?.message ||
//       err?.response?.data?.errors ||
//       "Registration failed"
//     );
//   } finally {
//     setRegisterLoader(false);
//   }
// };

//   const formik = useFormik({
//     initialValues: initialValues,
//     onSubmit: onHandleSubmit,
//     validationSchema: validationSchema,
//     enableReinitialize: true,
//     validateOnBlur: true,
//   });

//   const { values, errors, resetForm, handleSubmit, handleChange, touched } = formik;

//   // Custom change handler to clear register errors
//   const handleInputChange = (e) => {
//     handleChange(e);
//     if (registerError) {
//       setRegisterError("");
//     }
//   };

//   const handleGoogleOAuthResponse = async (response) => {
//     setGoogleLoading(true);
//     setRegisterError(""); // Clear any previous errors
    
//     try {
//       // Fetch user info using the access token
//       const userInfoResponse = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${response.access_token}`);
//       const userInfo = await userInfoResponse.json();
            
//       // Send user info to backend for registration/login
//       const googleUserData = {
//         google_id: userInfo.id,
//         email: userInfo.email,
//         name: userInfo.name,
//         picture: userInfo.picture,
//         provider: 'google'
//       };

//       const apiResponse = await allApi(API_CONSTANTS.GOOGLE_AUTH, googleUserData, 'post');
            
//       if (apiResponse?.status === 200 || apiResponse?.status === 201) {
//         // Store token (prefer header, fallback to body.token) and user details
//         const authHeader = apiResponse?.headers?.authorization;
//         const bodyToken = apiResponse?.data?.token;
//         const userData = apiResponse?.data?.data || apiResponse?.data?.user;
//         const tokenToSave = authHeader || (bodyToken ? `Bearer ${bodyToken}` : null);
//         if (tokenToSave) localStorage.setItem("token", JSON.stringify(tokenToSave));
//         if (userData) localStorage.setItem("userDetails", JSON.stringify(userData));
//         // Do not navigate automatically
//       } else {
//         setRegisterError("Google authentication failed. Please try again.");
//       }
//     } catch (error) {
//       setRegisterError(`Google authentication failed: ${error.message}`);
//     } finally {
//       setGoogleLoading(false);
//     }
//   };

//   const handleGoogleAuth = () => {
//     if (window.google && window.google.accounts && window.google.accounts.oauth2) {
//       try {
//         // Use the correct OAuth2 method
//         const tokenClient = window.google.accounts.oauth2.initTokenClient({
//           client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
//           scope: 'email profile',
//           callback: handleGoogleOAuthResponse
//         });
        
//         tokenClient.requestAccessToken();
//       } catch (error) {
//         setRegisterError('Google Sign-In is not available. Please try again.');
//       }
//     } else {
//       // Fallback to One Tap if OAuth2 is not available
//       if (window.google && window.google.accounts && window.google.accounts.id) {
//         try {
//           window.google.accounts.id.prompt();
//         } catch (error) {
//           setRegisterError('Google Sign-In is not available. Please try again.');
//         }
//       } else {
//         setRegisterError('Google Sign-In is not available. Please try again.');
//       }
//     }
//   };

//   return (
//     <SignInLayout>
//       <div className="flex flex-col items-center justify-center bg-white px-4 sm:px-6 lg:px-8 py-12">
//         <div className="text-center mb-8">
//           <h1 className="text-3xl text-[#1D2E43] font-[playfair] font-bold">
//             {t("register")}
//           </h1>
//           <div className="text-sm text-gray-600 mt-2">
//             <span className="hover:cursor-pointer" onClick={() => { navigate("/") }}>{t("home")}</span> 
//             <span className="mx-1 text-[11px]">&gt;</span> 
//             <span>{t("register")}</span>
//           </div>
//         </div>

//         <div className="w-full max-w-6xl flex justify-center px-2 sm:px-4 flex-col md:flex-row gap-10 md:gap-24">
//           {/* Register Form */}
//           <div className="w-full md:w-1/2 mb-10 md:mb-0 transition-all duration-300 ease-in-out">
//             {registerSuccess ? (
//               <div className="text-center mb-6">
//                 <div className="inline-flex items-center justify-center mb-4">
//                   <i className="ri-check-line text-[2.5rem] text-green-500"></i>
//                 </div>
//                 <h2 className="text-2xl text-[#1D2E43] mb-2 font-[playfair]">{t("registration_successful")}</h2>
//                 <p className="text-[#1D2E43] text-[1rem] mb-2 font-medium">
//                   {t("welcome_to_logo_restaurant")}
//                 </p>
//                 <p className="text-[#cca438] text-[0.9rem] font-semibold">
//                   {t("redirecting_to_login")}
//                 </p>
//               </div>
//             ) : (
//               <>
//                 <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
//                   <div className="space-y-4">
//                   <InputTextComponent
//                     value={values?.name}
//                     onChange={handleInputChange}
//                     type="text"
//                     placeholder={t("full_name")}
//                     name="name"
//                     error={errors?.name}
//                     touched={touched?.name}
//                     className="text-[0.8rem] rounded-none w-full border border-gray-300 px-4 py-2 focus:outline-none focus:ring-1 focus:ring-gray-700"
//                   />
                  
//                   <InputTextComponent
//                     value={values?.email}
//                     onChange={handleInputChange}
//                     type="email"
//                     placeholder={t("email")}
//                     name="email"
//                     error={errors?.email}
//                     touched={touched?.email}
//                     className="text-[0.8rem] rounded-none w-full border border-gray-300 px-4 py-2 focus:outline-none focus:ring-1 focus:ring-gray-700"
//                   />
                  
//                   <div>
//                     <select
//                       value={values?.gender}
//                       onChange={handleInputChange}
//                       name="gender"
//                       className="text-[0.8rem] rounded-none w-full border border-gray-300 px-4 py-2 focus:outline-none focus:ring-1 focus:ring-gray-700"
//                     >
//                       <option value="">{t("select_gender")}</option>
//                       <option value="male">{t("male")}</option>
//                       <option value="female">{t("female")}</option>
//                       <option value="other">{t("other")}</option>
//                     </select>
//                     {errors?.gender && touched?.gender && (
//                       <div className="text-red-600 text-[0.8rem] mt-1">{errors.gender}</div>
//                     )}
//                   </div>
                  
//                   <div className="relative">
//                     <InputTextComponent
//                       value={values?.password}
//                       onChange={handleInputChange}
//                       type={showPassword ? "text" : "password"}
//                       placeholder={t("password")}
//                       name="password"
//                       error={errors?.password}
//                       touched={touched?.password}
//                       className="text-[0.8rem] rounded-none w-full border border-gray-300 px-4 py-2 pr-10 focus:outline-none focus:ring-1 focus:ring-gray-700"
//                     />
//                     <button
//                       type="button"
//                       onClick={() => setShowPassword(!showPassword)}
//                       className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
//                     >
//                       <i className={showPassword ? "ri-eye-off-line" : "ri-eye-line"}></i>
//                     </button>
//                   </div>
                  
//                   <div className="relative">
//                     <InputTextComponent
//                       value={values?.confirmPassword}
//                       onChange={handleInputChange}
//                       type={showConfirmPassword ? "text" : "password"}
//                       placeholder={t("confirm_password")}
//                       name="confirmPassword"
//                       error={errors?.confirmPassword}
//                       touched={touched?.confirmPassword}
//                       className="text-[0.8rem] rounded-none w-full border border-gray-300 px-4 py-2 pr-10 focus:outline-none focus:ring-1 focus:ring-gray-700"
//                     />
//                     <button
//                       type="button"
//                       onClick={() => setShowConfirmPassword(!showConfirmPassword)}
//                       className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
//                     >
//                       <i className={showConfirmPassword ? "ri-eye-off-line" : "ri-eye-line"}></i>
//                     </button>
//                   </div>

//                   {/* Display register error */}
//                   {registerError && (
//                     <div className="text-red-600 text-[0.8rem] font-medium">
//                       {registerError}
//                     </div>
//                   )}

//                   <button
//                     type="submit"
//                     onClick={() => handleSubmit()}
//                     disabled={registerLoader}
//                     className="w-full sm:w-auto text-black text-[1.1rem] font-[playfair] hover:bg-white border px-6 py-2 rounded-md hover:text-[#cca438] hover:border hover:border-[#caa446] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
//                     style={{ background: 'linear-gradient(rgb(255, 193, 7) 0%, rgb(255, 213, 79) 100%)' }}
//                     onMouseEnter={(e) => !registerLoader && (e.currentTarget.style.background = 'white')}
//                     onMouseLeave={(e) => !registerLoader && (e.currentTarget.style.background = 'linear-gradient(rgb(255, 193, 7) 0%, rgb(255, 213, 79) 100%)')}
//                   >
//                     {registerLoader ? (
//                       <div className="flex items-center">
//                         <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
//                         {t("registering")}
//                       </div>
//                     ) : (
//                       t("register")
//                     )}
//                   </button>

//                   {/* Google Sign Up Button - matching SignIn.jsx style */}
//                   <div className="mt-4">
//                     <div className="relative">
//                       <div className="absolute inset-0 flex items-center">
//                         <div className="w-full border-t border-gray-300" />
//                       </div>
//                       <div className="relative flex justify-center text-sm">
//                         <span className="px-2 bg-white text-gray-500">Or continue with</span>
//                       </div>
//                     </div>
                    
//                     <button
//                       type="button"
//                       onClick={handleGoogleAuth}
//                       disabled={googleLoading}
//                       className="mt-4 w-full flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
//                     >
//                       {googleLoading ? (
//                         <div className="flex items-center">
//                           <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700 mr-2"></div>
//                           {t("signing_up_with_google")}
//                         </div>
//                       ) : (
//                         <>
//                           <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
//                             <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
//                             <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
//                             <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
//                             <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
//                           </svg>
//                           Sign up with Google
//                         </>
//                       )}
//                     </button>
//                   </div>

//                   <div className="text-sm text-center mt-4">
//                     <span className="text-gray-600">{t("already_have_account")} </span>
//                     <a
//                       onClick={() => navigate("/sign-in")}
//                       className="text-[#cca438] hover:cursor-pointer hover:text-[#caa446] underline font-[playfair] text-[1rem]"
//                     >
//                       {t("sign_in")}
//                     </a>
//                   </div>
//                   </div>
//                 </form>
                
//                 {/* Hidden div for Google to render button if needed */}
//                 <div id="google-signin-button" style={{ display: 'none' }}></div>
//               </>
//             )}
//           </div>

//           {/* Register Info */}
//           <div className="w-full md:w-1/2">
//             <div className="text-center">
//               <h2 className="text-2xl text-[#1D2E43] mb-4 font-[playfair] font-bold">
//                 {t("join_logo_restaurant")}
//               </h2>
//               <div className="space-y-4 text-left">
//                 <div className="flex items-start">
//                   <i className="ri-check-line text-[#cca438] text-lg mr-3 mt-1"></i>
//                   <div>
//                     <h3 className="text-[#1D2E43] font-semibold mb-1">{t("exclusive_offers")}</h3>
//                     <p className="text-gray-600 text-sm">{t("get_access_to_special_discounts")}</p>
//                   </div>
//                 </div>
//                 <div className="flex items-start">
//                   <i className="ri-check-line text-[#cca438] text-lg mr-3 mt-1"></i>
//                   <div>
//                     <h3 className="text-[#1D2E43] font-semibold mb-1">{t("fast_checkout")}</h3>
//                     <p className="text-gray-600 text-sm">{t("save_your_details_for_quick_orders")}</p>
//                   </div>
//                 </div>
//                 <div className="flex items-start">
//                   <i className="ri-check-line text-[#cca438] text-lg mr-3 mt-1"></i>
//                   <div>
//                     <h3 className="text-[#1D2E43] font-semibold mb-1">{t("order_tracking")}</h3>
//                     <p className="text-gray-600 text-sm">{t("track_your_orders_in_real_time")}</p>
//                   </div>
//                 </div>
//                 <div className="flex items-start">
//                   <i className="ri-check-line text-[#cca438] text-lg mr-3 mt-1"></i>
//                   <div>
//                     <h3 className="text-[#1D2E43] font-semibold mb-1">{t("personalized_recommendations")}</h3>
//                     <p className="text-gray-600 text-sm">{t("discover_dishes_youll_love")}</p>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </SignInLayout>
//   );
// };

// export default Register;

import { useState, useEffect } from 'react';
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import * as yup from "yup";
import { useFormik } from "formik";
import { useDispatch, useSelector } from 'react-redux';
import toast, { Toaster } from 'react-hot-toast';

// Components
import SignInLayout from '@userpage-pages/SignInLayout';
import InputTextComponent from "@common/InputTextComponent";

// Redux actions
import { signupUser, clearStatus, googleSignIn } from "../../redux/slices/authSlice";

const initialValues = {
  name: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  gender: ""
};

const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation("msg");
  
  // Redux state
  const { loading: reduxLoading, error: reduxError, signupSuccess } = useSelector((state) => state.auth);
  
  // Local state
  const [registerLoader, setRegisterLoader] = useState(false);
  const [registerError, setRegisterError] = useState("");
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Clear Redux status on component unmount
  useEffect(() => {
    return () => {
      dispatch(clearStatus());
    };
  }, [dispatch]);

  // Show toast functions
  const showSuccessToast = (message) => {
    toast.success(message, {
      duration: 3000,
      position: 'top-center',
      style: {
        background: '#4CAF50',
        color: '#fff',
        fontSize: '16px',
        padding: '16px',
        borderRadius: '12px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
      },
      icon: '✅',
    });
  };

  const showErrorToast = (message) => {
    toast.error(message, {
      duration: 4000,
      position: 'top-center',
      style: {
        background: '#f44336',
        color: '#fff',
        fontSize: '16px',
        padding: '16px',
        borderRadius: '12px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
      },
      icon: '❌',
    });
  };

  // Monitor Redux signup state
  useEffect(() => {
    if (signupSuccess) {
      setRegisterSuccess(true);
      showSuccessToast(t('registration_successful') || "Registration successful!");
      setTimeout(() => {
        navigate("/sign-in");
        resetForm();
        dispatch(clearStatus());
      }, 2000);
    }
  }, [signupSuccess, navigate, dispatch, t]);

  // Monitor Redux errors
  useEffect(() => {
    if (reduxError) {
      let errorMessage = t("registration_failed") || "Registration failed";
      
      if (typeof reduxError === 'string') {
        errorMessage = reduxError;
      } else if (reduxError?.message) {
        errorMessage = reduxError.message;
      } else if (reduxError?.error) {
        errorMessage = reduxError.error;
      } else if (reduxError?.errors) {
        if (typeof reduxError.errors === 'string') {
          errorMessage = reduxError.errors;
        } else if (Array.isArray(reduxError.errors)) {
          errorMessage = reduxError.errors.join(', ');
        } else if (reduxError.errors?.email) {
          errorMessage = reduxError.errors.email[0] || "Email already exists";
        } else {
          errorMessage = JSON.stringify(reduxError.errors);
        }
      }
      
      setRegisterError(errorMessage);
      showErrorToast(errorMessage);
      setRegisterLoader(false);
    }
  }, [reduxError, t]);

  // Load Google Identity Services
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    script.onload = () => {
      if (window.google) {
        const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
        if (!clientId || clientId === 'YOUR_GOOGLE_CLIENT_ID') {
          console.warn('Google Client ID not configured');
          return;
        }
        
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleResponse,
          auto_select: false,
          cancel_on_tap_outside: false,
          context: 'signup',
          ux_mode: 'popup',
          itp_support: true
        });
      }
    };

    script.onerror = () => {
      console.error('Failed to load Google Sign-In script');
    };

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  // Handle Google response using Redux
  const handleGoogleResponse = async (response) => {
    setGoogleLoading(true);
    setRegisterError("");
    
    try {
      if (!response || !response.credential) {
        throw new Error('Invalid Google response');
      }
      
      const result = await dispatch(googleSignIn({ token: response.credential })).unwrap();
      
      if (result?.user) {
        const userData = result.user;
        const token = result.token;
        
        if (token) localStorage.setItem("token", JSON.stringify(token));
        if (userData) localStorage.setItem("userDetails", JSON.stringify(userData));
        
        showSuccessToast(t('login_successful') || "Login successful!");
        setTimeout(() => {
          navigate("/");
        }, 1500);
      }
    } catch (error) {
      console.error('Google Sign-In failed:', error);
      let errorMsg = error?.message || 'Google Sign-In failed. Please try again.';
      setRegisterError(errorMsg);
      showErrorToast(errorMsg);
    } finally {
      setGoogleLoading(false);
    }
  };

  const validationSchema = yup.object().shape({
    name: yup.string().required(t("name_is_required")),
    email: yup.string().email(t("invalid_email")).required(t("email_is_required")),
    phone: yup.string().matches(/^[0-9]{10}$/, "Phone number must be 10 digits").required("Phone number is required"),
    password: yup.string().min(6, t("password_must_be_at_least_6_characters")).required(t("password_is_required")),
    confirmPassword: yup.string()
      .oneOf([yup.ref('password'), null], t("passwords_must_match"))
      .required(t("confirm_password_is_required")),
    gender: yup.string().required(t("gender_is_required"))
  });

  // Submit handler using Redux - WITHOUT user wrapper
  const onHandleSubmit = async () => {
    setRegisterLoader(true);
    setRegisterError("");

    // IMPORTANT: Send data directly WITHOUT { user: ... } wrapper
    const registerData = {
      name: values.name,
      email: values.email,
      phone: values.phone,
      password: values.password,
      gender: values.gender
    };

    console.log("Submitting registration data:", registerData);

    try {
      const resultAction = await dispatch(signupUser(registerData));
      console.log("Result action:", resultAction);
      
      if (signupUser.rejected.match(resultAction)) {
        console.log("Registration rejected:", resultAction.payload);
        setRegisterLoader(false);
      }
    } catch (err) {
      console.error("Registration error:", err);
      let errorMessage = "Registration failed. Please try again.";
      setRegisterError(errorMessage);
      showErrorToast(errorMessage);
      setRegisterLoader(false);
    }
  };

  const formik = useFormik({
    initialValues: initialValues,
    onSubmit: onHandleSubmit,
    validationSchema: validationSchema,
    enableReinitialize: true,
    validateOnBlur: true,
  });

  const { values, errors, resetForm, handleSubmit, handleChange, touched } = formik;

  // Custom change handler to clear register errors
  const handleInputChange = (e) => {
    handleChange(e);
    if (registerError) {
      setRegisterError("");
    }
  };

  const handleGoogleAuth = () => {
    if (window.google && window.google.accounts && window.google.accounts.id) {
      try {
        window.google.accounts.id.prompt();
      } catch (error) {
        console.error('Google One Tap failed:', error);
        setRegisterError('Google Sign-In is not available. Please try again.');
        showErrorToast('Google Sign-In is not available. Please try again.');
      }
    } else {
      setRegisterError('Google Sign-In is not available. Please try again.');
      showErrorToast('Google Sign-In is not available. Please try again.');
    }
  };

  return (
    <>
      <Toaster 
        position="top-center"
        reverseOrder={false}
        gutter={8}
        containerStyle={{
          top: 20,
          left: '50%',
          transform: 'translateX(-50%)',
        }}
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
            borderRadius: '12px',
            padding: '16px',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#4CAF50',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#f44336',
              secondary: '#fff',
            },
          },
        }}
      />
      
      <SignInLayout>
        <div className="flex flex-col items-center justify-center bg-white px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-8">
            <h1 className="text-3xl text-[#1D2E43] font-[playfair] font-bold">
              {t("register")}
            </h1>
            <div className="text-sm text-gray-600 mt-2">
              <span className="hover:cursor-pointer" onClick={() => { navigate("/") }}>{t("home")}</span> 
              <span className="mx-1 text-[11px]">&gt;</span> 
              <span>{t("register")}</span>
            </div>
          </div>

          <div className="w-full max-w-6xl flex justify-center px-2 sm:px-4 flex-col md:flex-row gap-10 md:gap-24">
            {/* Register Form */}
            <div className="w-full md:w-1/2 mb-10 md:mb-0 transition-all duration-300 ease-in-out">
              {registerSuccess ? (
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center mb-4">
                    <i className="ri-check-line text-[2.5rem] text-green-500"></i>
                  </div>
                  <h2 className="text-2xl text-[#1D2E43] mb-2 font-[playfair]">{t("registration_successful")}</h2>
                  <p className="text-[#1D2E43] text-[1rem] mb-2 font-medium">
                    {t("welcome_to_logo_restaurant")}
                  </p>
                  <p className="text-[#cca438] text-[0.9rem] font-semibold">
                    {t("redirecting_to_login")}
                  </p>
                </div>
              ) : (
                <>
                  <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                    <div className="space-y-4">
                      <InputTextComponent
                        value={values?.name}
                        onChange={handleInputChange}
                        type="text"
                        placeholder={t("full_name")}
                        name="name"
                        error={errors?.name}
                        touched={touched?.name}
                        className="text-[0.8rem] rounded-none w-full border border-gray-300 px-4 py-2 focus:outline-none focus:ring-1 focus:ring-gray-700"
                      />
                      
                      <InputTextComponent
                        value={values?.email}
                        onChange={handleInputChange}
                        type="email"
                        placeholder={t("email")}
                        name="email"
                        error={errors?.email}
                        touched={touched?.email}
                        className="text-[0.8rem] rounded-none w-full border border-gray-300 px-4 py-2 focus:outline-none focus:ring-1 focus:ring-gray-700"
                      />

                      <InputTextComponent
                        value={values?.phone}
                        onChange={handleInputChange}
                        type="tel"
                        placeholder="Phone Number"
                        name="phone"
                        error={errors?.phone}
                        touched={touched?.phone}
                        className="text-[0.8rem] rounded-none w-full border border-gray-300 px-4 py-2 focus:outline-none focus:ring-1 focus:ring-gray-700"
                      />

                      <div>
                        <select
                          value={values?.gender}
                          onChange={handleInputChange}
                          name="gender"
                          className="text-[0.8rem] rounded-none w-full border border-gray-300 px-4 py-2 focus:outline-none focus:ring-1 focus:ring-gray-700"
                        >
                          <option value="">{t("select_gender")}</option>
                          <option value="male">{t("male")}</option>
                          <option value="female">{t("female")}</option>
                          <option value="other">{t("other")}</option>
                        </select>
                        {errors?.gender && touched?.gender && (
                          <div className="text-red-600 text-[0.8rem] mt-1">{errors.gender}</div>
                        )}
                      </div>
                      
                      <div className="relative">
                        <InputTextComponent
                          value={values?.password}
                          onChange={handleInputChange}
                          type={showPassword ? "text" : "password"}
                          placeholder={t("password")}
                          name="password"
                          error={errors?.password}
                          touched={touched?.password}
                          className="text-[0.8rem] rounded-none w-full border border-gray-300 px-4 py-2 pr-10 focus:outline-none focus:ring-1 focus:ring-gray-700"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          <i className={showPassword ? "ri-eye-off-line" : "ri-eye-line"}></i>
                        </button>
                      </div>
                      
                      <div className="relative">
                        <InputTextComponent
                          value={values?.confirmPassword}
                          onChange={handleInputChange}
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder={t("confirm_password")}
                          name="confirmPassword"
                          error={errors?.confirmPassword}
                          touched={touched?.confirmPassword}
                          className="text-[0.8rem] rounded-none w-full border border-gray-300 px-4 py-2 pr-10 focus:outline-none focus:ring-1 focus:ring-gray-700"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          <i className={showConfirmPassword ? "ri-eye-off-line" : "ri-eye-line"}></i>
                        </button>
                      </div>

                      {registerError && (
                        <div className="text-red-600 text-[0.8rem] font-medium">
                          {registerError}
                        </div>
                      )}

                      <button
                        type="submit"
                        onClick={() => handleSubmit()}
                        disabled={registerLoader || reduxLoading}
                        className="w-full sm:w-auto text-black text-[1.1rem] font-[playfair] hover:bg-white border px-6 py-2 rounded-md hover:text-[#cca438] hover:border hover:border-[#caa446] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        style={{ background: 'linear-gradient(rgb(255, 193, 7) 0%, rgb(255, 213, 79) 100%)' }}
                        onMouseEnter={(e) => !(registerLoader || reduxLoading) && (e.currentTarget.style.background = 'white')}
                        onMouseLeave={(e) => !(registerLoader || reduxLoading) && (e.currentTarget.style.background = 'linear-gradient(rgb(255, 193, 7) 0%, rgb(255, 213, 79) 100%)')}
                      >
                        {(registerLoader || reduxLoading) ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            {t("registering")}
                          </div>
                        ) : (
                          t("register")
                        )}
                      </button>

                      {/* Google Sign Up Button */}
                      <div className="mt-4">
                        <div className="relative">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300" />
                          </div>
                          <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-gray-500">Or continue with</span>
                          </div>
                        </div>
                        
                        <button
                          type="button"
                          onClick={handleGoogleAuth}
                          disabled={googleLoading}
                          className="mt-4 w-full flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {googleLoading ? (
                            <div className="flex items-center">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700 mr-2"></div>
                              {t("signing_up_with_google")}
                            </div>
                          ) : (
                            <>
                              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                              </svg>
                              Sign up with Google
                            </>
                          )}
                        </button>
                      </div>

                      <div className="text-sm text-center mt-4">
                        <span className="text-gray-600">{t("already_have_account")} </span>
                        <a
                          onClick={() => navigate("/sign-in")}
                          className="text-[#cca438] hover:cursor-pointer hover:text-[#caa446] underline font-[playfair] text-[1rem]"
                        >
                          {t("sign_in")}
                        </a>
                      </div>
                    </div>
                  </form>
                  
                  <div id="google-signin-button" style={{ display: 'none' }}></div>
                </>
              )}
            </div>

            {/* Register Info */}
            <div className="w-full md:w-1/2">
              <div className="text-center">
                <h2 className="text-2xl text-[#1D2E43] mb-4 font-[playfair] font-bold">
                  {t("join_logo_restaurant")}
                </h2>
                <div className="space-y-4 text-left">
                  <div className="flex items-start">
                    <i className="ri-check-line text-[#cca438] text-lg mr-3 mt-1"></i>
                    <div>
                      <h3 className="text-[#1D2E43] font-semibold mb-1">{t("exclusive_offers")}</h3>
                      <p className="text-gray-600 text-sm">{t("get_access_to_special_discounts")}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <i className="ri-check-line text-[#cca438] text-lg mr-3 mt-1"></i>
                    <div>
                      <h3 className="text-[#1D2E43] font-semibold mb-1">{t("fast_checkout")}</h3>
                      <p className="text-gray-600 text-sm">{t("save_your_details_for_quick_orders")}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <i className="ri-check-line text-[#cca438] text-lg mr-3 mt-1"></i>
                    <div>
                      <h3 className="text-[#1D2E43] font-semibold mb-1">{t("order_tracking")}</h3>
                      <p className="text-gray-600 text-sm">{t("track_your_orders_in_real_time")}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <i className="ri-check-line text-[#cca438] text-lg mr-3 mt-1"></i>
                    <div>
                      <h3 className="text-[#1D2E43] font-semibold mb-1">{t("personalized_recommendations")}</h3>
                      <p className="text-gray-600 text-sm">{t("discover_dishes_youll_love")}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SignInLayout>
    </>
  );
};

export default Register;