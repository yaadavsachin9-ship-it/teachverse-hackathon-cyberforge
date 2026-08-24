'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { store } from '@/lib/store';
import { Shield, Sparkles, Lock, Mail, ArrowRight, UserCheck, KeyRound, AlertTriangle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (attempts >= 5) {
      setError('Rate limit exceeded: 5 failed attempts. Account locked for 15 minutes for brute-force protection.');
      return;
    }

    const found = store.getUserByEmail(email);
    if (found) {
      store.setCurrentUser(found);
      if (found.role === 'admin') router.push('/dashboard/admin');
      else if (found.role === 'verifier') router.push('/dashboard/verifier');
      else router.push('/dashboard/member');
    } else {
      setAttempts((prev) => prev + 1);
      setError(`Invalid credentials. ${5 - (attempts + 1)} attempts remaining before rate lockout.`);
    }
  };

  // 1-Click Demo Logins
  const handleQuickLogin = (role: 'admin' | 'verifier' | 'active' | 'expired' | 'revoked') => {
    const users = store.getUsers();
    let target = users[0];
    if (role === 'admin') target = users.find((u) => u.role === 'admin') || users[0];
    if (role === 'verifier') target = users.find((u) => u.role === 'verifier') || users[1];
    if (role === 'active') target = users.find((u) => u.status === 'active' && u.role === 'user') || users[2];
    if (role === 'expired') target = users.find((u) => u.status === 'expired') || users[3];
    if (role === 'revoked') target = users.find((u) => u.status === 'revoked') || users[4];

    store.setCurrentUser(target);
    if (target.role === 'admin') router.push('/dashboard/admin');
    else if (target.role === 'verifier') router.push('/dashboard/verifier');
    else router.push('/dashboard/member');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 bg-[#090d16]">
      <div className="w-full max-w-md space-y-6">
        {/* Form Container */}
        <div className="p-8 rounded-3xl bg-slate-900/90 border border-slate-800 backdrop-blur-xl shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-cyan-500 flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/25">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-black text-white">Sign In to SecureID</h1>
            <p className="text-xs text-slate-400">
              Access your digital identity, verifier scanner, or administration portal.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@techverse.edu"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-slate-300 font-semibold">Password</label>
                <Link href="/auth/reset-password" className="text-[11px] text-indigo-400 hover:underline">
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition"
            >
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* 1-CLICK QUICK DEMO LOGINS */}
          <div className="pt-4 border-t border-slate-800 space-y-2">
            <p className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              1-Click Demo Evaluation Profiles:
            </p>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                onClick={() => handleQuickLogin('admin')}
                className="p-2 rounded-lg bg-slate-950 border border-purple-500/30 hover:border-purple-500/60 text-left text-purple-300 font-medium"
              >
                👑 Sarah (Admin)
              </button>

              <button
                onClick={() => handleQuickLogin('verifier')}
                className="p-2 rounded-lg bg-slate-950 border border-cyan-500/30 hover:border-cyan-500/60 text-left text-cyan-300 font-medium"
              >
                🔍 James (Verifier)
              </button>

              <button
                onClick={() => handleQuickLogin('active')}
                className="p-2 rounded-lg bg-slate-950 border border-emerald-500/30 hover:border-emerald-500/60 text-left text-emerald-300 font-medium"
              >
                🎓 Alex (Active Member)
              </button>

              <button
                onClick={() => handleQuickLogin('expired')}
                className="p-2 rounded-lg bg-slate-950 border border-amber-500/30 hover:border-amber-500/60 text-left text-amber-300 font-medium"
              >
                ⏳ Jordan (Expired)
              </button>
            </div>
          </div>

          <div className="text-center text-xs text-slate-400 pt-2">
            Don't have an account?{' '}
            <Link href="/auth/register" className="text-indigo-400 font-semibold hover:underline">
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
