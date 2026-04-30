import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { RadioButton } from "primereact/radiobutton";
import { InputTextarea } from "primereact/inputtextarea";
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
  const [upiSettings, setUpiSettings] = useState({ upi_id: '', merchant_name: '' });
  
  // Payment method state
  const [paymentMethod, setPaymentMethod] = useState('');
  const [cashAmount, setCashAmount] = useState('');
  const [receiverName, setReceiverName] = useState('');
  
  // Dialog states
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [showDamagedDialog, setShowDamagedDialog] = useState(false);
  const [showDeliveredDialog, setShowDeliveredDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  
  // Camera states
  const [showCameraDialog, setShowCameraDialog] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [currentAction, setCurrentAction] = useState(''); // 'damaged', 'delivered', 'cancel'
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  
  // Form states
  const [damageReason, setDamageReason] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [cancellationReason, setCancellationReason] = useState('');

  useEffect(() => {
    fetchOrderDetails();
    fetchUpiSettings();
  }, [orderId]);
