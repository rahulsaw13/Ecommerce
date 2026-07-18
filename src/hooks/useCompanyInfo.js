import { useSelector } from 'react-redux';

const DEFAULT = {
  name: "Dukaansarthi",
  address: "Dukaansarthi Address",
  phone: "",
  email: "",
  gstin: "",
  pan: "",
  pincode: "",
  logo_url: "",
  upi_id: "",
  customer_care_no: "",
  website: "",
  latitude: 0,
  longitude: 0,
  currency: "INR",
};

export function useCompanyInfo() {
  const info = useSelector((state) => state.company?.info) || DEFAULT;
  return info;
}
