// components
import ButtonComponent from "@common/ButtonComponent";
import InputTextComponent from "@common/InputTextComponent";
import { allApiWithHeaderToken } from "@api/api";
import { API_CONSTANTS } from "@constants/apiurl";
import { ROUTES_CONSTANTS } from "@constants/routesurl";
import AdminPanelLoader from '@common/AdminPanelLoader';
import FileUpload from "@common/FileUpload";
import Dropdown from "@common/DropdownComponent";

// external libraries
import * as yup from "yup";
import { useFormik } from "formik";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";

const structure = {
  name: "",
  description: "",
  image: "",
  image_url: "",
  icon: "",
};

const statusList = [
  { name: "Active", value: "1"},
  { name: "Inactive", value: "0"}
];

const CategoryForm = () => {
  const toast = useRef(null);
  const { t } = useTranslation("msg");
  const navigate = useNavigate();
  const [data, setData] = useState(structure);
  const [loader, setLoader] = useState(false);
  const { id } = useParams();

  const validationSchema = yup.object().shape({
    name: yup.string().required(t("name_is_required")),
    description: yup.string().required(t("description_is_required"))
  });

  const onHandleSubmit = async (value) => {
    if (id) {
      // Update
      updateCategory(value);
    } else {
      // Create
      createCategory(value);
    }
  };

  const createCategory = (value) => {
    let data = {
      name: value?.name,
      description: value?.description,
      status: 1,
      image: value?.image,
      icon: value?.icon
    }
    setLoader(true);
    allApiWithHeaderToken(API_CONSTANTS.COMMON_CATEGORIES_URL, data , "post", 'multipart/form-data')
      .then((response) => {
        if (response.status === 201) {
          toast.current.show({
            severity: "success",
            summary: "Success",
            detail: response?.data?.message || "Category created successfully",
            life: 3000,
          });
          setTimeout(() => {
            navigate(ROUTES_CONSTANTS.CATEGORIES);
          }, 3000);
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
      }).finally(()=>{
        setLoader(false);
      });
  };

  const updateCategory = (value) => {
    setLoader(true);
    let body = {
      name: value?.name,
      description: value?.description,
      status: Number(value?.status),
      icon: value?.icon
    }
    if(value?.image){
      body['image'] = value?.image
    }

    allApiWithHeaderToken(`${API_CONSTANTS.COMMON_CATEGORIES_URL}/${id}`, body, "put", 'multipart/form-data')
      .then((response) => {
        if (response.status === 200) {
          toast.current.show({
            severity: "success",
            summary: "Success",
            detail: response?.data?.message || "Category updated successfully",
            life: 3000,
          });
          setTimeout(() => {
            navigate(ROUTES_CONSTANTS.CATEGORIES);
          }, 3000);
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
      }).finally(()=>{
        setLoader(false);
      });
  };

  const handleBack = () => {
    navigate(ROUTES_CONSTANTS.CATEGORIES);
  };

  useEffect(() => {
    if (id) {
      setLoader(true);
      allApiWithHeaderToken(`${API_CONSTANTS.COMMON_CATEGORIES_URL}/${id}`, "", "get")
        .then((response) => {
          if (response.status === 200) {
            let data = {
              name: response?.data?.name,
              description: response?.data?.description,
              image_url: response?.data?.image_url,
              status: String(response?.data?.status),
              icon: response?.data?.icon || ""
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
          setLoader(false);
        }).finally(()=>{
          setLoader(false);
        });
    }
  }, []);

  const formik = useFormik({
    initialValues: data,
    onSubmit: onHandleSubmit,
    validationSchema: validationSchema,
    enableReinitialize: true,
    validateOnBlur: true,
  });

  const { values, errors, handleSubmit, handleChange, setFieldValue, touched } = formik;
  return (
    <div className="flex h-screen bg-BgPrimaryColor text-TextPrimaryColor overflow-y-scroll">
      {loader && <AdminPanelLoader/>}
      <Toast ref={toast} position="top-right" />
      <div className="mx-16 my-auto h-fit w-full bg-BgSecondaryColor p-8 border rounded border-BorderColor">
        <div className="font-[600] mb-5">
            {id ? t("update_category") : t("create_category")}
        </div>
        <div className="grid grid-cols-8 grid-rows-3 gap-4">
          <div className="col-span-8 md:col-span-3 row-span-3">
              <FileUpload 
                value={values?.image_url}
                name="image"
                isLabel={t("category_image")} 
                onChange={(e)=> {
                  setFieldValue('image', e?.currentTarget?.files[0]);
                  setFieldValue('image_url', URL.createObjectURL(e?.target?.files[0]));
                }}/>
          </div>
          <div className="col-span-3">
            <InputTextComponent
              value={values?.name}
              onChange={handleChange}
              type="text"
              placeholder={t("category_name")}
              name="name"
              isLabel={true}
              error={errors?.name}
              touched={touched?.name}
              className="w-full rounded border-[1px] border-[#ddd] px-[1rem] py-[8px] text-[11px] focus:outline-none"
            />
          </div>
          <div className="col-span-2">
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <InputTextComponent
                  value={values?.icon}
                  onChange={handleChange}
                  type="text"
                  placeholder={t("icon")}
                  name="icon"
                  isLabel={true}
                  error={errors?.icon}
                  touched={touched?.icon}
                  className="w-full rounded border-[1px] border-[#ddd] px-[1rem] py-[8px] text-[11px] focus:outline-none"
                />
              </div>
              <a 
                href="https://remixicon.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="mt-6 text-[1rem] text-TextPrimaryColor hover:text-opacity-80 transition-colors"
                title="Browse Remix Icons"
              >
                <i className="ri-external-link-line text-[1.3rem]"></i>
              </a>
            </div>
          </div>
          <div className="col-span-5">
            <InputTextComponent
              value={values?.description}
              onChange={handleChange}
              type="text"
              placeholder={t("category_description")}
              name="description"
              isLabel={true}
              error={errors?.description}
              touched={touched?.description}
              className="col-span-2 w-full rounded border-[1px] border-[#ddd] px-[1rem] py-[8px] text-[11px] focus:outline-none"
            />
          </div>
            {
              id && (
                <>
                  <div className="col-span-5">
                  <Dropdown
                      value={values?.status}
                      onChange={(field, value) => setFieldValue(field, value)}
                      data={statusList}
                      placeholder={t("status")}
                      name="status"
                      className="custom-dropdown col-span-2 w-full rounded border-[1px] border-[#ddd] focus:outline-none"
                      optionLabel="name"
                    />
                  </div>
                  <div className="col-span-2"></div>
                </>
              )
            }
          <div className="mt-4 flex justify-end gap-4 col-span-8">
            <ButtonComponent
              onClick={() => handleBack()}
              type="button"
              label={t("back")}
              className="rounded bg-TextPrimaryColor px-6 py-2 text-[12px] text-white"
            />
            <ButtonComponent
              onClick={() => handleSubmit()}
              type="submit"
              label={id ? t("update") : t("submit")}
              className="rounded bg-TextPrimaryColor px-6 py-2 text-[12px] text-white"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryForm;
