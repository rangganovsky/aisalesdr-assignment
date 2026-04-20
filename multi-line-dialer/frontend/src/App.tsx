import { useState } from 'react';
import { LeadSelector } from './components/LeadSelector';
import { DialerDashboard } from './components/DialerDashboard';

export default function App() {
  const [sessionId, setSessionId] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4">
        <h1 className="text-xl font-bold">Multi-Line Dialer</h1>
        {sessionId && (
          <button
            className="text-sm text-blue-600 underline ml-4"
            onClick={() => setSessionId(null)}
          >
            ← New Session
          </button>
        )}
      </header>
      <main className="max-w-4xl mx-auto px-6 py-8">
        {!sessionId
          ? <LeadSelector onSessionCreated={setSessionId} />
          : <DialerDashboard sessionId={sessionId} />
        }
      </main>
    </div>
  );
}
