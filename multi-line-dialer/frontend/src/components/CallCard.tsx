import type { CallResult, Lead } from '../services/api';

interface Props {
  call: CallResult;
  lead: Lead | undefined;
  isWinner: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  CONNECTING:          'text-yellow-600',
  CONNECTED:           'text-green-600',
  NO_ANSWER:           'text-gray-500',
  BUSY:                'text-orange-500',
  VOICEMAIL:           'text-blue-500',
  CANCELED_BY_DIALER:  'text-red-400',
};

export function CallCard({ call, lead, isWinner }: Props) {
  return (
    <div className={`border rounded-lg p-4 ${isWinner ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
      {isWinner && <div className="text-xs text-green-600 font-semibold mb-1">🏆 WINNER</div>}
      <div className="font-semibold">{lead?.name ?? call.leadId}</div>
      <div className="text-sm text-gray-500">{lead?.company}</div>
      <div className="text-sm text-gray-500">{lead?.phone}</div>
      <div className={`text-sm font-medium mt-2 ${STATUS_COLORS[call.status] ?? 'text-gray-600'}`}>
        ● {call.status.replace(/_/g, ' ')}
      </div>
      <div className="text-xs text-gray-400 mt-1">
        CRM: {call.crmActivityCreated ? '✓ synced' : 'pending'}
      </div>
    </div>
  );
}
