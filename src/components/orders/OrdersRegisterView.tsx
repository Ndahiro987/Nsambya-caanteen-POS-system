import React, { useState } from 'react';
import { Order, Payment, Receipt, User } from '../../types/pos';
import { formatDateTime, formatUGX, getOrderStatusBadge, getPaymentMethodLabel } from '../../utils/formatters';
import { 
  Search, 
  Receipt as ReceiptIcon, 
  RotateCcw, 
  Eye, 
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';

interface OrdersRegisterViewProps {
  orders: Order[];
  payments: Payment[];
  receipts: Receipt[];
  currentUser: User;
  onViewReceipt: (order: Order) => void;
  onSaleCorrection: (correction: {
    orderId: string;
    orderNumber: string;
    type: 'full_refund' | 'partial_refund' | 'void';
    amount: number;
    reason: string;
  }) => void;
}

export const OrdersRegisterView: React.FC<OrdersRegisterViewProps> = ({
  orders,
  payments,
  receipts,
  currentUser,
  onViewReceipt,
  onSaleCorrection
}) => {
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Void / Correction modal state
  const [correctingOrder, setCorrectingOrder] = useState<Order | null>(null);
  const [correctionReason, setCorrectionReason] = useState<string>('');
  const [correctionType, setCorrectionType] = useState<'full_refund' | 'partial_refund' | 'void'>('full_refund');

  const isWorker = currentUser.role === 0;

  // If worker, only show orders they took themselves!
  const permittedOrders = isWorker
    ? orders.filter(o => o.createdByUserId === currentUser.id)
    : orders;

  const filteredOrders = permittedOrders.filter(o => {
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchNum = o.orderNumber.toLowerCase().includes(q);
      const matchCust = o.customerName?.toLowerCase().includes(q);
      const matchWard = o.ward?.toLowerCase().includes(q);
      const matchWorker = o.workerNameSnapshot.toLowerCase().includes(q);
      if (!matchNum && !matchCust && !matchWard && !matchWorker) return false;
    }
    return true;
  });

  const getOrderPayment = (orderId: string) => {
    return payments.find(p => p.orderId === orderId);
  };

  const getOrderReceipt = (orderId: string) => {
    return receipts.find(r => r.orderId === orderId);
  };

  const handleConfirmCorrection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctingOrder || !correctionReason.trim()) return;

    onSaleCorrection({
      orderId: correctingOrder.id,
      orderNumber: correctingOrder.orderNumber,
      type: correctionType,
      amount: correctingOrder.total,
      reason: correctionReason.trim()
    });

    setCorrectingOrder(null);
    setCorrectionReason('');
  };

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
      
      {/* Header bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>{isWorker ? 'My Shift Transaction Register' : 'Hospital Sales Register & History'}</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 mt-1">
            {isWorker ? 'My Completed & Pending Sales' : 'Orders & Transaction Records'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isWorker
              ? `Logged as Cashier ${currentUser.fullName} (${currentUser.workerId}). Showing your shift sales only.`
              : 'Real-time electronic register with immutable audit trail and receipt reprinting.'}
          </p>
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              statusFilter === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({permittedOrders.length})
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              statusFilter === 'completed'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Completed ({permittedOrders.filter(o => o.status === 'completed').length})
          </button>
          <button
            onClick={() => setStatusFilter('pending_verification')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              statusFilter === 'pending_verification'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pending ({permittedOrders.filter(o => o.status === 'pending_verification').length})
          </button>
          <button
            onClick={() => setStatusFilter('voided')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              statusFilter === 'voided'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Voided ({permittedOrders.filter(o => o.status === 'voided').length})
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
          placeholder="Search by Order #, Patient, Doctor, Ward or Cashier name..."
          className="w-full text-xs bg-transparent focus:outline-hidden text-slate-800 placeholder-slate-400"
        />
        {search && (
          <button onClick={() => setSearch('')} className="text-xs text-slate-400 hover:text-slate-600 mr-2">
            Clear
          </button>
        )}
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Order #</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Location / Ward</th>
                <th className="py-3 px-4">Cashier</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4 text-right">Total (UGX)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredOrders.map(order => {
                const payment = getOrderPayment(order.id);
                const receipt = getOrderReceipt(order.id);
                const badge = getOrderStatusBadge(order.status);

                return (
                  <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Order # */}
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {order.orderNumber}
                      {receipt && receipt.reprintCount > 0 && (
                        <span className="block text-[9px] text-amber-700 font-sans font-medium">
                          Reprinted {receipt.reprintCount}x
                        </span>
                      )}
                    </td>

                    {/* Date */}
                    <td className="py-3 px-4 text-slate-600 font-mono">
                      {formatDateTime(order.createdAt)}
                    </td>

                    {/* Ward & Delivery */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 truncate max-w-[180px]">
                        {order.ward || 'Main Canteen'}
                      </div>
                      {(order.bedNumber || order.customerName) && (
                        <div className="text-[11px] text-slate-500 truncate max-w-[180px]">
                          {order.bedNumber} {order.customerName ? `· ${order.customerName}` : ''}
                        </div>
                      )}
                    </td>

                    {/* Cashier */}
                    <td className="py-3 px-4 text-slate-700">
                      {order.workerNameSnapshot}
                      <span className="text-[10px] text-slate-400 font-mono block">
                        {order.workerIdSnapshot}
                      </span>
                    </td>

                    {/* Payment Method */}
                    <td className="py-3 px-4">
                      {payment ? (
                        <div>
                          <span className="font-medium text-slate-900">
                            {getPaymentMethodLabel(payment.paymentMethod)}
                          </span>
                          {payment.externalReference && (
                            <span className="text-[10px] text-slate-500 font-mono block truncate max-w-[140px]">
                              {payment.externalReference}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">None</span>
                      )}
                    </td>

                    {/* Total */}
                    <td className="py-3 px-4 text-right font-black font-mono tabular-nums text-slate-900">
                      {formatUGX(order.total)}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg} ${badge.text}`}>
                        {badge.label}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          title="View order details"
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onViewReceipt(order)}
                          title="View & Print Thermal Receipt"
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700 flex items-center gap-1 transition-colors"
                        >
                          <ReceiptIcon className="w-3.5 h-3.5" />
                          <span>Receipt</span>
                        </button>

                        {/* Supervisor / Admin Void / Correction (Cashiers cannot void!) */}
                        {currentUser.role >= 1 && order.status !== 'voided' && (
                          <button
                            onClick={() => {
                              setCorrectingOrder(order);
                              setCorrectionReason('');
                            }}
                            title="Supervisor Sale Correction / Refund"
                            className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    {isWorker ? 'No sales recorded on your shift yet.' : 'No orders found matching the filter criteria.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Inspector Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-slate-400">ORDER INSPECTOR</span>
                <h3 className="font-extrabold text-lg text-slate-900">{selectedOrder.orderNumber}</h3>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 block font-medium">Location</span>
                <span className="font-bold text-slate-900">{selectedOrder.ward || 'Main Canteen'}</span>
                {selectedOrder.bedNumber && <span className="block text-slate-600">{selectedOrder.bedNumber}</span>}
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Customer / Recipient</span>
                <span className="font-bold text-slate-900">{selectedOrder.customerName || 'Walk-in'}</span>
                {selectedOrder.customerReference && <span className="block text-slate-600">{selectedOrder.customerReference}</span>}
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Billed By</span>
                <span className="font-bold text-slate-900">{selectedOrder.workerNameSnapshot} ({selectedOrder.workerIdSnapshot})</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Created Time</span>
                <span className="font-mono text-slate-900">{formatDateTime(selectedOrder.createdAt)}</span>
              </div>
            </div>

            {/* Items list */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">
                Itemized Breakdown
              </label>
              <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-48 overflow-y-auto">
                {selectedOrder.items.map((it, idx) => (
                  <div key={idx} className="p-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900">{it.quantity}x {it.itemNameSnapshot}</span>
                      <span className="text-slate-400 text-[11px] block font-mono">@ {formatUGX(it.unitPriceSnapshot)}</span>
                    </div>
                    <span className="font-black font-mono tabular-nums text-slate-900">{formatUGX(it.lineTotal)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between text-base font-extrabold text-slate-900 border-t">
              <span>Total Amount:</span>
              <span className="font-mono text-emerald-700">{formatUGX(selectedOrder.total)}</span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  onViewReceipt(selectedOrder);
                  setSelectedOrder(null);
                }}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5"
              >
                <ReceiptIcon className="w-3.5 h-3.5" />
                <span>Open Thermal Receipt</span>
              </button>
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 font-semibold text-xs text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Supervisor Sale Correction / Void Modal */}
      {correctingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-rose-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <div className="text-xs font-bold text-rose-600 uppercase tracking-wider flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>Supervisor Sale Correction</span>
                </div>
                <h3 className="font-extrabold text-lg text-slate-900">{correctingOrder.orderNumber}</h3>
              </div>
              <button onClick={() => setCorrectingOrder(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleConfirmCorrection} className="space-y-4 text-xs">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900">
                You are performing a supervisor sale correction on <strong>{formatUGX(correctingOrder.total)}</strong>.
                Original order will remain in the audit register tagged as VOIDED.
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Correction Type</label>
                <select
                  value={correctionType}
                  onChange={e => setCorrectionType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold"
                >
                  <option value="full_refund">Full Refund (Customer Returned Meal)</option>
                  <option value="void">Voided Sale (Keyed in Error / Duplicate)</option>
                  <option value="partial_refund">Partial Item Adjustment</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Mandatory Operational Justification <span className="text-rose-600">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={correctionReason}
                  onChange={e => setCorrectionReason(e.target.value)}
                  placeholder="e.g., Doctor was called to emergency theatre before order delivery; meal returned to kitchen."
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="text-[11px] text-slate-500">
                Authorized by: <strong>{currentUser.fullName} ({currentUser.workerId})</strong>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setCorrectingOrder(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!correctionReason.trim()}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold disabled:opacity-50"
                >
                  Confirm Void & Refund
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
