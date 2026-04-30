// // utils
// import { useState, useEffect } from 'react';
// import { useTranslation } from "react-i18next";
// import { useNavigate } from "react-router-dom";
// import * as yup from "yup";
// import { useFormik } from "formik";

// // Components
// import SignInLayout from '@userpage-pages/SignInLayout';
// import { allApi } from "@api/api";
// import { API_CONSTANTS } from "@constants/apiurl";
// import InputTextComponent from "@common/InputTextComponent";
// import { loadThemeColors } from '@utils/themeUtils';


// const initialValues = {
//   email: "",
//   password: ""
// };

// const SignInRegister = () => {
//   const [loginLoader, setLoginLoader] = useState(false);
//   const [otpLoader, setOtpLoader] = useState(false);
//   const [resendOtpLoader, setResendOtpLoader] = useState(false);
//   const [forgotPasswordLoader, setForgotPasswordLoader] = useState(false);
//   const [showPassword, setShowPassword] = useState(false);
//   const navigate = useNavigate();
//   const { t } = useTranslation("msg");
//   const [data, setData] = useState(initialValues);
//   const [isLoginScreen, setIsLoginScreen] = useState(false);
//   const [isForgotPasswordSent, setIsForgotPasswordSent] = useState(false);
//   const [showOTPVerification, setShowOTPVerification] = useState(false);
//   const [userEmail, setUserEmail] = useState("");
//   const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
//   const [isOTPExpired, setIsOTPExpired] = useState(false);
//   const [loginError, setLoginError] = useState(""); // New state for login errors
//   const [showWelcomeMessage, setShowWelcomeMessage] = useState(false); // New state for welcome message
//   const [welcomeUserName, setWelcomeUserName] = useState(""); // New state for user name
//   const [googleError, setGoogleError] = useState(""); // New state for Google authentication errors

//   // Countdown timer effect for OTP
//   useEffect(() => {
//     if (showOTPVerification && timeLeft > 0) {
//       const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
//       return () => clearTimeout(timer);
//     } else if (timeLeft === 0) {
//       setIsOTPExpired(true);
//     }
//   }, [timeLeft, showOTPVerification]);

//   // Google Identity Services script loading
//   useEffect(() => {
//     const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
    
//     if (!clientId) {
//       return;
//     }

//     // Check if script is already loaded
//     if (window.google && window.google.accounts) {
//       initializeGoogleAuth(clientId);
//       return;
//     }

//     const script = document.createElement('script');
//     script.src = 'https://accounts.google.com/gsi/client';
//     script.async = true;
//     script.defer = true;
    
//     script.onload = () => {
//       initializeGoogleAuth(clientId);
//     };
    
//     script.onerror = () => {
//       setGoogleError('Google Sign-In is not available. Please try again.');
//     };
    
//     document.head.appendChild(script);

//     return () => {
//       // Cleanup script if component unmounts
//       const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
//       if (existingScript) {
//         existingScript.remove();
//       }
//     };
//   }, []);

//   // Initialize Google Authentication
//   const initializeGoogleAuth = (clientId) => {
//     if (!window.google || !window.google.accounts) {
//       return;
//     }

//     try {
//       window.google.accounts.id.initialize({
//         client_id: clientId,
//         callback: handleGoogleResponse,
//         auto_select: false,
//         cancel_on_tap_outside: false,
//         context: 'signin',
//         ux_mode: 'popup',
//         itp_support: true,
//         use_fedcm_for_prompt: true
//       });
//     } catch (error) {
//       setGoogleError('Google Sign-In initialization failed. Please try again.');
//     }
//   };

//   // Handle Google One Tap response
//   const handleGoogleResponse = async (response) => {
//     try {      
//       // Decode the JWT token to get user info
//       const payload = JSON.parse(atob(response.credential.split('.')[1]));      
//       const googleData = {
//         google_id: payload.sub,
//         email: payload.email,
//         name: payload.name,
//         picture: payload.picture,
//         provider: 'google'
//       };
            
//       // Send to backend for authentication (match login API format)
//       const apiResponse = await allApi(API_CONSTANTS.GOOGLE_AUTH, googleData, "post");
      
//       if (apiResponse?.status === 200 || apiResponse?.status === 201) {
//         // Store token (prefer header, fallback to body.token) and user details
//         const authHeader = apiResponse?.headers?.authorization;
//         const bodyToken = apiResponse?.data?.token;
//         const userData = apiResponse?.data?.data;
//         const tokenToSave = authHeader || (bodyToken ? `Bearer ${bodyToken}` : null);
//         if (tokenToSave) localStorage.setItem("token", JSON.stringify(tokenToSave));
//         if (userData) localStorage.setItem("userDetails", JSON.stringify(userData));
//         // navigate("/");
//       } else {
//         setGoogleError('Google authentication failed. Please try again.');
//       }
//     } catch (error) {
//       setGoogleError('Google Sign-In failed. Please try again.');
//     }
//   };

//   // Handle Google OAuth2 response (fallback method)
//   const handleGoogleOAuthResponse = async (response) => {
//     try {      
//       // Fetch user info using the access token
//       const userInfoResponse = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${response.access_token}`);
//       const userInfo = await userInfoResponse.json();
            
//       const googleData = {
//         google_id: userInfo.id,
//         email: userInfo.email,
//         name: userInfo.name,
//         picture: userInfo.picture,
//         provider: 'google'
//       };
            
//       // Send to backend for authentication (match login API format)
//       const apiResponse = await allApi(API_CONSTANTS.GOOGLE_AUTH, googleData, "post");
      
//       if (apiResponse?.status === 200 || apiResponse?.status === 201) {
//         // Store token (prefer header, fallback to body.token) and user details
//         const authHeader = apiResponse?.headers?.authorization;
//         const bodyToken = apiResponse?.data?.token;
//         const userData = apiResponse?.data?.data;
//         const tokenToSave = authHeader || (bodyToken ? `Bearer ${bodyToken}` : null);
//         if (tokenToSave) localStorage.setItem("token", JSON.stringify(tokenToSave));
//         if (userData) localStorage.setItem("userDetails", JSON.stringify(userData));
//         // navigate("/");
//       } else {
//         setGoogleError('Google authentication failed. Please try again.');
//       }
//     } catch (error) {
//       setGoogleError('Google Sign-In failed. Please try again.');
//     }
//   };

//   // Handle Google Sign-In button click
//   const handleGoogleAuth = () => {
//     if (window.google && window.google.accounts && window.google.accounts.oauth2) {
//       try {
//         const tokenClient = window.google.accounts.oauth2.initTokenClient({
//           client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
//           scope: 'email profile',
//           callback: handleGoogleOAuthResponse
//         });
//         tokenClient.requestAccessToken();
//       } catch (error) {
//         setGoogleError('Google Sign-In is not available. Please try again.');
//       }
//     } else {
//       if (window.google && window.google.accounts && window.google.accounts.id) {
//         try {
//           window.google.accounts.id.prompt();
//         } catch (error) {
//           setGoogleError('Google Sign-In is not available. Please try again.');
//         }
//       } else {
//         setGoogleError('Google Sign-In is not available. Please try again.');
//       }
//     }
//   };

//   const validationSchema = yup.object().shape({
//     email: yup.string().required(t("email_is_required")),
//     password: isLoginScreen
//       ? yup.string()
//       : yup.string().required(t("password_is_required")),
//     otp: showOTPVerification ? yup
//       .string()
//       .length(4, t("otp_must_be_4_digits"))
//       .required(t("otp_is_required")) : yup.string(),
//   });

//   const sendLoginOTP = (phoneNumber, isResend = false) => {
//     if (isResend) {
//       setResendOtpLoader(true);
//     } else {
//       setLoginLoader(true);
//     }
//     const body = { phone_number: phoneNumber };

//     allApi(API_CONSTANTS.SEND_LOGIN_OTP_URL, body, "post")
//       .then((response) => {
//         if (response?.status === 200) {
//           setShowOTPVerification(true);
//           setTimeLeft(300); // Reset to 5 minutes
//           setIsOTPExpired(false);
//         }
//       })
//       .catch((err) => {
//         let errorMessage = "Failed to send OTP. Please try again.";
//         if (err?.response?.data?.error) {
//           errorMessage = err.response.data.error;
//         }
//         setLoginError(errorMessage);
//       })
//       .finally(() => {
//         if (isResend) {
//           setResendOtpLoader(false);
//         } else {
//           setLoginLoader(false);
//         }
//       });
//   };

//   const handleResendOTP = () => {
//     return sendLoginOTP(userEmail, true);
//   };

//   const handleOTPSubmit = (otpValue) => {
//     setOtpLoader(true);
//     const body = {
//       phone_number: userEmail, // userEmail actually stores phone_number now
//       otp: otpValue
//     };

//     allApi(API_CONSTANTS.VERIFY_LOGIN_OTP_URL, body, "post")
//       .then((response) => {
//         if (response.status === 200) {
//           // Store the token and user details
//           localStorage.setItem("token", JSON.stringify(`Bearer ${response.data.token}`));
//           localStorage.setItem("userDetails", JSON.stringify(response?.data?.user?.data?.attributes));

//           // Check if this is first time login
//           const isFirstTimeLogin = response?.data?.is_first_time_login;
          
//           // Show welcome message for first-time login
//           setShowWelcomeMessage(true);
//           if(isFirstTimeLogin){
//             return;
//           }
//           // Navigate based on login count
//           setTimeout(() => {
//             navigate("/");
//             resetForm();
//           }, 2000);
//         }
//       })
//       .catch((err) => {
//         // Handle OTP verification errors
//         let errorMessage = "OTP verification failed. Please try again.";
//         if (err?.response?.data?.error) {
//           errorMessage = err.response.data.error;
//         }
//         setLoginError(errorMessage);
//       })
//       .finally(() => {
//         setOtpLoader(false);
//       });
//   };

//   // Format time display (MM:SS)
//   const formatTime = (seconds) => {
//     const minutes = Math.floor(seconds / 60);
//     const remainingSeconds = seconds % 60;
//     return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
//   };

//   const onHandleSubmit = (value) => {
//     // Clear any previous login errors
//     setLoginError("");

//     if(isLoginScreen){
//       let body = {
//         user: {
//           email: value?.email
//         }
//       }
//       setForgotPasswordLoader(true);
//       allApi(API_CONSTANTS.FORGOT_PASSWORD, body, "post")
//       .then((response) => {
//         if(response?.status === 200){
//           resetForm();
//           setIsForgotPasswordSent(true);
//         }
//       })
//       .catch(() => {})
//       .finally(() => {
//         setForgotPasswordLoader(false);
//       });
//     } else {
//       setLoginLoader(true);
//       let data = {
//         user: { ...value }
//       };
//       allApi(API_CONSTANTS.LOGIN, data, "post")
//       .then(async (response) => {
//         if(response?.status === 200){
//           console.log('Login successful, response:', response);
//           const userData = response?.data?.data;
//           console.log('User data:', userData);

//           // Check if user is active
//           if (userData.is_active === false) {
//             console.log('User is inactive, sending OTP...');
//             // User is inactive, send OTP for verification only after successful login
//             // Store phone number in userEmail state (reusing the variable)
//             setUserEmail(userData.phone_number);
//             setWelcomeUserName(userData.name || value.email); // Store user name for welcome message
//             sendLoginOTP(userData.phone_number);
//           } else {
//             // User is active, proceed with normal login
//             console.log('User is active, proceeding with login...');
//             localStorage.setItem("token", JSON.stringify(response?.headers?.authorization));
//             localStorage.setItem("userDetails", JSON.stringify(userData));
            
//             // Check if user is admin (role_id === 1)
//             if (userData.role_id === 1) {
//               console.log('Admin user detected, loading theme colors...');
//               try {
//                 const themeResult = await loadThemeColors();
//                 console.log('Theme colors loaded successfully:', themeResult);
//               } catch (error) {
//                 console.error('Failed to load theme colors:', error);
//               }
//               console.log('Navigating to dashboard...');
//               navigate("/dashboard");
//             } else {
//               console.log('Regular user, navigating to home...');
//               // Always redirect to home page for regular users
//               navigate("/");
//             }
            
//             resetForm();
//             setLoginLoader(false);
//           }
//         }
//       })
//       .catch((err) => {
//         // Handle login errors - display error message instead of sending OTP
//         let errorMessage = "Login failed. Please check your credentials.";

//         if (err?.response?.data?.error) {
//           errorMessage = err.response.data.error;
//         } else if (err?.response?.data?.errors) {
//           errorMessage = err.response.data.errors;
//         } else if (err?.response?.status === 401) {
//           errorMessage = "Invalid email or password. Please try again.";
//         } else if (err?.response?.status === 404) {
//           errorMessage = "User not found. Please check your email.";
//         }

//         setLoginError(errorMessage);
//         setLoginLoader(false);
//       }).finally(() => {
//         // Loader is handled in catch block for error cases
//       });
//     }
//   }

//   const formik = useFormik({
//     initialValues: data,
//     onSubmit: onHandleSubmit,
//     validationSchema: validationSchema,
//     enableReinitialize: true,
//     validateOnBlur: true,
//   });

//   const { values, errors, resetForm, handleSubmit, handleChange, touched } = formik;

//   // Custom change handler to clear login errors
//   const handleInputChange = (e) => {
//     handleChange(e);
//     if (loginError) {
//       setLoginError("");
//     }
//   };

//   return (
//     <SignInLayout>
//       <div className="flex flex-col items-center justify-center bg-white px-4 sm:px-6 lg:px-8 py-12">
//         <div className="text-center mb-8">
//           <h1 className="text-3xl text-[#1D2E43] font-[playfair] font-bold">
//             {showOTPVerification ? t("verify_otp") : isLoginScreen ? t("reset_your_password") : t("login")}
//           </h1>
//           <div className="text-sm text-gray-600 mt-2">
//             <span className="hover:cursor-pointer" onClick={() => { navigate("/") }}>{t("home")}</span> 
//             <span className="mx-1 text-[11px]">&gt;</span> 
//             <span>{t("account")}</span>
//           </div>
//         </div>

//           <div className="w-full max-w-6xl flex justify-center px-2 sm:px-4 flex-col md:flex-row gap-10 md:gap-24">
//             {/* Login Form */}
//             <div className="w-full md:w-1/2 mb-10 md:mb-0 transition-all duration-300 ease-in-out">
//               {
//                 showOTPVerification ?
//                 <>
//                   {showWelcomeMessage ? (
//                     <div className="text-center mb-6">
//                       <div className="inline-flex items-center justify-center mb-4">
//                         <i className="ri-check-line text-[2.5rem] text-green-500"></i>
//                       </div>
//                       <h2 className="text-2xl text-[#1D2E43] mb-2 font-[playfair]">{t("welcome_to_logo_restaurant")}</h2>
//                       <p className="text-[#1D2E43] text-[1rem] mb-2 font-medium">
//                         {t("first_time_login_welcome")}
//                       </p>
//                       <p className="text-[#cca438] text-[0.9rem] font-semibold">
//                         Hello, {welcomeUserName}!
//                       </p>
//                     </div>
//                   ) : (
//                     <>
//                       <p className="text-[#1D2E43] text-[0.9rem] mb-2">{t("otp_sent_to")} {userEmail}</p>
//                       <p className={`text-[0.8rem] mb-4 font-semibold ${
//                         isOTPExpired ? 'text-red-600' : timeLeft <= 60 ? 'text-orange-600' : 'text-green-600'
//                       }`}>
//                         {isOTPExpired ? t("otp_expired") : `${t("expires_in")} ${formatTime(timeLeft)}`}
//                       </p>
//                     </>
//                   )}
//                   {!showWelcomeMessage && (
//                     <div className="space-y-4">
//                       <InputTextComponent
//                         value={values?.otp || ''}
//                         onChange={handleChange}
//                         type="text"
//                         placeholder={t("enter_4_digit_otp")}
//                         name="otp"
//                         error={errors?.otp}
//                         touched={touched?.otp}
//                         className="text-[0.8rem] rounded-none w-full border border-gray-300 px-4 py-2 focus:outline-none focus:ring-1 focus:ring-gray-700 text-center tracking-widest"
//                         maxLength={4}
//                       />

//                       {/* Display OTP verification error */}
//                       {loginError && (
//                         <div className="text-red-600 text-[0.8rem] font-medium">
//                           {loginError}
//                         </div>
//                       )}
//                       <div className='flex flex-col sm:flex-row gap-3'>
//                         <button
//                           type="button"
//                           onClick={() => handleOTPSubmit(values?.otp)}
//                           disabled={isOTPExpired || !values?.otp || values?.otp.length !== 4 || otpLoader || showWelcomeMessage}
//                           className="w-full sm:w-auto text-black text-[1.1rem] font-[playfair] hover:bg-white border px-6 py-2 rounded-md hover:text-[#cca438] hover:border hover:border-[#caa446] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
//                           style={{ background: 'linear-gradient(rgb(255, 193, 7) 0%, rgb(255, 213, 79) 100%)' }}
//                           onMouseEnter={(e) => !(isOTPExpired || !values?.otp || values?.otp.length !== 4 || otpLoader || showWelcomeMessage) && (e.currentTarget.style.background = 'white')}
//                           onMouseLeave={(e) => !(isOTPExpired || !values?.otp || values?.otp.length !== 4 || otpLoader || showWelcomeMessage) && (e.currentTarget.style.background = 'linear-gradient(rgb(255, 193, 7) 0%, rgb(255, 213, 79) 100%)')}
//                         >
//                           {otpLoader ? (
//                             <div className="flex items-center">
//                               <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
//                               {t("verifying")}
//                             </div>
//                           ) : (
//                             t("verify_otp")
//                           )}
//                         </button>
//                         <button
//                           type="button"
//                           onClick={() => handleResendOTP()}
//                           disabled={resendOtpLoader || showWelcomeMessage}
//                           className="w-full sm:w-auto hover:border border border-white text-[1.1rem] font-[playfair] bg-white px-6 py-2 rounded-md text-[#cca438] hover:border-[#cca438] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
//                         >
//                           {resendOtpLoader ? (
//                             <div className="flex items-center">
//                               <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#cca438] mr-2"></div>
//                               {t("sending")}
//                             </div>
//                           ) : (
//                             t("resend_otp")
//                           )}
//                         </button>
//                         <button
//                           type="button"
//                           onClick={() => {
//                             setShowOTPVerification(false);
//                             setTimeLeft(300);
//                             setIsOTPExpired(false);
//                             setShowWelcomeMessage(false);
//                             setLoginError("");
//                           }}
//                           className="w-full sm:w-auto hover:border border border-white text-[1.1rem] font-[playfair] bg-white px-6 py-2 rounded-md text-[#cca438] hover:border-[#cca438]"
//                         >
//                           {t("cancel")}
//                         </button>
//                       </div>
//                     </div>
//                   )}
//                 </> :
//                 isLoginScreen ?
//                 <>
//                   <p className="text-[#1D2E43] text-[0.9rem] mb-2">{t("we_will_send_you_an_email_to_reset_your_password")}</p>
//                   <div className="space-y-4">
//                     <InputTextComponent
//                       value={values?.email}
//                       onChange={handleChange}
//                       type="text"
//                       placeholder={t("email")}
//                       name="email"
//                       error={errors?.email}
//                       touched={touched?.email}
//                       className="text-[0.8rem] rounded-none w-full border border-gray-300 px-4 py-2 focus:outline-none focus:ring-1 focus:ring-gray-700"
//                     />
//                     {isForgotPasswordSent && (
//                       <div className="text-[0.75rem] text-[green]">{t("reset_password_link_has_been_sent")}</div>
//                     )}
//                     <div className='flex flex-col sm:flex-row gap-3'>
//                       <button
//                         type="submit"
//                         onClick={() => handleSubmit()}
//                         disabled={forgotPasswordLoader}
//                         className="w-full sm:w-auto text-black text-[1.1rem] font-[playfair] hover:bg-white border px-6 py-2 rounded-md hover:text-[#cca438] hover:border hover:border-[#caa446] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
//                         style={{ background: 'linear-gradient(rgb(255, 193, 7) 0%, rgb(255, 213, 79) 100%)' }}
//                         onMouseEnter={(e) => !forgotPasswordLoader && (e.currentTarget.style.background = 'white')}
//                         onMouseLeave={(e) => !forgotPasswordLoader && (e.currentTarget.style.background = 'linear-gradient(rgb(255, 193, 7) 0%, rgb(255, 213, 79) 100%)')}
//                       >
//                         {forgotPasswordLoader ? (
//                           <div className="flex items-center">
//                             <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
//                             {t("sending")}
//                           </div>
//                         ) : (
//                           t("submit")
//                         )}
//                       </button>
//                       <button
//                         type="button"
//                         onClick={() => {
//                           setIsLoginScreen(false);
//                           setIsForgotPasswordSent(false);
//                           setLoginError("");
//                         }}
//                         className="w-full sm:w-auto hover:border border border-white text-[1.1rem] font-[playfair] bg-white px-6 py-2 rounded-md text-[#cca438] hover:border-[#cca438]"
//                       >
//                         {t("cancel")}
//                       </button>
//                     </div>
//                   </div>
//                 </> :
//                 <>
//                   <div className="space-y-4">
//                     <InputTextComponent
//                       value={values?.email}
//                       onChange={handleInputChange}
//                       type="text"
//                       placeholder={t("email")}
//                       name="email"
//                       error={errors?.email}
//                       touched={touched?.email}
//                       className="text-[0.8rem] rounded-none w-full border border-gray-300 px-4 py-2 focus:outline-none focus:ring-1 focus:ring-gray-700"
//                     />
//                     <div className="relative">
//                       <InputTextComponent
//                         value={values?.password}
//                         onChange={handleInputChange}
//                         type={showPassword ? "text" : "password"}
//                         placeholder={t("password")}
//                         name="password"
//                         error={errors?.password}
//                         touched={touched?.password}
//                         className="text-[0.8rem] rounded-none w-full border border-gray-300 px-4 py-2 pr-10 focus:outline-none focus:ring-1 focus:ring-gray-700"
//                       />
//                       <button
//                         type="button"
//                         onClick={() => setShowPassword(!showPassword)}
//                         className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
//                       >
//                         <i className={showPassword ? "ri-eye-off-line" : "ri-eye-line"}></i>
//                       </button>
//                     </div>

//                     {/* Display login error above forgot password link */}
//                     {loginError && (
//                       <div className="text-red-600 text-[0.8rem] font-medium">
//                         {loginError}
//                       </div>
//                     )}

//                     <div className="text-sm">
//                       <a
//                         onClick={() => { setIsLoginScreen(true); setLoginError(""); }}
//                         className="text-gray-700 hover:cursor-pointer hover:text-gray-900 underline font-[playfair] text-[1rem]"
//                       >
//                         {t("forgot_your_password")}
//                       </a>
//                     </div>
//                     <button
//                       type="submit"
//                       onClick={() => handleSubmit()}
//                       disabled={loginLoader}
//                       className="w-full sm:w-auto text-black text-[1.1rem] font-[playfair] hover:bg-white border px-6 py-2 rounded-md hover:text-[#cca438] hover:border hover:border-[#caa446] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
//                       style={{ background: 'linear-gradient(rgb(255, 193, 7) 0%, rgb(255, 213, 79) 100%)' }}
//                       onMouseEnter={(e) => !loginLoader && (e.currentTarget.style.background = 'white')}
//                       onMouseLeave={(e) => !loginLoader && (e.currentTarget.style.background = 'linear-gradient(rgb(255, 193, 7) 0%, rgb(255, 213, 79) 100%)')}
//                     >
//                       {loginLoader ? (
//                         <div className="flex items-center">
//                           <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
//                           {t("signing_in")}
//                         </div>
//                       ) : (
//                         t("sign_in")
//                       )}
//                     </button>

//                     {/* Google Sign-In Button */}
//                     <div className="mt-4">
//                       <div className="relative">
//                         <div className="absolute inset-0 flex items-center">
//                           <div className="w-full border-t border-gray-300" />
//                         </div>
//                         <div className="relative flex justify-center text-sm">
//                           <span className="px-2 bg-white text-gray-500">Or continue with</span>
//                         </div>
//                       </div>
                      
//                       <button
//                         type="button"
//                         onClick={handleGoogleAuth}
//                         className="mt-4 w-full flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
//                       >
//                         <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
//                           <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
//                           <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
//                           <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
//                           <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
//                         </svg>
//                         Sign in with Google
//                       </button>
                      
//                       {/* Display Google authentication error */}
//                       {googleError && (
//                         <div className="text-red-600 text-[0.8rem] font-medium mt-2 text-center">
//                           {googleError}
//                         </div>
//                       )}
//                     </div>
                    
//                     <div className="text-sm text-center mt-4">
//                       <span className="text-gray-600">{t("dont_have_account")} </span>
//                       <a
//                         onClick={() => navigate("/register")}
//                         className="text-[#cca438] hover:cursor-pointer hover:text-[#caa446] underline font-[playfair] text-[1rem]"
//                       >
//                         {t("register")}
//                       </a>
//                     </div>
//                   </div>
//                 </>
//               }
//             </div>
//           </div>
//         </div>
        
//         {/* Hidden div for Google Sign-In button fallback */}
//         <div id="google-signin-button" style={{ display: 'none' }}></div>
//     </SignInLayout>
//   )
// }

// export default SignInRegister;



// utils
import { useState, useEffect } from 'react';
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import * as yup from "yup";
import { useFormik } from "formik";
import toast, { Toaster } from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';

// Components
import SignInLayout from '@userpage-pages/SignInLayout';
import InputTextComponent from "@common/InputTextComponent";
import { loadThemeColors } from '@utils/themeUtils';

// Redux actions
import { 
  loginUser, 
  clearStatus, 
  googleSignIn,
  forgotPassword,
  resetPassword,
  clearForgotPasswordStatus,
  clearResetPasswordStatus
} from "../../redux/slices/authSlice";

const initialValues = {
  email: "",
  password: "",
  otp: "",
  newPassword: "",
  confirmNewPassword: ""
};

const SignInRegister = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation("msg");
  
  // Redux state
  const { 
    user, 
    loading: reduxLoading, 
    error: reduxError,
    forgotPasswordSuccess,
    resetPasswordSuccess,
    forgotPasswordLoading,
    resetPasswordLoading
  } = useSelector((state) => state.auth);
  
  // Local state
  const [loginLoader, setLoginLoader] = useState(false);
  const [otpLoader, setOtpLoader] = useState(false);
  const [resendOtpLoader, setResendOtpLoader] = useState(false);
  const [forgotPasswordLoader, setForgotPasswordLoader] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [isLoginScreen, setIsLoginScreen] = useState(false);
  const [isForgotPasswordSent, setIsForgotPasswordSent] = useState(false);
  const [showOTPVerification, setShowOTPVerification] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [userPhoneNumber, setUserPhoneNumber] = useState("");
  const [timeLeft, setTimeLeft] = useState(300);
  const [isOTPExpired, setIsOTPExpired] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(false);
  const [welcomeUserName, setWelcomeUserName] = useState("");
  const [googleError, setGoogleError] = useState("");

  // Clear Redux status on component unmount
  useEffect(() => {
    return () => {
      dispatch(clearStatus());
      dispatch(clearForgotPasswordStatus());
      dispatch(clearResetPasswordStatus());
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

  const showInfoToast = (message) => {
    toast(message, {
      duration: 3000,
      position: 'top-center',
      style: {
        background: '#2196F3',
        color: '#fff',
        fontSize: '16px',
        padding: '16px',
        borderRadius: '12px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
      },
      icon: 'ℹ️',
    });
  };

  // Countdown timer effect for OTP
  useEffect(() => {
    let timer;
    if (showOTPVerification && timeLeft > 0 && !showWelcomeMessage && !showResetPassword) {
      timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && showOTPVerification) {
      setIsOTPExpired(true);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [timeLeft, showOTPVerification, showWelcomeMessage, showResetPassword]);

  // Monitor Redux login state
  useEffect(() => {
    if (user && !showOTPVerification && !showResetPassword) {
      const userData = user?.data?.data || user?.user || user;
      
      if (userData) {
        localStorage.setItem("userDetails", JSON.stringify(userData));
        
        const token = user?.headers?.authorization || user?.token;
        if (token) {
          localStorage.setItem("token", JSON.stringify(token));
        }
        
        showSuccessToast(t('login_successful'));
        
        if (userData.role_id === 1) {
          try {
            loadThemeColors();
          } catch (error) {
            console.error('Failed to load theme colors:', error);
          }
          setTimeout(() => navigate("/dashboard"), 1500);
        } else {
          setTimeout(() => navigate("/"), 1500);
        }
        
        resetForm();
      }
    }
  }, [user, navigate, t, showOTPVerification, showResetPassword]);

  // Monitor forgot password success
  useEffect(() => {
    if (forgotPasswordSuccess) {
      setIsForgotPasswordSent(true);
      showInfoToast(t('reset_link_sent'));
      setTimeout(() => {
        setIsForgotPasswordSent(false);
        setShowResetPassword(true);
        dispatch(clearForgotPasswordStatus());
      }, 3000);
    }
  }, [forgotPasswordSuccess, dispatch, t]);

  // Monitor reset password success
  useEffect(() => {
    if (resetPasswordSuccess) {
      showSuccessToast(t('password_reset_successful'));
      setTimeout(() => {
        setShowResetPassword(false);
        setIsLoginScreen(false);
        resetForm();
        dispatch(clearResetPasswordStatus());
      }, 2000);
    }
  }, [resetPasswordSuccess, dispatch, t]);

  // Monitor Redux errors
  useEffect(() => {
    if (reduxError) {
      let errorMessage = t("login_failed_please_check_credentials");
      
      if (typeof reduxError === 'string') {
        errorMessage = reduxError;
      } else if (reduxError?.error) {
        errorMessage = reduxError.error;
      } else if (reduxError?.message) {
        errorMessage = reduxError.message;
      }
      
      setLoginError(errorMessage);
      showErrorToast(errorMessage);
      setLoginLoader(false);
      setForgotPasswordLoader(false);
      setOtpLoader(false);
    }
  }, [reduxError, t]);

  // Google Identity Services script loading
  useEffect(() => {
    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
    
    if (!clientId) {
      console.error('Google Client ID not found');
      return;
    }

    if (window.google && window.google.accounts) {
      initializeGoogleAuth(clientId);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      initializeGoogleAuth(clientId);
    };
    
    script.onerror = () => {
      console.error('Failed to load Google Sign-In script');
      setGoogleError('Google Sign-In is not available. Please try again later.');
      showErrorToast('Google Sign-In is not available. Please try again later.');
    };
    
    document.head.appendChild(script);

    return () => {
      const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (existingScript && existingScript.parentNode) {
        existingScript.parentNode.removeChild(existingScript);
      }
    };
  }, []);

  // Initialize Google Authentication
  const initializeGoogleAuth = (clientId) => {
    if (!window.google || !window.google.accounts) {
      console.error('Google accounts API not available');
      return;
    }

    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleResponse,
        auto_select: false,
        cancel_on_tap_outside: false,
        context: 'signin',
        ux_mode: 'popup',
        itp_support: true,
        use_fedcm_for_prompt: true
      });
    } catch (error) {
      console.error('Google Sign-In initialization failed:', error);
      setGoogleError('Google Sign-In initialization failed. Please try again.');
      showErrorToast('Google Sign-In initialization failed. Please try again.');
    }
  };

  // Handle Google One Tap response using Redux
  const handleGoogleResponse = async (response) => {
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
        
        showSuccessToast(t('login_successful'));
        
        setTimeout(() => {
          navigate("/");
        }, 1500);
      }
    } catch (error) {
      console.error('Google Sign-In failed:', error);
      setGoogleError(error?.message || 'Google Sign-In failed. Please try again.');
      showErrorToast(error?.message || 'Google Sign-In failed. Please try again.');
    }
  };

  // Handle Google Sign-In button click
  const handleGoogleAuth = () => {
    if (window.google && window.google.accounts && window.google.accounts.id) {
      try {
        window.google.accounts.id.prompt();
      } catch (error) {
        console.error('Google One Tap failed:', error);
        setGoogleError('Google Sign-In is not available. Please try again.');
        showErrorToast('Google Sign-In is not available. Please try again.');
      }
    } else {
      setGoogleError('Google Sign-In is not available. Please try again.');
      showErrorToast('Google Sign-In is not available. Please try again.');
    }
  };

  const validationSchema = yup.object().shape({
    email: yup.string().required(t("email_is_required")),
    password: !showOTPVerification && !isLoginScreen && !showResetPassword
      ? yup.string().required(t("password_is_required"))
      : yup.string(),
    otp: showOTPVerification || showResetPassword
      ? yup.string().length(4, t("otp_must_be_4_digits")).required(t("otp_is_required"))
      : yup.string(),
    newPassword: showResetPassword
      ? yup.string().min(6, t("password_must_be_at_least_6_characters")).required(t("password_is_required"))
      : yup.string(),
    confirmNewPassword: showResetPassword
      ? yup.string().oneOf([yup.ref('newPassword'), null], t("passwords_must_match")).required(t("confirm_password_is_required"))
      : yup.string(),
  });

  const sendLoginOTP = async (phoneNumber, isResend = false) => {
    if (isResend) {
      setResendOtpLoader(true);
    } else {
      setOtpLoader(true);
    }
    
    // This would be replaced with Redux action
    setTimeout(() => {
      setShowOTPVerification(true);
      setTimeLeft(300);
      setIsOTPExpired(false);
      setLoginError("");
      if (isResend) {
        showInfoToast(t('otp_resent_successfully'));
      }
      setOtpLoader(false);
      setResendOtpLoader(false);
    }, 1000);
  };

  const handleResendOTP = () => {
    if (userPhoneNumber) {
      sendLoginOTP(userPhoneNumber, true);
    }
  };

  const handleOTPSubmit = async (otpValue) => {
    if (!otpValue || otpValue.length !== 4) {
      setLoginError(t("please_enter_valid_otp"));
      showErrorToast(t("please_enter_valid_otp"));
      return;
    }
    
    setOtpLoader(true);
    // OTP verification logic here
    setTimeout(() => {
      showSuccessToast(t('login_successful'));
      setTimeout(() => {
        navigate("/");
        resetForm();
      }, 1500);
      setOtpLoader(false);
    }, 1000);
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const onHandleSubmit = async (value) => {
    setLoginError("");

    if (showResetPassword) {
      setOtpLoader(true);
      try {
        await dispatch(resetPassword({
          email: resetEmail,
          otp: value.otp,
          new_password: value.newPassword
        })).unwrap();
      } catch (err) {
        // Error handled by Redux error useEffect
      } finally {
        setOtpLoader(false);
      }
    } else if (isLoginScreen) {
      setForgotPasswordLoader(true);
      try {
        await dispatch(forgotPassword({ email: value.email })).unwrap();
        setResetEmail(value.email);
      } catch (err) {
        // Error handled by Redux error useEffect
      } finally {
        setForgotPasswordLoader(false);
      }
    } else {
      setLoginLoader(true);
      let loginData = {
        user: { 
          email: value?.email,
          password: value?.password 
        }
      };
      
      try {
        const resultAction = await dispatch(loginUser(loginData));
        
        if (loginUser.fulfilled.match(resultAction)) {
          const response = resultAction.payload;
          const userData = response?.user;
          
          if (!userData) {
            throw new Error('No user data received');
          }

          if (userData.is_active === false) {
            setUserPhoneNumber(userData.phone_number);
            setWelcomeUserName(userData.name || value.email);
            setShowOTPVerification(true);
            setLoginLoader(false);
          }
        }
      } catch (err) {
        setLoginLoader(false);
      }
    }
  };

  const formik = useFormik({
    initialValues: initialValues,
    onSubmit: onHandleSubmit,
    validationSchema: validationSchema,
    enableReinitialize: true,
    validateOnBlur: true,
    validateOnChange: true,
  });

  const { values, errors, resetForm, handleSubmit, handleChange, touched, setFieldValue } = formik;

  const handleInputChange = (e) => {
    handleChange(e);
    if (loginError) {
      setLoginError("");
    }
  };

  const resetOTPFlow = () => {
    setShowOTPVerification(false);
    setTimeLeft(300);
    setIsOTPExpired(false);
    setShowWelcomeMessage(false);
    setLoginError("");
    setUserPhoneNumber("");
    setWelcomeUserName("");
    setFieldValue('otp', '');
  };

  const resetPasswordFlow = () => {
    setShowResetPassword(false);
    setIsLoginScreen(false);
    setLoginError("");
    setResetEmail("");
    setFieldValue('otp', '');
    setFieldValue('newPassword', '');
    setFieldValue('confirmNewPassword', '');
    dispatch(clearForgotPasswordStatus());
    dispatch(clearResetPasswordStatus());
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
              {showResetPassword ? t("reset_password") : showOTPVerification ? t("verify_otp") : isLoginScreen ? t("forgot_password") : t("login")}
            </h1>
            <div className="text-sm text-gray-600 mt-2">
              <span className="hover:cursor-pointer" onClick={() => { navigate("/") }}>{t("home")}</span> 
              <span className="mx-1 text-[11px]">&gt;</span> 
              <span>{t("account")}</span>
            </div>
          </div>

          <div className="w-full max-w-6xl flex justify-center px-2 sm:px-4 flex-col md:flex-row gap-10 md:gap-24">
            <div className="w-full md:w-1/2 mb-10 md:mb-0 transition-all duration-300 ease-in-out">
              {showResetPassword ? (
                // Reset Password UI
                <>
                  <p className="text-[#1D2E43] text-[0.9rem] mb-4">
                    {t("enter_otp_and_new_password")}
                  </p>
                  <p className="text-[#1D2E43] text-[0.8rem] mb-2 text-green-600">
                    {t("otp_sent_to")} {resetEmail}
                  </p>
                  <div className="space-y-4">
                    <InputTextComponent
                      value={values?.otp || ''}
                      onChange={handleChange}
                      type="text"
                      placeholder={t("enter_4_digit_otp")}
                      name="otp"
                      error={errors?.otp}
                      touched={touched?.otp}
                      className="text-[0.8rem] rounded-none w-full border border-gray-300 px-4 py-2 focus:outline-none focus:ring-1 focus:ring-gray-700 text-center tracking-widest text-2xl"
                      maxLength={4}
                    />

                    <div className="relative">
                      <InputTextComponent
                        value={values?.newPassword}
                        onChange={handleChange}
                        type={showNewPassword ? "text" : "password"}
                        placeholder={t("new_password")}
                        name="newPassword"
                        error={errors?.newPassword}
                        touched={touched?.newPassword}
                        className="text-[0.8rem] rounded-none w-full border border-gray-300 px-4 py-2 pr-10 focus:outline-none focus:ring-1 focus:ring-gray-700"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        <i className={showNewPassword ? "ri-eye-off-line" : "ri-eye-line"}></i>
                      </button>
                    </div>

                    <div className="relative">
                      <InputTextComponent
                        value={values?.confirmNewPassword}
                        onChange={handleChange}
                        type={showConfirmNewPassword ? "text" : "password"}
                        placeholder={t("confirm_new_password")}
                        name="confirmNewPassword"
                        error={errors?.confirmNewPassword}
                        touched={touched?.confirmNewPassword}
                        className="text-[0.8rem] rounded-none w-full border border-gray-300 px-4 py-2 pr-10 focus:outline-none focus:ring-1 focus:ring-gray-700"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        <i className={showConfirmNewPassword ? "ri-eye-off-line" : "ri-eye-line"}></i>
                      </button>
                    </div>

                    {loginError && (
                      <div className="text-red-600 text-[0.8rem] font-medium">
                        {loginError}
                      </div>
                    )}

                    <div className='flex flex-col sm:flex-row gap-3'>
                      <button
                        type="submit"
                        onClick={() => handleSubmit()}
                        disabled={otpLoader || resetPasswordLoading}
                        className="w-full sm:w-auto text-black text-[1.1rem] font-[playfair] hover:bg-white border px-6 py-2 rounded-md hover:text-[#cca438] hover:border hover:border-[#caa446] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        style={{ background: 'linear-gradient(rgb(255, 193, 7) 0%, rgb(255, 213, 79) 100%)' }}
                      >
                        {(otpLoader || resetPasswordLoading) ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            {t("resetting")}
                          </div>
                        ) : (
                          t("reset_password")
                        )}
                      </button>
                      
                      <button
                        type="button"
                        onClick={resetPasswordFlow}
                        className="w-full sm:w-auto hover:border border border-white text-[1.1rem] font-[playfair] bg-white px-6 py-2 rounded-md text-[#cca438] hover:border-[#cca438]"
                      >
                        {t("cancel")}
                      </button>
                    </div>
                  </div>
                </>
              ) : showOTPVerification ? (
                // OTP Verification UI
                <>
                  {showWelcomeMessage ? (
                    <div className="text-center mb-6 animate-fadeIn">
                      <div className="inline-flex items-center justify-center mb-4">
                        <i className="ri-check-line text-[2.5rem] text-green-500"></i>
                      </div>
                      <h2 className="text-2xl text-[#1D2E43] mb-2 font-[playfair]">{t("welcome_to_logo_restaurant")}</h2>
                      <p className="text-[#1D2E43] text-[1rem] mb-2 font-medium">
                        {t("first_time_login_welcome")}
                      </p>
                      <p className="text-[#cca438] text-[0.9rem] font-semibold">
                        {t("hello")}, {welcomeUserName}!
                      </p>
                    </div>
                  ) : (
                    <>
                      <p className="text-[#1D2E43] text-[0.9rem] mb-2">
                        {t("otp_sent_to")} {userPhoneNumber}
                      </p>
                      <p className={`text-[0.8rem] mb-4 font-semibold ${
                        isOTPExpired ? 'text-red-600' : timeLeft <= 60 ? 'text-orange-600' : 'text-green-600'
                      }`}>
                        {isOTPExpired ? t("otp_expired") : `${t("expires_in")} ${formatTime(timeLeft)}`}
                      </p>
                    </>
                  )}
                  
                  {!showWelcomeMessage && (
                    <div className="space-y-4">
                      <InputTextComponent
                        value={values?.otp || ''}
                        onChange={handleChange}
                        type="text"
                        placeholder={t("enter_4_digit_otp")}
                        name="otp"
                        error={errors?.otp}
                        touched={touched?.otp}
                        className="text-[0.8rem] rounded-none w-full border border-gray-300 px-4 py-2 focus:outline-none focus:ring-1 focus:ring-gray-700 text-center tracking-widest text-2xl"
                        maxLength={4}
                      />

                      {loginError && (
                        <div className="text-red-600 text-[0.8rem] font-medium text-center">
                          {loginError}
                        </div>
                      )}
                      
                      <div className='flex flex-col sm:flex-row gap-3'>
                        <button
                          type="button"
                          onClick={() => handleOTPSubmit(values?.otp)}
                          disabled={isOTPExpired || !values?.otp || values?.otp.length !== 4 || otpLoader}
                          className="w-full sm:w-auto text-black text-[1.1rem] font-[playfair] hover:bg-white border px-6 py-2 rounded-md hover:text-[#cca438] hover:border hover:border-[#caa446] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                          style={{ background: 'linear-gradient(rgb(255, 193, 7) 0%, rgb(255, 213, 79) 100%)' }}
                          onMouseEnter={(e) => !(isOTPExpired || !values?.otp || values?.otp.length !== 4 || otpLoader) && (e.currentTarget.style.background = 'white')}
                          onMouseLeave={(e) => !(isOTPExpired || !values?.otp || values?.otp.length !== 4 || otpLoader) && (e.currentTarget.style.background = 'linear-gradient(rgb(255, 193, 7) 0%, rgb(255, 213, 79) 100%)')}
                        >
                          {otpLoader ? (
                            <div className="flex items-center">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              {t("verifying")}
                            </div>
                          ) : (
                            t("verify_otp")
                          )}
                        </button>
                        
                        <button
                          type="button"
                          onClick={handleResendOTP}
                          disabled={resendOtpLoader || isOTPExpired}
                          className="w-full sm:w-auto hover:border border border-white text-[1.1rem] font-[playfair] bg-white px-6 py-2 rounded-md text-[#cca438] hover:border-[#cca438] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                          {resendOtpLoader ? (
                            <div className="flex items-center">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#cca438] mr-2"></div>
                              {t("sending")}
                            </div>
                          ) : (
                            t("resend_otp")
                          )}
                        </button>
                        
                        <button
                          type="button"
                          onClick={resetOTPFlow}
                          className="w-full sm:w-auto hover:border border border-white text-[1.1rem] font-[playfair] bg-white px-6 py-2 rounded-md text-[#cca438] hover:border-[#cca438]"
                        >
                          {t("cancel")}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : isLoginScreen ? (
                // Forgot Password UI
                <>
                  <p className="text-[#1D2E43] text-[0.9rem] mb-2">{t("we_will_send_you_an_email_to_reset_your_password")}</p>
                  <div className="space-y-4">
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
                    
                    {loginError && (
                      <div className="text-red-600 text-[0.8rem] font-medium">
                        {loginError}
                      </div>
                    )}
                    
                    {isForgotPasswordSent && (
                      <div className="text-[0.75rem] text-green-600 font-medium">
                        {t("reset_password_link_has_been_sent")}
                      </div>
                    )}
                    
                    <div className='flex flex-col sm:flex-row gap-3'>
                      <button
                        type="submit"
                        onClick={() => handleSubmit()}
                        disabled={forgotPasswordLoader || forgotPasswordLoading}
                        className="w-full sm:w-auto text-black text-[1.1rem] font-[playfair] hover:bg-white border px-6 py-2 rounded-md hover:text-[#cca438] hover:border hover:border-[#caa446] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        style={{ background: 'linear-gradient(rgb(255, 193, 7) 0%, rgb(255, 213, 79) 100%)' }}
                        onMouseEnter={(e) => !(forgotPasswordLoader || forgotPasswordLoading) && (e.currentTarget.style.background = 'white')}
                        onMouseLeave={(e) => !(forgotPasswordLoader || forgotPasswordLoading) && (e.currentTarget.style.background = 'linear-gradient(rgb(255, 193, 7) 0%, rgb(255, 213, 79) 100%)')}
                      >
                        {(forgotPasswordLoader || forgotPasswordLoading) ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            {t("sending")}
                          </div>
                        ) : (
                          t("submit")
                        )}
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => {
                          setIsLoginScreen(false);
                          setIsForgotPasswordSent(false);
                          setLoginError("");
                          resetForm();
                        }}
                        className="w-full sm:w-auto hover:border border border-white text-[1.1rem] font-[playfair] bg-white px-6 py-2 rounded-md text-[#cca438] hover:border-[#cca438]"
                      >
                        {t("cancel")}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                // Login UI
                <>
                  <div className="space-y-4">
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

                    {loginError && (
                      <div className="text-red-600 text-[0.8rem] font-medium">
                        {loginError}
                      </div>
                    )}

                    <div className="text-sm">
                      <a
                        onClick={() => { 
                          setIsLoginScreen(true); 
                          setLoginError(""); 
                          resetForm();
                        }}
                        className="text-gray-700 hover:cursor-pointer hover:text-gray-900 underline font-[playfair] text-[1rem]"
                      >
                        {t("forgot_your_password")}
                      </a>
                    </div>
                    
                    <button
                      type="submit"
                      onClick={() => handleSubmit()}
                      disabled={loginLoader || reduxLoading}
                      className="w-full sm:w-auto text-black text-[1.1rem] font-[playfair] hover:bg-white border px-6 py-2 rounded-md hover:text-[#cca438] hover:border hover:border-[#caa446] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      style={{ background: 'linear-gradient(rgb(255, 193, 7) 0%, rgb(255, 213, 79) 100%)' }}
                      onMouseEnter={(e) => !(loginLoader || reduxLoading) && (e.currentTarget.style.background = 'white')}
                      onMouseLeave={(e) => !(loginLoader || reduxLoading) && (e.currentTarget.style.background = 'linear-gradient(rgb(255, 193, 7) 0%, rgb(255, 213, 79) 100%)')}
                    >
                      {(loginLoader || reduxLoading) ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          {t("signing_in")}
                        </div>
                      ) : (
                        t("sign_in")
                      )}
                    </button>

                    {/* Google Sign-In Button */}
                    <div className="mt-4">
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-gray-300" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="px-2 bg-white text-gray-500">{t("or_continue_with")}</span>
                        </div>
                      </div>
                      
                      <button
                        type="button"
                        onClick={handleGoogleAuth}
                        className="mt-4 w-full flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                      >
                        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        {t("sign_in_with_google")}
                      </button>
                      
                      {googleError && (
                        <div className="text-red-600 text-[0.8rem] font-medium mt-2 text-center">
                          {googleError}
                        </div>
                      )}
                    </div>
                    
                    <div className="text-sm text-center mt-4">
                      <span className="text-gray-600">{t("dont_have_account")} </span>
                      <a
                        onClick={() => navigate("/register")}
                        className="text-[#cca438] hover:cursor-pointer hover:text-[#caa446] underline font-[playfair] text-[1rem]"
                      >
                        {t("register")}
                      </a>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div id="google-signin-button" style={{ display: 'none' }}></div>
      </SignInLayout>
    </>
  );
};

export default SignInRegister;