// hooks
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Toast } from "primereact/toast";

// components
import Breadcrum from "@common/Breadcrum";
import DataTable from "@common/DataTable";
import Confirmbox from "@common/Confirmbox";
import { allApiWithHeaderToken } from "@api/api";
import { ROUTES_CONSTANTS } from "@constants/routesurl";
import ButtonComponent from "@common/ButtonComponent";
import { API_CONSTANTS } from "@constants/apiurl";
import { refactorPrefilledDate } from '@helper';

const CustomerEnquiryList = ({search}) => {
  const toast = useRef(null);
  const { t } = useTranslation("msg");
  const [loader, setLoader] = useState(false);
  const [isConfirm, setIsConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [skip, setSkip] = useState(0);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  const item = {
    heading: t("customer_enquiries"),
    routes: [
      { label: t("dashboard"), route: ROUTES_CONSTANTS.DASHBOARD },
      { label: t("customer_enquiries"), route: ROUTES_CONSTANTS.CUSTOMER_ENQUIRIES },
    ],
  };

  const [data, setData] = useState([]);

  const dateBodyTemplate= (rowData) => {
    return (
      <>
        {refactorPrefilledDate(rowData?.created_at)}
      </>
    );
  };

  const actionBodyTemplate = (rowData) => {
    return (
      <div className="flex gap-2">
        <ButtonComponent
          icon="ri-delete-bin-line"
          className="p-button-rounded p-button-text text-[1.2rem] bg-red-50 hover:bg-red-100 text-red-600 w-9 h-9 flex items-center justify-center"
          onClick={() => confirmDeleteCoupon(rowData)}
          tooltip="Delete"
        />
      </div>
    );
  };

  const columns = [
    { field: "name", header: t("name"), bodyClassName: "font-semibold"},
    { field: "message", header: t("message"), style: {width: "300px"}},
    { field: "phone_number", header: t("phone_number")},
    { field: "email", header: t("email"), style: {width: "180px"}},
    { header: t("submitted_date"), body: dateBodyTemplate},
    { header: t("action"), body: actionBodyTemplate, headerStyle: { paddingLeft: '3%'} },
  ];

  const confirmDeleteCoupon = (item) => {
    setIsConfirm(!isConfirm);
    setDeleteId(item?.id);
  };

  const fetchCustomerEnquiryList = (sk=skip, li=limit) => {
    setLoader(true);
    let body = {
      search: search,
      skip: sk,
      limit: li
    }
    allApiWithHeaderToken(`${API_CONSTANTS.COMMON_CUSTOMER_ENQUIRY_URL}/filter`, body , "post")
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

  const confirmDialogbox = () => {
    setIsConfirm(!isConfirm);
    setLoader(true);
    allApiWithHeaderToken(`${API_CONSTANTS.COMMON_CUSTOMER_ENQUIRY_URL}/${deleteId}`, '', "delete")
      .then((response) => {
        if (response.status === 200) {
          fetchCustomerEnquiryList();
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
  
  const closeDialogbox = () => {
    setDeleteId(null);
    setIsConfirm(!isConfirm);
  };

  useEffect(() => {
    fetchCustomerEnquiryList(0,10);
  }, [search]);

  const paginationChangeHandler = (skip, limit) => {
    setSkip(skip);
    setLimit(limit);
    fetchCustomerEnquiryList(skip, limit);
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
      <div className="mt-4 flex justify-start bg-BgSecondaryColor border rounded border-BorderColor p-2 py-3">
        <span className="text-[13px] text-TextPrimaryColor ms-[4px] font-[600]">
          {t("customer_enquiries")}  
        </span> 
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

export default CustomerEnquiryList;