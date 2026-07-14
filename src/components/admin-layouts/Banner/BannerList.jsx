import { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import Breadcrum from "@common/Breadcrum";
import ButtonComponent from "@common/ButtonComponent";
import Confirmbox from "@common/Confirmbox";
import { allApi, allApiWithHeaderToken } from "@api/api";
import { API_CONSTANTS } from "@constants/apiurl";
import { ROUTES_CONSTANTS } from "@constants/routesurl";

const BannerList = () => {
  const toast = useRef(null);
  const fileInputRef = useRef(null);
  const [banners, setBanners] = useState([]);
  const [loader, setLoader] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isConfirm, setIsConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState({ title: "", sub_title: "", order_by: 0, image: null, preview: null });

  const breadcrumItem = {
    heading: "Banners",
    routes: [
      { label: "Dashboard", route: ROUTES_CONSTANTS.DASHBOARD },
      { label: "Banners", route: ROUTES_CONSTANTS.BANNERS },
    ],
  };

  const fetchBanners = () => {
    setLoader(true);
    allApi.get(API_CONSTANTS.BANNERS_GET)
      .then((res) => {
        if (res.data?.banners) setBanners(res.data.banners);
      })
      .catch(() => {
        toast.current?.show({ severity: "error", summary: "Error", detail: "Failed to fetch banners", life: 3000 });
      })
      .finally(() => setLoader(false));
  };

  useEffect(() => { fetchBanners(); }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setForm((f) => ({ ...f, image: file, preview }));
  };

  const handleUpload = () => {
    if (!form.image) {
      toast.current?.show({ severity: "warn", summary: "Warning", detail: "Please select an image", life: 3000 });
      return;
    }
    setUploading(true);
    const formData = new FormData();
    formData.append("image", form.image);
    if (form.title) formData.append("title", form.title);
    if (form.sub_title) formData.append("sub_title", form.sub_title);
    formData.append("order_by", form.order_by);

    allApiWithHeaderToken(API_CONSTANTS.BANNERS_UPLOAD, formData, "post", "multipart/form-data")
      .then((res) => {
        if (res.status === 200) {
          toast.current?.show({ severity: "success", summary: "Success", detail: "Banner uploaded successfully", life: 3000 });
          setForm({ title: "", sub_title: "", order_by: 0, image: null, preview: null });
          if (fileInputRef.current) fileInputRef.current.value = "";
          fetchBanners();
        }
      })
      .catch(() => {
        toast.current?.show({ severity: "error", summary: "Error", detail: "Failed to upload banner", life: 3000 });
      })
      .finally(() => setUploading(false));
  };

  const confirmDelete = (id) => {
    setDeleteId(id);
    setIsConfirm(true);
  };

  const closeDialogbox = () => {
    setDeleteId(null);
    setIsConfirm(false);
  };

  const confirmDialogbox = () => {
    setIsConfirm(false);
    allApiWithHeaderToken(`${API_CONSTANTS.BANNERS_DELETE}/${deleteId}`, "", "delete")
      .then(() => {
        toast.current?.show({ severity: "success", summary: "Success", detail: "Banner deleted", life: 3000 });
        fetchBanners();
      })
      .catch(() => {
        toast.current?.show({ severity: "error", summary: "Error", detail: "Failed to delete banner", life: 3000 });
      });
  };

  return (
    <div className="text-TextPrimaryColor">
      <Toast ref={toast} position="top-right" />
      <Confirmbox isConfirm={isConfirm} closeDialogbox={closeDialogbox} confirmDialogbox={confirmDialogbox} />
      <Breadcrum item={breadcrumItem} />

      {/* Upload Form */}
      <div className="mt-4 bg-BgSecondaryColor border rounded border-BorderColor p-4">
        <h3 className="text-sm font-semibold mb-3">Upload New Banner</h3>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Image *</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="text-xs border border-BorderColor rounded px-2 py-1.5 bg-BgPrimaryColor"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Banner title"
              className="text-xs border border-BorderColor rounded px-2 py-1.5 bg-BgPrimaryColor w-40"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Sub Title</label>
            <input
              type="text"
              value={form.sub_title}
              onChange={(e) => setForm((f) => ({ ...f, sub_title: e.target.value }))}
              placeholder="Sub title"
              className="text-xs border border-BorderColor rounded px-2 py-1.5 bg-BgPrimaryColor w-40"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Order</label>
            <input
              type="number"
              value={form.order_by}
              onChange={(e) => setForm((f) => ({ ...f, order_by: parseInt(e.target.value) || 0 }))}
              className="text-xs border border-BorderColor rounded px-2 py-1.5 bg-BgPrimaryColor w-20"
            />
          </div>
          {form.preview && (
            <img src={form.preview} alt="preview" className="h-12 w-20 object-cover rounded border border-BorderColor" />
          )}
          <ButtonComponent
            onClick={handleUpload}
            label={uploading ? "Uploading..." : "Upload Banner"}
            disabled={uploading}
            className="rounded bg-TextPrimaryColor px-4 py-2 text-[12px] text-white"
          />
        </div>
      </div>

      {/* Banner Grid */}
      <div className="mt-4">
        {loader ? (
          <div className="text-center py-10 text-sm text-gray-500">Loading banners...</div>
        ) : banners.length === 0 ? (
          <div className="text-center py-10 text-sm text-gray-500 border rounded border-BorderColor bg-BgSecondaryColor">
            No banners found. Upload one above.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {banners.map((banner) => (
              <div key={banner.banner_id} className="relative group border rounded border-BorderColor bg-BgSecondaryColor overflow-hidden">
                <img
                  src={banner.logo}
                  alt={banner.banner_title || "Banner"}
                  className="w-full h-40 object-cover"
                  onError={(e) => { e.target.src = "/No-image-found.jpg"; }}
                />
                <div className="p-2">
                  {banner.banner_title && (
                    <p className="text-xs font-semibold truncate">{banner.banner_title}</p>
                  )}
                  {banner.banner_sub_title && (
                    <p className="text-xs text-gray-500 truncate">{banner.banner_sub_title}</p>
                  )}
                </div>
                <button
                  onClick={() => confirmDelete(banner.banner_id)}
                  className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete"
                >
                  <i className="ri-delete-bin-line text-sm" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BannerList;
