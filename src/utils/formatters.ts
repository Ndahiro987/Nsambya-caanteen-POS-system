import { PaymentMethod, UserRole, OrderStatus } from '../types/pos';

export function formatUGX(amount: number): string {
  const rounded = Math.round(amount || 0);
  return `UGX ${rounded.toLocaleString('en-US')}`;
}

export function formatUGXShort(amount: number): string {
  const rounded = Math.round(amount || 0);
  return `${rounded.toLocaleString('en-US')} /=`;
}

export function formatDateTime(isoString?: string): string {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    return d.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch {
    return isoString;
  }
}

export function formatTimeOnly(isoString?: string): string {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return isoString;
  }
}

export function getPaymentMethodLabel(method: PaymentMethod): string {
  switch (method) {
    case 'cash':
      return 'Cash';
    case 'mtn_momo':
      return 'MTN Mobile Money';
    case 'airtel_money':
      return 'Airtel Money';
    case 'staff_credit':
      return 'Staff Payroll Deduction';
    case 'card_pos':
      return 'Card (Visa / Mastercard)';
    default:
      return method;
  }
}

export function getRoleName(role: UserRole): string {
  switch (role) {
    case 0:
      return 'Cashier / Worker';
    case 1:
      return 'Supervisor';
    case 2:
      return 'Administrator';
    default:
      return 'Staff';
  }
}

export function getOrderStatusBadge(status: OrderStatus): { label: string; bg: string; text: string } {
  switch (status) {
    case 'completed':
      return { label: 'Completed', bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700' };
    case 'pending_verification':
      return { label: 'Pending Verification', bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700' };
    case 'voided':
      return { label: 'Voided / Refunded', bg: 'bg-rose-50 border-rose-200', text: 'text-rose-700' };
    default:
      return { label: status, bg: 'bg-slate-50 border-slate-200', text: 'text-slate-700' };
  }
}

export function generateOrderNumber(existingCount: number): string {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const num = String(existingCount + 1).padStart(3, '0');
  return `ORD-${yyyy}${mm}${dd}-${num}`;
}

export function generateReceiptNumber(existingCount: number): string {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const num = String(existingCount + 1).padStart(4, '0');
  return `REC-${yyyy}${mm}${dd}-${num}`;
}

export function downloadCSV(filename: string, rows: (string | number)[][]): void {
  const processRow = (row: (string | number)[]) => {
    return row
      .map(val => {
        const text = String(val ?? '').replace(/"/g, '""');
        return `"${text}"`;
      })
      .join(',');
  };

  const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(processRow).join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
