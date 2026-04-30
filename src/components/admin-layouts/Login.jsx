// // utils
// import { useEffect, useRef, useState } from "react";
// import { useLocation } from 'react-router-dom';
// import * as yup from "yup";
// import { useFormik } from "formik";
// import { Toast } from "primereact/toast";
// import { Link, useNavigate } from "react-router-dom";
// import { useTranslation } from "react-i18next";

// // components
// import ButtonComponent from "@common/ButtonComponent";
// import InputTextComponent from "@common/InputTextComponent";
// import  allApi  from "@api/api";
// import { ROUTES_CONSTANTS } from "@constants/routesurl";
// import { API_CONSTANTS } from "@constants/apiurl";
// import Loading from '@common/Loading';
// import { loadThemeColors } from '@utils/themeUtils';

// const data = {
//   email: "",
//   password: "",
// };

// const Login = () => {
//   const toast = useRef(null);
//   const { t } = useTranslation("msg");
//   const location = useLocation();
//   const { isLogout } = location?.state || {};
//   const [loader, setLoader] = useState(false);
//   const [showPassword, setShowPassword] = useState(false);
//   const navigate = useNavigate();

//   const validationSchema = yup.object().shape({
//     email: yup
//       .string()
//       .required(t("email_is_required")),
//     password: yup
//       .string()
//       .min(6, t("please_enter_password_more_then_6_characters"))
//       .max(20, t("please_enter_password_less_then_20_characters"))
//       .required(t("password_is_required")),
//   });

//   const onHandleSubmit = async (value) => {
//     setLoader(true);
//     let data = {
//       user: {
//       ...value}
//     }
//     allApi(API_CONSTANTS.LOGIN, data, "post")
//       .then(async (response) => {
//         if(response?.status === 200){
//           console.log('Login successful, response:', response);
//           const token = response.headers['authorization'];
//           localStorage.setItem("token", JSON.stringify(response?.headers?.authorization));
//           localStorage.setItem("userDetails", JSON.stringify(response?.data?.data));

//           // Redirect based on user role
//           const userRole = response?.data?.data?.role_id;
//           console.log('User role:', userRole);
          
//           // Load theme colors for admin users before navigation
//           if (userRole === 1) {
//             // Admin - load theme colors first
//             console.log('Admin user detected, loading theme colors...');
//             try {
//               const themeResult = await loadThemeColors();
//               console.log('Theme colors loaded successfully:', themeResult);
//             } catch (error) {
//               console.error('Failed to load theme colors:', error);
//             }
            
//             console.log('Navigating to dashboard...');
//             navigate(ROUTES_CONSTANTS.DASHBOARD, {
//               state: {
//                       isLogin: "success"
//                   }
//               });
//           } else if (userRole === 3) {
//             // Warehouse Supervisor
//             console.log('Warehouse supervisor detected, navigating...');
//             navigate("/warehouse-dashboard", {
//               state: {
//                       isLogin: "success"
//                   }
//               });
//           } else {
//             // Default to dashboard for other roles
//             console.log('Other role detected, navigating to dashboard...');
//             navigate(ROUTES_CONSTANTS.DASHBOARD, {
//               state: {
//                       isLogin: "success"
//                   }
//               });
//           }
//         }
//       })
//       .catch((err) => {
//         toast.current.show({
//           severity: "error",
//           summary: "Error",
//           detail: err?.response?.data?.errors,
//           life: 3000,
//         });
//         setLoader(false);
//       }).finally(()=> {
//         setLoader(false);
//       });
//   };

//   useEffect(()=>{
//     if(isLogout){
//       toast.current.show({
//        severity: "success",
//        summary: t("success"),
//        detail: "You have successfully logout",
//        life: 2000
//       });
//     };
    
//     navigate(location.pathname, { replace: true }); 
//   },[])

//   const formik = useFormik({
//     initialValues: data,
//     onSubmit: onHandleSubmit,
//     validationSchema: validationSchema,
//     enableReinitialize: true,
//     validateOnBlur: true,
//   });
   
//   const handleKeyDown = (event) => {
//     if (event.key === 'Enter') {
//       handleSubmit(); // Trigger form submission on Enter
//     }
//   };

//   const { values, errors, handleSubmit, handleChange, touched } = formik;

//   return (
//     <div className="h-screen flex items-center justify-center">
//       {loader && <Loading/>}
//       <div
//           className="w-full max-w-md border shadow-cards px-6 py-6 sm:px-8 md:px-10 rounded-md bg-white"
//           onKeyDown={handleKeyDown}
//         >
//         <Toast ref={toast} position="top-right" style={{scale: '0.7'}}/>
//         <div className="mb-2 text-center">
//           <i className="ri-shopping-cart-2-line text-[40px] text-TextPrimaryColor"></i>
//         </div>
//         <div className="text-center text-[1.5rem] font-[600] text-TextPrimaryColor tracking-wide max-lg:text-[1.4em] max-sm:text-[1rem]">
//           {t("login")}
//         </div>
//         <div className="mt-2 flex flex-col gap-2">
//           <InputTextComponent
//             value={values?.email}
//             onChange={handleChange}
//             type="text"
//             placeholder={t("email")}
//             name="email"
//             error={errors?.email}
//             touched={touched?.email}
//             className="w-full rounded border-[1px] border-[#ddd] px-[1rem] py-[8px] text-[11px] focus:outline-none"
//           />
//           <div className="relative">
//             <InputTextComponent
//               value={values?.password}
//               onChange={handleChange}
//               type={showPassword ? "text" : "password"}
//               placeholder={t("password")}
//               name="password"
//               error={errors?.password}
//               touched={touched?.password}
//               className="w-full rounded border-[1px] border-[#ddd] px-[1rem] py-[8px] pr-[2.5rem] text-[11px] focus:outline-none"
//             />
//             <button
//               type="button"
//               onClick={() => setShowPassword(!showPassword)}
//               className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
//             >
//               <i className={showPassword ? "ri-eye-off-line" : "ri-eye-line"}></i>
//             </button>
//           </div>
//         </div>
//         <div className="mt-2 flex items-center justify-between">
//           <div className="z-10 text-[0.8rem] text-TextPrimaryColor underline underline-offset-2 hover:cursor-pointer">
//             <Link to="/">{t("back_to_home")}</Link>
//           </div>
//           <div className="z-10 text-[0.8rem] text-TextPrimaryColor underline underline-offset-2 hover:cursor-pointer">
//             <Link to="/forgot-password">{t("forgot_password")}</Link>
//           </div>
//         </div>
//         <div className="mt-4">
//           <ButtonComponent
//             onClick={() => handleSubmit()}
//             type="submit"
//             label={t("log_in")}
//             className="w-full rounded bg-TextPrimaryColor px-6 py-2 text-[12px] text-white"
//             icon="pi pi-arrow-right"
//             iconPos="right"
//           />
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Login;


// utils
import { useEffect, useRef, useState } from "react";
import { useLocation } from 'react-router-dom';
import * as yup from "yup";
import { useFormik } from "formik";
import { Toast } from "primereact/toast";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

// components
import ButtonComponent from "@common/ButtonComponent";
import InputTextComponent from "@common/InputTextComponent";
import allApi from "@api/api";
import { ROUTES_CONSTANTS } from "@constants/routesurl";
import Loading from '@common/Loading';

const data = {
  email: "",
  password: "",
};

const Login = () => {
  const toast = useRef(null);
  const { t } = useTranslation("msg");
  const location = useLocation();
  const { isLogout } = location?.state || {};
  const [loader, setLoader] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const validationSchema = yup.object().shape({
    email: yup.string().required(t("email_is_required")),
    password: yup
      .string()
      .min(6, t("please_enter_password_more_then_6_characters"))
      .max(20, t("please_enter_password_less_then_20_characters"))
      .required(t("password_is_required")),
  });

const onHandleSubmit = async (value) => {
  setLoader(true);

  try {
    console.log("POST CALL FIRE 🔥");

    const response = await allApi.post("/users/sign_in", {
      email: value.email,
      password: value.password,
    });

    console.log("RESPONSE:", response);

    if (response?.status === 200) {
      // ✅ SAVE TOKEN (IMPORTANT FIX)
      localStorage.setItem("user", JSON.stringify({
        ...response.data.data,
        token: response.headers.authorization
      }));

      toast.current.show({
        severity: "success",
        summary: "Success",
        detail: "Login successful",
        life: 2000,
      });

      navigate("/dashboard");
    }

  } catch (err) {
    console.log("ERROR:", err);

    toast.current.show({
      severity: "error",
      summary: "Error",
      detail: err?.response?.data?.message || "Login failed",
      life: 3000,
    });
  } finally {
    setLoader(false);
  }
};

  useEffect(() => {
    if (isLogout) {
      toast.current.show({
        severity: "success",
        summary: t("success"),
        detail: "You have successfully logout",
        life: 2000,
      });
    }

    navigate(location.pathname, { replace: true });
  }, []);

  const formik = useFormik({
    initialValues: data,
    onSubmit: onHandleSubmit,
    validationSchema: validationSchema,
  });

  const { values, errors, handleSubmit, handleChange, touched } = formik;

  return (
    <div className="h-screen flex items-center justify-center">
      {loader && <Loading />}

      {/* ✅ FORM START (IMPORTANT FIX) */}
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md border shadow-cards px-6 py-6 sm:px-8 md:px-10 rounded-md bg-white"
      >
        <Toast ref={toast} position="top-right" style={{ scale: '0.7' }} />

        <div className="mb-2 text-center">
          <i className="ri-shopping-cart-2-line text-[40px] text-TextPrimaryColor"></i>
        </div>

        <div className="text-center text-[1.5rem] font-[600] text-TextPrimaryColor">
          {t("login")}
        </div>

        <div className="mt-2 flex flex-col gap-2">
          <InputTextComponent
            value={values?.email}
            onChange={handleChange}
            type="text"
            placeholder={t("email")}
            name="email"
            error={errors?.email}
            touched={touched?.email}
            className="w-full rounded border px-[1rem] py-[8px] text-[11px]"
          />

          <div className="relative">
            <InputTextComponent
              value={values?.password}
              onChange={handleChange}
              type={showPassword ? "text" : "password"}
              placeholder={t("password")}
              name="password"
              error={errors?.password}
              touched={touched?.password}
              className="w-full rounded border px-[1rem] py-[8px] pr-[2.5rem] text-[11px]"
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <i className={showPassword ? "ri-eye-off-line" : "ri-eye-line"}></i>
            </button>
          </div>
        </div>

        <div className="mt-2 flex justify-between">
          <Link to="/" className="text-[0.8rem] underline">
            {t("back_to_home")}
          </Link>

          <Link to="/forgot-password" className="text-[0.8rem] underline">
            {t("forgot_password")}
          </Link>
        </div>

        {/* Signup link */}
        <div className="text-center mt-2 text-[0.8rem]">
          <Link to="/signup" className="underline text-blue-500">
            Create Account
          </Link>
        </div>

        <div className="mt-4">
          {/* ✅ SUBMIT BUTTON FIX */}
          <ButtonComponent
            type="submit"
            label={t("log_in")}
            className="w-full rounded bg-TextPrimaryColor px-6 py-2 text-[12px] text-white"
          />
        </div>
      </form>
      {/* ✅ FORM END */}
    </div>
  );
};

export default Login;