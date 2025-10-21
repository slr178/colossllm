'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AIClient } from '@/lib/ai-client';

export default function VerifyPage() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const testAllAPIs = async () => {
    setTesting(true);
    setResults([]);
    console.clear();
    console.log('🧪 === TESTING ALL AI APIs VIA SERVER ROUTES ===\n');

    const tests = [
      { id: 'deepseek-max', name: 'DeepSeek' },
      { id: 'gpt-5', name: 'OpenAI' },
      { id: 'gemini-2-5-pro', name: 'Google Gemini' },
      { id: 'grok-4', name: 'xAI Grok' },
      { id: 'qwen-3-max', name: 'Qwen' },
    ];

    const testResults = [];

    for (const test of tests) {
      try {
        console.log(`Testing ${test.name}...`);
        const start = Date.now();
        const response = await AIClient.call(test.id, 'Reply with just OK');
        const duration = Date.now() - start;

        console.log(`✅ ${test.name}: ${response.content} (${duration}ms)`);
        testResults.push({
          name: test.name,
          status: 'success',
          response: response.content,
          duration,
        });
      } catch (error: any) {
        console.log(`❌ ${test.name}: ${error.message}`);
        testResults.push({
          name: test.name,
          status: 'error',
          error: error.message,
        });
      }
    }

    setResults(testResults);
    setTesting(false);

    const successful = testResults.filter(r => r.status === 'success').length;
    console.log(`\n📊 Results: ${successful}/${testResults.length} APIs working\n`);
  };

  return (
    <div className="min-h-screen bg-black p-12">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-xs text-muted hover:text-yellow transition-colors uppercase tracking-wider">
          ← Back
        </Link>

        <h1 className="text-2xl font-black text-yellow mt-4 mb-6 uppercase">API Verification</h1>

        <div className="bg-card border border-yellow p-6 mb-6">
          <p className="text-sm text-white mb-4">
            Testing all AI model APIs through server-side routes. Check console (F12) for details.
          </p>

          <button
            onClick={testAllAPIs}
            disabled={testing}
            className={`w-full py-4 font-black uppercase tracking-widest transition-all ${
              testing
                ? 'bg-muted text-black cursor-not-allowed'
                : 'bg-yellow text-black hover:bg-yellow-dark'
            }`}
          >
            {testing ? '🧪 TESTING...' : '🧪 TEST ALL AI APIS'}
          </button>
        </div>

        {results.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-yellow uppercase tracking-widest">Results</h2>
            {results.map((result, i) => (
              <div
                key={i}
                className={`border p-4 ${
                  result.status === 'success'
                    ? 'bg-green-500/10 border-green-500'
                    : 'bg-red-500/10 border-red-500'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-white">{result.name}</span>
                  <span className={`text-xs font-mono ${
                    result.status === 'success' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {result.status === 'success' ? '✅ SUCCESS' : '❌ FAILED'}
                  </span>
                </div>
                {result.status === 'success' ? (
                  <div className="text-sm">
                    <p className="text-green-400 mb-1">Response: {result.response}</p>
                    <p className="text-xs text-muted">Duration: {result.duration}ms</p>
                  </div>
                ) : (
                  <p className="text-sm text-red-400">Error: {result.error}</p>
                )}
              </div>
            ))}

            <div className="bg-card border border-border p-5 mt-6">
              <div className="text-center">
                <div className="text-3xl font-mono font-black mb-2">
                  {results.filter(r => r.status === 'success').length}/{results.length}
                </div>
                <div className="text-sm text-muted">APIs Working</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

