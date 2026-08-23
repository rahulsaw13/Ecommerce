export const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

export const openRazorpayModal = ({ keyId, order, name, logo, prefill }) =>
  new Promise((resolve, reject) => {
    const options = {
      key: keyId,
      amount: order.amount,
      currency: order.currency || 'INR',
      name: name || 'SriramMart',
      image: logo || undefined,
      order_id: order.id,
      prefill: prefill || {},
      theme: { color: '#FFC107' },
      handler: (response) => resolve(response),
      modal: { ondismiss: () => reject(new Error('Payment cancelled by user')) },
    };
    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', (response) => reject(new Error(response.error?.description || 'Payment failed')));
    rzp.open();
  });
