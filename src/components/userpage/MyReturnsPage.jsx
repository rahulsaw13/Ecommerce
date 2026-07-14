import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { allApiWithHeaderToken } from '@api/api';
import { API_CONSTANTS } from '@constants/apiurl';
import Header from '@common/Header';
import Footer from '@common/Footer';
import UserLoader from '@userpage-pages/UserLoader';

const STATUS_CONFIG = {
  INITIATED: { label: 'Pending Review', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  APPROVED:  { label: 'Approved',       color: 'bg-blue-100 text-blue-800 border-blue-200'   },
  REFUNDED:  { label: 'Refunded',       color: 'bg-green-100 text-green-800 border-green-200' },
  REJECTED:  { label: 'Rejected',       color: 'bg-red-100 text-red-800 border-red-200'       },
};

const REASON_LABELS = {
  DAMAGED:       'Item arrived damaged',
  WRONG_ITEM:    'Wrong item received',
  MISSING_ITEM:  'Item missing from order',
  QUALITY_ISSUE: 'Quality not as expected',
  CHANGED_MIND:  'Changed my mind',
};

const RESOLUTION_LABELS = {
  REFUND_WALLET:    'Refund to wallet',
  REPLACEMENT:      'Replace the item',
  REFUND_ORIGINAL:  'Refund to original payment',
};

const normalizeDate = (val) => {
  if (!val) return null;
  const d = new Date(String(val).replace(/\[.*?\]$/, ''));
  return isNaN(d.getTime()) ? null : d;
};

const MyReturnsPage = () => {
  const navigate = useNavigate();
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menuList, setMenuList] = useState([]);

  let userDetails = null;
  try {
    const raw = localStorage.getItem('userDetails');
    userDetails = raw ? JSON.parse(raw) : null;
  } catch (e) {}

  useEffect(() => {
    if (!userDetails?.id) {
      navigate('/sign-in');
      return;
    }
    fetchMenu();
    fetchReturns();
  }, []);

  const fetchMenu = async () => {
    try {
      const res = await allApiWithHeaderToken(API_CONSTANTS.MENU_LIST_URL, '', 'get');
      if (res.status === 200 && Array.isArray(res.data)) {
        setMenuList(res.data.filter((_, i) => i <= 6));
      }
    } catch (e) {}
  };

  const fetchReturns = async () => {
    setLoading(true);
    try {
      const res = await allApiWithHeaderToken(
        `${API_CONSTANTS.GET_USER_RETURNS_URL}/${userDetails.id}/returns`,
        '',
        'get'
      );
      if (res.status === 200) {
        setReturns(res.data.data || []);
      }
    } catch (e) {
      console.error('Failed to fetch returns', e);
    } finally {
      setLoading(false);
    }
  };

  const statusCfg = (status) =>
    STATUS_CONFIG[status?.toUpperCase()] || { label: status, color: 'bg-gray-100 text-gray-700 border-gray-200' };

  if (loading) return <UserLoader />;

  return (
    <div className="min-h-screen bg-BgPrimaryColor">
      <Header />

      <div className="max-w-3xl mx-auto px-4 pt-[160px] md:pt-24 pb-8">
        {/* Breadcrumb */}
        <div className="text-xs text-gray-500 mb-4">
          <span className="hover:cursor-pointer hover:underline" onClick={() => navigate('/')}>Home</span>
          <span className="mx-1">&gt;</span>
          <span className="text-gray-800 font-medium">My Returns</span>
        </div>

        <h1 className="text-2xl font-bold text-TextPrimaryColor mb-6">My Returns</h1>

        {returns.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <i className="ri-arrow-go-back-line text-5xl text-gray-300 mb-3 block"></i>
            <p className="text-gray-500 text-base mb-2">No return requests yet</p>
            <p className="text-gray-400 text-sm mb-6">
              You can request a return from your order history within 48 hours of delivery.
            </p>
            <button
              onClick={() => navigate('/order-history')}
              className="bg-TextPrimaryColor text-white px-6 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
            >
              View Orders
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {returns.map((ret) => {
              const cfg = statusCfg(ret.status);
              const createdDate = normalizeDate(ret.created_at);
              return (
                <div key={ret.return_id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Return ID</p>
                      <p className="font-semibold text-gray-900 text-sm">{ret.return_id}</p>
                    </div>
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${cfg.color}`}>
                      {cfg.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                    <div>
                      <p className="text-xs text-gray-500">Order ID</p>
                      <p className="font-medium text-gray-800">#{ret.order_id}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Requested On</p>
                      <p className="font-medium text-gray-800">
                        {createdDate
                          ? createdDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                          : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Reason</p>
                      <p className="font-medium text-gray-800">{REASON_LABELS[ret.reason] || ret.reason}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Preferred Resolution</p>
                      <p className="font-medium text-gray-800">{RESOLUTION_LABELS[ret.preferred_resolution] || ret.preferred_resolution}</p>
                    </div>
                  </div>

                  {ret.comment && (
                    <div className="bg-gray-50 rounded-lg px-4 py-2.5 mb-3 text-sm text-gray-600 border border-gray-100">
                      <span className="font-medium text-gray-700">Your note: </span>{ret.comment}
                    </div>
                  )}

                  {(ret.admin_notes || ret.resolution || ret.refund_amount) && (
                    <div className="bg-blue-50 rounded-lg px-4 py-2.5 text-sm border border-blue-100 space-y-1">
                      {ret.resolution && (
                        <p className="text-blue-800">
                          <span className="font-semibold">Resolution: </span>
                          {RESOLUTION_LABELS[ret.resolution] || ret.resolution}
                        </p>
                      )}
                      {ret.refund_amount != null && ret.refund_amount > 0 && (
                        <p className="text-blue-800">
                          <span className="font-semibold">Refund Amount: </span>₹{Number(ret.refund_amount).toFixed(2)}
                        </p>
                      )}
                      {ret.admin_notes && (
                        <p className="text-blue-700">
                          <span className="font-semibold">Note: </span>{ret.admin_notes}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Footer data={menuList} />
    </div>
  );
};

export default MyReturnsPage;
