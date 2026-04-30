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
import DefaultImage from "@assets/no-image.jpeg";

const BlogList = ({search}) => {
  const toast = useRef(null);
  const [data, setData] = useState([]);
  const { t } = useTranslation("msg");
  const navigate = useNavigate();
  const [isConfirm, setIsConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [loader, setLoader] = useState(false);
  const [skip, setSkip] = useState(0);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  const item = {
    heading: t("blog"),
    routes: [
      { label: t("dashboard"), route: ROUTES_CONSTANTS.DASHBOARD },
      { label: t("blog"), route: ROUTES_CONSTANTS.BLOGS },
    ],
  };

  const actionBodyTemplate = (rowData) => {
    return (
      <div className="flex gap-2">
        <ButtonComponent
          icon="ri-pencil-line"
          className="p-button-rounded p-button-text text-[1.2rem] bg-gray-50 hover:bg-gray-100 text-gray-700 w-9 h-9 flex items-center justify-center"
          onClick={() => editBlog(rowData)}
          tooltip="Edit"
        />
        <ButtonComponent
          icon="ri-delete-bin-line"
          className="p-button-rounded p-button-text text-[1.2rem] bg-red-50 hover:bg-red-100 text-red-600 w-9 h-9 flex items-center justify-center"
          onClick={() => confirmDeleteBlog(rowData)}
          tooltip="Delete"
        />
      </div>
    );
  };

  const nameBodyTemplate= (rowData) => {
    return (
      <div className="flex items-center gap-4 w-[30%]">
        <div className="w-12 h-12 overflow-hidden rounded-full">
          <img 
            src={rowData?.image_url ? rowData.image_url : DefaultImage} 
            alt="Profile" 
            className="w-full h-full object-cover" 
          />
        </div>
      </div>
    );
  };

  const columns = [
    { header: t("blog_image"), body: nameBodyTemplate, style: { width: '20%' }, headerStyle: { width: '20%'}},
    { field: "heading", header: t("blog_heading"), bodyClassName: "font-semibold" },
    { header: t("action"), body: actionBodyTemplate, headerStyle: { paddingLeft: '3%'} },
  ];

  const editBlog = (item) => {
    navigate(`${ROUTES_CONSTANTS.EDIT_BLOG}/${item?.id}`);
  };

  const confirmDeleteBlog = (item) => {
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
    allApiWithHeaderToken(`${API_CONSTANTS.COMMON_BLOGS_URL}/${deleteId}`,"", "delete")
      .then((response) => {
        if (response?.status === 200) {
          fetchBlogList();
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

  useEffect(() => {
    fetchBlogList(0, 10);
  }, [search]);

  const fetchBlogList = (sk=skip, li=limit) => {
    setLoader(true);
    let body = {
      search: search,
      skip: sk,
      limit: li
    }
    allApiWithHeaderToken(`${API_CONSTANTS.COMMON_BLOGS_URL}/filter`, body , "post")
      .then((response) => {
        if (response?.status === 200) {
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
      }).finally(()=>{
        setLoader(false);
      });
  };
  
  const paginationChangeHandler = (skip, limit) => {
    setSkip(skip);
    setLimit(limit);
    fetchBlogList(skip, limit);
  };

  const createBlog = () => {
    navigate(ROUTES_CONSTANTS.CREATE_BLOG);
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
      <div className="mt-4 flex justify-end bg-BgSecondaryColor p-2 border rounded border-BorderColor">
        <ButtonComponent
          onClick={() => createBlog()}
          type="submit"
          label={t("create_blog")}
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

export default BlogList;
