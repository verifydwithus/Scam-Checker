// Paystack doesn't have an official SDK package like Stripe does for Node,
// so we just call their REST API directly using fetch. This is the
// standard, recommended approach for Paystack.

const PAYSTACK_BASE_URL = "https://api.paystack.co";

export async function initializeTransaction({ email, amountInKobo, callbackUrl }) {
  const res = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      amount: amountInKobo, // Paystack uses the smallest currency unit (kobo for NGN, cents for ZAR)
      callback_url: callbackUrl,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Paystack initialize failed: ${errText}`);
  }

  return res.json();
}

export async function verifyTransaction(reference) {
  const res = await fetch(`${PAYSTACK_BASE_URL}/transaction/verify/${reference}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Paystack verify failed: ${errText}`);
  }

  return res.json();
}
