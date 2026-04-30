// components
import ButtonComponent from "@common/ButtonComponent";
import InputTextComponent from "@common/InputTextComponent";
import FileUpload from "@common/FileUpload";
import { API_CONSTANTS } from "@constants/apiurl";
import { ROUTES_CONSTANTS } from "@constants/routesurl";
import { allApiWithHeaderToken } from "@api/api";
import Loading from '@common/Loading';

// external libraries
import * as yup from "yup";
import { useFormik } from "formik";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Toast } from "primereact/toast";
import { useEffect, useRef, useState } from "react";
import { Editor } from "primereact/editor";

const initialValues = {
  heading: "",
  image: "",
  description: ""
}
const BlogForm = () => {
  const toast = useRef(null);
  const { t } = useTranslation("msg");
  const navigate = useNavigate();
  const [loader, setLoader] = useState(false);

  const [data, setData] = useState(initialValues);
  const [toastType, setToastType] = useState(''); 
  const { id } = useParams();

  const validationSchema = yup.object().shape({
    heading: yup.string().required(t("heading_is_required")),
    description: yup.string().required(t("description_is_required"))
  });

  const onHandleSubmit = (value) => {
    if (id) {
      // Update Blog
      updateBlog(value);
    } else {
      // Create Blog
      createBlog(value);
    }
  };

  
  const toastHandler=()=>{
    if (toastType === 'success') {
       navigate(ROUTES_CONSTANTS.BLOGS);
     }
  }

  const successToaster=(response)=>{
    setToastType('success');
    return toast.current.show({
      severity: "success",
      summary: t("success"),
      detail: response?.data?.message,
      life: 500
    });
  };

  const errorToaster=(err)=>{
    setToastType('error');
    return toast.current.show({
      severity: "error",
      summary: t("error"),
      detail: err,
      life: 1000
    });
  };

  const createBlog = (value) => {
    let data = {
      heading: value?.heading,
      description: value?.description,
      image: value?.image
    }
    setLoader(true);
    allApiWithHeaderToken(API_CONSTANTS.COMMON_BLOGS_URL, data, "post", 'multipart/form-data').then((response) => {
      if (response.status === 201) {
        successToaster(response);
      }
    })
    .catch((err) => {
      errorToaster(err?.response?.data?.errors);
      setLoader(false);
    }).finally(()=>{
      setLoader(false);
    });
  };

  const updateBlog = (value) => {
    setLoader(true);
    let body = {
      heading: value?.heading,
      description: value?.description
    }
    if(value?.image){
      body['image'] = value?.image
    }

    allApiWithHeaderToken(`${API_CONSTANTS.COMMON_BLOGS_URL}/${id}`, body, "put", 'multipart/form-data' )
      .then((response) => {
        if (response.status === 200) {
          navigate(ROUTES_CONSTANTS.BLOGS);
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

  useEffect(() => {
      if (id) {
        setLoader(true);
        allApiWithHeaderToken(`${API_CONSTANTS.COMMON_BLOGS_URL}/${id}`, "", "get")
          .then((response) => {
            if (response.status === 200) {
              let data = {
                heading: response?.data?.heading,
                description: response?.data?.description,
                image_url: response?.data?.image_url,
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

  const handleBack = () => {
    navigate(ROUTES_CONSTANTS.BLOGS);
  };

  const formik = useFormik({
    initialValues: data,
    onSubmit: onHandleSubmit,
    validationSchema: validationSchema,
    enableReinitialize: true,
    validateOnBlur: true,
  });

  const { values, errors, setFieldValue,handleSubmit, handleChange, touched } = formik;

  return (
    <div className="flex h-screen bg-BgPrimaryColor text-TextPrimaryColor py-5 overflow-y-scroll">
      {loader && <Loading/>}
      <Toast ref={toast} position="top-right" style={{scale: '0.7'}} onHide={toastHandler}/>
      <div className="mx-16 my-auto grid h-fit w-full grid-cols-4 gap-4 bg-BgSecondaryColor p-8 border rounded border-BorderColor">
        <div className="col-span-4 font-[600]">
            {id ? t("update_blog") : t("create_blog")}
        </div>
       <div className="col-span-4">
            <FileUpload 
                value={values?.image_url}
                name="image"
                isLabel={t("blog_image")} 
                onChange={(e)=> {
                  setFieldValue('image', e?.currentTarget?.files[0]);
                  setFieldValue('image_url', URL.createObjectURL(e?.target?.files[0]));
                }}
              />    
             <label htmlFor="file" className="error text-red-500">{errors?.file}</label>
        </div>
        <div className="col-span-2">
          <InputTextComponent
            value={values?.heading}
            onChange={handleChange}
            type="text"
            placeholder={t("blog_heading")}
            name="heading"
            isLabel={true}
            error={errors?.heading}
            touched={touched?.heading}
            className="col-span-2 w-full rounded border-[1px] border-[#ddd] px-[1rem] py-[8px] text-[11px] focus:outline-none"
          />
        </div>
        <div className="col-span-4">
          <label className="text-[12px] text-TextPrimaryColor ms-[4px] font-[600]">{t("description")}</label>
          <Editor 
            name="description"
            value={values?.description} 
            onTextChange={(e)=>{
              setFieldValue('description', e.htmlValue);
            }} 
            style={{ height: '320px' }} 
          />
          {errors?.description && touched?.description ? (
              <p className="text-[0.7rem] text-red-600">{errors?.gender}</p>
              ) : (
              ""
          )}
        </div>
        <div className="col-span-3"></div>
        <div className="mt-4 flex justify-end gap-4">
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
  );
};

export default BlogForm;
