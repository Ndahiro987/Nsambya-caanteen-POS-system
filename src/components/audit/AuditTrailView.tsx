import React, { useState } from 'react';
import { AuditLog } from '../../types/pos';
import { formatDateTime } from '../../utils/formatters';
import { FileText, Search, ShieldAlert, Filter, Clock, User } from 'lucide-react';

interface AuditTrailViewProps {
  auditLogs: AuditLog[];
}

export const AuditTrailView: React.FC<AuditTrailViewProps> = ({ auditLogs }) => {
  const [search, setSearch] = useState<string>('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const filteredLogs = auditLogs.filter(log => {
    if (actionFilter !== 'all' && log.action !== actionFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchAction = log.action.toLowerCase().includes(q);
      const matchUser = log.userName.toLowerCase().includes(q);
      const matchRecord = log.recordId?.toLowerCase().includes(q);
      const matchReason = log.reason?.toLowerCase().includes(q);
      if (!matchAction && !matchUser && !matchRecord && !matchReason) return false;
    }
    return true;
  });

  const uniqueActions = Array.from(new Set(auditLogs.map(l => l.action)));

  const getActionBadgeColor = (action: string) => {
    if (action.includes('CORRECTION') || action.includes('VOID') || action.includes('REJECT')) {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }
    if (action.includes('VERIFIED') || action.includes('APPROVED')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (action.includes('CLOSING') || action.includes('PRICE')) {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    if (action.includes('REPRINT')) {
      return 'bg-amber-50 text-amber-800 border-amber-200';
    }
    return 'bg-slate-50 text-slate-700 border-slate-200';
  };

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
      
      {/* Header bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            <FileText className="w-4 h-4 text-emerald-600" />
            <span>Immutable Security & Operations Log</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 mt-1">Hospital POS Audit Trail</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Full tamper-evident record of orders, price edits, reprints, supervisor overrides and cash settlements.
          </p>
        </div>

        <div className="text-xs text-slate-500 font-mono self-start sm:self-auto">
          {auditLogs.length} Events Recorded
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search audit trail by user, record ID or reason..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            className="text-xs font-semibold px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden"
          >
            <option value="all">All Action Types ({auditLogs.length})</option>
            {uniqueActions.map(act => (
              <option key={act} value={act}>{act}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-4">Target Record</th>
                <th className="py-3 px-4">Operational Reason / Notes</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                    {formatDateTime(log.createdAt)}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border font-mono ${getActionBadgeColor(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                    {log.userName}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-700 whitespace-nowrap">
                    {log.recordType}: {log.recordId}
                  </td>
                  <td className="py-3 px-4 text-slate-600 truncate max-w-md">
                    {log.reason || '—'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 underline"
                      >
                        Metadata
                      </button>
                    )}
                  </td>
                </tr>
              ))}

              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No audit records match your query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Metadata Inspector Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-slate-400">AUDIT METADATA</span>
                <h3 className="font-extrabold text-base text-slate-900">{selectedLog.action}</h3>
              </div>
              <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Time:</span>
                <span className="font-mono text-slate-800">{formatDateTime(selectedLog.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Actor:</span>
                <span className="font-bold text-slate-800">{selectedLog.userName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Record:</span>
                <span className="font-mono text-slate-800">{selectedLog.recordType}: {selectedLog.recordId}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-1">Payload:</span>
                <pre className="p-3 bg-slate-900 text-emerald-400 rounded-xl font-mono text-[11px] overflow-x-auto">
                  {JSON.stringify(selectedLog.metadata, null, 2)}
                </pre>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 border rounded-xl font-semibold text-xs text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
