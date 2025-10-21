// Server-side Anthropic API route (avoids CORS)

export async function POST(request: Request) {
  const { prompt, apiKey } = await request.json();

  console.log('Anthropic/Claude API called');
  console.log('   API Key exists:', !!apiKey);
  console.log('   Prompt length:', prompt?.length || 0);

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();
    
    console.log('Anthropic response status:', response.status);
    console.log('Anthropic response:', JSON.stringify(data).substring(0, 300));

    if (!response.ok) {
      console.error('Anthropic API error:', data);
      return Response.json({ 
        error: data.error?.message || 'Anthropic API request failed',
        details: data 
      }, { status: response.status });
    }

    const content = data.content?.[0]?.text || '';
    
    if (!content) {
      console.error('Empty content from Anthropic. Full response:', JSON.stringify(data));
    }

    return Response.json({
      content,
      model: 'claude-3-5-sonnet',
      provider: 'anthropic',
    });
  } catch (error: any) {
    console.error('Anthropic route error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

