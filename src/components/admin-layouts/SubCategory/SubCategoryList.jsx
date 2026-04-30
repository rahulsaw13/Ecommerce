// utils
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Toast } from "primereact/toast";
import { Skeleton } from "primereact/skeleton";

// components
import Breadcrum from "@common/Breadcrum";
import DataTable from "@common/DataTable";
import ButtonComponent from "@common/ButtonComponent";
import Confirmbox from "@common/Confirmbox";
import { allApiWithHeaderToken } from "@api/api";
import { ROUTES_CONSTANTS } from "@constants/routesurl";
import { API_CONSTANTS } from "@constants/apiurl";
import DefaultImage from "@assets/no-image.jpeg";
import Image from "@common/Image";

const SubCategoryList = ({search}) => {
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
    heading: t("sub_category"),
    routes: [
      { label: t("dashboard"), route: ROUTES_CONSTANTS.DASHBOARD },
      { label: t("sub_category"), route: ROUTES_CONSTANTS.CATEGORIES },
    ],
  };

  const [data, setData] = useState([]);
  
  const actionBodyTemplate = (rowData) => {
    return (
      <div className="flex gap-2">
        <ButtonComponent
          icon="ri-pencil-line"
          className="p-button-rounded p-button-text text-[1.2rem] bg-gray-50 hover:bg-gray-100 text-gray-700 w-9 h-9 flex items-center justify-center"
          onClick={() => editSubCategory(rowData)}
          tooltip="Edit"
          tooltipOptions={{ position: 'left', hideDelay: 0 }}
        />
        <ButtonComponent
          icon="ri-delete-bin-line"
          className="p-button-rounded p-button-text text-[1.2rem] bg-red-50 hover:bg-red-100 text-red-600 w-9 h-9 flex items-center justify-center"
          onClick={(e) => {
            // Hide tooltip immediately when clicked
            const tooltips = document.querySelectorAll('.p-tooltip');
            tooltips.forEach(tooltip => tooltip.style.display = 'none');
            confirmDeleteSubCategory(rowData);
          }}
          tooltip="Delete"
          tooltipOptions={{ position: 'left', hideDelay: 0 }}
        />
      </div>
    );
  };

  const nameBodyTemplate= (rowData) => {
    return (
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 overflow-hidden rounded-full flex-shrink-0">
          <Image 
            src={rowData?.thumbnail_url || rowData?.image_url || DefaultImage}
            placeholderSrc={rowData?.blur_placeholder_url}
            alt="SubCategory" 
            width={48}
            height={48}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
        <span className="font-semibold">{rowData?.name}</span>
      </div>
    );
  };

  const nameSkeletonTemplate = () => {
    return (
      <div className="flex items-center gap-4">
        <Skeleton shape="circle" size="3rem" />
        <Skeleton width="10rem" height="1rem" />
      </div>
    );
  };

  const statusBodyTemplate= (rowData) => {
    return (
      <div className="flex items-center gap-4" style={{ paddingLeft: '4%' }}>
        {rowData?.status === 1 ? <span className="text-[green]">Active</span> : <span className="text-[red]">Inactive</span>}
      </div>
    );
  };

  const columns = [
    { 
      header: t("name"), 
      body: nameBodyTemplate, 
      skeletonBody: nameSkeletonTemplate(),
      headerStyle: { paddingLeft: '3%'}, 
      style: { width: "22%" } 
    },
    { field: "category_name", header: t("category"), style: { width: "18%" }},
    { field: "description", header: t("description"), style: { width: "35%" }},
    { header: t("status"), body: statusBodyTemplate, style: { width: "12%" } },
    { header: t("action"), body: actionBodyTemplate, headerStyle: { paddingLeft: '3%'}, style: { width: "13%" } },
  ];

  const editSubCategory = (item) => {
    navigate(`${ROUTES_CONSTANTS.EDIT_SUB_CATEGORY}/${item?.id}`);
  };

  const confirmDeleteSubCategory = (item) => {
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
    allApiWithHeaderToken(`${API_CONSTANTS.COMMON_SUB_CATEGORIES_URL}/${deleteId}`, '', "delete")
      .then((response) => {
        if (response.status === 200) {
          fetchSubCategoryList();
        } 
      })
      .catch((err) => {
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: "Something Went Wrong",
          life: 3000,
        });
        setLoader(false);
      });
  };

  const fetchSubCategoryList = (sk=skip, li=limit) => {
    setLoader(true);
    let body = {
      search: search,
      skip: sk,
      limit: li
    }
    allApiWithHeaderToken(`${API_CONSTANTS.COMMON_SUB_CATEGORIES_URL}/filter`, body , "post")
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
    fetchSubCategoryList(0,10);
  }, [search]);

  const paginationChangeHandler = (skip, limit) => {
    setSkip(skip);
    setLimit(limit);
    fetchSubCategoryList(skip, limit);
  };

  const createCategory = () => {
    navigate(ROUTES_CONSTANTS.CREATE_SUB_CATEGORY);
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
          onClick={() => createCategory()}
          type="submit"
          label={t("create_sub_category")}
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

export default SubCategoryList;
