// utils
import * as yup from "yup";
import { useFormik } from "formik";
import { useTranslation } from "react-i18next";
import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";

// components
import ButtonComponent from "@common/ButtonComponent";
import InputTextComponent from "@common/InputTextComponent";
import { RadioButton } from "primereact/radiobutton";
import FileUpload from "@common/FileUpload";
import { allApiWithHeaderToken } from "@api/api";
import UserLoader from '@userpage-pages/UserLoader';
import { Toast } from "primereact/toast";
import { ROUTES_CONSTANTS } from "@constants/routesurl";
import { API_CONSTANTS } from "@constants/apiurl";

const structure = {
  name: "",
  email: "",
  gender: "",
  address: "",
  image: "",
  role_id: 1
};

const ProfilePage = () => {
  const { t } = useTranslation("msg");
  const [data, setData] = useState(structure);
  const navigate = useNavigate();
  const [loader, setLoader] = useState(false);
  const { id } = useParams();
  const toast = useRef(null);
  const [toastType, setToastType] = useState('');

  const validationSchema = yup.object().shape({
    name: yup.string().required(t("name_is_required")),
    email: yup.string().required(t("email_is_required")),
  });

  const onHandleSubmit = async (value) => {
    setLoader(true);
    let body = {
        email: value?.email,
        name: value?.name,
        role_id: value?.role_id,
        gender: value?.gender,
        phone_number: value?.phoneNumber,
    };
    if(value?.image){
      body['image'] = value?.image
    }
    
    allApiWithHeaderToken(`${API_CONSTANTS.COMMON_USERS_URL}/${id}`, body, "put", 'multipart/form-data' )
      .then((response) => {
        if (response.status === 200) {
          navigate(ROUTES_CONSTANTS.USERS);
        }
      })
      .catch((err) => {
        toast.current.show({
            severity: "error",
            summary: "Error",
            detail: err?.response?.data?.errors,
            life: 3000,
        });
        setLoader(false);
      });
  };

  const backHandler=()=>{
    let userNavigation = JSON.parse(localStorage.getItem("user"))?.role && JSON.parse(localStorage.getItem("user"))?.role === 'admin' && '/dashboard/sector-master';
    if(userNavigation){
      navigate(userNavigation);
    }
    else{
      navigate('/dashboard');
    }
  }

  useEffect(() => {
    setLoader(true);
    try{
        if(id){
          allApiWithHeaderToken(`${API_CONSTANTS.COMMON_USERS_URL}/${id}`, "", "get")
          .then((response) => {
            if (response.status === 200) {
                let data = {
                    name: response?.data?.name,
                    gender: response?.data?.gender,
                    image_url: response?.data?.image_url,
                    phoneNumber: response?.data?.phone_number,
                    email: response?.data?.email,
                    role_id: response?.data?.role_id
                }
                setData(data);
            } 
          })
          .catch((err) => {
            toast.current.show({
                severity: "error",
                summary: "Error",
                detail: err?.response?.data?.errors,
                life: 3000,
            });
          });
        }
    } catch (err){
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Something Went Wrong",
        life: 3000,
      });
    }finally {
      setLoader(false);
    }
  }, []);

  const formik = useFormik({
    initialValues: data,
    onSubmit: onHandleSubmit,
    validationSchema: validationSchema,
    enableReinitialize: true,
    validateOnBlur: true,
  });

  const toastHandler=()=>{
    if (toastType === 'success') {
        backHandler();
     }
  };

  const { values, errors, handleSubmit, handleChange, touched, setFieldValue } = formik;

  return (
    <div className="min-h-screen bg-BgPrimaryColor p-4 sm:p-6 lg:p-8 overflow-y-auto">
      {loader && <UserLoader />}
      <Toast ref={toast} position="top-right" style={{ scale: '0.7' }} onHide={toastHandler} />

      <div className="max-w-6xl mx-auto grid gap-6 rounded border border-BorderColor bg-BgSecondaryColor p-4 sm:p-6 lg:p-8">
        <h4 className="text-xl sm:text-2xl lg:text-3xl font-serif font-extrabold dark:text-white">
          {t("my_profile")}
        </h4>

        {/* Profile Image Upload */}
        <div className="w-full">
          <FileUpload
            isLabel={t("profile_image")}
            value={values?.image_url}
            name="image"
            onChange={(e) => {
              setFieldValue('image', e?.currentTarget?.files[0]);
              setFieldValue('image_url', URL.createObjectURL(e?.target?.files[0]));
            }}
            isProfile={true}
          />
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputTextComponent
            value={values?.name}
            onChange={handleChange}
            type="text"
            placeholder={t("name")}
            name="name"
            isLabel={true}
            error={errors?.name}
            touched={touched?.name}
            className="w-full rounded border border-[#ddd] px-4 py-2 text-sm focus:outline-none"
          />

          <InputTextComponent
            value={values?.phoneNumber}
            onChange={handleChange}
            type="text"
            placeholder={t("phone_number")}
            name="phoneNumber"
            isLabel={true}
            error={errors?.phoneNumber}
            touched={touched?.phoneNumber}
            className="w-full rounded border border-[#ddd] px-4 py-2 text-sm focus:outline-none"
          />

          <InputTextComponent
            value={values?.email}
            onChange={handleChange}
            type="text"
            placeholder={t("email")}
            name="email"
            isLabel={true}
            error={errors?.email}
            touched={touched?.email}
            disabled={true}
            className="w-full rounded border border-[#ddd] px-4 py-2 text-sm focus:outline-none"
          />

          {/* Gender */}
          <div>
            <label className="text-sm font-semibold text-TextSecondaryColor">{t("gender")}</label>
            <div className="flex flex-wrap gap-4 mt-2">
              {["Male", "Female", "Other"].map((g) => (
                <div className="flex items-center" key={g}>
                  <RadioButton
                    name="gender"
                    value={g}
                    onChange={(e) => setFieldValue("gender", e.value)}
                    checked={values.gender === g}
                  />
                  <label className="ml-2 text-sm font-medium">{g}</label>
                </div>
              ))}
            </div>
            {errors?.gender && touched?.gender && (
              <p className="text-xs text-red-600 mt-1">{errors?.gender}</p>
            )}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row justify-end gap-4 mt-6">
          <ButtonComponent
            onClick={backHandler}
            type="button"
            label={t("back")}
            className="rounded bg-[#1f1f70] px-6 py-2 text-sm text-white w-full sm:w-auto"
          />
          <ButtonComponent
            onClick={() => handleSubmit()}
            type="submit"
            label={t("update")}
            className="rounded bg-[#1f1f70] px-6 py-2 text-sm text-white w-full sm:w-auto"
          />
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
