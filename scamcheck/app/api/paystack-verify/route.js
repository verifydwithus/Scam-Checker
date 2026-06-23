import { NextResponse } from "next/server";
import { verifyTransaction } from "@/lib/paystack";

export async function GET(request) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const { searchParams } = new URL(request.url);
  const reference = searchParams.get("reference") || searchParams.get("trxref");
  if (!reference) return NextResponse.redirect(`${siteUrl}/?upgraded=false`);
  try {
    const result = await verifyTransaction(reference);
    const success = result?.data?.status === "success";
    return NextResponse.redirect(`${siteUrl}/?upgraded=${success ? "true" : "false"}`);
  } catch (err) {
    return NextResponse.redirect(`${siteUrl}/?upgraded=false`);
  }
}
