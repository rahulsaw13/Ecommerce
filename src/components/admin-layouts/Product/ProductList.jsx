// utils
import { useEffect, useRef, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Toast } from "primereact/toast";
import { Dialog } from 'primereact/dialog';

// components
import Breadcrum from "@common/Breadcrum";
import TreeTable from "@common/TreeTable";
import ButtonComponent from "@common/ButtonComponent";
import Confirmbox from "@common/Confirmbox";
import { allApiWithHeaderToken } from "@api/api";
import { ROUTES_CONSTANTS } from "@constants/routesurl";
import { API_CONSTANTS } from "@constants/apiurl";
import ProductVariantDialog from "./ProductVariantDialog";

import Loading from '@common/Loading';
import Image from "@common/Image";
import DefaultImage from "@assets/no-image.jpeg";

const ProductList = ({search}) => {
  const toast = useRef(null);
  const [data, setData] = useState([]);
  const { t } = useTranslation("msg");
  const navigate = useNavigate();
  const [isConfirm, setIsConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [loader, setLoader] = useState(false);
  const [visible, setVisible] = useState(false);
  const [variantDialogVisible, setVariantDialogVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [toastType, setToastType] = useState(''); 
  const [bulkUploadFile, setBulkUploadFile] = useState(null);
  const [skip, setSkip] = useState(0);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const abortControllerRef = useRef(null);

  const item = {
    heading: t("product"),
    routes: [
      { label: t("dashboard"), route: ROUTES_CONSTANTS.DASHBOARD },
      { label: t("product"), route: ROUTES_CONSTANTS.PRODUCTS },
    ],
  };

  const actionBodyTemplate = (rowData) => {
    // For parent nodes (products), show edit, delete, and manage variants
    if (rowData.data?.is_parent) {
      return (
        <div className="flex gap-2">
          <ButtonComponent
            icon="ri-pencil-line"
            className="p-button-rounded p-button-text text-[1.2rem] bg-gray-50 hover:bg-gray-100 text-gray-700 w-9 h-9 flex items-center justify-center"
            onClick={() => editProduct(rowData.data)}
            tooltip="Edit"
          />
          <ButtonComponent
            icon="ri-delete-bin-line"
            className="p-button-rounded p-button-text text-[1.2rem] bg-red-50 hover:bg-red-100 text-red-600 w-9 h-9 flex items-center justify-center"
            onClick={() => confirmDeleteProduct(rowData.data)}
            tooltip="Delete"
          />
          <ButtonComponent
            icon="ri-list-check"
            className="p-button-rounded p-button-text text-[1.2rem] bg-blue-50 hover:bg-blue-100 text-blue-600 w-9 h-9 flex items-center justify-center"
            onClick={() => openVariantDialog(rowData.data)}
            tooltip="Manage Variants"
          />
        </div>
      );
    }
    
    // For child nodes (variants), show delete and inactive toggle (NO EDIT)
    const data = rowData.data || rowData;
    const isActive = data.status === 1;
    
    return (
      <div className="flex gap-2 justify-center">
        <ButtonComponent
          icon={isActive ? "ri-toggle-line" : "ri-toggle-fill"}
          className={`p-button-rounded p-button-text text-[1.2rem] w-9 h-9 flex items-center justify-center ${
            isActive 
              ? 'bg-green-50 hover:bg-green-100 text-green-600' 
              : 'bg-gray-50 hover:bg-gray-100 text-gray-600'
          }`}
          onClick={() => toggleVariantStatus(data)}
          tooltip={isActive ? "Make Inactive" : "Make Active"}
        />
        <ButtonComponent
          icon="ri-delete-bin-line"
          className="p-button-rounded p-button-text text-[1.2rem] bg-red-50 hover:bg-red-100 text-red-600 w-9 h-9 flex items-center justify-center"
          onClick={() => confirmDeleteVariant(data)}
          tooltip="Delete"
        />
      </div>
    );
  };

  const statusBodyTemplate = (rowData) => {
    const data = rowData.data || rowData;
    
    return (
      <div className="flex items-center gap-4" style={{ paddingLeft: '4%' }}>
        {data?.status === 1 ? <span className="text-[green]">Active</span> : <span className="text-[red]">Inactive</span>}
      </div>
    );
  };

  const nameBodyTemplate = (rowData) => {
    // For parent nodes (products), show image + name + variant count in same row
    if (rowData.data?.is_parent) {
      return (
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 overflow-hidden rounded-lg flex-shrink-0 border border-gray-200 shadow-sm">
            <Image 
              src={rowData.data?.thumbnail_url || rowData.data?.image_url || DefaultImage}
              placeholderSrc={rowData.data?.blur_placeholder_url}
              alt="Product" 
              width={48}
              height={48}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
          <div className="flex flex-col items-start gap-2">
            <span className="font-semibold text-gray-800 text-[11px]">{rowData.data.name}</span>
            {rowData.data.variants_count > 0 ? (
              <span className="text-[10px] text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded">
                {rowData.data.variants_count} variant(s)
              </span>
            ) : (
              <span className="text-[10px] text-orange-500 bg-orange-50 px-2 py-0.5 rounded">
                No variants
              </span>
            )}
          </div>
        </div>
      );
    }
    
    // For child nodes (variants), show weight display
    const data = rowData.data || rowData;
    return (
      <div className="pl-8">
        <span className="px-3 py-1 text-xs font-medium inline-flex items-center gap-1">
          {data.weight_display || data.weight}
        </span>
      </div>
    );
  };

  const descriptionBodyTemplate = (rowData) => {
    // Show description only for parent nodes
    if (rowData.data?.is_parent) {
      return <span className="text-gray-600">{rowData.data.description}</span>;
    }
    
    // For child nodes (variants), don't show description
    return null;
  };

  const mrpBodyTemplate = (rowData) => {
    // Don't show MRP for parent nodes
    if (rowData.data?.is_parent) {
      return null;
    }
    
    // Show MRP for variants
    const data = rowData.data || rowData;
    const mrpValue = data.mrp || 0;
    
    return (
      <span className="font-semibold text-gray-700 text-sm">
        ₹{parseFloat(mrpValue).toFixed(2)}
      </span>
    );
  };

  const sellingPriceBodyTemplate = (rowData) => {
    // Don't show selling price for parent nodes
    if (rowData.data?.is_parent) {
      return null;
    }
    
    // Show selling price for variants
    const data = rowData.data || rowData;
    return (
      <span className="font-semibold text-green-700 text-sm">
        ₹{parseFloat(data.price).toFixed(2)}
      </span>
    );
  };

  const shelfLifeBodyTemplate = (rowData) => {
    // Don't show shelf life for parent nodes
    if (rowData.data?.is_parent) {
      return null;
    }
    
    // Show shelf life for variants
    const data = rowData.data || rowData;
    return (
      <span className="text-gray-700 text-xs flex items-center gap-1">
        <i className="ri-time-line text-sm"></i>
        {data.shelf_life} days
      </span>
    );
  };

  const columns = [
    { 
      field: "name", 
      header: t("name"), 
      body: nameBodyTemplate, 
      headerStyle: { width: '30%' }, 
      bodyStyle: { width: '30%' },
      expander: true, 
      bodyClassName: 'product-expander'
    },
    { 
      field: "mrp", 
      header: "MRP", 
      body: mrpBodyTemplate, 
      headerStyle: { width: '10%' }, 
      bodyStyle: { width: '10%' }
    },
    { 
      field: "selling_price", 
      header: "Selling Price", 
      body: sellingPriceBodyTemplate, 
      headerStyle: { width: '10%' }, 
      bodyStyle: { width: '10%' }
    },
    { 
      field: "description", 
      header: t("description"), 
      body: descriptionBodyTemplate, 
      headerStyle: { width: '25%' }, 
      bodyStyle: { width: '25%' }
    },
    { 
      header: t("status"), 
      body: statusBodyTemplate, 
      headerStyle: { width: '10%' }, 
      bodyStyle: { width: '10%' }
    },
    { 
      header: t("action"), 
      body: actionBodyTemplate, 
      headerStyle: { width: '15%', paddingLeft: '1%'}, 
      bodyStyle: { width: '15%' }
    },
  ];

  const editProduct = (item) => {
    navigate(`${ROUTES_CONSTANTS.EDIT_PRODUCT}/${item?.id}`);
  };

  const openVariantDialog = (product) => {
    setSelectedProduct(product);
    setVariantDialogVisible(true);
  };

  const closeVariantDialog = () => {
    setVariantDialogVisible(false);
    setSelectedProduct(null);
    fetchProductList(); // Refresh list after variant changes
  };

  const confirmDeleteProduct = (item) => {
    setIsConfirm(!isConfirm);
    setDeleteId(item?.id);
  };

  const confirmDeleteVariant = (variant) => {
    if (window.confirm('Are you sure you want to delete this variant?')) {
      allApiWithHeaderToken(`${API_CONSTANTS.COMMON_API_URL}/product_variants/${variant.variant_id}`, "", "delete")
        .then((response) => {
          if (response?.status === 200) {
            toast.current.show({
              severity: "success",
              summary: "Success",
              detail: "Variant deleted successfully",
              life: 3000,
            });
            fetchProductList();
          }
        })
        .catch((err) => {
          toast.current.show({
            severity: "error",
            summary: "Error",
            detail: err?.response?.data?.errors || "Failed to delete variant",
            life: 3000,
          });
        });
    }
  };

  const toggleVariantStatus = (variant) => {
    const newStatus = variant.status === 1 ? 0 : 1;
    const statusText = newStatus === 1 ? 'active' : 'inactive';
    
    setLoader(true);
    allApiWithHeaderToken(
      `api/v1/product_variants/${variant.variant_id}`, 
      { product_variant: { status: newStatus } }, 
      "patch"
    )
      .then((response) => {
        if (response?.status === 200) {
          toast.current.show({
            severity: "success",
            summary: "Success",
            detail: `Variant marked as ${statusText}`,
            life: 3000,
          });
          
          // Update the status in the local state without refreshing the entire table
          setData(prevData => {
            return prevData.map(product => {
              if (product.children && product.children.length > 0) {
                return {
                  ...product,
                  children: product.children.map(child => {
                    if (child.data.variant_id === variant.variant_id) {
                      return {
                        ...child,
                        data: {
                          ...child.data,
                          status: newStatus
                        }
                      };
                    }
                    return child;
                  })
                };
              }
              return product;
            });
          });
        }
      })
      .catch((err) => {
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: err?.response?.data?.errors || "Failed to update variant status",
          life: 3000,
        });
      })
      .finally(() => {
        setLoader(false);
      });
  };

  const closeDialogbox = () => {
    setDeleteId(null);
    setIsConfirm(!isConfirm);
  };

  const confirmDialogbox = () => {
    setLoader(true);
    setIsConfirm(!isConfirm);
    allApiWithHeaderToken(`${API_CONSTANTS.COMMON_PRODUCTS_URL}/${deleteId}`,"", "delete")
      .then((response) => {
        if (response?.status === 200) {
          fetchProductList();
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

  const paginationChangeHandler = (skip, limit) => {
    setSkip(skip);
    setLimit(limit);
    fetchProductList(skip, limit);
  };

  const fetchProductList = useCallback((sk=skip, li=limit) => {
    // Cancel previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();
    
    setLoader(true);
    let body = {
      search: search,
      skip: sk,
      limit: li,
      grouped: 'true' // Request grouped data from backend
    }
    
    allApiWithHeaderToken(
      `${API_CONSTANTS.COMMON_PRODUCTS_URL}/filter`, 
      body, 
      "post",
      { signal: abortControllerRef.current.signal }
    )
      .then((response) => {
        if (response?.status === 200) {
          // Backend now returns pre-grouped tree data
          const treeData = response?.data?.data || [];
          setData(treeData);
          setTotal(response?.data?.total); // Total number of product groups for pagination
        } 
      })
      .catch((err) => {
        // Ignore abort errors
        if (err.name === 'CanceledError' || err.name === 'AbortError') {
          return;
        }
        toast.current.show({
            severity: "error",
            summary: "Error",
            detail: err?.response?.data?.errors,
            life: 3000,
        });
      }).finally(()=>{
        setLoader(false);
      });
  }, [search, skip, limit]);

  // Debounce search to avoid excessive API calls
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchProductList(0, 10);
    }, 300); // 300ms debounce

    return () => {
      clearTimeout(debounceTimer);
      // Cleanup: abort request on unmount
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [search]);

  const createStock = () => {
    navigate(ROUTES_CONSTANTS.CREATE_PRODUCT);
  };

  const headerElement = (
    <div className="inline-flex align-items-center justify-content-center gap-2">
        <span className="font-bold white-space-nowrap">{t("bulk_product_upload")}</span>
    </div>
  );

  const footerContent = (
      <div className="flex justify-end gap-4">
          <ButtonComponent
            onClick={() => setVisible(false)}
            type="button"
            label={t("back")}
            className="rounded bg-TextPrimaryColor px-6 py-2 text-[12px] text-white"
          />
          <ButtonComponent
            onClick={() => {
              bulkUploadFileHandle();
            }}
            type="submit"
            label={t("submit")}
            className="rounded bg-TextPrimaryColor px-6 py-2 text-[12px] text-white"
          />
      </div>
  );

  const bulkUploadFileHandle = () => {
    if (!bulkUploadFile) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Please select a file to upload",
        life: 3000,
      });
      return;
    }

    // Pass file as object - let allApiWithHeaderToken handle FormData creation
    const data = {
      file: bulkUploadFile
    };

    setLoader(true);
    allApiWithHeaderToken(`${API_CONSTANTS.COMMON_PRODUCTS_URL}/bulk_upload`, data, "post", 'multipart/form-data')
      .then((response) => {
        if (response.status === 200) {
          successToaster(response);
          setVisible(false);
          setBulkUploadFile(null); // Clear the file after successful upload
          fetchProductList();
        }
      })
      .catch((err) => {
        const errorMessage = err?.response?.data?.errors ||
                           err?.response?.data?.error ||
                           "Failed to upload file";
        errorToaster(errorMessage);
        setLoader(false);
      })
      .finally(() => {
        setLoader(false);
      });
  }

  const successToaster=(response)=>{
    setToastType('success');
    return toast.current.show({
      severity: "success",
      summary: t("success"),
      detail: response?.data?.message,
      life: 500
    });
  };

  const errorToaster = (err) => {
    setToastType('error');

    // Handle different error formats
    let errorMessage = "An error occurred";

    if (typeof err === 'string') {
      errorMessage = err;
    } else if (Array.isArray(err)) {
      errorMessage = err.join(', ');
    } else if (err && typeof err === 'object') {
      errorMessage = err.message || err.error || "Unknown error";
    }

    return toast.current.show({
      severity: "error",
      summary: t("error"),
      detail: errorMessage,
      life: 5000
    });
  };

  const importBulkStock = ()=>{
    setVisible(true)
  }

  const downloadTemplate=()=>{
    allApiWithHeaderToken(`${API_CONSTANTS.COMMON_PRODUCTS_URL}/download_template`, "" , "get", "", "blob")
    .then((response) => {
      if(response?.status){
        const currentDate = new Date();
        const formattedDate = currentDate.toISOString().slice(0, 10).replace(/-/g, '');
        const fileName = `${formattedDate}product_template.xlsx`;

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
      }
    })
    .catch((err) => {
      toast.current.show({
          severity: "error",
          summary: "Error",
          detail: err?.response?.data?.errors,
          life: 3000,
      });
    }).finally(()=>{
      setLoader(false);
    });
  }

  return (
    <div className="text-TextPrimaryColor">
      <Toast ref={toast} position="top-right" />
      <Confirmbox
        isConfirm={isConfirm}
        closeDialogbox={closeDialogbox}
        confirmDialogbox={confirmDialogbox}
      />
      <Breadcrum item={item} />
      <div className="mt-4 flex justify-end bg-BgSecondaryColor p-2 border rounded border-BorderColor">
        <ButtonComponent
          type="submit"
          onClick={downloadTemplate}
          label={t("download_template")}
          className="rounded bg-TextPrimaryColor px-6 py-2 text-[12px] text-white me-2"
        />
        <ButtonComponent
          onClick={importBulkStock}
          type="submit"
          label={t("import_products")}
          className="rounded bg-TextPrimaryColor px-6 py-2 text-[12px] text-white me-2"
        />
        <ButtonComponent
          onClick={createStock}
          type="submit"
          label={t("create_product")}
          className="rounded bg-TextPrimaryColor px-6 py-2 text-[12px] text-white"
        />
      </div>
      <div className="mt-4">
        <TreeTable
           className="bg-BgPrimaryColor border rounded border-BorderColor product-tree-table"
           columns={columns}
           data={data}
           skip={skip}
           rows={limit}
           total={total}
           paginationChangeHandler={paginationChangeHandler}
           loader={loader}
           showGridlines={true}
        />
      </div>
      
      {/* Custom CSS for TreeTable accordion arrow alignment and fixed layout */}
      <style jsx>{`
        :global(.product-tree-table table) {
          table-layout: fixed;
          width: 100%;
        }
        :global(.product-tree-table .p-treetable-toggler) {
          vertical-align: middle;
          margin-right: 0.5rem;
        }
        :global(.product-tree-table .p-treetable-tbody > tr > td) {
          vertical-align: middle;
        }
      `}</style>

      {/* Product Variant Dialog */}
      {variantDialogVisible && selectedProduct && (
        <ProductVariantDialog
          visible={variantDialogVisible}
          onHide={closeVariantDialog}
          product={selectedProduct}
          toast={toast}
        />
      )}
      <Dialog
        draggable={false}
        visible={visible}
        modal
        header={headerElement}
        footer={footerContent}
        style={{ width: '40rem' }}
        onHide={() => {if (!visible) return; setVisible(false); }}
      >
        <div className="bulk-upload-content">
          {/* Instructions Section */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-sm font-semibold text-blue-800 mb-2">📋 Upload Instructions</h4>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Download the template first and fill in your product data</li>
              <li>• Supported formats: XLSX, XLS, CSV</li>
              <li>• Required fields: Sub Category, Product Name, Price, Weight</li>
              <li>• Make sure sub-category names match exactly</li>
            </ul>
          </div>

          {/* File Upload Section */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select File to Upload
            </label>

            {!bulkUploadFile ? (
              // File Drop Zone
              <div className="relative">
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) => setBulkUploadFile(e.target.files[0])}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 hover:bg-blue-50 transition-colors">
                  <div className="flex flex-col items-center">
                    <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">
                      XLSX, XLS or CSV files only
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              // File Selected Display
              <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {bulkUploadFile.name.endsWith('.csv') ? (
                        <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {bulkUploadFile.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(bulkUploadFile.size / 1024).toFixed(1)} KB • {bulkUploadFile.type || 'Unknown type'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ps-2">
                    {/* Change File Button */}
                    <div className="relative">
                      <input
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={(e) => setBulkUploadFile(e.target.files[0])}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <button className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        Change
                      </button>
                    </div>
                    {/* Remove File Button */}
                    <button
                      onClick={() => setBulkUploadFile(null)}
                      className="inline-flex items-center px-3 py-1.5 border border-red-300 shadow-sm text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default ProductList;
