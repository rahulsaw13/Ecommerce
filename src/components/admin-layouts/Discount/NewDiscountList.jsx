// hooks
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Toast } from "primereact/toast";
import { Tag } from "primereact/tag";
import { OverlayPanel } from 'primereact/overlaypanel';

// components
import Breadcrum from "@common/Breadcrum";
import DataTable from "@common/DataTable";
import ButtonComponent from "@common/ButtonComponent";
import Confirmbox from "@common/Confirmbox";
import { allApiWithHeaderToken } from "@api/api";
import { ROUTES_CONSTANTS } from "@constants/routesurl";
import { API_CONSTANTS } from "@constants/apiurl";

const NewDiscountList = ({ search }) => {
  const toast = useRef(null);
  const overlayPanelRefs = useRef({});
  const { t } = useTranslation("msg");
  const navigate = useNavigate();
  const [isConfirm, setIsConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [loader, setLoader] = useState(false);
  const [skip, setSkip] = useState(0);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [data, setData] = useState([]);

  const item = {
    heading: t("discounts"),
    routes: [
      { label: t("dashboard"), route: ROUTES_CONSTANTS.DASHBOARD },
      { label: t("discounts"), route: ROUTES_CONSTANTS.DISCOUNTS },
    ],
  };

  const actionBodyTemplate = (rowData) => {
    return (
      <div className="flex gap-2">
        <ButtonComponent
          icon="ri-pencil-line"
          className="p-button-rounded p-button-text text-[1.2rem] bg-gray-50 hover:bg-gray-100 text-gray-700 w-9 h-9 flex items-center justify-center"
          onClick={() => editDiscount(rowData)}
          tooltip="Edit"
        />
        <ButtonComponent
          icon="ri-delete-bin-line"
          className="p-button-rounded p-button-text text-[1.2rem] bg-red-50 hover:bg-red-100 text-red-600 w-9 h-9 flex items-center justify-center"
          onClick={() => confirmDeleteDiscount(rowData)}
          tooltip="Delete"
        />
      </div>
    );
  };

  const statusBodyTemplate = (rowData) => {
    return (
      <div className="flex items-center">
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          rowData?.is_active
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        }`}>
          {rowData?.is_active ? t("active") : t("inactive")}
        </span>
      </div>
    );
  };

  const typeBodyTemplate = (rowData) => {
    return (
      <div className="flex items-center">
        <Tag 
          value={rowData?.discount_type === 'percentage' ? 'Percentage' : 'Flat'} 
          severity={rowData?.discount_type === 'percentage' ? 'info' : 'warning'} 
        />
      </div>
    );
  };

  const valueBodyTemplate = (rowData) => {
    return (
      <div className="font-medium text-xs">
        {rowData?.discount_type === 'percentage' 
          ? `${rowData?.value}%` 
          : `$${rowData?.value}`}
      </div>
    );
  };

  const codeBodyTemplate = (rowData) => {
    return (
      <div>
        {rowData?.code ? (
          <Tag value={rowData.code} severity="success" />
        ) : (
          <span className="text-xs text-gray-400">No code</span>
        )}
      </div>
    );
  };

  const usageBodyTemplate = (rowData) => {
    const usage = rowData?.usage_stats;
    return (
      <div className="font-medium text-xs">
        {usage?.total_usage || 0}
        {rowData?.usage_limit && ` / ${rowData.usage_limit}`}
      </div>
    );
  };

  const targetsBodyTemplate = (rowData) => {
    const targets = rowData?.targets || [];
    
    if (targets.length === 0) {
      return <span className="text-xs text-gray-400">No targets</span>;
    }

    // Group targets by type
    const productTargets = targets.filter(t => t.target_type === 'product');
    const categoryTargets = targets.filter(t => t.target_type === 'category');
    const cartTargets = targets.filter(t => t.target_type === 'cart');

    const getOverlayPanelRef = (id) => {
      if (!overlayPanelRefs.current[id]) {
        overlayPanelRefs.current[id] = React.createRef();
      }
      return overlayPanelRefs.current[id];
    };

    return (
      <div className="flex flex-wrap gap-2">
        {cartTargets.length > 0 && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Cart-wide
          </span>
        )}
        
        {categoryTargets.length > 0 && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            Category
            {categoryTargets.length > 1 && ` (${categoryTargets.length})`}
          </span>
        )}
        
        {productTargets.length > 0 && (
          <>
            <span 
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 cursor-pointer hover:bg-green-200 transition-colors"
              onClick={(e) => getOverlayPanelRef(`product-${rowData.id}`).current?.toggle(e)}
            >
              Product ({productTargets.length})
              <i className="ri-information-line text-sm"></i>
            </span>
            <OverlayPanel 
              ref={getOverlayPanelRef(`product-${rowData.id}`)}
              className="w-64"
            >
              <div className="p-2">
                <div className="text-sm font-semibold text-gray-700 mb-2 pb-2 border-b border-gray-200">
                  Products ({productTargets.length})
                </div>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {productTargets.map((target, index) => (
                    <div 
                      key={index} 
                      className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 transition-colors"
                    >
                      <i className="ri-checkbox-circle-fill text-green-500 text-sm"></i>
                      <span className="text-xs text-gray-700">{target.target_name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </OverlayPanel>
          </>
        )}
      </div>
    );
  };

  const columns = [
    { field: "name", header: t("name"), bodyClassName: "font-semibold", style: { width: "15%" } },
    { header: t("code"), body: codeBodyTemplate, style: { width: "10%" } },
    { header: t("type"), body: typeBodyTemplate, style: { width: "10%" } },
    { header: t("value"), body: valueBodyTemplate, style: { width: "10%" } },
    { header: t("targets"), body: targetsBodyTemplate, style: { width: "20%" } },
    { header: t("usage"), body: usageBodyTemplate, style: { width: "10%" } },
    { header: t("status"), body: statusBodyTemplate, style: { width: "12%" } },
    { header: t("action"), body: actionBodyTemplate, headerStyle: { paddingLeft: '3%' }, style: { width: "13%" } },
  ];

  const viewDiscount = (item) => {
    navigate(`${ROUTES_CONSTANTS.VIEW_DISCOUNT}/${item?.id}`);
  };

  const editDiscount = (item) => {
    navigate(`${ROUTES_CONSTANTS.EDIT_DISCOUNT}/${item?.id}`);
  };

  const confirmDeleteDiscount = (item) => {
    setDeleteId(item?.id);
    setIsConfirm(true);
  };

  const closeDialogbox = () => {
    setDeleteId(null);
    setIsConfirm(false);
  };

  const confirmDialogbox = () => {
    setLoader(true);
    setIsConfirm(false);
    allApiWithHeaderToken(`${API_CONSTANTS.DISCOUNTS}/${deleteId}`, "", "delete")
      .then((response) => {
        if (response.status === 204) {
          toast.current.show({
            severity: "success",
            summary: t("success"),
            detail: t("discount_deleted_successfully"),
            life: 3000,
          });
          fetchDiscounts();
        }
      })
      .catch((err) => {
        toast.current.show({
          severity: "error",
          summary: t("error"),
          detail: err?.response?.data?.errors || t("failed_to_delete_discount"),
          life: 3000,
        });
        setLoader(false);
      });
  };

  const fetchDiscounts = (sk = skip, li = limit) => {
    setLoader(true);
    let body = {
      search: search,
      skip: sk,
      limit: li
    };
    
    allApiWithHeaderToken(`${API_CONSTANTS.DISCOUNTS}/filter`, body, "post")
      .then((response) => {
        if (response.status === 200) {
          // Extract data from JSONAPI format
          const discounts = response?.data?.data?.map(item => {
            const attributes = item.attributes || item;
            return {
              id: item.id || attributes.id,
              ...attributes
            };
          }) || [];
          
          setData(discounts);
          setTotal(response?.data?.total);
        }
      })
      .catch((err) => {
        toast.current.show({
          severity: "error",
          summary: t("error"),
          detail: err?.response?.data?.errors || t("failed_to_fetch_discounts"),
          life: 3000,
        });
      })
      .finally(() => {
        setLoader(false);
      });
  };

  const createDiscount = () => {
    navigate(ROUTES_CONSTANTS.ADD_DISCOUNT);
  };

  useEffect(() => {
    fetchDiscounts(0, 10);
  }, [search]);

  const paginationChangeHandler = (skip, limit) => {
    setSkip(skip);
    setLimit(limit);
    fetchDiscounts(skip, limit);
  };

  return (
    <div className="text-TextPrimaryColor">
      <Toast ref={toast} position="top-right" />
      <Confirmbox
        isConfirm={isConfirm}
        closeDialogbox={closeDialogbox}
        confirmDialogbox={confirmDialogbox}
      />
      <Breadcrum item={item} />
      <div className="mt-4 flex justify-end gap-4 bg-BgSecondaryColor border rounded border-BorderColor p-2">
        <ButtonComponent
          onClick={createDiscount}
          type="submit"
          label={t("add_discount")}
          className="rounded bg-TextPrimaryColor px-6 py-2 text-[12px] text-white"
        />
      </div>
      <div className="mt-4">
        <DataTable
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
    </div>
  );
};

export default NewDiscountList;
