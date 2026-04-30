// components
import ButtonComponent from "@common/ButtonComponent";
import InputTextComponent from "@common/InputTextComponent";
import { API_CONSTANTS } from "@constants/apiurl";
import { ROUTES_CONSTANTS } from "@constants/routesurl";
import { allApiWithHeaderToken } from "@api/api";
import AdminPanelLoader from '@common/AdminPanelLoader';
import { applyThemeColor } from '@utils/themeUtils';

// external libraries
import * as yup from "yup";
import { useFormik } from "formik";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Toast } from "primereact/toast";
import React, { useEffect, useRef, useState } from "react";

const initialValues = {
  key: "",
  value: "",
  description: "",
  setting_type: "string",
};

const SettingsForm = () => {
  const { t } = useTranslation("msg");
  const navigate = useNavigate();
  const { id } = useParams();
  const toast = useRef(null);

  const [loader, setLoader] = useState(false);
  const [data, setData] = useState(initialValues);

  const validationSchema = yup.object().shape({
    value: yup.string().required("Value is required"),
  });

  const onHandleSubmit = (values) => {
    updateSetting(values);
  };

  const updateSetting = (values) => {
    setLoader(true);
    let body = {
      setting: {
        value: values.value,
        description: values.description || data.description,
        setting_type: values.setting_type || data.setting_type,
      }
    };

    allApiWithHeaderToken(`${API_CONSTANTS.COMMON_SETTINGS_URL}/${id}`, body, "put")
      .then((response) => {
        if (response.status === 200) {
          toast.current?.show({
            severity: 'success',
            summary: 'Success',
            detail: response.data.message || 'Setting updated successfully',
            life: 3000
          });

          // Apply theme colors if they are theme color settings
          if (data.key === 'admin_theme_color' || data.key === 'user_theme_color') {
            applyThemeColor(data.key, values.value);
          }

          navigate(ROUTES_CONSTANTS.SETTINGS);
        }
      })
      .catch((err) => {
        toast.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: err?.response?.data?.errors?.join(', ') || 'Failed to update setting',
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
      allApiWithHeaderToken(`${API_CONSTANTS.COMMON_SETTINGS_URL}/${id}`, "", "get")
        .then((response) => {
          if (response.status === 200) {
            const attrs = response?.data?.data?.attributes || {};
            let settingData = {
              key: attrs.key || '',
              value: attrs.value || '',
              description: attrs.description || '',
              setting_type: attrs.setting_type || 'string',
            };
            setData(settingData);

            // Apply theme color if it's a theme color setting
            if (settingData.key === 'admin_theme_color' || settingData.key === 'user_theme_color') {
              applyThemeColor(settingData.key, settingData.value);
            }
          }
        })
        .catch((err) => {
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail: err?.response?.data?.errors || "Failed to fetch setting",
            life: 3000,
          });
          setLoader(false);
        })
        .finally(() => {
          setLoader(false);
        });
    }
  }, [id]);

  const handleBack = () => {
    navigate(ROUTES_CONSTANTS.SETTINGS);
  };

  const formik = useFormik({
    initialValues: data,
    onSubmit: onHandleSubmit,
    validationSchema: validationSchema,
    enableReinitialize: true,
    validateOnBlur: true,
  });

  const { values, errors, setFieldValue, handleSubmit, handleChange, touched } = formik;

  return (
    <div className="flex h-screen bg-BgPrimaryColor text-TextPrimaryColor py-5 overflow-y-scroll">
      <Toast ref={toast} position="top-right" style={{ scale: '0.7' }} />
      <form onSubmit={handleSubmit} className="mx-16 my-auto grid h-fit w-full grid-cols-4 gap-4 bg-BgSecondaryColor p-8 border rounded border-BorderColor">
        <div className="col-span-4 font-[600]">
          Update Setting: {data.key?.replace(/_/g, ' ').toUpperCase()}
        </div>

        {/* Setting Key (Read-only) */}
        <div className="col-span-2">
          <label className="block text-sm font-medium mb-1">Setting Key</label>
          <input
            type="text"
            value={data.key?.replace(/_/g, ' ').toUpperCase() || ''}
            disabled
            className="w-full rounded border-[1px] border-[#ddd] px-[1rem] py-[8px] text-[11px] bg-gray-100 text-gray-600 cursor-not-allowed"
          />
        </div>

        {/* Setting Type (Read-only) */}
        <div className="col-span-2">
          <label className="block text-sm font-medium mb-1">Setting Type</label>
          <input
            type="text"
            value={data.setting_type?.toUpperCase() || ''}
            disabled
            className="w-full rounded border-[1px] border-[#ddd] px-[1rem] py-[8px] text-[11px] bg-gray-100 text-gray-600 cursor-not-allowed"
          />
        </div>

        {/* Value */}
        <div className="col-span-4">
          <label className="block text-sm font-medium mb-1">Value {data.setting_type === 'color' && '(Color)'}</label>
          {data.setting_type === 'color' ? (
            <div className="flex items-center gap-4">
              <input
                type="color"
                value={values.value || '#b69754'}
                onChange={(e) => setFieldValue('value', e.target.value)}
                className="w-20 h-10 rounded border border-gray-300 cursor-pointer"
              />
              <InputTextComponent
                value={values.value}
                onChange={handleChange}
                type="text"
                placeholder="#b69754"
                name="value"
                error={errors?.value}
                touched={touched?.value}
                className="flex-1 rounded border-[1px] border-[#ddd] px-[1rem] py-[8px] text-[11px] focus:outline-none"
              />
            </div>
          ) : (
            <InputTextComponent
              value={values.value}
              onChange={handleChange}
              type="text"
              placeholder="Enter value"
              name="value"
              isLabel={false}
              error={errors?.value}
              touched={touched?.value}
              className="col-span-4 w-full rounded border-[1px] border-[#ddd] px-[1rem] py-[8px] text-[11px] focus:outline-none"
            />
          )}
          {data.setting_type === 'color' && values.value && (
            <div className="mt-2 flex items-center gap-2">
              <div
                className="w-12 h-12 rounded border border-gray-300"
                style={{ backgroundColor: values.value }}
              />
              <span className="text-sm text-gray-600">Preview</span>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="col-span-4">
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            value={values.description || ''}
            onChange={handleChange}
            name="description"
            placeholder="Enter description"
            rows={3}
            className="w-full rounded border-[1px] border-[#ddd] px-[1rem] py-[8px] text-[11px] focus:outline-none"
          />
        </div>

        {/* Buttons */}
        <div className="col-span-4 flex justify-end gap-4 mt-4">
          <ButtonComponent
            onClick={handleBack}
            type="button"
            label="Cancel"
            className="rounded bg-gray-500 px-6 py-2 text-[12px] text-white hover:bg-gray-600"
          />
          <ButtonComponent
            type="submit"
            label="Update Setting"
            className="rounded bg-TextPrimaryColor px-6 py-2 text-[12px] text-white"
          />
        </div>
      </form>
    </div>
  );
};

export default SettingsForm;

