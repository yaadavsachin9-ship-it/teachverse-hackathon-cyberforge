'use client';

import React, { useState, useEffect } from 'react';
import { store } from '@/lib/store';
import { UserProfile, Organization, Certificate, VerificationLog, UserRole, MembershipStatus, GateLocation } from '@/lib/types';
import { CertificateModal } from '@/components/CertificateModal';
import { 
  LayoutDashboard, 
  Users, 
  Award, 
  FileText, 
  Settings, 
  Search, 
  UserPlus, 
  UserCheck, 
  ShieldAlert, 
  Clock, 
  Download, 
  Trash2, 
  Edit3, 
  Shield, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  Plus, 
  Building2, 
  RotateCcw,
  Sliders,
  Calendar,
  Lock
} from 'lucide-react';

export default function AdminDashboard() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [org, setOrg] = useState<Organization>(store.getOrganization());
  const [logs, setLogs] = useState<VerificationLog[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [activeTab, setActiveTab] = useState<'members' | 'logs' | 'certificates' | 'settings'>('members');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [isIssueCertOpen, setIsIssueCertOpen] = useState(false);
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);

  // New User Form State
  const [newUserForm, setNewUserForm] = useState({
    fullName: '',
    email: '',
    role: 'user' as UserRole,
    status: 'active' as MembershipStatus,
    department: 'Computer Science & Engineering',
    phone: '+1 (555) 000-0000',
    validFrom: new Date().toISOString().slice(0, 10),
    validUntil: '2027-12-31',
    notes: 'Member profile',
  });

  // Certificate Form State
  const [newCertForm, setNewCertForm] = useState({
    userId: '',
    title: 'Certificate of Excellence & Verified Achievement',
    category: 'Merit Award',
    description: 'Awarded for outstanding technical performance and active contribution to Techverse DCE initiatives.',
    signatoryName: 'Dr. Sarah Connor',
    signatoryTitle: 'Dean of Digital Infrastructure',
    issueDate: new Date().toISOString().slice(0, 10),
  });

  useEffect(() => {
    const refresh = () => {
      setUsers(store.getUsers());
      setOrg(store.getOrganization());
      setLogs(store.getVerificationLogs());
      setCertificates(store.getCertificates());
    };

    refresh();
    const unsub = store.subscribe(refresh);
    return unsub;
  }, []);

  // Filtered Members
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.memberNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.department.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Add User Handler
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    const memberNum = `STU-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const avatarList = [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
    ];
    const randomAvatar = avatarList[Math.floor(Math.random() * avatarList.length)];

    const created: UserProfile = {
      id: `usr_${Date.now()}`,
      orgId: org.id,
      email: newUserForm.email,
      fullName: newUserForm.fullName,
      role: newUserForm.role,
      status: newUserForm.status,
      memberNumber: memberNum,
      department: newUserForm.department,
      photoUrl: randomAvatar,
      phone: newUserForm.phone,
      validFrom: newUserForm.validFrom,
      validUntil: newUserForm.validUntil,
      issuedBy: 'Office of Campus Administration',
      notes: newUserForm.notes,
      createdAt: new Date().toISOString(),
    };

    store.saveUser(created);
    setIsAddUserOpen(false);
    setNewUserForm({
      fullName: '',
      email: '',
      role: 'user',
      status: 'active',
      department: 'Computer Science & Engineering',
      phone: '+1 (555) 000-0000',
      validFrom: new Date().toISOString().slice(0, 10),
      validUntil: '2027-12-31',
      notes: 'Member profile',
    });
  };

  // Edit User Handler
  const handleSaveEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      store.saveUser(editingUser);
      setIsEditUserOpen(false);
      setEditingUser(null);
    }
  };

  // Issue Certificate Handler
  const handleIssueCertificate = (e: React.FormEvent) => {
    e.preventDefault();
    const targetUser = users.find((u) => u.id === newCertForm.userId);
    if (!targetUser) return;

    const certNum = `CERT-TDCE-${Date.now().toString().slice(-6)}`;
    store.issueCertificate({
      userId: targetUser.id,
      userName: targetUser.fullName,
      memberNumber: targetUser.memberNumber,
      orgId: org.id,
      orgName: org.name,
      title: newCertForm.title,
      category: newCertForm.category,
      description: newCertForm.description,
      certificateNumber: certNum,
      issueDate: newCertForm.issueDate,
      signatoryName: newCertForm.signatoryName,
      signatoryTitle: newCertForm.signatoryTitle,
    });

    setIsIssueCertOpen(false);
  };

  // Status Toggles
  const handleToggleStatus = (userId: string, newStatus: MembershipStatus) => {
    store.updateUserStatus(userId, newStatus);
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm('Are you sure you want to permanently remove this user profile?')) {
      store.deleteUser(userId);
    }
  };

  // Analytics Metrics
  const totalMembers = users.length;
  const activeMembers = users.filter((u) => u.status === 'active').length;
  const expiredMembers = users.filter((u) => u.status === 'expired').length;
  const revokedMembers = users.filter((u) => u.status === 'revoked').length;
  const totalScans = logs.length;
  const validScans = logs.filter((l) => l.result === 'VALID').length;
  const failedScans = totalScans - validScans;
  const passRate = totalScans > 0 ? Math.round((validScans / totalScans) * 100) : 100;

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Bar */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Administration Console
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                RBAC Level: System SuperAdmin
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <LayoutDashboard className="w-5 h-5 text-purple-400" />
              <span>{org.name} Operations Hub</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Issue identities, control gate access permissions, issue certificates, and review immutable audit logs.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAddUserOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-purple-600/30 transition"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Member / User</span>
            </button>

            <button
              onClick={() => setIsIssueCertOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 text-xs font-bold flex items-center gap-2 border border-amber-500/40 transition"
            >
              <Award className="w-4 h-4" />
              <span>Issue Certificate</span>
            </button>
          </div>
        </div>

        {/* Executive KPI Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <span className="text-[11px] text-slate-400 block">Total Registered</span>
            <p className="text-2xl font-black text-white mt-0.5">{totalMembers}</p>
            <span className="text-[10px] text-indigo-400 font-mono">100% Onboarded</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <span className="text-[11px] text-slate-400 block">Active Status</span>
            <p className="text-2xl font-black text-emerald-400 mt-0.5">{activeMembers}</p>
            <span className="text-[10px] text-emerald-400/80 font-mono">Gate Approved</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <span className="text-[11px] text-slate-400 block">Expired / Revoked</span>
            <p className="text-2xl font-black text-rose-400 mt-0.5">{expiredMembers + revokedMembers}</p>
            <span className="text-[10px] text-rose-400/80 font-mono">{revokedMembers} Revoked Flags</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <span className="text-[11px] text-slate-400 block">Total Audit Logs</span>
            <p className="text-2xl font-black text-cyan-400 mt-0.5">{totalScans}</p>
            <span className="text-[10px] text-cyan-400/80 font-mono">{passRate}% Pass Rate</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 col-span-2 sm:col-span-1">
            <span className="text-[11px] text-slate-400 block">Issued Certificates</span>
            <p className="text-2xl font-black text-amber-400 mt-0.5">{certificates.length}</p>
            <span className="text-[10px] text-amber-400/80 font-mono">Cryptographically Sealed</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 space-x-6 text-sm font-semibold">
          <button
            onClick={() => setActiveTab('members')}
            className={`pb-3 flex items-center gap-2 border-b-2 transition ${
              activeTab === 'members'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Member Directory ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`pb-3 flex items-center gap-2 border-b-2 transition ${
              activeTab === 'logs'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Audit Trail & CSV Export ({logs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('certificates')}
            className={`pb-3 flex items-center gap-2 border-b-2 transition ${
              activeTab === 'certificates'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Certificate Studio ({certificates.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-3 flex items-center gap-2 border-b-2 transition ${
              activeTab === 'settings'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Organization Settings</span>
          </button>
        </div>

        {/* TAB 1: MEMBER DIRECTORY */}
        {activeTab === 'members' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search name, ID number, email, department..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-medium focus:outline-none"
                >
                  <option value="ALL">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="verifier">Verifier</option>
                  <option value="user">Member (User)</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-medium focus:outline-none"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                  <option value="revoked">Revoked</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>

            {/* Members Table */}
            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase font-mono text-[10px]">
                    <tr>
                      <th className="p-3.5">Member Details</th>
                      <th className="p-3.5">Role</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5">Department</th>
                      <th className="p-3.5">Validity Dates</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-3.5">
                          <div className="flex items-center gap-3">
                            <img
                              src={user.photoUrl}
                              alt={user.fullName}
                              className="w-9 h-9 rounded-xl object-cover ring-1 ring-slate-700"
                            />
                            <div>
                              <p className="font-bold text-white text-sm leading-tight">{user.fullName}</p>
                              <p className="text-[11px] text-slate-400">{user.email}</p>
                              <p className="text-[10px] font-mono text-indigo-400 font-bold mt-0.5">
                                {user.memberNumber}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="p-3.5 capitalize font-semibold text-slate-300">
                          {user.role}
                        </td>

                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase ${
                              user.status === 'active'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : user.status === 'expired'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : user.status === 'revoked'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                : 'bg-slate-500/20 text-slate-300'
                            }`}
                          >
                            {user.status}
                          </span>
                        </td>

                        <td className="p-3.5 text-slate-300">{user.department}</td>

                        <td className="p-3.5 font-mono text-[11px] text-slate-400">
                          {user.validFrom} → <strong className="text-slate-200">{user.validUntil}</strong>
                        </td>

                        <td className="p-3.5 text-right space-x-1">
                          {/* 1-Click Status Toggles */}
                          {user.status !== 'active' && (
                            <button
                              onClick={() => handleToggleStatus(user.id, 'active')}
                              className="px-2 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-semibold text-[10px]"
                              title="Reinstate to Active"
                            >
                              Activate
                            </button>
                          )}

                          {user.status !== 'revoked' && (
                            <button
                              onClick={() => handleToggleStatus(user.id, 'revoked')}
                              className="px-2 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-semibold text-[10px]"
                              title="Revoke Access Immediately"
                            >
                              Revoke
                            </button>
                          )}

                          {user.status !== 'expired' && (
                            <button
                              onClick={() => handleToggleStatus(user.id, 'expired')}
                              className="px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold text-[10px]"
                              title="Set to Expired"
                            >
                              Expire
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setEditingUser(user);
                              setIsEditUserOpen(true);
                            }}
                            className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800"
                            title="Edit Profile"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-1.5 rounded text-rose-400 hover:text-rose-200 hover:bg-rose-500/20"
                            title="Delete User"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: AUDIT TRAIL LOGS */}
        {activeTab === 'logs' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white">Immutable Verification Audit Trail</h3>
                <p className="text-xs text-slate-400">
                  Every scan attempt is cryptographically captured and permanently stored.
                </p>
              </div>

              <button
                onClick={() => store.exportLogsToCSV()}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-md transition"
              >
                <Download className="w-4 h-4" />
                <span>Export to CSV ({logs.length} records)</span>
              </button>
            </div>

            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase font-mono text-[10px]">
                    <tr>
                      <th className="p-3.5">Timestamp</th>
                      <th className="p-3.5">Member Checked</th>
                      <th className="p-3.5">Verifier Authority</th>
                      <th className="p-3.5">Gate / Location</th>
                      <th className="p-3.5">Result</th>
                      <th className="p-3.5">Reason Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {logs.map((log) => {
                      const isPass = log.result === 'VALID';
                      return (
                        <tr key={log.id} className="hover:bg-slate-800/40 transition">
                          <td className="p-3.5 font-mono text-slate-300">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="p-3.5">
                            <p className="font-bold text-white">{log.userName}</p>
                            <p className="text-[10px] font-mono text-indigo-400">{log.memberNumber}</p>
                          </td>
                          <td className="p-3.5 text-slate-300">{log.verifierName}</td>
                          <td className="p-3.5 font-semibold text-slate-200">{log.locationTag}</td>
                          <td className="p-3.5">
                            <span
                              className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                                isPass
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              }`}
                            >
                              {log.result}
                            </span>
                          </td>
                          <td className="p-3.5 text-slate-400 max-w-sm">{log.reason}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CERTIFICATES STUDIO */}
        {activeTab === 'certificates' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Issued Credentials & Certificates</h3>
                <p className="text-xs text-slate-400">
                  Manage verifiable certificates with unique cryptographic hash seals.
                </p>
              </div>

              <button
                onClick={() => setIsIssueCertOpen(true)}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-bold flex items-center gap-2 shadow-md transition"
              >
                <Plus className="w-4 h-4" />
                <span>Issue New Certificate</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {certificates.map((cert) => (
                <div
                  key={cert.id}
                  className="p-5 rounded-2xl bg-slate-900/80 border border-amber-500/30 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-mono uppercase bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                        {cert.category}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">{cert.certificateNumber}</span>
                    </div>

                    <h4 className="text-base font-bold text-white">{cert.title}</h4>
                    <p className="text-xs text-slate-300 mt-1 font-semibold">Recipient: {cert.userName} ({cert.memberNumber})</p>
                    <p className="text-xs text-slate-400 mt-1">{cert.description}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] font-mono text-slate-500">Issued: {cert.issueDate}</span>
                    <button
                      onClick={() => setSelectedCert(cert)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <Award className="w-3.5 h-3.5" />
                      <span>Preview & PDF</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: ORGANIZATION SETTINGS */}
        {activeTab === 'settings' && (
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-6 max-w-2xl">
            <div>
              <h3 className="text-base font-bold text-white">Organization Configuration</h3>
              <p className="text-xs text-slate-400">Configure global security policies and gate checkpoints.</p>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Organization Name</label>
                <input
                  type="text"
                  value={org.name}
                  onChange={(e) => {
                    const updated = { ...org, name: e.target.value };
                    setOrg(updated);
                    store.updateOrganization(updated);
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Dynamic QR Code Anti-Replay Rotation Interval (Seconds)</label>
                <input
                  type="number"
                  value={org.qrRotationSeconds}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 60;
                    const updated = { ...org, qrRotationSeconds: val };
                    setOrg(updated);
                    store.updateOrganization(updated);
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Recommended: 60 seconds to eliminate static screenshot fraud.
                </span>
              </div>

              <div className="pt-3 border-t border-slate-800">
                <h4 className="font-bold text-slate-300 mb-2">Gate Checkpoints ({org.allowedGates.length})</h4>
                <div className="space-y-2">
                  {org.allowedGates.map((gate) => (
                    <div
                      key={gate.id}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-bold text-slate-200">{gate.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{gate.code} • {gate.description}</p>
                      </div>
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                          gate.highSecurity ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {gate.highSecurity ? '2FA OTP Required' : 'Standard'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: ADD USER */}
        {isAddUserOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-purple-400" />
                <span>Add New Member Profile</span>
              </h3>

              <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={newUserForm.fullName}
                    onChange={(e) => setNewUserForm({ ...newUserForm, fullName: e.target.value })}
                    placeholder="e.g. Maya Lin"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={newUserForm.email}
                      onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                      placeholder="maya@techverse.edu"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Department</label>
                    <input
                      type="text"
                      value={newUserForm.department}
                      onChange={(e) => setNewUserForm({ ...newUserForm, department: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Role</label>
                    <select
                      value={newUserForm.role}
                      onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value as UserRole })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                    >
                      <option value="user">User (Member/Student)</option>
                      <option value="verifier">Verifier (Security/Staff)</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Status</label>
                    <select
                      value={newUserForm.status}
                      onChange={(e) => setNewUserForm({ ...newUserForm, status: e.target.value as MembershipStatus })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                    >
                      <option value="active">Active</option>
                      <option value="expired">Expired</option>
                      <option value="revoked">Revoked</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Valid From</label>
                    <input
                      type="date"
                      value={newUserForm.validFrom}
                      onChange={(e) => setNewUserForm({ ...newUserForm, validFrom: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Valid Until</label>
                    <input
                      type="date"
                      value={newUserForm.validUntil}
                      onChange={(e) => setNewUserForm({ ...newUserForm, validUntil: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsAddUserOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold"
                  >
                    Create Member
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: EDIT USER */}
        {isEditUserOpen && editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl space-y-4">
              <h3 className="text-base font-bold text-white">Edit Profile: {editingUser.fullName}</h3>

              <form onSubmit={handleSaveEditUser} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={editingUser.fullName}
                    onChange={(e) => setEditingUser({ ...editingUser, fullName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Role</label>
                    <select
                      value={editingUser.role}
                      onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as UserRole })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                    >
                      <option value="user">User</option>
                      <option value="verifier">Verifier</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Status</label>
                    <select
                      value={editingUser.status}
                      onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value as MembershipStatus })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                    >
                      <option value="active">Active</option>
                      <option value="expired">Expired</option>
                      <option value="revoked">Revoked</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Valid Until Date</label>
                  <input
                    type="date"
                    value={editingUser.validUntil}
                    onChange={(e) => setEditingUser({ ...editingUser, validUntil: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditUserOpen(false);
                      setEditingUser(null);
                    }}
                    className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: ISSUE CERTIFICATE */}
        {isIssueCertOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                <span>Issue Branded Verifiable Certificate</span>
              </h3>

              <form onSubmit={handleIssueCertificate} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Recipient Member *</label>
                  <select
                    required
                    value={newCertForm.userId}
                    onChange={(e) => setNewCertForm({ ...newCertForm, userId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  >
                    <option value="">Select a member...</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName} ({u.memberNumber}) - {u.department}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Certificate Title</label>
                  <input
                    type="text"
                    required
                    value={newCertForm.title}
                    onChange={(e) => setNewCertForm({ ...newCertForm, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Description / Achievement Criteria</label>
                  <textarea
                    rows={3}
                    value={newCertForm.description}
                    onChange={(e) => setNewCertForm({ ...newCertForm, description: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  ></textarea>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Signatory Name</label>
                    <input
                      type="text"
                      value={newCertForm.signatoryName}
                      onChange={(e) => setNewCertForm({ ...newCertForm, signatoryName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Signatory Title</label>
                    <input
                      type="text"
                      value={newCertForm.signatoryTitle}
                      onChange={(e) => setNewCertForm({ ...newCertForm, signatoryTitle: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsIssueCertOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                  >
                    Issue Certificate
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
