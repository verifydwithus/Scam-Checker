import { NextResponse } from "next/server";
import { initializeTransaction } from "../../../../lib/paystack";

// This is the real backend endpoint Paystack needs.
// The frontend calls this when the user clicks "Continue to checkout".
// It starts a secure, hosted Paystack payment page and returns its URL.
export async function POST(request) {
  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    // We don't collect email up front in this simple version, so we use a
    // placeholder. Paystack will still ask the customer for their email
    // and card details on its own secure payment page.
    const body = await request.json().catch(() => ({}));
    const email = body.email || "customer@verifyd.app";

    // Price in the smallest currency unit. Example: ₦2,000 = 200000 kobo.
    // Change PRICE_IN_SMALLEST_UNIT to match your real price and currency.
    const PRICE_IN_SMALLEST_UNIT = 200000; // adjust this to your real price

    const data = await initializeTransaction({
      email,
      amountInKobo: PRICE_IN_SMALLEST_UNIT,
      callbackUrl: `${siteUrl}/api/paystack-verify`,
    });

    return NextResponse.json({ url: data.data.authorization_url });
  } catch (err) {
    console.error("Paystack init error:", err);
    return NextResponse.json(
      { error: "Could not start checkout. Please try again." },
      { status: 500 }
    );
  }
}
