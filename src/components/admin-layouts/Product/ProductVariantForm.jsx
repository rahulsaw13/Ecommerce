// components
import ButtonComponent from "@common/ButtonComponent";
import InputTextComponent from "@common/InputTextComponent";
import { API_CONSTANTS } from "@constants/apiurl";
import { ROUTES_CONSTANTS } from "@constants/routesurl";
import { allApiWithHeaderToken } from "@api/api";
import DropdownComponent from "@common/DropdownComponent";
import AdminPanelLoader from '@common/AdminPanelLoader';

// external libraries
import * as yup from "yup";
import { useFormik } from "formik";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Toast } from "primereact/toast";
import { useEffect, useRef, useState } from "react";

const statusList = [
  { name: "Active", value: "1"},
  { name: "Inactive", value: "0"}
];

const initialValues = {
  weight: "",
  mrp: "",
  price: "",
  shelfLife: "",
  status: "1"
};

const ProductVariantForm = () => {
  const toast = useRef(null);
  const { t } = useTranslation("msg");
  const navigate = useNavigate();
  const [loader, setLoader] = useState(false);
  const [data, setData] = useState(initialValues);
  const [weightList, setWeightList] = useState([]);
  const [productName, setProductName] = useState("");
  const { productId, variantId } = useParams();

  const validationSchema = yup.object().shape({
    weight: yup.object()
      .test('non-empty-object', t("weight_is_required"), (value) => {
        return value && Object.keys(value).length > 0;
      }),
    mrp: yup.number().required(t("mrp_is_required")).positive("MRP must be positive"),
    price: yup.number().required(t("price_is_required")).positive("Price must be positive"),
    shelfLife: yup.number().required(t("shelf_life_is_required")).positive("Shelf life must be positive"),
  });

  const onHandleSubmit = (value) => {
    updateVariant(value);
  };

  const updateVariant = (value) => {
    setLoader(true);
    let body = {
      product_variant: {
        weight_master_id: value?.weight?.id,
        weight: value?.weight?.value,
        mrp: value?.mrp,
        price: value?.price,
        shelf_life: value?.shelfLife,
        status: Number(value?.status)
      }
    };

    allApiWithHeaderToken(
      `${API_CONSTANTS.COMMON_API_URL}/product_variants/${variantId}`, 
      body, 
      "patch"
    )
      .then((response) => {
        if (response.status === 200) {
          toast.current.show({
            severity: "success",
            summary: t("success"),
            detail: "Variant updated successfully",
            life: 2000,
          });
          setTimeout(() => {
            navigate(ROUTES_CONSTANTS.PRODUCTS);
          }, 2000);
        }
      })
      .catch((err) => {
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: err?.response?.data?.errors || "Failed to update variant",
          life: 3000,
        });
        setLoader(false);
      });
  };

  const fetchWeights = async () => {
    try {
      const response = await allApiWithHeaderToken(
        API_CONSTANTS.MASTERS.BY_TYPE.replace(':master_type', 'weight'),
        {},
        'GET'
      );
      if (response?.status === 200) {
        const masterData = response.data || [];
        const formattedWeights = masterData.map(master => ({
          id: master.id,
          name: master.name,
          value: master.value
        }));
        setWeightList(formattedWeights);
        return formattedWeights;
      }
    } catch (error) {
      console.error("Error fetching weights:", error);
      return [];
    }
    return [];
  };

  const fetchVariantData = async () => {
    setLoader(true);
    try {
      const weights = await fetchWeights();
      
      // Fetch product name
      const productResponse = await allApiWithHeaderToken(
        `${API_CONSTANTS.COMMON_PRODUCTS_URL}/${productId}`, 
        "", 
        "get"
      );
      if (productResponse.status === 200) {
        setProductName(productResponse?.data?.name);
      }

      // Fetch variant data
      const variantResponse = await allApiWithHeaderToken(
        `${API_CONSTANTS.COMMON_API_URL}/product_variants/${variantId}`, 
        "", 
        "get"
      );
      
      if (variantResponse.status === 200) {
        const variantData = variantResponse?.data?.data;
        
        // Find matching weight object
        const selectedWeight = weights.find(w => 
          w.id === variantData.weight_master_id ||
          w.value === variantData.weight ||
          w.name === variantData.weight
        );

        let formData = {
          weight: selectedWeight || { name: variantData.weight, value: variantData.weight },
          mrp: variantData.mrp != null ? String(variantData.mrp) : "",
          price: variantData.price != null ? String(variantData.price) : "",
          shelfLife: variantData.shelf_life != null ? String(variantData.shelf_life) : "",
          status: String(variantData.status)
        };
        
        setData(formData);
      }
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Failed to load variant data",
        life: 3000,
      });
    } finally {
      setLoader(false);
    }
  };

  useEffect(() => {
    if (productId && variantId) {
      fetchVariantData();
    }
  }, [productId, variantId]);

  const handleBack = () => {
    navigate(ROUTES_CONSTANTS.PRODUCTS);
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
      {loader && <AdminPanelLoader/>}
      <Toast ref={toast} position="top-right" style={{scale: '0.7'}} />
      <div className="mx-16 my-auto grid h-fit w-full grid-cols-4 gap-4 bg-BgSecondaryColor p-8 border rounded border-BorderColor">
        <div className="col-span-4 font-[600] text-lg">
          {t("edit_product_variant")} - {productName}
        </div>
        
        <div className="col-span-2">
          <DropdownComponent
            value={values?.weight}
            onChange={(field, value) => setFieldValue(field, value)}
            data={weightList}
            name="weight"
            placeholder={t("weight")}
            className="custom-dropdown col-span-2 w-full rounded border-[1px] border-[#ddd] focus:outline-none"
            optionLabel="name"
            error={errors?.weight}
            touched={touched?.weight}
          />
        </div>

        <div className="col-span-2">
          <InputTextComponent
            value={values?.mrp}
            onChange={handleChange}
            type="number"
            placeholder="MRP"
            name="mrp"
            isLabel={true}
            error={errors?.mrp}
            touched={touched?.mrp}
            className="col-span-2 w-full rounded border-[1px] border-[#ddd] px-[1rem] py-[8px] text-[11px] focus:outline-none"
          />
        </div>

        <div className="col-span-2">
          <InputTextComponent
            value={values?.price}
            onChange={handleChange}
            type="number"
            placeholder={t("selling_price")}
            name="price"
            isLabel={true}
            error={errors?.price}
            touched={touched?.price}
            className="col-span-2 w-full rounded border-[1px] border-[#ddd] px-[1rem] py-[8px] text-[11px] focus:outline-none"
          />
        </div>

        <div className="col-span-2">
          <InputTextComponent
            value={values?.shelfLife}
            onChange={handleChange}
            type="number"
            placeholder={t("shelf_life_in_days")}
            name="shelfLife"
            isLabel={true}
            error={errors?.shelfLife}
            touched={touched?.shelfLife}
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
          />
        </div>

        <div className="col-span-2"></div>

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
            label={t("update")}
            className="rounded bg-TextPrimaryColor px-6 py-2 text-[12px] text-white"
          />
        </div>
      </div>
    </div>
  );
};

export default ProductVariantForm;
