import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const raw = await request.text();
  return NextResponse.json({ received: true, length: raw.length });
}
