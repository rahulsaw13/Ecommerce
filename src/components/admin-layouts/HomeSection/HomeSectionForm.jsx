// hooks
import { useRef, useState, useEffect } from "react";

// components
import ButtonComponent from "@common/ButtonComponent";
import InputTextComponent from "@common/InputTextComponent";
import { CheckboxComponent } from "@common/CheckboxComponent";
import { allApiWithHeaderToken } from "@api/api";
import AdminPanelLoader from '@common/AdminPanelLoader';
import { ROUTES_CONSTANTS } from "@constants/routesurl";
import { API_CONSTANTS } from "@constants/apiurl";
import { MultiSelect } from 'primereact/multiselect';

// external libraries
import * as yup from "yup";
import { useFormik } from "formik";
import { Toast } from "primereact/toast";
import { useNavigate, useParams } from "react-router-dom";

const initialValues = {
  name: "",
  key: "",
  description: "",
  position: 0,
  is_active: true,
};

const HomeSectionForm = () => {
  const toast = useRef(null);
  const [toastType, setToastType] = useState('');
  const [loader, setLoader] = useState(false);
  const [data, setData] = useState(initialValues);
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [assignedProducts, setAssignedProducts] = useState([]);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const navigate = useNavigate();
  const { id } = useParams();

  const validationSchema = yup.object().shape({
    name: yup.string().required("Name is required"),
    key: yup.string().required("Key is required"),
  });

  const onHandleSubmit = (value) => {
    if (id) {
      updateHomeSection(value);
    } else {
      createHomeSection(value);
    }
  };

  const createHomeSection = (value) => {
    let body = {
      home_section: {
        name: value?.name,
        key: value?.key,
        description: value?.description,
        position: value?.position || 0,
        is_active: value?.is_active
      }
    };
    
    setLoader(true);
    allApiWithHeaderToken(API_CONSTANTS.HOME_SECTIONS, body, "post")
      .then((response) => {
        if (response.status === 201) {
          setToastType('success');
          toast.current.show({
            severity: "success",
            summary: "Success",
            detail: "Home section created successfully",
            life: 3000,
          });
          setTimeout(() => {
            navigate(ROUTES_CONSTANTS.HOME_SECTIONS);
          }, 3000);
        }
      })
      .catch((err) => {
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: err?.response?.data?.errors || "Failed to create home section",
          life: 3000,
        });
      })
      .finally(() => {
        setLoader(false);
      });
  };

  const updateHomeSection = (value) => {
    setLoader(true);
    let body = {
      home_section: {
        name: value?.name,
        key: value?.key,
        description: value?.description,
        position: value?.position || 0,
        is_active: value?.is_active
      }
    };

    allApiWithHeaderToken(`${API_CONSTANTS.HOME_SECTIONS}/${id}`, body, "put")
      .then((response) => {
        if (response.status === 200) {
          navigate(ROUTES_CONSTANTS.HOME_SECTIONS);
        }
      })
      .catch((err) => {
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: err?.response?.data?.errors || "Failed to update home section",
          life: 3000,
        });
        setLoader(false);
      });
  };

  const handleBack = () => {
    navigate(ROUTES_CONSTANTS.HOME_SECTIONS);
  };

  const toastHandler = () => {
    if (toastType === 'success') {
      navigate(ROUTES_CONSTANTS.HOME_SECTIONS);
    }
  };

  const fetchProducts = () => {
    allApiWithHeaderToken(`${API_CONSTANTS.COMMON_PRODUCTS_URL}/active_product`, "", "get")
      .then((response) => {
        if (response.status === 200) {
          const productList = response?.data?.map(product => ({
            id: product.id,
            name: product.name,
            price: product.price
          })) || [];
          setProducts(productList);
        }
      })
      .catch((err) => {
      });
  };

  const fetchAssignedProducts = () => {
    if (!id) return;
    
    setLoader(true);
    allApiWithHeaderToken(`${API_CONSTANTS.HOME_SECTIONS}/${id}`, "", "get")
      .then((response) => {
        if (response.status === 200) {
          const assigned = response?.data?.products || [];
          setAssignedProducts(assigned);
        }
      })
      .catch((err) => {
      })
      .finally(() => {
        setLoader(false);
      });
  };

  const handleAddProducts = () => {
    if (selectedProducts.length === 0) {
      toast.current.show({
        severity: "warn",
        summary: "Warning",
        detail: "Please select products to add",
        life: 3000,
      });
      return;
    }

    setLoader(true);
    const productIds = selectedProducts.map(p => p.id);
    
    allApiWithHeaderToken(`${API_CONSTANTS.HOME_SECTIONS}/${id}/add_products`, { product_ids: productIds }, "post")
      .then((response) => {
        if (response.status === 200) {
          toast.current.show({
            severity: "success",
            summary: "Success",
            detail: response?.data?.message || "Products added successfully",
            life: 3000,
          });
          setSelectedProducts([]);
          fetchAssignedProducts();
        }
      })
      .catch((err) => {
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: err?.response?.data?.error || "Failed to add products",
          life: 3000,
        });
      })
      .finally(() => {
        setLoader(false);
      });
  };

  const handleRemoveProduct = (productId) => {
    setLoader(true);
    allApiWithHeaderToken(`${API_CONSTANTS.HOME_SECTIONS}/${id}/remove_product/${productId}`, "", "delete")
      .then((response) => {
        if (response.status === 200) {
          toast.current.show({
            severity: "success",
            summary: "Success",
            detail: "Product removed successfully",
            life: 3000,
          });
          fetchAssignedProducts();
        }
      })
      .catch((err) => {
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: err?.response?.data?.error || "Failed to remove product",
          life: 3000,
        });
      })
      .finally(() => {
        setLoader(false);
        setDeleteDialogVisible(false);
        setProductToDelete(null);
      });
  };

  const confirmDelete = (product) => {
    setProductToDelete(product);
    setDeleteDialogVisible(true);
  };

  const handleDeleteConfirm = () => {
    if (productToDelete) {
      handleRemoveProduct(productToDelete.id);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogVisible(false);
    setProductToDelete(null);
  };

  const fetchHomeSectionData = async () => {
    if (id) {
      setLoader(true);
      allApiWithHeaderToken(`${API_CONSTANTS.HOME_SECTIONS}/${id}`, "", "get")
        .then((response) => {
          if (response.status === 200) {
            const sectionData = response?.data?.home_section;
            let formData = {
              name: sectionData?.name,
              key: sectionData?.key,
              description: sectionData?.description || "",
              position: sectionData?.position || 0,
              is_active: sectionData?.is_active
            };
            setData(formData);
            
            const assigned = response?.data?.products || [];
            setAssignedProducts(assigned);
          }
        })
        .catch((err) => {
          toast.current.show({
            severity: "error",
            summary: "Error",
            detail: err?.response?.data?.errors || "Failed to fetch home section",
            life: 3000,
          });
        })
        .finally(() => {
          setLoader(false);
        });
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchHomeSectionData();
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
          {id ? "Update Home Section" : "Create Home Section"}
        </div>

        <div className="col-span-4 md:col-span-2">
          <InputTextComponent
            value={values?.name}
            onChange={handleChange}
            type="text"
            isLabel={true}
            placeholder="Name"
            name="name"
            error={errors?.name}
            touched={touched?.name}
            className="w-full rounded border-[1px] border-[#ddd] px-[1rem] py-[8px] text-[11px] focus:outline-none"
          />
        </div>

        <div className="col-span-4 md:col-span-2">
          <InputTextComponent
            value={values?.key}
            onChange={handleChange}
            type="text"
            isLabel={true}
            placeholder="Key"
            name="key"
            error={errors?.key}
            touched={touched?.key}
            disabled={!!id}
            className="w-full rounded border-[1px] border-[#ddd] px-[1rem] py-[8px] text-[11px] focus:outline-none"
          />
        </div>

        <div className="col-span-4">
          <InputTextComponent
            value={values?.description}
            onChange={handleChange}
            type="text"
            isLabel={true}
            placeholder="Description"
            name="description"
            error={errors?.description}
            touched={touched?.description}
            className="w-full rounded border-[1px] border-[#ddd] px-[1rem] py-[8px] text-[11px] focus:outline-none"
          />
        </div>

        <div className="col-span-4 md:col-span-2">
          <InputTextComponent
            value={values?.position}
            onChange={handleChange}
            type="number"
            isLabel={true}
            placeholder="Position"
            name="position"
            error={errors?.position}
            touched={touched?.position}
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
              Section is Active
            </span>
          </div>
        </div>

        {id && (
          <>
            <div className="col-span-4 mt-6">
              <div className="bg-white border border-BorderColor rounded-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                      <i className="ri-shopping-bag-line text-TextPrimaryColor"></i>
                      Manage Products
                    </h3>
                    <p className="text-xs text-gray-600 mt-1">Add or remove products from this section</p>
                  </div>
                </div>

                {/* Add Products & Assigned Products in Same Row */}
                <div className="grid grid-cols-2 gap-6">
                  {/* Add Products Section */}
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <label className="text-xs text-gray-600 mb-2 block font-semibold">Add Products</label>
                    <div className="flex flex-col gap-2">
                      <MultiSelect
                        value={selectedProducts}
                        onChange={(e) => setSelectedProducts(e.value)}
                        options={products}
                        optionLabel="name"
                        placeholder="Select products"
                        filter
                        className="w-full text-[11px]"
                        display="chip"
                        maxSelectedLabels={3}
                      />
                      <button
                        onClick={handleAddProducts}
                        type="button"
                        disabled={loader || selectedProducts.length === 0}
                        className={`rounded px-4 py-2 text-[11px] font-medium transition-colors flex items-center justify-center gap-2 ${
                          selectedProducts.length > 0 && !loader
                            ? 'bg-TextPrimaryColor text-white hover:opacity-90'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        <i className="ri-add-line"></i>
                        Add Products
                      </button>
                    </div>
                  </div>

                  {/* Assigned Products Section */}
                  <div>
                    <label className="text-xs text-gray-600 mb-2 block font-semibold">
                      Assigned Products ({assignedProducts.length})
                    </label>
                    {assignedProducts.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                        <i className="ri-shopping-bag-line text-4xl mb-2 block text-gray-400"></i>
                        <p className="text-sm">No products assigned yet</p>
                        <p className="text-xs text-gray-400 mt-1">Select products and click "Add Products"</p>
                      </div>
                    ) : (
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        {/* Header */}
                        <div className="grid grid-cols-12 gap-4 bg-gray-50 border-b border-gray-200 px-4 py-3">
                          <div className="col-span-10 text-left text-[11px] font-semibold text-gray-700">
                            Product Name
                          </div>
                          <div className="col-span-2 text-center text-[11px] font-semibold text-gray-700">
                            Action
                          </div>
                        </div>
                        
                        {/* Body */}
                        <div className="max-h-[400px] overflow-y-auto">
                          {assignedProducts.map((rowData, index) => {
                            const product = rowData.product;
                            
                            return (
                              <div 
                                key={product?.id || index}
                                className={`grid grid-cols-12 gap-4 px-4 py-3 border-b border-gray-100 hover:bg-gray-50 ${
                                  index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                                }`}
                              >
                                <div className="col-span-10 flex items-center gap-2 text-[11px]">
                                  <i className="ri-product-hunt-line text-TextPrimaryColor"></i>
                                  <span className="font-medium">{product?.name}</span>
                                </div>
                                <div className="col-span-2 flex items-center justify-center text-[11px]">
                                  <button
                                    onClick={() => confirmDelete(product)}
                                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-100 text-red-600 hover:bg-red-600 hover:text-white transition-colors"
                                    title="Remove product"
                                  >
                                    <i className="ri-delete-bin-line text-sm"></i>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        <div className="col-span-3"></div>
        <div className="col-span-3"></div>
        <div className="mt-4 flex justify-end gap-4">
          <ButtonComponent
            onClick={handleBack}
            type="button"
            label="Back"
            className="rounded bg-TextPrimaryColor px-6 py-2 text-[12px] text-white"
          />
          <ButtonComponent
            onClick={handleSubmit}
            type="submit"
            label={id ? "Update" : "Submit"}
            className="rounded bg-TextPrimaryColor px-6 py-2 text-[12px] text-white"
          />
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteDialogVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <i className="ri-delete-bin-line text-2xl text-red-600"></i>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Confirm Delete</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>
            
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-700">
                Are you sure you want to remove <span className="font-semibold text-gray-900">{productToDelete?.name}</span> from this section?
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={handleDeleteCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <i className="ri-delete-bin-line"></i>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeSectionForm;
