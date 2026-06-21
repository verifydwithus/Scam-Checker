import { NextResponse } from "next/server";
import { verifyTransaction } from "../../../../lib/paystack";

// Paystack sends the user back to this URL after they complete payment,
// with a ?reference=xxxx in the URL. We verify that reference is real and
// genuinely successful before marking them as premium - this is the step
// that prevents people from faking a successful payment.
export async function GET(request) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const { searchParams } = new URL(request.url);
  const reference = searchParams.get("reference") || searchParams.get("trxref");

  if (!reference) {
    return NextResponse.redirect(`${siteUrl}/?upgraded=false`);
  }

  try {
    const result = await verifyTransaction(reference);
    const success = result?.data?.status === "success";
    return NextResponse.redirect(`${siteUrl}/?upgraded=${success ? "true" : "false"}`);
  } catch (err) {
    console.error("Paystack verify error:", err);
    return NextResponse.redirect(`${siteUrl}/?upgraded=false`);
  }
}
