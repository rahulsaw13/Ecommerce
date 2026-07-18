import { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { allApi } from '@api/api';
import { saveLocationToCookie, checkDeliveryAvailabilityLocal } from '@services/locationService';

const NOMINATIM_SEARCH = 'https://nominatim.openstreetmap.org/search';
const NOMINATIM_REVERSE = 'https://nominatim.openstreetmap.org/reverse';

const extractShortName = (addressObj) => {
  if (!addressObj) return null;
  return (
    addressObj.suburb ||
    addressObj.neighbourhood ||
    addressObj.quarter ||
    addressObj.city_district ||
    addressObj.village ||
    addressObj.town ||
    addressObj.city ||
    null
  );
};

const extractSecondary = (addressObj) => {
  if (!addressObj) return '';
  return [addressObj.city || addressObj.town || addressObj.village, addressObj.state]
    .filter(Boolean).join(', ');
};

const LocationPickerPopup = ({ isOpen, onClose, onLocationSelected, anchorRef }) => {
  const companyInfo = useSelector((state) => state.company?.info);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [error, setError] = useState('');
  const [validating, setValidating] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [cardStyle, setCardStyle] = useState({});
  const searchTimeoutRef = useRef(null);
  const inputRef = useRef(null);
  const cardRef = useRef(null);
  const touchStartY = useRef(0);
  const touchMoved = useRef(false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Position card below the anchor button on desktop
  useEffect(() => {
    if (!isOpen) return;
    if (isMobile) { setCardStyle({}); return; }
    if (anchorRef?.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setCardStyle({
        position: 'fixed',
        top: rect.bottom + 8,
        left: Math.max(8, rect.left),
      });
    }
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen, isMobile, anchorRef]);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSearchResults([]);
      setError('');
    }
  }, [isOpen]);

  // Lock body scroll and keep sheet above keyboard on mobile
  useEffect(() => {
    if (!isOpen || !isMobile) return;

    // Scroll lock: save position, freeze body
    const savedScrollY = window.scrollY;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${savedScrollY}px`;
    document.body.style.width = '100%';

    // Lift sheet above keyboard when it opens
    const vv = window.visualViewport;
    const reposition = () => {
      if (!cardRef.current) return;
      const keyboardHeight = vv ? Math.max(0, window.innerHeight - vv.height) : 0;
      cardRef.current.style.bottom = `${keyboardHeight}px`;
    };
    if (vv) vv.addEventListener('resize', reposition);
    reposition();

    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, savedScrollY);
      if (vv) vv.removeEventListener('resize', reposition);
      if (cardRef.current) cardRef.current.style.bottom = '0px';
    };
  }, [isOpen, isMobile]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e) => {
      if (cardRef.current && !cardRef.current.contains(e.target) &&
          anchorRef?.current && !anchorRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen, onClose, anchorRef]);

  const validateAndSave = useCallback(async (lat, lng, shortName, fullAddress) => {
    setValidating(true);
    setError('');
    let deliveryAvailable = true;
    let branchId = null;
    try {
      const response = await allApi.get(`/user_dashboard/nearest_branch?latitude=${lat}&longitude=${lng}`);
      if (!response.data.available) {
        setError(response.data.message || "Sorry, we don't deliver to this location yet.");
        setValidating(false);
        return;
      }
      branchId = response.data.branch_id ?? null;
    } catch (_) {
      // API unavailable — fall back to local distance check
      const result = checkDeliveryAvailabilityLocal(lat, lng, companyInfo?.latitude, companyInfo?.longitude);
      deliveryAvailable = result.available;
    }
    if (!deliveryAvailable) {
      setError("Sorry, we don't deliver to this location yet.");
      setValidating(false);
      return;
    }
    const locationData = { latitude: lat, longitude: lng, shortName, address: fullAddress, branch_id: branchId };
    saveLocationToCookie(locationData);
    onLocationSelected(locationData);
    window.dispatchEvent(new CustomEvent('userLocationChanged', { detail: locationData }));
    onClose();
    setValidating(false);
  }, [onClose, onLocationSelected]);

  const handleDetect = () => {
    if (!navigator.geolocation) { setError('Geolocation not supported.'); return; }
    setDetecting(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude, longitude } }) => {
        try {
          const res = await fetch(
            `${NOMINATIM_REVERSE}?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data = await res.json();
          const shortName = extractShortName(data.address) || data.display_name?.split(',')[0] || 'Your location';
          await validateAndSave(latitude, longitude, shortName, data.display_name || '');
        } catch {
          await validateAndSave(latitude, longitude, 'Your location', '');
        } finally {
          setDetecting(false);
        }
      },
      (err) => {
        setDetecting(false);
        setError(err.code === 1 ? 'Permission denied. Please search manually.' : 'Could not detect location.');
      },
      { timeout: 10000 }
    );
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    setError('');
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!query.trim() || query.length < 3) { setSearchResults([]); return; }
    searchTimeoutRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `${NOMINATIM_SEARCH}?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=6&countrycodes=in`,
          { headers: { 'Accept-Language': 'en' } }
        );
        setSearchResults(await res.json());
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
  };

  const handleSelectResult = async (result) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    const shortName = extractShortName(result.address) || result.display_name?.split(',')[0];
    setSearchResults([]);
    setSearchQuery('');
    await validateAndSave(lat, lng, shortName, result.display_name);
  };

  if (!isOpen) return null;

  // ── MOBILE: bottom sheet ──────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div
        className="fixed inset-0 z-[80]"
        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        onTouchStart={(e) => { touchStartY.current = e.touches[0].clientY; touchMoved.current = false; }}
        onTouchMove={(e) => { if (Math.abs(e.touches[0].clientY - touchStartY.current) > 8) touchMoved.current = true; }}
        onClick={(e) => { if (!touchMoved.current && e.target === e.currentTarget) onClose(); }}
      >
        <div ref={cardRef} className="bg-white w-full rounded-t-3xl shadow-2xl overflow-y-auto" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, maxHeight: '85vh', zIndex: 81 }}>
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-gray-300"></div>
          </div>
          <div className="px-3 pb-5 pt-1">
            {/* intro */}
            <div className="flex items-start gap-2 mb-3">
              <div className="w-8 h-8 rounded-full border-2 border-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <i className="ri-map-pin-line text-green-600 text-sm"></i>
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-xs leading-snug">Please provide your delivery location to see products at nearby store</p>
              </div>
            </div>

            {/* detect + OR + search */}
            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={handleDetect}
                disabled={detecting || validating}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-white text-xs flex-shrink-0 disabled:opacity-60"
                style={{ backgroundColor: '#0c831f' }}
              >
                {detecting
                  ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  : <i className="ri-navigation-line text-xs"></i>}
                {detecting ? 'Detecting…' : 'Detect location'}
              </button>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <div className="w-px h-5 bg-gray-300"></div>
                <span className="text-[10px] text-gray-400 font-semibold">OR</span>
                <div className="w-px h-5 bg-gray-300"></div>
              </div>
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search location"
                  className="w-full px-2.5 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400"
                  style={{ border: '1.5px solid #d1d5db', fontSize: '12px' }}
                />
                {searching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-3.5 h-3.5 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
            </div>

            {error && (
              <p className="text-red-600 text-xs mb-2 flex items-center gap-1">
                <i className="ri-error-warning-line flex-shrink-0"></i>{error}
              </p>
            )}
            {validating && (
              <p className="text-gray-500 text-xs mb-2 flex items-center gap-1">
                <div className="w-3 h-3 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                Checking availability…
              </p>
            )}

            {searchResults.length > 0 && (
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                {searchResults.map((r, i) => {
                  const short = extractShortName(r.address) || r.display_name?.split(',')[0];
                  const sec = extractSecondary(r.address);
                  return (
                    <button key={r.place_id || i} onClick={() => handleSelectResult(r)} disabled={validating}
                      className="w-full flex items-center gap-2 px-3 py-2.5 border-b border-gray-100 last:border-0 hover:bg-gray-50 text-left disabled:opacity-60">
                      <i className="ri-map-pin-line text-gray-400 text-sm flex-shrink-0"></i>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-xs text-gray-900 truncate">{short}</p>
                        <p className="text-[10px] text-gray-500 truncate">{sec}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── DESKTOP: floating card below header button ────────────────────────────
  return (
    <div className="fixed inset-0 z-[80]" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div
        ref={cardRef}
        className="bg-white rounded-2xl shadow-2xl overflow-hidden"
        style={{ ...cardStyle, width: 500, border: '1px solid #e5e7eb' }}
      >
        <div className="p-5">
          {/* Intro row */}
          <div className="flex items-start gap-3 mb-5">
            <div className="w-10 h-10 rounded-full border-2 border-green-500 flex items-center justify-center flex-shrink-0">
              <i className="ri-map-pin-line text-green-600 text-lg"></i>
            </div>
            <div className="flex-1">
              <p className="text-green-600 font-semibold text-sm mb-0.5">Welcome to SriramMart</p>
              <p className="text-gray-700 text-sm leading-snug">Please provide your delivery location to see products at nearby store</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
              <i className="ri-close-line text-xl"></i>
            </button>
          </div>

          {/* Detect + OR + Search on same row */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleDetect}
              disabled={detecting || validating}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white text-sm flex-shrink-0 disabled:opacity-60 transition-opacity"
              style={{ backgroundColor: '#0c831f' }}
            >
              {detecting
                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                : <i className="ri-navigation-line text-base"></i>}
              {detecting ? 'Detecting…' : 'Detect my location'}
            </button>

            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="w-px h-7 bg-gray-300"></div>
              <span className="text-xs text-gray-400 font-bold">OR</span>
              <div className="w-px h-7 bg-gray-300"></div>
            </div>

            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="search delivery location"
                className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                style={{ border: '1.5px solid #d1d5db' }}
              />
              {searching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-3.5 h-3.5 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
          </div>

          {/* Error / validating */}
          {error && (
            <p className="text-red-600 text-sm mt-3 flex items-center gap-1.5">
              <i className="ri-error-warning-line flex-shrink-0"></i>{error}
            </p>
          )}
          {validating && (
            <p className="text-gray-500 text-sm mt-3 flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
              Checking availability…
            </p>
          )}

          {/* Search results */}
          {searchResults.length > 0 && (
            <div className="mt-3 border border-gray-200 rounded-xl overflow-hidden">
              {searchResults.map((r, i) => {
                const short = extractShortName(r.address) || r.display_name?.split(',')[0];
                const sec = extractSecondary(r.address);
                return (
                  <button key={r.place_id || i} onClick={() => handleSelectResult(r)} disabled={validating}
                    className="w-full flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 text-left disabled:opacity-60">
                    <i className="ri-map-pin-line text-gray-400 flex-shrink-0"></i>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900 truncate">{short}</p>
                      <p className="text-xs text-gray-500 truncate">{sec}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LocationPickerPopup;
