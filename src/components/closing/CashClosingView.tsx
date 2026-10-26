import React, { useState, useMemo } from 'react';
import { CashClosing, Order, Payment, User } from '../../types/pos';
import { formatDateTime, formatUGX, formatUGXShort } from '../../utils/formatters';
import { 
  Calculator, 
  Banknote, 
  Coins, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Printer, 
  History,
  FileCheck
} from 'lucide-react';

interface CashClosingViewProps {
  orders: Order[];
  payments: Payment[];
  cashClosings: CashClosing[];
  currentUser: User;
  onSubmitClosing: (closingData: {
    closingDate: string;
    openingFloat: number;
    totalSales: number;
    totalCash: number;
    totalMobileMoney: number;
    totalOther: number;
    countedCash: number;
    variance: number;
    notes: string;
    denominationBreakdown: Record<string, number>;
  }) => void;
}

export const CashClosingView: React.FC<CashClosingViewProps> = ({
  orders,
  payments,
  cashClosings,
  currentUser,
  onSubmitClosing
}) => {
  const [openingFloat, setOpeningFloat] = useState<number>(150000); // Standard drawer float 150k
  const [closingNotes, setClosingNotes] = useState<string>('');
  const [selectedHistoricalClosing, setSelectedHistoricalClosing] = useState<CashClosing | null>(null);

  // Cash Denomination counters
  const [denominations, setDenominations] = useState<Record<string, number>>({
    '50000': 0,
    '20000': 0,
    '10000': 0,
    '5000': 0,
    '2000': 0,
    '1000': 0,
    '500': 0,
    '200': 0,
    '100': 0
  });

  // Calculate today's shift totals from active payments & orders
  const shiftMetrics = useMemo(() => {
    const verifiedPayments = payments.filter(p => p.status === 'verified');
    
    let totalCash = 0;
    let totalMtn = 0;
    let totalAirtel = 0;
    let totalStaff = 0;
    let totalCard = 0;

    verifiedPayments.forEach(p => {
      if (p.paymentMethod === 'cash') totalCash += p.amount;
      else if (p.paymentMethod === 'mtn_momo') totalMtn += p.amount;
      else if (p.paymentMethod === 'airtel_money') totalAirtel += p.amount;
      else if (p.paymentMethod === 'staff_credit') totalStaff += p.amount;
      else if (p.paymentMethod === 'card_pos') totalCard += p.amount;
    });

    const totalSales = totalCash + totalMtn + totalAirtel + totalStaff + totalCard;
    const totalMobileMoney = totalMtn + totalAirtel;
    const totalOther = totalStaff + totalCard;

    return {
      totalSales,
      totalCash,
      totalMtn,
      totalAirtel,
      totalMobileMoney,
      totalStaff,
      totalCard,
      totalOther
    };
  }, [payments]);

  // Compute total counted physical cash from denominations
  const totalCountedCash = useMemo(() => {
    return Object.entries(denominations).reduce((sum, [denom, count]) => {
      return sum + Number(denom) * (count || 0);
    }, 0);
  }, [denominations]);

  // Expected in drawer = Opening Float + Cash Sales
  const expectedTotalCashInDrawer = openingFloat + shiftMetrics.totalCash;
  const cashVariance = totalCountedCash - expectedTotalCashInDrawer;

  const handleDenominationChange = (denom: string, value: string) => {
    const count = Math.max(0, parseInt(value, 10) || 0);
    setDenominations(prev => ({
      ...prev,
      [denom]: count
    }));
  };

  const handleResetCounts = () => {
    setDenominations({
      '50000': 0,
      '20000': 0,
      '10000': 0,
      '5000': 0,
      '2000': 0,
      '1000': 0,
      '500': 0,
      '200': 0,
      '100': 0
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cashVariance !== 0 && !closingNotes.trim()) {
      alert('A written explanation note is mandatory when physical cash has a variance (surplus or shortage).');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    onSubmitClosing({
      closingDate: todayStr,
      openingFloat,
      totalSales: shiftMetrics.totalSales,
      totalCash: shiftMetrics.totalCash,
      totalMobileMoney: shiftMetrics.totalMobileMoney,
      totalOther: shiftMetrics.totalOther,
      countedCash: totalCountedCash,
      variance: cashVariance,
      notes: closingNotes.trim() || 'Daily shift balanced and locked into hospital safe.',
      denominationBreakdown: denominations
    });

    setClosingNotes('');
    alert('Shift Cash Closing (Z-Report) successfully saved and committed to permanent audit history.');
  };

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
      
      {/* Page Title */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            <Calculator className="w-4 h-4 text-emerald-600" />
            <span>Shift Handover & End-of-Day Reconciliation</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 mt-1">Cash Closing & Z-Report Terminal</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit physical drawer banknotes against POS electronic sales logs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right text-xs">
            <span className="text-slate-400 block font-medium">Reconciling Officer</span>
            <span className="font-bold text-slate-900">{currentUser.fullName} ({currentUser.workerId})</span>
          </div>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block mb-1">Total Gross Sales Today</span>
          <span className="text-2xl font-black text-slate-900 font-mono tabular-nums">
            {formatUGX(shiftMetrics.totalSales)}
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">Across all verified payment channels</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/30 shadow-xs">
          <span className="text-xs font-semibold text-emerald-800 block mb-1">Expected Physical Cash Sales</span>
          <span className="text-2xl font-black text-emerald-700 font-mono tabular-nums">
            {formatUGX(shiftMetrics.totalCash)}
          </span>
          <span className="text-[11px] text-emerald-600 block mt-1">+ Opening float ({formatUGX(openingFloat)})</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200 bg-amber-50/30 shadow-xs">
          <span className="text-xs font-semibold text-amber-800 block mb-1">Mobile Money (MTN & Airtel)</span>
          <span className="text-2xl font-black text-amber-700 font-mono tabular-nums">
            {formatUGX(shiftMetrics.totalMobileMoney)}
          </span>
          <span className="text-[11px] text-amber-600 block mt-1">MTN: {formatUGXShort(shiftMetrics.totalMtn)} · Airtel: {formatUGXShort(shiftMetrics.totalAirtel)}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-blue-200 bg-blue-50/30 shadow-xs">
          <span className="text-xs font-semibold text-blue-800 block mb-1">Staff Credit / Payroll Deductions</span>
          <span className="text-2xl font-black text-blue-700 font-mono tabular-nums">
            {formatUGX(shiftMetrics.totalStaff)}
          </span>
          <span className="text-[11px] text-blue-600 block mt-1">Hospital staff monthly charge-backs</span>
        </div>
      </div>

      {/* Main Closing Form Grid */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: Physical Denomination Count (7 cols) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2">
              <Banknote className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-sm text-slate-900">Physical Cash Denomination Count</h3>
            </div>
            <button
              type="button"
              onClick={handleResetCounts}
              className="text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition-colors"
            >
              Reset Counts
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs pb-1 text-slate-500 font-semibold uppercase">
              <span>Denomination</span>
              <span>Pieces Count</span>
              <span className="text-right">Subtotal UGX</span>
            </div>

            {/* Banknotes */}
            {[
              { label: 'UGX 50,000 Note', value: '50000', color: 'text-amber-700' },
              { label: 'UGX 20,000 Note', value: '20000', color: 'text-red-700' },
              { label: 'UGX 10,000 Note', value: '10000', color: 'text-purple-700' },
              { label: 'UGX 5,000 Note', value: '5000', color: 'text-emerald-700' },
              { label: 'UGX 2,000 Note', value: '2000', color: 'text-blue-700' },
              { label: 'UGX 1,000 Note', value: '1000', color: 'text-yellow-700' },
              { label: 'UGX 500 Coin', value: '500', color: 'text-slate-600' },
              { label: 'UGX 200 Coin', value: '200', color: 'text-slate-600' },
              { label: 'UGX 100 Coin', value: '100', color: 'text-slate-600' }
            ].map(d => {
              const count = denominations[d.value] || 0;
              const sub = Number(d.value) * count;

              return (
                <div key={d.value} className="flex items-center justify-between gap-3 text-xs py-1">
                  <span className={`font-bold font-mono w-36 ${d.color}`}>{d.label}</span>
                  <div className="flex items-center gap-1.5 w-32">
                    <input
                      type="number"
                      min="0"
                      value={count || ''}
                      onChange={e => handleDenominationChange(d.value, e.target.value)}
                      placeholder="0"
                      className="w-full text-center py-1 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:bg-white"
                    />
                  </div>
                  <span className="w-28 text-right font-mono font-bold tabular-nums text-slate-800">
                    {formatUGX(sub)}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-sm font-extrabold text-slate-900">
            <span>Total Physical Cash Counted:</span>
            <span className="font-mono text-lg text-emerald-700 tabular-nums">
              {formatUGX(totalCountedCash)}
            </span>
          </div>
        </div>

        {/* Right: Variance & Official Settlement (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b pb-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-sm text-slate-900">Reconciliation Audit Summary</h3>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span>Morning Cash Opening Float:</span>
                <input
                  type="number"
                  value={openingFloat}
                  onChange={e => setOpeningFloat(Number(e.target.value))}
                  className="w-28 text-right font-mono font-bold px-2 py-0.5 border border-slate-300 rounded-md bg-slate-50"
                />
              </div>
              <div className="flex justify-between text-slate-600">
                <span>+ Cash Sales Collected:</span>
                <span className="font-mono font-bold text-slate-800 tabular-nums">
                  {formatUGX(shiftMetrics.totalCash)}
                </span>
              </div>
              <div className="flex justify-between text-slate-800 font-bold border-t pt-1.5">
                <span>= Total Expected in Drawer:</span>
                <span className="font-mono text-slate-950 tabular-nums">
                  {formatUGX(expectedTotalCashInDrawer)}
                </span>
              </div>
              <div className="flex justify-between text-slate-800 font-bold">
                <span>- Physical Cash Counted:</span>
                <span className="font-mono text-emerald-700 tabular-nums">
                  {formatUGX(totalCountedCash)}
                </span>
              </div>

              {/* Variance Highlight Box */}
              <div className={`p-3.5 rounded-xl border flex items-center justify-between mt-3 ${
                cashVariance === 0
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : cashVariance > 0
                  ? 'bg-blue-50 border-blue-200 text-blue-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}>
                <div>
                  <span className="font-bold text-xs block">
                    {cashVariance === 0 ? 'Cash Reconciled (Balanced)' : cashVariance > 0 ? 'Surplus Cash Detected' : 'Cash Shortage Detected'}
                  </span>
                  <span className="text-[10px] opacity-80">
                    {cashVariance === 0 ? 'Physical matches ledger exactly' : 'Requires explanatory remark'}
                  </span>
                </div>
                <span className="font-mono font-black text-base tabular-nums">
                  {cashVariance > 0 ? `+${formatUGX(cashVariance)}` : formatUGX(cashVariance)}
                </span>
              </div>
            </div>

            {/* Closing Explanatory Notes */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Closing Remarks / Safe Deposit Details {cashVariance !== 0 && <span className="text-rose-600">*</span>}
              </label>
              <textarea
                rows={3}
                required={cashVariance !== 0}
                value={closingNotes}
                onChange={e => setClosingNotes(e.target.value)}
                placeholder={cashVariance !== 0 ? "Mandatory: explain reason for surplus or shortage..." : "e.g. All banknotes verified, packed in pouch #402 for banking."}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <FileCheck className="w-4 h-4 text-emerald-400" />
              <span>Save & Sign Official Z-Report</span>
            </button>
          </div>
        </div>
      </form>

      {/* Historical Shift Closings Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-slate-500" />
            <h3 className="font-bold text-sm text-slate-900">Historical Daily Closings & Z-Reports</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">{cashClosings.length} Saved Closings</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Supervisor</th>
                <th className="py-2.5 px-3 text-right">Total Sales</th>
                <th className="py-2.5 px-3 text-right">Cash Counted</th>
                <th className="py-2.5 px-3 text-right">Mobile Money</th>
                <th className="py-2.5 px-3 text-center">Variance</th>
                <th className="py-2.5 px-3">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cashClosings.map(c => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{c.closingDate}</td>
                  <td className="py-2.5 px-3 text-slate-700">{c.closedByName}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold">{formatUGX(c.totalSales)}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-emerald-700 font-bold">{formatUGX(c.countedCash)}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-amber-700">{formatUGX(c.totalMobileMoney)}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      c.variance === 0
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                      {c.variance === 0 ? 'Balanced' : formatUGX(c.variance)}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 text-[11px] truncate max-w-xs">{c.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
