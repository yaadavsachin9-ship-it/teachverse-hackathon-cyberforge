'use client';

import React, { useState, useEffect } from 'react';
import { VerificationResult, UserProfile, GateLocation } from '@/lib/types';
import { store } from '@/lib/store';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ShieldAlert, 
  ShieldCheck, 
  Clock, 
  KeyRound, 
  Building2, 
  Calendar, 
  User, 
  Sparkles, 
  ArrowRight,
  Send,
  Lock
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface VerificationResultModalProps {
  result: VerificationResult | null;
  gate: GateLocation;
  onClose: () => void;
  onScanNext: () => void;
}

export function VerificationResultModal({ result, gate, onClose, onScanNext }: VerificationResultModalProps) {
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState('');
  const [isOtpSuccess, setIsOtpSuccess] = useState(false);
  const [simulatedOtpSent, setSimulatedOtpSent] = useState<string | null>(null);

  useEffect(() => {
    if (result?.isValid) {
      // Trigger festive confetti celebration on valid verification
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#06b6d4', '#6366f1', '#3b82f6'],
        });
      } catch (e) {
        console.error(e);
      }
    }

    // If OTP required, create simulation challenge
    if (result?.result === 'OTP_REQUIRED' && result.profile) {
      const verifier = store.getCurrentUser();
      const challenge = store.createOTPChallenge(result.profile.id, gate.id, verifier.id);
      setSimulatedOtpSent(challenge.code);
    }
  }, [result]);

  if (!result) return null;

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!result.profile) return;

    const res = store.verifyOTPChallenge(result.profile.id, otpInput);
    if (res.success) {
      setIsOtpSuccess(true);
      setOtpError('');
      // Log successful verification with OTP verified metadata
      const verifier = store.getCurrentUser();
      store.addVerificationLog({
        userId: result.profile.id,
        userName: result.profile.fullName,
        memberNumber: result.profile.memberNumber,
        verifierId: verifier.id,
        verifierName: verifier.fullName,
        orgId: result.profile.orgId,
        result: 'VALID',
        reason: `Secondary 2FA OTP Verified successfully for high-security gate "${gate.name}".`,
        locationTag: gate.name,
      });

      try {
        confetti({ particleCount: 90, spread: 80, origin: { y: 0.5 } });
      } catch (e) {}
    } else {
      setOtpError(res.message);
    }
  };

  const isSuccess = result.isValid || isOtpSuccess;
  const isOtpPending = result.result === 'OTP_REQUIRED' && !isOtpSuccess;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden">
        {/* Top Status Header Banner */}
        <div
          className={`p-5 text-center transition-colors ${
            isSuccess
              ? 'bg-gradient-to-b from-emerald-600/30 via-emerald-900/20 to-transparent border-b border-emerald-500/30'
              : isOtpPending
              ? 'bg-gradient-to-b from-amber-600/30 via-amber-900/20 to-transparent border-b border-amber-500/30'
              : 'bg-gradient-to-b from-rose-600/30 via-rose-900/20 to-transparent border-b border-rose-500/30'
          }`}
        >
          <div className="flex justify-center mb-3">
            {isSuccess ? (
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/30 animate-bounce">
                <CheckCircle2 className="w-9 h-9 text-emerald-400" />
              </div>
            ) : isOtpPending ? (
              <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/30">
                <KeyRound className="w-9 h-9 text-amber-400 animate-pulse" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-rose-500/20 border-2 border-rose-400 flex items-center justify-center shadow-lg shadow-rose-500/30">
                <XCircle className="w-9 h-9 text-rose-400" />
              </div>
            )}
          </div>

          <h3
            className={`text-xl font-extrabold tracking-tight ${
              isSuccess ? 'text-emerald-300' : isOtpPending ? 'text-amber-300' : 'text-rose-300'
            }`}
          >
            {isSuccess
              ? 'ACCESS GRANTED • IDENTITY VERIFIED'
              : isOtpPending
              ? '2FA OTP CHALLENGE REQUIRED'
              : 'ACCESS DENIED • VERIFICATION FAILED'}
          </h3>

          <p className="text-xs text-slate-300 mt-1 max-w-md mx-auto">{result.reason}</p>
        </div>

        {/* Member Profile Details & Inspection */}
        {result.profile && (
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-4 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <img
                src={result.profile.photoUrl}
                alt={result.profile.fullName}
                className="w-16 h-16 rounded-xl object-cover ring-2 ring-indigo-500/40 shadow"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-bold text-white truncate">{result.profile.fullName}</h4>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase ${
                      result.profile.status === 'active'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    }`}
                  >
                    {result.profile.status}
                  </span>
                </div>

                <p className="text-xs font-mono text-indigo-300 font-semibold mt-0.5">
                  ID: {result.profile.memberNumber} • {result.profile.role.toUpperCase()}
                </p>
                <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-500" />
                  {result.profile.department}
                </p>
              </div>
            </div>

            {/* Checkpoint Meta Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-750">
                <span className="text-slate-500 block text-[10px]">Gate Checkpoint:</span>
                <span className="font-semibold text-slate-200">{gate.name}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-750">
                <span className="text-slate-500 block text-[10px]">Validity Period:</span>
                <span className="font-mono text-slate-200 text-[11px]">
                  {result.profile.validFrom} → {result.profile.validUntil}
                </span>
              </div>
            </div>

            {/* OTP Form (If Gate Requires 2FA) */}
            {isOtpPending && (
              <form onSubmit={handleVerifyOtp} className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-amber-200">Secondary Gate Authorization</span>
                  </div>
                  {simulatedOtpSent && (
                    <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                      Simulated SMS/Email Code: <strong className="text-amber-100">{simulatedOtpSent}</strong>
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-300">
                  Enter the 6-digit OTP sent to {result.profile.phone || result.profile.email} to confirm physical presence.
                </p>

                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value)}
                    placeholder="Enter 6-digit OTP"
                    className="flex-1 px-3 py-2 rounded-lg bg-slate-900 border border-amber-500/50 text-white font-mono text-center tracking-widest text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-md flex items-center gap-1.5"
                  >
                    <span>Authorize</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {otpError && <p className="text-xs text-rose-400 font-medium">{otpError}</p>}
              </form>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950/70 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-medium transition"
          >
            Dismiss
          </button>

          <button
            onClick={onScanNext}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-600/30"
          >
            <span>Scan Next Member</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
