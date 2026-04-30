import LovedByIndia from "@assets/love_by_india.svg";
import HandMade from "@assets/hand_made.svg";
import ShipDays from "@assets/ship_days.svg";
import Preservation from "@assets/preservation.svg";

/**
 * Srirammart Configuration
 * Central configuration file for all static data and settings
 */

// Shop/Company Information
export const SHOP_INFO = {
  title: "Srirammart",
  companyName: "Srirammart Private Limited",
  restaurantName: "Srirammart Restaurant",
  logo: "https://cdn.shopify.com/s/files/1/0569/3456/4001/files/logo.svg?v=1676482841",
  logo2: "https://cdn.shopify.com/s/files/1/0569/3456/4001/files/footer_bird.png?v=1712050971",
  email: "prakash.shrama19@gmail.com",
  website: "www.srirammart.com",
  phoneNumber: "+91 7759056303",
  address: "Samastipur, Bihar",
  pincode: "848101",
  // Note: longitude and latitude labels are swapped in original data
  // longitude is actually latitude (23.x) and latitude is actually longitude (72.x)
  longitude: "23.11455354935856", // Actually latitude
  latitude: "72.54124752533784",  // Actually longitude
  timing: {
    days: "Every day",
    time: "8 AM to 8 PM"
  },
  social: [
    {
      name: "Facebook",
      url: "#",
      icon: 'ri-facebook-fill'
    },
    {
      name: "X",
      url: "#",
      icon: 'ri-twitter-x-fill'
    },
    {
      name: "Instagram",
      url: "#",
      icon: 'ri-instagram-fill'
    },
    {
      name: "Whatsapp",
      url: "https://api.whatsapp.com/send/?phone=917759056303&text&type=phone_number&app_absent=0",
      icon: 'ri-whatsapp-fill'
    }
  ]
};

// GST and Tax Information
export const TAX_INFO = {
  gstin: "29AAJCC03151IZQ",
  hsnCode: "996331",
  serviceDescription: "Restaurant Service",
  category: "B2C",
  reverseChargesApplicable: "No"
};

// Invoice Configuration
export const INVOICE_CONFIG = {
  // Invoice number format: YYYYMMDD-XXX
  // Example: 20260126-001 (Year-Month-Day-OrderNumber)
  generateInvoiceNumber: (orderDate, orderId) => {
    const date = new Date(orderDate);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const orderNumber = String(orderId).padStart(3, '0');
    return `${year}${month}${day}-${orderNumber}`;
  },
  
  // Invoice title
  title: "TAX INVOICE",
  
  // Footer text
  footerText: "Thank you for your business!",
  
  // Terms and conditions
  terms: [
    "Goods once sold will not be taken back or exchanged",
    "All disputes are subject to jurisdiction only",
    "Payment terms: As per agreement"
  ]
};

// Benefits/Features
export const BENEFITS = [
  {
    title: "Loved By India",
    description: "Loved by 5 lakh+ customers",
    image: LovedByIndia
  },
  {
    title: "Handmade",
    description: "Every piece is made with love",
    image: HandMade
  },
  {
    title: "Ships In 1-2 Days",
    description: "Write to us to expedite your order",
    image: ShipDays
  },
  {
    title: "No Preservatives",
    description: "Pure taste, naturally fresh",
    image: Preservation
  }
];

// Festival Special Footer
export const FESTIVAL_SPECIAL_FOOTER = {
  title: "",
  description: ""
};

// Delivery Configuration
export const DELIVERY_CONFIG = {
  maxDeliveryRadius: 50, // km
  deliveryFeePerKm: 10, // rupees
  minOrderValue: 0 // rupees
};

// Messages Configuration
export const MESSAGES = {
  notDelivering: {
    title: "We're not delivering to your location yet",
    message: "But we're expanding! Check back soon or contact us for updates.",
    buttonText: "Update Location"
  }
};

// Company Configuration (for Header/Footer)
export const COMPANY = {
  name: "Srirammart",
  description: "Your trusted source for quality products delivered fresh to your doorstep.",
  social: {
    facebook: "https://www.facebook.com/srirammart",
    instagram: "https://www.instagram.com/srirammart",
    twitter: "https://twitter.com/srirammart",
    youtube: "https://www.youtube.com/@srirammart"
  }
};

// Helper function to check if delivery is available
export const isDeliveryAvailable = (distance) => {
  return distance <= DELIVERY_CONFIG.maxDeliveryRadius;
};

// Helper function to get delivery time message
export const getDeliveryTimeMessage = () => {
  return `Delivery available ${SHOP_INFO.timing.days}, ${SHOP_INFO.timing.time}`;
};

// Helper function to convert number to words (Indian numbering system)
export const numberToWords = (num) => {
  if (num === 0) return 'Zero';
  
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  
  const convertLessThanThousand = (n) => {
    if (n === 0) return '';
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convertLessThanThousand(n % 100) : '');
  };
  
  // Split into integer and decimal parts
  const parts = num.toFixed(2).split('.');
  const integerPart = parseInt(parts[0]);
  const decimalPart = parseInt(parts[1]);
  
  if (integerPart === 0 && decimalPart === 0) return 'Zero Rupees Only';
  
  let result = '';
  
  // Handle crores (10,000,000)
  if (integerPart >= 10000000) {
    const crores = Math.floor(integerPart / 10000000);
    result += convertLessThanThousand(crores) + ' Crore ';
  }
  
  // Handle lakhs (100,000)
  const remainingAfterCrores = integerPart % 10000000;
  if (remainingAfterCrores >= 100000) {
    const lakhs = Math.floor(remainingAfterCrores / 100000);
    result += convertLessThanThousand(lakhs) + ' Lakh ';
  }
  
  // Handle thousands (1,000)
  const remainingAfterLakhs = remainingAfterCrores % 100000;
  if (remainingAfterLakhs >= 1000) {
    const thousands = Math.floor(remainingAfterLakhs / 1000);
    result += convertLessThanThousand(thousands) + ' Thousand ';
  }
  
  // Handle hundreds
  const remainingAfterThousands = remainingAfterLakhs % 1000;
  if (remainingAfterThousands > 0) {
    result += convertLessThanThousand(remainingAfterThousands) + ' ';
  }
  
  result = result.trim();
  
  // Add "Rupees"
  if (result) {
    result += ' Rupees';
  }
  
  // Add paise if present
  if (decimalPart > 0) {
    result += ' and ' + convertLessThanThousand(decimalPart) + ' Paise';
  }
  
  result += ' Only';
  
  return result;
};

// Combined config object for components that need multiple configs
export const SRIRAMMART_CONFIG = {
  company: COMPANY,
  shop: SHOP_INFO,
  tax: TAX_INFO,
  invoice: INVOICE_CONFIG,
  delivery: DELIVERY_CONFIG,
  messages: MESSAGES,
  social: COMPANY.social
};

// Legacy export for backward compatibility
export const shopdata = SHOP_INFO;
export const benifits = BENEFITS;
export const FestivalSpecialFooter = FESTIVAL_SPECIAL_FOOTER;

// Default export
export default {
  SHOP_INFO,
  TAX_INFO,
  INVOICE_CONFIG,
  BENEFITS,
  FESTIVAL_SPECIAL_FOOTER,
  DELIVERY_CONFIG,
  MESSAGES,
  COMPANY,
  SRIRAMMART_CONFIG,
  isDeliveryAvailable,
  getDeliveryTimeMessage,
  numberToWords,
  // Legacy
  shopdata,
  benifits,
  FestivalSpecialFooter
};
