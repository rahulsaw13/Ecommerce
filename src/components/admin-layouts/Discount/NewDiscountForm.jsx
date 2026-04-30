// hooks
import { useRef, useState, useEffect } from "react";

// components
import ButtonComponent from "@common/ButtonComponent";
import InputTextComponent from "@common/InputTextComponent";
import AutocompleteComponent from "@common/Autocomplete";
import { CheckboxComponent } from "@common/CheckboxComponent";
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
  name: "",
  code: "",
  discount_type: "percentage",
  value: "",
  max_discount_amount: "",
  min_cart_value: 0,
  start_at: "",
  end_at: "",
  is_active: true,
  usage_limit: "",
  per_user_limit: "",
};

const discountTypes = [
  { name: "Percentage", value: "percentage" },
  { name: "Flat Amount", value: "flat" }
];

const targetTypes = [
  { name: "Cart-wide", value: "cart" },
  { name: "Category", value: "category" },
  { name: "Product", value: "product" }
];

const conditionTypes = [
  { name: "New User", value: "new_user" },
  { name: "First Order", value: "first_order" },
  { name: "Segment", value: "segment" },
  { name: "Location", value: "location" }
];

const NewDiscountForm = () => {
  const toast = useRef(null);
  const { t } = useTranslation("msg");
  const [toastType, setToastType] = useState('');
  const [loader, setLoader] = useState(false);
  const [data, setData] = useState(initialValues);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [targets, setTargets] = useState([]);
  const [conditions, setConditions] = useState([]);
  const navigate = useNavigate();
  const { id } = useParams();

  const validationSchema = yup.object().shape({
    name: yup.string().required(t("name_is_required")),
    discount_type: yup.string().required(t("discount_type_is_required")),
    value: yup.number().required(t("value_is_required")).positive(t("value_must_be_positive")),
    start_at: yup.string().required(t("start_date_is_required")),
    end_at: yup.string().required(t("end_date_is_required")),
    usage_limit: yup.number()
      .required(t("usage_limit_is_required"))
      .positive(t("usage_limit_must_be_positive"))
      .integer(t("usage_limit_must_be_integer")),
    per_user_limit: yup.number()
      .required(t("per_user_limit_is_required"))
      .positive(t("per_user_limit_must_be_positive"))
      .integer(t("per_user_limit_must_be_integer"))
  });

  const onHandleSubmit = (value) => {
    if (id) {
      updateDiscount(value);
    } else {
      createDiscount(value);
    }
  };

  const createDiscount = (value) => {
    // Convert targets with product_ids array to individual target entries
    const processedTargets = [];
    targets.forEach(target => {
      if (target.target_type === 'product' && target.product_ids && target.product_ids.length > 0) {
        // Create separate target entry for each product
        target.product_ids.forEach(productId => {
          if (productId) {
            processedTargets.push({
              target_type: 'product',
              target_id: productId
            });
          }
        });
      } else if (target.target_type !== 'product') {
        // For non-product targets, add as-is
        processedTargets.push({
          target_type: target.target_type,
          target_id: target.target_id
        });
      }
    });

    // Remove duplicate targets
    const uniqueTargets = processedTargets.filter((target, index, self) =>
      index === self.findIndex((t) => (
        t.target_type === target.target_type && t.target_id === target.target_id
      ))
    );

    // Remove duplicate conditions
    const uniqueConditions = conditions.filter((condition, index, self) =>
      index === self.findIndex((c) => (
        c.condition_type === condition.condition_type && c.condition_value === condition.condition_value
      ))
    );

    let body = {
      discount: {
        name: value?.name,
        code: value?.code || null,
        discount_type: value?.discount_type,
        value: parseFloat(value?.value),
        max_discount_amount: value?.max_discount_amount ? parseFloat(value?.max_discount_amount) : null,
        min_cart_value: parseFloat(value?.min_cart_value) || 0,
        start_at: value?.start_at ? new Date(value.start_at).toISOString() : null,
        end_at: value?.end_at ? new Date(value.end_at).toISOString() : null,
        is_active: value?.is_active,
        usage_limit: value?.usage_limit ? parseInt(value?.usage_limit) : null,
        per_user_limit: value?.per_user_limit ? parseInt(value?.per_user_limit) : null,
      },
      targets: uniqueTargets,
      conditions: uniqueConditions
    };
        
    setLoader(true);
    allApiWithHeaderToken(API_CONSTANTS.DISCOUNTS, body, "post")
      .then((response) => {
        if (response.status === 201) {
          setToastType('success');
          toast.current.show({
            severity: "success",
            summary: t("success"),
            detail: t("discount_created_successfully"),
            life: 3000,
          });
          setTimeout(() => {
            navigate(ROUTES_CONSTANTS.DISCOUNTS);
          }, 3000);
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
      })
      .finally(() => {
        setLoader(false);
      });
  };

  const updateDiscount = (value) => {
    setLoader(true);
    
    // Convert targets with product_ids array to individual target entries
    const processedTargets = [];
    targets.forEach(target => {
      if (target.target_type === 'product' && target.product_ids && target.product_ids.length > 0) {
        // Create separate target entry for each product
        target.product_ids.forEach(productId => {
          if (productId) {
            processedTargets.push({
              target_type: 'product',
              target_id: productId
            });
          }
        });
      } else if (target.target_type !== 'product') {
        // For non-product targets, add as-is
        processedTargets.push({
          target_type: target.target_type,
          target_id: target.target_id
        });
      }
    });

    // Remove duplicate targets
    const uniqueTargets = processedTargets.filter((target, index, self) =>
      index === self.findIndex((t) => (
        t.target_type === target.target_type && t.target_id === target.target_id
      ))
    );

    // Remove duplicate conditions
    const uniqueConditions = conditions.filter((condition, index, self) =>
      index === self.findIndex((c) => (
        c.condition_type === condition.condition_type && c.condition_value === condition.condition_value
      ))
    );

    let body = {
      discount: {
        name: value?.name,
        code: value?.code || null,
        discount_type: value?.discount_type,
        value: parseFloat(value?.value),
        max_discount_amount: value?.max_discount_amount ? parseFloat(value?.max_discount_amount) : null,
        min_cart_value: parseFloat(value?.min_cart_value) || 0,
        start_at: value?.start_at ? new Date(value.start_at).toISOString() : null,
        end_at: value?.end_at ? new Date(value.end_at).toISOString() : null,
        is_active: value?.is_active,
        usage_limit: value?.usage_limit ? parseInt(value?.usage_limit) : null,
        per_user_limit: value?.per_user_limit ? parseInt(value?.per_user_limit) : null,
      },
      targets: uniqueTargets,
      conditions: uniqueConditions
    };

    allApiWithHeaderToken(`${API_CONSTANTS.DISCOUNTS}/${id}`, body, "put")
      .then((response) => {
        if (response.status === 200) {
          navigate(ROUTES_CONSTANTS.DISCOUNTS);
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
      });
  };

  const handleBack = () => {
    navigate(ROUTES_CONSTANTS.DISCOUNTS);
  };

  const toastHandler = () => {
    if (toastType === 'success') {
      navigate(ROUTES_CONSTANTS.DISCOUNTS);
    }
  };

  const fetchCategories = () => {
    allApiWithHeaderToken(`${API_CONSTANTS.COMMON_CATEGORIES_URL}/active_categories_list`, "", "get")
      .then((response) => {
        if (response.status === 200) {
          const categoryList = response?.data?.map(cat => ({
            id: cat.id,
            name: cat.name
          })) || [];
          setCategories(categoryList);
        }
      })
      .catch((err) => {
      });
  };

  const fetchProducts = () => {
    allApiWithHeaderToken(`${API_CONSTANTS.COMMON_PRODUCTS_URL}/active_product`, "", "get")
      .then((response) => {
        if (response.status === 200) {
          const productList = response?.data?.map(product => ({
            id: product.id,
            name: product.name
          })) || [];
          setProducts(productList);
        }
      })
      .catch((err) => {
      });
  };

  const addTarget = () => {
    setTargets([...targets, { target_type: 'cart', target_id: null, product_ids: [] }]);
  };

  const removeTarget = (index) => {
    setTargets(targets.filter((_, i) => i !== index));
  };

  const updateTarget = (index, field, value) => {
    const newTargets = [...targets];
    newTargets[index][field] = value;
    if (field === 'target_type') {
      // Reset target_id and product_ids when target_type changes
      newTargets[index].target_id = null;
      newTargets[index].product_ids = [];
    }
    setTargets(newTargets);
  };

  const addProductToTarget = (targetIndex) => {
    const newTargets = [...targets];
    if (!newTargets[targetIndex].product_ids) {
      newTargets[targetIndex].product_ids = [];
    }
    newTargets[targetIndex].product_ids.push(null);
    setTargets(newTargets);
  };

  const removeProductFromTarget = (targetIndex, productIndex) => {
    const newTargets = [...targets];
    newTargets[targetIndex].product_ids.splice(productIndex, 1);
    setTargets(newTargets);
  };

  const updateProductInTarget = (targetIndex, productIndex, productId) => {
    const newTargets = [...targets];
    newTargets[targetIndex].product_ids[productIndex] = productId;
    setTargets(newTargets);
  };

  const addCondition = () => {
    setConditions([...conditions, { condition_type: 'new_user', condition_value: '' }]);
  };

  const removeCondition = (index) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const updateCondition = (index, field, value) => {
    const newConditions = [...conditions];
    newConditions[index][field] = value;
    setConditions(newConditions);
  };

  // Helper function to get display value for target type
  const getTargetTypeDisplay = (value) => {
    if (!value) return '';
    const type = targetTypes.find(t => t.value === value);
    return type ? type.name : value;
  };

  // Helper function to get display value for condition type
  const getConditionTypeDisplay = (value) => {
    if (!value) return '';
    const type = conditionTypes.find(t => t.value === value);
    return type ? type.name : value;
  };

  // Helper function to get display value for category
  const getCategoryDisplay = (id) => {
    if (!id) return '';
    const category = categories.find(c => c.id === parseInt(id));
    return category ? category.name : '';
  };

  // Helper function to get display value for product
  const getProductDisplay = (id) => {
    if (!id) return '';
    const product = products.find(p => p.id === parseInt(id));
    return product ? product.name : '';
  };

  // Helper to get product object by ID
  const getProductById = (id) => {
    if (!id) return null;
    const product = products.find(p => p.id === parseInt(id));
    return product || null;
  };

  // Helper to get category object by ID
  const getCategoryById = (id) => {
    if (!id) return null;
    const category = categories.find(c => c.id === parseInt(id));
    return category || null;
  };

  const fetchDiscountData = async () => {
    if (id) {
      setLoader(true);
      allApiWithHeaderToken(`${API_CONSTANTS.DISCOUNTS}/${id}`, "", "get")
        .then((response) => {
          if (response.status === 200) {
            const discountData = response?.data?.data?.attributes;
            let formData = {
              name: discountData?.name,
              code: discountData?.code || "",
              discount_type: discountData?.discount_type,
              value: discountData?.value,
              max_discount_amount: discountData?.max_discount_amount || "",
              min_cart_value: discountData?.min_cart_value || 0,
              start_at: discountData?.start_at || null,
              end_at: discountData?.end_at || null,
              is_active: discountData?.is_active,
              usage_limit: discountData?.usage_limit || "",
              per_user_limit: discountData?.per_user_limit || "",
            };
            setData(formData);
            
            // Group product targets together
            const rawTargets = discountData?.targets || [];
            
            const groupedTargets = [];
            const productTargets = rawTargets.filter(t => t.target_type === 'product');
            const otherTargets = rawTargets.filter(t => t.target_type !== 'product');
            
            // Add non-product targets as-is
            otherTargets.forEach(target => {
              groupedTargets.push({
                target_type: target.target_type,
                target_id: target.target_id
              });
            });
            
            // Group all products into one target with product_ids array
            if (productTargets.length > 0) {
              groupedTargets.push({
                target_type: 'product',
                target_id: null,
                product_ids: productTargets.map(t => t.target_id),
                product_names: productTargets.map(t => t.target_name) // Store names as fallback
              });
            }
            
            setTargets(groupedTargets);
            setConditions(discountData?.conditions || []);
          }
        })
        .catch((err) => {
          toast.current.show({
            severity: "error",
            summary: t("error"),
            detail: err?.response?.data?.errors || t("failed_to_fetch_discount"),
            life: 3000,
          });
        })
        .finally(() => {
          setLoader(false);
        });
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchProducts();
    fetchDiscountData();
  }, [id]);

  const formik = useFormik({
    initialValues: data,
    onSubmit: onHandleSubmit,
    validationSchema: validationSchema,
    enableReinitialize: true,
    validateOnBlur: true,
  });

  const { values, errors, handleSubmit, setFieldValue, handleChange, touched } = formik;

  return (
    <div className="flex h-screen text-TextPrimaryColor bg-BgPrimaryColor py-5 overflow-y-scroll">
      {loader && <AdminPanelLoader />}
      <Toast ref={toast} position="top-right" style={{ scale: '0.7' }} onHide={toastHandler} />
      <div className="mx-16 my-auto grid h-fit w-full grid-cols-4 gap-4 bg-BgSecondaryColor p-8 border rounded border-BorderColor">
        <div className="col-span-4 font-[600]">
          {id ? t("update_discount") : t("create_discount")}
        </div>

        {/* Basic Information */}
        <div className="col-span-4 md:col-span-2">
          <InputTextComponent
            value={values?.name}
            onChange={handleChange}
            type="text"
            isLabel={true}
            placeholder={t("discount_name")}
            name="name"
            error={errors?.name}
            touched={touched?.name}
            className="w-full rounded border-[1px] border-[#ddd] px-[1rem] py-[8px] text-[11px] focus:outline-none"
          />
        </div>

        <div className="col-span-4 md:col-span-2">
          <InputTextComponent
            value={values?.code}
            onChange={handleChange}
            type="text"
            isLabel={true}
            placeholder={t("coupon_code")}
            name="code"
            error={errors?.code}
            touched={touched?.code}
            className="w-full rounded border-[1px] border-[#ddd] px-[1rem] py-[8px] text-[11px] focus:outline-none"
          />
        </div>

        <div className="col-span-4 md:col-span-2">
          <AutocompleteComponent
            value={discountTypes.find(t => t.value === values?.discount_type)}
            onChange={(field, selectedValue) => {
              // Extract the actual value from the selected object
              let extractedValue = selectedValue;
              if (selectedValue && typeof selectedValue === 'object') {
                extractedValue = selectedValue.value || selectedValue.name || selectedValue;
              }
              setFieldValue('discount_type', extractedValue);
            }}
            data={discountTypes}
            name="discount_type"
            label={t("discount_type")}
            placeholder={t("select_discount_type")}
            dropdown={true}
            field="name"
            error={errors?.discount_type}
            touched={touched?.discount_type}
          />
        </div>

        <div className="col-span-4 md:col-span-2">
          <InputTextComponent
            value={values?.value}
            onChange={handleChange}
            type="number"
            isLabel={true}
            placeholder={values?.discount_type === 'percentage' ? 'e.g., 10' : 'e.g., 100'}
            name="value"
            error={errors?.value}
            touched={touched?.value}
            className="w-full rounded border-[1px] border-[#ddd] px-[1rem] py-[8px] text-[11px] focus:outline-none"
          />
        </div>

        <div className="col-span-4 md:col-span-2">
          <InputTextComponent
            value={values?.max_discount_amount}
            onChange={handleChange}
            type="number"
            isLabel={true}
            placeholder={t("max_discount_amount")}
            name="max_discount_amount"
            className="w-full rounded border-[1px] border-[#ddd] px-[1rem] py-[8px] text-[11px] focus:outline-none"
          />
        </div>

        <div className="col-span-4 md:col-span-2">
          <InputTextComponent
            value={values?.min_cart_value}
            onChange={handleChange}
            type="number"
            isLabel={true}
            placeholder={t("min_cart_value")}
            name="min_cart_value"
            className="w-full rounded border-[1px] border-[#ddd] px-[1rem] py-[8px] text-[11px] focus:outline-none"
          />
        </div>

        {/* Date Range */}
        <div className="col-span-4 md:col-span-2">
          <InputTextComponent
            value={values?.start_at ? new Date(values.start_at).toISOString().slice(0, 16) : ''}
            onChange={(e) => setFieldValue('start_at', e.target.value || '')}
            type="datetime-local"
            isLabel={true}
            placeholder={t("start_date")}
            name="start_at"
            error={errors?.start_at}
            touched={touched?.start_at}
            className="w-full rounded border-[1px] border-[#ddd] px-[1rem] py-[8px] text-[11px] focus:outline-none"
          />
        </div>

        <div className="col-span-4 md:col-span-2">
          <InputTextComponent
            value={values?.end_at ? new Date(values.end_at).toISOString().slice(0, 16) : ''}
            onChange={(e) => setFieldValue('end_at', e.target.value || '')}
            type="datetime-local"
            isLabel={true}
            placeholder={t("end_date")}
            name="end_at"
            error={errors?.end_at}
            touched={touched?.end_at}
            className="w-full rounded border-[1px] border-[#ddd] px-[1rem] py-[8px] text-[11px] focus:outline-none"
          />
        </div>

        <div className="col-span-4 md:col-span-2">
          <InputTextComponent
            value={values?.usage_limit}
            onChange={handleChange}
            type="number"
            isLabel={true}
            placeholder={t("total_usage_limit")}
            name="usage_limit"
            error={errors?.usage_limit}
            touched={touched?.usage_limit}
            className="w-full rounded border-[1px] border-[#ddd] px-[1rem] py-[8px] text-[11px] focus:outline-none"
          />
        </div>

        <div className="col-span-4 md:col-span-2">
          <InputTextComponent
            value={values?.per_user_limit}
            onChange={handleChange}
            type="number"
            isLabel={true}
            placeholder={t("per_user_limit")}
            name="per_user_limit"
            error={errors?.per_user_limit}
            touched={touched?.per_user_limit}
            className="w-full rounded border-[1px] border-[#ddd] px-[1rem] py-[8px] text-[11px] focus:outline-none"
          />
        </div>

        <div className="col-span-4 md:col-span-2">
          <div className="flex items-center gap-3 pt-7">
            <CheckboxComponent
              checked={values?.is_active}
              onChange={() => setFieldValue('is_active', !values?.is_active)}
            />
            <span className="text-[12px] text-TextPrimaryColor font-[600]">
              {t("discount_is_active")}
            </span>
          </div>
        </div>

        {/* Targets and Conditions Section - Same Row */}
        <div className="col-span-4 mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Targets Section */}
          <div className="bg-white border border-BorderColor rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <i className="ri-focus-3-line text-TextPrimaryColor"></i>
                  {t("discount_targets")}
                </h3>
                <p className="text-xs text-gray-600 mt-1">Define where this discount can be applied</p>
              </div>
              <button
                onClick={addTarget}
                type="button"
                className="rounded bg-TextPrimaryColor px-3 py-1.5 text-[11px] text-white hover:opacity-90 transition-opacity flex items-center gap-1"
              >
                <i className="ri-add-line"></i>
                {t("add_target")}
              </button>
            </div>
            
            {targets.length === 0 ? (
              <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <i className="ri-focus-3-line text-4xl mb-2 block text-gray-400"></i>
                <p className="text-sm">No targets added yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {targets.map((target, index) => (
                  <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-TextPrimaryColor text-white rounded-full flex items-center justify-center text-xs font-semibold mt-6">
                        {index + 1}
                      </div>
                      
                      <div className="flex-1 space-y-3">
                        <div>
                          <label className="text-xs text-gray-600 mb-1 block">Target Type</label>
                          <AutocompleteComponent
                            value={(() => {
                              const foundType = targetTypes.find(t => t.value === target.target_type);
                              return foundType;
                            })()}
                            onChange={(field, value) => {
                              const extractedValue = value?.value || value;
                              updateTarget(index, 'target_type', extractedValue);
                            }}
                            data={targetTypes}
                            name={`target_type_${index}`}
                            placeholder={t("select_target_type")}
                            dropdown={true}
                            field="name"
                          />
                        </div>
                        
                        {target.target_type === 'category' && (
                          <div>
                            <label className="text-xs text-gray-600 mb-1 block">Category</label>
                            <AutocompleteComponent
                              value={categories.find(c => c.id === parseInt(target.target_id))}
                              onChange={(field, value) => {
                                const categoryId = value?.id || (typeof value === 'object' ? value?.id : value);
                                updateTarget(index, 'target_id', categoryId);
                              }}
                              data={categories}
                              name={`target_category_${index}`}
                              placeholder={t("select_category")}
                              dropdown={true}
                              field="name"
                            />
                          </div>
                        )}

                        {target.target_type === 'product' && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="text-xs text-gray-600">Products</label>
                              <button
                                onClick={() => addProductToTarget(index)}
                                type="button"
                                className="text-xs bg-green-100 text-green-600 hover:bg-green-600 hover:text-white px-2 py-1 rounded transition-colors flex items-center gap-1"
                              >
                                <i className="ri-add-line"></i>
                                Add Product
                              </button>
                            </div>
                            
                            {(!target.product_ids || target.product_ids.length === 0) && (
                              <div className="text-center py-4 text-gray-500 bg-gray-50 rounded border border-dashed border-gray-300">
                                <p className="text-xs">Click "Add Product" to select products</p>
                              </div>
                            )}
                            
                            {target.product_ids && target.product_ids.map((productId, pIndex) => {
                              // Handle both string and number IDs
                              const selectedProduct = products.find(p => 
                                p.id == productId || // Loose equality to handle string/number mismatch
                                p.id === productId ||
                                p.id === parseInt(productId) ||
                                p.id === String(productId)
                              );
                              
                              return (
                                <div key={pIndex} className="flex items-center gap-2">
                                  <div className="flex-1">
                                    <AutocompleteComponent
                                      value={selectedProduct}
                                      onChange={(field, value) => {
                                        const newProductId = value?.id || (typeof value === 'object' ? value?.id : value);
                                        updateProductInTarget(index, pIndex, newProductId);
                                      }}
                                      data={products}
                                      name={`target_product_${index}_${pIndex}`}
                                      placeholder={selectedProduct ? selectedProduct.name : t("select_product")}
                                      dropdown={true}
                                      field="name"
                                    />
                                  </div>
                                  <button
                                    onClick={() => removeProductFromTarget(index, pIndex)}
                                    type="button"
                                    className="flex-shrink-0 w-7 h-7 rounded bg-red-100 text-red-600 hover:bg-red-600 hover:text-white transition-colors flex items-center justify-center"
                                    title="Remove product"
                                  >
                                    <i className="ri-subtract-line text-xs"></i>
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => removeTarget(index)}
                        type="button"
                        className="flex-shrink-0 w-8 h-8 rounded-lg bg-red-100 text-red-600 hover:bg-red-600 hover:text-white transition-colors flex items-center justify-center"
                        title="Remove target"
                      >
                        <i className="ri-delete-bin-line text-sm"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Conditions Section */}
          <div className="bg-white border border-BorderColor rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <i className="ri-filter-3-line text-TextPrimaryColor"></i>
                  {t("discount_conditions")}
                </h3>
                <p className="text-xs text-gray-600 mt-1">Set conditions for who can use this discount</p>
              </div>
              <button
                onClick={addCondition}
                type="button"
                className="rounded bg-TextPrimaryColor px-3 py-1.5 text-[11px] text-white hover:opacity-90 transition-opacity flex items-center gap-1"
              >
                <i className="ri-add-line"></i>
                {t("add_condition")}
              </button>
            </div>
            
            {conditions.length === 0 ? (
              <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <i className="ri-filter-3-line text-4xl mb-2 block text-gray-400"></i>
                <p className="text-sm">No conditions added yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {conditions.map((condition, index) => (
                  <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-TextPrimaryColor text-white rounded-full flex items-center justify-center text-xs font-semibold mt-6">
                        {index + 1}
                      </div>
                      
                      <div className="flex-1 space-y-3">
                        <div>
                          <label className="text-xs text-gray-600 mb-1 block">Condition Type</label>
                          <AutocompleteComponent
                            value={conditionTypes.find(t => t.value === condition.condition_type)}
                            onChange={(field, value) => {
                              updateCondition(index, 'condition_type', value?.value || value);
                            }}
                            data={conditionTypes}
                            name={`condition_type_${index}`}
                            placeholder={t("select_condition_type")}
                            dropdown={true}
                            field="name"
                          />
                        </div>
                        
                        <div>
                          <label className="text-xs text-gray-600 mb-1 block">
                            {condition.condition_type === 'new_user' && 'Days since registration'}
                            {condition.condition_type === 'first_order' && 'First order only (no value needed)'}
                            {condition.condition_type === 'segment' && 'Segment ID'}
                            {condition.condition_type === 'location' && 'Location (State/City)'}
                            {!condition.condition_type && 'Condition Value'}
                          </label>
                          {condition.condition_type === 'first_order' ? (
                            <div className="w-full rounded border-[1px] border-[#ddd] px-[1rem] py-[8px] text-[11px] bg-gray-50 text-gray-500">
                              No value required - applies to first order only
                            </div>
                          ) : condition.condition_type === 'new_user' ? (
                            <input
                              type="number"
                              value={condition.condition_value}
                              onChange={(e) => updateCondition(index, 'condition_value', e.target.value)}
                              placeholder="e.g., 30 (days)"
                              min="1"
                              className="w-full rounded border-[1px] border-[#ddd] px-[1rem] py-[8px] text-[11px] focus:outline-none focus:ring-2 focus:ring-TextPrimaryColor"
                            />
                          ) : condition.condition_type === 'segment' ? (
                            <input
                              type="number"
                              value={condition.condition_value}
                              onChange={(e) => updateCondition(index, 'condition_value', e.target.value)}
                              placeholder="e.g., 1 (segment ID)"
                              min="1"
                              className="w-full rounded border-[1px] border-[#ddd] px-[1rem] py-[8px] text-[11px] focus:outline-none focus:ring-2 focus:ring-TextPrimaryColor"
                            />
                          ) : (
                            <input
                              type="text"
                              value={condition.condition_value}
                              onChange={(e) => updateCondition(index, 'condition_value', e.target.value)}
                              placeholder={condition.condition_type === 'location' ? 'e.g., Maharashtra, Mumbai' : 'Enter value'}
                              className="w-full rounded border-[1px] border-[#ddd] px-[1rem] py-[8px] text-[11px] focus:outline-none focus:ring-2 focus:ring-TextPrimaryColor"
                            />
                          )}
                          {condition.condition_type === 'new_user' && (
                            <p className="text-xs text-gray-500 mt-1">User registered within last N days</p>
                          )}
                          {condition.condition_type === 'location' && (
                            <p className="text-xs text-gray-500 mt-1">Comma-separated list of states or cities</p>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => removeCondition(index)}
                        type="button"
                        className="flex-shrink-0 w-8 h-8 rounded-lg bg-red-100 text-red-600 hover:bg-red-600 hover:text-white transition-colors flex items-center justify-center mt-6"
                        title="Remove condition"
                      >
                        <i className="ri-delete-bin-line text-sm"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="col-span-3"></div>
        <div className="col-span-3"></div>
        <div className="mt-4 flex justify-end gap-4">
          <ButtonComponent
            onClick={handleBack}
            type="button"
            label={t("back")}
            className="rounded bg-TextPrimaryColor px-6 py-2 text-[12px] text-white"
          />
          <ButtonComponent
            onClick={handleSubmit}
            type="submit"
            label={id ? t("update") : t("submit")}
            className="rounded bg-TextPrimaryColor px-6 py-2 text-[12px] text-white"
          />
        </div>
      </div>
    </div>
  );
};

export default NewDiscountForm;
