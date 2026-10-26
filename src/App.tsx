import React, { useState, useEffect } from 'react';
import { 
  POSState, 
  User, 
  Order, 
  Payment, 
  Receipt, 
  OrderItem, 
  PaymentMethod, 
  UserRole,
  MenuItem,
  MenuCategory,
  StaffSignupRequest
} from './types/pos';
import { 
  loadPOSState, 
  savePOSState 
} from './services/storage';
import { 
  generateOrderNumber, 
  generateReceiptNumber 
} from './utils/formatters';
import { Header, ActiveTab } from './components/pos/Header';
import { CashierTerminal } from './components/pos/CashierTerminal';
import { CheckoutModal } from './components/pos/CheckoutModal';
import { ThermalReceiptModal } from './components/receipt/ThermalReceiptModal';
import { PaymentVerificationView } from './components/verification/PaymentVerificationView';
import { OrdersRegisterView } from './components/orders/OrdersRegisterView';
import { CashClosingView } from './components/closing/CashClosingView';
import { MenuManagementView } from './components/menu/MenuManagementView';
import { StaffManagementView } from './components/staff/StaffManagementView';
import { ReportsView } from './components/reports/ReportsView';
import { AuditTrailView } from './components/audit/AuditTrailView';
import { LockScreenModal } from './components/common/LockScreenModal';
import { AuthScreen } from './components/auth/AuthScreen';
import { UnauthorizedNotice } from './components/common/UnauthorizedNotice';

export default function App() {
  const [state, setState] = useState<POSState>(() => loadPOSState());
  const [activeTab, setActiveTab] = useState<ActiveTab>('pos');

  // Checkout modal
  const [checkoutData, setCheckoutData] = useState<{
    isOpen: boolean;
    items: OrderItem[];
    subtotal: number;
    total: number;
    ward: string;
    bedNumber: string;
    customerName: string;
    notes: string;
  }>({
    isOpen: false,
    items: [],
    subtotal: 0,
    total: 0,
    ward: '',
    bedNumber: '',
    customerName: '',
    notes: ''
  });

  // Receipt Modal
  const [receiptModal, setReceiptModal] = useState<{
    isOpen: boolean;
    order: Order | null;
    payment: Payment | null;
    receipt: Receipt | null;
  }>({
    isOpen: false,
    order: null,
    payment: null,
    receipt: null
  });

  // Lock / Switch Cashier modal
  const [isLockModalOpen, setIsLockModalOpen] = useState<boolean>(false);

  // Sync to localStorage on changes
  useEffect(() => {
    savePOSState(state);
  }, [state]);

  // Auth Handlers
  const handleInitializeAdmin = (adminData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newAdmin: User = {
      id: `usr_${Date.now()}`,
      ...adminData,
      role: 2, // Administrator
      active: true,
      createdAt: now,
      updatedAt: now
    };

    const auditLog = {
      id: `aud_${Date.now()}`,
      userId: newAdmin.id,
      userName: `${newAdmin.fullName} (${newAdmin.workerId})`,
      action: 'INITIAL_ADMIN_CREATED',
      recordType: 'user',
      recordId: newAdmin.workerId,
      reason: 'Primary canteen administrator established.',
      createdAt: now
    };

    setState(prev => ({
      ...prev,
      users: [newAdmin],
      currentUser: newAdmin,
      auditLogs: [auditLog, ...prev.auditLogs]
    }));
    setActiveTab('pos');
  };

  const handleLogin = (user: User) => {
    const now = new Date().toISOString();
    const auditLog = {
      id: `aud_${Date.now()}`,
      userId: user.id,
      userName: `${user.fullName} (${user.workerId})`,
      action: 'USER_SIGNED_IN',
      recordType: 'session',
      recordId: user.workerId,
      reason: `Authenticated via Worker ID & PIN. Role: ${user.role}`,
      createdAt: now
    };

    setState(prev => ({
      ...prev,
      currentUser: user,
      auditLogs: [auditLog, ...prev.auditLogs]
    }));
    setActiveTab('pos');
  };

  const handleSignOut = () => {
    const now = new Date().toISOString();
    if (state.currentUser) {
      const auditLog = {
        id: `aud_${Date.now()}`,
        userId: state.currentUser.id,
        userName: `${state.currentUser.fullName} (${state.currentUser.workerId})`,
        action: 'USER_SIGNED_OUT',
        recordType: 'session',
        recordId: state.currentUser.workerId,
        reason: 'Signed out of terminal.',
        createdAt: now
      };

      setState(prev => ({
        ...prev,
        currentUser: null,
        auditLogs: [auditLog, ...prev.auditLogs]
      }));
    } else {
      setState(prev => ({ ...prev, currentUser: null }));
    }
  };

  const handleSubmitSignupRequest = (reqData: Omit<StaffSignupRequest, 'id' | 'status' | 'createdAt'>) => {
    const now = new Date().toISOString();
    const newRequest: StaffSignupRequest = {
      id: `req_${Date.now()}`,
      ...reqData,
      status: 'pending',
      createdAt: now
    };

    const auditLog = {
      id: `aud_${Date.now()}`,
      userId: 'system',
      userName: reqData.fullName,
      action: 'WORKER_SIGNUP_REQUESTED',
      recordType: 'signup_request',
      recordId: reqData.workerId,
      reason: `Worker access requested: ${reqData.notes || 'None'}`,
      createdAt: now
    };

    setState(prev => ({
      ...prev,
      signupRequests: [newRequest, ...prev.signupRequests],
      auditLogs: [auditLog, ...prev.auditLogs]
    }));
  };

  // If no user is authenticated or system is uninitialized, show the AuthScreen
  if (!state.currentUser || state.users.length === 0) {
    return (
      <AuthScreen
        users={state.users}
        onInitializeAdmin={handleInitializeAdmin}
        onLogin={handleLogin}
        onSubmitSignupRequest={handleSubmitSignupRequest}
      />
    );
  }

  // Handle Checkout Start
  const handleInitiateCheckout = (cartData: {
    items: OrderItem[];
    subtotal: number;
    total: number;
    ward: string;
    bedNumber: string;
    customerName: string;
    notes: string;
  }) => {
    setCheckoutData({
      isOpen: true,
      ...cartData
    });
  };

  // Complete Payment & Generate Receipt
  const handleConfirmPayment = (paymentDetails: {
    method: PaymentMethod;
    amountReceived: number;
    changeDue: number;
    externalReference: string;
    verificationNotes?: string;
  }) => {
    if (!state.currentUser) return;
    const now = new Date().toISOString();
    const orderNumber = generateOrderNumber(state.orders.length);
    const receiptNumber = generateReceiptNumber(state.receipts.length);

    const isNonCashPending = 
      (paymentDetails.method === 'mtn_momo' || paymentDetails.method === 'airtel_money') &&
      state.currentUser.role === 0;

    const orderStatus = isNonCashPending ? 'pending_verification' : 'completed';
    const paymentStatus = isNonCashPending ? 'pending_verification' : 'verified';

    const orderId = `ord_${Date.now()}`;
    const paymentId = `pay_${Date.now()}`;
    const receiptId = `rec_${Date.now()}`;

    const newOrder: Order = {
      id: orderId,
      orderNumber,
      createdByUserId: state.currentUser.id,
      workerNameSnapshot: state.currentUser.fullName,
      workerIdSnapshot: state.currentUser.workerId,
      customerName: checkoutData.customerName || undefined,
      ward: checkoutData.ward,
      bedNumber: checkoutData.bedNumber || undefined,
      notes: checkoutData.notes || undefined,
      subtotal: checkoutData.subtotal,
      total: checkoutData.total,
      status: orderStatus,
      items: checkoutData.items,
      completedAt: isNonCashPending ? undefined : now,
      createdAt: now,
      updatedAt: now,
      paymentId
    };

    const newPayment: Payment = {
      id: paymentId,
      orderId,
      orderNumber,
      recordedByUserId: state.currentUser.id,
      recordedByName: state.currentUser.fullName,
      verifiedByUserId: isNonCashPending ? undefined : state.currentUser.id,
      verifiedByName: isNonCashPending ? undefined : state.currentUser.fullName,
      paymentMethod: paymentDetails.method,
      status: paymentStatus,
      amount: checkoutData.total,
      amountReceived: paymentDetails.amountReceived,
      changeDue: paymentDetails.changeDue,
      externalReference: paymentDetails.externalReference,
      idempotencyKey: `IDEMP-${orderNumber}-${Date.now()}`,
      paidAt: isNonCashPending ? undefined : now,
      createdAt: now,
      verificationNotes: paymentDetails.verificationNotes
    };

    const newReceipt: Receipt = {
      id: receiptId,
      orderId,
      orderNumber,
      receiptNumber,
      generatedAt: now,
      reprintCount: 0
    };

    const newAuditLog = {
      id: `aud_${Date.now()}`,
      userId: state.currentUser.id,
      userName: `${state.currentUser.fullName} (${state.currentUser.workerId})`,
      action: 'ORDER_CREATED',
      recordType: 'order',
      recordId: orderNumber,
      reason: `Sale billed for ${checkoutData.ward || 'Main Canteen'}. Paid via ${paymentDetails.method}.`,
      metadata: {
        orderTotal: checkoutData.total,
        paymentMethod: paymentDetails.method,
        paymentRef: paymentDetails.externalReference,
        status: orderStatus
      },
      createdAt: now
    };

    setState(prev => ({
      ...prev,
      orders: [newOrder, ...prev.orders],
      payments: [newPayment, ...prev.payments],
      receipts: [newReceipt, ...prev.receipts],
      auditLogs: [newAuditLog, ...prev.auditLogs]
    }));

    setCheckoutData(prev => ({ ...prev, isOpen: false }));

    setReceiptModal({
      isOpen: true,
      order: newOrder,
      payment: newPayment,
      receipt: newReceipt
    });
  };

  const handleViewReceipt = (order: Order) => {
    const payment = state.payments.find(p => p.orderId === order.id) || null;
    let receipt = state.receipts.find(r => r.orderId === order.id) || null;

    if (!receipt) {
      const receiptNumber = generateReceiptNumber(state.receipts.length);
      receipt = {
        id: `rec_${Date.now()}`,
        orderId: order.id,
        orderNumber: order.orderNumber,
        receiptNumber,
        generatedAt: order.createdAt,
        reprintCount: 0
      };
      setState(prev => ({
        ...prev,
        receipts: [receipt!, ...prev.receipts]
      }));
    }

    setReceiptModal({
      isOpen: true,
      order,
      payment,
      receipt
    });
  };

  const handleReprintReceipt = (receiptId: string) => {
    if (!state.currentUser) return;
    const now = new Date().toISOString();
    setState(prev => {
      const updatedReceipts = prev.receipts.map(r => {
        if (r.id === receiptId) {
          return {
            ...r,
            reprintCount: r.reprintCount + 1,
            lastReprintAt: now
          };
        }
        return r;
      });

      const auditLog = {
        id: `aud_${Date.now()}`,
        userId: prev.currentUser!.id,
        userName: `${prev.currentUser!.fullName} (${prev.currentUser!.workerId})`,
        action: 'RECEIPT_REPRINTED',
        recordType: 'receipt',
        recordId: receiptId,
        reason: 'Duplicate physical copy requested for customer / ward file',
        metadata: { timestamp: now },
        createdAt: now
      };

      return {
        ...prev,
        receipts: updatedReceipts,
        auditLogs: [auditLog, ...prev.auditLogs]
      };
    });
  };

  const handleHoldOrder = (orderData: {
    items: OrderItem[];
    customerName?: string;
    ward?: string;
    bedNumber?: string;
  }) => {
    const id = `held_${Date.now()}`;
    const heldAt = new Date().toISOString();
    const label = `${orderData.customerName || orderData.ward || 'Customer'} (${orderData.items.length} items)`;

    setState(prev => ({
      ...prev,
      heldOrders: [
        {
          id,
          heldAt,
          label,
          ...orderData
        },
        ...prev.heldOrders
      ]
    }));
  };

  const handleRecallOrder = (id: string) => {
    setState(prev => ({
      ...prev,
      heldOrders: prev.heldOrders.filter(h => h.id !== id)
    }));
  };

  const handleVerifyPayment = (paymentId: string, notes: string) => {
    if (!state.currentUser) return;
    const now = new Date().toISOString();
    setState(prev => {
      let targetOrderNumber = '';
      const updatedPayments = prev.payments.map(p => {
        if (p.id === paymentId) {
          targetOrderNumber = p.orderNumber;
          return {
            ...p,
            status: 'verified' as const,
            verifiedByUserId: prev.currentUser!.id,
            verifiedByName: prev.currentUser!.fullName,
            paidAt: now,
            verificationNotes: notes
          };
        }
        return p;
      });

      const updatedOrders = prev.orders.map(o => {
        if (o.orderNumber === targetOrderNumber) {
          return {
            ...o,
            status: 'completed' as const,
            completedAt: now,
            updatedAt: now
          };
        }
        return o;
      });

      const auditLog = {
        id: `aud_${Date.now()}`,
        userId: prev.currentUser!.id,
        userName: `${prev.currentUser!.fullName} (${prev.currentUser!.workerId})`,
        action: 'PAYMENT_VERIFIED',
        recordType: 'payment',
        recordId: paymentId,
        reason: notes,
        metadata: { orderNumber: targetOrderNumber },
        createdAt: now
      };

      return {
        ...prev,
        payments: updatedPayments,
        orders: updatedOrders,
        auditLogs: [auditLog, ...prev.auditLogs]
      };
    });
  };

  const handleRejectPayment = (paymentId: string, reason: string) => {
    if (!state.currentUser) return;
    const now = new Date().toISOString();
    setState(prev => {
      let targetOrderNumber = '';
      const updatedPayments = prev.payments.map(p => {
        if (p.id === paymentId) {
          targetOrderNumber = p.orderNumber;
          return {
            ...p,
            status: 'rejected' as const,
            verificationNotes: `REJECTED: ${reason}`
          };
        }
        return p;
      });

      const updatedOrders = prev.orders.map(o => {
        if (o.orderNumber === targetOrderNumber) {
          return {
            ...o,
            status: 'voided' as const,
            notes: `Rejected: ${reason}`,
            updatedAt: now
          };
        }
        return o;
      });

      const auditLog = {
        id: `aud_${Date.now()}`,
        userId: prev.currentUser!.id,
        userName: `${prev.currentUser!.fullName} (${prev.currentUser!.workerId})`,
        action: 'PAYMENT_REJECTED',
        recordType: 'payment',
        recordId: paymentId,
        reason,
        metadata: { orderNumber: targetOrderNumber },
        createdAt: now
      };

      return {
        ...prev,
        payments: updatedPayments,
        orders: updatedOrders,
        auditLogs: [auditLog, ...prev.auditLogs]
      };
    });
  };

  const handleSaleCorrection = (correction: {
    orderId: string;
    orderNumber: string;
    type: 'full_refund' | 'partial_refund' | 'void';
    amount: number;
    reason: string;
  }) => {
    if (!state.currentUser) return;
    const now = new Date().toISOString();
    const newCorrection = {
      id: `cor_${Date.now()}`,
      orderId: correction.orderId,
      orderNumber: correction.orderNumber,
      correctedByUserId: state.currentUser.id,
      correctorName: state.currentUser.fullName,
      reason: correction.reason,
      type: correction.type,
      amount: correction.amount,
      createdAt: now
    };

    setState(prev => {
      const updatedOrders = prev.orders.map(o => {
        if (o.id === correction.orderId) {
          return {
            ...o,
            status: 'voided' as const,
            notes: `Voided/Refunded: ${correction.reason}`,
            updatedAt: now
          };
        }
        return o;
      });

      const auditLog = {
        id: `aud_${Date.now()}`,
        userId: prev.currentUser!.id,
        userName: `${prev.currentUser!.fullName} (${prev.currentUser!.workerId})`,
        action: 'SALE_CORRECTION',
        recordType: 'order',
        recordId: correction.orderNumber,
        reason: correction.reason,
        metadata: {
          type: correction.type,
          amount: correction.amount
        },
        createdAt: now
      };

      return {
        ...prev,
        orders: updatedOrders,
        saleCorrections: [newCorrection, ...prev.saleCorrections],
        auditLogs: [auditLog, ...prev.auditLogs]
      };
    });
  };

  const handleSubmitClosing = (closingData: {
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
  }) => {
    if (!state.currentUser) return;
    const now = new Date().toISOString();
    const newClosing = {
      id: `cls_${Date.now()}`,
      closingDate: closingData.closingDate,
      closedByUserId: state.currentUser.id,
      closedByName: state.currentUser.fullName,
      openingFloat: closingData.openingFloat,
      totalSales: closingData.totalSales,
      totalCash: closingData.totalCash,
      totalMobileMoney: closingData.totalMobileMoney,
      totalOther: closingData.totalOther,
      countedCash: closingData.countedCash,
      variance: closingData.variance,
      notes: closingData.notes,
      denominationBreakdown: closingData.denominationBreakdown,
      createdAt: now
    };

    const auditLog = {
      id: `aud_${Date.now()}`,
      userId: state.currentUser.id,
      userName: `${state.currentUser.fullName} (${state.currentUser.workerId})`,
      action: 'CASH_CLOSING_COMMITTED',
      recordType: 'cash_closing',
      recordId: newClosing.id,
      reason: closingData.notes,
      metadata: {
        totalSales: closingData.totalSales,
        countedCash: closingData.countedCash,
        variance: closingData.variance
      },
      createdAt: now
    };

    setState(prev => ({
      ...prev,
      cashClosings: [newClosing, ...prev.cashClosings],
      auditLogs: [auditLog, ...prev.auditLogs]
    }));
  };

  const handleUpdateItemPrice = (itemId: string, newPrice: number, reason: string) => {
    if (!state.currentUser) return;
    const now = new Date().toISOString();
    setState(prev => {
      let itemName = '';
      let oldPrice = 0;
      const updatedItems = prev.menuItems.map(item => {
        if (item.id === itemId) {
          itemName = item.name;
          oldPrice = item.currentPrice;
          return {
            ...item,
            currentPrice: newPrice
          };
        }
        return item;
      });

      const auditLog = {
        id: `aud_${Date.now()}`,
        userId: prev.currentUser!.id,
        userName: `${prev.currentUser!.fullName} (${prev.currentUser!.workerId})`,
        action: 'PRICE_UPDATED',
        recordType: 'menu_item',
        recordId: itemId,
        reason,
        metadata: {
          itemName,
          oldPrice,
          newPrice
        },
        createdAt: now
      };

      return {
        ...prev,
        menuItems: updatedItems,
        auditLogs: [auditLog, ...prev.auditLogs]
      };
    });
  };

  const handleToggleItemStock = (itemId: string, inStock: boolean) => {
    if (!state.currentUser) return;
    const now = new Date().toISOString();
    setState(prev => {
      let itemName = '';
      const updatedItems = prev.menuItems.map(item => {
        if (item.id === itemId) {
          itemName = item.name;
          return {
            ...item,
            inStock
          };
        }
        return item;
      });

      const auditLog = {
        id: `aud_${Date.now()}`,
        userId: prev.currentUser!.id,
        userName: `${prev.currentUser!.fullName} (${prev.currentUser!.workerId})`,
        action: 'STOCK_STATUS_CHANGED',
        recordType: 'menu_item',
        recordId: itemId,
        reason: inStock ? 'Item marked in stock' : 'Item marked sold out (86)',
        metadata: { itemName, inStock },
        createdAt: now
      };

      return {
        ...prev,
        menuItems: updatedItems,
        auditLogs: [auditLog, ...prev.auditLogs]
      };
    });
  };

  const handleAddItem = (itemData: Omit<MenuItem, 'id'>) => {
    if (!state.currentUser) return;
    const now = new Date().toISOString();
    const newItem: MenuItem = {
      id: `item_${Date.now()}`,
      ...itemData
    };

    const auditLog = {
      id: `aud_${Date.now()}`,
      userId: state.currentUser.id,
      userName: `${state.currentUser.fullName} (${state.currentUser.workerId})`,
      action: 'MENU_ITEM_CREATED',
      recordType: 'menu_item',
      recordId: newItem.id,
      reason: `Added new dish: ${newItem.name}`,
      metadata: { name: newItem.name, price: newItem.currentPrice },
      createdAt: now
    };

    setState(prev => ({
      ...prev,
      menuItems: [...prev.menuItems, newItem],
      auditLogs: [auditLog, ...prev.auditLogs]
    }));
  };

  const handleAddCategory = (categoryData: Omit<MenuCategory, 'id'>) => {
    if (!state.currentUser) return;
    const now = new Date().toISOString();
    const newCat: MenuCategory = {
      id: `cat_${Date.now()}`,
      ...categoryData
    };

    const auditLog = {
      id: `aud_${Date.now()}`,
      userId: state.currentUser.id,
      userName: `${state.currentUser.fullName} (${state.currentUser.workerId})`,
      action: 'CATEGORY_CREATED',
      recordType: 'menu_category',
      recordId: newCat.id,
      reason: `Added category: ${newCat.name}`,
      createdAt: now
    };

    setState(prev => ({
      ...prev,
      categories: [...prev.categories, newCat],
      auditLogs: [auditLog, ...prev.auditLogs]
    }));
  };

  // Staff Management Actions (Admin only)
  const handleApproveSignup = (requestId: string, role: UserRole) => {
    if (!state.currentUser) return;
    const now = new Date().toISOString();
    const req = state.signupRequests.find(r => r.id === requestId);
    if (!req) return;

    const newUser: User = {
      id: `usr_${Date.now()}`,
      fullName: req.fullName,
      emailAddress: req.emailAddress,
      workerId: req.workerId,
      role,
      active: true,
      pin: req.pin || '1234',
      createdAt: now,
      updatedAt: now
    };

    const updatedRequests = state.signupRequests.map(r =>
      r.id === requestId ? { ...r, status: 'approved' as const } : r
    );

    const auditLog = {
      id: `aud_${Date.now()}`,
      userId: state.currentUser.id,
      userName: `${state.currentUser.fullName} (${state.currentUser.workerId})`,
      action: 'STAFF_APPROVED',
      recordType: 'user',
      recordId: newUser.workerId,
      reason: `Admin approved worker ${newUser.fullName} with role ${role}`,
      createdAt: now
    };

    setState(prev => ({
      ...prev,
      users: [...prev.users, newUser],
      signupRequests: updatedRequests,
      auditLogs: [auditLog, ...prev.auditLogs]
    }));
  };

  const handleRejectSignup = (requestId: string) => {
    if (!state.currentUser) return;
    const now = new Date().toISOString();
    const updatedRequests = state.signupRequests.map(r =>
      r.id === requestId ? { ...r, status: 'rejected' as const } : r
    );

    const auditLog = {
      id: `aud_${Date.now()}`,
      userId: state.currentUser.id,
      userName: `${state.currentUser.fullName} (${state.currentUser.workerId})`,
      action: 'STAFF_SIGNUP_REJECTED',
      recordType: 'signup_request',
      recordId: requestId,
      reason: 'Rejected by administrator',
      createdAt: now
    };

    setState(prev => ({
      ...prev,
      signupRequests: updatedRequests,
      auditLogs: [auditLog, ...prev.auditLogs]
    }));
  };

  const handleAddStaff = (staffData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!state.currentUser) return;
    const now = new Date().toISOString();
    const newUser: User = {
      id: `usr_${Date.now()}`,
      ...staffData,
      createdAt: now,
      updatedAt: now
    };

    const auditLog = {
      id: `aud_${Date.now()}`,
      userId: state.currentUser.id,
      userName: `${state.currentUser.fullName} (${state.currentUser.workerId})`,
      action: 'STAFF_ACCOUNT_CREATED',
      recordType: 'user',
      recordId: newUser.workerId,
      reason: `Direct creation of staff account for ${newUser.fullName} by Admin`,
      createdAt: now
    };

    setState(prev => ({
      ...prev,
      users: [...prev.users, newUser],
      auditLogs: [auditLog, ...prev.auditLogs]
    }));
  };

  const handleToggleStaffActive = (userId: string, active: boolean) => {
    if (!state.currentUser) return;
    const now = new Date().toISOString();
    setState(prev => {
      let name = '';
      let wId = '';
      const updatedUsers = prev.users.map(u => {
        if (u.id === userId) {
          name = u.fullName;
          wId = u.workerId;
          return { ...u, active };
        }
        return u;
      });

      const auditLog = {
        id: `aud_${Date.now()}`,
        userId: prev.currentUser!.id,
        userName: `${prev.currentUser!.fullName} (${prev.currentUser!.workerId})`,
        action: active ? 'STAFF_ACTIVATED' : 'STAFF_DEACTIVATED',
        recordType: 'user',
        recordId: wId,
        reason: `${name} access set to ${active ? 'Active' : 'Disabled'}`,
        createdAt: now
      };

      return {
        ...prev,
        users: updatedUsers,
        auditLogs: [auditLog, ...prev.auditLogs]
      };
    });
  };

  const handleSelectUser = (user: User) => {
    const now = new Date().toISOString();
    const auditLog = {
      id: `aud_${Date.now()}`,
      userId: user.id,
      userName: `${user.fullName} (${user.workerId})`,
      action: 'CASHIER_SWITCHED',
      recordType: 'session',
      recordId: user.workerId,
      reason: `Active operator switched to ${user.fullName}`,
      createdAt: now
    };

    setState(prev => ({
      ...prev,
      currentUser: user,
      auditLogs: [auditLog, ...prev.auditLogs]
    }));
    setActiveTab('pos');
  };

  const pendingVerificationsCount = state.payments.filter(p => p.status === 'pending_verification').length;
  const pendingSignupsCount = state.signupRequests.filter(r => r.status === 'pending').length;
  const currentUserRole = state.currentUser.role;

  return (
    <div className="min-h-screen bg-slate-100/60 flex flex-col font-sans">
      
      {/* Universal Top Header */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        currentUser={state.currentUser}
        pendingVerificationsCount={pendingVerificationsCount}
        pendingSignupsCount={pendingSignupsCount}
        onOpenLockModal={() => setIsLockModalOpen(true)}
        onSignOut={handleSignOut}
      />

      {/* Main Content Area with Strict Role-Based Access Control */}
      <main className="flex-1 flex flex-col">
        {/* TAB 1: POS - Allowed for all */}
        {activeTab === 'pos' && (
          <CashierTerminal
            categories={state.categories}
            menuItems={state.menuItems}
            currentUser={state.currentUser}
            heldOrders={state.heldOrders}
            onHoldOrder={handleHoldOrder}
            onRecallOrder={handleRecallOrder}
            onInitiateCheckout={handleInitiateCheckout}
          />
        )}

        {/* TAB 2: Orders - Allowed for all (workers see only their own shift) */}
        {activeTab === 'orders' && (
          <OrdersRegisterView
            orders={state.orders}
            payments={state.payments}
            receipts={state.receipts}
            currentUser={state.currentUser}
            onViewReceipt={handleViewReceipt}
            onSaleCorrection={handleSaleCorrection}
          />
        )}

        {/* TAB 3: Payment Verification - Supervisor & Admin Only */}
        {activeTab === 'verification' && (
          currentUserRole >= 1 ? (
            <PaymentVerificationView
              payments={state.payments}
              orders={state.orders}
              currentUser={state.currentUser}
              onVerifyPayment={handleVerifyPayment}
              onRejectPayment={handleRejectPayment}
            />
          ) : (
            <UnauthorizedNotice
              requiredRole={1}
              userRole={currentUserRole}
              onGoBack={() => setActiveTab('pos')}
            />
          )
        )}

        {/* TAB 4: Cash Closing (Z-Report) - Supervisor & Admin Only */}
        {activeTab === 'closing' && (
          currentUserRole >= 1 ? (
            <CashClosingView
              orders={state.orders}
              payments={state.payments}
              cashClosings={state.cashClosings}
              currentUser={state.currentUser}
              onSubmitClosing={handleSubmitClosing}
            />
          ) : (
            <UnauthorizedNotice
              requiredRole={1}
              userRole={currentUserRole}
              onGoBack={() => setActiveTab('pos')}
            />
          )
        )}

        {/* TAB 5: Menu & Pricing - Admin Only */}
        {activeTab === 'menu' && (
          currentUserRole === 2 ? (
            <MenuManagementView
              categories={state.categories}
              menuItems={state.menuItems}
              currentUser={state.currentUser}
              onUpdateItemPrice={handleUpdateItemPrice}
              onToggleItemStock={handleToggleItemStock}
              onAddItem={handleAddItem}
              onAddCategory={handleAddCategory}
            />
          ) : (
            <UnauthorizedNotice
              requiredRole={2}
              userRole={currentUserRole}
              onGoBack={() => setActiveTab('pos')}
            />
          )
        )}

        {/* TAB 6: Staff Management - Admin Only */}
        {activeTab === 'staff' && (
          currentUserRole === 2 ? (
            <StaffManagementView
              users={state.users}
              signupRequests={state.signupRequests}
              currentUser={state.currentUser}
              onApproveSignup={handleApproveSignup}
              onRejectSignup={handleRejectSignup}
              onAddStaff={handleAddStaff}
              onToggleStaffActive={handleToggleStaffActive}
            />
          ) : (
            <UnauthorizedNotice
              requiredRole={2}
              userRole={currentUserRole}
              onGoBack={() => setActiveTab('pos')}
            />
          )
        )}

        {/* TAB 7: Reports - Supervisor & Admin Only */}
        {activeTab === 'reports' && (
          currentUserRole >= 1 ? (
            <ReportsView
              orders={state.orders}
              payments={state.payments}
            />
          ) : (
            <UnauthorizedNotice
              requiredRole={1}
              userRole={currentUserRole}
              onGoBack={() => setActiveTab('pos')}
            />
          )
        )}

        {/* TAB 8: Audit Trail - Admin Only */}
        {activeTab === 'audit' && (
          currentUserRole === 2 ? (
            <AuditTrailView
              auditLogs={state.auditLogs}
            />
          ) : (
            <UnauthorizedNotice
              requiredRole={2}
              userRole={currentUserRole}
              onGoBack={() => setActiveTab('pos')}
            />
          )
        )}
      </main>

      {/* Modals */}
      <CheckoutModal
        isOpen={checkoutData.isOpen}
        total={checkoutData.total}
        subtotal={checkoutData.subtotal}
        ward={checkoutData.ward}
        bedNumber={checkoutData.bedNumber}
        customerName={checkoutData.customerName}
        currentUser={state.currentUser}
        onConfirmPayment={handleConfirmPayment}
        onClose={() => setCheckoutData(prev => ({ ...prev, isOpen: false }))}
      />

      <ThermalReceiptModal
        isOpen={receiptModal.isOpen}
        order={receiptModal.order}
        payment={receiptModal.payment}
        receipt={receiptModal.receipt}
        onReprint={handleReprintReceipt}
        onClose={() => setReceiptModal(prev => ({ ...prev, isOpen: false }))}
      />

      <LockScreenModal
        isOpen={isLockModalOpen}
        users={state.users}
        currentUser={state.currentUser}
        onSelectUser={handleSelectUser}
        onSignOut={handleSignOut}
        onClose={() => setIsLockModalOpen(false)}
      />

    </div>
  );
}
