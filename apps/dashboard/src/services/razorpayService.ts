/**
 * Razorpay Standard Web Checkout Integration Service
 * MAXLINE LOGISTICS
 */

declare global {
  interface Window {
    Razorpay?: any;
  }
}

export interface RazorpayCheckoutOptions {
  amountINR: number;
  name?: string;
  description?: string;
  receipt?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  onSuccess: (data: {
    order_id: string;
    payment_id: string;
    signature: string;
    verifiedResponse: any;
  }) => void;
  onError?: (err: { message: string; details?: any }) => void;
  onDismiss?: () => void;
}

export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const RazorpayService = {
  /**
   * Initiates full Standard Checkout flow:
   * 1. Calls backend /api/create-order
   * 2. Opens Razorpay standard checkout popup
   * 3. Sends received signature to /api/verify-payment for verification
   */
  openCheckout: async (options: RazorpayCheckoutOptions): Promise<void> => {
    try {
      // 1. Ensure Razorpay script is loaded
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded || !window.Razorpay) {
        throw new Error('Razorpay SDK failed to load. Please check your internet connection.');
      }

      // Convert amount in INR to Paise (minimum 100 paise = 1 INR)
      const amountPaise = Math.max(100, Math.round(options.amountINR * 100));

      // 2. Call Backend /api/create-order
      const orderRes = await fetch('/api/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amountPaise,
          currency: 'INR',
          receipt: options.receipt,
          notes: options.notes,
        }),
      });

      if (!orderRes.ok) {
        const errorData = await orderRes.json().catch(() => ({}));
        throw new Error(errorData?.error?.message || `Failed to create payment order (${orderRes.status})`);
      }

      const orderData = await orderRes.json();
      const orderId = orderData.order_id;
      const keyId = orderData.key_id || import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_Tu1LtziG5Lhqvx';

      // 3. Configure Razorpay Standard Checkout options
      const rzpOptions = {
        key: keyId,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: options.name || 'MAXLINE LOGISTICS',
        description: options.description || `Wallet Recharge - ₹${options.amountINR.toFixed(2)}`,
        image: '/favicon.svg',
        order_id: orderId,
        prefill: {
          name: options.prefill?.name || '',
          email: options.prefill?.email || '',
          contact: options.prefill?.contact || '',
        },
        notes: options.notes || {},
        theme: {
          color: '#2563eb', // MAXLINE Brand Primary Blue
        },
        modal: {
          ondismiss: () => {
            if (options.onDismiss) {
              options.onDismiss();
            }
          },
        },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          try {
            // 4. Verify payment signature on backend
            const verifyRes = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();

            if (!verifyRes.ok || !verifyData.success) {
              throw new Error(verifyData?.error?.message || 'Payment signature verification failed.');
            }

            // 5. Success callback
            options.onSuccess({
              order_id: response.razorpay_order_id,
              payment_id: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              verifiedResponse: verifyData,
            });
          } catch (err: any) {
            if (options.onError) {
              options.onError({
                message: err?.message || 'Payment verification failed',
                details: err,
              });
            }
          }
        },
      };

      const rzp = new window.Razorpay(rzpOptions);

      // Handle payment failure event
      rzp.on('payment.failed', (response: any) => {
        if (options.onError) {
          options.onError({
            message: response.error?.description || 'Payment was unsuccessful or declined by your bank.',
            details: response.error,
          });
        }
      });

      // Open checkout modal
      rzp.open();
    } catch (err: any) {
      if (options.onError) {
        options.onError({
          message: err?.message || 'Failed to initialize payment gateway checkout',
          details: err,
        });
      }
    }
  },
};
