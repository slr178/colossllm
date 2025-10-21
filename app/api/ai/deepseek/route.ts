// Server-side DeepSeek API route (avoids CORS)

export async function POST(request: Request) {
  const { prompt, apiKey } = await request.json();

  console.log('DeepSeek API called');
  console.log('   API Key exists:', !!apiKey);
  console.log('   Prompt length:', prompt?.length || 0);

  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    
    console.log('DeepSeek response:', JSON.stringify(data).substring(0, 300));

    if (!response.ok) {
      console.error('DeepSeek API error:', data);
      return Response.json({ 
        error: data.error?.message || 'DeepSeek API request failed',
        details: data 
      }, { status: response.status });
    }

    const content = data.choices?.[0]?.message?.content || '';
    
    if (!content) {
      console.error('Empty content from DeepSeek. Full response:', JSON.stringify(data));
    }

    return Response.json({
      content,
      model: 'deepseek-chat',
      provider: 'deepseek',
    });
  } catch (error: any) {
    console.error('DeepSeek route error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

