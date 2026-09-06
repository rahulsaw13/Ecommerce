// import { useState, useEffect } from 'react';
// import { useNavigate, useSearchParams } from 'react-router-dom';
// import { useDispatch, useSelector } from 'react-redux';
// import Header from '@common/Header';
// import Footer from '@common/Footer';
// import { addAddress, updateAddress, fetchAddressById, clearAddressStatus } from '../../redux/slices/addressSlice';

// const AddAddressPage = () => {
//   const dispatch = useDispatch();
//   const navigate = useNavigate();
//   const [searchParams] = useSearchParams();
//   const fromPage = searchParams.get('from');
//   const existingAddressId = searchParams.get('address_id');
//   const useLocation = searchParams.get('use_location') === 'true';
//   const lat = searchParams.get('lat');
//   const lng = searchParams.get('lng');
//   const cityParam = searchParams.get('city');
//   const stateParam = searchParams.get('state');
//   const postcodeParam = searchParams.get('postcode');
  
//   // Redux state
//   const { address: fetchedAddress, loading: addressLoading, error: addressError, success } = useSelector((state) => state.address);
  
//   const [orderingFor, setOrderingFor] = useState('myself');
//   const [addressType, setAddressType] = useState('home');
//   const [formData, setFormData] = useState({
//     name: '',
//     building: '',
//     floor: '',
//     address: '',
//     city: '',
//     state: '',
//     pinCode: '',
//     phone: ''
//   });
//   const [saving, setSaving] = useState(false);

//   // Populate location data if coming from location map
//   useEffect(() => {
//     if (useLocation && cityParam) {
//       setFormData(prev => ({
//         ...prev,
//         city: cityParam,
//         state: stateParam,
//         pinCode: postcodeParam
//       }));
//     }
//   }, [useLocation, cityParam, stateParam, postcodeParam]);

//   // Fetch address details if editing existing address
//   useEffect(() => {
//     if (existingAddressId) {
//       dispatch(fetchAddressById(existingAddressId));
//     }
//   }, [dispatch, existingAddressId]);

//   // Populate form when address is fetched
//   useEffect(() => {
//     if (fetchedAddress && existingAddressId) {
//       setOrderingFor(fetchedAddress.ordering_for || 'myself');
//       setAddressType(fetchedAddress.address_type || fetchedAddress.address_label?.toLowerCase() || 'home');
//       setFormData({
//         name: fetchedAddress.name || '',
//         building: fetchedAddress.flat_no || fetchedAddress.landmark || '',
//         floor: fetchedAddress.floor || '',
//         address: fetchedAddress.address || '',
//         city: fetchedAddress.city || '',
//         state: fetchedAddress.state || '',
//         pinCode: fetchedAddress.zip_code || '',
//         phone: fetchedAddress.phone_number || ''
//       });
//     }
//   }, [fetchedAddress, existingAddressId]);

//   // Handle success response
//   useEffect(() => {
//     if (success) {
//       if (fromPage === 'place-order') {
//         navigate(`/place-order?address_id=${success}`);
//       } else {
//         navigate(-1);
//       }
//       dispatch(clearAddressStatus());
//     }
//   }, [success, navigate, fromPage, dispatch]);

//   // Handle error
//   useEffect(() => {
//     if (addressError) {
//       alert(typeof addressError === 'string' ? addressError : JSON.stringify(addressError));
//       dispatch(clearAddressStatus());
//     }
//   }, [addressError, dispatch]);

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({
//       ...prev,
//       [name]: value
//     }));
//   };

//   const handleSaveAddress = async () => {
//     // Validate required fields
//     if (!formData.building || !formData.address || !formData.city || !formData.state || !formData.pinCode) {
//       alert('Please fill all required fields');
//       return;
//     }

//     setSaving(true);
    
//     try {
//       const userDetails = JSON.parse(localStorage.getItem('userDetails'));
      
//       if (!userDetails?.id) {
//         alert('User not found. Please login again.');
//         navigate('/sign-in');
//         return;
//       }
      
//       // Prepare address data
//       const addressData = {
//         user_id: userDetails.id,
//         address_type: addressType,
//         address_label: addressType.charAt(0).toUpperCase() + addressType.slice(1),
//         ordering_for: orderingFor,
//         name: formData.name || '',
//         flat_no: formData.building,
//         landmark: formData.building,
//         floor: formData.floor || '',
//         address: formData.address,
//         city: formData.city,
//         state: formData.state,
//         zip_code: formData.pinCode,
//         country: 'India',
//         phone_number: formData.phone || ''
//       };

//       console.log("Saving address:", addressData);

//       if (existingAddressId) {
//         await dispatch(updateAddress({ id: existingAddressId, addressData })).unwrap();
//       } else {
//         await dispatch(addAddress(addressData)).unwrap();
//       }
      
//     } catch (error) {
//       console.error('Error saving address:', error);
//       const errorMsg = typeof error === 'string' ? error : error?.message || 'Failed to save address. Please try again.';
//       alert(errorMsg);
//     } finally {
//       setSaving(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-white">
//       {/* Mobile Header */}
//       <div className="md:hidden fixed top-0 left-0 right-0 bg-white shadow-sm z-50">
//         <div className="flex items-center gap-3 px-4 py-3">
//           <button onClick={() => navigate(-1)} className="text-gray-700">
//             <i className="ri-arrow-left-line text-2xl"></i>
//           </button>
//           <h1 className="text-lg font-semibold text-gray-800">Enter complete address</h1>
//         </div>
//       </div>

//       {/* Desktop Header */}
//       <div className="hidden md:block">
//         <Header />
//       </div>
      
//       <div className="p-4 md:p-6 mt-14 md:mt-16 w-full max-w-screen-xl mx-auto">
//         <h1 className="hidden md:block text-[20px] sm:text-[24px] md:text-[36px] font-bold text-center mb-4 text-[#1D2E43] font-[playfair]">
//           Enter complete address
//         </h1>
//         <div className="hidden md:flex justify-center mb-6 text-gray-600 text-sm">
//           <p className="text-[#1D2E43]">
//             <span onClick={() => navigate("/")} className="cursor-pointer hover:underline">Home</span>
//             <span className="px-2">&gt;</span>
//             Enter complete address
//           </p>
//         </div>

//         <div className="max-w-2xl mx-auto">
//           {/* Who you are ordering for */}
//           <div className="mb-6">
//             <h3 className="text-base font-semibold text-gray-700 mb-3">Who you are ordering for?</h3>
//             <div className="flex gap-4">
//               <label className="flex items-center gap-2 cursor-pointer">
//                 <input
//                   type="radio"
//                   name="orderingFor"
//                   value="myself"
//                   checked={orderingFor === 'myself'}
//                   onChange={(e) => setOrderingFor(e.target.value)}
//                   className="w-5 h-5 text-[#FFC107] focus:ring-[#FFC107]"
//                 />
//                 <span className="text-sm text-gray-700">Myself</span>
//               </label>
//               <label className="flex items-center gap-2 cursor-pointer">
//                 <input
//                   type="radio"
//                   name="orderingFor"
//                   value="someone_else"
//                   checked={orderingFor === 'someone_else'}
//                   onChange={(e) => setOrderingFor(e.target.value)}
//                   className="w-5 h-5 text-[#FFC107] focus:ring-[#FFC107]"
//                 />
//                 <span className="text-sm text-gray-700">Someone else</span>
//               </label>
//             </div>
//           </div>

//           {/* Save address as */}
//           <div className="mb-6">
//             <h3 className="text-sm font-medium text-gray-500 mb-3">Save address as *</h3>
//             <div className="flex gap-3 flex-wrap">
//               <button
//                 type="button"
//                 onClick={() => setAddressType('home')}
//                 className={`px-6 py-2.5 rounded-lg border-2 transition-all flex items-center gap-2 ${
//                   addressType === 'home'
//                     ? 'border-[#FFC107] bg-green-50 text-gray-900'
//                     : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
//                 }`}
//               >
//                 <i className="ri-home-line text-lg"></i>
//                 <span className="text-sm font-medium">Home</span>
//               </button>
//               <button
//                 type="button"
//                 onClick={() => setAddressType('office')}
//                 className={`px-6 py-2.5 rounded-lg border-2 transition-all flex items-center gap-2 ${
//                   addressType === 'office'
//                     ? 'border-[#FFC107] bg-green-50 text-gray-900'
//                     : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
//                 }`}
//               >
//                 <i className="ri-briefcase-line text-lg"></i>
//                 <span className="text-sm font-medium">Office</span>
//               </button>
//               <button
//                 type="button"
//                 onClick={() => setAddressType('hotel')}
//                 className={`px-6 py-2.5 rounded-lg border-2 transition-all flex items-center gap-2 ${
//                   addressType === 'hotel'
//                     ? 'border-[#FFC107] bg-green-50 text-gray-900'
//                     : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
//                 }`}
//               >
//                 <i className="ri-hotel-line text-lg"></i>
//                 <span className="text-sm font-medium">Hotel</span>
//               </button>
//             </div>
//           </div>

//           {/* Form fields */}
//           <div className="space-y-4">
//             <input
//               type="text"
//               name="name"
//               placeholder="Enter Name (optional)"
//               value={formData.name}
//               onChange={handleInputChange}
//               className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC107] focus:border-transparent text-sm"
//             />

//             <input
//               type="text"
//               name="building"
//               placeholder="Flat / House no / Building name *"
//               value={formData.building}
//               onChange={handleInputChange}
//               className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC107] focus:border-transparent text-sm"
//             />

//             <input
//               type="text"
//               name="floor"
//               placeholder="Floor (optional)"
//               value={formData.floor}
//               onChange={handleInputChange}
//               className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC107] focus:border-transparent text-sm"
//             />

//             <input
//               type="text"
//               name="address"
//               placeholder="Address *"
//               value={formData.address}
//               onChange={handleInputChange}
//               className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC107] focus:border-transparent text-sm"
//             />

//             <input
//               type="text"
//               name="city"
//               placeholder="City *"
//               value={formData.city}
//               onChange={handleInputChange}
//               className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC107] focus:border-transparent text-sm"
//             />

//             <input
//               type="text"
//               name="state"
//               placeholder="State *"
//               value={formData.state}
//               onChange={handleInputChange}
//               className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC107] focus:border-transparent text-sm"
//             />

//             <input
//               type="text"
//               name="pinCode"
//               placeholder="Pin Code *"
//               value={formData.pinCode}
//               onChange={handleInputChange}
//               className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC107] focus:border-transparent text-sm"
//             />

//             <input
//               type="tel"
//               name="phone"
//               placeholder="Your phone number (optional)"
//               value={formData.phone}
//               onChange={handleInputChange}
//               className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC107] focus:border-transparent text-sm"
//             />
//           </div>

//           {/* Save button */}
//           <button
//             onClick={handleSaveAddress}
//             disabled={saving || addressLoading}
//             className="w-full mt-6 bg-[#FFC107] hover:bg-[#FFB300] text-gray-900 font-bold py-3.5 rounded-lg text-base transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
//           >
//             {saving || addressLoading ? 'Saving...' : 'Save address'}
//           </button>
//         </div>
//       </div>

//       <div className="mt-16">
//         <Footer data={[]} />
//       </div>
//     </div>
//   );
// };

// export default AddAddressPage;


import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Header from '@common/Header';
import Footer from '@common/Footer';
import { saveAddress, clearAddressStatus, fetchUserAddresses } from '../../redux/slices/addressSlice';

const AddAddressPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromPage = searchParams.get('from');
  const existingAddressId = searchParams.get('address_id');
  const useLocation = searchParams.get('use_location') === 'true';
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const cityParam = searchParams.get('city');
  const stateParam = searchParams.get('state');
  const postcodeParam = searchParams.get('postcode');
  
  // Redux state
  const { addresses, loading: addressLoading, error: addressError, success } = useSelector((state) => state.address);
  
  const [orderingFor, setOrderingFor] = useState('myself');
  const [addressType, setAddressType] = useState('home');
  const [formData, setFormData] = useState({
    name: '',
    building: '',
    floor: '',
    address: '',
    city: '',
    state: '',
    pinCode: '',
    phone: ''
  });
  const [saving, setSaving] = useState(false);
  const [coords, setCoords] = useState({
    latitude: lat ? parseFloat(lat) : null,
    longitude: lng ? parseFloat(lng) : null
  });
  const [detectingLocation, setDetectingLocation] = useState(false);

  // Fetch addresses on mount
  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const userDetails = JSON.parse(localStorage.getItem('userDetails'));
        if (userDetails?.id) {
          await dispatch(fetchUserAddresses(userDetails.id)).unwrap();
        }
      } catch (error) {
        console.error("Error fetching addresses:", error);
      }
    };
    
    fetchAddresses();
  }, [dispatch]);

  // Populate location data if coming from location map
  useEffect(() => {
    if (useLocation && cityParam) {
      setFormData(prev => ({
        ...prev,
        city: cityParam,
        state: stateParam,
        pinCode: postcodeParam
      }));
    }
  }, [useLocation, cityParam, stateParam, postcodeParam]);

  // Fetch existing address details from addresses list if editing
  useEffect(() => {
    if (existingAddressId && addresses.length > 0) {
      const existingAddress = addresses.find(addr => addr.id === parseInt(existingAddressId));
      if (existingAddress) {
        setOrderingFor(existingAddress.ordering_for || 'myself');
        setAddressType(existingAddress.address_type || existingAddress.address_label?.toLowerCase() || 'home');
        setFormData({
          name: existingAddress.name || '',
          building: existingAddress.flat_no || existingAddress.landmark || '',
          floor: existingAddress.floor || '',
          address: existingAddress.address || '',
          city: existingAddress.city || '',
          state: existingAddress.state || '',
          pinCode: existingAddress.zip_code?.toString() || '',
          phone: existingAddress.phone_number || ''
        });
      }
    }
  }, [existingAddressId, addresses]);

  // Handle success response
  useEffect(() => {
    if (success) {
      alert('Address saved successfully!');
      if (fromPage === 'place-order') {
        navigate(`/place-order?address_id=${success}`);
      } else {
        navigate(-1);
      }
      dispatch(clearAddressStatus());
    }
  }, [success, navigate, fromPage, dispatch]);

  // Handle error
  useEffect(() => {
    if (addressError) {
      alert(typeof addressError === 'string' ? addressError : JSON.stringify(addressError));
      dispatch(clearAddressStatus());
    }
  }, [addressError, dispatch]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setDetectingLocation(false);
      },
      () => {
        alert('Could not detect location. Please allow location access.');
        setDetectingLocation(false);
      }
    );
  };

  const handleSaveAddress = async () => {
    // Validate required fields
    if (!formData.building) {
      alert('Please enter Flat / House no / Building name');
      return;
    }
    if (!formData.address) {
      alert('Please enter Address');
      return;
    }
    if (!formData.city) {
      alert('Please enter City');
      return;
    }
    if (!formData.state) {
      alert('Please enter State');
      return;
    }
    if (!formData.pinCode) {
      alert('Please enter Pin Code');
      return;
    }
    if (!formData.phone) {
      alert('Please enter Phone Number');
      return;
    }

    setSaving(true);

    // Auto-detect coords if not already set
    let resolvedCoords = { ...coords };
    if (!resolvedCoords.latitude && navigator.geolocation) {
      try {
        resolvedCoords = await new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
            () => resolve({ latitude: null, longitude: null }),
            { timeout: 5000 }
          );
        });
        setCoords(resolvedCoords);
      } catch (_) {
        resolvedCoords = { latitude: null, longitude: null };
      }
    }

    try {
      const userDetails = JSON.parse(localStorage.getItem('userDetails'));

      if (!userDetails?.id) {
        alert('User not found. Please login again.');
        navigate('/sign-in');
        return;
      }

      // Prepare address data as per backend requirements
      const addressData = {
        user_id: userDetails.id,
        name: formData.name || '',
        phone_number: formData.phone,
        flat_no: formData.building,
        floor: formData.floor || '',
        address: formData.address,
        landmark: formData.building,
        city: formData.city,
        state: formData.state,
        country: 'India',
        zip_code: parseInt(formData.pinCode),
        address_type: addressType,
        address_label: addressType.charAt(0).toUpperCase() + addressType.slice(1),
        ordering_for: orderingFor,
        latitude: resolvedCoords.latitude,
        longitude: resolvedCoords.longitude
      };

      console.log("Saving address:", addressData);

      await dispatch(saveAddress(addressData)).unwrap();

    } catch (error) {
      console.error('Error saving address:', error);
      const errorMsg = typeof error === 'string' ? error : error?.message || 'Failed to save address. Please try again.';
      alert(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white shadow-sm z-50">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate(-1)} className="text-gray-700">
            <i className="ri-arrow-left-line text-2xl"></i>
          </button>
          <h1 className="text-lg font-semibold text-gray-800">Enter complete address</h1>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:block">
        <Header />
      </div>
      
      <div className="p-4 md:p-6 mt-14 md:mt-16 w-full max-w-screen-xl mx-auto">
        <h1 className="hidden md:block text-[20px] sm:text-[24px] md:text-[36px] font-bold text-center mb-4 text-[#1D2E43] font-[playfair]">
          Enter complete address
        </h1>
        <div className="hidden md:flex justify-center mb-6 text-gray-600 text-sm">
          <p className="text-[#1D2E43]">
            <span onClick={() => navigate("/")} className="cursor-pointer hover:underline">Home</span>
            <span className="px-2">&gt;</span>
            Enter complete address
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          {/* Who you are ordering for */}
          <div className="mb-6">
            <h3 className="text-base font-semibold text-gray-700 mb-3">Who you are ordering for?</h3>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="orderingFor"
                  value="myself"
                  checked={orderingFor === 'myself'}
                  onChange={(e) => setOrderingFor(e.target.value)}
                  className="w-5 h-5 text-[#FFC107] focus:ring-[#FFC107]"
                />
                <span className="text-sm text-gray-700">Myself</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="orderingFor"
                  value="someone_else"
                  checked={orderingFor === 'someone_else'}
                  onChange={(e) => setOrderingFor(e.target.value)}
                  className="w-5 h-5 text-[#FFC107] focus:ring-[#FFC107]"
                />
                <span className="text-sm text-gray-700">Someone else</span>
              </label>
            </div>
          </div>

          {/* Save address as */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-500 mb-3">Save address as *</h3>
            <div className="flex gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => setAddressType('home')}
                className={`px-6 py-2.5 rounded-lg border-2 transition-all flex items-center gap-2 ${
                  addressType === 'home'
                    ? 'border-[#FFC107] bg-green-50 text-gray-900'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                }`}
              >
                <i className="ri-home-line text-lg"></i>
                <span className="text-sm font-medium">Home</span>
              </button>
              <button
                type="button"
                onClick={() => setAddressType('office')}
                className={`px-6 py-2.5 rounded-lg border-2 transition-all flex items-center gap-2 ${
                  addressType === 'office'
                    ? 'border-[#FFC107] bg-green-50 text-gray-900'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                }`}
              >
                <i className="ri-briefcase-line text-lg"></i>
                <span className="text-sm font-medium">Office</span>
              </button>
              <button
                type="button"
                onClick={() => setAddressType('hotel')}
                className={`px-6 py-2.5 rounded-lg border-2 transition-all flex items-center gap-2 ${
                  addressType === 'hotel'
                    ? 'border-[#FFC107] bg-green-50 text-gray-900'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                }`}
              >
                <i className="ri-hotel-line text-lg"></i>
                <span className="text-sm font-medium">Hotel</span>
              </button>
            </div>
          </div>

          {/* Location pin */}
          <div className="mb-4 p-3 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-600 min-w-0">
              <i className="ri-map-pin-line text-[#FFC107] text-lg flex-shrink-0"></i>
              {coords.latitude && coords.longitude ? (
                <span className="truncate">
                  {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}
                </span>
              ) : (
                <span className="text-gray-400">No location pinned</span>
              )}
            </div>
            <button
              type="button"
              onClick={handleDetectLocation}
              disabled={detectingLocation}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FFC107] text-gray-900 text-xs font-semibold hover:bg-yellow-400 disabled:opacity-60 transition-all"
            >
              {detectingLocation ? (
                <><i className="ri-loader-4-line animate-spin"></i> Detecting…</>
              ) : (
                <><i className="ri-crosshair-line"></i> {coords.latitude ? 'Re-detect' : 'Detect location'}</>
              )}
            </button>
          </div>

          {/* Form fields */}
          <div className="space-y-4">
            <input
              type="text"
              name="name"
              placeholder="Enter Name (optional)"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC107] focus:border-transparent text-sm"
            />

            <input
              type="text"
              name="building"
              placeholder="Flat / House no / Building name *"
              value={formData.building}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC107] focus:border-transparent text-sm"
            />

            <input
              type="text"
              name="floor"
              placeholder="Floor (optional)"
              value={formData.floor}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC107] focus:border-transparent text-sm"
            />

            <input
              type="text"
              name="address"
              placeholder="Address *"
              value={formData.address}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC107] focus:border-transparent text-sm"
            />

            <input
              type="text"
              name="city"
              placeholder="City *"
              value={formData.city}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC107] focus:border-transparent text-sm"
            />

            <input
              type="text"
              name="state"
              placeholder="State *"
              value={formData.state}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC107] focus:border-transparent text-sm"
            />

            <input
              type="text"
              name="pinCode"
              placeholder="Pin Code *"
              value={formData.pinCode}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC107] focus:border-transparent text-sm"
            />

            <input
              type="tel"
              name="phone"
              placeholder="Phone Number *"
              value={formData.phone}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC107] focus:border-transparent text-sm"
            />
          </div>

          {/* Save button */}
          <button
            onClick={handleSaveAddress}
            disabled={saving || addressLoading}
            className="w-full mt-6 bg-[#FFC107] hover:bg-[#FFB300] text-gray-900 font-bold py-3.5 rounded-lg text-base transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving || addressLoading ? 'Saving...' : 'Save address'}
          </button>
        </div>
      </div>

      <div className="mt-16">
        <Footer data={[]} />
      </div>
    </div>
  );
};

export default AddAddressPage;