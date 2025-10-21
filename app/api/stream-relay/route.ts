// OPTIONAL: Server-side relay to keep your token private
// This is a Next.js API route that relays Bitquery events via Server-Sent Events (SSE)
// Use this if you don't want to expose your token in the browser

import { createClient } from 'graphql-ws';

// Server-side token (not exposed to browser)
const BITQUERY_TOKEN = process.env.BITQUERY_TOKEN;
const FOUR_MEME_CONTRACT = '0x4444444444444444444444444444444444444444';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!BITQUERY_TOKEN) {
    return new Response('Bitquery token not configured', { status: 500 });
  }

  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const encoder = new TextEncoder();

  const client = createClient({
    url: `wss://streaming.bitquery.io/graphql?token=${BITQUERY_TOKEN}`,
  });

  const query = `
    subscription {
      EVM(network: bsc) {
        Events(
          where: {
            Log: {
              Signature: { Name: { is: "TokenCreate" } }
              SmartContract: { is: "${FOUR_MEME_CONTRACT}" }
            }
          }
        ) {
          Block { Number Time }
          Transaction { Hash From }
          Log { SmartContract }
          Arguments {
            Name
            Value {
              ... on EVM_ABI_Integer_Value_Arg { integer }
              ... on EVM_ABI_String_Value_Arg { string }
              ... on EVM_ABI_Address_Value_Arg { address }
              ... on EVM_ABI_BigInt_Value_Arg { bigInteger }
            }
          }
        }
      }
    }
  `;

  const unsubscribe = client.subscribe(
    { query },
    {
      next: (data) => {
        writer.write(
          encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
        );
      },
      error: (err) => {
        console.error('WebSocket error:', err);
        writer.write(
          encoder.encode(`data: ${JSON.stringify({ error: err.message })}\n\n`)
        );
      },
      complete: () => {
        writer.close();
      },
    }
  );

  // Clean up on client disconnect
  request.signal.addEventListener('abort', () => {
    unsubscribe();
    client.dispose();
  });

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

