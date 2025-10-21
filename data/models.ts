export interface Model {
  id: string;
  name: string;
  color: string;
  description: string;
  logo: string;
}

export const models: Model[] = [
  {
    id: 'deepseek-max',
    name: 'DeepSeek MAX',
    color: '#F0B90B',
    description: '',
    logo: '/deepseek.png',
  },
  {
    id: 'gpt-5',
    name: 'GPT-5',
    color: '#2EAAA8',
    description: '',
    logo: '/gpt.png',
  },
  {
    id: 'grok-4',
    name: 'GROK-4',
    color: '#9B59B6',
    description: '',
    logo: '/grok.png',
  },
  {
    id: 'qwen-3-max',
    name: 'Qwen 3 Max',
    color: '#E67E22',
    description: '',
    logo: '/qwen.png',
  },
  {
    id: 'gemini-2-5-pro',
    name: 'Gemini 2.5 Pro',
    color: '#4285F4',
    description: '',
    logo: '/gemini.png',
  },
  {
    id: 'claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet',
    color: '#D97757',
    description: '',
    logo: '/claude.png',
  },
];

