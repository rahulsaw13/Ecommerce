// hooks
import { useRef, useState } from "react";

// components
import ButtonComponent from "@common/ButtonComponent";
import InputTextComponent from "@common/InputTextComponent";
import { allApiWithHeaderToken } from "@api/api";
import Loading from '@common/Loading';
import { API_CONSTANTS } from "@constants/apiurl";

// external libraries
import * as yup from "yup";
import { useFormik } from "formik";
import { Toast } from "primereact/toast";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const data = {
  current_password: "",
  password: "",
  password_confirmation: "",
};

const ChangePassword = () => {
  const toast = useRef(null);
  const { t } = useTranslation("msg");
  const [loader, setLoader] = useState(false);
  const [toastType, setToastType] = useState('');
  const navigate = useNavigate();

  const validationSchema = yup.object().shape({
    current_password: yup
      .string()
      .min(6, t("please_enter_password_more_then_6_characters"))
      .required(t("current_password_is_required")),
    password: yup
      .string()
      .min(6, t("please_enter_password_more_then_6_characters"))
      .max(20, t("please_enter_password_less_then_20_characters"))
      .required(t("new_password_is_required")),
    password_confirmation: yup
      .string()
      .oneOf([yup.ref('password'), null], t("passwords_must_match"))
      .required(t("confirm_password_is_required"))
  });

  const onHandleSubmit = async (value) => {
    setLoader(true);
    allApiWithHeaderToken(API_CONSTANTS.CHANGE_PASSWORD_URL, value, "put")
    .then((response) => {
      if(response?.status === 200){
        setToastType('success');
        toast.current.show({
          severity: "success",
          summary: t("success"),
          detail: response?.data?.message,
          life: 2000
        });
      }
    })
    .catch((err) => {
      toast.current.show({
        severity: "error",
        summary: t("error"),
        detail: err?.response?.data?.error || err?.response?.data?.errors,
        life: 3000,
      });
    }).finally(()=>{
      setLoader(false);
    });
  };

  const toastHandler=()=>{
    if (toastType === 'success') {
        navigate('/login');
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
          {t("change_password")}
        </div>
        <div className="mt-2 flex flex-col gap-2">
          <InputTextComponent
            value={values?.current_password}
            onChange={handleChange}
            type="password"
            placeholder={t("current_password")}
            name="current_password"
            error={errors?.current_password}
            touched={touched?.current_password}
            className="w-full rounded border-[1px] border-[#ddd] px-[1rem] py-[8px] text-[11px] focus:outline-none"
          />
          <InputTextComponent
            value={values?.password}
            onChange={handleChange}
            type="password"
            placeholder={t("new_password")}
            name="password"
            error={errors?.password}
            touched={touched?.password}
            className="w-full rounded border-[1px] border-[#ddd] px-[1rem] py-[8px] text-[11px] focus:outline-none"
          />
          <InputTextComponent
            value={values?.password_confirmation}
            onChange={handleChange}
            type="password"
            placeholder={t("confirm_new_password")}
            name="password_confirmation"
            error={errors?.password_confirmation}
            touched={touched?.password_confirmation}
            className="w-full rounded border-[1px] border-[#ddd] px-[1rem] py-[8px] text-[11px] focus:outline-none"
          />
        </div>
        <div className="mt-4">
          <ButtonComponent
            onClick={() => handleSubmit()}
            type="submit"
            label={t("change_password")}
            className="w-full rounded bg-TextPrimaryColor px-6 py-2 text-[12px] text-white"
            icon="pi pi-arrow-right"
            iconPos="right"
          />
        </div>
        <div className="mt-2 text-center text-[0.8rem]">
          <span className="ps-2 font-[500] text-TextPrimaryColor underline">
            <Link to="/login">{t("back_to_login")}</Link>
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;
