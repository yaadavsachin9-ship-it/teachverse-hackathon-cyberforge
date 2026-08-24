'use client';

import React, { useState } from 'react';
import { verifyQRToken } from '@/lib/crypto';
import { store } from '@/lib/store';
import { VerificationResult } from '@/lib/types';
import { Shield, Sparkles, CheckCircle2, XCircle, Search, Building2, Calendar, Lock } from 'lucide-react';

export default function PublicVerifyPage() {
  const [tokenInput, setTokenInput] = useState('');
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;

    setHasSearched(true);
    const res = await verifyQRToken(
      tokenInput.trim(),
      (id) => store.getUserById(id)
    );
    setResult(res);
  };

  return (
    <div className="min-h-[85vh] py-12 px-4 bg-[#090d16] text-slate-100 flex flex-col items-center">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Public Authenticity Validation Portal</span>
          </div>
          <h1 className="text-3xl font-black text-white">Verify SecureID Credential</h1>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Validate the cryptographic HMAC-SHA256 signature of any digital ID card or issued certificate.
          </p>
        </div>

        {/* Search / Token Input Form */}
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 backdrop-blur-xl shadow-2xl">
          <form onSubmit={handleVerify} className="space-y-3">
            <label className="block text-xs font-semibold text-slate-300">
              Paste Encrypted QR Token / Signature Nonce:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                required
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Paste base64 encoded token or JSON payload..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs shadow-md transition"
              >
                Validate
              </button>
            </div>
          </form>
        </div>

        {/* Verification Proof Result Card */}
        {hasSearched && result && (
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-4 animate-in fade-in">
            <div
              className={`p-4 rounded-2xl border flex items-start gap-4 ${
                result.isValid
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : 'bg-rose-500/10 border-rose-500/30'
              }`}
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  result.isValid ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                }`}
              >
                {result.isValid ? <CheckCircle2 className="w-7 h-7" /> : <XCircle className="w-7 h-7" />}
              </div>

              <div>
                <h3
                  className={`text-base font-extrabold uppercase tracking-wide ${
                    result.isValid ? 'text-emerald-300' : 'text-rose-300'
                  }`}
                >
                  {result.isValid ? 'Cryptographically Authentic Credential' : 'Invalid or Tampered Credential'}
                </h3>
                <p className="text-xs text-slate-300 mt-1">{result.reason}</p>
              </div>
            </div>

            {result.profile && (
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3 text-xs">
                <div className="flex items-center gap-3">
                  <img
                    src={result.profile.photoUrl}
                    alt={result.profile.fullName}
                    className="w-12 h-12 rounded-xl object-cover ring-2 ring-indigo-500/40"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-white">{result.profile.fullName}</h4>
                    <p className="text-[11px] font-mono text-indigo-400">{result.profile.memberNumber}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-slate-300">
                  <p><strong className="text-slate-400">Department:</strong> {result.profile.department}</p>
                  <p><strong className="text-slate-400">Role:</strong> {result.profile.role.toUpperCase()}</p>
                  <p><strong className="text-slate-400">Valid From:</strong> {result.profile.validFrom}</p>
                  <p><strong className="text-slate-400">Valid Until:</strong> {result.profile.validUntil}</p>
                </div>

                <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-500 font-mono flex items-center justify-between">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <Lock className="w-3 h-3" /> Signature Verified
                  </span>
                  <span>Timestamp: {new Date(result.timestamp).toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
