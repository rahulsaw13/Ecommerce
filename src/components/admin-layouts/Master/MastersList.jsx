// utils
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Toast } from "primereact/toast";

// components
import Breadcrum from "@common/Breadcrum";
import TreeTable from "@common/TreeTable";
import ButtonComponent from "@common/ButtonComponent";
import Confirmbox from "@common/Confirmbox";
import { allApiWithHeaderToken } from "@api/api";
import { ROUTES_CONSTANTS } from "@constants/routesurl";
import { API_CONSTANTS } from "@constants/apiurl";

const MastersList = ({search}) => {
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
    heading: "Masters",
    routes: [
      { label: t("dashboard"), route: ROUTES_CONSTANTS.DASHBOARD },
      { label: "Masters", route: ROUTES_CONSTANTS.ADMIN_MASTERS },
    ],
  };

  const actionBodyTemplate = (rowData) => {
    // Don't show actions for parent nodes (type groups)
    if (rowData.data?.is_parent) {
      return null;
    }
    
    return (
      <div className="flex gap-1">
        <ButtonComponent
          icon="ri-pencil-line"
          className="p-1 rounded bg-gray-50 hover:bg-gray-100 text-gray-600 text-[1rem] transition-colors"
          onClick={() => editMaster(rowData.data)}
          tooltip="Edit"
          tooltipOptions={{ position: 'top' }}
        />
        <ButtonComponent
          icon="ri-delete-bin-line"
          className="p-1 rounded bg-red-50 hover:bg-red-100 text-red-600 text-[1rem] transition-colors"
          onClick={() => confirmDeleteMaster(rowData.data)}
          tooltip="Delete"
          tooltipOptions={{ position: 'top' }}
        />
      </div>
    );
  };

  const statusBodyTemplate = (rowData) => {
    // Don't show status for parent nodes (type groups)
    if (rowData.data?.is_parent) {
      return null;
    }
    
    const data = rowData.data || rowData;
    return (
      <div className="flex items-center gap-4">
        {data?.is_active ? <span className="text-[green]">Active</span> : <span className="text-black">Inactive</span>}
      </div>
    );
  };

  const masterTypeBodyTemplate = (rowData) => {
    // For parent nodes (type groups), show the type name in black
    if (rowData.data?.is_parent) {
      return (
        <span className="capitalize font-semibold text-black">
          {rowData.data.master_type_display}
        </span>
      );
    }
    
    // For child nodes, don't show type (it's already shown in parent)
    return null;
  };

  const displayOrderBodyTemplate = (rowData) => {
    // Don't show display order for parent nodes (type groups)
    if (rowData.data?.is_parent) {
      return null;
    }
    
    const data = rowData.data || rowData;
    return (
      <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs">
        {data.display_order}
      </span>
    );
  };

  const valueBodyTemplate = (rowData) => {
    // Don't show value for parent nodes (type groups)
    if (rowData.data?.is_parent) {
      return null;
    }
    
    const data = rowData.data || rowData;
    return (
      <code className="bg-gray-100 px-2 py-1 rounded text-sm">
        {data.value}
      </code>
    );
  };

  const nameBodyTemplate = (rowData) => {
    // For parent nodes (type groups), show the name with count (already formatted by backend)
    if (rowData.data?.is_parent) {
      return (
        <span className="font-semibold text-gray-700">
          {rowData.data.name}
        </span>
      );
    }
    
    // For child nodes, show the name with increased font weight
    const data = rowData.data || rowData;
    return <span className="font-semibold">{data.name}</span>;
  };

  const columns = [
    { 
      field: "name", 
      header: "Name", 
      body: nameBodyTemplate, 
      expander: true, 
      bodyClassName: 'product-expander', 
      style: { width: '25%' },
      headerStyle: { width: '25%' },
      bodyStyle: { width: '25%' }
    },
    { 
      field: "master_type", 
      header: "Type", 
      body: masterTypeBodyTemplate, 
      style: { width: '18%' },
      headerStyle: { width: '18%' },
      bodyStyle: { width: '18%' }
    },
    { 
      field: "value", 
      header: "Value", 
      body: valueBodyTemplate, 
      style: { width: '20%' },
      headerStyle: { width: '20%' },
      bodyStyle: { width: '20%' }
    },
    { 
      field: "display_order", 
      header: "Order", 
      body: displayOrderBodyTemplate, 
      style: { width: '12%' },
      headerStyle: { width: '12%' },
      bodyStyle: { width: '12%' }
    },
    { 
      header: "Status", 
      body: statusBodyTemplate, 
      style: { width: '10%' },
      headerStyle: { width: '10%' },
      bodyStyle: { width: '10%' }
    },
    { 
      header: "Action", 
      body: actionBodyTemplate, 
      style: { width: '15%' },
      headerStyle: { width: '15%' },
      bodyStyle: { width: '15%' }
    },
  ];

  const editMaster = (item) => {
    navigate(`${ROUTES_CONSTANTS.EDIT_MASTER}/${item?.id}`);
  };

  const confirmDeleteMaster = (item) => {
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
    allApiWithHeaderToken(`${API_CONSTANTS.MASTERS.DELETE.replace(':id', deleteId)}`,"", "delete")
      .then((response) => {
        if (response?.status === 200) {
          fetchMastersList();
          toast.current.show({
            severity: "success",
            summary: "Success",
            detail: "Master deleted successfully",
            life: 3000,
          });
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
    fetchMastersList(0,10);
  }, [search]);

  const paginationChangeHandler = (skip, limit) => {
    setSkip(skip);
    setLimit(limit);
    fetchMastersList(skip, limit);
  };

  const fetchMastersList = (sk=skip, li=limit) => {
    setLoader(true);
    let body = {
      search: search,
      skip: sk,
      limit: li,
      grouped: 'true' // Request grouped data from backend
    }
    allApiWithHeaderToken(`${API_CONSTANTS.MASTERS.FILTER}`, body , "post")
      .then((response) => {
        if (response?.status === 200) {
          // Backend now returns pre-grouped tree data
          const treeData = response?.data?.data || [];
          setData(treeData);
          setTotal(response?.data?.total); // Total number of groups for pagination
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


  const createMaster = () => {
    navigate(ROUTES_CONSTANTS.CREATE_MASTER);
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
      
      {/* Create Button */}
      <div className="mt-4 flex justify-end items-center bg-BgSecondaryColor p-2 border rounded border-BorderColor">
        <ButtonComponent
          onClick={createMaster}
          type="submit"
          label="Create Master"
          className="rounded bg-TextPrimaryColor px-6 py-2 text-[12px] text-white"
        />
      </div>
      
      <div className="mt-4">
        <TreeTable
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

export default MastersList;
