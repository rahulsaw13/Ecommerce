// utils
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Toast } from "primereact/toast";
import { allApiWithHeaderToken } from "@api/api";
import { API_CONSTANTS } from "@constants/apiurl";
import { reloadThemeColors } from "@utils/themeUtils";

// components
import Breadcrum from "@common/Breadcrum";
import { ROUTES_CONSTANTS } from "@constants/routesurl";

const SettingsList = ({ search }) => {
  const toast = useRef(null);
  const { t } = useTranslation("msg");
  const [loader, setLoader] = useState(false);
  const [adminThemeColor, setAdminThemeColor] = useState("");
  const [originalAdminThemeColor, setOriginalAdminThemeColor] = useState("");
  const [adminThemeId, setAdminThemeId] = useState(null);
  const [headerBanner, setHeaderBanner] = useState(null);
  const [footerBanner, setFooterBanner] = useState(null);
  const [headerBannerId, setHeaderBannerId] = useState(null);
  const [footerBannerId, setFooterBannerId] = useState(null);
  const [headerBannerPreview, setHeaderBannerPreview] = useState(null);
  const [originalHeaderBannerPreview, setOriginalHeaderBannerPreview] = useState(null);
  const [footerBannerPreview, setFooterBannerPreview] = useState(null);
  const [originalFooterBannerPreview, setOriginalFooterBannerPreview] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  
  // GST Rates
  const [igstRate, setIgstRate] = useState("0");
  const [cgstRate, setCgstRate] = useState("2.5");
  const [sgstRate, setSgstRate] = useState("2.5");
  const [originalIgstRate, setOriginalIgstRate] = useState("0");
  const [originalCgstRate, setOriginalCgstRate] = useState("2.5");
  const [originalSgstRate, setOriginalSgstRate] = useState("2.5");
  
  // Shipping Cost Per KM
  const [shippingCostPerKm, setShippingCostPerKm] = useState("0");
  const [originalShippingCostPerKm, setOriginalShippingCostPerKm] = useState("0");
  
  // Handling Fee
  const [handlingFee, setHandlingFee] = useState("10");
  const [originalHandlingFee, setOriginalHandlingFee] = useState("10");
  
  // Inventory Management
  const [inventoryEnabled, setInventoryEnabled] = useState(false);
  const [originalInventoryEnabled, setOriginalInventoryEnabled] = useState(false);
  const [inventorySettingId, setInventorySettingId] = useState(null);
  
  // Carousel Images
  const [carouselImages, setCarouselImages] = useState([]);
  const [originalCarouselImages, setOriginalCarouselImages] = useState([]);
  const [newCarouselImages, setNewCarouselImages] = useState([]);
  const [deletedCarouselImageIds, setDeletedCarouselImageIds] = useState([]);

  const item = {
    heading: "Settings",
    routes: [
      { label: t("dashboard"), route: ROUTES_CONSTANTS.DASHBOARD },
      { label: "Settings", route: ROUTES_CONSTANTS.SETTINGS },
    ],
  };

  useEffect(() => {
    fetchSettingsList();
  }, []);

  const fetchSettingsList = () => {
    setLoader(true);
    allApiWithHeaderToken(API_CONSTANTS.COMMON_SETTINGS_URL, "", "get")
      .then((response) => {
        if (response?.status === 200) {
          const settings = response?.data?.data || [];
          const carouselImgs = [];
          
          settings.forEach((setting) => {
            const attrs = setting.attributes || setting;
            if (attrs.key === "admin_theme_color") {
              setAdminThemeColor(attrs.value || "#FFC107");
              setOriginalAdminThemeColor(attrs.value || "#FFC107");
              setAdminThemeId(setting.id);
            } else if (attrs.key === "header_banner") {
              const imageUrl = attrs.typed_value || attrs.value;
              setHeaderBannerPreview(imageUrl);
              setOriginalHeaderBannerPreview(imageUrl);
              setHeaderBannerId(setting.id);
            } else if (attrs.key === "footer_banner") {
              const imageUrl = attrs.typed_value || attrs.value;
              setFooterBannerPreview(imageUrl);
              setOriginalFooterBannerPreview(imageUrl);
              setFooterBannerId(setting.id);
            } else if (attrs.key === "igst_rate") {
              setIgstRate(attrs.value || "0");
              setOriginalIgstRate(attrs.value || "0");
            } else if (attrs.key === "cgst_rate") {
              setCgstRate(attrs.value || "2.5");
              setOriginalCgstRate(attrs.value || "2.5");
            } else if (attrs.key === "sgst_rate") {
              setSgstRate(attrs.value || "2.5");
              setOriginalSgstRate(attrs.value || "2.5");
            } else if (attrs.key === "shipping_cost_per_km") {
              setShippingCostPerKm(attrs.value || "0");
              setOriginalShippingCostPerKm(attrs.value || "0");
            } else if (attrs.key === "handling_fee") {
              setHandlingFee(attrs.value || "10");
              setOriginalHandlingFee(attrs.value || "10");
            } else if (attrs.key === "inventory_enabled") {
              const isEnabled = attrs.value === 'true' || attrs.value === true;
              setInventoryEnabled(isEnabled);
              setOriginalInventoryEnabled(isEnabled);
              setInventorySettingId(setting.id);
            } else if (attrs.key && attrs.key.startsWith("carousel_image_")) {
              const imageUrl = attrs.typed_value || attrs.value;
              if (imageUrl) {
                carouselImgs.push({
                  id: setting.id,
                  key: attrs.key,
                  url: imageUrl,
                  order: parseInt(attrs.key.replace("carousel_image_", "")) || 0
                });
              }
            }
          });
          
          // Sort carousel images by order
          carouselImgs.sort((a, b) => a.order - b.order);
          setCarouselImages(carouselImgs);
          setOriginalCarouselImages(JSON.parse(JSON.stringify(carouselImgs)));
          
          if (!adminThemeId) {
            setHasChanges(false);
          }
        }
      })
      .catch((err) => {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: err?.response?.data?.errors || "Failed to fetch settings",
          life: 3000,
        });
      })
      .finally(() => {
        setLoader(false);
      });
  };

  const handleColorChange = (color) => {
    setAdminThemeColor(color);
    setHasChanges(true);
  };

  const handleGstRateChange = (type, value) => {
    // Validate input - only allow numbers and decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      if (type === 'igst') {
        setIgstRate(value);
      } else if (type === 'cgst') {
        setCgstRate(value);
      } else if (type === 'sgst') {
        setSgstRate(value);
      } else if (type === 'shipping') {
        setShippingCostPerKm(value);
      } else if (type === 'handling') {
        setHandlingFee(value);
      }
      setHasChanges(true);
    }
  };

  const handleCarouselImageAdd = (event) => {
    const files = Array.from(event.target.files);
    
    files.forEach(file => {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "Please upload valid image files (JPEG, PNG, or WebP)",
          life: 3000,
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "File size should not exceed 5MB",
          life: 3000,
        });
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewCarouselImages(prev => [...prev, {
          file: file,
          preview: reader.result,
          tempId: Date.now() + Math.random()
        }]);
        setHasChanges(true);
      };
      reader.readAsDataURL(file);
    });
    
    // Reset input
    event.target.value = '';
  };

  const handleCarouselImageRemove = (image) => {
    if (image.id) {
      // Existing image from server
      setDeletedCarouselImageIds(prev => [...prev, image.id]);
      setCarouselImages(prev => prev.filter(img => img.id !== image.id));
    } else {
      // New image not yet uploaded
      setNewCarouselImages(prev => prev.filter(img => img.tempId !== image.tempId));
    }
    setHasChanges(true);
  };

  const handleBannerChange = (type, event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "Please upload a valid image file (JPEG, PNG, or WebP)",
          life: 3000,
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "File size should not exceed 5MB",
          life: 3000,
        });
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'header') {
          setHeaderBannerPreview(reader.result);
          setHeaderBanner(file);
        } else {
          setFooterBannerPreview(reader.result);
          setFooterBanner(file);
        }
        setHasChanges(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveBanner = (type) => {
    if (type === 'header') {
      setHeaderBannerPreview(null);
      setHeaderBanner(null);
    } else {
      setFooterBannerPreview(null);
      setFooterBanner(null);
    }
    setHasChanges(true);
  };

  const handleUpdateSettings = async () => {
    if (!hasChanges) {
      toast.current?.show({
        severity: "info",
        summary: "Info",
        detail: "No changes to update",
        life: 3000,
      });
      return;
    }

    setLoader(true);

    try {
      const formData = new FormData();
      let hasUpdates = false;

      // Add admin theme color if changed
      const colorChanged = adminThemeColor !== originalAdminThemeColor;
      if (colorChanged) {
        formData.append('admin_theme_color', adminThemeColor);
        hasUpdates = true;
      }

      // Add GST rates if changed
      if (igstRate !== originalIgstRate) {
        formData.append('igst_rate', igstRate);
        hasUpdates = true;
      }
      if (cgstRate !== originalCgstRate) {
        formData.append('cgst_rate', cgstRate);
        hasUpdates = true;
      }
      if (sgstRate !== originalSgstRate) {
        formData.append('sgst_rate', sgstRate);
        hasUpdates = true;
      }
      
      // Add shipping cost per km if changed
      if (shippingCostPerKm !== originalShippingCostPerKm) {
        formData.append('shipping_cost_per_km', shippingCostPerKm);
        hasUpdates = true;
      }
      
      // Add handling fee if changed
      if (handlingFee !== originalHandlingFee) {
        formData.append('handling_fee', handlingFee);
        hasUpdates = true;
      }
      
      // Add inventory enabled if changed
      if (inventoryEnabled !== originalInventoryEnabled) {
        formData.append('inventory_enabled', inventoryEnabled ? 'true' : 'false');
        hasUpdates = true;
      }

      // Add header banner if changed
      if (headerBanner) {
        formData.append('header_banner', headerBanner);
        hasUpdates = true;
      } else if (headerBannerPreview === null && originalHeaderBannerPreview !== null) {
        formData.append('header_banner', 'remove');
        hasUpdates = true;
      }

      // Add footer banner if changed
      if (footerBanner) {
        formData.append('footer_banner', footerBanner);
        hasUpdates = true;
      } else if (footerBannerPreview === null && originalFooterBannerPreview !== null) {
        formData.append('footer_banner', 'remove');
        hasUpdates = true;
      }

      // Add new carousel images
      newCarouselImages.forEach((img, index) => {
        formData.append(`carousel_images[]`, img.file);
        hasUpdates = true;
      });

      // Add deleted carousel image IDs
      if (deletedCarouselImageIds.length > 0) {
        formData.append('deleted_carousel_image_ids', JSON.stringify(deletedCarouselImageIds));
        hasUpdates = true;
      }

      if (!hasUpdates) {
        toast.current?.show({
          severity: "info",
          summary: "Info",
          detail: "No changes detected",
          life: 3000,
        });
        setLoader(false);
        return;
      }

      // Use fetch API for multipart/form-data
      let token = localStorage.getItem('token');
      if (token) {
        try {
          token = JSON.parse(token);
        } catch (e) {
          // Token is already a string
        }
        if (typeof token === 'string') {
          token = token.replace(/"/g, '');
          token = token.replace(/^Bearer\s+Bearer\s+/, 'Bearer ');
          if (!token.startsWith('Bearer ')) {
            token = `Bearer ${token}`;
          }
        }
      }

      const response = await fetch('http://localhost:3000/api/v1/settings/batch_update', {
        method: 'POST',
        headers: {
          'Authorization': token,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok && response.status === 200) {
        toast.current?.show({
          severity: "success",
          summary: "Success",
          detail: "Settings updated successfully",
          life: 3000,
        });
        
        setHasChanges(false);
        // Clear file states
        setHeaderBanner(null);
        setFooterBanner(null);
        setNewCarouselImages([]);
        setDeletedCarouselImageIds([]);
        // Update original values
        setOriginalAdminThemeColor(adminThemeColor);
        setOriginalIgstRate(igstRate);
        setOriginalCgstRate(cgstRate);
        setOriginalSgstRate(sgstRate);
        setOriginalShippingCostPerKm(shippingCostPerKm);
        setOriginalHandlingFee(handlingFee);
        setOriginalInventoryEnabled(inventoryEnabled);
        // Refresh settings to get updated values
        fetchSettingsList();
        // Reload theme colors to apply changes across the admin panel
        reloadThemeColors();
      } else {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: data.errors?.join(', ') || "Failed to update settings",
          life: 3000,
        });
      }
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Failed to update settings",
        life: 3000,
      });
    } finally {
      setLoader(false);
    }
  };

  return (
    <div className="text-TextPrimaryColor" style={{ height: 'calc(100vh - 90px)', display: 'flex', flexDirection: 'column' }}>
      <Toast ref={toast} position="top-right" />
      
      {loader ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <i className="ri-loader-4-line text-5xl text-TextPrimaryColor animate-spin mb-4"></i>
            <p className="text-gray-600 font-medium">Loading settings...</p>
          </div>
        </div>
      ) : (
        <>
          <div style={{ flexShrink: 0 }}>
            <Breadcrum item={item} />
          </div>

          <div style={{ flex: 1, overflowY: 'auto', marginTop: '1.5rem', paddingBottom: '1.5rem' }}>
        <div className="bg-BgSecondaryColor rounded-lg border border-BorderColor">
          {/* Content */}
          <div className="p-6">
            {/* Header with Update Button */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-1">
                  Appearance Settings
                </h2>
                <p className="text-sm text-gray-600">
                  Customize your admin panel colors and website banners.
                </p>
              </div>
              <button
                onClick={handleUpdateSettings}
                disabled={!hasChanges || loader}
                className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
                  hasChanges && !loader
                    ? 'bg-TextPrimaryColor text-white hover:opacity-90 shadow-md'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {loader ? (
                  <>
                    <i className="ri-loader-4-line animate-spin"></i>
                    Updating...
                  </>
                ) : (
                  <>
                    <i className="ri-save-line"></i>
                    Update Settings
                  </>
                )}
              </button>
            </div>

            {/* Settings Grid - Compact Design */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-3xl">
              
              {/* Admin Background Color */}
              <div className="border border-gray-200 rounded-lg p-4 bg-white">
                <div className="mb-3">
                  <h3 className="text-sm font-semibold text-gray-900 mb-0.5 flex items-center gap-2">
                    <i className="ri-palette-line text-TextPrimaryColor text-base"></i>
                    Admin Panel BG Color
                  </h3>
                  <p className="text-[10px] text-gray-600">
                    Customize admin panel background
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={adminThemeColor || "#FFFFFF"}
                      onChange={(e) => handleColorChange(e.target.value)}
                      className="w-10 h-10 rounded-lg border-2 border-gray-300 cursor-pointer hover:border-gray-400 transition-colors"
                      disabled={loader}
                    />
                    <input
                      type="text"
                      value={adminThemeColor}
                      onChange={(e) => handleColorChange(e.target.value)}
                      className="flex-1 px-2 py-1.5 border border-gray-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-TextPrimaryColor focus:border-transparent"
                      placeholder="#FFFFFF"
                      disabled={loader}
                    />
                  </div>
                  <div
                    className="w-full h-16 rounded-lg border border-gray-300 shadow-sm"
                    style={{ backgroundColor: adminThemeColor || "#FFFFFF" }}
                  />
                </div>
              </div>

              {/* Inventory Management Toggle */}
              <div className="border border-gray-200 rounded-lg p-4 bg-white">
                <div className="mb-3">
                  <h3 className="text-sm font-semibold text-gray-900 mb-0.5 flex items-center gap-2">
                    <i className="ri-stack-line text-TextPrimaryColor text-base"></i>
                    Inventory Tracking
                  </h3>
                  <p className="text-[10px] text-gray-600">
                    Enable/disable stock management
                  </p>
                </div>
                <div className="flex flex-col items-center justify-center space-y-2 py-2">
                  <button
                    onClick={() => {
                      setInventoryEnabled(!inventoryEnabled);
                      setHasChanges(true);
                    }}
                    disabled={loader}
                    className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-TextPrimaryColor focus:ring-offset-2 ${
                      inventoryEnabled ? 'bg-green-600' : 'bg-gray-300'
                    } ${loader ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform shadow-md ${
                        inventoryEnabled ? 'translate-x-8' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <div className="text-center">
                    <span className={`text-sm font-bold ${inventoryEnabled ? 'text-green-600' : 'text-gray-500'}`}>
                      {inventoryEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                    <p className="text-[10px] text-gray-600 mt-0.5">
                      {inventoryEnabled 
                        ? 'Stock tracking active' 
                        : 'All products available'}
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* Banner Images Section */}
            <div className="mt-8">
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-1">
                  Website Banners
                </h2>
                <p className="text-sm text-gray-600">
                  Upload header and footer banners for your website homepage.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Header Banner */}
              <div className="border border-gray-200 rounded-lg p-5 bg-white">
                <div className="mb-4">
                  <h3 className="text-base font-semibold text-gray-900 mb-1 flex items-center gap-2">
                    <i className="ri-image-line text-TextPrimaryColor"></i>
                    Header Banner
                  </h3>
                  <p className="text-xs text-gray-600">
                    1920x200px (JPEG, PNG, WebP)
                  </p>
                </div>
                <div>
                  {headerBannerPreview ? (
                    <div className="relative w-full h-32 border-2 border-gray-300 rounded-lg overflow-hidden group">
                      <img
                        src={headerBannerPreview}
                        alt="Header Banner"
                        className="w-full h-full object-cover"
                      />
                      {/* Action Buttons - Top Right */}
                      <div className="absolute top-2 right-2 flex gap-2">
                        <label className="w-8 h-8 bg-white text-white rounded-lg cursor-pointer transition-colors flex items-center justify-center shadow-lg">
                          <i className="ri-pencil-line text-sm"></i>
                          <input
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/webp"
                            onChange={(e) => handleBannerChange('header', e)}
                            className="hidden"
                            disabled={loader}
                          />
                        </label>
                        <button
                          onClick={() => handleRemoveBanner('header')}
                          className="w-8 h-8 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center shadow-lg"
                          disabled={loader}
                        >
                          <i className="ri-delete-bin-line text-sm"></i>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:border-gray-400 transition-colors bg-gray-50">
                      <div className="flex flex-col items-center justify-center py-4">
                        <i className="ri-upload-cloud-2-line text-3xl text-gray-400 mb-2"></i>
                        <p className="text-xs text-gray-600 font-medium">Click to upload</p>
                        <p className="text-xs text-gray-500">Max 5MB</p>
                      </div>
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={(e) => handleBannerChange('header', e)}
                        className="hidden"
                        disabled={loader}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Footer Banner */}
              <div className="border border-gray-200 rounded-lg p-5 bg-white">
                <div className="mb-4">
                  <h3 className="text-base font-semibold text-gray-900 mb-1 flex items-center gap-2">
                    <i className="ri-image-line text-TextPrimaryColor"></i>
                    Footer Banner
                  </h3>
                  <p className="text-xs text-gray-600">
                    1920x200px (JPEG, PNG, WebP)
                  </p>
                </div>
                <div>
                  {footerBannerPreview ? (
                    <div className="relative w-full h-32 border-2 border-gray-300 rounded-lg overflow-hidden group">
                      <img
                        src={footerBannerPreview}
                        alt="Footer Banner"
                        className="w-full h-full object-cover"
                      />
                      {/* Action Buttons - Top Right */}
                      <div className="absolute top-2 right-2 flex gap-2">
                        <label className="w-8 h-8 bg-white text-white rounded-lg cursor-pointer transition-colors flex items-center justify-center shadow-lg">
                          <i className="ri-pencil-line text-sm"></i>
                          <input
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/webp"
                            onChange={(e) => handleBannerChange('footer', e)}
                            className="hidden"
                            disabled={loader}
                          />
                        </label>
                        <button
                          onClick={() => handleRemoveBanner('footer')}
                          className="w-8 h-8 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center shadow-lg"
                          disabled={loader}
                        >
                          <i className="ri-delete-bin-line text-sm"></i>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:border-gray-400 transition-colors bg-gray-50">
                      <div className="flex flex-col items-center justify-center py-4">
                        <i className="ri-upload-cloud-2-line text-3xl text-gray-400 mb-2"></i>
                        <p className="text-xs text-gray-600 font-medium">Click to upload</p>
                        <p className="text-xs text-gray-500">Max 5MB</p>
                      </div>
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={(e) => handleBannerChange('footer', e)}
                        className="hidden"
                        disabled={loader}
                      />
                    </label>
                  )}
                </div>
              </div>

            </div>
          </div>

            {/* GST Settings Section */}
            <div className="mt-8">
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-1">
                  GST Tax & Shipping Settings
                </h2>
                <p className="text-sm text-gray-600">
                  Configure GST tax rates and shipping cost for invoices and orders.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                {/* IGST Rate */}
                <div className="border border-gray-200 rounded-lg p-4 bg-white">
                  <div className="mb-3">
                    <h3 className="text-sm font-semibold text-gray-900 mb-0.5 flex items-center gap-2">
                      <i className="ri-percent-line text-TextPrimaryColor text-base"></i>
                      IGST Rate
                    </h3>
                    <p className="text-[10px] text-gray-600">
                      Integrated Goods and Services Tax
                    </p>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={igstRate}
                      onChange={(e) => handleGstRateChange('igst', e.target.value)}
                      className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-TextPrimaryColor focus:border-transparent"
                      placeholder="0"
                      disabled={loader}
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold text-xs">
                      %
                    </span>
                  </div>
                </div>

                {/* CGST Rate */}
                <div className="border border-gray-200 rounded-lg p-4 bg-white">
                  <div className="mb-3">
                    <h3 className="text-sm font-semibold text-gray-900 mb-0.5 flex items-center gap-2">
                      <i className="ri-percent-line text-TextPrimaryColor text-base"></i>
                      CGST Rate
                    </h3>
                    <p className="text-[10px] text-gray-600">
                      Central Goods and Services Tax
                    </p>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={cgstRate}
                      onChange={(e) => handleGstRateChange('cgst', e.target.value)}
                      className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-TextPrimaryColor focus:border-transparent"
                      placeholder="2.5"
                      disabled={loader}
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold text-xs">
                      %
                    </span>
                  </div>
                </div>

                {/* SGST/UTGST Rate */}
                <div className="border border-gray-200 rounded-lg p-4 bg-white">
                  <div className="mb-3">
                    <h3 className="text-sm font-semibold text-gray-900 mb-0.5 flex items-center gap-2">
                      <i className="ri-percent-line text-TextPrimaryColor text-base"></i>
                      SGST/UTGST Rate
                    </h3>
                    <p className="text-[10px] text-gray-600">
                      State/UT Goods and Services Tax
                    </p>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={sgstRate}
                      onChange={(e) => handleGstRateChange('sgst', e.target.value)}
                      className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-TextPrimaryColor focus:border-transparent"
                      placeholder="2.5"
                      disabled={loader}
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold text-xs">
                      %
                    </span>
                  </div>
                </div>

                {/* Shipping Cost Per KM */}
                <div className="border border-gray-200 rounded-lg p-4 bg-white">
                  <div className="mb-3">
                    <h3 className="text-sm font-semibold text-gray-900 mb-0.5 flex items-center gap-2">
                      <i className="ri-truck-line text-TextPrimaryColor text-base"></i>
                      Shipping Cost/KM
                    </h3>
                    <p className="text-[10px] text-gray-600">
                      Cost per kilometer for delivery
                    </p>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={shippingCostPerKm}
                      onChange={(e) => handleGstRateChange('shipping', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-TextPrimaryColor focus:border-transparent"
                      placeholder="0"
                      disabled={loader}
                    />
                  </div>
                </div>

                {/* Handling Fee */}
                <div className="border border-gray-200 rounded-lg p-4 bg-white">
                  <div className="mb-3">
                    <h3 className="text-sm font-semibold text-gray-900 mb-0.5 flex items-center gap-2">
                      <i className="ri-hand-coin-line text-TextPrimaryColor text-base"></i>
                      Handling Fee
                    </h3>
                    <p className="text-[10px] text-gray-600">
                      Fixed handling charge per order
                    </p>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={handlingFee}
                      onChange={(e) => handleGstRateChange('handling', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-TextPrimaryColor focus:border-transparent"
                      placeholder="10"
                      disabled={loader}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Carousel Images Section */}
            <div className="mt-8">
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-1">
                  Homepage Carousel Images
                </h2>
                <p className="text-sm text-gray-600">
                  Upload multiple images for the homepage carousel. Recommended size: 1920x600px
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-6 bg-white">
                {/* Upload Button - Only show when no images */}
                {(carouselImages.length === 0 && newCarouselImages.length === 0) && (
                  <div className="mb-6">
                    <label className="inline-flex items-center gap-2 px-6 py-2 bg-TextPrimaryColor text-white rounded cursor-pointer hover:opacity-90 transition-all text-[12px]">
                      <i className="ri-upload-cloud-2-line"></i>
                      <span>Upload Carousel Images</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        multiple
                        onChange={handleCarouselImageAdd}
                        className="hidden"
                        disabled={loader}
                      />
                    </label>
                    <p className="text-xs text-gray-500 mt-2">
                      You can select multiple images at once. Max 5MB per image.
                    </p>
                  </div>
                )}

                {/* Carousel Images Grid */}
                {(carouselImages.length > 0 || newCarouselImages.length > 0) ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {/* Existing Images */}
                    {carouselImages.map((image) => (
                      <div key={image.id} className="relative group">
                        <div className="relative w-full h-24 border-2 border-gray-300 rounded-lg overflow-hidden">
                          <img
                            src={image.url}
                            alt="Carousel"
                            className="w-full h-full object-cover"
                          />
                          {/* Delete Button */}
                          <button
                            onClick={() => handleCarouselImageRemove(image)}
                            className="absolute top-1 right-1 w-6 h-6 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100"
                            disabled={loader}
                          >
                            <i className="ri-delete-bin-line text-xs"></i>
                          </button>
                          {/* Order Badge */}
                          <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black bg-opacity-70 text-white text-[10px] rounded">
                            #{image.order}
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* New Images (Not Yet Uploaded) */}
                    {newCarouselImages.map((image) => (
                      <div key={image.tempId} className="relative group">
                        <div className="relative w-full h-24 border-2 border-green-400 rounded-lg overflow-hidden">
                          <img
                            src={image.preview}
                            alt="New Carousel"
                            className="w-full h-full object-cover"
                          />
                          {/* Delete Button */}
                          <button
                            onClick={() => handleCarouselImageRemove(image)}
                            className="absolute top-1 right-1 w-6 h-6 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100"
                            disabled={loader}
                          >
                            <i className="ri-delete-bin-line text-xs"></i>
                          </button>
                          {/* New Badge */}
                          <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-green-600 text-white text-[10px] rounded font-medium">
                            NEW
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Add More Card - Shows when there are images */}
                    <label className="relative group cursor-pointer">
                      <div className="relative w-full h-24 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden hover:border-TextPrimaryColor hover:bg-gray-50 transition-all flex items-center justify-center">
                        <div className="text-center">
                          <i className="ri-add-line text-3xl text-gray-400 group-hover:text-TextPrimaryColor transition-colors"></i>
                          <p className="text-[10px] text-gray-500 mt-1">Add More</p>
                        </div>
                      </div>
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        multiple
                        onChange={handleCarouselImageAdd}
                        className="hidden"
                        disabled={loader}
                      />
                    </label>
                  </div>
                ) : (
                  <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                    <i className="ri-image-line text-5xl text-gray-400 mb-3"></i>
                    <p className="text-gray-600 font-medium mb-1">No carousel images uploaded</p>
                    <p className="text-sm text-gray-500">Click the upload button above to add images</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  );
};

export default SettingsList;
