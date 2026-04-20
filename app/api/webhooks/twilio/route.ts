import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.formData();
  return NextResponse.json({
    received: true,
    keys: Array.from(body.keys()),
  });
}
