// Simulate a successful Midtrans payment webhook (no real Midtrans needed).
//
// Your /payment/webhook verifies a signature:
//   sha512(order_id + status_code + gross_amount + MIDTRANS_SERVER_KEY)
// This script computes that signature and POSTs a "settlement" notification,
// which drives BookingService.onPaymentSuccess -> creates the delegation,
// marks the booking CONFIRMED, and writes the AUTHORITY_ISSUED ledger event.
//
// Prereq: set MIDTRANS_SERVER_KEY to ANY value on Railway (e.g. "test-secret")
// and pass the SAME value here.
//
// Usage:
//   node scripts/simulate-payment.mjs \
//     --base https://your-app.up.railway.app \
//     --order RH-ab12cd34-1718000000000 \
//     --amount 250000 \
//     --key test-secret
//
// (flags can also come from env: BASE_URL, ORDER_ID, GROSS_AMOUNT, MIDTRANS_SERVER_KEY)

import { createHash } from "node:crypto";

function arg(name, envName, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  if (i !== -1 && process.argv[i + 1]) return process.argv[i + 1];
  if (envName && process.env[envName]) return process.env[envName];
  return fallback;
}

const base = arg("base", "BASE_URL", "http://localhost:3001").replace(/\/$/, "");
const orderId = arg("order", "ORDER_ID");
const grossAmount = String(arg("amount", "GROSS_AMOUNT", "")); // must match what you pass; any value is fine
const statusCode = arg("status-code", "STATUS_CODE", "200");
const serverKey = arg("key", "MIDTRANS_SERVER_KEY");

if (!orderId || !serverKey) {
  console.error("Missing --order (orderId) or --key (MIDTRANS_SERVER_KEY).");
  process.exit(1);
}

// gross_amount in Midtrans signatures is the decimal string, e.g. "250000.00".
const gross = grossAmount.includes(".") ? grossAmount : `${grossAmount}.00`;

const signature = createHash("sha512")
  .update(`${orderId}${statusCode}${gross}${serverKey}`)
  .digest("hex");

const body = {
  order_id: orderId,
  status_code: statusCode,
  gross_amount: gross,
  signature_key: signature,
  transaction_status: "settlement",
  transaction_id: `SIMULATED-${Date.now()}`,
  payment_type: "qris",
  fraud_status: "accept",
};

console.log(`POST ${base}/payment/webhook`);
console.log(body);

const res = await fetch(`${base}/payment/webhook`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});
console.log(`\n-> ${res.status} ${res.statusText}`);
console.log(await res.text());
