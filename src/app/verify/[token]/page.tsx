'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { verifyQRToken } from '@/lib/crypto';
import { store } from '@/lib/store';
import { VerificationResult } from '@/lib/types';
import { Shield, Sparkles, CheckCircle2, XCircle, Building2, Calendar, Lock } from 'lucide-react';
import Link from 'next/link';

export default function DirectTokenVerifyPage() {
  const params = useParams();
  const rawToken = params?.token as string;
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!rawToken) return;

    const runCheck = async () => {
      setLoading(true);
      try {
        const decodedToken = decodeURIComponent(rawToken);
        const res = await verifyQRToken(decodedToken, (id) => store.getUserById(id));
        setResult(res);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    runCheck();
  }, [rawToken]);

  return (
    <div className="min-h-[85vh] py-12 px-4 bg-[#090d16] text-slate-100 flex flex-col items-center justify-center">
      <div className="w-full max-w-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Digital Certificate & ID Authentication</span>
          </div>
          <h1 className="text-2xl font-black text-white">Verification Status</h1>
        </div>

        {loading ? (
          <div className="p-12 text-center rounded-3xl bg-slate-900/80 border border-slate-800 animate-pulse">
            <Shield className="w-10 h-10 text-indigo-400 mx-auto animate-spin" />
            <p className="text-xs text-slate-400 mt-3">Validating HMAC-SHA256 Cryptographic Signature...</p>
          </div>
        ) : result ? (
          <div className="p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-4">
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
                  {result.isValid ? 'Valid & Genuine Identity' : 'Verification Refusal'}
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

                <div className="grid grid-cols-2 gap-2 text-slate-300 pt-2 border-t border-slate-800">
                  <p><strong className="text-slate-400">Department:</strong> {result.profile.department}</p>
                  <p><strong className="text-slate-400">Role:</strong> {result.profile.role.toUpperCase()}</p>
                  <p><strong className="text-slate-400">Status:</strong> <span className="uppercase font-bold text-emerald-300">{result.profile.status}</span></p>
                  <p><strong className="text-slate-400">Valid Until:</strong> {result.profile.validUntil}</p>
                </div>
              </div>
            )}

            <div className="pt-2 text-center">
              <Link
                href="/"
                className="text-xs text-indigo-400 font-semibold hover:underline"
              >
                Return to SecureID Platform
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
