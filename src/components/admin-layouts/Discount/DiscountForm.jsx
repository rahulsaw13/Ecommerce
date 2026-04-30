// components
import ButtonComponent from "@common/ButtonComponent";
import InputTextComponent from "@common/InputTextComponent";
import { allApiWithHeaderToken } from "@api/api";
import { API_CONSTANTS } from "@constants/apiurl";
import { ROUTES_CONSTANTS } from "@constants/routesurl";
import AdminPanelLoader from '@common/AdminPanelLoader';
import DropdownComponent from "@common/DropdownComponent";
import { refactorPrefilledDateForInput } from '@helper';

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
  discountValue: "",
  validFrom: "",
  validUntil: "",
  discountType: "",
  status: "1",
  usageLimit: "",
  perUserLimit: ""
};

const discountTypeList = [
  { name: "Percentage", value: "0"},
  { name: "Fixed", value: "1"}
];

const statusList = [
  { name: "Active", value: "1"},
  { name: "Inactive", value: "0"}
];

const DiscountForm = () => {
  const toast = useRef(null);
  const { t } = useTranslation("msg");
  const navigate = useNavigate();
  const [data, setData] = useState(structure);
  const [loader, setLoader] = useState(false);
  const { id } = useParams();

  const validationSchema = yup.object().shape({
    name: yup.string().required(t("name_is_required")),
    description: yup.string(),
    discountType: yup.string().required(t("discount_type_is_required")),
    discountValue: yup.number().required(t("discount_value_is_required")),
    validFrom: yup.string().required(t("valid_from_date_is_required")),
    validUntil: yup.string().required(t("valid_until_date_is_required")),
    status: yup.string().required(t("status_is_required")),
    usageLimit: yup.number()
      .required("Total usage limit is required")
      .positive("Total usage limit must be a positive number")
      .integer("Total usage limit must be a whole number"),
    perUserLimit: yup.number()
      .required("Per user limit is required")
      .positive("Per user limit must be a positive number")
      .integer("Per user limit must be a whole number")
  });

  const onHandleSubmit = async (value) => {
    if (id) {
      // Update
      updateDiscount(value);
    } else {
      // Create
      createDiscount(value);
    }
  };

  const createDiscount = (value) => {
    let data = {
      name: value?.name,
      description: value?.description,
      discount_type: value?.discountType,
      discount_value: value?.discountValue,
      start_date: value?.validFrom,
      end_date: value?.validUntil,
      status: value?.status,
      usage_limit: value?.usageLimit,
      per_user_limit: value?.perUserLimit
    }
    setLoader(true);
    allApiWithHeaderToken(API_CONSTANTS.COMMON_DISCOUNT_URL, data , "post")
      .then((response) => {
        if (response.status === 201) {
          navigate(ROUTES_CONSTANTS.DISCOUNT);
        }
      })
      .catch((err) => {
        let errorMessage = t("failed_to_create_discount");
        
        // Check for specific validation errors
        if (err?.response?.data?.errors) {
          const errors = err.response.data.errors;
          if (Array.isArray(errors)) {
            // Check for duplicate name error
            if (errors.some(e => e.includes('Name has already been taken'))) {
              errorMessage = t("discount_name_already_exists");
            }
            // Check for duplicate code error
            else if (errors.some(e => e.includes('Code has already been taken'))) {
              errorMessage = t("discount_code_already_exists");
            }
            else {
              errorMessage = errors.join(', ');
            }
          } else {
            errorMessage = errors;
          }
        } else if (err?.response?.data?.error) {
          errorMessage = err.response.data.error;
        }
        
        toast.current.show({
          severity: "error",
          summary: t("error"),
          detail: errorMessage,
          life: 3000,
        });
        setLoader(false);
      }).finally(()=>{
        setLoader(false);
      });
  };

  const updateDiscount = (value) => {
    setLoader(true);
    let body = {
      name: value?.name,
      description: value?.description,
      discount_type: value?.discountType,
      discount_value: value?.discountValue,
      start_date: value?.validFrom,
      end_date: value?.validUntil,
      status: value?.status,
      usage_limit: value?.usageLimit,
      per_user_limit: value?.perUserLimit
    }

    allApiWithHeaderToken(`${API_CONSTANTS.COMMON_DISCOUNT_URL}/${id}`, body, "put")
      .then((response) => {
        if (response.status === 200) {
          navigate(ROUTES_CONSTANTS.DISCOUNT);
        } 
      })
      .catch((err) => {
        let errorMessage = t("failed_to_update_discount");
        
        // Check for specific validation errors
        if (err?.response?.data?.errors) {
          const errors = err.response.data.errors;
          if (Array.isArray(errors)) {
            // Check for duplicate name error
            if (errors.some(e => e.includes('Name has already been taken'))) {
              errorMessage = t("discount_name_already_exists");
            }
            // Check for duplicate code error
            else if (errors.some(e => e.includes('Code has already been taken'))) {
              errorMessage = t("discount_code_already_exists");
            }
            else {
              errorMessage = errors.join(', ');
            }
          } else {
            errorMessage = errors;
          }
        } else if (err?.response?.data?.error) {
          errorMessage = err.response.data.error;
        }
        
        toast.current.show({
          severity: "error",
          summary: t("error"),
          detail: errorMessage,
          life: 3000,
        });
        setLoader(false);
      }).finally(()=>{
        setLoader(false);
      });
  };

  const handleBack = () => {
    navigate(ROUTES_CONSTANTS.DISCOUNT);
  };

  const checkValidDate=(startDate, endDate, key)=>{
    if(new Date(startDate) > new Date(endDate)){
      setFieldValue(key, "");
    }
  };

  const fetchDiscountData = async () => {
    if (!id) return;
    
    setLoader(true); 
    try {
      const discountResponse = await allApiWithHeaderToken(`${API_CONSTANTS.COMMON_DISCOUNT_URL}/${id}`, "", "get");
      
      let data = {
        name: discountResponse?.data?.data?.name,
        description: discountResponse?.data?.data?.description || "",
        discountType: String(discountResponse?.data?.data?.discount_type),
        discountValue: discountResponse?.data?.data?.discount_value,
        validFrom: refactorPrefilledDateForInput(discountResponse?.data?.data?.start_date),
        validUntil: refactorPrefilledDateForInput(discountResponse?.data?.data?.end_date),
        status: String(discountResponse?.data?.data?.status),
        usageLimit: discountResponse?.data?.data?.usage_limit || "",
        perUserLimit: discountResponse?.data?.data?.per_user_limit || ""
      }
      setData(data);
  
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
      fetchDiscountData();
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
    <div className="flex h-screen bg-BgPrimaryColor text-TextPrimaryColor overflow-y-scroll">
      {loader && <AdminPanelLoader/>}
      <Toast ref={toast} position="top-right" />
      <div className="mx-16 my-auto grid h-fit w-full grid-cols-4 gap-4 bg-BgSecondaryColor p-8 border rounded border-BorderColor">
        <div className="col-span-4 font-[600]">
            {id ? t("update_discount") : t("create_discount")}
        </div>
        <div className="col-span-2">
          <InputTextComponent
            value={values?.name}
            onChange={handleChange}
            type="text"
            placeholder={t("name")}
            name="name"
            isLabel={true}
            error={errors?.name}
            touched={touched?.name}
            className="col-span-2 w-full rounded border-[1px] border-[#ddd] px-[1rem] py-[8px] text-[11px] focus:outline-none"
          />
        </div>
        <div className="col-span-2">
          <InputTextComponent
            value={values?.description}
            onChange={handleChange}
            type="text"
            placeholder={t("description")}
            name="description"
            isLabel={true}
            error={errors?.description}
            touched={touched?.description}
            className="col-span-2 w-full rounded border-[1px] border-[#ddd] px-[1rem] py-[8px] text-[11px] focus:outline-none"
          />
        </div>
        <div className="col-span-2">
         <DropdownComponent
              value={values?.discountType}
              onChange={(field, value) => setFieldValue(field, value)}
              data={discountTypeList}
              name="discountType"
              placeholder={t("discount_type")}
              className="custom-dropdown col-span-2 w-full rounded border-[1px] border-[#ddd] focus:outline-none"
              optionLabel="name"
              error={errors?.discountType}
              touched={touched?.discountType}
            />
        </div>
        <div className="col-span-2">
          <InputTextComponent
            value={values?.discountValue}
            onChange={handleChange}
            type="number"
            placeholder={t("discount_value")}
            name="discountValue"
            isLabel={true}
            error={errors?.discountValue}
            touched={touched?.discountValue}
            className="col-span-2 w-full rounded border-[1px] border-[#ddd] px-[1rem] py-[8px] text-[11px] focus:outline-none"
          />
        </div>
        <div className="col-span-2">
          <DropdownComponent
            value={values?.status}
            onChange={(field, value) => setFieldValue(field, value)}
            data={statusList}
            name="status"
            placeholder={t("status")}
            className="custom-dropdown col-span-2 w-full rounded border-[1px] border-[#ddd] focus:outline-none"
            optionLabel="name"
            error={errors?.status}
            touched={touched?.status}
          />
        </div>
        <div className="col-span-2">
          <InputTextComponent
            value={values?.validFrom}
            onChange={(e)=>{
              handleChange(e);
              if(values?.validUntil){
                checkValidDate(e?.target?.value, values?.validUntil, "validUntil");
              }
            }}
            type="date"
            placeholder={t("valid_from")}
            name="validFrom"
            isLabel={true}
            error={errors?.validFrom}
            touched={touched?.validFrom}
            className="col-span-2 w-full rounded border-[1px] border-[#ddd] px-[1rem] py-[8px] text-[11px] focus:outline-none"
          />
        </div>
        <div className="col-span-2">
          <InputTextComponent
            value={values?.validUntil}
            onChange={(e)=>{
              handleChange(e);
              if(values?.validFrom){
                checkValidDate(values?.validFrom, e?.target?.value, "validFrom");
              }
            }}
            type="date"
            placeholder={t("valid_until")}
            name="validUntil"
            isLabel={true}
            error={errors?.validUntil}
            touched={touched?.validUntil}
            className="col-span-2 w-full rounded border-[1px] border-[#ddd] px-[1rem] py-[8px] text-[11px] focus:outline-none"
          />
        </div>
        <div className="col-span-2">
          <InputTextComponent
            value={values?.usageLimit}
            onChange={handleChange}
            type="number"
            placeholder="Total Usage Limit"
            name="usageLimit"
            isLabel={true}
            error={errors?.usageLimit}
            touched={touched?.usageLimit}
            className="col-span-2 w-full rounded border-[1px] border-[#ddd] px-[1rem] py-[8px] text-[11px] focus:outline-none"
          />
        </div>
        <div className="col-span-2">
          <InputTextComponent
            value={values?.perUserLimit}
            onChange={handleChange}
            type="number"
            placeholder="Per User Limit"
            name="perUserLimit"
            isLabel={true}
            error={errors?.perUserLimit}
            touched={touched?.perUserLimit}
            className="col-span-2 w-full rounded border-[1px] border-[#ddd] px-[1rem] py-[8px] text-[11px] focus:outline-none"
          />
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

export default DiscountForm;
