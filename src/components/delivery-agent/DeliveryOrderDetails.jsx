import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { RadioButton } from "primereact/radiobutton";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Skeleton } from "primereact/skeleton";
import { allApiWithHeaderToken } from "@api/api";
import { API_CONSTANTS } from "@constants/apiurl";
import InputTextComponent from "@common/InputTextComponent";
import { QRCodeSVG } from "qrcode.react";
import axios from "axios";

const DeliveryOrderDetails = () => {
  const toast = useRef(null);
  const navigate = useNavigate();
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Payment method state
  const [paymentMethod, setPaymentMethod] = useState('');
  const [cashAmount, setCashAmount] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [savingPayment, setSavingPayment] = useState(false);
  
  // QR code state
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [qrRevealed, setQrRevealed] = useState(false);
  const [upiSettings, setUpiSettings] = useState({ upi_id: '', merchant_name: '' });
  
  // Camera state
  const [showCameraDialog, setShowCameraDialog] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [currentAction, setCurrentAction] = useState(''); // 'damaged', 'delivered', 'cancel'
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  
  // Action dialogs state
  const [showDamagedDialog, setShowDamagedDialog] = useState(false);
  const [showDeliveredDialog, setShowDeliveredDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [damageReason, setDamageReason] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [cancellationReason, setCancellationReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedOrderStatus, setSelectedOrderStatus] = useState(null);
  
  // Validation errors
  const [paymentErrors, setPaymentErrors] = useState({
    receiverName: '',
    cashAmount: ''
  });

  const orderStatusOptions = [
    { label: 'Mark as Delivered', value: 'delivered', icon: 'ri-check-line', severity: 'success' },
    { label: 'Mark as Damaged', value: 'damaged', icon: 'ri-error-warning-line', severity: 'danger' },
    { label: 'Cancel / Return Order', value: 'cancelled', icon: 'ri-close-circle-line', severity: 'warning' }
  ];

  useEffect(() => {
    fetchOrderDetails();
    fetchUpiSettings();
  }, [orderId]);

  const fetchUpiSettings = async () => {
    try {
      const response = await allApiWithHeaderToken(
        API_CONSTANTS.SETTINGS_URL,
        "",
        "get"
      );
      if (response.status === 200) {
        const settings = response.data;
        setUpiSettings({
          upi_id: settings.upi_id || 'merchant@upi',
          merchant_name: settings.upi_merchant_name || 'Srirammart'
        });
      }
    } catch (error) {
      console.error("Failed to fetch UPI settings:", error);
    }
  };

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await allApiWithHeaderToken(
        `api/v1/delivery_agent/orders/${orderId}`,
        "",
        "get"
      );

      if (response.status === 200) {
        setOrder(response.data.data);
        // Set payment method if already selected, otherwise default to UPI for COD orders
        if (response.data.data.delivery?.cod_payment_method) {
          setPaymentMethod(response.data.data.delivery.cod_payment_method);
          if (response.data.data.delivery.cash_received_amount) {
            setCashAmount(response.data.data.delivery.cash_received_amount);
          }
          if (response.data.data.delivery.cash_receiver_name) {
            setReceiverName(response.data.data.delivery.cash_receiver_name);
          }
        } else if (response.data.data.payment_mode === 'cash_on_delivery') {
          // Default to UPI for COD orders
          setPaymentMethod('upi');
          // Auto-save the default payment method
          handlePaymentMethodChange('upi');
        }
        // Set QR revealed status from DB
        if (response.data.data.delivery?.qr_revealed) {
          setQrRevealed(true);
        }
      }
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Failed to fetch order details",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Set payment method (cash or upi)
  const handlePaymentMethodChange = async (method) => {
    try {
      const response = await allApiWithHeaderToken(
        `api/v1/delivery_agent/orders/${orderId}/set_payment_method`,
        { cod_payment_method: method },
        "patch"
      );

      if (response.status === 200) {
        setPaymentMethod(method);
        // Clear errors when payment method changes
        setPaymentErrors({ receiverName: '', cashAmount: '' });
      }
    } catch (error) {
      console.error("Failed to set payment method:", error);
    }
  };

  // Record cash payment
  const handleRecordCashPayment = async () => {
    if (!receiverName) {
      toast.current.show({
        severity: "warn",
        summary: "Warning",
        detail: "Please enter receiver name",
        life: 3000,
      });
      return;
    }

    if (paymentMethod === 'cash' && !cashAmount) {
      toast.current.show({
        severity: "warn",
        summary: "Warning",
        detail: "Please enter amount received",
        life: 3000,
      });
      return;
    }

    try {
      setSavingPayment(true);
      
      if (paymentMethod === 'cash') {
        const response = await allApiWithHeaderToken(
          `api/v1/delivery_agent/orders/${orderId}/record_cash_payment`,
          {
            cash_received_amount: parseFloat(cashAmount),
            cash_receiver_name: receiverName
          },
          "patch"
        );

        if (response.status === 200) {
          toast.current.show({
            severity: "success",
            summary: "Success",
            detail: "Cash payment recorded successfully",
            life: 3000,
          });
          fetchOrderDetails(); // Refresh order data
        }
      } else if (paymentMethod === 'upi') {
        // For UPI, just save receiver name (amount comes from QR scan)
        const response = await allApiWithHeaderToken(
          `api/v1/delivery_agent/orders/${orderId}/record_cash_payment`,
          {
            cash_received_amount: parseFloat(order.total_price),
            cash_receiver_name: receiverName
          },
          "patch"
        );

        if (response.status === 200) {
          toast.current.show({
            severity: "success",
            summary: "Success",
            detail: "Payment details saved successfully",
            life: 3000,
          });
          fetchOrderDetails(); // Refresh order data
        }
      }
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.message || "Failed to record payment",
        life: 3000,
      });
    } finally {
      setSavingPayment(false);
    }
  };

  // Show QR Code
  const handleShowQR = () => {
    setShowQRDialog(true);
  };

  // Reveal QR Code (save to DB)
  const handleRevealQR = async () => {
    try {
      const response = await allApiWithHeaderToken(
        `api/v1/delivery_agent/orders/${orderId}/reveal_qr`,
        {},
        "patch"
      );

      if (response.status === 200) {
        setQrRevealed(true);
      }
    } catch (error) {
      console.error("Failed to reveal QR:", error);
    }
  };

  // Generate UPI payment string
  const generateUpiString = () => {
    const { upi_id, merchant_name } = upiSettings;
    const amount = parseFloat(order.total_price).toFixed(2);
    const transactionNote = `Order #${order.id}`;
    
    return `upi://pay?pa=${upi_id}&pn=${encodeURIComponent(merchant_name)}&am=${amount}&cu=INR&tn=${encodeURIComponent(transactionNote)}`;
  };

  // Open camera for specific action
  const openCameraForAction = async (action) => {
    setCurrentAction(action);
    await openCamera();
  };

  // Open camera using WebRTC
  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Use back camera on mobile
      });
      setCameraStream(stream);
      setShowCameraDialog(true);
      
      // Wait for video element to be ready
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (error) {
      console.error("Camera error:", error);
      
      let errorMessage = "Failed to access camera";
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage = "Camera permission denied. Please allow camera access in your browser settings.";
      } else if (error.name === 'NotFoundError') {
        errorMessage = "No camera device found on your device.";
      }
      
      toast.current.show({
        severity: "error",
        summary: "Camera Error",
        detail: errorMessage,
        life: 3000,
      });
    }
  };

  // Capture photo from video stream
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert canvas to blob
      canvas.toBlob((blob) => {
        if (blob) {
          stopCamera();
          const imageUrl = URL.createObjectURL(blob);
          setCapturedImage({
            blob: blob,
            url: imageUrl
          });
        }
      }, 'image/jpeg', 0.95);
    }
  };

  // Retake photo
  const retakePhoto = () => {
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage.url);
    }
    setCapturedImage(null);
    openCamera();
  };

  // Stop camera stream
  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCameraDialog(false);
  };

  // Cancel capture
  const cancelCapture = () => {
    stopCamera();
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage.url);
      setCapturedImage(null);
    }
    setCurrentAction('');
  };

  // Use captured image (will be called by action dialogs)
  const handleImageCaptured = () => {
    // Stop camera stream
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    // Close camera dialog
    setShowCameraDialog(false);
    // Image is ready in capturedImage state for the dialogs to use
  };

  // Open action dialogs
  const openDamagedDialog = () => {
    setDamageReason('');
    setCapturedImage(null);
    setShowDamagedDialog(true);
  };

  const openDeliveredDialog = () => {
    setDeliveryNotes('');
    setCapturedImage(null);
    setShowDeliveredDialog(true);
  };

  const openCancelDialog = () => {
    setCancellationReason('');
    setCapturedImage(null);
    setShowCancelDialog(true);
  };

  // Handle order status dropdown change
  const handleOrderStatusChange = (e) => {
    setSelectedOrderStatus(e.value);
    
    // Validate payment details before opening delivered dialog
    if (e.value === 'delivered') {
      // Check if it's COD order
      if (order.payment_mode === 'cash_on_delivery') {
        const errors = {
          receiverName: '',
          cashAmount: ''
        };
        
        let hasError = false;
        
        // Check receiver name (required for both cash and UPI)
        if (!receiverName || receiverName.trim() === '') {
          errors.receiverName = 'Receiver name is required';
          hasError = true;
        }
        
        // Check cash amount (only for cash payment)
        if (paymentMethod === 'cash') {
          if (!cashAmount || cashAmount.trim() === '') {
            errors.cashAmount = 'Amount received is required';
            hasError = true;
          } else if (parseFloat(cashAmount) <= 0) {
            errors.cashAmount = 'Amount must be greater than 0';
            hasError = true;
          }
        }
        
        setPaymentErrors(errors);
        
        if (hasError) {
          // Don't open dialog, show errors
          setSelectedOrderStatus(null);
          return;
        }
      }
      
      openDeliveredDialog();
    } else if (e.value === 'damaged') {
      openDamagedDialog();
    } else if (e.value === 'cancelled') {
      openCancelDialog();
    }
  };

  // Submit mark as damaged
  const handleMarkDamaged = async () => {
    if (!capturedImage || !damageReason) {
      toast.current.show({
        severity: "warn",
        summary: "Warning",
        detail: "Please capture photo and enter damage reason",
        life: 3000,
      });
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('damage_image', capturedImage.blob, 'damage-proof.jpg');
      formData.append('damage_reason', damageReason);

      const token = localStorage.getItem('token');
      const cleanToken = token ? token.replace(/"/g, '').replace(/^Bearer\s+/, '') : '';
      const baseURL = process.env.REACT_APP_BASE_URL || 'http://localhost:3000';
      
      const response = await axios.patch(
        `${baseURL}/api/v1/delivery_agent/orders/${orderId}/mark_damaged`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${cleanToken}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.status === 200) {
        toast.current.show({
          severity: "success",
          summary: "Success",
          detail: "Order marked as damaged",
          life: 3000,
        });
        setShowDamagedDialog(false);
        setSelectedOrderStatus(null);
        navigate('/delivery-dashboard');
      }
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.message || "Failed to mark as damaged",
        life: 3000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Submit mark as delivered
  const handleMarkDelivered = async () => {
    if (!capturedImage) {
      toast.current.show({
        severity: "warn",
        summary: "Warning",
        detail: "Please capture delivery proof photo",
        life: 3000,
      });
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('delivery_image', capturedImage.blob, 'delivery-proof.jpg');
      formData.append('delivery_latitude', 0);
      formData.append('delivery_longitude', 0);
      if (deliveryNotes) {
        formData.append('delivery_notes', deliveryNotes);
      }

      const token = localStorage.getItem('token');
      const cleanToken = token ? token.replace(/"/g, '').replace(/^Bearer\s+/, '') : '';
      const baseURL = process.env.REACT_APP_BASE_URL || 'http://localhost:3000';
      
      const response = await axios.patch(
        `${baseURL}/api/v1/delivery_agent/orders/${orderId}/mark_delivered`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${cleanToken}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.status === 200) {
        toast.current.show({
          severity: "success",
          summary: "Success",
          detail: "Order marked as delivered",
          life: 3000,
        });
        setShowDeliveredDialog(false);
        setSelectedOrderStatus(null);
        navigate('/delivery-dashboard');
      }
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.message || "Failed to mark as delivered",
        life: 3000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Submit cancel order
  const handleCancelOrder = async () => {
    if (!cancellationReason) {
      toast.current.show({
        severity: "warn",
        summary: "Warning",
        detail: "Please enter cancellation reason",
        life: 3000,
      });
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('cancellation_reason', cancellationReason);
      if (capturedImage) {
        formData.append('cancellation_image', capturedImage.blob, 'cancellation-proof.jpg');
      }

      const token = localStorage.getItem('token');
      const cleanToken = token ? token.replace(/"/g, '').replace(/^Bearer\s+/, '') : '';
      const baseURL = process.env.REACT_APP_BASE_URL || 'http://localhost:3000';
      
      const response = await axios.patch(
        `${baseURL}/api/v1/delivery_agent/orders/${orderId}/cancel_order`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${cleanToken}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.status === 200) {
        toast.current.show({
          severity: "success",
          summary: "Success",
          detail: "Order cancelled successfully",
          life: 3000,
        });
        setShowCancelDialog(false);
        setSelectedOrderStatus(null);
        navigate('/delivery-dashboard');
      }
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.message || "Failed to cancel order",
        life: 3000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header Skeleton */}
        <div 
          className="shadow-md sticky top-0 z-50"
          style={{
            background: 'linear-gradient(180deg, #FFC107 0%, #FFD54F 100%)'
          }}
        >
          <div className="px-3 sm:px-4">
            <div className="flex items-center h-12">
              <Skeleton width="2rem" height="2rem" className="mr-2" />
              <Skeleton width="8rem" height="1rem" />
            </div>
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="px-3 py-2">
          <div className="bg-white rounded-lg shadow-sm p-3 mb-2">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <Skeleton width="60%" height="1rem" className="mb-1" />
                <Skeleton width="40%" height="0.75rem" />
              </div>
              <div>
                <Skeleton width="4rem" height="1.25rem" className="mb-1" />
                <Skeleton width="3rem" height="0.75rem" />
              </div>
            </div>
            <Skeleton width="80%" height="0.75rem" className="mb-2" />
            
            <div className="border-t pt-2 mt-2">
              <Skeleton width="40%" height="0.75rem" className="mb-1" />
              <Skeleton width="100%" height="2rem" />
            </div>
            
            <div className="border-t pt-2 mt-2">
              <Skeleton width="30%" height="0.75rem" className="mb-1" />
              <Skeleton width="100%" height="3rem" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-3 mb-2">
            <Skeleton width="50%" height="0.75rem" className="mb-2" />
            <Skeleton width="100%" height="2.5rem" />
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-3">
            <Skeleton width="40%" height="0.75rem" className="mb-2" />
            <Skeleton width="100%" height="2.5rem" />
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <i className="ri-inbox-line text-4xl text-gray-300"></i>
          <p className="text-gray-500 mt-4 text-sm">Order not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toast ref={toast} />
      
      {/* Custom CSS for Dropdown */}
      <style>{`
        .p-dropdown .p-dropdown-label,
        .p-dropdown .p-inputtext,
        .p-dropdown .p-placeholder {
          font-size: 0.875rem !important;
        }
        .p-dropdown-panel .p-dropdown-items .p-dropdown-item {
          font-size: 0.875rem !important;
        }
        .p-dropdown .p-dropdown-trigger {
          width: 2rem !important;
        }
        .p-dropdown .p-dropdown-trigger .p-icon {
          font-size: 0.875rem !important;
        }
      `}</style>

      {/* Header - Sticky */}
      <div 
        className="shadow-md sticky top-0 z-50"
        style={{
          background: 'linear-gradient(180deg, #FFC107 0%, #FFD54F 100%)'
        }}
      >
        <div className="px-3 sm:px-4">
          <div className="flex items-center h-12">
            <Button
              icon="ri-arrow-left-line"
              className="p-button-text p-button-sm"
              onClick={() => navigate('/delivery-dashboard')}
              style={{ color: '#1f2937' }}
            />
            <h1 className="text-sm font-semibold text-gray-900 ml-2">Order #{order.id}</h1>
          </div>
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="px-3 py-2">
        {/* Order Info Card */}
        <div className="bg-white rounded-lg shadow-sm p-3 mb-2">
          {/* Customer & Order Info */}
          <div className="pb-2 border-b">
            <div className="flex justify-between items-start mb-1">
              <div>
                <p className="text-sm font-semibold text-gray-800">{order.customer.name}</p>
                <p className="text-xs text-gray-600">{order.customer.phone_number}</p>
              </div>
              <div className="text-right">
                <p className="text-base font-bold text-gray-800">₹{parseFloat(order.total_price).toFixed(2)}</p>
                <p className="text-[10px] text-gray-500 uppercase">
                  {order.payment_mode === 'cash_on_delivery' ? 'COD' : order.payment_mode?.replace('_', ' ')}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500">{order.customer.email}</p>
          </div>

          {/* Shipping Address */}
          {order.shipping_address && (
            <div className="py-2 border-b">
              <p className="text-xs font-semibold text-gray-800 mb-1">Delivery Address</p>
              <p className="text-xs text-gray-700 leading-relaxed">
                {order.shipping_address.flat_no}, {order.shipping_address.landmark}, {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.zip_code}
              </p>
            </div>
          )}

          {/* Delivery Info */}
          {order.estimated_delivery_date && (
            <div className="py-2 border-b">
              <p className="text-xs font-semibold text-gray-800 mb-1">Delivery Info</p>
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">
                  {new Date(order.estimated_delivery_date).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </span>
                {order.delivery_time_slot && (
                  <span className="text-gray-600">{order.delivery_time_slot}</span>
                )}
              </div>
            </div>
          )}

          {/* Order Items */}
          <div className="pt-2">
            <p className="text-xs font-semibold text-gray-800 mb-1">Items</p>
            <div className="space-y-1">
              {order.items?.map((item, index) => (
                <div key={index} className="flex justify-between items-center bg-gray-50 p-1.5 rounded text-xs">
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{item.product_name}</p>
                    <p className="text-[10px] text-gray-600">{item.weight} × {item.quantity}</p>
                  </div>
                  <p className="font-semibold text-gray-800">₹{parseFloat(item.price).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* COD Payment Section */}
        {order.payment_mode === 'cash_on_delivery' && (
          <div className="bg-white rounded-lg shadow-sm p-3 mb-2">
            <p className="text-xs font-semibold text-gray-800 mb-2">Payment Collection</p>
            
            {/* Payment Method Selection */}
            <div className="flex items-center gap-4 mb-3">
              <div className="flex items-center">
                <RadioButton
                  inputId="cash"
                  name="paymentMethod"
                  value="cash"
                  onChange={(e) => handlePaymentMethodChange(e.value)}
                  checked={paymentMethod === 'cash'}
                  disabled={savingPayment}
                />
                <label htmlFor="cash" className="ml-2 text-xs text-gray-700 cursor-pointer">
                  Cash
                </label>
              </div>
              <div className="flex items-center flex-1">
                <RadioButton
                  inputId="upi"
                  name="paymentMethod"
                  value="upi"
                  onChange={(e) => handlePaymentMethodChange(e.value)}
                  checked={paymentMethod === 'upi'}
                  disabled={savingPayment}
                />
                <label htmlFor="upi" className="ml-2 text-xs text-gray-700 cursor-pointer">
                  UPI
                </label>
                {paymentMethod === 'upi' && (
                  <button
                    onClick={handleShowQR}
                    className="ml-auto w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                    title="Show QR Code"
                  >
                    <i className="ri-qr-code-line text-2xl text-blue-600"></i>
                  </button>
                )}
              </div>
            </div>

            {/* Cash Payment Form */}
            {paymentMethod === 'cash' && (
              <div className="space-y-2 border-t pt-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Amount Received</label>
                    <InputTextComponent
                      type="number"
                      value={cashAmount}
                      onChange={(e) => {
                        setCashAmount(e.target.value);
                        // Clear error when user types
                        if (paymentErrors.cashAmount) {
                          setPaymentErrors(prev => ({ ...prev, cashAmount: '' }));
                        }
                      }}
                      placeholder="₹ Amount"
                      className={`w-full text-sm ${paymentErrors.cashAmount ? 'border-red-500' : ''}`}
                      disabled={savingPayment}
                    />
                    {paymentErrors.cashAmount && (
                      <p className="text-xs text-red-500 mt-1">{paymentErrors.cashAmount}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Receiver Name</label>
                    <InputTextComponent
                      value={receiverName}
                      onChange={(e) => {
                        setReceiverName(e.target.value);
                        // Clear error when user types
                        if (paymentErrors.receiverName) {
                          setPaymentErrors(prev => ({ ...prev, receiverName: '' }));
                        }
                      }}
                      placeholder="Name"
                      className={`w-full text-sm ${paymentErrors.receiverName ? 'border-red-500' : ''}`}
                      disabled={savingPayment}
                    />
                    {paymentErrors.receiverName && (
                      <p className="text-xs text-red-500 mt-1">{paymentErrors.receiverName}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* UPI Payment Form */}
            {paymentMethod === 'upi' && (
              <div className="border-t pt-2">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Receiver Name</label>
                  <InputTextComponent
                    value={receiverName}
                    onChange={(e) => {
                      setReceiverName(e.target.value);
                      // Clear error when user types
                      if (paymentErrors.receiverName) {
                        setPaymentErrors(prev => ({ ...prev, receiverName: '' }));
                      }
                    }}
                    placeholder="Enter receiver name"
                    className={`w-full text-sm ${paymentErrors.receiverName ? 'border-red-500' : ''}`}
                    disabled={savingPayment}
                  />
                  {paymentErrors.receiverName && (
                    <p className="text-xs text-red-500 mt-1">{paymentErrors.receiverName}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Order Status Dropdown */}
        <div className="bg-white rounded-lg shadow-sm p-3 mb-2">
          <label className="block text-xs text-gray-600 mb-1.5">Select Order Status</label>
          <Dropdown
            value={selectedOrderStatus}
            onChange={handleOrderStatusChange}
            options={orderStatusOptions}
            optionLabel="label"
            placeholder="Choose an action..."
            className="w-full"
            style={{ fontSize: '0.875rem' }}
            panelStyle={{ fontSize: '0.875rem' }}
          />
        </div>

        {/* Save Details Button */}
        {(paymentMethod === 'cash' || paymentMethod === 'upi') && (
          <button
            onClick={handleRecordCashPayment}
            disabled={savingPayment || !receiverName || (paymentMethod === 'cash' && !cashAmount)}
            className="w-full py-3 px-4 rounded-lg font-semibold text-gray-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: savingPayment ? '#e0e0e0' : 'linear-gradient(180deg, #FFC107 0%, #FFD54F 100%)',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            {savingPayment ? (
              <span className="flex items-center justify-center gap-2">
                <i className="ri-loader-4-line animate-spin"></i>
                Saving...
              </span>
            ) : (
              'Save Details'
            )}
          </button>
        )}
      </div>

      {/* Camera Modal - Native Phone Camera Style */}
      {showCameraDialog && (
        <div className="fixed inset-0 z-[9999] bg-black">
          {/* Camera View */}
          {!capturedImage && (
            <div className="relative w-full h-full">
              {/* Video Stream - Full Screen */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover"
              />
              
              {/* Hidden canvas for capture */}
              <canvas ref={canvasRef} className="hidden" />
              
              {/* Close Button - Top Left */}
              <button
                onClick={cancelCapture}
                className="absolute top-4 left-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-black/40 text-white"
              >
                <i className="ri-close-line text-2xl"></i>
              </button>
              
              {/* Action Label */}
              <div className="absolute top-4 left-0 right-0 flex justify-center">
                <div className="bg-black/60 px-4 py-2 rounded-full">
                  <p className="text-white text-sm font-medium">
                    {currentAction === 'damaged' && 'Capture Damage Photo'}
                    {currentAction === 'delivered' && 'Capture Delivery Proof'}
                    {currentAction === 'cancel' && 'Capture Photo (Optional)'}
                  </p>
                </div>
              </div>
              
              {/* Capture Button - Bottom Center */}
              <div className="absolute bottom-8 left-0 right-0 flex justify-center">
                <button
                  onClick={capturePhoto}
                  className="w-20 h-20 rounded-full bg-white border-[6px] border-gray-300 shadow-lg active:scale-95 transition-transform"
                />
              </div>
            </div>
          )}
          
          {/* Preview View */}
          {capturedImage && (
            <div className="relative w-full h-full">
              {/* Captured Image - Full Screen */}
              <img
                src={capturedImage.url}
                alt="Captured"
                className="absolute inset-0 w-full h-full object-contain bg-black"
              />
              
              {/* Close Button - Top Left */}
              <button
                onClick={cancelCapture}
                className="absolute top-4 left-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-black/40 text-white"
              >
                <i className="ri-close-line text-2xl"></i>
              </button>
              
              {/* Action Buttons - Bottom */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/60 to-transparent">
                <div className="flex gap-3">
                  <button
                    onClick={retakePhoto}
                    className="flex-1 py-3 px-4 bg-white/20 backdrop-blur-sm text-white rounded-lg font-medium text-sm active:scale-95 transition-transform flex items-center justify-center gap-1.5"
                  >
                    <i className="ri-camera-line text-base"></i>
                    Retake
                  </button>
                  <button
                    onClick={handleImageCaptured}
                    className="flex-1 py-3 px-4 bg-green-500 text-white rounded-lg font-medium text-sm active:scale-95 transition-transform flex items-center justify-center gap-1.5"
                  >
                    <i className="ri-upload-line text-base"></i>
                    Upload
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* QR Code Payment Dialog */}
      <Dialog
        visible={showQRDialog}
        style={{ width: "90vw", maxWidth: "380px" }}
        onHide={() => setShowQRDialog(false)}
        breakpoints={{ '960px': '75vw', '640px': '95vw' }}
        showHeader={false}
      >
        <div className="flex flex-col items-center gap-3 py-3 px-3">
          {/* Amount Display */}
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900">₹{parseFloat(order.total_price).toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-0.5">Amount to Pay</p>
          </div>

          {/* QR Code Container with Frame */}
          <div className="relative w-full max-w-[280px] aspect-square">
            {/* Decorative Corner Frames */}
            <div className="absolute -top-1.5 -left-1.5 w-12 h-12 border-l-[3px] border-t-[3px] border-white rounded-tl-2xl"></div>
            <div className="absolute -top-1.5 -right-1.5 w-12 h-12 border-r-[3px] border-t-[3px] border-white rounded-tr-2xl"></div>
            <div className="absolute -bottom-1.5 -left-1.5 w-12 h-12 border-l-[3px] border-b-[3px] border-white rounded-bl-2xl"></div>
            <div className="absolute -bottom-1.5 -right-1.5 w-12 h-12 border-r-[3px] border-b-[3px] border-white rounded-br-2xl"></div>

            {/* QR Code with Blur */}
            <div className={`w-full h-full bg-white rounded-xl shadow-xl p-4 flex items-center justify-center transition-all duration-300 ${!qrRevealed ? 'blur-lg' : ''}`}>
              <QRCodeSVG
                value={generateUpiString()}
                size={240}
                level="H"
                includeMargin={false}
                style={{ width: '100%', height: '100%' }}
              />
            </div>

            {/* Show Button Overlay */}
            {!qrRevealed && (
              <div className="absolute inset-0 flex items-center justify-center">
                <button
                  onClick={handleRevealQR}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-2.5 rounded-full font-semibold text-sm shadow-xl transform hover:scale-105 transition-all flex items-center gap-2"
                >
                  <i className="ri-eye-line text-lg"></i>
                  Show QR
                </button>
              </div>
            )}
          </div>

          {/* Merchant UPI ID */}
          <div className="w-full text-center bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg py-2.5 px-4 border border-gray-200">
            <p className="text-[10px] text-gray-500 mb-0.5 uppercase tracking-wider">Merchant UPI ID</p>
            <p className="text-sm font-mono font-bold text-gray-800 break-all">
              {upiSettings.upi_id}
            </p>
          </div>

          {/* Close Button */}
          <button
            onClick={() => setShowQRDialog(false)}
            className="mt-1 text-gray-500 hover:text-gray-700 font-medium text-xs"
          >
            Close
          </button>
        </div>
      </Dialog>

      {/* Mark as Damaged Dialog */}
      <Dialog
        visible={showDamagedDialog}
        style={{ width: "90vw", maxWidth: "450px" }}
        onHide={() => {
          setShowDamagedDialog(false);
          setSelectedOrderStatus(null);
        }}
        breakpoints={{ '960px': '80vw', '640px': '95vw' }}
        showHeader={false}
        contentClassName="p-0"
      >
        <div className="p-4 space-y-4">
          {/* Photo Section */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">
              Damage Photo <span className="text-red-500">*</span>
            </label>
            {!capturedImage ? (
              <button
                onClick={() => openCameraForAction('damaged')}
                className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-red-500 hover:bg-red-50 transition-colors flex flex-col items-center justify-center gap-2"
              >
                <i className="ri-camera-line text-3xl text-gray-400"></i>
                <span className="text-sm font-medium text-gray-600">Tap to Capture Photo</span>
                <span className="text-xs text-gray-500">Required to document damage</span>
              </button>
            ) : (
              <div className="relative rounded-lg overflow-hidden border-2 border-red-500">
                <img 
                  src={capturedImage.url} 
                  alt="Damage" 
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-2 right-2 flex gap-2">
                  <button
                    onClick={() => {
                      setCapturedImage(null);
                      openCameraForAction('damaged');
                    }}
                    className="bg-blue-500 hover:bg-blue-600 text-white rounded-full w-9 h-9 flex items-center justify-center shadow-lg transition-colors"
                    title="Edit photo"
                  >
                    <i className="ri-edit-line text-lg"></i>
                  </button>
                  <button
                    onClick={() => setCapturedImage(null)}
                    className="bg-red-500 hover:bg-red-600 text-white rounded-full w-9 h-9 flex items-center justify-center shadow-lg transition-colors"
                    title="Delete photo"
                  >
                    <i className="ri-delete-bin-line text-lg"></i>
                  </button>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                  <p className="text-white text-xs font-medium flex items-center gap-1">
                    <i className="ri-check-circle-fill text-red-400"></i>
                    Photo captured
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Damage Reason Section */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">
              Damage Reason <span className="text-red-500">*</span>
            </label>
            <InputTextarea
              value={damageReason}
              onChange={(e) => setDamageReason(e.target.value)}
              rows={3}
              placeholder="e.g., Package torn, Product broken, Water damage..."
              className="w-full text-sm"
              style={{ resize: 'none', padding: '0.75rem' }}
            />
            <p className="text-xs text-gray-500 mt-1">Describe the damage in detail</p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2 border-t">
            <button
              onClick={() => {
                setShowDamagedDialog(false);
                setSelectedOrderStatus(null);
              }}
              className="flex-1 py-2.5 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleMarkDamaged}
              disabled={submitting || !capturedImage || !damageReason}
              className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <i className="ri-loader-4-line animate-spin"></i>
                  Submitting...
                </>
              ) : (
                <>
                  <i className="ri-error-warning-line"></i>
                  Mark as Damaged
                </>
              )}
            </button>
          </div>
        </div>
      </Dialog>

      {/* Mark as Delivered Dialog */}
      <Dialog
        visible={showDeliveredDialog}
        style={{ width: "90vw", maxWidth: "450px" }}
        onHide={() => {
          setShowDeliveredDialog(false);
          setSelectedOrderStatus(null);
        }}
        breakpoints={{ '960px': '80vw', '640px': '95vw' }}
        showHeader={false}
        contentClassName="p-0"
      >
        <div className="p-4 space-y-4">
          {/* Photo Section */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">
              Delivery Proof Photo <span className="text-red-500">*</span>
            </label>
            {!capturedImage ? (
              <button
                onClick={() => openCameraForAction('delivered')}
                className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-green-500 hover:bg-green-50 transition-colors flex flex-col items-center justify-center gap-2"
              >
                <i className="ri-camera-line text-3xl text-gray-400"></i>
                <span className="text-sm font-medium text-gray-600">Tap to Capture Photo</span>
                <span className="text-xs text-gray-500">Required for delivery proof</span>
              </button>
            ) : (
              <div className="relative rounded-lg overflow-hidden border-2 border-green-500">
                <img 
                  src={capturedImage.url} 
                  alt="Delivery Proof" 
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-2 right-2 flex gap-2">
                  <button
                    onClick={() => {
                      setCapturedImage(null);
                      openCameraForAction('delivered');
                    }}
                    className="bg-blue-500 hover:bg-blue-600 text-white rounded-full w-9 h-9 flex items-center justify-center shadow-lg transition-colors"
                    title="Edit photo"
                  >
                    <i className="ri-edit-line text-lg"></i>
                  </button>
                  <button
                    onClick={() => setCapturedImage(null)}
                    className="bg-red-500 hover:bg-red-600 text-white rounded-full w-9 h-9 flex items-center justify-center shadow-lg transition-colors"
                    title="Delete photo"
                  >
                    <i className="ri-delete-bin-line text-lg"></i>
                  </button>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                  <p className="text-white text-xs font-medium flex items-center gap-1">
                    <i className="ri-check-circle-fill text-green-400"></i>
                    Photo captured
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Delivery Notes Section */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">
              Delivery Notes <span className="text-gray-400 text-[10px]">(Optional)</span>
            </label>
            <InputTextarea
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              rows={3}
              placeholder="e.g., Delivered to security guard, Left at doorstep..."
              className="w-full text-sm placeholder:text-xs"
              style={{ resize: 'none', padding: '0.75rem' }}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2 border-t">
            <button
              onClick={() => {
                setShowDeliveredDialog(false);
                setSelectedOrderStatus(null);
              }}
              className="flex-1 py-2.5 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleMarkDelivered}
              disabled={submitting || !capturedImage}
              className="flex-1 py-2.5 px-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <i className="ri-loader-4-line animate-spin"></i>
                  Submitting...
                </>
              ) : (
                <>
                  <i className="ri-check-line"></i>
                  Mark as Delivered
                </>
              )}
            </button>
          </div>
        </div>
      </Dialog>

      {/* Cancel Order Dialog */}
      <Dialog
        visible={showCancelDialog}
        style={{ width: "90vw", maxWidth: "450px" }}
        onHide={() => {
          setShowCancelDialog(false);
          setSelectedOrderStatus(null);
        }}
        breakpoints={{ '960px': '80vw', '640px': '95vw' }}
        showHeader={false}
        contentClassName="p-0"
      >
        <div className="p-4 space-y-4">
          {/* Photo Section */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">
              Photo <span className="text-gray-400 text-[10px]">(Optional)</span>
            </label>
            {!capturedImage ? (
              <button
                onClick={() => openCameraForAction('cancel')}
                className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-yellow-500 hover:bg-yellow-50 transition-colors flex flex-col items-center justify-center gap-2"
              >
                <i className="ri-camera-line text-3xl text-gray-400"></i>
                <span className="text-sm font-medium text-gray-600">Tap to Capture Photo</span>
                <span className="text-xs text-gray-500">Optional documentation</span>
              </button>
            ) : (
              <div className="relative rounded-lg overflow-hidden border-2 border-yellow-500">
                <img 
                  src={capturedImage.url} 
                  alt="Cancellation" 
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-2 right-2 flex gap-2">
                  <button
                    onClick={() => {
                      setCapturedImage(null);
                      openCameraForAction('cancel');
                    }}
                    className="bg-blue-500 hover:bg-blue-600 text-white rounded-full w-9 h-9 flex items-center justify-center shadow-lg transition-colors"
                    title="Edit photo"
                  >
                    <i className="ri-edit-line text-lg"></i>
                  </button>
                  <button
                    onClick={() => setCapturedImage(null)}
                    className="bg-red-500 hover:bg-red-600 text-white rounded-full w-9 h-9 flex items-center justify-center shadow-lg transition-colors"
                    title="Delete photo"
                  >
                    <i className="ri-delete-bin-line text-lg"></i>
                  </button>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                  <p className="text-white text-xs font-medium flex items-center gap-1">
                    <i className="ri-check-circle-fill text-yellow-400"></i>
                    Photo captured
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Cancellation Reason Section */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">
              Cancellation Reason <span className="text-red-500">*</span>
            </label>
            <InputTextarea
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              rows={3}
              placeholder="e.g., Customer refused, Wrong address, Product unavailable..."
              className="w-full text-sm"
              style={{ resize: 'none', padding: '0.75rem' }}
            />
            <p className="text-xs text-gray-500 mt-1">Provide reason for cancellation or return</p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2 border-t">
            <button
              onClick={() => {
                setShowCancelDialog(false);
                setSelectedOrderStatus(null);
              }}
              className="flex-1 py-2.5 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCancelOrder}
              disabled={submitting || !cancellationReason}
              className="flex-1 py-2.5 px-4 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <i className="ri-loader-4-line animate-spin"></i>
                  Submitting...
                </>
              ) : (
                <>
                  <i className="ri-close-circle-line"></i>
                  Cancel Order
                </>
              )}
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default DeliveryOrderDetails;
