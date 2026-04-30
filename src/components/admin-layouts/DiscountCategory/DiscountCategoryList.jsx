// hooks
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

// components
import Breadcrum from "@common/Breadcrum";
import DataTable from "@common/DataTable";
import ButtonComponent from "@common/ButtonComponent";
import Confirmbox from "@common/Confirmbox";
import { allApiWithHeaderToken } from "@api/api";
import { ROUTES_CONSTANTS } from "@constants/routesurl";
import { API_CONSTANTS } from "@constants/apiurl";
import { Toast } from "primereact/toast";

const DiscountCategoryList = ({search}) => {
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
    heading: t("discount_category"),
    routes: [
      { label: t("dashboard"), route: ROUTES_CONSTANTS.DASHBOARD },
      { label: t("discount_category"), route: ROUTES_CONSTANTS.DISCOUNT_CATEGORIES },
    ],
  };

  const [data, setData] = useState([]);

  const editDiscountCategory = (item) => {
    navigate(`${ROUTES_CONSTANTS.EDIT_DISCOUNT_CATEGORY}/${item?.id}`);
  };

  const actionBodyTemplate = (rowData) => {
    return (
      <div className="flex gap-2">
         <ButtonComponent
          icon="ri-pencil-line"
          className="p-button-rounded p-button-text text-[1.2rem] bg-gray-50 hover:bg-gray-100 text-gray-700 w-9 h-9 flex items-center justify-center"
          onClick={() => editDiscountCategory(rowData)}
          tooltip="Edit"
        />
        <ButtonComponent
          icon="ri-delete-bin-line"
          className="p-button-rounded p-button-text text-[1.2rem] bg-red-50 hover:bg-red-100 text-red-600 w-9 h-9 flex items-center justify-center"
          onClick={() => confirmDeleteDiscountCategory(rowData)}
          tooltip="Delete"
        />
      </div>
    );
  };

  const columns = [
    { field: "discount_category_name", header: t("discount_category_name"), bodyClassName: "font-semibold"},
    { field: "discount_percent", header: t("discount_percent")},
    { header: t("action"), body: actionBodyTemplate, headerStyle: { paddingLeft: '3%'} },
  ];

  const confirmDeleteDiscountCategory = (item) => {
    setIsConfirm(!isConfirm);
    setDeleteId(item?.id);
  };

  const closeDialogbox = () => {
    setDeleteId(null);
    setIsConfirm(!isConfirm);
  };

  const fetchDiscountCategoryList = (sk=skip, li=limit) => {
    setLoader(true);
    let body = {
      search: search,
      skip: sk,
      limit: li
    }
    allApiWithHeaderToken(`${API_CONSTANTS.COMMON_DISCOUNT_CATEGORIES_URL}/filter`, body , "post")
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

  const createDiscountCategory = ()=>{
    navigate(ROUTES_CONSTANTS.CREATE_DISCOUNT_CATEGORY);
  }

  useEffect(() => {
    fetchDiscountCategoryList(0,10);
  }, [search]);

  const paginationChangeHandler = (skip, limit) => {
    setSkip(skip);
    setLimit(limit);
    fetchDiscountCategoryList(skip, limit);
  };

  const confirmDialogbox = () => {
    setLoader(true);
    allApiWithHeaderToken(`${API_CONSTANTS.COMMON_DISCOUNT_CATEGORIES_URL}/${deleteId}`, {}, "delete")
      .then((response) => {
        if (response.status === 200) {
          toast.current.show({
            severity: "success",
            summary: "Success",
            detail: t("discount_category_deleted_successfully"),
            life: 3000,
          });
          fetchDiscountCategoryList();
        }
      })
      .catch((err) => {
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: err?.response?.data?.errors,
          life: 3000,
        });
      })
      .finally(() => {
        setLoader(false);
        setIsConfirm(false);
        setDeleteId(null);
      });
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
      <div className="mt-4 flex justify-end bg-BgSecondaryColor border rounded border-BorderColor p-2">
        <ButtonComponent
          onClick={() => createDiscountCategory()}
          type="submit"
          label={t("create_discount_category")}
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

export default DiscountCategoryList;
