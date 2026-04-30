// hooks
import { useRef, useState, useEffect } from "react";

// components
import ButtonComponent from "@common/ButtonComponent";
import InputTextComponent from "@common/InputTextComponent";
import DropdownComponent from "@common/DropdownComponent";
import { CheckboxComponent } from "@common/CheckboxComponent";
import { allApiWithHeaderToken } from "@api/api";
import AdminPanelLoader from '@common/AdminPanelLoader';
import FileUpload from "@common/FileUpload";
import AutocompleteComponent from "@common/Autocomplete";
import { ROUTES_CONSTANTS } from "@constants/routesurl";
import { API_CONSTANTS } from "@constants/apiurl";

// external libraries
import * as yup from "yup";
import { useFormik } from "formik";
import { Toast } from "primereact/toast";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

// Indian states list
const indianStates = [
    { name: "Andhra Pradesh" }, { name: "Arunachal Pradesh" }, { name: "Assam" }, { name: "Bihar" },
    { name: "Chhattisgarh" }, { name: "Goa" }, { name: "Gujarat" }, { name: "Haryana" },
    { name: "Himachal Pradesh" }, { name: "Jharkhand" }, { name: "Karnataka" }, { name: "Kerala" },
    { name: "Madhya Pradesh" }, { name: "Maharashtra" }, { name: "Manipur" }, { name: "Meghalaya" },
    { name: "Mizoram" }, { name: "Nagaland" }, { name: "Odisha" }, { name: "Punjab" },
    { name: "Rajasthan" }, { name: "Sikkim" }, { name: "Tamil Nadu" }, { name: "Telangana" },
    { name: "Tripura" }, { name: "Uttar Pradesh" }, { name: "Uttarakhand" }, { name: "West Bengal" },
    { name: "Delhi" }, { name: "Jammu and Kashmir" }, { name: "Ladakh" }, { name: "Puducherry" },
    { name: "Chandigarh" }, { name: "Andaman and Nicobar Islands" }, { name: "Dadra and Nagar Haveli and Daman and Diu" }, { name: "Lakshadweep" }
];

// Indian cities (major cities)
const indianCities = [
    { name: "Mumbai" }, { name: "Delhi" }, { name: "Bangalore" }, { name: "Hyderabad" },
    { name: "Ahmedabad" }, { name: "Chennai" }, { name: "Kolkata" }, { name: "Surat" },
    { name: "Pune" }, { name: "Jaipur" }, { name: "Lucknow" }, { name: "Kanpur" },
    { name: "Nagpur" }, { name: "Indore" }, { name: "Thane" }, { name: "Bhopal" },
    { name: "Visakhapatnam" }, { name: "Pimpri-Chinchwad" }, { name: "Patna" }, { name: "Vadodara" },
    { name: "Ghaziabad" }, { name: "Ludhiana" }, { name: "Agra" }, { name: "Nashik" },
    { name: "Faridabad" }, { name: "Meerut" }, { name: "Rajkot" }, { name: "Kalyan-Dombivali" },
    { name: "Vasai-Virar" }, { name: "Varanasi" }, { name: "Srinagar" }, { name: "Aurangabad" },
    { name: "Dhanbad" }, { name: "Amritsar" }, { name: "Navi Mumbai" }, { name: "Allahabad" },
    { name: "Ranchi" }, { name: "Howrah" }, { name: "Coimbatore" }, { name: "Jabalpur" },
    { name: "Gwalior" }, { name: "Vijayawada" }, { name: "Jodhpur" }, { name: "Madurai" },
    { name: "Raipur" }, { name: "Kota" }
];

const countries = [{ name: "India" }];

const initialValues = {
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
    gender: "",
    image: "",
    flatLandmark: "",
    city: "",
    zipCode: "",
    state: "",
    country: "India",
    addressId: "",
    is_active: false,
    role: { id: 2, name: "Customer" },
    latitude: 20.5937,
    longitude: 78.9629
};

const UserForm = () => {
    const toast = useRef(null);
    const { t } = useTranslation("msg");
    const [toastType, setToastType] = useState('');
    const [loader, setLoader] = useState(false);
    const [data, setData] = useState(initialValues);
    const navigate = useNavigate();
    const { id } = useParams();

    const validationSchema = yup.object().shape({
        name: yup.string().required(t("name_is_required")),
        phoneNumber: yup.string()
            .required(t("phone_number_is_required"))
            .matches(/^[0-9]{10}$/, "Phone number must be exactly 10 digits")
            .length(10, "Phone number must be exactly 10 digits"),
        email: yup.string()
            .email(t("please_enter_valid_email"))
            .required(t("email_is_required")),
        // Address fields are required for customers
        flatLandmark: yup.string().required(t("flat_landmark_is_required")),
        city: yup.string().required(t("city_is_required")),
        state: yup.string().required(t("state_is_required")),
        zipCode: yup.string().required(t("zip_code_is_required"))
    });

    const onHandleSubmit = (value) => {
        if (id) {
          // Update Customer
          updateCustomer(value);
        } else {
          // Create Customer
          createCustomer(value);
        }
    };

    const createCustomer = (value) => {
        let body = {
                email: value?.email,
                name: value?.name,
                role_id: value?.role?.id || 2,
                image: value?.image,
                gender: value?.gender,
                is_phone_verified: 1,
                phone_number: value?.phoneNumber,
                is_active: false
        };

        // Add address for customers
        body.addresses_attributes = [
            {
                landmark: value?.flatLandmark,
                city: value?.city,
                zip_code: value?.zipCode,
                state: value?.state,
                country: value?.country,
            }
        ];

        setLoader(true);
        allApiWithHeaderToken(API_CONSTANTS.COMMON_CUSTOMERS_URL, body, "post", 'multipart/form-data')
        .then((response) => {
            if (response?.status === 200 || response?.status === 201) {
                setToastType('success');
                toast.current.show({
                    severity: "success",
                    summary: t("success"),
                    detail: response?.data?.message || "Customer has been successfully created and email sent with login credentials",
                    life: 3000
                });
                setTimeout(() => {
                    navigate(ROUTES_CONSTANTS.CUSTOMERS);
                }, 3000);
            }
        })
        .catch((err) => {
            toast.current.show({
                severity: "error",
                summary: t("error"),
                detail: err?.response?.data?.errors || err?.response?.data?.message || "Failed to create customer",
                life: 3000,
            });
        }).finally(() => {
            setLoader(false);
        });
    };

    const updateCustomer = (value) => {
        setLoader(true);
        let body = {
            email: value?.email,
            name: value?.name,
            role_id: value?.role?.id || 2,
            gender: value?.gender,
            is_phone_verified: 1,
            phone_number: value?.phoneNumber,
            is_active: value?.is_active
        };

        // Only add image if it's a new file upload
        if(value?.image && value?.image instanceof File){
          body['image'] = value?.image
        }

        // Add address for customers
        body.addresses_attributes = [
            {
                id: value?.addressId,
                landmark: value?.flatLandmark,
                city: value?.city,
                zip_code: value?.zipCode,
                state: value?.state,
                country: value?.country,
            }
        ];

        allApiWithHeaderToken(`${API_CONSTANTS.COMMON_CUSTOMERS_URL}/${id}`, body, "put", 'multipart/form-data' )
          .then((response) => {
            if (response.status === 200) {
              toast.current.show({
                severity: "success",
                summary: t("success"),
                detail: response?.data?.message || "Customer has been successfully updated",
                life: 3000
              });
              setTimeout(() => {
                navigate(ROUTES_CONSTANTS.CUSTOMERS);
              }, 3000);
            }
          })
          .catch((err) => {
            toast.current.show({
                severity: "error",
                summary: "Error",
                detail: err?.response?.data?.errors || err?.response?.data?.message || "Failed to update customer",
                life: 3000,
            });
          })
          .finally(() => {
            setLoader(false);
          });
      };

    const toastHandler = () => {
        if (toastType === 'success') {
            navigate(ROUTES_CONSTANTS.CUSTOMERS);
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
        navigate(ROUTES_CONSTANTS.CUSTOMERS);
    };

    const fetchCustomerData = async () => {
        if(id){
              allApiWithHeaderToken(`${API_CONSTANTS.COMMON_CUSTOMERS_URL}/${id}`, "", "get")
              .then((response) => {
                if (response.status === 200) {
                    let data = {
                        name: response?.data?.name,
                        gender: response?.data?.gender,
                        image_url: response?.data?.image_url,
                        phoneNumber: response?.data?.phone_number,
                        email: response?.data?.email,
                        addressId: response?.data?.addresses?.[0]?.id || "",
                        flatLandmark: response?.data?.addresses?.[0]?.landmark || "",
                        city: response?.data?.addresses?.[0]?.city || "",
                        zipCode: response?.data?.addresses?.[0]?.zip_code || "",
                        state: response?.data?.addresses?.[0]?.state || "",
                        country: response?.data?.addresses?.[0]?.country || "",
                        is_active: response?.data?.is_active,
                        role: response?.data?.role_id ? {
                            id: response?.data?.role_id,
                            name: "Customer"
                        } : null
                    };
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
    };

    useEffect(()=>{
        fetchCustomerData();
     },[id]);

    const { values, errors, handleSubmit, setFieldValue, handleChange, touched } = formik;
    
    return (
        <div className="flex h-screen text-TextPrimaryColor bg-BgPrimaryColor py-5 overflow-y-scroll">
            {loader && <AdminPanelLoader/>}
            <Toast ref={toast} position="top-right" style={{ scale: '0.7' }} onHide={toastHandler} />
            <div className="mx-16 my-auto grid h-fit w-full grid-cols-4 gap-4 bg-BgSecondaryColor p-8 border rounded border-BorderColor">
                <div className="col-span-4 font-[600]">
                    {id ? t("update_customer") : t("create_customer")}
                </div>
                <div className="col-span-4">
                    <FileUpload 
                        value={values?.image_url}
                        name="image"
                        isProfile={true}
                        isLabel={t("profile_image")} 
                        onChange={(e)=> {
                        setFieldValue('image', e?.currentTarget?.files[0]);
                        setFieldValue('image_url', URL.createObjectURL(e?.target?.files[0]));
                        }}
                    />    
                    <label htmlFor="file" className="error text-red-500">{errors?.file}</label>
                </div>
                <div className="col-span-4 md:col-span-2">
                    <InputTextComponent
                        value={values?.name}
                        onChange={handleChange}
                        type="text"
                        isLabel={true}
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
                        isLabel={true}
                        placeholder={t("email")}
                        name="email"
                        error={errors?.email}
                        touched={touched?.email}
                        className="w-full rounded border-[1px] border-[#ddd] px-[1rem] py-[8px] text-[11px] focus:outline-none"
                    />
                </div>

                <div className="col-span-4 md:col-span-2">
                    <InputTextComponent
                        value={values?.phoneNumber}
                        onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
                            if (value.length <= 10) {
                                setFieldValue('phoneNumber', value);
                            }
                        }}
                        type="text"
                        isLabel={true}
                        placeholder={t("phone_number")}
                        name="phoneNumber"
                        error={errors?.phoneNumber}
                        touched={touched?.phoneNumber}
                        className="w-full rounded border-[1px] border-[#ddd] px-[1rem] py-[8px] text-[11px] focus:outline-none"
                        maxLength={10}
                    />
                </div>
               
                {/* Address fields */}
                <div className="col-span-4 md:col-span-1">
                    <InputTextComponent
                        value={values?.flatLandmark}
                        onChange={handleChange}
                        type="text"
                        placeholder={t("flat_no_landmark")}
                        name="flatLandmark"
                        isLabel={true}
                        error={errors?.flatLandmark}
                        touched={touched?.flatLandmark}
                        className="col-span-2 w-full rounded border-[1px] border-[#ddd] px-[1rem] py-[8px] text-[11px] focus:outline-none"
                    />
                </div>
                <div className="col-span-4 md:col-span-1">
                    <InputTextComponent
                        value={values?.city}
                        onChange={handleChange}
                        type="text"
                        placeholder={t("city")}
                        name="city"
                        isLabel={true}
                        error={errors?.city}
                        touched={touched?.city}
                        className="col-span-2 w-full rounded border-[1px] border-[#ddd] px-[1rem] py-[8px] text-[11px] focus:outline-none"
                    />
                </div>
                <div className="col-span-4 md:col-span-1">
                    <InputTextComponent
                        value={values?.zipCode}
                        onChange={handleChange}
                        type="text"
                        placeholder={t("pincode")}
                        name="zipCode"
                        isLabel={true}
                        error={errors?.zipCode}
                        touched={touched?.zipCode}
                        className="col-span-2 w-full rounded border-[1px] border-[#ddd] px-[1rem] py-[8px] text-[11px] focus:outline-none"
                    />
                </div>
                <div className="col-span-4 md:col-span-1">
                    <AutocompleteComponent
                        value={values?.state}
                        onChange={(field, value) => setFieldValue("state", value?.name || value)}
                        data={indianStates}
                        name="state"
                        label={t("state")}
                        placeholder={t("state")}
                        dropdown={true}
                        error={errors?.state}
                        touched={touched?.state}
                    />
                </div>
                <div className="col-span-4 md:col-span-1">
                    <AutocompleteComponent
                        value={values?.country}
                        onChange={(field, value) => setFieldValue("country", value?.name || value)}
                        data={countries}
                        name="country"
                        label={t("country")}
                        placeholder={t("country")}
                        dropdown={true}
                        error={errors?.country}
                        touched={touched?.country}
                    />
                </div>
                {id && (
                    <div className="col-span-4 md:col-span-2">
                        <div className="flex items-center gap-3 pt-7">
                            <CheckboxComponent
                                checked={values?.is_active}
                                onChange={() => setFieldValue('is_active', !values?.is_active)}
                            />
                            <span className="text-[12px] font-[600]">
                                {t("customer_is_active")}
                            </span>
                        </div>
                    </div>
                )}
                <div className="col-span-3"></div>
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
    )
}

export default UserForm
