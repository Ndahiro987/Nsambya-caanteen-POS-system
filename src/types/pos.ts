export type UserRole = 0 | 1 | 2; // 0: Worker / Cashier, 1: Supervisor, 2: Administrator

export interface User {
  id: string;
  emailAddress: string;
  fullName: string;
  workerId: string;
  role: UserRole;
  active: boolean;
  pin: string; // 4-6 digit numeric PIN for fast terminal access
  password?: string; // Optional password
  createdAt: string;
  updatedAt: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  description: string;
  active: boolean;
  icon?: string;
  sortOrder: number;
}

export interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  currentPrice: number; // In UGX (Ugandan Shillings)
  active: boolean;
  inStock: boolean;
  code?: string;
  image?: string;
  isDietary?: boolean;
}

export interface OrderItem {
  menuItemId: string;
  itemNameSnapshot: string;
  quantity: number;
  unitPriceSnapshot: number;
  lineTotal: number;
  notes?: string;
}

export type OrderStatus = 'completed' | 'pending_verification' | 'voided';

export interface Order {
  id: string;
  orderNumber: string; // e.g. ORD-20261026-001
  createdByUserId: string;
  workerNameSnapshot: string;
  workerIdSnapshot: string;
  customerName?: string;
  customerReference?: string;
  ward?: string; // e.g. "St. Francis Surgical Ward"
  bedNumber?: string; // e.g. "Bed 14"
  notes?: string;
  subtotal: number;
  total: number;
  status: OrderStatus;
  items: OrderItem[];
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  paymentId?: string;
}

export type PaymentMethod = 
  | 'cash' 
  | 'mtn_momo' 
  | 'airtel_money' 
  | 'staff_credit' 
  | 'card_pos';

export type PaymentStatus = 'pending_verification' | 'verified' | 'rejected';

export interface Payment {
  id: string;
  orderId: string;
  orderNumber: string;
  recordedByUserId: string;
  recordedByName: string;
  verifiedByUserId?: string;
  verifiedByName?: string;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  amountReceived: number;
  changeDue: number;
  externalReference?: string;
  idempotencyKey: string;
  paidAt?: string;
  createdAt: string;
  verificationNotes?: string;
}

export interface Receipt {
  id: string;
  orderId: string;
  orderNumber: string;
  receiptNumber: string;
  generatedAt: string;
  reprintCount: number;
  lastReprintAt?: string;
}

export interface SaleCorrection {
  id: string;
  orderId: string;
  orderNumber: string;
  correctedByUserId: string;
  correctorName: string;
  reason: string;
  type: 'full_refund' | 'partial_refund' | 'void';
  amount: number;
  createdAt: string;
}

export interface CashClosing {
  id: string;
  closingDate: string;
  closedByUserId: string;
  closedByName: string;
  openingFloat: number;
  totalSales: number;
  totalCash: number;
  totalMobileMoney: number;
  totalOther: number;
  countedCash: number;
  variance: number;
  notes?: string;
  denominationBreakdown: Record<string, number>;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  recordType: string;
  recordId: string;
  reason?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface StaffSignupRequest {
  id: string;
  fullName: string;
  emailAddress: string;
  workerId: string;
  pin: string;
  requestedRole: UserRole;
  notes?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface POSState {
  users: User[];
  categories: MenuCategory[];
  menuItems: MenuItem[];
  orders: Order[];
  payments: Payment[];
  receipts: Receipt[];
  saleCorrections: SaleCorrection[];
  cashClosings: CashClosing[];
  auditLogs: AuditLog[];
  signupRequests: StaffSignupRequest[];
  currentUser: User | null; // null if locked or signed out
  heldOrders: {
    id: string;
    heldAt: string;
    label: string;
    items: OrderItem[];
    customerName?: string;
    ward?: string;
    bedNumber?: string;
  }[];
}
