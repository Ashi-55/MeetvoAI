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
    const text = await transcribeAudio(buf);

    return NextResponse.json({ text });
  } catch {
    return NextResponse.json({ error: 'Transcription failed' }, { status: 500 });
  }
}

