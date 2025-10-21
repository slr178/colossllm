// Server-side Google Gemini API route

export async function POST(request: Request) {
  const { prompt, apiKey } = await request.json();

  console.log('Google/Gemini API called');
  console.log('   API Key exists:', !!apiKey);
  console.log('   Prompt length:', prompt?.length || 0);

  if (!apiKey) {
    console.error('Google API key is missing');
    return Response.json({ error: 'Google API key is required' }, { status: 400 });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            maxOutputTokens: 1000,
            temperature: 0.7,
          },
        }),
      }
    );

    const data = await response.json();
    
    console.log('Google response status:', response.status);
    console.log('Google response:', JSON.stringify(data).substring(0, 300));

    if (!response.ok) {
      console.error('Google API error:', data);
      return Response.json({ 
        error: data.error?.message || 'Google API request failed',
        details: data 
      }, { status: response.status });
    }

    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    if (!content) {
      console.error('Empty content from Google. Full response:', JSON.stringify(data));
    }

    return Response.json({
      content,
      model: 'gemini-2.0-flash-exp',
      provider: 'google',
    });
  } catch (error: any) {
    console.error('Google route error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

