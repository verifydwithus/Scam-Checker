import { NextResponse } from "next/server";

// Simple in-memory fallback counter for when KV is not connected.
// Once you connect Vercel KV (Storage > Create Database > KV),
// replace this with the KV implementation.

export async function GET() {
  return NextResponse.json({ total: 0, risky: 0, today: 0 });
}

export async function POST(request) {
  return NextResponse.json({ ok: true });
}