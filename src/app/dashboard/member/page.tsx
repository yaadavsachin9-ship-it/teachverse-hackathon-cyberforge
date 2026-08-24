'use client';

import React, { useState, useEffect } from 'react';
import { store } from '@/lib/store';
import { UserProfile, Organization, Certificate, VerificationLog } from '@/lib/types';
import { DigitalIdCard } from '@/components/DigitalIdCard';
import { CertificateModal } from '@/components/CertificateModal';
import { 
  QrCode, 
  Award, 
  History, 
  UserCheck, 
  ShieldAlert, 
  Clock, 
  Building2, 
  Calendar, 
  Phone, 
  Download, 
  Sparkles, 
  CheckCircle2, 
  ExternalLink,
  Edit3,
  Shield,
  Layers,
  AlertTriangle
} from 'lucide-react';

export default function MemberDashboard() {
  const [currentUser, setCurrentUser] = useState<UserProfile>(store.getCurrentUser());
  const [org, setOrg] = useState<Organization>(store.getOrganization());
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [personalLogs, setPersonalLogs] = useState<VerificationLog[]>([]);
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const [activeTab, setActiveTab] = useState<'id_card' | 'certificates' | 'history'>('id_card');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [phoneInput, setPhoneInput] = useState(currentUser.phone);
  const [emergencyInput, setEmergencyInput] = useState(currentUser.emergencyContact || '');

  useEffect(() => {
    const refreshData = () => {
      const user = store.getCurrentUser();
      setCurrentUser(user);
      setOrg(store.getOrganization());
      setCertificates(store.getCertificatesForUser(user.id));
      setPersonalLogs(store.getVerificationLogs().filter((l) => l.userId === user.id));
      setPhoneInput(user.phone);
      setEmergencyInput(user.emergencyContact || '');
    };

    refreshData();
    const unsub = store.subscribe(refreshData);
    return unsub;
  }, []);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      ...currentUser,
      phone: phoneInput,
      emergencyContact: emergencyInput,
    };
    store.saveUser(updated);
    setIsEditingProfile(false);
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Status Warning Banner for Expired / Revoked Users */}
        {currentUser.status === 'revoked' && (
          <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-200 flex items-start gap-3 shadow-lg shadow-rose-950/40">
            <ShieldAlert className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-bold text-rose-300 text-sm">SECURITY ALERT: Identity Credential Revoked</p>
              <p className="text-rose-200/90 mt-0.5">
                Your digital identity credential has been deactivated by administration. Gate verifiers will reject access. Please contact Campus Security or Registrar Office for resolution.
              </p>
            </div>
          </div>
        )}

        {currentUser.status === 'expired' && (
          <div className="p-4 rounded-2xl bg-amber-950/60 border border-amber-500/40 text-amber-200 flex items-start gap-3 shadow-lg shadow-amber-950/40">
            <Clock className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-bold text-amber-300 text-sm">NOTICE: Identity Credential Expired</p>
              <p className="text-amber-200/90 mt-0.5">
                Your validity period ended on {currentUser.validUntil}. Renew your membership or enroll in the upcoming term to reinstate gate access privileges.
              </p>
            </div>
          </div>
        )}

        {/* Member Profile Overview Bar */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={currentUser.photoUrl}
                alt={currentUser.fullName}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-2 ring-indigo-500/40 shadow-lg"
              />
              <div className="absolute -bottom-1 -right-1 p-1 rounded-lg bg-indigo-600 text-white shadow">
                <Shield className="w-3.5 h-3.5" />
              </div>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white">{currentUser.fullName}</h1>
                <span
                  className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full uppercase ${
                    currentUser.status === 'active'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : currentUser.status === 'expired'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  }`}
                >
                  {currentUser.status}
                </span>
              </div>

              <p className="text-xs font-mono text-indigo-300 font-semibold mt-1">
                ID: {currentUser.memberNumber} • {currentUser.role.toUpperCase()}
              </p>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                <span>{currentUser.department}</span>
                <span>•</span>
                <span>{org.name}</span>
              </p>
            </div>
          </div>

          {/* Quick Metrics & Actions */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="px-4 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-center flex-1 md:flex-initial">
              <span className="text-[10px] text-slate-500 uppercase font-mono block">Certificates</span>
              <span className="text-base font-bold text-amber-400">{certificates.length}</span>
            </div>

            <div className="px-4 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-center flex-1 md:flex-initial">
              <span className="text-[10px] text-slate-500 uppercase font-mono block">Gate Checks</span>
              <span className="text-base font-bold text-cyan-400">{personalLogs.length}</span>
            </div>

            <button
              onClick={() => setIsEditingProfile(true)}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition"
            >
              <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Edit Contact</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 space-x-4">
          <button
            onClick={() => setActiveTab('id_card')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'id_card'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Digital Smart ID Card</span>
          </button>

          <button
            onClick={() => setActiveTab('certificates')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'certificates'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Certificates Locker ({certificates.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'history'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            <span>My Verification Log ({personalLogs.length})</span>
          </button>
        </div>

        {/* TAB 1: DIGITAL SMART ID CARD */}
        {activeTab === 'id_card' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: 3D ID Card Widget */}
            <div className="lg:col-span-6 flex flex-col items-center">
              <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 w-full flex flex-col items-center shadow-xl">
                <DigitalIdCard user={currentUser} org={org} />
              </div>
            </div>

            {/* Right: Security Information & Profile Summary */}
            <div className="lg:col-span-6 space-y-4">
              {/* Card Specs Card */}
              <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  Tamper-Evident Digital Security Specification
                </h3>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">Credential Status:</span>
                    <span className="font-bold text-emerald-300 capitalize">{currentUser.status}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">Valid Until:</span>
                    <span className="font-mono font-bold text-slate-200">{currentUser.validUntil}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">Issuing Department:</span>
                    <span className="text-slate-300 truncate block">{currentUser.issuedBy || 'Registrar Office'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">Emergency Phone:</span>
                    <span className="font-mono text-slate-300">{currentUser.emergencyContact || 'Campus Security'}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-[11px] text-indigo-200 leading-relaxed">
                  <strong>How to use at Gates:</strong> Present this screen or a printed copy of your downloaded ID card to the gate verifier. The rotating dynamic QR code prevents unauthorized screenshot sharing.
                </div>
              </div>

              {/* Quick Profile Summary Card */}
              <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2 text-xs">
                <h4 className="font-bold text-slate-300">Registered Contact Details</h4>
                <div className="space-y-1 text-slate-400">
                  <p><strong className="text-slate-300">Email:</strong> {currentUser.email}</p>
                  <p><strong className="text-slate-300">Phone:</strong> {currentUser.phone}</p>
                  <p><strong className="text-slate-300">Notes / Title:</strong> {currentUser.notes || 'None'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CERTIFICATES LOCKER */}
        {activeTab === 'certificates' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Official Issued Certificates</h2>
                <p className="text-xs text-slate-400">
                  Cryptographically sealed credentials issued by {org.name}.
                </p>
              </div>
            </div>

            {certificates.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800">
                <Award className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-300">No Certificates Issued Yet</p>
                <p className="text-xs text-slate-500 mt-1">
                  Certificates will appear here once issued by an administrator for event completion or merit.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {certificates.map((cert) => (
                  <div
                    key={cert.id}
                    className="p-5 rounded-2xl bg-slate-900/80 border border-amber-500/30 hover:border-amber-500/60 transition shadow-lg flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[10px] font-mono uppercase bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                          {cert.category}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">ID: {cert.certificateNumber}</span>
                      </div>

                      <h4 className="text-base font-bold text-white">{cert.title}</h4>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{cert.description}</p>

                      <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] text-slate-400 space-y-0.5">
                        <p>Issued by: <span className="text-slate-200 font-semibold">{cert.signatoryName}</span> ({cert.signatoryTitle})</p>
                        <p>Issue Date: <span className="font-mono text-slate-300">{cert.issueDate}</span></p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSelectedCert(cert)}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow"
                      >
                        <Award className="w-3.5 h-3.5" />
                        <span>Preview & PDF</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PERSONAL VERIFICATION LOG */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-white">Your Gate Access History</h2>
              <p className="text-xs text-slate-400">
                Immutable record of every gate verification performed on your digital identity.
              </p>
            </div>

            {personalLogs.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800">
                <History className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-300">No Verification Checks Recorded</p>
                <p className="text-xs text-slate-500 mt-1">
                  When a gate security verifier scans your QR code, the check will be securely timestamped here.
                </p>
              </div>
            ) : (
              <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase font-mono text-[10px]">
                      <tr>
                        <th className="p-3.5">Timestamp</th>
                        <th className="p-3.5">Checkpoint / Gate</th>
                        <th className="p-3.5">Verifier Name</th>
                        <th className="p-3.5">Result</th>
                        <th className="p-3.5">Audit Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {personalLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-800/40 transition">
                          <td className="p-3.5 font-mono text-slate-300">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="p-3.5 font-semibold text-slate-200">{log.locationTag}</td>
                          <td className="p-3.5 text-slate-400">{log.verifierName}</td>
                          <td className="p-3.5">
                            <span
                              className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                                log.result === 'VALID'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              }`}
                            >
                              {log.result}
                            </span>
                          </td>
                          <td className="p-3.5 text-slate-400 max-w-xs truncate">{log.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal: Edit Contact Info */}
        {isEditingProfile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl space-y-4">
              <h3 className="text-base font-bold text-white">Update Self-Service Contact Info</h3>
              <form onSubmit={handleSaveProfile} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Emergency Contact</label>
                  <input
                    type="text"
                    value={emergencyInput}
                    onChange={(e) => setEmergencyInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    className="px-4 py-2 rounded-lg text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Certificate Preview Modal */}
        <CertificateModal
          certificate={selectedCert}
          onClose={() => setSelectedCert(null)}
        />
      </div>
    </div>
  );
}
