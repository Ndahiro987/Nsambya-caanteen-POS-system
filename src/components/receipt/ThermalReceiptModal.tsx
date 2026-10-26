import React from 'react';
import { Order, Payment, Receipt } from '../../types/pos';
import { formatDateTime, formatUGX, getPaymentMethodLabel } from '../../utils/formatters';
import { Printer, Copy, Check, X, ShieldAlert, Award } from 'lucide-react';

interface ThermalReceiptModalProps {
  isOpen: boolean;
  order: Order | null;
  payment?: Payment | null;
  receipt?: Receipt | null;
  onReprint?: (receiptId: string) => void;
  onClose: () => void;
}

export const ThermalReceiptModal: React.FC<ThermalReceiptModalProps> = ({
  isOpen,
  order,
  payment,
  receipt,
  onReprint,
  onClose
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen || !order) return null;

  const handlePrint = () => {
    if (receipt && onReprint) {
      onReprint(receipt.id);
    }
    window.print();
  };

  const handleCopyText = () => {
    const lines = [
      '=======================================',
      '     ST. FRANCIS HOSPITAL NSAMBYA',
      '     CANTEEN & CATERING SERVICES',
      '    Ggaba Road, Nsambya, Kampala',
      '     Tel: +256 414 267011 / 267012',
      '         TIN: 1000294812-KLA',
      '=======================================',
      `RECEIPT NO: ${receipt?.receiptNumber || 'REC-PENDING'}`,
      `ORDER NO  : ${order.orderNumber}`,
      `DATE/TIME : ${formatDateTime(order.completedAt || order.createdAt)}`,
      `CASHIER   : ${order.workerNameSnapshot} (${order.workerIdSnapshot})`,
      order.ward ? `LOCATION  : ${order.ward}` : '',
      order.bedNumber ? `BED / RM  : ${order.bedNumber}` : '',
      order.customerName ? `CUSTOMER  : ${order.customerName}` : '',
      '---------------------------------------',
      'QTY  ITEM                     TOTAL',
      '---------------------------------------',
      ...order.items.map(
        i => `${i.quantity}x   ${i.itemNameSnapshot.padEnd(24).slice(0, 24)} ${formatUGX(i.lineTotal)}`
      ),
      '---------------------------------------',
      `SUBTOTAL: ${formatUGX(order.subtotal)}`,
      `VAT (0% Exempt Healthcare Dining): UGX 0`,
      `TOTAL AMOUNT DUE: ${formatUGX(order.total)}`,
      '---------------------------------------',
      payment ? `PAYMENT METHOD: ${getPaymentMethodLabel(payment.paymentMethod)}` : '',
      payment ? `AMOUNT TENDERED: ${formatUGX(payment.amountReceived)}` : '',
      payment && payment.changeDue > 0 ? `CHANGE GIVEN: ${formatUGX(payment.changeDue)}` : '',
      payment?.externalReference ? `REFERENCE CODE: ${payment.externalReference}` : '',
      '=======================================',
      '   Quick recovery & excellent health!',
      '    Thank you for dining with us.',
      '======================================='
    ].filter(Boolean).join('\n');

    navigator.clipboard.writeText(lines);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Top Control Bar */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-sm tracking-wide">Official Thermal Receipt</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyText}
              className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5 transition-colors"
              title="Copy receipt as plain text"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition-colors shadow-xs"
              title="Print on standard 80mm / 58mm thermal printer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Thermal Receipt Canvas */}
        <div className="p-6 bg-slate-100 flex justify-center max-h-[75vh] overflow-y-auto">
          <div
            id="thermal-receipt-print-area"
            className="w-[78mm] bg-white p-4 shadow-md rounded-xs border border-slate-300 font-mono text-[11px] leading-[1.3] text-black select-text"
          >
            {/* Reprint Flag */}
            {receipt && receipt.reprintCount > 0 && (
              <div className="mb-2 text-center border-2 border-black p-1 text-[10px] font-bold tracking-wider">
                *** DUPLICATE / REPRINT #{receipt.reprintCount} ***
                <div className="text-[9px] font-normal">Last reprinted: {formatDateTime(receipt.lastReprintAt)}</div>
              </div>
            )}

            {/* Hospital Branding */}
            <div className="text-center pb-2 border-b border-black border-dashed">
              <div className="text-[13px] font-extrabold uppercase tracking-tight">ST. FRANCIS HOSPITAL</div>
              <div className="text-[12px] font-bold">NSAMBYA CANTEEN</div>
              <div className="text-[9px] text-gray-700">HOSPITAL CATERING & DIETARY SERVICES</div>
              <div className="text-[9px] text-gray-700">Ggaba Road, P.O. Box 7146, Kampala, Uganda</div>
              <div className="text-[9px] text-gray-700">Tel: +256 414 267011 / 267012</div>
              <div className="text-[9px] font-semibold mt-0.5">TIN: 1000294812-KLA</div>
            </div>

            {/* Meta details */}
            <div className="py-2 border-b border-black border-dashed text-[10px] space-y-0.5">
              <div className="flex justify-between">
                <span className="font-bold">RECEIPT #:</span>
                <span className="font-bold">{receipt?.receiptNumber || 'REC-PENDING'}</span>
              </div>
              <div className="flex justify-between">
                <span>ORDER #:</span>
                <span>{order.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>DATE/TIME:</span>
                <span>{formatDateTime(order.completedAt || order.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span>CASHIER:</span>
                <span>{order.workerNameSnapshot} ({order.workerIdSnapshot})</span>
              </div>
              {order.ward && (
                <div className="flex justify-between font-bold text-[10px] pt-1">
                  <span>LOCATION:</span>
                  <span className="text-right">{order.ward}</span>
                </div>
              )}
              {order.bedNumber && (
                <div className="flex justify-between">
                  <span>BED / ROOM:</span>
                  <span>{order.bedNumber}</span>
                </div>
              )}
              {order.customerName && (
                <div className="flex justify-between">
                  <span>CUSTOMER:</span>
                  <span className="truncate max-w-[120px]">{order.customerName}</span>
                </div>
              )}
            </div>

            {/* Line items table */}
            <div className="py-2 border-b border-black border-dashed">
              <div className="flex justify-between font-bold text-[10px] pb-1 border-b border-gray-400">
                <span>QTY / ITEM</span>
                <span>TOTAL</span>
              </div>
              <div className="divide-y divide-gray-100 py-1 space-y-1">
                {order.items.map((item, idx) => (
                  <div key={idx} className="pt-1">
                    <div className="flex justify-between items-start font-medium">
                      <span className="pr-1">{item.quantity}x {item.itemNameSnapshot}</span>
                      <span className="font-bold shrink-0">{formatUGX(item.lineTotal)}</span>
                    </div>
                    <div className="flex justify-between text-[9px] text-gray-600 pl-4">
                      <span>@ {formatUGX(item.unitPriceSnapshot)}</span>
                      {item.notes && <span className="italic">Note: {item.notes}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="py-2 border-b border-black border-dashed space-y-1">
              <div className="flex justify-between text-[10px]">
                <span>Subtotal:</span>
                <span>{formatUGX(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-[9px] text-gray-600">
                <span>Hospital Meal VAT (0% Exempt):</span>
                <span>UGX 0</span>
              </div>
              <div className="flex justify-between text-[13px] font-extrabold pt-1 border-t border-black">
                <span>TOTAL:</span>
                <span>{formatUGX(order.total)}</span>
              </div>
            </div>

            {/* Payment Details */}
            {payment && (
              <div className="py-2 border-b border-black border-dashed text-[10px] space-y-0.5">
                <div className="flex justify-between font-bold">
                  <span>PAID VIA:</span>
                  <span>{getPaymentMethodLabel(payment.paymentMethod).toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tendered:</span>
                  <span>{formatUGX(payment.amountReceived)}</span>
                </div>
                {payment.changeDue > 0 && (
                  <div className="flex justify-between font-bold text-black">
                    <span>Change Returned:</span>
                    <span>{formatUGX(payment.changeDue)}</span>
                  </div>
                )}
                {payment.externalReference && (
                  <div className="flex justify-between text-[9px] pt-0.5">
                    <span>REF / TXN:</span>
                    <span className="font-bold">{payment.externalReference}</span>
                  </div>
                )}
              </div>
            )}

            {/* Barcode Graphic Simulation */}
            <div className="pt-3 pb-2 text-center">
              <div className="inline-block bg-black h-8 w-48 tracking-widest text-white text-[7px] flex items-center justify-center font-mono select-none">
                |||| | ||||| || |||||| | |||| ||| |||| |
              </div>
              <div className="text-[9px] tracking-widest mt-0.5">{order.orderNumber}</div>
            </div>

            {/* Footer */}
            <div className="text-center pt-1 text-[9px] text-gray-700 space-y-0.5">
              <div className="font-semibold">Wishing you quick recovery & good health!</div>
              <div>Hospital Food Hygiene Certified ISO-22000</div>
              <div>Official Computerized POS Sale</div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Action Bar */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Thermal 80mm / 58mm POS Printer ready
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print Thermal Receipt</span>
            </button>
            <button
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
