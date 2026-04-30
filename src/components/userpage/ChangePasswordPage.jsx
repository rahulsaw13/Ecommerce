// utils
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import * as yup from "yup";
import { useFormik } from "formik";
import { Toast } from "primereact/toast";

// Components
import UserLoader from '@userpage-pages/UserLoader';
import Header from '@common/Header';
import Footer from '@common/Footer';
import { allApi, allApiWithHeaderToken } from "@api/api";
import { API_CONSTANTS } from "@constants/apiurl";
import InputTextComponent from "@common/InputTextComponent";

const initialData = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: ""
};

const ChangePasswordPage = () => {
  const { t } = useTranslation("msg");
  const [data, setData] = useState(initialData);
  const navigate = useNavigate();
  const [loader, setLoader] = useState(false);
  const [menuList, setMenuList] = useState([]);
  const [footerRangeList, setFooterRangeList] = useState([]);
  const toast = useRef(null);

  const handleSearch = (query) => {
  };

  const validationSchema = yup.object().shape({
    currentPassword: yup
      .string()
      .required(t("current_password_is_required")),
    newPassword: yup
      .string()
      .min(6, t("please_enter_password_more_then_6_characters"))
      .max(20, t("please_enter_password_less_then_20_characters"))
      .required(t("new_password_is_required")),
    confirmPassword: yup
      .string()
      .oneOf([yup.ref("newPassword")], t("confirm_password_and_new_password_should_be_same"))
      .required(t("confirm_password_is_required")),
  });

  const onHandleSubmit = async (value) => {
    setLoader(true);
    let body = {
      current_password: value?.currentPassword,
      password: value?.newPassword,
      password_confirmation: value?.confirmPassword
    };

    allApiWithHeaderToken(API_CONSTANTS.CHANGE_PASSWORD_URL, body, "put")
      .then((response) => {
        if (response.status === 200) {
          toast.current.show({
            severity: "success",
            summary: t("success"),
            detail: response?.data?.message || t("password_changed_successfully"),
            life: 3000,
          });
          setTimeout(() => {
            navigate("/");
          }, 3000);
        }
      })
      .catch((err) => {
        toast.current.show({
          severity: "error",
          summary: t("error"),
          detail: err?.response?.data?.error || err?.response?.data?.errors || t("password_change_failed"),
          life: 3000,
        });
      })
      .finally(() => {
        setLoader(false);
      });
  };

  const fetchMenuList = () => {
    setLoader(true);
    allApi(API_CONSTANTS.MENU_LIST_URL, "", "get")
      .then((response) => {
        if (response.status === 200) {
          let data = response?.data?.filter((item, index) => index <= 6);
          setFooterRangeList(data);
          data.push({ name: "About Us" });
          setMenuList(data);
        }
      })
      .catch((err) => {
        setLoader(false);
      })
      .finally(() => {
        setLoader(false);
      });
  };

  useEffect(() => {
    fetchMenuList();
  }, []);

  const formik = useFormik({
    initialValues: data,
    onSubmit: onHandleSubmit,
    validationSchema: validationSchema,
    enableReinitialize: true,
    validateOnBlur: true,
  });

  const { values, errors, handleSubmit, handleChange, touched, resetForm } = formik;

  return (
    <>
      <Toast ref={toast} position="top-right" style={{ scale: '0.7' }} />
      {loader ? <UserLoader /> :
        <>
          <Header onSearch={handleSearch} />
          <div className="min-h-screen flex mt-16 flex-col items-center bg-white px-6 py-12">
            <div className="text-center mb-8">
              <h1 className="text-3xl text-[#1D2E43] font-[playfair] font-bold">{t("change_password")}</h1>
              <div className="text-sm text-gray-600 mt-2">
                <span className="hover:cursor-pointer" onClick={() => { navigate("/") }}>{t("home")}</span>
                <span className="mx-1 text-[11px]">&gt;</span>
                <span>{t("change_password")}</span>
              </div>
            </div>

            <div className="w-full max-w-md">
              <h2 className="text-2xl text-[#1D2E43] mb-6 font-[playfair]">{t("update_password")}</h2>
              <div className="space-y-4">
                <InputTextComponent
                  value={values?.currentPassword}
                  onChange={handleChange}
                  type="password"
                  placeholder={t("current_password")}
                  name="currentPassword"
                  error={errors?.currentPassword}
                  touched={touched?.currentPassword}
                  className="text-[0.8rem] rounded-none w-full border border-gray-300 px-4 py-2 focus:outline-none focus:ring-1 focus:ring-gray-700"
                />
                <InputTextComponent
                  value={values?.newPassword}
                  onChange={handleChange}
                  type="password"
                  placeholder={t("new_password")}
                  name="newPassword"
                  error={errors?.newPassword}
                  touched={touched?.newPassword}
                  className="text-[0.8rem] rounded-none w-full border border-gray-300 px-4 py-2 focus:outline-none focus:ring-1 focus:ring-gray-700"
                />
                <InputTextComponent
                  value={values?.confirmPassword}
                  onChange={handleChange}
                  type="password"
                  placeholder={t("confirm_new_password")}
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
                  {t("change_password")}
                </button>
              </div>
            </div>
          </div>
          <Footer data={footerRangeList} />
        </>
      }
    </>
  )
}

export default ChangePasswordPage;
