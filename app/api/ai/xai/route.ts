// Server-side xAI (Grok) API route

export async function POST(request: Request) {
  const { prompt, apiKey } = await request.json();

  console.log('xAI/Grok API called');
  console.log('   API Key exists:', !!apiKey);
  console.log('   Prompt length:', prompt?.length || 0);

  try {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'grok-2-1212',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    
    console.log('xAI response status:', response.status);
    console.log('xAI response:', JSON.stringify(data).substring(0, 300));

    if (!response.ok) {
      console.error('xAI API error:', data);
      return Response.json({ 
        error: data.error?.message || 'xAI API request failed',
        details: data 
      }, { status: response.status });
    }

    const content = data.choices?.[0]?.message?.content || '';
    
    if (!content) {
      console.error('Empty content from xAI. Full response:', JSON.stringify(data));
    }

    return Response.json({
      content,
      model: 'grok-2-1212',
      provider: 'xai',
    });
  } catch (error: any) {
    console.error('xAI route error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

