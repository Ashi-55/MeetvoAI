import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

interface NotificationPayload {
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  whatsapp?: string;
  email?: string;
}

export async function POST(request: Request) {
  try {
    const payload = await request.json() as NotificationPayload;
    const service = createServiceClient();

    await service.from('notifications').insert({
      user_id: payload.userId,
      type: payload.type,
      title: payload.title,
      body: payload.body,
      data: payload.data || null,
    });

    if (payload.whatsapp && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      try {
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`;
        await fetch(twilioUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64')}`,
          },
          body: new URLSearchParams({
            From: process.env.TWILIO_WHATSAPP_FROM || '',
            To: `whatsapp:${payload.whatsapp}`,
            Body: `${payload.title}\n${payload.body}\n\nVisit: ${process.env.NEXT_PUBLIC_APP_URL}`,
          }),
        });
      } catch {}
    }

    if (payload.email && process.env.RESEND_API_KEY) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
          body: JSON.stringify({
            from: 'MeetvoAI <noreply@meetvoai.com>',
            to: payload.email,
            subject: payload.title,
            html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0A0A0C; color: #F0EFF8; padding: 32px; border-radius: 12px;">
              <h1 style="color: #6C3AFF; margin-bottom: 8px;">MeetvoAI</h1>
              <h2 style="margin-bottom: 16px;">${payload.title}</h2>
              <p style="color: #A8A4B8; line-height: 1.6;">${payload.body}</p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="display: inline-block; margin-top: 24px; background: #6C3AFF; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Open MeetvoAI</a>
            </div>`,
          }),
        });
      } catch {}
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Notification failed' }, { status: 500 });
  }
}
