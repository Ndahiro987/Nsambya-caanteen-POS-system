import React, { useMemo, useState } from 'react';
import { Order, Payment } from '../../types/pos';
import { formatUGX, formatDateTime, downloadCSV, getPaymentMethodLabel } from '../../utils/formatters';
import { 
  BarChart3, 
  Download, 
  TrendingUp, 
  CreditCard, 
  Building2, 
  PieChart, 
  Calendar,
  Layers
} from 'lucide-react';

interface ReportsViewProps {
  orders: Order[];
  payments: Payment[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({ orders, payments }) => {
  const [dateFilter, setDateFilter] = useState<'all' | 'today'>('all');

  const activeOrders = useMemo(() => {
    return orders.filter(o => o.status !== 'voided');
  }, [orders]);

  const verifiedPayments = useMemo(() => {
    return payments.filter(p => p.status === 'verified');
  }, [payments]);

  // Aggregate metrics
  const totalRevenue = useMemo(() => {
    return activeOrders.reduce((acc, curr) => acc + curr.total, 0);
  }, [activeOrders]);

  const avgTicket = activeOrders.length > 0 ? Math.round(totalRevenue / activeOrders.length) : 0;

  // Breakdown by payment method
  const methodStats = useMemo(() => {
    const stats: Record<string, { count: number; total: number }> = {
      cash: { count: 0, total: 0 },
      mtn_momo: { count: 0, total: 0 },
      airtel_money: { count: 0, total: 0 },
      staff_credit: { count: 0, total: 0 },
      card_pos: { count: 0, total: 0 }
    };

    verifiedPayments.forEach(p => {
      if (stats[p.paymentMethod]) {
        stats[p.paymentMethod].count += 1;
        stats[p.paymentMethod].total += p.amount;
      }
    });

    return stats;
  }, [verifiedPayments]);

  // Breakdown by hospital ward
  const wardStats = useMemo(() => {
    const map: Record<string, { count: number; total: number }> = {};
    activeOrders.forEach(o => {
      const w = o.ward || 'Main Canteen (Walk-in)';
      if (!map[w]) map[w] = { count: 0, total: 0 };
      map[w].count += 1;
      map[w].total += o.total;
    });
    return Object.entries(map).sort((a, b) => b[1].total - a[1].total);
  }, [activeOrders]);

  // Item popularity
  const itemPopularity = useMemo(() => {
    const map: Record<string, { qty: number; revenue: number }> = {};
    activeOrders.forEach(o => {
      o.items.forEach(i => {
        if (!map[i.itemNameSnapshot]) {
          map[i.itemNameSnapshot] = { qty: 0, revenue: 0 };
        }
        map[i.itemNameSnapshot].qty += i.quantity;
        map[i.itemNameSnapshot].revenue += i.lineTotal;
      });
    });
    return Object.entries(map).sort((a, b) => b[1].qty - a[1].qty);
  }, [activeOrders]);

  // CSV Export Action
  const handleExportCSV = () => {
    const headers = [
      'Order Number',
      'Created Date & Time',
      'Cashier Name',
      'Worker ID',
      'Hospital Ward / Destination',
      'Bed or Room Number',
      'Customer Name',
      'Customer Ref',
      'Items Count',
      'Payment Method',
      'Payment Ref',
      'Subtotal UGX',
      'Total UGX',
      'Order Status'
    ];

    const rows = orders.map(o => {
      const p = payments.find(pay => pay.orderId === o.id);
      return [
        o.orderNumber,
        formatDateTime(o.createdAt),
        o.workerNameSnapshot,
        o.workerIdSnapshot,
        o.ward || 'Main Canteen',
        o.bedNumber || '',
        o.customerName || '',
        o.customerReference || '',
        o.items.reduce((s, it) => s + it.quantity, 0),
        p ? getPaymentMethodLabel(p.paymentMethod) : 'Unpaid',
        p?.externalReference || '',
        o.subtotal,
        o.total,
        o.status
      ];
    });

    downloadCSV(`nsambya-canteen-sales-${new Date().toISOString().split('T')[0]}.csv`, [
      headers,
      ...rows
    ]);
  };

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
      
      {/* Header bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            <BarChart3 className="w-4 h-4 text-emerald-600" />
            <span>Executive Analytics & Hospital Reports</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 mt-1">Canteen Sales & Revenue Insights</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Key operational metrics, ward dining traffic, and accounting CSV export.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-2 transition-colors shadow-sm self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          <span>Export All Sales to CSV</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block mb-1">Total Settled Revenue</span>
          <span className="text-2xl font-black text-slate-900 font-mono tabular-nums">
            {formatUGX(totalRevenue)}
          </span>
          <span className="text-[11px] text-emerald-700 font-medium block mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Net sales (excl. voided)
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block mb-1">Total Orders Processed</span>
          <span className="text-2xl font-black text-slate-900 font-mono tabular-nums">
            {activeOrders.length}
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">
            {orders.filter(o => o.status === 'voided').length} voided/refunded
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block mb-1">Average Ticket Size</span>
          <span className="text-2xl font-black text-slate-900 font-mono tabular-nums">
            {formatUGX(avgTicket)}
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">Per transaction average</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block mb-1">Electronic Payment Ratio</span>
          <span className="text-2xl font-black text-slate-900 font-mono tabular-nums">
            {totalRevenue > 0
              ? `${Math.round(((totalRevenue - methodStats.cash.total) / totalRevenue) * 100)}%`
              : '0%'}
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">Mobile Money & Staff Credit</span>
        </div>
      </div>

      {/* Grid: Payment Breakdown + Ward Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: Payment Method Breakdown (6 cols) */}
        <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-sm text-slate-900">Revenue by Payment Channel</h3>
            </div>
            <span className="text-xs text-slate-400 font-mono font-bold">UGX</span>
          </div>

          <div className="space-y-3">
            {[
              { key: 'cash', label: 'Cash Payments', color: 'bg-emerald-600', text: 'text-emerald-700' },
              { key: 'mtn_momo', label: 'MTN Mobile Money', color: 'bg-amber-500', text: 'text-amber-800' },
              { key: 'airtel_money', label: 'Airtel Money', color: 'bg-rose-500', text: 'text-rose-800' },
              { key: 'staff_credit', label: 'Hospital Staff Payroll Deduction', color: 'bg-blue-600', text: 'text-blue-800' },
              { key: 'card_pos', label: 'Card POS Terminals', color: 'bg-purple-600', text: 'text-purple-800' }
            ].map(m => {
              const data = methodStats[m.key] || { count: 0, total: 0 };
              const percent = totalRevenue > 0 ? Math.round((data.total / totalRevenue) * 100) : 0;

              return (
                <div key={m.key} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-800">{m.label} ({data.count} txns)</span>
                    <span className="font-mono tabular-nums text-slate-900">{formatUGX(data.total)} ({percent}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className={`h-full ${m.color}`} style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Hospital Ward & Delivery Distribution (6 cols) */}
        <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-sm text-slate-900">Ward & Dining Destination Traffic</h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">Ranked</span>
          </div>

          <div className="space-y-2.5 max-h-72 overflow-y-auto">
            {wardStats.map(([wardName, data]) => {
              const pct = totalRevenue > 0 ? Math.round((data.total / totalRevenue) * 100) : 0;

              return (
                <div key={wardName} className="p-2.5 border border-slate-100 rounded-xl bg-slate-50/50 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 block">{wardName}</span>
                    <span className="text-[11px] text-slate-500">{data.count} orders delivered</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-slate-900 block tabular-nums">{formatUGX(data.total)}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{pct}% of revenue</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Top Performing Food & Beverage Dishes */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-slate-600" />
            <h3 className="font-bold text-sm text-slate-900">Top Selling Canteen Dishes & Beverages</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">By Volume Sold</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                <th className="py-2.5 px-3">Rank</th>
                <th className="py-2.5 px-3">Item Name</th>
                <th className="py-2.5 px-3 text-center">Portions Sold</th>
                <th className="py-2.5 px-3 text-right">Gross Revenue (UGX)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {itemPopularity.slice(0, 8).map(([name, stat], idx) => (
                <tr key={name} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-400">#{idx + 1}</td>
                  <td className="py-2.5 px-3 font-bold text-slate-900">{name}</td>
                  <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-800">{stat.qty}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">{formatUGX(stat.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
