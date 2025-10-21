// Server-side Qwen API route

export async function POST(request: Request) {
  const { prompt, apiKey } = await request.json();

  console.log('Qwen API called');
  console.log('   API Key exists:', !!apiKey);
  console.log('   Prompt length:', prompt?.length || 0);

  try {
    // OpenRouter.ai API - unified gateway for all models
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'BNB Arena AI Trading',
      },
      body: JSON.stringify({
        model: 'qwen/qwen-2.5-72b-instruct',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    
    console.log('Qwen response status:', response.status);
    console.log('Qwen response:', JSON.stringify(data).substring(0, 300));

    if (!response.ok) {
      console.error('Qwen API error:', data);
      return Response.json({ 
        error: data.error?.message || data.message || 'Qwen API request failed',
        details: data 
      }, { status: response.status });
    }

    // ModelScope Studio uses OpenAI-compatible format
    const content = data.choices?.[0]?.message?.content || '';
    
    if (!content) {
      console.error('Empty content from Qwen. Full response:', JSON.stringify(data));
    }

    return Response.json({
      content,
      model: 'qwen/qwen-2.5-72b-instruct',
      provider: 'qwen',
    });
  } catch (error: any) {
    console.error('Qwen route error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

