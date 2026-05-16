import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json() as { prompt: string };

    const systemPrompt = `You are MeetvoAI's agent builder. The user is an Indian developer/builder who wants to create an AI automation agent. Analyze their prompt and generate a complete agent specification.

Return a JSON object with:
{
  "name": string,
  "tagline": string,
  "description": string,
  "category": string,
  "use_cases": string[],
  "features": string[],
  "integrations": string[],
  "languages_supported": string[],
  "suggested_price_monthly": number,
  "conversation_flow": {
    "nodes": Array<{
      "id": string,
      "type": "start" | "message" | "question" | "condition" | "end",
      "content": string,
      "position": { "x": number, "y": number }
    }>,
    "edges": Array<{
      "from": string,
      "to": string,
      "label": string
    }>
  }
}

Make it specific, practical, and India-focused. Always include WhatsApp as a channel. Position nodes in a flowchart layout (start at x:50, y:20, cascade downward with y increments of 80, branch nodes offset x by 200).
Return ONLY valid JSON, no markdown.`;

    const stream = await client.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(chunk.delta.text));
          }
        }
        controller.close();
      },
    });

    return new Response(readable, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
  }
}
