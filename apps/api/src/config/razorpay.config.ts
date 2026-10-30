import Razorpay from 'razorpay';

export const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_Tu1LtziG5Lhqvx';
export const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '5hDdnq0PT1gV64UYEV7vk3TE';

export const razorpayInstance = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});
