import React, { useState } from 'react';
import { User, StaffSignupRequest, UserRole } from '../../types/pos';
import { formatDateTime, getRoleName } from '../../utils/formatters';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  KeyRound, 
  Power,
  Mail,
  UserCheck
} from 'lucide-react';

interface StaffManagementViewProps {
  users: User[];
  signupRequests: StaffSignupRequest[];
  currentUser: User;
  onApproveSignup: (requestId: string, role: UserRole) => void;
  onRejectSignup: (requestId: string) => void;
  onAddStaff: (staffData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onToggleStaffActive: (userId: string, active: boolean) => void;
}

export const StaffManagementView: React.FC<StaffManagementViewProps> = ({
  users,
  signupRequests,
  currentUser,
  onApproveSignup,
  onRejectSignup,
  onAddStaff,
  onToggleStaffActive
}) => {
  const [tab, setTab] = useState<'staff' | 'requests'>('staff');
  const [isAddOpen, setIsAddOpen] = useState<boolean>(false);

  // New staff form state
  const [fullName, setFullName] = useState<string>('');
  const [emailAddress, setEmailAddress] = useState<string>('');
  const [workerId, setWorkerId] = useState<string>('');
  const [role, setRole] = useState<UserRole>(0);
  const [pin, setPin] = useState<string>('1234');

  const pendingRequests = signupRequests.filter(r => r.status === 'pending');

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !workerId.trim()) return;

    onAddStaff({
      fullName: fullName.trim(),
      emailAddress: emailAddress.trim() || `${workerId.toLowerCase()}@nsambya.hospital`,
      workerId: workerId.trim().toUpperCase(),
      role,
      active: true,
      pin: pin.trim() || '1234'
    });

    setIsAddOpen(false);
    setFullName('');
    setEmailAddress('');
    setWorkerId('');
    setRole(0);
    setPin('1234');
  };

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
      
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            <Users className="w-4 h-4 text-emerald-600" />
            <span>Staff Roles & Account Approvals</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 mt-1">Canteen Personnel Directory</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Role-based security: Cashiers (Role 0), Supervisors (Role 1), Administrators (Role 2).
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setTab('staff')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                tab === 'staff' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Active Staff ({users.length})
            </button>
            <button
              onClick={() => setTab('requests')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all relative ${
                tab === 'requests' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pending Signups
              {pendingRequests.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 text-[10px] font-black bg-blue-500 text-white rounded-full font-mono">
                  {pendingRequests.length}
                </span>
              )}
            </button>
          </div>

          <button
            onClick={() => setIsAddOpen(true)}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Staff Member</span>
          </button>
        </div>
      </div>

      {/* ACTIVE STAFF TAB */}
      {tab === 'staff' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                  <th className="py-3 px-4">Worker ID</th>
                  <th className="py-3 px-4">Full Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4 text-center">4-Digit PIN</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-bold ${
                        u.role === 2 ? 'bg-purple-100 text-purple-800' :
                        u.role === 1 ? 'bg-blue-100 text-blue-800' :
                        'bg-emerald-100 text-emerald-800'
                      }`}>
                        {u.workerId}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {u.fullName}
                      {u.id === currentUser.id && (
                        <span className="text-[10px] font-normal text-emerald-700 ml-1.5">(Active You)</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                      {u.emailAddress}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {getRoleName(u.role)}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-600">
                      •••• ({u.pin})
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {u.active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {u.id !== currentUser.id && (
                        <button
                          onClick={() => onToggleStaffActive(u.id, !u.active)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                            u.active
                              ? 'border-slate-200 text-slate-600 hover:bg-slate-100'
                              : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                          }`}
                        >
                          {u.active ? 'Deactivate' : 'Enable'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PENDING SIGNUP REQUESTS TAB */}
      {tab === 'requests' && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl text-blue-900 text-xs">
            <strong>Staff Signup Governance:</strong> New canteen workers submit an access request. An administrator must approve their identity and assign an authorized role before terminal credentials activate.
          </div>

          <div className="grid grid-cols-1 gap-3">
            {pendingRequests.map(req => (
              <div key={req.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-xs">
                      {req.workerId}
                    </span>
                    <h4 className="font-bold text-sm text-slate-900">{req.fullName}</h4>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {formatDateTime(req.createdAt)}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600">
                    Email: <span className="font-mono">{req.emailAddress}</span> · Notes: <span className="italic">{req.notes || 'None'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onRejectSignup(req.id)}
                    className="px-3 py-1.5 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-semibold"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => onApproveSignup(req.id, 0)}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                  >
                    Approve as Cashier
                  </button>
                  <button
                    onClick={() => onApproveSignup(req.id, 1)}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold"
                  >
                    Approve as Supervisor
                  </button>
                </div>
              </div>
            ))}

            {pendingRequests.length === 0 && (
              <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
                <UserCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <h4 className="font-bold text-sm text-slate-700">No Pending Requests</h4>
                <p className="text-xs text-slate-400 mt-1">All staff signup requests have been reviewed.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-base text-slate-900">Add Staff Account</h3>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Worker ID <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={workerId}
                    onChange={e => setWorkerId(e.target.value)}
                    placeholder="e.g. W005"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono uppercase font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Assigned Role</label>
                  <select
                    value={role}
                    onChange={e => setRole(Number(e.target.value) as UserRole)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                  >
                    <option value={0}>Cashier / Worker (Role 0)</option>
                    <option value={1}>Supervisor (Role 1)</option>
                    <option value={2}>Administrator (Role 2)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Full Legal Name <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="e.g. Joseph Wasswa"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Email Address</label>
                <input
                  type="email"
                  value={emailAddress}
                  onChange={e => setEmailAddress(e.target.value)}
                  placeholder="e.g. j.wasswa@nsambya.hospital"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Terminal Login PIN (4 Digits)</label>
                <input
                  type="password"
                  maxLength={4}
                  value={pin}
                  onChange={e => setPin(e.target.value)}
                  placeholder="1234"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 border rounded-xl font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
