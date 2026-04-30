// hooks
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

// components
import Breadcrum from "@common/Breadcrum";
import DataTable from "@common/DataTable";
import ButtonComponent from "@common/ButtonComponent";
import DropdownComponent from "@common/DropdownComponent";
import Confirmbox from "@common/Confirmbox";
import { allApiWithHeaderToken } from "@api/api";
import { ROUTES_CONSTANTS } from "@constants/routesurl";
import { API_CONSTANTS } from "@constants/apiurl";
import { Toast } from "primereact/toast";

const UserList = ({search}) => {
  const toast = useRef(null);
  const { t } = useTranslation("msg");
  const [isConfirm, setIsConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [loader, setLoader] = useState(false);
  const navigate = useNavigate();
  const [skip, setSkip] = useState(0);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  const item = {
    heading: t("customer"),
    routes: [
      { label: t("dashboard"), route: ROUTES_CONSTANTS.DASHBOARD },
      { label: t("customer"), route: ROUTES_CONSTANTS.CUSTOMERS },
    ],
  };

  const [data, setData] = useState([]);

  const editCustomer = (item) => {
    navigate(`${ROUTES_CONSTANTS.EDIT_CUSTOMER}/${item?.id}`);
  };

  const actionBodyTemplate = (rowData) => {
    return (
      <div className="flex gap-2">
        <ButtonComponent
          icon="ri-pencil-line"
          className="p-button-rounded p-button-text text-[1.2rem] bg-gray-50 hover:bg-gray-100 text-gray-700 w-9 h-9 flex items-center justify-center"
          onClick={() => editCustomer(rowData)}
          tooltip="Edit"
        />
        <ButtonComponent
          icon={rowData.is_active ? "ri-close-circle-line" : "ri-checkbox-circle-line"}
          className={`p-button-rounded p-button-text text-[1.2rem] w-9 h-9 flex items-center justify-center ${
            rowData.is_active 
              ? 'bg-orange-50 hover:bg-orange-100 text-orange-600' 
              : 'bg-green-50 hover:bg-green-100 text-green-600'
          }`}
          onClick={() => toggleCustomerStatus(rowData)}
          tooltip={rowData.is_active ? "Deactivate" : "Activate"}
        />
        <ButtonComponent
          icon="ri-delete-bin-line"
          className="p-button-rounded p-button-text text-[1.2rem] bg-red-50 hover:bg-red-100 text-red-600 w-9 h-9 flex items-center justify-center"
          onClick={() => confirmDeleteCustomer(rowData)}
          tooltip="Delete"
        />
      </div>
    );
  };


  const addressBodyTemplate = (rowData) => {
    // Warehouse supervisors don't need address details
    if (rowData.role_id === 3) {
      return <span className="text-xs text-blue-600">{t("not_applicable")}</span>;
    }

    if (rowData.address) {
      return (
        <div className="flex flex-col">
          <span className="font-medium text-xs">{rowData.address.city}</span>
          <span className="text-xs text-gray-600">{rowData.address.state}</span>
        </div>
      );
    }
    return <span className="text-xs text-gray-400">{t("no_address")}</span>;
  };

  const statusBodyTemplate = (rowData) => {
    return (
      <div className="flex items-center">
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          rowData.is_active
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        }`}>
          {rowData.is_active ? t("active") : t("inactive")}
        </span>
      </div>
    );
  };


  const phoneEmailBodyTemplate = (rowData) => {
    if (rowData.phone_number || rowData.email) {
      return (
        <div className="flex flex-col">
          <span className="font-medium text-xs">{rowData?.phone_number || "-"}</span>
          <span className="text-xs text-gray-600">{rowData?.email || "-"}</span>
        </div>
      );
    }
    return <span className="text-xs text-gray-400">-</span>;
  };

  const columns = [
    { field: "name", header: t("name"), bodyClassName: "font-semibold", style: { width: "22%" }},
    { 
      header: t("phone_number_email"), 
      body: phoneEmailBodyTemplate, 
      style: { width: "20%" }, 
      headerStyle: { width: "20%" } 
    },
    { header: t("address"), body: addressBodyTemplate, style: { width: "30%" }},
    { 
      header: t("status"), 
      body: statusBodyTemplate,
      style: { width: "12%" }
    },
    { 
      header: t("action"), 
      body: actionBodyTemplate, 
      headerStyle: { paddingLeft: '3%'},
      style: { width: "16%" }
    },
  ];

  const toggleCustomerStatus = (item) => {
    const newStatus = !item.is_active;
    setLoader(true);
    
    const body = {
      is_active: newStatus
    };

    allApiWithHeaderToken(`${API_CONSTANTS.COMMON_CUSTOMERS_URL}/${item.id}`, body, "put")
      .then((response) => {
        if (response.status === 200) {
          toast.current.show({
            severity: "success",
            summary: "Success",
            detail: `Customer ${newStatus ? 'activated' : 'deactivated'} successfully`,
            life: 3000,
          });
          fetchCustomerList();
        }
      })
      .catch((err) => {
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: err?.response?.data?.errors || "Failed to update customer status",
          life: 3000,
        });
        setLoader(false);
      });
  };

  const confirmDeleteCustomer = (item) => {
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
    allApiWithHeaderToken(`${API_CONSTANTS.COMMON_CUSTOMERS_URL}/${deleteId}`, '', "delete")
      .then((response) => {
        if (response.status === 200) {
          fetchCustomerList();
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

  const fetchCustomerList = (sk=skip, li=limit) => {
    setLoader(true);
    let body = {
      search: search,
      skip: sk,
      limit: li
    }
    allApiWithHeaderToken(`${API_CONSTANTS.COMMON_CUSTOMERS_URL}/filter`, body , "post")
      .then((response) => {
        if (response.status === 200) {
          setData(response?.data?.data);
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

  const createCustomer = ()=>{
    navigate(ROUTES_CONSTANTS.CREATE_CUSTOMER);
  }

  useEffect(() => {
    fetchCustomerList(0,10);
  }, [search]);

  const paginationChangeHandler = (skip, limit) => {
    setSkip(skip);
    setLimit(limit);
    fetchCustomerList(skip, limit);
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
          onClick={() => createCustomer()}
          type="submit"
          label={t("create_customer")}
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

export default UserList;
