// hooks
import { useRef, useState } from "react";

// components
import ButtonComponent from "@common/ButtonComponent";
import InputTextComponent from "@common/InputTextComponent";
import { allApi } from "@api/api";

// external libraries
import * as yup from "yup";
import { useFormik } from "formik";
import { Toast } from "primereact/toast";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Dialog } from 'primereact/dialog';

const data = {
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
};

const UserFormModal = ({ header, visible, width, onHide, draggable }) => {
    const toast = useRef(null);
    const { t } = useTranslation("msg");
    const [toastType, setToastType] = useState('');
    const [loader, setLoader] = useState(false);
    const navigate = useNavigate();  

    const validationSchema = yup.object().shape({
        name: yup.string().required(t("name_is_required")),
        email: yup
            .string()
            .email(t("please_enter_valid_email"))
            .required(t("email_is_required")),
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
                email: value?.email,
                password: value?.password,
                first_name: value?.firstname,
                last_name: value?.lastname,
            }
        };
        setLoader(true);
        await allApi("users", body, "post")
            .then((response) => {
                if (response?.status === 200) {
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
                    summary: t("error"),
                    detail: err?.response?.data?.errors,
                    life: 3000,
                });
            }).finally(() => {
                setLoader(false);
            });;
    };

    const toastHandler = () => {
        if (toastType === 'success') {
            navigate('/');
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
        <Dialog
            header={header}
            visible={visible}
            style={{ width: width }}
            onHide={onHide}
            draggable={draggable}
        >
            <div>
                <Toast ref={toast} position="top-right" style={{ scale: '0.7' }} onHide={toastHandler} />
                <div className="my-auto grid h-fit w-full grid-cols-4 gap-4 bg-BgSecondaryColor p-8 border rounded border-BorderColor">
                    <div className="col-span-4 md:col-span-2">
                        <InputTextComponent
                            value={values?.name}
                            onChange={handleChange}
                            type="text"
                            placeholder={t("name")}
                            name="name"
                            error={errors?.name}
                            touched={touched?.name}
                            className="w-full rounded border-[1px] border-[#ddd] px-[1rem] py-[8px] text-[11px] focus:outline-none"
                        />
                    </div>
                    <div className="col-span-4 md:col-span-2">
                        <InputTextComponent
                            value={values?.email}
                            onChange={handleChange}
                            type="email"
                            placeholder={t("email")}
                            name="email"
                            error={errors?.email}
                            touched={touched?.email}
                            className="w-full rounded border-[1px] border-[#ddd] px-[1rem] py-[8px] text-[11px] focus:outline-none"
                        />
                    </div>
                    <div className="col-span-4 md:col-span-2">
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
                    <div className="col-span-4 md:col-span-2">
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
                    <div className="col-span-4 md:col-span-4">
                        <div className="mt-4 float-right">
                            <ButtonComponent
                                onClick={() => handleSubmit()}
                                type="submit"
                                label={t("submit")}
                                className="rounded bg-TextPrimaryColor px-6 py-2 text-[12px] text-white"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </Dialog>
    )
}

export default UserFormModal
