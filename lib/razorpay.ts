// Razorpay client.
// Note: This project previously used the `razorpay` package at runtime; we keep
// the import as-is and fallback gracefully if types are missing.

// eslint-disable-next-line @typescript-eslint/no-var-requires
const RazorpayCtor = require('razorpay');

const keyId = process.env.RAZORPAY_KEY_ID ?? '';
const keySecret = process.env.RAZORPAY_KEY_SECRET ?? '';

export const razorpay = new RazorpayCtor({ key_id: keyId, key_secret: keySecret });

