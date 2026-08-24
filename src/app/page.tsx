'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Shield, 
  QrCode, 
  ScanLine, 
  LayoutDashboard, 
  CheckCircle2, 
  Lock, 
  Sparkles, 
  ArrowRight, 
  FileText, 
  ShieldAlert, 
  Smartphone, 
  Database, 
  Fingerprint, 
  Award, 
  KeyRound,
  Users,
  ChevronRight
} from 'lucide-react';
import { store } from '@/lib/store';
import { UserProfile, Organization } from '@/lib/types';
import { DigitalIdCard } from '@/components/DigitalIdCard';

export default function LandingPage() {
  const [currentUser, setCurrentUser] = useState<UserProfile>(store.getCurrentUser());
  const [org, setOrg] = useState<Organization>(store.getOrganization());

  useEffect(() => {
    setCurrentUser(store.getCurrentUser());
    setOrg(store.getOrganization());
    const unsub = store.subscribe(() => {
      setCurrentUser(store.getCurrentUser());
      setOrg(store.getOrganization());
    });
    return unsub;
  }, []);

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 overflow-hidden">
      {/* Background Neon Gradients */}
      <div className="relative">
        <div className="absolute top-[-100px] left-1/2 transform -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-tr from-indigo-600/20 via-cyan-500/15 to-purple-600/20 blur-[130px] pointer-events-none"></div>

        {/* HERO SECTION */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 relative z-10">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            {/* Top Tag */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold shadow-lg shadow-indigo-500/10">
              <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} />
              <span>Next-Gen Tamper-Proof Identity Verification</span>
              <span className="bg-indigo-600 text-white text-[10px] font-mono px-1.5 py-0.2 rounded font-bold">
                PRD v1.0
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-[1.15]">
              Real-Time Digital Identity &{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-cyan-300 to-purple-400">
                Gate Verification
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Eliminate paper badges and forged credentials. SecureID equips colleges, clubs, and events with dynamically signed QR cards, 2-second camera gate verification, and immutable audit trails.
            </p>

            {/* Hero CTAs */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
              <Link
                href="/dashboard/member"
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-sm font-bold flex items-center gap-2 shadow-xl shadow-indigo-600/30 hover:scale-105 transition-all"
              >
                <QrCode className="w-4 h-4" />
                <span>Open Digital ID Wallet</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/dashboard/verifier"
                className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-bold flex items-center gap-2 border border-slate-700 hover:border-slate-600 transition"
              >
                <ScanLine className="w-4 h-4 text-cyan-400" />
                <span>Launch Gate Scanner</span>
              </Link>

              <Link
                href="/dashboard/admin"
                className="px-6 py-3 rounded-xl bg-purple-950/50 hover:bg-purple-900/50 text-purple-200 text-sm font-bold flex items-center gap-2 border border-purple-800/60 transition"
              >
                <LayoutDashboard className="w-4 h-4 text-purple-400" />
                <span>Admin Operations</span>
              </Link>
            </div>
          </div>

          {/* INTERACTIVE DEMO PREVIEW CONTAINER */}
          <div className="mt-14 max-w-5xl mx-auto p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left Column: Interactive 3D Card */}
              <div className="lg:col-span-6 flex flex-col items-center">
                <div className="w-full flex items-center justify-between mb-3 px-1 text-xs">
                  <span className="font-bold text-slate-300 flex items-center gap-1.5">
                    <Fingerprint className="w-4 h-4 text-indigo-400" />
                    Interactive Smart ID Card:
                  </span>
                  <span className="text-cyan-400 font-mono text-[11px]">Click Card to Flip 3D Face</span>
                </div>

                <DigitalIdCard user={currentUser} org={org} />
              </div>

              {/* Right Column: Platform Core Highlights */}
              <div className="lg:col-span-6 space-y-4">
                <div className="inline-block px-3 py-1 rounded-md bg-cyan-500/10 text-cyan-300 text-xs font-mono font-semibold border border-cyan-500/30">
                  ⚡ INSTANT LIVE VERIFICATION
                </div>

                <h2 className="text-2xl font-bold text-white tracking-tight">
                  Cryptographically Signed Dynamic QR Engine
                </h2>

                <p className="text-sm text-slate-300 leading-relaxed">
                  Every member profile encodes an anti-replay, HMAC-SHA256 signed payload that rotates continuously. Static screenshot fraud is impossible, and gate verifiers validate credentials in sub-2-second responses.
                </p>

                <div className="space-y-2.5 pt-2">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 mt-0.5">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div className="text-xs">
                      <p className="font-bold text-white">Sub-2s Real-Time Gate Scan</p>
                      <p className="text-slate-400">High-FPS camera reticle scanner with instant pass/fail HUD audio & visual feedback.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 mt-0.5">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <div className="text-xs">
                      <p className="font-bold text-white">High-Security Gate 2FA OTP</p>
                      <p className="text-slate-400">Optional second-factor presence confirmation for VIP & restricted zones.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400 mt-0.5">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="text-xs">
                      <p className="font-bold text-white">Immutable Audit Trail & CSV Export</p>
                      <p className="text-slate-400">100% append-only audit logging of every scan attempt with verifier ID & gate stamps.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* THREE ROLES & PERSONAS GRID */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-slate-800/80">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-mono uppercase tracking-widest text-indigo-400 font-bold mb-2">
              Role-Based Access Control
            </h2>
            <h3 className="text-3xl font-extrabold text-white tracking-tight">
              Tailored Experiences for Every Stakeholder
            </h3>
            <p className="text-sm text-slate-400 mt-2">
              Enforced at the Postgres Row-Level Security (RLS) layer across all endpoints.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Member Card */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-indigo-500/30 flex flex-col justify-between hover:border-indigo-500/60 transition group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4 group-hover:scale-110 transition">
                  <Smartphone className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-white mb-2">Member / User Portal</h4>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Access 3D digital wallet ID card with rotating QR, download wallet-ready PNG/PDF credentials, unlock verifiable event certificates, and view your personal access log history.
                </p>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Dynamic anti-fraud rotating QR</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>One-click PDF & PNG ID Card download</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Certificate Locker & Verification History</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/dashboard/member"
                className="mt-6 flex items-center justify-between p-3 rounded-xl bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 text-xs font-bold transition border border-indigo-800/40"
              >
                <span>Enter Member Dashboard</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Verifier Card */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-cyan-500/30 flex flex-col justify-between hover:border-cyan-500/60 transition group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-4 group-hover:scale-110 transition">
                  <ScanLine className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-white mb-2">Gate Verifier Console</h4>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Designed for volunteers and security personnel at venue gates. Scan QR codes at high speed, trigger 2FA OTP validation, and tag checkpoints with zero friction.
                </p>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Live camera stream & laser reticle</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Instant audio/visual Pass/Fail HUD</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>High-security OTP 2FA challenge flow</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/dashboard/verifier"
                className="mt-6 flex items-center justify-between p-3 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 text-xs font-bold transition border border-cyan-800/40"
              >
                <span>Launch Gate Scanner</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Admin Card */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-purple-500/30 flex flex-col justify-between hover:border-purple-500/60 transition group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-4 group-hover:scale-110 transition">
                  <LayoutDashboard className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-white mb-2">Admin Operations Center</h4>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Comprehensive management suite: issue/revoke IDs in real time, view live throughput analytics, issue branded digital certificates, and export audit logs.
                </p>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                    <span>Real-time Member Directory & Status Toggles</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                    <span>Certificate Studio & PDF issuance</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                    <span>Immutable logs with CSV export</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/dashboard/admin"
                className="mt-6 flex items-center justify-between p-3 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 text-purple-300 text-xs font-bold transition border border-purple-800/40"
              >
                <span>Open Admin Center</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* PRD SPECIFICATION COMPLIANCE BADGES */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-slate-800">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800">
              <p className="text-2xl font-black text-indigo-400">&lt; 2.0s</p>
              <p className="text-xs text-slate-400 mt-1">Verification Latency SLA</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800">
              <p className="text-2xl font-black text-cyan-400">HMAC-256</p>
              <p className="text-xs text-slate-400 mt-1">Anti-Forgery Signature</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800">
              <p className="text-2xl font-black text-emerald-400">100%</p>
              <p className="text-xs text-slate-400 mt-1">Immutable Audit Logging</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800">
              <p className="text-2xl font-black text-purple-400">RLS RBAC</p>
              <p className="text-xs text-slate-400 mt-1">Postgres Level Security</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
