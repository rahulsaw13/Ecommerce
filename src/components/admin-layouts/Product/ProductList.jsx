// utils
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Toast } from "primereact/toast";

// components
import Breadcrum from "@common/Breadcrum";
import Datatable from "@common/DataTable";
import ButtonComponent from "@common/ButtonComponent";
import Confirmbox from "@common/Confirmbox";
import { allApiWithHeaderToken } from "@api/api";
import { ROUTES_CONSTANTS } from "@constants/routesurl";
import { API_CONSTANTS } from "@constants/apiurl";

import Loading from '@common/Loading';
import Image from "@common/Image";
import DefaultImage from "@assets/no-image.jpeg";
import ProductVariantDialog from "./ProductVariantDialog";

const ProductList = ({search}) => {
  const toast = useRef(null);
  const [treeData, setTreeData] = useState([]);
  const { t } = useTranslation("msg");
  const navigate = useNavigate();
  const [isConfirm, setIsConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [loader, setLoader] = useState(false);
  const [variantDialogVisible, setVariantDialogVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
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

  // Flatten tree data: each variant becomes its own row with parent product info
  const data = useMemo(() => {
    const flat = [];
    treeData.forEach(product => {
      const p = product.data || product;
      if (product.children && product.children.length > 0) {
        product.children.forEach(child => {
          const v = child.data || child;
          flat.push({
            product_id: p.id,
            variant_id: v.variant_id,
            name: p.name,
            image_url: p.thumbnail_url || p.image_url,
            description: p.description,
            weight: v.weight_display || v.weight || '-',
            mrp: v.mrp || 0,
            price: v.price || 0,
            shelf_life: v.shelf_life,
            status: v.status,
          });
        });
      } else {
        flat.push({
          product_id: p.id,
          variant_id: null,
          name: p.name,
          image_url: p.thumbnail_url || p.image_url,
          description: p.description,
          weight: '-',
          mrp: 0,
          price: 0,
          shelf_life: null,
          status: p.status,
        });
      }
    });
    return flat;
  }, [treeData]);

  const nameBodyTemplate = (rowData) => (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 overflow-hidden rounded-lg flex-shrink-0 border border-gray-200">
        <Image
          src={rowData.image_url || DefaultImage}
          alt="Product"
          width={40}
          height={40}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="flex flex-col gap-1">
        <span className="font-semibold text-gray-800 text-[11px]">{rowData.name}</span>
        {rowData.weight && rowData.weight !== '-' && (
          <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded w-fit">
            {rowData.weight}
          </span>
        )}
      </div>
    </div>
  );

  const mrpBodyTemplate = (rowData) => (
    <span className="font-semibold text-gray-700 text-sm">
      {rowData.mrp > 0 ? `₹${parseFloat(rowData.mrp).toFixed(2)}` : '-'}
    </span>
  );

  const sellingPriceBodyTemplate = (rowData) => (
    <span className="font-semibold text-green-700 text-sm">
      {rowData.price > 0 ? `₹${parseFloat(rowData.price).toFixed(2)}` : '-'}
    </span>
  );

  const stripHtml = (html) => {
    if (!html) return '-';
    return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim() || '-';
  };

  const descriptionBodyTemplate = (rowData) => (
    <span className="text-gray-600 text-xs line-clamp-2">{stripHtml(rowData.description)}</span>
  );

  const statusBodyTemplate = (rowData) => (
    rowData.status === 1
      ? <span className="text-green-600 font-medium text-xs">Active</span>
      : <span className="text-red-500 font-medium text-xs">Inactive</span>
  );

  const editProduct = (item) => {
    navigate(`${ROUTES_CONSTANTS.EDIT_PRODUCT}/${item?.product_id}`);
  };

  const openVariantDialog = (item) => {
    setSelectedProduct(item);
    setVariantDialogVisible(true);
  };

  const closeVariantDialog = () => {
    setVariantDialogVisible(false);
    setSelectedProduct(null);
    fetchProductList();
  };

  const confirmDeleteProduct = (item) => {
    setIsConfirm(true);
    setDeleteId(item?.product_id);
  };

  const toggleVariantStatus = (rowData) => {
    const newStatus = rowData.status === 1 ? 0 : 1;
    setLoader(true);
    allApiWithHeaderToken(
      `api/v1/product_variants/${rowData.variant_id}`,
      { product_variant: { status: newStatus } },
      "patch"
    )
      .then((response) => {
        if (response?.status === 200) {
          toast.current.show({ severity: "success", summary: "Success", detail: `Variant marked ${newStatus === 1 ? 'active' : 'inactive'}`, life: 3000 });
          fetchProductList();
        }
      })
      .catch(() => toast.current.show({ severity: "error", summary: "Error", detail: "Failed to update variant status", life: 3000 }))
      .finally(() => setLoader(false));
  };

  const actionBodyTemplate = (rowData) => (
    <div className="flex gap-2">
      <ButtonComponent
        icon="ri-pencil-line"
        className="p-button-rounded p-button-text text-[1.2rem] bg-gray-50 hover:bg-gray-100 text-gray-700 w-9 h-9 flex items-center justify-center"
        onClick={() => editProduct(rowData)}
        tooltip="Edit"
      />
      <ButtonComponent
        icon="ri-delete-bin-line"
        className="p-button-rounded p-button-text text-[1.2rem] bg-red-50 hover:bg-red-100 text-red-600 w-9 h-9 flex items-center justify-center"
        onClick={() => confirmDeleteProduct(rowData)}
        tooltip="Delete"
      />
      {rowData.variant_id && (
        <ButtonComponent
          icon={rowData.status === 1 ? "ri-toggle-line" : "ri-toggle-fill"}
          className={`p-button-rounded p-button-text text-[1.2rem] w-9 h-9 flex items-center justify-center ${rowData.status === 1 ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-600'}`}
          onClick={() => toggleVariantStatus(rowData)}
          tooltip={rowData.status === 1 ? "Make Inactive" : "Make Active"}
        />
      )}
    </div>
  );

  const columns = [
    {
      field: "name",
      header: t("name"),
      body: nameBodyTemplate,
      headerStyle: { width: '28%' },
      style: { width: '28%' },
    },
    {
      field: "mrp",
      header: "MRP",
      body: mrpBodyTemplate,
      headerStyle: { width: '10%', textAlign: 'left' },
      style: { width: '10%' },
    },
    {
      field: "price",
      header: "Selling Price",
      body: sellingPriceBodyTemplate,
      headerStyle: { width: '12%', textAlign: 'left' },
      style: { width: '12%' },
    },
    {
      field: "description",
      header: t("description"),
      body: descriptionBodyTemplate,
      headerStyle: { width: '35%', textAlign: 'left' },
      style: { width: '35%' },
    },
    {
      header: t("status"),
      body: statusBodyTemplate,
      headerStyle: { width: '15%', textAlign: 'left' },
      style: { width: '15%' },
    },
    // { header: t("action"), body: actionBodyTemplate, headerStyle: { width: '15%' }, style: { width: '15%' } },
  ];

  const closeDialogbox = () => {
    setDeleteId(null);
    setIsConfirm(!isConfirm);
  };

  const confirmDialogbox = () => {
    setLoader(true);
    setIsConfirm(!isConfirm);
    allApiWithHeaderToken(`${API_CONSTANTS.COMMON_PRODUCTS_URL}/${deleteId}`, "", "delete")
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

  const fetchProductList = useCallback((sk = skip, li = limit) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoader(true);
    allApiWithHeaderToken(
      `${API_CONSTANTS.COMMON_PRODUCTS_URL}/filter`,
      { search, skip: sk, limit: li, grouped: 'true' },
      "post",
      { signal: abortControllerRef.current.signal }
    )
      .then((response) => {
        if (response?.status === 200) {
          setTreeData(response?.data?.data || []);
          setTotal(response?.data?.total);
        }
      })
      .catch((err) => {
        if (err.name === 'CanceledError' || err.name === 'AbortError') return;
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
  }, [search, skip, limit]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchProductList(0, 10);
    }, 300);

    return () => {
      clearTimeout(debounceTimer);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [search]);

  return (
    <div className="text-TextPrimaryColor">
      <Toast ref={toast} position="top-right" />
      <Confirmbox
        isConfirm={isConfirm}
        closeDialogbox={closeDialogbox}
        confirmDialogbox={confirmDialogbox}
      />
      <Breadcrum item={item} />
      <div className="mt-4">
        <Datatable
          className="bg-BgPrimaryColor border rounded border-BorderColor"
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

      {variantDialogVisible && selectedProduct && (
        <ProductVariantDialog
          visible={variantDialogVisible}
          onHide={closeVariantDialog}
          product={selectedProduct}
          toast={toast}
        />
      )}
    </div>
  );
};

export default ProductList;
