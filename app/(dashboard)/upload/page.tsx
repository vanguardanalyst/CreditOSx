'use client';

import { useState } from 'react';
import { AnalysisOutput } from '@/lib/types';
import { sampleTranscript } from '@/lib/sample-transcript';

export default function UploadPage() {
  const [text, setText] = useState(sampleTranscript);
  const [result, setResult] = useState<AnalysisOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = async () => {
    setLoading(true);
    setError(null);

    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcriptText: text })
    });

    if (!response.ok) {
      setError('Analysis failed. Validate keys and subscription controls.');
      setLoading(false);
      return;
    }

    const payload = (await response.json()) as AnalysisOutput;
    setResult(payload);
    setLoading(false);
  };

  return (
    <section className="space-y-4 py-4">
      <h1 className="text-2xl font-semibold">Upload Transcript</h1>
      <p className="text-sm text-slate-400">Paste transcript text or use PDF extraction upstream. Structured output only.</p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="h-72 w-full rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm"
      />
      <button
        onClick={analyze}
        className="rounded-md bg-mutedBlue px-4 py-2 text-sm font-medium text-white"
        disabled={loading}
      >
        {loading ? 'Analyzing…' : 'Generate Analysis'}
      </button>
      {error && <p className="text-sm text-red-400">{error}</p>}
      {result && (
        <pre className="panel overflow-x-auto rounded-xl p-4 text-xs text-slate-200">{JSON.stringify(result, null, 2)}</pre>
      )}
    </section>
  );
}
