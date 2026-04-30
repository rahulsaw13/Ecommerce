// components
import ButtonComponent from "@common/ButtonComponent";
import InputTextComponent from "@common/InputTextComponent";
import { allApiWithHeaderToken } from "@api/api";
import { API_CONSTANTS } from "@constants/apiurl";
import { ROUTES_CONSTANTS } from "@constants/routesurl";
import AdminPanelLoader from '@common/AdminPanelLoader';
import Dropdown from "@common/DropdownComponent";
import UserFormModal from "@adminpage-layouts/User/UserFormModal";
import AutocompleteComponent from "@common/Autocomplete";

// external libraries
import * as yup from "yup";
import { useFormik } from "formik";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";

const structure = {
  user: "",
  coupon: "",
  phoneNumber: "",
  fssai: "",
  gstin: "",
  products: [{ id: 1, product: "", qty: "" }], // Keep this as default
  taxPrice: "",
  handlingFee: 0,
  warehouse: "", // Add warehouse selection
  payment_mode: "Offline", // Default payment mode
  payment_status: "", // Add payment status
  // Removed address fields as requested
  // Estimated delivery date
  estimatedDeliveryDate: "",
  // Shipping cost and carton fields for admin review
  shippingCostPerCarton: "",
  totalCartons: ""
};

const OrderForm = () => {
  const { t } = useTranslation("msg");
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(structure);
  const [userList, setUserList] = useState([]);
  const [warehouseList, setWarehouseList] = useState([]); // Add warehouse list
  const [visible, setVisible] = useState(false);
  const [loader, setLoader] = useState(false);
  const toast = useRef(null);
  const [productList, setProductList] = useState([]);
  const [selectedUserDiscount, setSelectedUserDiscount] = useState(null); // Add user discount info
  const [orderData, setOrderData] = useState(null); // Store order data temporarily

  const [deliveryDetails, setDeliveryDetails] = useState({
    estimatedDeliveryDays: "",
    etd: "",
    courierName: "",
    freightCharge: "",
    id: ""
  });
  const [finalTotal, setFinalTotal] = useState({
    totalPrice: 0,
    discount: 0,
    couponPrice: 0,
    finalPrice: 0
  });


  const validationSchema = yup.object().shape({
    user: yup.object().test('non-empty-object', t("customer_is_required"), (value) => {
      return value && Object.keys(value).length > 0;
    }),
    coupon: yup.string(),
    phoneNumber: yup.string().required(t("phone_number_is_required")),
    warehouse: yup.object().test('non-empty-object', t("warehouse_is_required"), (value) => {
      return value && Object.keys(value).length > 0;
    }),
    // Removed address validations as requested
    taxPrice: yup.string().required(t("tax_price_is_required")),
    handlingFee: yup.string().required(t("shipping_fee_is_required")),
    // Add validation for shipping fields when editing existing orders
    shippingCostPerCarton: id ? yup.string().required("Shipping cost per carton is required") : yup.string(),
    totalCartons: id ? yup.string().required("Total cartons is required") : yup.string()
  });

  const onHandleSubmit = async (value) => {
    if (id) {
      // Update
      updateOrder(value);
    } else {
      // Create
      createOrder(value);
    }
  };

  const formik = useFormik({
    initialValues: data,
    onSubmit: onHandleSubmit,
    validationSchema: validationSchema,
    enableReinitialize: true,
    validateOnBlur: true,
  });

  const { values, errors, handleSubmit, handleChange, setFieldValue, touched } = formik;

  const createOrder = (value) => {
    let products = [];
    value?.products?.forEach((item)=>{
      let obj = {
        product_id: Number(item?.product?.id),
        qty: Number(item?.qty)
      };
      products.push(obj);
    });

    let data = {
      user_id: value?.user?.id,
      coupon: value?.coupon,
      tax_price: Number(value?.taxPrice),
      handling_fee: Number(value?.handlingFee),
      warehouse_id: value?.warehouse?.id, // Add warehouse_id
      payment_mode: value?.payment_mode || "Offline", // Use form value or default to Offline for new orders
      products: products,
      total_price: finalTotal?.finalPrice - finalTotal?.couponPrice + Number(values?.taxPrice) + Number(values?.handlingFee),
      estimated_delivery_date: value?.estimatedDeliveryDate || null
    };

    // Removed address logic as requested

    setLoader(true);
    allApiWithHeaderToken(API_CONSTANTS.COMMON_ORDER_URL, data , "post")
      .then((response) => {
        if (response.status === 201) {
          navigate(ROUTES_CONSTANTS.ORDERS);
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

  const updateOrder = (value) => {
    let products = [];
    value?.products?.forEach((item)=>{
      let obj = {
        product_id: Number(item?.product?.id),
        qty: Number(item?.qty)
      };
      products.push(obj);
    });

    let data = {
      user_id: value?.user?.id,
      coupon: value?.coupon,
      tax_price: Number(value?.taxPrice),
      handling_fee: Number(value?.handlingFee),
      warehouse_id: value?.warehouse?.id, // Add warehouse_id
      payment_mode: value?.payment_mode || "Offline", // Preserve original payment mode
      products: products,
      total_price: finalTotal?.finalPrice - finalTotal?.couponPrice + Number(values?.taxPrice) + Number(values?.handlingFee),
      estimated_delivery_date: value?.estimatedDeliveryDate || null,
      // Add shipping cost and carton fields for admin review
      shipping_cost_per_carton: value?.shippingCostPerCarton ? Number(value?.shippingCostPerCarton) : null,
      total_cartons: value?.totalCartons ? Number(value?.totalCartons) : null
    };

    // Removed address logic as requested
    setLoader(true);
    allApiWithHeaderToken(`${API_CONSTANTS.COMMON_ORDER_URL}/${id}`, data, "put")
      .then((response) => {
        if (response.status === 200) {
          navigate(ROUTES_CONSTANTS.ORDERS);
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

  const addProduct = () => {
    const currentProducts = values.products || [];
    const newProduct = { id: Date.now(), product: "", qty: "" };
    setFieldValue("products", [...currentProducts, newProduct]);
  };

  const removeProduct = (index) => {
    const currentProducts = values.products || [];
    if (currentProducts.length > 1) {
      const updatedProducts = [...currentProducts];
      updatedProducts.splice(index, 1);
      setFieldValue("products", updatedProducts);
    }
  };

  const handleBack = () => {
    navigate(ROUTES_CONSTANTS.ORDERS);
  };

  const fetchUserList = async () => {
    try {
      const userResponse = await allApiWithHeaderToken(`${API_CONSTANTS.COMMON_CUSTOMERS_URL}/filter`,"", "post");
      if (userResponse.status === 200) {
        setUserList(userResponse?.data?.data);
      }
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: err?.response?.data?.errors,
        life: 3000,
      });
    } finally {
    }
  };

  // Add warehouse fetching function
  const fetchWarehouseList = async () => {
    try {
      const warehouseResponse = await allApiWithHeaderToken(`${API_CONSTANTS.COMMON_WAREHOUSES_URL}/filter`,"", "post");
      if (warehouseResponse.status === 200) {
        setWarehouseList(warehouseResponse?.data?.data);
      }
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: err?.response?.data?.errors,
        life: 3000,
      });
    }
  };

  // Removed address fetching functions as they're no longer needed

  const fetchProductList = async (userId = null) => {
    try {
      // Use the active_product endpoint to get products with user-specific discounted prices
      let url = API_CONSTANTS.ALL_PRODUCT_URL;
      if (userId) {
        url += `?user_id=${userId}`;
      }
      
      const productResponse = await allApiWithHeaderToken(url, {}, "get");
      if (productResponse.status === 200) {
          // Transform the product data to ensure it has the correct structure
          const transformedProducts = productResponse?.data?.map(product => ({
            id: product.id,
            name: product.name,
            description: product.description,
            price: parseFloat(product.price || 0),
            final_price: parseFloat(product.final_price || product.price || 0),
            discounted_price: parseFloat(product.discounted_price || 0),
            weight: product.weight,
            shelf_life: product.shelf_life,
            image_url: product.image_url,
            sub_category_name: product.sub_category_name
          })) || [];

          setProductList(transformedProducts);
      }
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: err?.response?.data?.errors,
        life: 3000,
      });
    } finally {
    }
  };

  const fetchOrderData = async () => {
    try {
      if (id) {
        const response = await allApiWithHeaderToken(`${API_CONSTANTS.COMMON_ORDER_URL}/${id}`, "", "get");
        if (response.status === 200) {
          const order = response.data.data;

          // Prefill basic order fields
          setFieldValue("handlingFee", order.handling_fee || 0);
          setFieldValue("taxPrice", order.tax_price || 0);
          setFieldValue("total_price", order.total_price || 0);
          setFieldValue("payment_mode", order.payment_mode || "");
          // Add shipping cost and carton fields
          setFieldValue("shippingCostPerCarton", order.shipping_cost_per_carton || "");
          setFieldValue("totalCartons", order.total_cartons || "");
          
          // Update the data state to persist shipping values
          setData(prevData => ({
            ...prevData,
            shippingCostPerCarton: order.shipping_cost_per_carton || "",
            totalCartons: order.total_cartons || ""
          }));
          setFieldValue("payment_status", order.payment_status || "");
          
          const selectedWarehouse = warehouseList?.find((item) => item.id == order?.warehouse?.id);
          setFieldValue("warehouse", selectedWarehouse);
         
          // Set user and their discount category
          if (order.user) {
            setFieldValue("user", order.user);
            setSelectedUserDiscount(order.user.discount_category);
            // Fetch products with user-specific discounted prices for editing
            fetchProductList(order.user.id);
          }

          // Format estimated delivery date for datetime-local input
          let formattedDate = "";
          if (order.estimated_delivery_date) {
            const date = new Date(order.estimated_delivery_date);
            // Format to YYYY-MM-DDTHH:MM for datetime-local input
            formattedDate = date.toISOString().slice(0, 16);
            setFieldValue("estimatedDeliveryDate", formattedDate);
            setData(prevData => ({
              ...prevData,
              estimatedDeliveryDate: formattedDate
            }));
          } else {
            setFieldValue("estimatedDeliveryDate", "");
            setData(prevData => ({
              ...prevData,
              estimatedDeliveryDate: ""
            }));
          }

          // Update the data state to persist values after refresh
          setData(prevData => ({
            ...prevData,
            warehouse: order.warehouse || "",
            estimatedDeliveryDate: formattedDate,
            user: order.user || "",
            handlingFee: order.handling_fee || 0,
            taxPrice: order.tax_price || 0,
            phoneNumber: order.user?.phone_number || "",
            fssai: order.user?.fssai_number || "",
            gstin: order.user?.gst_number || "",
            payment_mode: order.payment_mode || "Offline",
            payment_status: order.payment_status || ""
          }));
          
          // Prefill user details
          if (order.user) {
            setFieldValue("user", {
              id: order.user.id,
              name: order.user.name,
              email: order.user.email,
              phone_number: order.user.phone_number || "",
              gstin: order.user.gstin || "",
              fssai: order.user.fssai || ""
            });
            
            if (order.user.phone_number) {
              setFieldValue("phoneNumber", order.user.phone_number);
            }
            
            // Products will be fetched above with user-specific discounts
          }

          // Handle shipping address as object
          if (order.shipping_address) {
            // Set the address object for dropdown selection
            setFieldValue("address", order.shipping_address);
            
            // Also populate individual fields
            setFieldValue("flatLandmark", (order.shipping_address.flat_no || "") + " " + (order.shipping_address.landmark || ""));
            setFieldValue("city", order.shipping_address.city || "");
            setFieldValue("state", order.shipping_address.state || "");
            setFieldValue("zipCode", order.shipping_address.zip_code || "");
            setFieldValue("country", order.shipping_address.country || "");
          }

          // Handle billing address as object
          if (order.billing_address) {
            // Set the billing address object for dropdown selection
            setFieldValue("billingAddress", order.billing_address);
            
            // Also populate individual shop address fields
            setFieldValue("shopLandmark", (order.billing_address.landmark || ""));
            setFieldValue("shopCity", order.billing_address.city || "");
            setFieldValue("shopState", order.billing_address.state || "");
            setFieldValue("shopZipCode", order.billing_address.zip_code || "");
            setFieldValue("shopCountry", order.billing_address.country || "");
          }
          // Store order data for later processing when productList is available
          setOrderData(order);
        }
      }
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: err?.response?.data?.errors || "Failed to fetch order.",
        life: 3000,
      });
    } finally {
    }
  };

  const downloadReceipt = async () => {
    try {
      setLoader(true);
      // Download banking receipt with proper authentication using axios directly
      const token = JSON.parse(localStorage.getItem('token'));
      const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/v1/orders/${id}/banking_receipt`, {
        method: 'GET',
        headers: {
          'Authorization': `${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch banking receipt');
      }
      
      // Get the blob from response
      const blob = await response.blob();
      
      // Create blob URL and download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `banking_receipt_order_${id}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.current.show({
        severity: "success",
        summary: "Success",
        detail: "Banking receipt downloaded successfully",
        life: 3000,
      });
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: error.message || "Failed to download banking receipt",
        life: 3000,
      });
    } finally {
      setLoader(false);
    }
  }

  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoader(true);
        // First load the reference data
        await Promise.all([
          fetchUserList(),
          fetchWarehouseList(), // Add warehouse fetching
          fetchProductList()
          // Removed fetchbillingAddressList()
        ]);
        
        // Then load order data if we're editing
        if (id) {
          await fetchOrderData();
        }
        setLoader(false);
      } catch (error) {
        setLoader(false);
      }
    };
    
    initializeData();
  }, [id]);

  // Format products when both orderData and productList are available
  useEffect(() => {
    if (orderData && productList.length > 0 && orderData.products) {
      const formattedProducts = orderData.products.map((p, index) => {
        // Find the matching product from productList
        const matchingProduct = productList.find(product => product.id === p.product_id);
        return {
          id: p.product_id || Date.now() + index,
          product: matchingProduct || {
            id: p.product_id,
            name: p.name + " " + p.weight,
            price: parseFloat(p.discounted_price || p.price || 0),
            final_price: parseFloat(p.final_price || p.price),
            discounted_price: parseFloat(p.discounted_price || 0),
            description: p.description || "",
            weight: p.weight || "",
            shelf_life: p.shelf_life || ""
          },
          qty: p.quantity || p.qty || 1
        };
      });

      // Set the products in Formik
      setFieldValue("products", formattedProducts);

      // Clear orderData to prevent re-processing
      setOrderData(null);
    }
  }, [orderData, productList, setFieldValue]);

  useEffect(() => {
    let obj =  {
      totalPrice:0 ,
      discount: 0,
      finalPrice: 0
    }
    values?.products.forEach((item)=>{
      // Get the original price from the product object (before discount was applied)
      const originalPrice = item?.product?.final_price || item?.product?.price || 0;
      // Get the current price (which might be discounted price)
      const currentPrice = item?.product?.price || 0;
      // Get the discounted price from the product object
      const discountedPrice = item?.product?.discounted_price || 0;
      
      const quantity = item?.qty || 0;
      
      // Use original price for total calculation
      // Use discounted price if available and different from original, otherwise use current price
      let finalItemPrice = currentPrice;
      let itemDiscount = 0;
      
      if (discountedPrice > 0 && discountedPrice !== originalPrice) {
        finalItemPrice = discountedPrice;
        itemDiscount = (originalPrice - discountedPrice) * quantity;
      } else if (currentPrice !== originalPrice) {
        // If current price is different from original (manually discounted)
        itemDiscount = (originalPrice - currentPrice) * quantity;
      }

      if(!obj?.totalPrice){
        obj['totalPrice'] = originalPrice * quantity;
        obj['discount'] = itemDiscount;
        obj['finalPrice'] = finalItemPrice * quantity;
      }
      else{
        obj['totalPrice'] = obj['totalPrice'] + (originalPrice * quantity);
        obj['discount'] = obj['discount'] + itemDiscount;
        obj['finalPrice'] = obj['finalPrice'] + (finalItemPrice * quantity);
      }
    });
    setFinalTotal({...finalTotal,...obj});
}, [formik.values.products, selectedUserDiscount]);

  return (
    <div className="h-screen bg-BgPrimaryColor text-TextPrimaryColor py-4 overflow-y-scroll">
    {loader && <AdminPanelLoader/>}
    <Toast ref={toast} position="top-right" style={{scale: '0.7'}} />
    <div className="mx-4 sm:mx-16 my-auto bg-BgSecondaryColor border rounded border-BorderColor">
      <div className="m-8 font-[600]">
          {id ? t("update_order") : t("create_order")}
      </div>
      <div>
        <label className="text-[14px] text-TextPrimaryColor  font-[600] px-8">{t("customer_details")}</label>
        <div className="grid h-fit w-full grid-cols-4 gap-4 px-8 py-4">
          <div className="col-span-4 md:col-span-1">
            <div className="flex gap-2 items-end">
             <InputTextComponent
                value={values?.user?.name || ""}
                type="text"
                placeholder={t("customer_name")}
                name="customerName"
                isLabel={true}
                disabled={true}
                className="col-span-2 w-full rounded border-[1px] border-[#ddd] px-[1rem] py-[8px] text-[11px] focus:outline-none bg-gray-100"
              />
              {!id && (
                <ButtonComponent
                  onClick={() => setVisible(true)} 
                  type="submit"
                  icon="ri-add-large-fill"
                  className="rounded bg-TextPrimaryColor px-6 py-2 text-[12px] text-white"
                />
              )}
            </div>
          </div>
          <div className="col-span-4 md:col-span-1">
            <InputTextComponent
              value={values?.phoneNumber}
              onChange={handleChange}
              type="number"
              placeholder={t("phone_number")}
              name="phoneNumber"
              isLabel={true}
              error={errors?.phoneNumber}
              touched={touched?.phoneNumber}
              className="col-span-2 w-full rounded border-[1px] border-[#ddd] px-[1rem] py-[8px] text-[11px] focus:outline-none"
            />
          </div>
          <div className="col-span-4 md:col-span-1">
            <InputTextComponent
              value={values?.gstin}
              type="text"
              placeholder={t("gstin")}
              name="gstin"
              isLabel={true}
              disabled={true}
              className="col-span-2 w-full rounded border-[1px] border-[#ddd] px-[1rem] py-[8px] text-[11px] focus:outline-none bg-gray-100"
            />
          </div>
          <div className="col-span-4 md:col-span-1">
            <InputTextComponent
              value={values?.fssai}
              type="text"
              placeholder={t("fssai")}
              name="fssai"
              isLabel={true}
              disabled={true}
              className="col-span-2 w-full rounded border-[1px] border-[#ddd] px-[1rem] py-[8px] text-[11px] focus:outline-none bg-gray-100"
            />
          </div>         
          <div className="col-span-12 md:col-span-4 mt-[1rem]">
            <hr className="w-full"/>
          </div>
          <div className="col-span-4 md:col-span-1">
              <Dropdown 
                value={values?.warehouse}
                onChange={(field, value) => {
                  setFieldValue(field, value);
                }}
                data={warehouseList}
                placeholder={t("select_warehouse")}
                name="warehouse"
                error={errors?.warehouse}
                touched={touched?.warehouse}
                className="col-span-2 w-full ps-3 rounded border-[1px] border-[#ddd] custom-dropdown focus:outline-none"
                optionLabel="name"
              />
          </div>
          <div className="col-span-4 md:col-span-1">
              <InputTextComponent
                value={values?.estimatedDeliveryDate}
                onChange={handleChange}
                type="datetime-local"
                placeholder={t("estimated_delivery_time")}
                name="estimatedDeliveryDate"
                isLabel={true}
                min={new Date().toISOString().slice(0, 16)}
                error={errors?.estimatedDeliveryDate}
                touched={touched?.estimatedDeliveryDate}
                className="col-span-2 w-full rounded border-[1px] border-[#ddd] px-[1rem] py-[8px] text-[11px] focus:outline-none"
              />
          </div>

          {/* Shipping Cost and Carton Fields - Only show when editing existing orders */}
          {id && (
            <>
              <div className="col-span-4 md:col-span-1">
                <InputTextComponent
                  value={values?.shippingCostPerCarton}
                  onChange={handleChange}
                  type="number"
                  placeholder="Shipping Cost Per Carton (₹)"
                  name="shippingCostPerCarton"
                  isLabel={true}
                  error={errors?.shippingCostPerCarton}
                  touched={touched?.shippingCostPerCarton}
                  className="col-span-2 w-full rounded border-[1px] border-[#ddd] px-[1rem] py-[8px] text-[11px] focus:outline-none"
                />
              </div>
              <div className="col-span-4 md:col-span-1">
                <InputTextComponent
                  value={values?.totalCartons}
                  onChange={handleChange}
                  type="number"
                  placeholder="Total Cartons"
                  name="totalCartons"
                  isLabel={true}
                  error={errors?.totalCartons}
                  touched={touched?.totalCartons}
                  className="col-span-2 w-full rounded border-[1px] border-[#ddd] px-[1rem] py-[8px] text-[11px] focus:outline-none"
                />
              </div>
            </>
          )}
        </div>
      </div>
      <div className="w-full flex justify-center py-8">
        <hr className="w-[95%]"/>
      </div>
      <div>
        <label className="text-[14px] text-TextPrimaryColor  font-[600] px-8">{t("order_details")}</label>
        <div className="grid h-fit w-full grid-cols-4 gap-4 pe-8">
          <div className="col-span-3 md:col-span-3">
              <div className="grid h-fit w-full grid-cols-3 gap-4 ps-8">
                <div className="col-span-5 md:col-span-3">
                  {(values.products || []).map((product, index) => (
                    <div key={product?.id || index} className="my-auto grid grid-cols-4 gap-4">
                      <div className="col-span-4 md:col-span-2">
                        <AutocompleteComponent
                            value={values?.products[index]?.product ?
                              `${values?.products[index]?.product?.name} ${values?.products[index]?.product?.weight ? `(${values?.products[index]?.product?.weight})` : ''}`
                              : ""
                            }
                            onChange={(field, value) => {
                              // Set the complete product object with all price information
                              if (value) {
                                const productWithPrices = {
                                  ...value,
                                  original_price: value.price, // Store original price
                                  final_price: value.price, // Keep original price as final_price
                                  price: value.discounted_price && value.discounted_price > 0 ? value.discounted_price : value.price, // Show discounted price in UI
                                  discounted_price: value.discounted_price || 0
                                };
                                setFieldValue(`products[${index}].product`, productWithPrices);
                              } else {
                                setFieldValue(`products[${index}].product`, value);
                              }
                            }}
                            data={productList}
                            label={t("product")}
                            placeholder={t("select_product")}
                            name={`products[${index}].product`}
                            dropdown={true}
                            error={errors?.products?.[index]?.product}
                            touched={touched?.products?.[index]?.product}
                            className="custom-dropdown col-span-2 w-full rounded border-[1px] border-[#ddd] focus:outline-none"
                        />
                      </div>
                      <div className="col-span-3 md:col-span-1">
                        <InputTextComponent
                          value={values?.products[index]?.qty || ""}
                          onChange={(e) => {
                            const updatedQty = e.target.value;
                            setFieldValue(`products[${index}].qty`, updatedQty);
                          }}
                          type="text"
                          placeholder={t("qty")}
                          name={`products[${index}].qty`}
                          isLabel={true}
                          error={errors?.products?.[index]?.qty}
                          touched={touched?.products?.[index]?.qty}
                          className="col-span-2 w-full rounded border-[1px] border-[#ddd] px-[1rem] py-[8px] text-[11px] focus:outline-none"
                        />
                      </div>
                      <div className="col-span-1 md:col-span-1 flex items-end gap-2">
                        <InputTextComponent
                          value={values?.products[index]?.product?.price || ""}
                          type="number"
                          placeholder={t("price")}
                          disabled={true}
                          name={`products[${index}].product.price`}
                          isLabel={true}
                          className="col-span-2 w-full rounded border-[1px] border-[#ddd] px-[1rem] py-[8px] text-[11px] focus:outline-none bg-gray-100"
                        />
                        {/* Add / Remove Buttons */}
                        {(values.products || []).length > 1 && (
                          <ButtonComponent
                            onClick={() => {
                              removeProduct(index);
                            }}
                            icon="ri-subtract-line"
                            className="rounded bg-TextPrimaryColor px-6 py-2 text-[12px] text-white"
                          />
                        )}

                        {index === (values.products || []).length - 1 && (
                          <ButtonComponent
                            onClick={addProduct}
                            icon="ri-add-line"
                            className="rounded bg-TextPrimaryColor px-6 py-2 text-[12px] text-white"
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
          </div>
          <div className="col-span-1 md:col-span-1 mb-4">
            <div className="col-span-3 md:col-span-1">
              <label className="text-[14px] text-TextPrimaryColor font-[600]">{t("final_product_details")}</label>
              <table className="w-full border-collapse border border-gray-300 shadow-md rounded-lg">
                <tbody>
                  {
                    deliveryDetails?.estimatedDeliveryDays &&
                    <tr className="bg-gray-100 text-gray-700">
                      <th className="p-3 text-left border-b border-gray-300">{t("estimated_delivery_time")}</th>
                      <td className="p-3 text-right border-b border-gray-300 font-semibold">{deliveryDetails?.etd} in {deliveryDetails?.estimatedDeliveryDays}</td>
                    </tr>
                  }
                  {
                    deliveryDetails?.courierName &&
                    <tr className="bg-gray-100 text-gray-700">
                      <th className="p-3 text-left border-b border-gray-300">{t("courier_name")}</th>
                      <td className="p-3 text-right border-b border-gray-300 font-semibold">{deliveryDetails?.courierName}</td>
                    </tr>
                  }
                  <tr className="bg-gray-100 text-gray-700">
                    <th className="p-3 text-left border-b border-gray-300">{t("total_price")}</th>
                    <td className="p-3 text-right border-b border-gray-300 font-semibold">₹{finalTotal?.totalPrice || 0}</td>
                  </tr>
                  <tr>
                    <th className="p-3 text-left border-b border-gray-300">{t("discount")}</th>
                    <td className="p-3 text-right border-b border-gray-300 text-red-500">-₹{finalTotal?.discount || 0}</td>
                  </tr>
                  <tr className="bg-gray-100">
                    <th className="p-3 text-left border-b border-gray-300">{t("tax")}</th>
                    <td className="p-3 text-right border-b border-gray-300">+₹{values?.taxPrice || 0}</td>
                  </tr>
                  {/* Show shipping cost calculation if carton details are available */}
                  {id && values?.shippingCostPerCarton && values?.totalCartons && (
                    <tr className="bg-blue-50">
                      <th className="p-3 text-left border-b border-gray-300">Shipping Cost ({values?.totalCartons} cartons × ₹{values?.shippingCostPerCarton})</th>
                      <td className="p-3 text-right border-b border-gray-300 text-blue-600">+₹{(Number(values?.shippingCostPerCarton) * Number(values?.totalCartons)) || 0}</td>
                    </tr>
                  )}
                  <tr className="bg-gray-200 font-bold">
                    <th className="p-3 text-left">{t("final_price")}</th>
                    <td className="p-3 text-right text-green-600">₹{(
                      finalTotal?.finalPrice - finalTotal?.couponPrice + 
                      Number(values?.taxPrice) + 
                      Number(values?.handlingFee) + 
                      (id && values?.shippingCostPerCarton && values?.totalCartons ? 
                        (Number(values?.shippingCostPerCarton) * Number(values?.totalCartons)) : 0)
                    ) || 0}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div>
              <UserFormModal header={t("create_user")} draggable={false} visible={visible} width="50vw" onHide={()=> {setVisible(!visible)}}/>
            </div>
            <div className="col-span-2 mt-2 flex justify-end">
              {id && values?.payment_status === 'payment_offline' && (
                  <ButtonComponent
                    onClick={downloadReceipt}
                    icon="ri-download-line"
                    label={t("download_banking_receipt")}
                    className="rounded gap-[0.5rem] bg-TextPrimaryColor px-6 py-2 text-[12px] text-white"
                  />
              )}
            </div>
            <div className="mt-2 flex justify-end gap-4">
              <ButtonComponent
                onClick={() => handleBack()}
                type="button"
                label={t("back")}
                className="rounded bg-TextPrimaryColor px-6 py-2 text-[12px] text-white"
              />
              <ButtonComponent
                onClick={() => handleSubmit()}
                type="submit"
                label={id ? t("update_mark_review_as_done") : t("submit")}
                className="rounded bg-TextPrimaryColor px-6 py-2 text-[12px] text-white"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default OrderForm;
