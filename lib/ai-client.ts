// AI Model Client - Universal interface for all AI providers

export interface AIResponse {
  content: string;
  model: string;
  provider: string;
}

export class AIClient {
  static async callOpenAI(prompt: string): Promise<AIResponse> {
    const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
      }),
    });

    const data = await response.json();
    return {
      content: data.choices?.[0]?.message?.content || '',
      model: 'gpt-4',
      provider: 'openai',
    };
  }

  static async callDeepSeek(prompt: string): Promise<AIResponse> {
    const apiKey = process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY;
    
    const response = await fetch('/api/ai/deepseek', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, apiKey }),
    });

    return response.json();
  }

  static async callAnthropic(prompt: string): Promise<AIResponse> {
    const apiKey = process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY;
    
    const response = await fetch('/api/ai/anthropic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, apiKey }),
    });

    return response.json();
  }

  static async callXAI(prompt: string): Promise<AIResponse> {
    const apiKey = process.env.NEXT_PUBLIC_XAI_API_KEY;
    
    const response = await fetch('/api/ai/xai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, apiKey }),
    });

    return response.json();
  }

  static async callQwen(prompt: string): Promise<AIResponse> {
    const apiKey = process.env.NEXT_PUBLIC_QWEN_API_KEY;
    
    const response = await fetch('/api/ai/qwen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, apiKey }),
    });

    return response.json();
  }

  static async callGoogle(prompt: string): Promise<AIResponse> {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
    
    const response = await fetch('/api/ai/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, apiKey }),
    });

    return response.json();
  }

  // Universal call based on AI ID
  static async call(aiId: string, prompt: string): Promise<AIResponse> {
    switch (aiId) {
      case 'deepseek-max':
        return this.callDeepSeek(prompt);
      case 'gpt-5':
        return this.callOpenAI(prompt);
      case 'grok-4':
        return this.callXAI(prompt);
      case 'qwen-3-max':
        return this.callQwen(prompt);
      case 'gemini-2-5-pro':
        return this.callGoogle(prompt);
      default:
        return this.callOpenAI(prompt); // Fallback to OpenAI
    }
  }
}

