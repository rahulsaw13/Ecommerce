// utils
import { useState, useEffect } from 'react';
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import * as yup from "yup";
import { useFormik } from "formik";

// Components
import UserLoader from '@userpage-pages/UserLoader';
import Header from '@common/Header';
import Footer from '@common/Footer';
import { allApi } from "@api/api";
import { API_CONSTANTS } from "@constants/apiurl";
import { ROUTES_CONSTANTS } from "@constants/routesurl";
import InputTextComponent from "@common/InputTextComponent";

const data = {
    password: "",
    confirmPassword: ""
  };

const UserResetPasswordPage = () => {
    const [menuList, setMenuList] = useState([]);
    const [footerRangeList, setFooterRangeList] = useState([]);
    const { t } = useTranslation("msg");
    const [loader, setLoader] = useState(false);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");

    const handleSearch = (query) => {
    };
  
    const validationSchema = yup.object().shape({
      password: yup
        .string()
        .min(6, t("please_enter_password_more_then_6_characters"))
        .max(20, t("please_enter_password_less_then_20_characters"))
        .required(t("password_is_required")),
      confirmPassword: yup
        .string()
        .min(6, t("please_enter_password_more_then_6_characters"))
        .max(20, t("please_enter_password_less_then_20_characters"))
        .required(t("confirm_password_is_required"))
        .oneOf(
          [yup.ref("password")],
          t("confirm_password_and_new_password_should_be_same"),
        ),
    });
  
    const onHandleSubmit = async (value) => {
        let body = {
            user: {
                password: value?.password,
                reset_password_token: token,
                password_confirmation: value?.confirmPassword
            }
        }
        setLoader(true);
        allApi(API_CONSTANTS.RESET_PASSWORD, body, "put")
        .then((response) => {
            if(response?.status === 200){
                navigate(ROUTES_CONSTANTS.SIGN_IN);
            }
        })
        .catch((err) => {
        }).finally(()=>{
            setLoader(false);
        });
    };

  const fetchMenuList = () => {
    setLoader(true);
    allApi(API_CONSTANTS.MENU_LIST_URL, "" , "get")
    .then((response) => {
      if (response.status === 200) {
          let data = response?.data.filter((item, index)=> index <= 6);
          setFooterRangeList(data);
          data.push({name: t("about_us")});
          setMenuList(data)
      } 
    })
    .catch((err) => {
      setLoader(false);
    }).finally(()=>{
      setLoader(false);
    });
  };

  useEffect(()=>{
    fetchMenuList();
  },[]);

  const formik = useFormik({
    initialValues: data,
    onSubmit: onHandleSubmit,
    validationSchema: validationSchema,
    enableReinitialize: true,
    validateOnBlur: true,
  });

  const { values, errors, handleSubmit, handleChange, setFieldValue, touched } = formik;

  return (
    <>
      {loader ? <UserLoader/> : 
      <>
        <Header onSearch={handleSearch}/>
        <div className="flex flex-col items-center justify-center bg-white px-6 py-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl text-[#1D2E43] font-[playfair] font-bold">{t("reset_password")}</h1>
          <div className="text-sm text-gray-600 mt-2">
            <span className="hover:cursor-pointer" onClick={()=>{ navigate("/") }}>{t("home")}</span> <span className="mx-1 text-[11px]">&gt;</span> <span>{t("reset_password")}</span>
          </div>
        </div>

        <div className="w-full max-w-md">
          <h2 className="text-2xl text-[#1D2E43] mb-6 font-[playfair]">{t("reset_password")}</h2>
          <div className="space-y-4">
            <InputTextComponent
              value={values?.password}
              onChange={handleChange}
              type="text"
              placeholder={t("password")}
              name="password"
              error={errors?.password}
              touched={touched?.password}
              className="text-[0.8rem] rounded-none w-full border border-gray-300 px-4 py-2 focus:outline-none focus:ring-1 focus:ring-gray-700"
            />
            <InputTextComponent
              value={values?.confirmPassword}
              onChange={handleChange}
              type="text"
              placeholder={t("confirm_password")}
              name="confirmPassword"
              error={errors?.confirmPassword}
              touched={touched?.confirmPassword}
              className="text-[0.8rem] rounded-none w-full border border-gray-300 px-4 py-2 focus:outline-none focus:ring-1 focus:ring-gray-700"
            />
            <button
              type="submit"
              onClick={() => handleSubmit()}
              className="text-black w-full text-[1.1rem] font-[playfair] hover:bg-white border border-[#caa446] px-6 py-2 rounded-md hover:text-[#cca438] hover:border hover:border-[#caa446]"
              style={{ background: 'linear-gradient(rgb(255, 193, 7) 0%, rgb(255, 213, 79) 100%)' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'white'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'linear-gradient(rgb(255, 193, 7) 0%, rgb(255, 213, 79) 100%)'}
            >
              {t("update_password")}
            </button>
          </div>
        </div>
        </div>
        <Footer data={footerRangeList}/>
      </>
      }
    </>
  )
}

export default UserResetPasswordPage;