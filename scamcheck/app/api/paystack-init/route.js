import { NextResponse } from "next/server";
import { initializeTransaction } from "@/lib/paystack";

export async function POST(request) {
  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const data = await initializeTransaction({
      email: "customer@verifyd.app",
      amountInKobo: 200000,
      callbackUrl: `${siteUrl}/api/paystack-verify`,
    });
    return NextResponse.json({ url: data.data.authorization_url });
  } catch (err) {
    console.error("Paystack init error:", err);
    return NextResponse.json({ error: "Could not start checkout." }, { status: 500 });
  }
}
