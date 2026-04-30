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

const HomeSectionList = ({ search }) => {
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
    heading: t("home_sections"),
    routes: [
      { label: t("dashboard"), route: ROUTES_CONSTANTS.DASHBOARD },
      { label: t("home_sections"), route: ROUTES_CONSTANTS.HOME_SECTIONS },
    ],
  };

  const actionBodyTemplate = (rowData) => {
    return (
      <div className="flex gap-2">
        <ButtonComponent
          icon="ri-pencil-line"
          className="p-button-rounded p-button-text text-[1.2rem] bg-gray-50 hover:bg-gray-100 text-gray-700 w-9 h-9 flex items-center justify-center"
          onClick={() => editHomeSection(rowData)}
          tooltip="Edit"
        />
        <ButtonComponent
          icon="ri-delete-bin-line"
          className="p-button-rounded p-button-text text-[1.2rem] bg-red-50 hover:bg-red-100 text-red-600 w-9 h-9 flex items-center justify-center"
          onClick={() => confirmDeleteHomeSection(rowData)}
          tooltip="Delete"
        />
      </div>
    );
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

  const productsCountBodyTemplate = (rowData) => {
    return (
      <div className="flex items-center">
        <span className="font-medium text-xs">{rowData?.products_count || 0}</span>
      </div>
    );
  };

  const keyBodyTemplate = (rowData) => {
    return (
      <div className="flex items-center">
        <span className="text-xs">{rowData?.key}</span>
      </div>
    );
  };

  const columns = [
    { field: "name", header: t("name"), bodyClassName: "font-semibold", style: { width: "20%" } },
    { field: "key", header: t("key"), body: keyBodyTemplate, style: { width: "15%" } },
    { field: "description", header: t("description"), style: { width: "30%" } },
    { header: t("products"), body: productsCountBodyTemplate, style: { width: "10%" } },
    { header: t("status"), body: statusBodyTemplate, style: { width: "12%" } },
    { header: t("action"), body: actionBodyTemplate, headerStyle: { paddingLeft: '3%' }, style: { width: "13%" } },
  ];

  const editHomeSection = (item) => {
    navigate(`${ROUTES_CONSTANTS.EDIT_HOME_SECTION}/${item?.id}`);
  };

  const confirmDeleteHomeSection = (item) => {
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
    allApiWithHeaderToken(`${API_CONSTANTS.HOME_SECTIONS}/${deleteId}`, "", "delete")
      .then((response) => {
        if (response.status === 204) {
          toast.current.show({
            severity: "success",
            summary: t("success"),
            detail: t("home_section_deleted_successfully"),
            life: 3000,
          });
          fetchHomeSections();
        }
      })
      .catch((err) => {
        toast.current.show({
          severity: "error",
          summary: t("error"),
          detail: err?.response?.data?.errors || t("failed_to_delete_home_section"),
          life: 3000,
        });
        setLoader(false);
      });
  };

  const fetchHomeSections = (sk = skip, li = limit) => {
    setLoader(true);
    let body = {
      search: search,
      skip: sk,
      limit: li
    };
    
    allApiWithHeaderToken(`${API_CONSTANTS.HOME_SECTIONS}/filter`, body, "post")
      .then((response) => {
        if (response.status === 200) {
          setData(response?.data?.data);
          setTotal(response?.data?.total);
        }
      })
      .catch((err) => {
        toast.current.show({
          severity: "error",
          summary: t("error"),
          detail: err?.response?.data?.errors || t("failed_to_fetch_home_sections"),
          life: 3000,
        });
      })
      .finally(() => {
        setLoader(false);
      });
  };

  const createHomeSection = () => {
    navigate(ROUTES_CONSTANTS.ADD_HOME_SECTION);
  };

  useEffect(() => {
    fetchHomeSections(0, 10);
  }, [search]);

  const paginationChangeHandler = (skip, limit) => {
    setSkip(skip);
    setLimit(limit);
    fetchHomeSections(skip, limit);
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
          onClick={createHomeSection}
          type="submit"
          label={t("add_home_section")}
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

export default HomeSectionList;
