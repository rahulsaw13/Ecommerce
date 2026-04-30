// components
import ButtonComponent from "@common/ButtonComponent";
import InputTextComponent from "@common/InputTextComponent";
import { API_CONSTANTS } from "@constants/apiurl";
import { ROUTES_CONSTANTS } from "@constants/routesurl";
import { allApiWithHeaderToken } from "@api/api";
import DropdownComponent from "@common/DropdownComponent";
import AdminPanelLoader from '@common/AdminPanelLoader';
import InputTextAreaComponent from "@common/InputTextAreaComponent";

// external libraries
import * as yup from "yup";
import { useFormik } from "formik";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Toast } from "primereact/toast";
import React, { useEffect, useRef, useState } from "react";

const masterTypeList = [
  { name: "Weight", value: "weight"},
  { name: "Section Type", value: "section_type"}
];

const statusList = [
  { name: "Active", value: true},
  { name: "Inactive", value: false}
];

const initialValues = {
  name: "",
  master_type: "",
  value: "",
  display_order: 0,
  is_active: true,
  description: "",
  metadata: {}
};

const MastersForm = () => {
  const { t } = useTranslation("msg");
  const navigate = useNavigate();
  const { id } = useParams();
  const toast = useRef(null);
  
  const [loader, setLoader] = useState(false);
  const [data, setData] = useState(initialValues);

  const validationSchema = yup.object().shape({
    name: yup.string().required("Name is required").max(100, "Name must be less than 100 characters"),
    master_type: yup.string().required("Master type is required"),
    value: yup.string().required("Value is required").max(100, "Value must be less than 100 characters"),
    display_order: yup.number()
      .transform((value, originalValue) => {
        return originalValue === "" ? undefined : Number(originalValue);
      })
      .when('master_type', {
        is: (master_type) => master_type !== 'weight',
        then: (schema) => schema.required("Display order is required"),
        otherwise: (schema) => schema.notRequired()
      })
      .min(0, "Display order must be 0 or greater")
      .integer("Display order must be a whole number")
  });

  const onHandleSubmit = (values) => {
    if (id) {
      // Update Master
      updateMaster(values);
    } else {
      // Create Master
      createMaster(values);
    }
  };

  const createMaster = (values) => {
    let data = {
      master: {
        name: values.name,
        master_type: values.master_type,
        value: values.value,
        display_order: values.master_type === 'weight' ? 0 : values.display_order,
        is_active: values.is_active,
        description: values.master_type === 'weight' ? '' : (values.description || ''),
        metadata: values.metadata || {}
      }
    };
    
    setLoader(true);
    allApiWithHeaderToken(API_CONSTANTS.MASTERS.CREATE, data, "post")
      .then((response) => {
        if (response.status === 201) {
          toast.current?.show({
            severity: 'success',
            summary: 'Success',
            detail: response.data.message || 'Master created successfully',
            life: 3000
          });
          navigate(ROUTES_CONSTANTS.ADMIN_MASTERS);
        }
      })
      .catch((err) => {
        toast.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: err?.response?.data?.errors?.join(', ') || 'Failed to create master',
          life: 3000
        });
        setLoader(false);
      })
      .finally(() => {
        setLoader(false);
      });
  };

  const updateMaster = (values) => {
    setLoader(true);
    let data = {
      master: {
        name: values.name,
        master_type: values.master_type,
        value: values.value,
        display_order: values.master_type === 'weight' ? 0 : values.display_order,
        is_active: values.is_active,
        description: values.master_type === 'weight' ? '' : (values.description || ''),
        metadata: values.metadata || {}
      }
    };

    allApiWithHeaderToken(API_CONSTANTS.MASTERS.UPDATE.replace(':id', id), data, "put")
      .then((response) => {
        if (response.status === 200) {
          toast.current?.show({
            severity: 'success',
            summary: 'Success',
            detail: response.data.message || 'Master updated successfully',
            life: 3000
          });
          navigate(ROUTES_CONSTANTS.ADMIN_MASTERS);
        }
      })
      .catch((err) => {
        toast.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: err?.response?.data?.errors?.join(', ') || 'Failed to update master',
          life: 3000
        });
        setLoader(false);
      })
      .finally(() => {
        setLoader(false);
      });
  };

  useEffect(() => {
    if (id) {
      setLoader(true);
      allApiWithHeaderToken(`${API_CONSTANTS.COMMON_MASTERS_URL}/${id}`, "", "get")
        .then((response) => {
          if (response.status === 200) {
            let data = {
              name: response?.data?.data?.attributes?.name || '',
              master_type: response?.data?.data?.attributes?.master_type || '',
              value: response?.data?.data?.attributes?.value || '',
              display_order: response?.data?.data?.attributes?.display_order || 0,
              is_active: response?.data?.data?.attributes?.is_active !== undefined ? response?.data?.data?.attributes?.is_active : true,
              description: response?.data?.data?.attributes?.description || '',
              metadata: response?.data?.data?.attributes?.metadata || {}
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
    navigate(ROUTES_CONSTANTS.ADMIN_MASTERS);
  };

  const formik = useFormik({
    initialValues: data,
    onSubmit: onHandleSubmit,
    validationSchema: validationSchema,
    enableReinitialize: true,
    validateOnBlur: true,
  });

  const { values, errors, setFieldValue, handleSubmit, handleChange, touched, isValid } = formik;

  // Debug validation errors
  React.useEffect(() => {
    if (Object.keys(errors).length > 0) {
    }
  }, [errors]);


  return (
    <div className="flex h-screen bg-BgPrimaryColor text-TextPrimaryColor py-5 overflow-y-scroll">
      {loader && <AdminPanelLoader/>}
      <Toast ref={toast} position="top-right" style={{scale: '0.7'}} />
      <form onSubmit={handleSubmit} className="mx-16 my-auto grid h-fit w-full grid-cols-4 gap-4 bg-BgSecondaryColor p-8 border rounded border-BorderColor">
        <div className="col-span-4 font-[600]">
            {id ? "Update Master" : "Create Master"}
        </div>
        
        {/* Name */}
        <div className="col-span-2">
          <InputTextComponent
            value={values?.name}
            onChange={handleChange}
            type="text"
            placeholder="Master Name"
            name="name"
            isLabel={true}
            error={errors?.name}
            touched={touched?.name}
            className="col-span-2 w-full rounded border-[1px] border-[#ddd] px-[1rem] py-[8px] text-[11px] focus:outline-none"
          />
        </div>
        
        {/* Master Type */}
        <div className="col-span-2">
          <DropdownComponent
            value={values?.master_type}
            onChange={(field, value) => setFieldValue(field, value)}
            data={masterTypeList}
            name="master_type"
            placeholder="Select Master Type"
            className="custom-dropdown col-span-2 w-full rounded border-[1px] border-[#ddd] focus:outline-none"
            optionLabel="name"
            error={errors?.master_type}
            touched={touched?.master_type}
          />
        </div>
        
        {/* Value */}
        <div className="col-span-2">
          <InputTextComponent
            value={values?.value}
            onChange={handleChange}
            type="text"
            placeholder="Master Value (e.g., 100g, discount, active)"
            name="value"
            isLabel={true}
            error={errors?.value}
            touched={touched?.value}
            className="col-span-2 w-full rounded border-[1px] border-[#ddd] px-[1rem] py-[8px] text-[11px] focus:outline-none"
          />
        </div>
        
        {/* Display Order - Hidden for weight type */}
        {values?.master_type !== 'weight' && (
          <div className="col-span-2">
            <InputTextComponent
              value={values?.display_order}
              onChange={handleChange}
              type="number"
              placeholder="Display Order (0 = first)"
              name="display_order"
              isLabel={true}
              error={errors?.display_order}
              touched={touched?.display_order}
              className="col-span-2 w-full rounded border-[1px] border-[#ddd] px-[1rem] py-[8px] text-[11px] focus:outline-none"
            />
          </div>
        )}
        
        {/* Description - Hidden for weight type */}
        {values?.master_type !== 'weight' && (
          <div className="col-span-4">
            <InputTextAreaComponent
              value={values?.description}
              onChange={handleChange}
              placeholder="Master Description (Optional)"
              name="description"
              isLabel={true}
              error={errors?.description}
              touched={touched?.description}
              className="col-span-4 w-full rounded border-[1px] border-[#ddd] px-[1rem] py-[8px] text-[11px] focus:outline-none"
              rows={3}
            />
          </div>
        )}
        
        
        {/* Status */}
        {id && (
          <div className="col-span-2">
            <DropdownComponent
              value={values?.is_active}
              onChange={(field, value) => setFieldValue(field, value)}
              data={statusList}
              name="is_active"
              placeholder="Status"
              className="custom-dropdown col-span-2 w-full rounded border-[1px] border-[#ddd] focus:outline-none"
              optionLabel="name"
            />
          </div>
        )}
        
        <div className="col-span-3"></div>
        <div className="mt-4 flex justify-end gap-4">
          <ButtonComponent
            onClick={() => handleBack()}
            type="button"
            label="Back"
            className="rounded bg-TextPrimaryColor px-6 py-2 text-[12px] text-white"
          />
          <ButtonComponent
            type="submit"
            onClick={() => handleSubmit()}
            label={id ? "Update" : "Submit"}
            className="rounded bg-TextPrimaryColor px-6 py-2 text-[12px] text-white"
          />
        </div>
      </form>
    </div>
  );
};

export default MastersForm;
