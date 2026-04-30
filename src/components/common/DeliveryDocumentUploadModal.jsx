import React, { useState, useRef, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { FileUpload } from 'primereact/fileupload';
import { Toast } from 'primereact/toast';
import { ProgressBar } from 'primereact/progressbar';
import { Image } from 'primereact/image';
import { allApiWithHeaderToken } from '@api/api';
import { API_CONSTANTS } from '@constants/apiurl';
import ButtonComponent from '@common/ButtonComponent';

const DeliveryDocumentUploadModal = ({ visible, onHide, orderId, onUploadSuccess }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(false);
  const toast = useRef(null);
  const fileUploadRef = useRef(null);

  // Fetch order data when modal opens
  useEffect(() => {
    if (visible && orderId) {
      fetchOrderData();
    }
  }, [visible, orderId]);

  const fetchOrderData = async () => {
    try {
      setLoading(true);
      const response = await allApiWithHeaderToken(`${API_CONSTANTS.COMMON_ORDER_URL}/${orderId}`, "", "get");
      if (response.status === 200) {
        setOrderData(response.data.data);
      }
    } catch (error) {
      toast.current.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to fetch order details',
        life: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadDeliveryDocument = async () => {
    try {
      setLoading(true);
      const token = JSON.parse(localStorage.getItem('token'));
      const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/v1/orders/${orderId}/delivery_document`, {
        method: 'GET',
        headers: {
          'Authorization': `${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download delivery document');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `delivery_document_order_${orderId}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.current.show({
        severity: 'success',
        summary: 'Success',
        detail: 'Delivery document downloaded successfully',
        life: 3000
      });
    } catch (error) {
      toast.current.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to download delivery document',
        life: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  const onUpload = async (event) => {
    const file = event.files[0];
    
    if (!file) {
      toast.current.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Please select a file to upload',
        life: 3000
      });
      return;
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      toast.current.show({
        severity: 'error',
        summary: 'Invalid File Type',
        detail: 'Only PDF, JPG, JPEG, and PNG files are allowed',
        life: 3000
      });
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.current.show({
        severity: 'error',
        summary: 'File Too Large',
        detail: 'File size must be less than 10MB',
        life: 3000
      });
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append('delivery_document', file);

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await allApiWithHeaderToken(
        `${API_CONSTANTS.COMMON_ORDER_URL}/${orderId}/upload_delivery_document`,
        formData,
        'post',
        {
          'Content-Type': 'multipart/form-data'
        }
      );

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.status === 200) {
        toast.current.show({
          severity: 'success',
          summary: 'Success',
          detail: 'Delivery document uploaded successfully',
          life: 3000
        });

        // Clear the file upload
        if (fileUploadRef.current) {
          fileUploadRef.current.clear();
        }

        // Refresh order data to show the uploaded document
        await fetchOrderData();

        // Call success callback
        if (onUploadSuccess) {
          onUploadSuccess();
        }

        // Clear file upload
        if (fileUploadRef.current) {
          fileUploadRef.current.clear();
        }
      }
    } catch (error) {
      toast.current.show({
        severity: 'error',
        summary: 'Upload Failed',
        detail: error?.response?.data?.errors || 'Failed to upload delivery document',
        life: 3000
      });
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const customUploader = (event) => {
    onUpload(event);
  };

  const headerTemplate = (options) => {
    const { className, chooseButton, cancelButton } = options;
    return (
      <div className={className} style={{ backgroundColor: 'transparent', display: 'flex', alignItems: 'center' }}>
        {chooseButton}
        {cancelButton}
      </div>
    );
  };

  const itemTemplate = (file, props) => {
    return (
      <div className="flex align-items-center flex-wrap">
        <div className="flex align-items-center" style={{ width: '40%' }}>
          <img alt={file.name} role="presentation" src={file.objectURL} width={100} />
          <span className="flex flex-column text-left ml-3">
            {file.name}
            <small>{new Date().toLocaleDateString()}</small>
          </span>
        </div>
        <div className="flex-1 text-right">
          <Button
            type="button"
            icon="pi pi-times"
            className="p-button-outlined p-button-rounded p-button-danger ml-auto"
            onClick={() => props.onRemove()}
          />
        </div>
      </div>
    );
  };

  const emptyTemplate = () => {
    return (
      <div className="flex align-items-center flex-column p-4">
        <i className="ri-file-upload-line text-2xl text-gray-400 mb-2"></i>
        <span className="text-sm text-TextSecondaryColor">Drag and Drop Delivery Bill Here</span>
        <span className="text-xs text-gray-400 mt-1">PDF, JPG, JPEG, PNG (Max 10MB)</span>
      </div>
    );
  };

  const chooseOptions = {
    icon: 'pi pi-fw pi-file',
    iconOnly: true,
    className: 'custom-choose-btn p-button-rounded p-button-outlined'
  };

  const cancelOptions = {
    icon: 'pi pi-fw pi-times',
    iconOnly: true,
    className: 'custom-cancel-btn p-button-danger p-button-rounded p-button-outlined'
  };

  const hasDeliveryDocument = orderData?.has_delivery_document || orderData?.delivery_document_url;

  return (
    <>
      <Toast ref={toast} position="top-right" />
      <Dialog
        header={hasDeliveryDocument ? "Delivery Bill" : "Upload Delivery Bill"}
        visible={visible}
        onHide={onHide}
        style={{ width: '50vw' }}
        breakpoints={{ '960px': '70vw', '641px': '90vw' }}
        modal
        className="p-fluid"
      >
        <div className="p-3">
          {loading ? (
            <div className="text-center p-3">
              <ProgressBar mode="indeterminate" style={{ height: '4px' }} />
              <p className="mt-2 text-sm">Loading order details...</p>
            </div>
          ) : (
            <>
              {/* Order Information */}
              <div className="mb-3 p-2 bg-BgSecondaryColor border rounded border-BorderColor">
                <div className="text-sm font-medium mb-2 text-TextPrimaryColor">Order Details</div>
                <div className="grid grid-cols-2 gap-3 text-xs text-TextSecondaryColor">
                  <div><span className="font-medium">Order ID:</span> #{orderData?.id}</div>
                  <div><span className="font-medium">Batch:</span> {orderData?.batch_number || 'N/A'}</div>
                  <div><span className="font-medium">Status:</span> <span className="capitalize">{orderData?.order_status?.replace(/_/g, ' ')}</span></div>
                  <div><span className="font-medium">Customer:</span> {orderData?.user?.name}</div>
                </div>
              </div>

              {/* Existing Document Display */}
              {hasDeliveryDocument ? (
                <div className="mb-3">
                  <div className="text-sm font-medium mb-2 text-green-600 flex items-center gap-2">
                    <i className="ri-file-check-line"></i>
                    Delivery Bill Available
                  </div>
                  <div className="border rounded p-3 bg-green-50 border-green-200">
                    <p className="text-xs text-gray-600 mb-2">
                      A delivery bill has been uploaded for this order.
                    </p>
                    {orderData?.delivery_document_url && (
                      <div className="mb-3">
                        {orderData.delivery_document_url.includes('.pdf') ? (
                          <div className="flex items-center gap-2">
                            <i className="ri-file-pdf-line text-red-500 text-lg"></i>
                            <span className="text-xs">PDF Document</span>
                          </div>
                        ) : (
                          <Image 
                            src={orderData.delivery_document_url} 
                            alt="Delivery Bill" 
                            width="150" 
                            height="100"
                            preview 
                            className="border rounded"
                          />
                        )}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <ButtonComponent
                        label="Download"
                        icon="ri-download-line"
                        onClick={downloadDeliveryDocument}
                        className="rounded bg-green-600 px-3 py-1 text-xs text-white"
                        disabled={loading}
                      />
                      <ButtonComponent
                        label="Replace"
                        icon="ri-upload-line"
                        onClick={() => setOrderData({...orderData, has_delivery_document: false})}
                        className="rounded bg-orange-600 px-3 py-1 text-xs text-white"
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* Upload Section */
                <div className="mb-3">
                  <div className="text-sm font-medium mb-2 text-orange-600 flex items-center gap-2">
                    <i className="ri-upload-line"></i>
                    Upload Delivery Bill
                  </div>
                  <p className="text-xs text-TextSecondaryColor mb-3">
                    Upload the delivery bill (receipt, proof of delivery, etc.) for this order.
                  </p>
                  
                  {uploading && (
                    <div className="mb-3">
                      <ProgressBar value={uploadProgress} showValue={false} style={{ height: '4px' }} />
                      <small className="text-xs text-gray-500">Uploading... {uploadProgress}%</small>
                    </div>
                  )}

                  <FileUpload
                    ref={fileUploadRef}
                    name="delivery_document"
                    customUpload
                    uploadHandler={customUploader}
                    accept="image/*,.pdf"
                    maxFileSize={10000000} // 10MB
                    headerTemplate={headerTemplate}
                    itemTemplate={itemTemplate}
                    emptyTemplate={emptyTemplate}
                    chooseOptions={chooseOptions}
                    cancelOptions={cancelOptions}
                    disabled={uploading}
                    className="custom-file-upload"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 mt-3">
                <ButtonComponent
                  label="Close"
                  icon="ri-close-line"
                  onClick={onHide}
                  className="rounded bg-gray-500 px-4 py-2 text-xs text-white"
                  disabled={uploading || loading}
                />
              </div>
            </>
          )}
        </div>
      </Dialog>
    </>
  );
};

export default DeliveryDocumentUploadModal;
