'use client';
import { useState } from 'react';

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResponse('');
    setError('');

    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          clerkUserId: 'your-clerk-user-id-here', // Replace with real Clerk user ID
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setResponse(data.text);
      } else {
        setError(data.error || 'Something went wrong.');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to fetch response.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 p-8 font-sans">
      <h1 className="text-2xl font-bold text-center">💸 Ask your Financial Assistant</h1>

      <form onSubmit={handleSubmit} className="w-full max-w-xl flex flex-col gap-4">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask something like 'How should I budget for the next month?'"
          className="border border-gray-300 rounded p-3 min-h-[100px]"
          required
        />

        <button
          type="submit"
          className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition"
          disabled={loading}
        >
          {loading ? 'Thinking...' : 'Ask Gemini'}
        </button>
      </form>

      {error && <p className="text-red-600 text-center">{error}</p>}

      {response && (
        <div className="max-w-xl bg-gray-100 p-4 rounded shadow mt-4 whitespace-pre-wrap">
          {response}
        </div>
      )}
    </main>
  );
}
