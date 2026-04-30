// hooks
import { useRef, useState, useEffect } from "react";

// components
import ButtonComponent from "@common/ButtonComponent";
import InputTextComponent from "@common/InputTextComponent";
import { allApiWithHeaderToken } from "@api/api";
import AdminPanelLoader from '@common/AdminPanelLoader';
import { ROUTES_CONSTANTS } from "@constants/routesurl";
import { API_CONSTANTS } from "@constants/apiurl";

// external libraries
import * as yup from "yup";
import { useFormik } from "formik";
import { Toast } from "primereact/toast";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

const initialValues = {
    discount_category_name: "",
    discount_percent: ""
};

const DiscountCategoryForm = () => {
    const toast = useRef(null);
    const { t } = useTranslation("msg");
    const [toastType, setToastType] = useState('');
    const [loader, setLoader] = useState(false);
    const [data, setData] = useState(initialValues);
    const navigate = useNavigate();  
    const { id } = useParams();

    const validationSchema = yup.object().shape({
        discount_category_name: yup.string().required(t("discount_category_name_is_required")),
        discount_percent: yup.number()
            .required(t("discount_percent_is_required"))
            .min(0, t("discount_percent_must_be_positive"))
            .max(100, t("discount_percent_must_be_less_than_100"))
    });

    useEffect(() => {
        if (id) {
            fetchDiscountCategoryDetails();
        }
    }, [id]);

    const fetchDiscountCategoryDetails = () => {
        setLoader(true);
        allApiWithHeaderToken(`${API_CONSTANTS.COMMON_DISCOUNT_CATEGORIES_URL}/${id}`, {}, "get")
            .then((response) => {
                if (response.status === 200) {
                    const discountCategoryData = response.data;
                    setData({
                        discount_category_name: discountCategoryData.discount_category_name || "",
                        discount_percent: discountCategoryData.discount_percent || ""
                    });
                }
            })
            .catch((err) => {
                toast.current.show({
                    severity: "error",
                    summary: "Error",
                    detail: err?.response?.data?.errors,
                    life: 3000,
                });
            })
            .finally(() => {
                setLoader(false);
            });
    };

    const onHandleSubmit = (value) => {
        if (id) {
            updateDiscountCategory(value);
        } else {
            createDiscountCategory(value);
        }
    };

    const createDiscountCategory = (value) => {
        let body = {
            discount_category_name: value?.discount_category_name,
            discount_percent: value?.discount_percent
        };
        setLoader(true);
        allApiWithHeaderToken(API_CONSTANTS.COMMON_DISCOUNT_CATEGORIES_URL, body, "post")
        .then((response) => {
            if (response?.status === 201) {
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
            toast.current.show({
                severity: "error",
                summary: "Error",
                detail: err?.response?.data?.errors,
                life: 3000,
            });
            setLoader(false);
        }).finally(()=> {
            setLoader(false);
        });
    };

    const updateDiscountCategory = (value) => {
        setLoader(true);
        let body = {
            discount_category_name: value?.discount_category_name,
            discount_percent: value?.discount_percent
        };

        allApiWithHeaderToken(`${API_CONSTANTS.COMMON_DISCOUNT_CATEGORIES_URL}/${id}`, body, "put")
          .then((response) => {
            if (response.status === 200) {
              navigate(ROUTES_CONSTANTS.DISCOUNT_CATEGORIES);
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

    const toastHandler = () => {
        if (toastType === 'success') {
            navigate(ROUTES_CONSTANTS.DISCOUNT_CATEGORIES);
        }
    };

    const formik = useFormik({
        initialValues: data,
        onSubmit: onHandleSubmit,
        validationSchema: validationSchema,
        enableReinitialize: true,
        validateOnBlur: true,
    });

    const handleBack = () => {
        navigate(ROUTES_CONSTANTS.DISCOUNT_CATEGORIES);
    };

    const { values, errors, touched, handleChange, handleBlur, handleSubmit } = formik;

    return (
        <div className="flex h-screen bg-BgPrimaryColor text-TextPrimaryColor py-5 overflow-y-scroll">
            {loader && <AdminPanelLoader/>}
            <Toast ref={toast} position="top-right" style={{ scale: '0.7' }} onHide={toastHandler} />
            <div className="mx-16 my-auto grid h-fit w-full grid-cols-4 gap-4 bg-BgSecondaryColor p-8 border rounded border-BorderColor">
                <div className="col-span-4 font-[600]">
                    {id ? t("update_discount_category") : t("create_discount_category")}
                </div>

                <div className="col-span-4 md:col-span-2">
                    <InputTextComponent
                        value={values?.discount_category_name}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        type="text"
                        isLabel={true}
                        placeholder={t("discount_category_name")}
                        name="discount_category_name"
                        error={errors?.discount_category_name}
                        touched={touched?.discount_category_name}
                        className="w-full rounded border-[1px] border-[#ddd] px-[1rem] py-[8px] text-[11px] focus:outline-none"
                    />
                </div>

                <div className="col-span-4 md:col-span-2">
                    <InputTextComponent
                        value={values?.discount_percent}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        type="number"
                        isLabel={true}
                        placeholder={t("discount_percent")}
                        name="discount_percent"
                        error={errors?.discount_percent}
                        touched={touched?.discount_percent}
                        className="w-full rounded border-[1px] border-[#ddd] px-[1rem] py-[8px] text-[11px] focus:outline-none"
                    />
                </div>

                <div className="col-span-4 flex justify-end gap-4">
                    <ButtonComponent
                        label={t("back")}
                        onClick={handleBack}
                        className="rounded bg-TextPrimaryColor px-6 py-2 text-[12px] text-white"
                    />
                    <ButtonComponent
                        label={id ? t("update") : t("create")}
                        onClick={handleSubmit}
                        className="rounded bg-TextPrimaryColor px-6 py-2 text-[12px] text-white"
                    />
                </div>
            </div>
        </div>
    );
};

export default DiscountCategoryForm;
