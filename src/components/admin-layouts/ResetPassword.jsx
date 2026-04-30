// hooks
import { useRef, useState } from "react";

// components
import ButtonComponent from "@common/ButtonComponent";
import InputTextComponent from "@common/InputTextComponent";
import { allApi } from "@api/api";
import Loading from '@common/Loading';
import { API_CONSTANTS } from "@constants/apiurl";
import { ROUTES_CONSTANTS } from "@constants/routesurl";

// external libraries
import * as yup from "yup";
import { useFormik } from "formik";
import { Toast } from "primereact/toast";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

const data = {
  password: "",
  confirmPassword: ""
};

const ResetPassword = () => {
  const toast = useRef(null);
  const { t } = useTranslation("msg");
  const [loader, setLoader] = useState(false);
  const [toastType, setToastType] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

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
        setToastType('success');
        toast.current.show({
          severity: "success",
          summary: t("success"),
          detail: response?.data?.message,
          life: 1000
        });
      }
    })
    .catch((err) => {
    }).finally(()=>{
      setLoader(false);
    });
  };

  const toastHandler=()=>{
    if (toastType === 'success') {
      navigate(ROUTES_CONSTANTS.LOGIN); 
     }
  };

  const formik = useFormik({
    initialValues: data,
    onSubmit: onHandleSubmit,
    validationSchema: validationSchema,
    enableReinitialize: true,
    validateOnBlur: true,
  });

  const { values, errors, handleSubmit, handleChange, touched } = formik;

  return (
    <div className="h-screen items-center flex justify-center max-sm:px-4">
      {loader && <Loading/>}
      <div className="w-1/3 shadow-cards max-lg:w-1/2 max-sm:w-full border px-5 py-5 max-lg:px-10 max-md:px-5">
        <Toast ref={toast} position="top-right" style={{scale: '0.7'}} onHide={toastHandler}/>
        <div className="text-center text-TextPrimaryColor text-[1.5rem] font-[600] tracking-wide max-lg:text-[1.4em] max-sm:text-[1rem]">
          {t("reset_password")}
        </div>
        <div className="mt-2 flex flex-col gap-2">
          <div>
            <InputTextComponent
              value={values?.password}
              onChange={handleChange}
              type="password"
              placeholder={t("password")}
              name="password"
              error={errors?.password}
              touched={touched?.password}
              className="w-full rounded border-[1px] border-[#ddd] px-[1rem] py-[8px] text-[11px] focus:outline-none"
            />
          </div>
          <div>
            <InputTextComponent
              value={values?.confirmPassword}
              onChange={handleChange}
              type="password"
              placeholder={t("confirm_password")}
              name="confirmPassword"
              error={errors?.confirmPassword}
              touched={touched?.confirmPassword}
              className="w-full rounded border-[1px] border-[#ddd] px-[1rem] py-[8px] text-[11px] focus:outline-none"
            />
          </div>
        </div>
        <div className="mt-4">
          <ButtonComponent
            onClick={() => handleSubmit()}
            type="submit"
            label={t("request_reset_link")}
            className="w-full rounded bg-TextPrimaryColor px-6 py-2 text-[12px] text-white"
            icon="pi pi-arrow-right"
            iconPos="right"
          />
        </div>
        <div className="mt-2 text-center text-[0.8rem]">
          <span className="ps-2 font-[500] text-TextPrimaryColor underline">
            <Link to="/">{t("back_to_login")}</Link>
          </span>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
