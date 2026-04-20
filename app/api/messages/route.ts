import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ messages: [], page: 1, hasMore: false });
}

export async function POST() {
  return NextResponse.json({ ok: true });
}
