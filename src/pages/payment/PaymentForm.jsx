import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useState } from 'react';

export default function PaymentForm({ clientSecret, onSuccess, onError }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      console.error("Stripe.js failed to load.")
      toast.error("Failed to load payment gateway. Please try again later.")
      return
    };

    setIsProcessing(true);
    setMessage('');

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment/success`, // fallback only
      },
      redirect: 'if_required', // ← important: stay on page if possible
    });

    if (error) {
      setMessage(error.message || 'An unexpected error occurred.');
      onError?.(error);
    } else {
      // Payment succeeded → show success UI
      // Real access granted via webhook, so you can be optimistic here
      setMessage('Payment processed successfully! Your plan/credits will update shortly.');
      onSuccess?.();
    }

    setIsProcessing(false);
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit}>
      <PaymentElement
        options={{
          layout: 'tabs', // or 'accordion', 'never'
        }}
      />

      <button
        type="submit"
        disabled={isProcessing || !stripe || !elements}
        style={{ marginTop: '1rem', padding: '12px', width: '100%' }}
      >
        {isProcessing ? 'Processing...' : 'Pay now'}
      </button>

      {message && <div style={{ color: error ? 'red' : 'green', marginTop: '1rem' }}>{message}</div>}
    </form>
  );
}