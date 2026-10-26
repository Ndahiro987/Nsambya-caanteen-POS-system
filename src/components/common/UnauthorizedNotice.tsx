import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { getRoleName } from '../../utils/formatters';
import { UserRole } from '../../types/pos';

interface UnauthorizedNoticeProps {
  requiredRole: UserRole;
  userRole: UserRole;
  onGoBack: () => void;
}

export const UnauthorizedNotice: React.FC<UnauthorizedNoticeProps> = ({
  requiredRole,
  userRole,
  onGoBack
}) => {
  return (
    <div className="flex-1 max-w-lg w-full mx-auto my-12 p-8 bg-white rounded-3xl border border-rose-200 shadow-sm text-center space-y-4">
      <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
        <ShieldAlert className="w-6 h-6" />
      </div>
      <div>
        <h3 className="text-lg font-black text-slate-900">Access Restricted</h3>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          This section requires <strong>{getRoleName(requiredRole)}</strong> authority. Your current account has <strong>{getRoleName(userRole)}</strong> privileges.
        </p>
      </div>
      <div className="pt-2">
        <button
          onClick={onGoBack}
          className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
        >
          Return to Cashier POS
        </button>
      </div>
    </div>
  );
};
