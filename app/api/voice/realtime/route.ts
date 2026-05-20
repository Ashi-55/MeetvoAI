import { NextResponse } from 'next/server';

import { transcribeAudio } from '@/lib/huggingface';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audio = formData.get('audio');
    if (!(audio instanceof File)) {
      return NextResponse.json({ error: 'Missing audio file' }, { status: 400 });
    }

    const buf = await audio.arrayBuffer();
    const mimeType = audio.type || 'audio/webm';
    const text = await transcribeAudio(buf, mimeType);

    return NextResponse.json({ text });
  } catch (e) {
    console.error('Realtime transcription error', e);
    return NextResponse.json({ error: 'Realtime transcription failed' }, { status: 500 });
  }
}
