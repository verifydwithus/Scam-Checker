import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ total: 0, risky: 0, today: 0 });
}

export async function POST() {
  return NextResponse.json({ ok: true });
}
