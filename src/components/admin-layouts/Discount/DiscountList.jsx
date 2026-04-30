// utils
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Toast } from "primereact/toast";

// components
import Breadcrum from "@common/Breadcrum";
import DataTable from "@common/DataTable";
import ButtonComponent from "@common/ButtonComponent";
import Confirmbox from "@common/Confirmbox";
import { allApiWithHeaderToken } from "@api/api";
import { ROUTES_CONSTANTS } from "@constants/routesurl";
import { API_CONSTANTS } from "@constants/apiurl";
import { refactorPrefilledDate } from '@helper';

const DiscountList = ({search}) => {
  const toast = useRef(null);
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
    heading: t("discount"),
    routes: [
      { label: t("dashboard"), route: ROUTES_CONSTANTS.DASHBOARD },
      { label: t("discount"), route: ROUTES_CONSTANTS.DISCOUNT },
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

  const checkValidDate=(endDate)=>{
    if(new Date() < new Date(endDate)){
      return true;
    }
  }

  const statusBodyTemplate= (rowData) => {
    return (
      <div className="flex items-center gap-4">
        { checkValidDate(rowData?.end_date) ? <span className="text-[green]">Active</span> : <span className="text-[red]">Inactive</span>}
      </div>
    );
  };

  const targetsBodyTemplate = (rowData) => {
    const targets = rowData?.targets || [];
    
    if (targets.length === 0) {
      return <span className="text-gray-400">No targets</span>;
    }

    // Group targets by type
    const productTargets = targets.filter(t => t.target_type === 'product');
    const categoryTargets = targets.filter(t => t.target_type === 'category');
    const cartTargets = targets.filter(t => t.target_type === 'cart');

    return (
      <div className="flex flex-wrap gap-2">
        {cartTargets.length > 0 && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Cart-wide
          </span>
        )}
        
        {categoryTargets.length > 0 && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            Category: {categoryTargets[0].target_name}
            {categoryTargets.length > 1 && ` +${categoryTargets.length - 1}`}
          </span>
        )}
        
        {productTargets.length > 0 && (
          <span 
            className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 cursor-help"
            title={productTargets.map(t => t.target_name).join(', ')}
          >
            Product ({productTargets.length})
            <i className="ri-information-line text-sm"></i>
          </span>
        )}
      </div>
    );
  };

  const columns = [
    { field: "name", header: t("name"), bodyClassName: "font-semibold"},
    { field: "code", header: t("code"), body: (rowData) => rowData.code || <span className="text-gray-400">No Code</span>},
    { header: t("type"), body: (rowData) => (
      <span className={`px-2 py-1 rounded text-xs font-medium ${
        rowData.discount_type === 'percentage' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
      }`}>
        {rowData.discount_type === 'percentage' ? 'Percentage' : 'Flat Amount'}
      </span>
    )},
    { header: t("value"), body: (rowData) => (
      <span className="font-semibold">
        {rowData.discount_type === 'percentage' ? `${rowData.value}%` : `₹${rowData.value}`}
      </span>
    )},
    { header: t("targets"), body: targetsBodyTemplate},
    { header: t("usage"), body: (rowData) => `${rowData.current_usage_count || 0} / ${rowData.usage_limit || '∞'}`},
    { header: t("status"), body: statusBodyTemplate },
    { header: t("action"), body: actionBodyTemplate, headerStyle: { paddingLeft: '3%'} },
  ];

  const editDiscount = (item) => {
    navigate(`${ROUTES_CONSTANTS.EDIT_DISCOUNT}/${item?.id}`);
  };

  const confirmDeleteDiscount = (item) => {
    setIsConfirm(!isConfirm);
    setDeleteId(item?.id);
  };

  const closeDialogbox = () => {
    setDeleteId(null);
    setIsConfirm(!isConfirm);
  };

  const confirmDialogbox = () => {
    setLoader(true);
    setIsConfirm(!isConfirm);
    allApiWithHeaderToken(`${API_CONSTANTS.COMMON_DISCOUNT_URL}/${deleteId}`, '', "delete")
      .then((response) => {
        if (response.status === 200) {
          fetchDiscountList();
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

  const fetchDiscountList = (sk=skip, li=limit) => {
    setLoader(true);
    let body = {
      search: search,
      skip: sk,
      limit: li
    }
    allApiWithHeaderToken(`${API_CONSTANTS.DISCOUNTS}/filter`, body , "post")
      .then((response) => {
        if (response.status === 200) {
          let updatedArray = [];
          response?.data.data?.forEach((item)=>{
            // Extract attributes from JSONAPI format
            const attributes = item.attributes || item;
            let obj = {
              id: item.id || attributes.id,
              name: attributes.name,
              code: attributes.code,
              discount_type: attributes.discount_type,
              value: attributes.value,
              max_discount_amount: attributes.max_discount_amount,
              min_cart_value: attributes.min_cart_value,
              start_at: attributes.start_at,
              end_at: attributes.end_at,
              is_active: attributes.is_active,
              usage_limit: attributes.usage_limit,
              per_user_limit: attributes.per_user_limit,
              current_usage_count: attributes.current_usage_count,
              targets: attributes.targets || [],
              conditions: attributes.conditions || [],
              usage_stats: attributes.usage_stats || {}
            }
            updatedArray.push(obj)
          })
          setData(updatedArray);
          setTotal(response?.data?.total);
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

  const paginationChangeHandler = (skip, limit) => {
    setSkip(skip);
    setLimit(limit);
    fetchDiscountList(skip, limit);
  };

  const createDiscount = () => {
    navigate(ROUTES_CONSTANTS.CREATE_DISCOUNT);
  };

  useEffect(() => {
    fetchDiscountList(0,10);
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
      <div className="mt-4 flex justify-end bg-BgSecondaryColor border rounded border-BorderColor p-2">
        <ButtonComponent
          onClick={() => createDiscount()}
          type="submit"
          label={t("create_discount")}
          className="rounded bg-TextPrimaryColor px-6 py-2 text-[12px] text-white"
          icon="pi pi-arrow-right"
          iconPos="right"
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

export default DiscountList;
