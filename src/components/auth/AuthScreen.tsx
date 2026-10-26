import React, { useState } from 'react';
import { User, StaffSignupRequest } from '../../types/pos';
import { Shield, KeyRound, UserPlus, Lock, ArrowRight, CheckCircle2, AlertCircle, Building2, Plus } from 'lucide-react';

interface AuthScreenProps {
  users: User[];
  onInitializeAdmin: (adminData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onLogin: (user: User) => void;
  onSubmitSignupRequest: (req: Omit<StaffSignupRequest, 'id' | 'status' | 'createdAt'>) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  users,
  onInitializeAdmin,
  onLogin,
  onSubmitSignupRequest
}) => {
  const isFirstTimeSetup = users.length === 0;

  // Sign In State
  const [workerIdOrEmail, setWorkerIdOrEmail] = useState<string>('');
  const [pinOrPassword, setPinOrPassword] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');

  // Initial Admin Setup State
  const [adminName, setAdminName] = useState<string>('');
  const [adminEmail, setAdminEmail] = useState<string>('');
  const [adminWorkerId, setAdminWorkerId] = useState<string>('ADM001');
  const [adminPin, setAdminPin] = useState<string>('');
  const [adminPassword, setAdminPassword] = useState<string>('');
  const [setupError, setSetupError] = useState<string>('');

  // Worker Request Mode State
  const [isRequestMode, setIsRequestMode] = useState<boolean>(false);
  const [workerName, setWorkerName] = useState<string>('');
  const [workerEmail, setWorkerEmail] = useState<string>('');
  const [workerIdInput, setWorkerIdInput] = useState<string>('');
  const [workerPin, setWorkerPin] = useState<string>('');
  const [workerNotes, setWorkerNotes] = useState<string>('');
  const [requestSubmitted, setRequestSubmitted] = useState<boolean>(false);

  // Handle Login
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const query = workerIdOrEmail.trim().toLowerCase();
    const pin = pinOrPassword.trim();

    const matchedUser = users.find(
      u => u.workerId.toLowerCase() === query || u.emailAddress.toLowerCase() === query
    );

    if (!matchedUser) {
      setLoginError('No staff account found with this Worker ID or Email. If you are a new worker, submit an access request.');
      return;
    }

    if (!matchedUser.active) {
      setLoginError('This staff account is deactivated. Contact the Canteen Administrator.');
      return;
    }

    if (matchedUser.pin !== pin && matchedUser.password !== pin) {
      setLoginError('Incorrect PIN or Password. Please verify and try again.');
      return;
    }

    onLogin(matchedUser);
  };

  // Handle Initial Admin Creation
  const handleAdminSetupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSetupError('');

    if (!adminName.trim() || !adminWorkerId.trim() || !adminPin.trim()) {
      setSetupError('Please fill in all required fields.');
      return;
    }

    if (adminPin.trim().length < 4) {
      setSetupError('PIN must be at least 4 digits.');
      return;
    }

    onInitializeAdmin({
      fullName: adminName.trim(),
      emailAddress: adminEmail.trim() || `${adminWorkerId.toLowerCase()}@nsambya.hospital`,
      workerId: adminWorkerId.trim().toUpperCase(),
      role: 2, // Master Administrator
      active: true,
      pin: adminPin.trim(),
      password: adminPassword.trim() || adminPin.trim()
    });
  };

  // Handle Worker Request Submission
  const handleWorkerRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workerName.trim() || !workerIdInput.trim() || !workerPin.trim()) return;

    onSubmitSignupRequest({
      fullName: workerName.trim(),
      emailAddress: workerEmail.trim() || `${workerIdInput.toLowerCase()}@nsambya.hospital`,
      workerId: workerIdInput.trim().toUpperCase(),
      pin: workerPin.trim(),
      requestedRole: 0, // Request cashier/worker access
      notes: workerNotes.trim() || 'New canteen staff request'
    });

    setRequestSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 select-none relative overflow-hidden">
      {/* Background radial accent */}
      <div className="absolute w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-3xl pointer-events-none -top-40 -right-40" />
      <div className="absolute w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none -bottom-40 -left-40" />

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10">
        
        {/* Brand Mark */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-600 text-white font-black shadow-lg mb-3">
            <Plus className="w-6 h-6 stroke-[3]" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Nsambya Canteen POS</h1>
          <p className="text-xs text-slate-400 font-medium mt-1">
            St. Francis Hospital Dining & Sales Authorization
          </p>
        </div>

        {/* CASE 1: FIRST-TIME ADMINISTRATOR SETUP */}
        {isFirstTimeSetup ? (
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200">
            <div className="mb-5 pb-4 border-b border-slate-100">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold mb-2">
                <Shield className="w-3.5 h-3.5 text-emerald-600" />
                <span>Initial System Setup</span>
              </div>
              <h2 className="text-lg font-extrabold text-slate-900">Create Administrator Account</h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                No staff accounts exist yet. Create your master Administrator account to manage the canteen, authorize workers, and control access permissions.
              </p>
            </div>

            <form onSubmit={handleAdminSetupSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Full Legal Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={adminName}
                  onChange={e => setAdminName(e.target.value)}
                  placeholder="e.g. Dr. Charles Ndahiro"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Worker / Admin ID <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={adminWorkerId}
                    onChange={e => setAdminWorkerId(e.target.value)}
                    placeholder="ADM001"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono font-bold uppercase focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Terminal PIN (4-6 digits) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    maxLength={6}
                    value={adminPin}
                    onChange={e => setAdminPin(e.target.value)}
                    placeholder="••••"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono font-bold focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={e => setAdminEmail(e.target.value)}
                  placeholder="admin@nsambya.hospital"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Master Password (Optional)
                </label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={e => setAdminPassword(e.target.value)}
                  placeholder="Optional backup password"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              {setupError && (
                <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{setupError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 cursor-pointer mt-2"
              >
                <span>Initialize System & Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        ) : isRequestMode ? (
          /* CASE 2: WORKER ACCESS REQUEST FORM */
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200">
            {requestSubmitted ? (
              <div className="text-center py-6 space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <h3 className="text-lg font-extrabold text-slate-900">Request Submitted Successfully</h3>
                <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto">
                  Your worker authorization request has been routed to the Canteen Administrator. Once authorized, you can log in with your Worker ID and PIN.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsRequestMode(false);
                    setRequestSubmitted(false);
                  }}
                  className="mt-4 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors"
                >
                  Return to Sign In
                </button>
              </div>
            ) : (
              <div>
                <div className="mb-5 pb-3 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900">Request Worker Access</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Submit details for Administrator authorization.</p>
                  </div>
                  <button
                    onClick={() => setIsRequestMode(false)}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800"
                  >
                    Back
                  </button>
                </div>

                <form onSubmit={handleWorkerRequestSubmit} className="space-y-3.5 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Full Legal Name <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      required
                      value={workerName}
                      onChange={e => setWorkerName(e.target.value)}
                      placeholder="e.g. John Bosco"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Hospital Worker ID <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        required
                        value={workerIdInput}
                        onChange={e => setWorkerIdInput(e.target.value)}
                        placeholder="e.g. W002"
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono uppercase font-bold"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Requested PIN <span className="text-rose-500">*</span></label>
                      <input
                        type="password"
                        required
                        maxLength={6}
                        value={workerPin}
                        onChange={e => setWorkerPin(e.target.value)}
                        placeholder="••••"
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Hospital Email</label>
                    <input
                      type="email"
                      value={workerEmail}
                      onChange={e => setWorkerEmail(e.target.value)}
                      placeholder="e.g. j.bosco@nsambya.hospital"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Canteen Unit / Shift Notes</label>
                    <input
                      type="text"
                      value={workerNotes}
                      onChange={e => setWorkerNotes(e.target.value)}
                      placeholder="e.g. Morning cashier / St. Francis wing service"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-colors"
                    >
                      Submit for Admin Approval
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        ) : (
          /* CASE 3: STANDARD LOGIN SCREEN */
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200">
            <div className="mb-5 pb-3 border-b border-slate-100">
              <h2 className="text-lg font-extrabold text-slate-900">Staff & Admin Sign In</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Enter your authorized Worker ID and Terminal PIN to access your station.
              </p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Worker ID or Email Address
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={workerIdOrEmail}
                    onChange={e => setWorkerIdOrEmail(e.target.value)}
                    placeholder="e.g. ADM001 or W001"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold uppercase focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Terminal PIN / Password
                  </label>
                </div>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={pinOrPassword}
                    onChange={e => setPinOrPassword(e.target.value)}
                    placeholder="Enter 4-6 digit PIN"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono font-bold focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>
              </div>

              {loginError && (
                <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 cursor-pointer"
              >
                <span>Authorize & Unlock</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Bottom Links */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <button
                type="button"
                onClick={() => setIsRequestMode(true)}
                className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Request Worker Access</span>
              </button>
              <span className="text-[11px] text-slate-400 font-mono">
                {users.length} Authorized Account{users.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        )}

        <div className="text-center mt-4 text-[11px] text-slate-500">
          Hospital Food Safety & Staff Dining System · St. Francis Hospital Nsambya
        </div>
      </div>
    </div>
  );
};
