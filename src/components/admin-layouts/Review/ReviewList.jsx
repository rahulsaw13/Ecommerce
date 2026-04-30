// hooks
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

const ReviewList = ({search}) => {
  const toast = useRef(null);
  const { t } = useTranslation("msg");
  const navigate = useNavigate();
  const [isConfirm, setIsConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [loader, setLoader] = useState(false);
  const [skip, setSkip] = useState(0);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  const item = {
    heading: t("review"),
    routes: [
      { label: t("dashboard"), route: ROUTES_CONSTANTS.DASHBOARD },
      { label: t("review"), route: ROUTES_CONSTANTS.REVIEWS },
    ],
  };

  const [data, setData] = useState([]);

  const actionBodyTemplate = (rowData) => {
    return (
      <div className="flex gap-2">
        <ButtonComponent
          icon="ri-delete-bin-line"
          className="p-button-rounded p-button-text text-[1.2rem] bg-red-50 hover:bg-red-100 text-red-600 w-9 h-9 flex items-center justify-center"
          onClick={() => confirmDeleteReview(rowData)}
          tooltip="Delete"
        />
      </div>
    );
  };

  const verifiedBodyTemplate= (rowData) => {
    return (
      <div className="flex items-center">
      {rowData?.is_verified === 1 ? <span className="text-[green]">Verified</span> : <span className="text-[#5e5ed8]">Not Verified</span>}
    </div>
    );
  };

  const ratingBodyTemplate= (rowData) => {
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((item, index)=>{
          if(rowData?.rating <= index){
            return(<i className="ri-star-line" key={index}></i>)
          }
          else{
            return(<i className="ri-star-fill" key={index}></i>)
          }
        })}
      </div>
    );
  };

  const createdAtBodyTemplate= (rowData) => {
    return (
      <div className="flex items-center">
        <span>{refactorPrefilledDate(rowData?.created_at)}</span>
      </div>
    );
  };

  const columns = [
    { field: "name", header: t("user_name"), bodyClassName: "font-semibold"},
    { field: "product_data.name", header: t("product_name")},
    { field: "review_text", header: t("review_text"), bodyClassName: "font-semibold"},
    { field: "created_at", body: createdAtBodyTemplate, header: t("created_at")},
    { field: "is_verfied", body: verifiedBodyTemplate, header: t("verfied")},
    { field: "rating", body: ratingBodyTemplate, header: t("rating")},
    { header: t("action"), body: actionBodyTemplate, headerStyle: { paddingLeft: '3%'} },
  ];

  const confirmDeleteReview = (item) => {
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
    allApiWithHeaderToken(`${API_CONSTANTS.COMMON_PRODUCT_REVIEW_URL}/${deleteId}`, '', "delete")
      .then((response) => {
        if (response.status === 200) {
          fetchReviewList();
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

  const fetchReviewList = (sk=skip, li=limit) => {
    setLoader(true);
    let body = {
      search: search,
      skip: sk,
      limit: li
    }
    allApiWithHeaderToken(`${API_CONSTANTS.COMMON_PRODUCT_REVIEW_URL}/filter`, body , "post")
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

  useEffect(() => {
    fetchReviewList(0,10);
  }, [search]);

  const paginationChangeHandler = (skip, limit) => {
    setSkip(skip);
    setLimit(limit);
    fetchReviewList(skip, limit);
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
          {t("user_review_on_products")}  
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

export default ReviewList;