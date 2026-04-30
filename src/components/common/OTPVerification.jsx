// components
import ButtonComponent from "@common/ButtonComponent";
import InputTextComponent from "@common/InputTextComponent";
import { allApi } from "@api/api";
import { API_CONSTANTS } from "@constants/apiurl";

// external libraries
import * as yup from "yup";
import { useFormik } from "formik";
import { useTranslation } from "react-i18next";
import { useState, useRef, useEffect } from "react";
import { Toast } from "primereact/toast";

const OTPVerification = ({ email, onVerificationSuccess, onResendOTP }) => {
    const { t } = useTranslation();
    const [loader, setLoader] = useState(false);
    const [timeLeft, setTimeLeft] = useState(30);
    const [isExpired, setIsExpired] = useState(false);
    const toast = useRef(null);

    // Countdown timer effect
    useEffect(() => {
        if (timeLeft > 0) {
            const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            setIsExpired(true);
        }
    }, [timeLeft]);

    const validationSchema = yup.object().shape({
        otp: yup
            .string()
            .length(6, t("otp_must_be_6_digits"))
            .required(t("otp_is_required")),
    });

    const formik = useFormik({
        initialValues: { otp: "" },
        validationSchema: validationSchema,
        onSubmit: handleVerifyOTP,
    });

    function handleVerifyOTP(values) {
        setLoader(true);
        const body = {
            email: email,
            otp: values.otp
        };

        allApi(API_CONSTANTS.VERIFY_LOGIN_OTP_URL, body, "post")
            .then((response) => {
                if (response.status === 200) {
                    toast.current.show({
                        severity: "success",
                        summary: t("success"),
                        detail: response.data.message,
                        life: 3000,
                    });
                    onVerificationSuccess(response.data);
                }
            })
            .catch((err) => {
                toast.current.show({
                    severity: "error",
                    summary: "Error",
                    detail: err?.response?.data?.error || "OTP verification failed",
                    life: 3000,
                });
            })
            .finally(() => {
                setLoader(false);
            });
    }

    const handleResendOTP = () => {
        setLoader(true);
        onResendOTP()
            .then(() => {
                setTimeLeft(30);
                setIsExpired(false);
            })
            .finally(() => {
                setLoader(false);
            });
    };

    const { values, errors, handleSubmit, handleChange, touched } = formik;

    return (
        <div className="flex min-h-screen items-center justify-center bg-BgPrimaryColor">
            <Toast ref={toast} position="top-right" style={{ scale: '0.7' }} />
            <div className="w-full max-w-md space-y-6 rounded-lg bg-BgSecondaryColor p-8 shadow-lg border border-BorderColor">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-TextPrimaryColor">
                        {t("verify_otp")}
                    </h2>
                    <p className="mt-2 text-sm text-TextSecondaryColor">
                        {t("otp_sent_to")} {email}
                    </p>
                    <p className={`mt-1 text-xs font-semibold ${
                        isExpired ? 'text-red-600' : timeLeft <= 10 ? 'text-orange-600' : 'text-green-600'
                    }`}>
                        {isExpired ? t("otp_expired") : `${t("expires_in")} ${timeLeft}s`}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <InputTextComponent
                            value={values.otp}
                            onChange={handleChange}
                            type="text"
                            placeholder={t("enter_6_digit_otp")}
                            name="otp"
                            isLabel={true}
                            error={errors.otp}
                            touched={touched.otp}
                            className="w-full rounded border-[1px] border-[#ddd] px-[1rem] py-[8px] text-center text-lg tracking-widest focus:outline-none"
                            maxLength={6}
                        />
                    </div>

                    <div className="flex flex-col space-y-3">
                        <ButtonComponent
                            onClick={handleSubmit}
                            type="submit"
                            label={loader ? t("verifying") : t("verify_otp")}
                            disabled={loader || isExpired}
                            className="w-full rounded bg-TextPrimaryColor px-6 py-3 text-white hover:bg-opacity-90 disabled:opacity-50"
                        />

                        <ButtonComponent
                            onClick={handleResendOTP}
                            type="button"
                            label={loader ? t("sending") : t("resend_otp")}
                            disabled={loader}
                            className="w-full rounded border border-TextPrimaryColor bg-transparent px-6 py-3 text-TextPrimaryColor hover:bg-TextPrimaryColor hover:text-white disabled:opacity-50"
                        />
                    </div>
                </form>

                <div className="text-center">
                    <p className="text-xs text-TextSecondaryColor">
                        {isExpired ? t("otp_has_expired_resend") : t("otp_expires_in_30_seconds")}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default OTPVerification;
