const PAYSTACK_BASE = "https://api.paystack.co";

export async function initializeTransaction({ email, amountInKobo, callbackUrl }) {
  const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, amount: amountInKobo, callback_url: callbackUrl }),
  });
  if (!res.ok) throw new Error(`Paystack error: ${await res.text()}`);
  return res.json();
}

export async function verifyTransaction(reference) {
  const res = await fetch(`${PAYSTACK_BASE}/transaction/verify/${reference}`, {
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
  });
  if (!res.ok) throw new Error(`Paystack verify error: ${await res.text()}`);
  return res.json();
}
