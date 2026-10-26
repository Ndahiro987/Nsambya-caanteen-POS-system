import React, { useState } from 'react';
import { User } from '../../types/pos';
import { getRoleName } from '../../utils/formatters';
import { Lock, ShieldCheck, UserCheck, X, LogOut } from 'lucide-react';

interface LockScreenModalProps {
  isOpen: boolean;
  users: User[];
  currentUser: User;
  onSelectUser: (user: User) => void;
  onSignOut: () => void;
  onClose: () => void;
}

export const LockScreenModal: React.FC<LockScreenModalProps> = ({
  isOpen,
  users,
  currentUser,
  onSelectUser,
  onSignOut,
  onClose
}) => {
  const [selectedUser, setSelectedUser] = useState<User>(currentUser);
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const handleKeyPress = (digit: string) => {
    if (pin.length < 6) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError('');
      if (nextPin.length >= 4 && nextPin === selectedUser.pin) {
        verifyPin(nextPin, selectedUser);
      }
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setError('');
  };

  const handleClear = () => {
    setPin('');
    setError('');
  };

  const verifyPin = (inputPin: string, userToVerify: User) => {
    if (inputPin === userToVerify.pin || (userToVerify.password && inputPin === userToVerify.password)) {
      onSelectUser(userToVerify);
      setPin('');
      setError('');
      onClose();
    } else {
      setError('Incorrect PIN. Authorization denied.');
      setPin('');
    }
  };

  const handleManualUnlock = () => {
    verifyPin(pin, selectedUser);
  };

  const handleSelect = (u: User) => {
    setSelectedUser(u);
    setPin('');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-emerald-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Terminal Locked</h3>
              <p className="text-xs text-slate-400">Enter PIN to authorize access</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Active Operators list */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2 block">
              Authorized System Operators
            </label>
            <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
              {users.filter(u => u.active).map(u => {
                const isSelected = u.id === selectedUser.id;
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleSelect(u)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                        u.role === 2 ? 'bg-purple-100 text-purple-700' :
                        u.role === 1 ? 'bg-blue-100 text-blue-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        {u.workerId}
                      </div>
                      <div>
                        <div className="font-semibold text-xs text-slate-900 flex items-center gap-2">
                          {u.fullName}
                          {u.id === currentUser.id && (
                            <span className="text-[10px] font-normal text-slate-500">(Active)</span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500">{getRoleName(u.role)}</div>
                      </div>
                    </div>
                    {isSelected && <UserCheck className="w-4 h-4 text-emerald-600" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* PIN Input Display */}
          <div className="text-center">
            <div className="text-xs text-slate-600 mb-2">
              Enter PIN for <strong className="text-slate-900">{selectedUser.fullName}</strong>
            </div>
            <div className="flex items-center justify-center gap-3 my-2">
              {[0, 1, 2, 3].map(index => (
                <div
                  key={index}
                  className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-150 ${
                    pin.length > index
                      ? 'bg-emerald-600 border-emerald-600 scale-110'
                      : 'border-slate-300 bg-slate-100'
                  }`}
                />
              ))}
            </div>
            {error && <p className="text-xs text-rose-600 mt-1 font-semibold">{error}</p>}
          </div>

          {/* Numeric Keypad */}
          <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(digit => (
              <button
                key={digit}
                type="button"
                onClick={() => handleKeyPress(digit)}
                className="h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-lg transition-colors active:scale-95"
              >
                {digit}
              </button>
            ))}
            <button
              type="button"
              onClick={handleClear}
              className="h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold transition-colors"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => handleKeyPress('0')}
              className="h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-lg transition-colors active:scale-95"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              className="h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold transition-colors"
            >
              ⌫
            </button>
          </div>

          {/* Bottom Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => {
                onSignOut();
                onClose();
              }}
              className="text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out Completely</span>
            </button>

            <button
              type="button"
              onClick={handleManualUnlock}
              disabled={pin.length < 4}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold disabled:opacity-40"
            >
              Unlock
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
