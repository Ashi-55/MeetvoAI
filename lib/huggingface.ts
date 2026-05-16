export async function callLlama(
  system: string,
  user: string,
  maxTokens = 800
): Promise<string> {
  try {
    const res = await fetch('https://router.huggingface.co/novita/v3/openai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY ?? ''}`,
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.1-8b-instruct',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        max_tokens: maxTokens,
        temperature: 0.2,
      }),
    });

    if (!res.ok) return '';
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    return data.choices?.[0]?.message?.content?.trim() ?? '';
  } catch {
    return '';
  }
}

export function extractJSON(text: string): unknown | null {
  try {
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) return null;

    const jsonText = text.slice(firstBrace, lastBrace + 1);
    return JSON.parse(jsonText);
  } catch {
    return null;
  }
}

export async function transcribeAudio(audioBuffer: ArrayBuffer): Promise<string> {
  try {
    const res = await fetch('https://api-inference.huggingface.co/models/openai/whisper-large-v3', {
      method: 'POST',
      headers: {
        'Content-Type': 'audio/wav',
        Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY ?? ''}`,
      },
      body: audioBuffer,
    });

    if (!res.ok) return '';
    const data = (await res.json()) as { text?: string };
    return (data.text ?? '').trim();
  } catch {
    return '';
  }
}

