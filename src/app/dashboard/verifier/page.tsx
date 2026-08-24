'use client';

import React, { useState, useEffect } from 'react';
import { store } from '@/lib/store';
import { UserProfile, Organization, GateLocation, VerificationResult, VerificationLog } from '@/lib/types';
import { verifyQRToken, createSignedQRToken } from '@/lib/crypto';
import { QRScannerModal } from '@/components/QRScannerModal';
import { VerificationResultModal } from '@/components/VerificationResultModal';
import { 
  ScanLine, 
  ShieldCheck, 
  MapPin, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ShieldAlert, 
  KeyRound, 
  Search, 
  Camera, 
  AlertTriangle, 
  ListFilter,
  Users,
  Activity,
  Lock
} from 'lucide-react';

export default function VerifierDashboard() {
  const [currentUser, setCurrentUser] = useState<UserProfile>(store.getCurrentUser());
  const [org, setOrg] = useState<Organization>(store.getOrganization());
  const [activeGate, setActiveGate] = useState<GateLocation>(store.getActiveGate());
  const [recentLogs, setRecentLogs] = useState<VerificationLog[]>([]);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [lastResult, setLastResult] = useState<VerificationResult | null>(null);
  const [searchMemberId, setSearchMemberId] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'VALID' | 'FAIL'>('ALL');

  useEffect(() => {
    const refresh = () => {
      const user = store.getCurrentUser();
      setCurrentUser(user);
      setOrg(store.getOrganization());
      setActiveGate(store.getActiveGate());
      setRecentLogs(store.getVerificationLogs());
    };

    refresh();
    const unsub = store.subscribe(refresh);
    return unsub;
  }, []);

  const handleSelectGate = (gate: GateLocation) => {
    setActiveGate(gate);
    store.setActiveGate(gate);
  };

  // Perform cryptographic verification on scanned token string
  const handleVerifyScannedToken = async (tokenString: string) => {
    setIsScannerOpen(false);

    const result = await verifyQRToken(
      tokenString,
      (id) => store.getUserById(id),
      activeGate
    );

    setLastResult(result);

    // If verification succeeded without needing OTP or was rejected, write to audit log immediately
    if (result.result !== 'OTP_REQUIRED') {
      store.addVerificationLog({
        userId: result.profile?.id || 'unknown',
        userName: result.profile?.fullName || 'Unrecognized / Tampered Token',
        memberNumber: result.profile?.memberNumber || 'N/A',
        verifierId: currentUser.id,
        verifierName: currentUser.fullName,
        orgId: org.id,
        result: result.result === 'VALID' ? 'VALID' : (result.result as any),
        reason: result.reason,
        locationTag: activeGate.name,
      });
    }
  };

  // Manual lookup by member ID
  const handleManualLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchMemberId.trim()) return;

    const users = store.getUsers();
    const found = users.find(
      (u) =>
        u.memberNumber.toLowerCase() === searchMemberId.trim().toLowerCase() ||
        u.email.toLowerCase() === searchMemberId.trim().toLowerCase()
    );

    if (found) {
      const { token } = await createSignedQRToken(found, org.qrRotationSeconds || 60);
      handleVerifyScannedToken(token);
    } else {
      const failedResult: VerificationResult = {
        result: 'NOT_FOUND',
        isValid: false,
        reason: `Member ID or Email "${searchMemberId}" was not found in directory.`,
        timestamp: new Date().toISOString(),
      };
      setLastResult(failedResult);
      store.addVerificationLog({
        userId: 'unknown',
        userName: `Query: ${searchMemberId}`,
        memberNumber: searchMemberId,
        verifierId: currentUser.id,
        verifierName: currentUser.fullName,
        orgId: org.id,
        result: 'NOT_FOUND',
        reason: failedResult.reason,
        locationTag: activeGate.name,
      });
    }
    setSearchMemberId('');
  };

  // Quick Preset Simulator Buttons
  const handleSimulateCheck = async (type: 'active' | 'expired' | 'revoked' | 'tampered') => {
    const users = store.getUsers();
    if (type === 'active') {
      const user = users.find((u) => u.status === 'active' && u.role === 'user') || users[2];
      const { token } = await createSignedQRToken(user, 60);
      handleVerifyScannedToken(token);
    } else if (type === 'expired') {
      const user = users.find((u) => u.status === 'expired') || users[3];
      const { token } = await createSignedQRToken(user, 60);
      handleVerifyScannedToken(token);
    } else if (type === 'revoked') {
      const user = users.find((u) => u.status === 'revoked') || users[4];
      const { token } = await createSignedQRToken(user, 60);
      handleVerifyScannedToken(token);
    } else if (type === 'tampered') {
      const user = users[2];
      const { token } = await createSignedQRToken(user, 60);
      const rawDecoded = atob(token);
      const parsed = JSON.parse(rawDecoded);
      parsed.sig = 'FORGED_TAMPERED_HASH_SAMPLE';
      const tamperedToken = btoa(JSON.stringify(parsed));
      handleVerifyScannedToken(tamperedToken);
    }
  };

  // Verification Stats for current session
  const totalScans = recentLogs.length;
  const passedScans = recentLogs.filter((l) => l.result === 'VALID').length;
  const failedScans = totalScans - passedScans;
  const passRate = totalScans > 0 ? Math.round((passedScans / totalScans) * 100) : 100;

  const filteredLogs = recentLogs.filter((log) => {
    if (statusFilter === 'VALID') return log.result === 'VALID';
    if (statusFilter === 'FAIL') return log.result !== 'VALID';
    return true;
  });

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Gate Checkpoint Selector Bar */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Gate Verifier Console
              </span>
              {activeGate.highSecurity && (
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> High-Security (2FA OTP Enabled)
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-indigo-400" />
              <span>{activeGate.name}</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">{activeGate.description}</p>
          </div>

          {/* Gate Selector Dropdown */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-400">Switch Gate:</span>
            <select
              value={activeGate.id}
              onChange={(e) => {
                const found = org.allowedGates.find((g) => g.id === e.target.value);
                if (found) handleSelectGate(found);
              }}
              className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-semibold text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              {org.allowedGates.map((gate) => (
                <option key={gate.id} value={gate.id}>
                  {gate.name} {gate.highSecurity ? '🔒 (2FA)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Real-time KPI Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Total Scanned</span>
              <Activity className="w-4 h-4 text-cyan-400" />
            </div>
            <p className="text-2xl font-extrabold text-white">{totalScans}</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Access Granted</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-extrabold text-emerald-400">{passedScans}</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Refused / Tampered</span>
              <XCircle className="w-4 h-4 text-rose-400" />
            </div>
            <p className="text-2xl font-extrabold text-rose-400">{failedScans}</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Verification Pass Rate</span>
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
            </div>
            <p className="text-2xl font-extrabold text-indigo-300">{passRate}%</p>
          </div>
        </div>

        {/* MAIN SCANNER TRIGGER SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Big Scanner Button & Manual Search */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-8 rounded-3xl bg-gradient-to-b from-slate-900 via-indigo-950/40 to-slate-900 border border-cyan-500/30 text-center space-y-4 shadow-xl relative overflow-hidden">
              <div className="w-20 h-20 rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center justify-center mx-auto shadow-lg shadow-cyan-500/20 animate-pulse">
                <ScanLine className="w-10 h-10" />
              </div>

              <div>
                <h2 className="text-xl font-black text-white">Scan Member Dynamic QR</h2>
                <p className="text-xs text-slate-300 mt-1 max-w-xs mx-auto">
                  Activate camera reticle to verify incoming students, delegates, and staff in under 2 seconds.
                </p>
              </div>

              <button
                onClick={() => setIsScannerOpen(true)}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-cyan-500 hover:from-cyan-400 hover:to-indigo-500 text-white font-black text-sm shadow-xl shadow-cyan-500/30 flex items-center justify-center gap-2.5 transition-all transform hover:scale-[1.02]"
              >
                <Camera className="w-5 h-5" />
                <span>Launch Camera Scanner</span>
              </button>
            </div>

            {/* Manual Lookup Card */}
            <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-indigo-400" />
                <span>Manual Member Search / ID Verification</span>
              </h3>

              <form onSubmit={handleManualLookup} className="flex gap-2">
                <input
                  type="text"
                  value={searchMemberId}
                  onChange={(e) => setSearchMemberId(e.target.value)}
                  placeholder="e.g. STU-2026-0941 or alex@techverse.edu"
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition"
                >
                  Lookup
                </button>
              </form>
            </div>

            {/* Fast 1-Click Verification Test Buttons */}
            <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>1-Click Test Scenarios</span>
                </h3>
                <span className="text-[10px] text-slate-500 font-mono">No Camera Needed</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleSimulateCheck('active')}
                  className="p-2.5 rounded-xl bg-slate-950 border border-emerald-500/30 hover:border-emerald-500/60 text-left transition"
                >
                  <p className="text-xs font-bold text-emerald-300">Active Member</p>
                  <p className="text-[10px] text-slate-500">Alex Rivera (Pass)</p>
                </button>

                <button
                  onClick={() => handleSimulateCheck('expired')}
                  className="p-2.5 rounded-xl bg-slate-950 border border-amber-500/30 hover:border-amber-500/60 text-left transition"
                >
                  <p className="text-xs font-bold text-amber-300">Expired ID</p>
                  <p className="text-[10px] text-slate-500">Jordan Blake (Expired)</p>
                </button>

                <button
                  onClick={() => handleSimulateCheck('revoked')}
                  className="p-2.5 rounded-xl bg-slate-950 border border-rose-500/30 hover:border-rose-500/60 text-left transition"
                >
                  <p className="text-xs font-bold text-rose-300">Revoked Badge</p>
                  <p className="text-[10px] text-slate-500">Sam Taylor (Revoked)</p>
                </button>

                <button
                  onClick={() => handleSimulateCheck('tampered')}
                  className="p-2.5 rounded-xl bg-slate-950 border border-purple-500/30 hover:border-purple-500/60 text-left transition"
                >
                  <p className="text-xs font-bold text-purple-300">Tampered Forgery</p>
                  <p className="text-[10px] text-slate-500">Bad Signature (Fail)</p>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Live Gate Verification Log Stream */}
          <div className="lg:col-span-7 space-y-4">
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <span>Real-Time Gate Audit Stream</span>
                </h3>
                <p className="text-xs text-slate-400">Showing live scans at {activeGate.name}</p>
              </div>

              {/* Filter Pills */}
              <div className="flex gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px] font-semibold">
                <button
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-2 py-0.5 rounded transition ${statusFilter === 'ALL' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  All ({recentLogs.length})
                </button>
                <button
                  onClick={() => setStatusFilter('VALID')}
                  className={`px-2 py-0.5 rounded transition ${statusFilter === 'VALID' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Passed
                </button>
                <button
                  onClick={() => setStatusFilter('FAIL')}
                  className={`px-2 py-0.5 rounded transition ${statusFilter === 'FAIL' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Failed
                </button>
              </div>
            </div>

            {/* Stream List */}
            <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
              {filteredLogs.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-500 text-xs">
                  No verification events recorded yet.
                </div>
              ) : (
                filteredLogs.map((log) => {
                  const isPass = log.result === 'VALID';
                  return (
                    <div
                      key={log.id}
                      className={`p-4 rounded-xl border transition flex items-start justify-between gap-3 ${
                        isPass
                          ? 'bg-slate-900/90 border-emerald-500/30 hover:border-emerald-500/60'
                          : 'bg-slate-900/90 border-rose-500/30 hover:border-rose-500/60'
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                            isPass ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                          }`}
                        >
                          {isPass ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-white truncate">{log.userName}</h4>
                            <span className="text-[10px] font-mono text-slate-400">{log.memberNumber}</span>
                          </div>

                          <p className="text-[11px] text-slate-400 mt-0.5">{log.reason}</p>

                          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono mt-1.5">
                            <span className="text-indigo-400 font-semibold">{log.locationTag}</span>
                            <span>•</span>
                            <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                            <span>•</span>
                            <span>by {log.verifierName}</span>
                          </div>
                        </div>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase flex-shrink-0 ${
                          isPass
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {log.result}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Live Camera Scanner Modal */}
        <QRScannerModal
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          onScanSuccess={handleVerifyScannedToken}
          activeGate={activeGate}
        />

        {/* Verification Result Pass/Fail HUD Modal */}
        <VerificationResultModal
          result={lastResult}
          gate={activeGate}
          onClose={() => setLastResult(null)}
          onScanNext={() => {
            setLastResult(null);
            setIsScannerOpen(true);
          }}
        />
      </div>
    </div>
  );
}
