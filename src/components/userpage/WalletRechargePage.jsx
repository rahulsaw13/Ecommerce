import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Header from '@common/Header';
import Footer from '@common/Footer';
import { fetchWalletSettings, fetchWalletBalance } from '../../redux/slices/walletSlice';
import { allApi } from '@api/api';
import { API_CONSTANTS } from '@constants/apiurl';
import { loadRazorpayScript, openRazorpayModal } from '@utils/razorpay';

const QUICK_AMOUNTS = [50, 100, 200, 500, 1000];

const WalletRechargePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { enabled: walletEnabled, balance: walletBalance } = useSelector((state) => state.wallet);

  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const userDetails = JSON.parse(localStorage.getItem('userDetails') || '{}');

  useEffect(() => {
    if (!userDetails?.id) { navigate('/sign-in'); return; }
    dispatch(fetchWalletSettings());
    dispatch(fetchWalletBalance(userDetails.id));
  }, []);

  const handleRecharge = async () => {
    const amt = parseFloat(amount);
    if (!amount || isNaN(amt) || amt < 1) {
      setErrorMsg('Enter a valid amount (minimum ₹1)');
      return;
    }
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setErrorMsg('Failed to load payment gateway. Please try again.');
        setLoading(false);
        return;
      }

      const createRes = await allApi.post(`/${API_CONSTANTS.PAYMENT_CREATE_ORDER}`, {
        user_id: userDetails.id,
        amount: amt,
      });

      const { razorpay_key_id, razorpay_order, name, logo } = createRes.data;

      const paymentResponse = await openRazorpayModal({
        keyId: razorpay_key_id,
        order: razorpay_order,
        name,
        logo,
        prefill: { name: userDetails.name || '', email: userDetails.email || '' },
      });

      await allApi.post(`/${API_CONSTANTS.PAYMENT_VERIFY}`, {
        razorpay_order_id: paymentResponse.razorpay_order_id,
        razorpay_payment_id: paymentResponse.razorpay_payment_id,
        razorpay_signature: paymentResponse.razorpay_signature,
        type: 'wallet',
        user_id: userDetails.id,
        amount: razorpay_order.amount,
      });

      setSuccessMsg(`₹${amt.toFixed(2)} added to your wallet!`);
      setAmount('');
      dispatch(fetchWalletBalance(userDetails.id));
    } catch (err) {
      if (err.message === 'Payment cancelled by user') {
        setErrorMsg('Payment was cancelled.');
      } else {
        setErrorMsg(err.response?.data?.message || err.message || 'Recharge failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!walletEnabled) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="flex flex-col items-center justify-center min-h-[60vh] mt-16 px-4 text-center">
          <i className="ri-wallet-3-line text-6xl text-gray-300 mb-4"></i>
          <h2 className="text-xl font-bold text-gray-700 mb-2">Wallet Not Available</h2>
          <p className="text-gray-500 text-sm">The wallet feature is not enabled for this store.</p>
        </div>
        <Footer data={[]} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="mt-16 p-4 max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
            <i className="ri-arrow-left-line text-xl text-gray-700"></i>
          </button>
          <h1 className="text-xl font-bold text-gray-900">Recharge Wallet</h1>
        </div>

        {/* Current Balance */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl p-5 mb-6 text-white">
          <p className="text-sm opacity-80 mb-1">Current Wallet Balance</p>
          <p className="text-3xl font-bold">₹{(walletBalance || 0).toFixed(2)}</p>
        </div>

        {/* Amount input */}
        <div className="bg-gray-50 rounded-xl p-4 mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Enter Amount (₹)</label>
          <input
            type="number"
            min="1"
            value={amount}
            onChange={(e) => { setAmount(e.target.value); setErrorMsg(''); setSuccessMsg(''); }}
            placeholder="e.g. 200"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />

          <div className="flex flex-wrap gap-2 mt-3">
            {QUICK_AMOUNTS.map((qa) => (
              <button
                key={qa}
                onClick={() => { setAmount(String(qa)); setErrorMsg(''); setSuccessMsg(''); }}
                className={`px-3 py-1.5 rounded-full text-sm font-semibold border transition-colors ${
                  amount === String(qa)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                }`}
              >
                +₹{qa}
              </button>
            ))}
          </div>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4 text-sm text-red-700">
            <i className="ri-error-warning-line text-base flex-shrink-0"></i>
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-4 text-sm text-green-700">
            <i className="ri-checkbox-circle-line text-base flex-shrink-0"></i>
            {successMsg}
          </div>
        )}

        <button
          onClick={handleRecharge}
          disabled={loading || !amount}
          className="w-full bg-[#FFC107] hover:bg-[#FFB300] text-gray-900 font-bold py-4 rounded-xl text-base transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-gray-700 border-t-transparent rounded-full animate-spin"></div>
              Processing...
            </>
          ) : (
            <>
              <i className="ri-bank-card-line text-lg"></i>
              Pay ₹{parseFloat(amount || 0).toFixed(2)} via Razorpay
            </>
          )}
        </button>

        <p className="text-xs text-gray-400 text-center mt-3">
          Payments are secured by Razorpay. Wallet balance is non-refundable.
        </p>
      </div>
      <div className="mt-8">
        <Footer data={[]} />
      </div>
    </div>
  );
};

export default WalletRechargePage;
