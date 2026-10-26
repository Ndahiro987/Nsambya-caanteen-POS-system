import React from 'react';
import { User } from '../../types/pos';
import { getRoleName } from '../../utils/formatters';
import { 
  ShoppingBag, 
  Receipt, 
  CheckCircle2, 
  Calculator, 
  UtensilsCrossed, 
  Users, 
  BarChart3, 
  FileText, 
  Lock, 
  LogOut,
  Plus
} from 'lucide-react';

export type ActiveTab = 
  | 'pos' 
  | 'orders' 
  | 'verification' 
  | 'closing' 
  | 'menu' 
  | 'staff' 
  | 'reports' 
  | 'audit';

interface HeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  currentUser: User;
  pendingVerificationsCount: number;
  pendingSignupsCount: number;
  onOpenLockModal: () => void;
  onSignOut: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  currentUser,
  pendingVerificationsCount,
  pendingSignupsCount,
  onOpenLockModal,
  onSignOut
}) => {
  const isWorker = currentUser.role === 0;
  const isSupervisor = currentUser.role === 1;
  const isAdmin = currentUser.role === 2;

  return (
    <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 text-white select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-6 h-16">
        
        {/* Zone 1: Single text element Brand wordmark with hospital badge */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-black shadow-sm">
            <Plus className="w-5 h-5 stroke-[3]" />
          </div>
          <div>
            <span className="text-base font-extrabold tracking-tight text-white whitespace-nowrap block leading-none">
              Nsambya Canteen POS
            </span>
            <span className="text-[10px] text-slate-400 font-medium tracking-wide">
              St. Francis Hospital Dining
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Links (Strictly filtered by role permissions) */}
        <nav className="hidden lg:flex items-center gap-1 overflow-x-auto py-1 scrollbar-none">
          {/* Cashier POS: Visible to all */}
          <button
            onClick={() => onTabChange('pos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors flex items-center gap-1.5 ${
              activeTab === 'pos'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Cashier POS</span>
          </button>

          {/* Orders & Receipts: Visible to all (filtered to worker's own shift if Cashier) */}
          <button
            onClick={() => onTabChange('orders')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors flex items-center gap-1.5 ${
              activeTab === 'orders'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>{isWorker ? 'My Shift Orders' : 'Orders & Receipts'}</span>
          </button>

          {/* Payment Verification: Supervisor & Admin only */}
          {(isSupervisor || isAdmin) && (
            <button
              onClick={() => onTabChange('verification')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors flex items-center gap-1.5 relative ${
                activeTab === 'verification'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Verify Payments</span>
              {pendingVerificationsCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 text-[10px] font-black bg-amber-500 text-slate-950 rounded-full font-mono">
                  {pendingVerificationsCount}
                </span>
              )}
            </button>
          )}

          {/* Cash Closing / Z-Report: Supervisor & Admin only */}
          {(isSupervisor || isAdmin) && (
            <button
              onClick={() => onTabChange('closing')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors flex items-center gap-1.5 ${
                activeTab === 'closing'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Cash Closing / Z-Report</span>
            </button>
          )}

          {/* Menu & Pricing: Admin only */}
          {isAdmin && (
            <button
              onClick={() => onTabChange('menu')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors flex items-center gap-1.5 ${
                activeTab === 'menu'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <UtensilsCrossed className="w-3.5 h-3.5" />
              <span>Menu & Pricing</span>
            </button>
          )}

          {/* Staff: Admin only */}
          {isAdmin && (
            <button
              onClick={() => onTabChange('staff')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors flex items-center gap-1.5 ${
                activeTab === 'staff'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Staff & Access</span>
              {pendingSignupsCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 text-[10px] font-black bg-blue-400 text-slate-950 rounded-full font-mono">
                  {pendingSignupsCount}
                </span>
              )}
            </button>
          )}

          {/* Reports: Supervisor & Admin */}
          {(isSupervisor || isAdmin) && (
            <button
              onClick={() => onTabChange('reports')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors flex items-center gap-1.5 ${
                activeTab === 'reports'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Reports</span>
            </button>
          )}

          {/* Audit Trail: Admin only */}
          {isAdmin && (
            <button
              onClick={() => onTabChange('audit')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors flex items-center gap-1.5 ${
                activeTab === 'audit'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Audit Trail</span>
            </button>
          )}
        </nav>

        {/* Zone 3: Active Cashier & Terminal Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-left">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
              currentUser.role === 2 ? 'bg-purple-900/60 text-purple-300' :
              currentUser.role === 1 ? 'bg-blue-900/60 text-blue-300' :
              'bg-emerald-900/60 text-emerald-300'
            }`}>
              {currentUser.workerId}
            </div>
            <div className="hidden sm:block">
              <div className="text-xs font-semibold leading-tight text-slate-200">{currentUser.fullName}</div>
              <div className="text-[10px] text-slate-400 font-normal">{getRoleName(currentUser.role)}</div>
            </div>
          </div>

          <button
            onClick={onOpenLockModal}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title="Lock Terminal / Switch Cashier"
          >
            <Lock className="w-4 h-4" />
          </button>

          <button
            onClick={onSignOut}
            className="p-2 text-rose-400 hover:text-rose-300 rounded-lg hover:bg-slate-800 transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Navigation Bar */}
      <div className="lg:hidden flex overflow-x-auto py-2 px-4 gap-1.5 border-t border-slate-800 bg-slate-900/90 text-xs">
        <button
          onClick={() => onTabChange('pos')}
          className={`px-2.5 py-1 rounded-md shrink-0 font-medium ${activeTab === 'pos' ? 'bg-emerald-600 text-white' : 'text-slate-300'}`}
        >
          POS
        </button>
        <button
          onClick={() => onTabChange('orders')}
          className={`px-2.5 py-1 rounded-md shrink-0 font-medium ${activeTab === 'orders' ? 'bg-emerald-600 text-white' : 'text-slate-300'}`}
        >
          {isWorker ? 'My Sales' : 'Orders'}
        </button>
        {(isSupervisor || isAdmin) && (
          <button
            onClick={() => onTabChange('verification')}
            className={`px-2.5 py-1 rounded-md shrink-0 font-medium ${activeTab === 'verification' ? 'bg-emerald-600 text-white' : 'text-slate-300'}`}
          >
            Verify {pendingVerificationsCount > 0 && `(${pendingVerificationsCount})`}
          </button>
        )}
        {(isSupervisor || isAdmin) && (
          <button
            onClick={() => onTabChange('closing')}
            className={`px-2.5 py-1 rounded-md shrink-0 font-medium ${activeTab === 'closing' ? 'bg-emerald-600 text-white' : 'text-slate-300'}`}
          >
            Z-Report
          </button>
        )}
        {isAdmin && (
          <button
            onClick={() => onTabChange('menu')}
            className={`px-2.5 py-1 rounded-md shrink-0 font-medium ${activeTab === 'menu' ? 'bg-emerald-600 text-white' : 'text-slate-300'}`}
          >
            Menu
          </button>
        )}
        {isAdmin && (
          <button
            onClick={() => onTabChange('staff')}
            className={`px-2.5 py-1 rounded-md shrink-0 font-medium ${activeTab === 'staff' ? 'bg-emerald-600 text-white' : 'text-slate-300'}`}
          >
            Staff
          </button>
        )}
        {(isSupervisor || isAdmin) && (
          <button
            onClick={() => onTabChange('reports')}
            className={`px-2.5 py-1 rounded-md shrink-0 font-medium ${activeTab === 'reports' ? 'bg-emerald-600 text-white' : 'text-slate-300'}`}
          >
            Reports
          </button>
        )}
        {isAdmin && (
          <button
            onClick={() => onTabChange('audit')}
            className={`px-2.5 py-1 rounded-md shrink-0 font-medium ${activeTab === 'audit' ? 'bg-emerald-600 text-white' : 'text-slate-300'}`}
          >
            Audit
          </button>
        )}
      </div>
    </header>
  );
};
