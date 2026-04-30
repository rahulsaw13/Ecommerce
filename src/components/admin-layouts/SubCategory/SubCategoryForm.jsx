// components
import ButtonComponent from "@common/ButtonComponent";
import InputTextComponent from "@common/InputTextComponent";
import { allApiWithHeaderToken } from "@api/api";
import { API_CONSTANTS } from "@constants/apiurl";
import { ROUTES_CONSTANTS } from "@constants/routesurl";
import AdminPanelLoader from '@common/AdminPanelLoader';
import FileUpload from "@common/FileUpload";
import DropdownComponent from "@common/DropdownComponent";

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
  categoryType: {}
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
  const [categoryList, setCategoryList] = useState([]); 
  const { id } = useParams();

  const validationSchema = yup.object().shape({
    name: yup.string().required(t("name_is_required")),
    description: yup.string().required(t("description_is_required")),
    categoryType: yup.object()
    .test('non-empty-object', t("category_type_is_required"), (value) => {
      return value && Object.keys(value).length > 0;
    })
  });

  const onHandleSubmit = async (value) => {
    if (id) {
      // Update
      updateSubCategory(value);
    } else {
      // Create
      createSubCategory(value);
    }
  };

  const createSubCategory = (value) => {
    let data = {
      name: value?.name,
      description: value?.description,
      status: 1,
      image: value?.image,
      category_id: value?.categoryType?.id
    }
    setLoader(true);
    allApiWithHeaderToken(API_CONSTANTS.COMMON_SUB_CATEGORIES_URL, data , "post", 'multipart/form-data')
      .then((response) => {
        if (response.status === 201) {
          toast.current.show({
            severity: "success",
            summary: "Success",
            detail: "Sub Category created successfully",
            life: 3000,
          });
          setTimeout(() => {
            navigate(ROUTES_CONSTANTS.SUB_CATEGORIES);
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

  const updateSubCategory = (value) => {
    setLoader(true);
    let body = {
      name: value?.name,
      description: value?.description,
      status: value?.status,
    }
    if(value?.image){
      body['image'] = value?.image
    }

    allApiWithHeaderToken(`${API_CONSTANTS.COMMON_SUB_CATEGORIES_URL}/${id}`, body, "put", 'multipart/form-data')
      .then((response) => {
        if (response.status === 200) {
          toast.current.show({
            severity: "success",
            summary: "Success",
            detail: "Sub Category updated successfully",
            life: 3000,
          });
          setTimeout(() => {
            navigate(ROUTES_CONSTANTS.SUB_CATEGORIES);
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
    navigate(ROUTES_CONSTANTS.SUB_CATEGORIES);
  };

  const fetchCategoryList = async () => {
    setLoader(true);
    try {
      const categoryResponse = await allApiWithHeaderToken(`${API_CONSTANTS.COMMON_CATEGORIES_URL}/active_categories_list`, "", "get");
      if (categoryResponse.status === 200) {
        setCategoryList(categoryResponse?.data);
      }
      
      if (categoryResponse.status === 200 && id) {
        const subCategoryResponse = await allApiWithHeaderToken(`${API_CONSTANTS.COMMON_SUB_CATEGORIES_URL}/${id}`, "", "get");
        if (subCategoryResponse.status === 200) {
          const categoryId = subCategoryResponse?.data?.category_id;
          const selectedCategory = categoryResponse?.data.find((category) => category.id === categoryId);
  
          let data = {
            name: subCategoryResponse?.data?.name,
            description: subCategoryResponse?.data?.description,
            image_url: subCategoryResponse?.data?.image_url,
            status: String(subCategoryResponse?.data?.status),
            categoryType: selectedCategory,
          };
          setData(data);
        } 
      }
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: err?.response?.data?.errors,
        life: 3000,
      });
      setLoader(false);
    } finally {
      setLoader(false);
    }
  };
  
  useEffect(() => {
    fetchCategoryList();
  }, [id]);
  
  const formik = useFormik({
    initialValues: data,
    onSubmit: onHandleSubmit,
    validationSchema: validationSchema,
    enableReinitialize: true,
    validateOnBlur: true,
  });

  
  const { values, errors, handleSubmit, handleChange, setFieldValue, touched } = formik;

  return (
    <div className="flex h-screen text-TextPrimaryColor bg-BgPrimaryColor">
      {loader && <AdminPanelLoader/>}
      <Toast ref={toast} position="top-right" />
      <div className="mx-16 my-auto grid h-fit w-full grid-cols-4 gap-4 bg-BgSecondaryColor p-8 border rounded border-BorderColor">
        <div className="col-span-4 font-[600]">
            {id ? t("update_sub_category") : t("create_sub_category")}
        </div>
        <div className="col-span-2">
          <DropdownComponent
              value={values?.categoryType}
              onChange={(field, value) => setFieldValue(field, value)}
              data={categoryList}
              name="categoryType"
              placeholder={t("select_category")}
              className="custom-dropdown col-span-2 w-full rounded border-[1px] border-[#ddd] focus:outline-none"
              optionLabel="name"
              error={errors?.categoryType}
              touched={touched?.categoryType}
            />
        </div>
        {
          id && (
            <>
              <div className="col-span-2">
              <DropdownComponent
                  value={values?.status}
                  onChange={(field, value) => setFieldValue(field, value)}
                  data={statusList}
                  name="status"
                  placeholder={t("status")}
                  className="custom-dropdown col-span-2 w-full rounded border-[1px] border-[#ddd] focus:outline-none"
                  optionLabel="name"
                />
              </div>
            </>
          )
        }
        <div className="col-span-2">
          <InputTextComponent
            value={values?.name}
            onChange={handleChange}
            type="text"
            placeholder={t("category_sub_name")}
            name="name"
            isLabel={true}
            error={errors?.name}
            touched={touched?.name}
            className="w-full rounded border-[1px] border-[#ddd] px-[1rem] py-[8px] text-[11px] focus:outline-none"
          />
        </div>
        <div className="col-span-2">
          <InputTextComponent
            value={values?.description}
            onChange={handleChange}
            type="text"
            placeholder={t("category_sub_description")}
            name="description"
            isLabel={true}
            error={errors?.description}
            touched={touched?.description}
            className="col-span-2 w-full rounded border-[1px] border-[#ddd] px-[1rem] py-[8px] text-[11px] focus:outline-none"
          />
        </div>
        <div className="col-span-4 md:col-span-2">
            <FileUpload 
              value={values?.image_url}
              name="image"
              isLabel={t("category_sub_image")} 
              onChange={(e)=> {
                setFieldValue('image', e?.currentTarget?.files[0]);
                setFieldValue('image_url', URL.createObjectURL(e?.target?.files[0]));
              }}/>
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

export default CategoryForm;
