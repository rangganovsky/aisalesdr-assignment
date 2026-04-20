import { useEffect, useState, useCallback, useMemo } from 'react';
import { getSession, startSession, stopSession, SessionResponse } from '../services/api';
import { usePolling } from '../hooks/usePolling';
import { CallCard } from './CallCard';

interface Props {
  sessionId: string;
}

export function DialerDashboard({ sessionId }: Props) {
  const [session, setSession] = useState<SessionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSession = useCallback(async () => {
    try {
      const data = await getSession(sessionId);
      setSession(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch session');
    }
  }, [sessionId]);

  useEffect(() => {
    // Initial fetch
    const init = async () => {
      try {
        const [sessionData] = await Promise.all([
          getSession(sessionId),
        ]);
        setSession(sessionData);
        setLoading(false);
      } catch (err) {
        setError('Failed to load session');
        setLoading(false);
      }
    };
    init();
  }, [sessionId]);

  // Poll every 1.5 seconds when session is running
  usePolling(fetchSession, 1500, session?.status === 'RUNNING');

  const handleStart = useCallback(async () => {
    if (!session) return;
    try {
      const data = await startSession(sessionId);
      setSession(data);
    } catch (err) {
      setError('Failed to start session');
    }
  }, [sessionId, session]);

  const handleStop = useCallback(async () => {
    if (!session) return;
    try {
      await stopSession(sessionId);
      // Optimistic update for instant feedback
      setSession({ ...session, status: 'STOPPED' });
    } catch (err) {
      setError('Failed to stop session');
    }
  }, [sessionId, session]);

  const activeCalls = useMemo(() => {
    if (!session || !session.calls) return [];
    return session.calls.filter((c) => session.activeCallIds?.includes(c.id));
  }, [session]);

  const completedCalls = useMemo(() => {
    if (!session || !session.calls) return [];
    return session.calls
      .filter((c) => !session.activeCallIds?.includes(c.id))
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  }, [session]);

  if (loading) {
    return <div className="p-8 text-gray-500">Loading session...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-500">{error}</div>;
  }

  if (!session) {
    return <div className="p-8 text-gray-500">Session not found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Session: {session.id.slice(0, 8)}</h2>
          <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
            <span className={`inline-flex items-center gap-1 ${
              session.status === 'RUNNING' ? 'text-green-600' : 'text-gray-500'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                session.status === 'RUNNING' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
              }`} />
              {session.status}
            </span>
            <span>Queue: {session.leadQueue.length} remaining</span>
          </div>
        </div>
        <div className="flex gap-3">
          {session.status === 'STOPPED' && session.leadQueue.length > 0 && (
            <button
              onClick={handleStart}
              className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              Start Dialing
            </button>
          )}
          {session.status === 'RUNNING' && (
            <button
              onClick={handleStop}
              className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
            >
              Stop Session
            </button>
          )}
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-gray-500">Attempted</div>
          <div className="text-2xl font-semibold">{session.metrics.attempted}</div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-gray-500">Connected</div>
          <div className="text-2xl font-semibold text-green-600">{session.metrics.connected}</div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-gray-500">Failed</div>
          <div className="text-2xl font-semibold text-orange-500">{session.metrics.failed}</div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-gray-500">Canceled</div>
          <div className="text-2xl font-semibold text-red-400">{session.metrics.canceled}</div>
        </div>
      </div>

      {/* Active Calls (2-line dialer display) */}
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-3">Active Lines (max 2)</h3>
        <div className="grid grid-cols-2 gap-4">
          {[0, 1].map((slot) => {
            const call = activeCalls[slot];
            return call ? (
              <CallCard
                key={call.id}
                call={call}
                lead={undefined}
                isWinner={call.id === session.winnerCallId}
              />
            ) : (
              <div key={slot} className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center text-gray-400">
                Line {slot + 1} — Empty
              </div>
            );
          })}
        </div>
      </div>

      {/* Call Log */}
      {completedCalls.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-3">Call Log ({completedCalls.length})</h3>
          <div className="space-y-2">
            {completedCalls.map((call) => (
              <CallCard
                key={call.id}
                call={call}
                lead={undefined}
                isWinner={call.id === session.winnerCallId}
              />
            ))}
          </div>
        </div>
      )}

      {/* Session Complete */}
      {session.status === 'STOPPED' && session.leadQueue.length === 0 && activeCalls.length === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <div className="text-green-800 font-medium">Session Complete</div>
          <div className="text-sm text-green-600 mt-1">
            All leads processed. {session.metrics.connected} calls connected.
          </div>
        </div>
      )}
    </div>
  );
}
