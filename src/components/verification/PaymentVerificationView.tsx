import React, { useState } from 'react';
import { Payment, Order, User } from '../../types/pos';
import { formatDateTime, formatUGX, getPaymentMethodLabel } from '../../utils/formatters';
import { CheckCircle2, XCircle, Search, Smartphone, Building2, AlertCircle, ShieldCheck } from 'lucide-react';

interface PaymentVerificationViewProps {
  payments: Payment[];
  orders: Order[];
  currentUser: User;
  onVerifyPayment: (paymentId: string, notes: string) => void;
  onRejectPayment: (paymentId: string, reason: string) => void;
}

export const PaymentVerificationView: React.FC<PaymentVerificationViewProps> = ({
  payments,
  orders,
  currentUser,
  onVerifyPayment,
  onRejectPayment
}) => {
  const [filter, setFilter] = useState<'pending' | 'verified' | 'all'>('pending');
  const [search, setSearch] = useState<string>('');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [verifyNotes, setVerifyNotes] = useState<string>('');
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  const filteredPayments = payments.filter(p => {
    if (filter === 'pending' && p.status !== 'pending_verification') return false;
    if (filter === 'verified' && p.status !== 'verified') return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchOrder = p.orderNumber.toLowerCase().includes(q);
      const matchRef = p.externalReference?.toLowerCase().includes(q);
      const matchCashier = p.recordedByName.toLowerCase().includes(q);
      if (!matchOrder && !matchRef && !matchCashier) return false;
    }
    return true;
  });

  const getAssociatedOrder = (orderId: string) => {
    return orders.find(o => o.id === orderId);
  };

  const handleConfirmVerification = (paymentId: string) => {
    onVerifyPayment(paymentId, verifyNotes || 'Reference confirmed against merchant notification');
    setVerifyingId(null);
    setVerifyNotes('');
  };

  const handleConfirmRejection = (paymentId: string) => {
    if (!rejectReason.trim()) return;
    onRejectPayment(paymentId, rejectReason);
    setRejectingId(null);
    setRejectReason('');
  };

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
      
      {/* Title & Info Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-700">
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            <span>Supervisor Payment Review Queue</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 mt-1">Non-Cash Payment Verification</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cross-check MTN Mobile Money, Airtel Money & Staff Payroll Deductions before settlement.
          </p>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setFilter('pending')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filter === 'pending'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pending Review ({payments.filter(p => p.status === 'pending_verification').length})
          </button>
          <button
            onClick={() => setFilter('verified')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filter === 'verified'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Verified ({payments.filter(p => p.status === 'verified').length})
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filter === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Logs
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400 ml-2" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Filter by Order Number (e.g. ORD-20261026-005) or Transaction Reference..."
          className="w-full text-xs bg-transparent focus:outline-hidden text-slate-800 placeholder-slate-400"
        />
        {search && (
          <button onClick={() => setSearch('')} className="text-xs text-slate-400 hover:text-slate-600 mr-2">
            Clear
          </button>
        )}
      </div>

      {/* Verification Cards List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredPayments.map(payment => {
          const order = getAssociatedOrder(payment.orderId);
          const isPending = payment.status === 'pending_verification';

          return (
            <div
              key={payment.id}
              className={`bg-white rounded-2xl border p-5 shadow-xs transition-all ${
                isPending
                  ? 'border-amber-300 ring-2 ring-amber-500/10'
                  : 'border-slate-200'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                
                {/* Left Info */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm font-mono text-slate-900">
                      {payment.orderNumber}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                      payment.status === 'verified'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : payment.status === 'rejected'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200 animate-pulse'
                    }`}>
                      {payment.status === 'pending_verification' ? 'Awaiting Verification' : payment.status}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {formatDateTime(payment.createdAt)}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                    <span className="flex items-center gap-1 font-semibold text-slate-900">
                      {payment.paymentMethod === 'staff_credit' ? (
                        <Building2 className="w-3.5 h-3.5 text-blue-600" />
                      ) : (
                        <Smartphone className="w-3.5 h-3.5 text-amber-600" />
                      )}
                      {getPaymentMethodLabel(payment.paymentMethod)}
                    </span>

                    {payment.externalReference && (
                      <span className="font-mono text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                        Ref: {payment.externalReference}
                      </span>
                    )}

                    <span>
                      Recorded by: <strong className="text-slate-800">{payment.recordedByName}</strong>
                    </span>

                    {order?.ward && (
                      <span className="text-emerald-700 font-medium">
                        Location: {order.ward} {order.bedNumber ? `(${order.bedNumber})` : ''}
                      </span>
                    )}
                  </div>

                  {/* Verification Note if already verified */}
                  {payment.verifiedByName && (
                    <div className="text-[11px] text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg inline-block border border-emerald-100 mt-1">
                      Verified by: <strong>{payment.verifiedByName}</strong> on {formatDateTime(payment.paidAt)} · {payment.verificationNotes}
                    </div>
                  )}
                </div>

                {/* Right Amount & Actions */}
                <div className="flex items-center justify-between lg:justify-end gap-4 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Amount</span>
                    <span className="text-xl font-black text-slate-900 font-mono tabular-nums">
                      {formatUGX(payment.amount)}
                    </span>
                  </div>

                  {isPending && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setRejectingId(payment.id)}
                        className="px-3 py-2 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                      <button
                        onClick={() => setVerifyingId(payment.id)}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Verify & Approve</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* In-card Verification Modal */}
              {verifyingId === payment.id && (
                <div className="mt-4 p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-3">
                  <h5 className="font-bold text-xs text-emerald-900">
                    Confirm Verification for {payment.orderNumber} ({formatUGX(payment.amount)})
                  </h5>
                  <input
                    type="text"
                    value={verifyNotes}
                    onChange={e => setVerifyNotes(e.target.value)}
                    placeholder="Verification notes (e.g. SMS matched on merchant SIM / staff badge confirmed)"
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setVerifyingId(null)}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-white"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleConfirmVerification(payment.id)}
                      className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs"
                    >
                      Confirm Verified
                    </button>
                  </div>
                </div>
              )}

              {/* In-card Rejection Modal */}
              {rejectingId === payment.id && (
                <div className="mt-4 p-4 bg-rose-50/70 border border-rose-200 rounded-xl space-y-3">
                  <h5 className="font-bold text-xs text-rose-900">
                    Reject / Flag Payment for {payment.orderNumber}
                  </h5>
                  <input
                    type="text"
                    required
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    placeholder="Mandatory reason for rejection (e.g. Reference code not found in SMS log)"
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setRejectingId(null)}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-white"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleConfirmRejection(payment.id)}
                      disabled={!rejectReason.trim()}
                      className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-xs disabled:opacity-50"
                    >
                      Confirm Rejection
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filteredPayments.length === 0 && (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h4 className="font-bold text-base text-slate-900">Queue is Clear</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No pending non-cash payments requiring verification at this time.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
