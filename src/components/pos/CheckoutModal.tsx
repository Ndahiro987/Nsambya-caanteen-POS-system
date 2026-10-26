import React, { useState } from 'react';
import { PaymentMethod, User } from '../../types/pos';
import { formatUGX, formatUGXShort } from '../../utils/formatters';
import { Banknote, Smartphone, CreditCard, Building2, Check, X, AlertCircle } from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  total: number;
  subtotal: number;
  ward?: string;
  bedNumber?: string;
  customerName?: string;
  currentUser: User;
  onConfirmPayment: (paymentDetails: {
    method: PaymentMethod;
    amountReceived: number;
    changeDue: number;
    externalReference: string;
    verificationNotes?: string;
  }) => void;
  onClose: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  total,
  ward,
  bedNumber,
  customerName,
  currentUser,
  onConfirmPayment,
  onClose
}) => {
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [cashTendered, setCashTendered] = useState<number>(total);
  const [momoPhone, setMomoPhone] = useState<string>('');
  const [momoRef, setMomoRef] = useState<string>('');
  const [staffId, setStaffId] = useState<string>('');
  const [staffDept, setStaffDept] = useState<string>('');
  const [cardAuth, setCardAuth] = useState<string>('');
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const changeDue = Math.max(0, cashTendered - total);
  const isCashInsufficient = method === 'cash' && cashTendered < total;

  // Common Ugandan cash denominations
  const denominations = [2000, 5000, 10000, 20000, 50000, 100000];

  const handleQuickCash = (amount: number) => {
    setCashTendered(amount);
    setError('');
  };

  const handleAddDenomination = (amount: number) => {
    setCashTendered(prev => prev + amount);
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (method === 'cash') {
      if (cashTendered < total) {
        setError(`Insufficient cash. Order total is ${formatUGX(total)}.`);
        return;
      }
      onConfirmPayment({
        method: 'cash',
        amountReceived: cashTendered,
        changeDue,
        externalReference: `CASH-TENDER-${cashTendered}`
      });
    } else if (method === 'mtn_momo') {
      if (!momoRef.trim()) {
        setError('Please enter the MTN Mobile Money Transaction Reference ID.');
        return;
      }
      onConfirmPayment({
        method: 'mtn_momo',
        amountReceived: total,
        changeDue: 0,
        externalReference: `MTN-MOMO: ${momoRef.trim()}${momoPhone ? ` (${momoPhone})` : ''}`,
        verificationNotes: `Recorded by ${currentUser.fullName} (${currentUser.workerId})`
      });
    } else if (method === 'airtel_money') {
      if (!momoRef.trim()) {
        setError('Please enter the Airtel Money Transaction Reference ID.');
        return;
      }
      onConfirmPayment({
        method: 'airtel_money',
        amountReceived: total,
        changeDue: 0,
        externalReference: `AIRTEL-MOMO: ${momoRef.trim()}${momoPhone ? ` (${momoPhone})` : ''}`,
        verificationNotes: `Recorded by ${currentUser.fullName} (${currentUser.workerId})`
      });
    } else if (method === 'staff_credit') {
      if (!staffId.trim()) {
        setError('Please enter Hospital Staff Badge / Payroll ID.');
        return;
      }
      onConfirmPayment({
        method: 'staff_credit',
        amountReceived: total,
        changeDue: 0,
        externalReference: `STAFF-PAYROLL: ${staffId.trim()}${staffDept ? ` [${staffDept}]` : ''}`,
        verificationNotes: `Staff payroll deduction authorized by ${currentUser.fullName}`
      });
    } else if (method === 'card_pos') {
      if (!cardAuth.trim()) {
        setError('Please enter the Card POS Terminal Authorization Code.');
        return;
      }
      onConfirmPayment({
        method: 'card_pos',
        amountReceived: total,
        changeDue: 0,
        externalReference: `CARD-AUTH: ${cardAuth.trim()}`
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-emerald-400 font-semibold">Payment Terminal</div>
            <h3 className="font-bold text-lg text-white">Complete Sale & Issue Receipt</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Order Summary Strip */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 block">Total Due (UGX)</span>
            <span className="text-2xl font-black text-slate-900 font-mono tabular-nums">{formatUGX(total)}</span>
          </div>
          <div className="text-right text-xs text-slate-600">
            {ward && <div className="font-semibold text-slate-900">{ward}</div>}
            {bedNumber && <div>{bedNumber}</div>}
            {customerName && <div className="text-slate-500 italic">{customerName}</div>}
          </div>
        </div>

        {/* Payment Method Tabs */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2 block">
              Select Payment Method
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => { setMethod('cash'); setError(''); }}
                className={`p-3 rounded-xl border text-center transition-all ${
                  method === 'cash'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Banknote className="w-5 h-5 mx-auto mb-1 text-emerald-600" />
                <span className="text-xs block">Cash UGX</span>
              </button>

              <button
                type="button"
                onClick={() => { setMethod('mtn_momo'); setError(''); }}
                className={`p-3 rounded-xl border text-center transition-all ${
                  method === 'mtn_momo'
                    ? 'border-amber-500 bg-amber-50 text-amber-900 font-bold ring-2 ring-amber-500/20'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Smartphone className="w-5 h-5 mx-auto mb-1 text-amber-600" />
                <span className="text-xs block">MTN MoMo</span>
              </button>

              <button
                type="button"
                onClick={() => { setMethod('airtel_money'); setError(''); }}
                className={`p-3 rounded-xl border text-center transition-all ${
                  method === 'airtel_money'
                    ? 'border-rose-600 bg-rose-50 text-rose-900 font-bold ring-2 ring-rose-500/20'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Smartphone className="w-5 h-5 mx-auto mb-1 text-rose-600" />
                <span className="text-xs block">Airtel Money</span>
              </button>

              <button
                type="button"
                onClick={() => { setMethod('staff_credit'); setError(''); }}
                className={`p-3 rounded-xl border text-center transition-all ${
                  method === 'staff_credit'
                    ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Building2 className="w-5 h-5 mx-auto mb-1 text-blue-600" />
                <span className="text-xs block">Staff Payroll</span>
              </button>
            </div>
          </div>

          {/* CASH MODE */}
          {method === 'cash' && (
            <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">Cash Tendered by Customer:</span>
                <button
                  type="button"
                  onClick={() => handleQuickCash(total)}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-100/60 px-2.5 py-1 rounded-md"
                >
                  Exact ({formatUGXShort(total)})
                </button>
              </div>

              {/* Amount Tendered Input */}
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-sm font-bold text-slate-400 font-mono">UGX</span>
                <input
                  type="number"
                  step="500"
                  value={cashTendered || ''}
                  onChange={e => setCashTendered(Number(e.target.value))}
                  className="w-full pl-14 pr-4 py-2 text-xl font-bold font-mono tabular-nums bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="0"
                />
              </div>

              {/* Banknote chips */}
              <div>
                <span className="text-[11px] text-slate-500 mb-1.5 block">Quick Banknote Buttons:</span>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                  {denominations.map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => handleQuickCash(d)}
                      className={`px-2 py-1.5 text-xs font-bold rounded-lg border transition-colors font-mono ${
                        cashTendered === d
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {d >= 1000 ? `${d / 1000}k` : d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Change due summary */}
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">Change Due:</span>
                <span className={`text-xl font-extrabold font-mono tabular-nums ${
                  changeDue > 0 ? 'text-emerald-600' : 'text-slate-900'
                }`}>
                  {formatUGX(changeDue)}
                </span>
              </div>
            </div>
          )}

          {/* MTN MOMO MODE */}
          {method === 'mtn_momo' && (
            <div className="space-y-3 bg-amber-50/60 p-4 rounded-xl border border-amber-200">
              <div className="flex items-center gap-2 text-amber-800 text-xs font-semibold">
                <Smartphone className="w-4 h-4 text-amber-600" />
                <span>MTN Mobile Money Merchant Pay: Dial *165*3# or Merchant ID</span>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">
                  Customer Phone Number (Optional)
                </label>
                <input
                  type="text"
                  value={momoPhone}
                  onChange={e => setMomoPhone(e.target.value)}
                  placeholder="077x xxx xxx or 078x xxx xxx"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">
                  MTN Transaction ID / Reference Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={momoRef}
                  onChange={e => setMomoRef(e.target.value)}
                  placeholder="e.g. MM-98214022"
                  className="w-full px-3 py-2 text-sm font-mono bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Verify confirmation SMS on terminal before completing sale.
                </span>
              </div>
            </div>
          )}

          {/* AIRTEL MONEY MODE */}
          {method === 'airtel_money' && (
            <div className="space-y-3 bg-rose-50/60 p-4 rounded-xl border border-rose-200">
              <div className="flex items-center gap-2 text-rose-800 text-xs font-semibold">
                <Smartphone className="w-4 h-4 text-rose-600" />
                <span>Airtel Money Merchant Pay: Dial *185*9#</span>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">
                  Customer Airtel Phone (Optional)
                </label>
                <input
                  type="text"
                  value={momoPhone}
                  onChange={e => setMomoPhone(e.target.value)}
                  placeholder="070x xxx xxx or 075x xxx xxx"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">
                  Airtel Transaction ID / Reference Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={momoRef}
                  onChange={e => setMomoRef(e.target.value)}
                  placeholder="e.g. AIR-84910234"
                  className="w-full px-3 py-2 text-sm font-mono bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>
          )}

          {/* STAFF CREDIT / PAYROLL DEDUCTION */}
          {method === 'staff_credit' && (
            <div className="space-y-3 bg-blue-50/60 p-4 rounded-xl border border-blue-200">
              <div className="flex items-center gap-2 text-blue-900 text-xs font-semibold">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>Hospital Staff Monthly Payroll Dining Credit</span>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">
                  Hospital Worker Badge ID <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={staffId}
                  onChange={e => setStaffId(e.target.value)}
                  placeholder="e.g. STAFF-MD-412 or NURSE-089"
                  className="w-full px-3 py-2 text-sm font-mono bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">
                  Hospital Department / Ward Unit
                </label>
                <input
                  type="text"
                  value={staffDept}
                  onChange={e => setStaffDept(e.target.value)}
                  placeholder="e.g. Surgery, Obstetrics, Pediatrics, Pharmacy"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* CARD POS */}
          {method === 'card_pos' && (
            <div className="space-y-3 bg-purple-50/60 p-4 rounded-xl border border-purple-200">
              <div className="flex items-center gap-2 text-purple-900 text-xs font-semibold">
                <CreditCard className="w-4 h-4 text-purple-600" />
                <span>Stanbic / Centenary / Absa POS Terminal</span>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">
                  Terminal Authorization Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={cardAuth}
                  onChange={e => setCardAuth(e.target.value)}
                  placeholder="e.g. AUTH-782103"
                  className="w-full px-3 py-2 text-sm font-mono bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          )}

          {/* Error notice */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCashInsufficient}
              className={`px-6 py-2.5 rounded-xl font-bold text-xs text-white flex items-center gap-2 transition-all shadow-md ${
                isCashInsufficient
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-500 active:scale-95'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>Complete Sale ({formatUGXShort(total)})</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
