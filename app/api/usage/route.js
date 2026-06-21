import { NextResponse } from "next/server";

// This route stores real, site-wide usage stats using Vercel KV
// (a free Redis-style database that connects to your Vercel project).
// GET returns current stats. POST increments them.
//
// To activate this:
// 1. In your Vercel project dashboard, go to Storage > Create Database > KV
// 2. Connect it to this project (Vercel auto-fills the KV_* env vars)
// 3. That's it — this route will start working automatically

async function getKV() {
  const { kv } = await import("@vercel/kv");
  return kv;
}

function todayKey() {
  const d = new Date().toISOString().slice(0, 10);
  return `usage:${d}`;
}

export async function GET() {
  try {
    const kv = await getKV();
    const [total, risky, today] = await Promise.all([
      kv.get("usage:total"),
      kv.get("usage:risky"),
      kv.get(todayKey()),
    ]);
    return NextResponse.json({
      total: total || 0,
      risky: risky || 0,
      today: today || 0,
    });
  } catch (err) {
    // If KV isn't connected yet, fail gracefully instead of crashing the app.
    return NextResponse.json({ total: 0, risky: 0, today: 0, kvNotConnected: true });
  }
}

export async function POST(request) {
  try {
    const { wasRisky } = await request.json();
    const kv = await getKV();

    await kv.incr("usage:total");
    await kv.incr(todayKey());
    // Keep each day's counter around for 48 hours then let it expire automatically
    await kv.expire(todayKey(), 60 * 60 * 48);

    if (wasRisky) {
      await kv.incr("usage:risky");
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, kvNotConnected: true });
  }
}
