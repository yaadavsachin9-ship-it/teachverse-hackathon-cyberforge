import { 
  Organization, 
  UserProfile, 
  VerificationLog, 
  Certificate, 
  OTPChallenge, 
  GateLocation, 
  MembershipStatus,
  UserRole,
  VerificationStatusType
} from './types';

const STORAGE_KEYS = {
  USERS: 'secureid_users_v1',
  CURRENT_USER: 'secureid_current_user_v1',
  ORG: 'secureid_org_v1',
  LOGS: 'secureid_logs_v1',
  CERTIFICATES: 'secureid_certs_v1',
  ACTIVE_GATE: 'secureid_active_gate_v1',
  OTPS: 'secureid_otps_v1',
};

export const DEFAULT_ORG: Organization = {
  id: 'org_dce_techverse_01',
  name: 'Techverse DCE Institute of Technology',
  code: 'TDCE-2026',
  tagline: 'Digital Campus & Event Identity Verification Network',
  primaryColor: '#6366f1',
  qrRotationSeconds: 60,
  allowedGates: [
    {
      id: 'gate_main_alpha',
      name: 'Main Security Gate Alpha',
      code: 'GATE-A1',
      description: 'Campus Primary Vehicle & Pedestrian Entrance',
      highSecurity: false,
    },
    {
      id: 'gate_audi_summit',
      name: 'Auditorium - Tech Summit 2026',
      code: 'GATE-AUDI',
      description: 'Keynote & Conference Entry Checkpoint',
      highSecurity: false,
    },
    {
      id: 'gate_vip_lounge',
      name: 'VIP & Speaker Lounge',
      code: 'GATE-VIP',
      description: 'Restricted Access VIP & Keynote Speaker Green Room',
      highSecurity: true,
    },
    {
      id: 'gate_research_lab',
      name: 'Research Quantum Lab 4B',
      code: 'GATE-LAB4B',
      description: 'High-security cleanroom and sensitive prototyping zone',
      highSecurity: true,
    },
  ],
  requireOtpForGates: ['gate_vip_lounge', 'gate_research_lab'],
};

export const INITIAL_USERS: UserProfile[] = [
  {
    id: 'usr_admin_01',
    orgId: DEFAULT_ORG.id,
    email: 'sarah.connor@techverse.edu',
    fullName: 'Sarah Connor',
    role: 'admin',
    status: 'active',
    memberNumber: 'ADM-8801',
    department: 'Office of Campus Administration',
    photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
    phone: '+1 (555) 234-5678',
    validFrom: '2025-01-01',
    validUntil: '2028-12-31',
    emergencyContact: '+1 (555) 999-0011',
    issuedBy: 'Chancellor Office',
    notes: 'Chief Identity Authority & System Admin',
    createdAt: '2025-01-01T08:00:00Z',
  },
  {
    id: 'usr_verifier_01',
    orgId: DEFAULT_ORG.id,
    email: 'james.miller@techverse.edu',
    fullName: 'James Miller',
    role: 'verifier',
    status: 'active',
    memberNumber: 'SEC-4022',
    department: 'Campus Security & Gate Operations',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    phone: '+1 (555) 345-6789',
    validFrom: '2025-06-01',
    validUntil: '2027-12-31',
    emergencyContact: '+1 (555) 999-0022',
    issuedBy: 'Campus Security Division',
    notes: 'Gate Operations Lead Verifier',
    createdAt: '2025-06-01T09:00:00Z',
  },
  {
    id: 'usr_member_active_01',
    orgId: DEFAULT_ORG.id,
    email: 'alex.rivera@techverse.edu',
    fullName: 'Alex Rivera',
    role: 'user',
    status: 'active',
    memberNumber: 'STU-2026-0941',
    department: 'Computer Science & AI',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    phone: '+1 (555) 456-7890',
    validFrom: '2025-08-15',
    validUntil: '2027-08-15',
    emergencyContact: 'Elena Rivera: +1 (555) 123-9876',
    issuedBy: 'Registrar Office',
    notes: 'President - DCE Robotics & AI Guild',
    createdAt: '2025-08-15T10:00:00Z',
  },
  {
    id: 'usr_member_expired_02',
    orgId: DEFAULT_ORG.id,
    email: 'jordan.blake@techverse.edu',
    fullName: 'Jordan Blake',
    role: 'user',
    status: 'expired',
    memberNumber: 'STU-2024-0118',
    department: 'Robotics & Electronics',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    phone: '+1 (555) 567-8901',
    validFrom: '2023-08-15',
    validUntil: '2024-05-30',
    emergencyContact: 'David Blake: +1 (555) 876-5432',
    issuedBy: 'Registrar Office',
    notes: 'Graduated Alumnus - ID Card Expired',
    createdAt: '2023-08-15T10:00:00Z',
  },
  {
    id: 'usr_member_revoked_03',
    orgId: DEFAULT_ORG.id,
    email: 'sam.taylor@techverse.edu',
    fullName: 'Sam Taylor',
    role: 'user',
    status: 'revoked',
    memberNumber: 'STU-2025-0774',
    department: 'Information Systems',
    photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
    phone: '+1 (555) 678-9012',
    validFrom: '2024-08-15',
    validUntil: '2026-12-31',
    emergencyContact: '+1 (555) 234-9988',
    issuedBy: 'Disciplinary Board',
    notes: 'Access Revoked due to Security Clearance Audit Flag #882',
    createdAt: '2024-08-15T11:00:00Z',
  },
  {
    id: 'usr_member_pending_04',
    orgId: DEFAULT_ORG.id,
    email: 'elena.vance@techverse.edu',
    fullName: 'Dr. Elena Vance',
    role: 'user',
    status: 'pending',
    memberNumber: 'VIS-2026-9021',
    department: 'Guest Keynote Speaker',
    photoUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80',
    phone: '+1 (555) 789-0123',
    validFrom: '2026-08-20',
    validUntil: '2026-08-30',
    emergencyContact: '+1 (555) 654-3210',
    issuedBy: 'Event Operations Team',
    notes: 'Awaiting Admin badge issuance confirmation',
    createdAt: '2026-08-20T14:00:00Z',
  }
];

export const INITIAL_LOGS: VerificationLog[] = [
  {
    id: 'log_001',
    userId: 'usr_member_active_01',
    userName: 'Alex Rivera',
    memberNumber: 'STU-2026-0941',
    verifierId: 'usr_verifier_01',
    verifierName: 'James Miller',
    orgId: DEFAULT_ORG.id,
    result: 'VALID',
    reason: 'Verified valid digital identity for Alex Rivera (STU-2026-0941).',
    locationTag: 'Main Security Gate Alpha',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
  {
    id: 'log_002',
    userId: 'usr_member_expired_02',
    userName: 'Jordan Blake',
    memberNumber: 'STU-2024-0118',
    verifierId: 'usr_verifier_01',
    verifierName: 'James Miller',
    orgId: DEFAULT_ORG.id,
    result: 'EXPIRED',
    reason: 'Membership validity ended on 2024-05-30. Profile is expired.',
    locationTag: 'Auditorium - Tech Summit 2026',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    id: 'log_003',
    userId: 'usr_member_revoked_03',
    userName: 'Sam Taylor',
    memberNumber: 'STU-2025-0774',
    verifierId: 'usr_verifier_01',
    verifierName: 'James Miller',
    orgId: DEFAULT_ORG.id,
    result: 'REVOKED',
    reason: 'This identity credential has been REVOKED by the administrator. Access is denied.',
    locationTag: 'Main Security Gate Alpha',
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  {
    id: 'log_004',
    userId: 'unknown',
    userName: 'Unrecognized Token',
    memberNumber: 'N/A',
    verifierId: 'usr_verifier_01',
    verifierName: 'James Miller',
    orgId: DEFAULT_ORG.id,
    result: 'TAMPERED',
    reason: 'Cryptographic signature mismatch. Digital identity signature has been forged or altered.',
    locationTag: 'VIP & Speaker Lounge',
    timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
  },
];

export const INITIAL_CERTIFICATES: Certificate[] = [
  {
    id: 'cert_dce_001',
    userId: 'usr_member_active_01',
    userName: 'Alex Rivera',
    memberNumber: 'STU-2026-0941',
    orgId: DEFAULT_ORG.id,
    orgName: 'Techverse DCE Institute of Technology',
    title: 'Verified AI & Cloud Security Fellow',
    category: 'Honorary Credential',
    description: 'Awarded for exceptional mastery in Decentralized Cryptographic Identity Verification Systems and AI Security Infrastructure.',
    certificateNumber: 'CERT-TDCE-AI-2026-0042',
    issueDate: '2026-08-15',
    validUntil: '2029-08-15',
    signatoryName: 'Dr. Sarah Connor',
    signatoryTitle: 'Dean of Digital Infrastructure',
    qrProofToken: 'PROOF_CERT_TDCE_AI_2026_0042_VALID',
  },
  {
    id: 'cert_dce_002',
    userId: 'usr_member_active_01',
    userName: 'Alex Rivera',
    memberNumber: 'STU-2026-0941',
    orgId: DEFAULT_ORG.id,
    orgName: 'Techverse DCE Institute of Technology',
    title: 'Official DCE Tech Summit 2026 Delegate',
    category: 'Event Participation',
    description: 'Certified participant in the Annual Techverse DCE National Summit & Hackathon.',
    certificateNumber: 'CERT-TDCE-SUMMIT-2026-9912',
    issueDate: '2026-08-22',
    signatoryName: 'Prof. Marcus Aurelius',
    signatoryTitle: 'Convener, Techverse DCE Summit',
    qrProofToken: 'PROOF_CERT_TDCE_SUMMIT_2026_9912_VALID',
  },
];

class DataStore {
  private isBrowser = typeof window !== 'undefined';
  private listeners: Set<() => void> = new Set();

  constructor() {
    if (this.isBrowser) {
      this.init();
    }
  }

  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (e) {
        console.error(e);
      }
    });
  }

  private init() {
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(INITIAL_USERS[2])); // default to Alex Rivera
    }
    if (!localStorage.getItem(STORAGE_KEYS.ORG)) {
      localStorage.setItem(STORAGE_KEYS.ORG, JSON.stringify(DEFAULT_ORG));
    }
    if (!localStorage.getItem(STORAGE_KEYS.LOGS)) {
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(INITIAL_LOGS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CERTIFICATES)) {
      localStorage.setItem(STORAGE_KEYS.CERTIFICATES, JSON.stringify(INITIAL_CERTIFICATES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ACTIVE_GATE)) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_GATE, JSON.stringify(DEFAULT_ORG.allowedGates[0]));
    }
  }

  // Users
  public getUsers(): UserProfile[] {
    if (!this.isBrowser) return INITIAL_USERS;
    const data = localStorage.getItem(STORAGE_KEYS.USERS);
    return data ? JSON.parse(data) : INITIAL_USERS;
  }

  public getUserById(id: string): UserProfile | undefined {
    return this.getUsers().find((u) => u.id === id);
  }

  public getUserByEmail(email: string): UserProfile | undefined {
    return this.getUsers().find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public getCurrentUser(): UserProfile {
    if (!this.isBrowser) return INITIAL_USERS[2];
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return data ? JSON.parse(data) : INITIAL_USERS[2];
  }

  public setCurrentUser(user: UserProfile) {
    if (this.isBrowser) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      this.notify();
    }
  }

  public switchUserByRole(role: UserRole) {
    const user = this.getUsers().find((u) => u.role === role);
    if (user) {
      this.setCurrentUser(user);
    }
  }

  public switchUserById(id: string) {
    const user = this.getUserById(id);
    if (user) {
      this.setCurrentUser(user);
    }
  }

  public saveUser(user: UserProfile) {
    const users = this.getUsers();
    const existingIndex = users.findIndex((u) => u.id === user.id);
    let updatedUsers: UserProfile[];
    if (existingIndex >= 0) {
      updatedUsers = [...users];
      updatedUsers[existingIndex] = user;
    } else {
      updatedUsers = [user, ...users];
    }
    if (this.isBrowser) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers));
      const current = this.getCurrentUser();
      if (current.id === user.id) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      }
      this.notify();
    }
    return user;
  }

  public updateUserStatus(userId: string, status: MembershipStatus) {
    const user = this.getUserById(userId);
    if (user) {
      user.status = status;
      this.saveUser(user);
    }
  }

  public deleteUser(userId: string) {
    const users = this.getUsers().filter((u) => u.id !== userId);
    if (this.isBrowser) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      this.notify();
    }
  }

  // Organization
  public getOrganization(): Organization {
    if (!this.isBrowser) return DEFAULT_ORG;
    const data = localStorage.getItem(STORAGE_KEYS.ORG);
    return data ? JSON.parse(data) : DEFAULT_ORG;
  }

  public updateOrganization(org: Organization) {
    if (this.isBrowser) {
      localStorage.setItem(STORAGE_KEYS.ORG, JSON.stringify(org));
      this.notify();
    }
  }

  // Active Gate
  public getActiveGate(): GateLocation {
    if (!this.isBrowser) return DEFAULT_ORG.allowedGates[0];
    const data = localStorage.getItem(STORAGE_KEYS.ACTIVE_GATE);
    return data ? JSON.parse(data) : DEFAULT_ORG.allowedGates[0];
  }

  public setActiveGate(gate: GateLocation) {
    if (this.isBrowser) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_GATE, JSON.stringify(gate));
      this.notify();
    }
  }

  // Verification Logs
  public getVerificationLogs(): VerificationLog[] {
    if (!this.isBrowser) return INITIAL_LOGS;
    const data = localStorage.getItem(STORAGE_KEYS.LOGS);
    return data ? JSON.parse(data) : INITIAL_LOGS;
  }

  public addVerificationLog(log: Omit<VerificationLog, 'id' | 'timestamp'>): VerificationLog {
    const newLog: VerificationLog = {
      ...log,
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    const logs = [newLog, ...this.getVerificationLogs()];
    if (this.isBrowser) {
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
      this.notify();
    }
    return newLog;
  }

  // Certificates
  public getCertificates(): Certificate[] {
    if (!this.isBrowser) return INITIAL_CERTIFICATES;
    const data = localStorage.getItem(STORAGE_KEYS.CERTIFICATES);
    return data ? JSON.parse(data) : INITIAL_CERTIFICATES;
  }

  public getCertificatesForUser(userId: string): Certificate[] {
    return this.getCertificates().filter((c) => c.userId === userId);
  }

  public issueCertificate(cert: Omit<Certificate, 'id' | 'qrProofToken'>): Certificate {
    const proofToken = `PROOF_CERT_${cert.certificateNumber}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const newCert: Certificate = {
      ...cert,
      id: `cert_${Date.now()}`,
      qrProofToken: proofToken,
    };
    const certs = [newCert, ...this.getCertificates()];
    if (this.isBrowser) {
      localStorage.setItem(STORAGE_KEYS.CERTIFICATES, JSON.stringify(certs));
      this.notify();
    }
    return newCert;
  }

  // OTP Challenges (Gate 2FA)
  public createOTPChallenge(userId: string, gateId: string, verifierId: string): OTPChallenge {
    // Generate 6-digit numeric OTP code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const challenge: OTPChallenge = {
      id: `otp_${Date.now()}`,
      userId,
      code,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
      attemptsLeft: 3,
      gateId,
      verifierId,
    };

    if (this.isBrowser) {
      const existing = this.getOTPChallenges();
      existing.push(challenge);
      localStorage.setItem(STORAGE_KEYS.OTPS, JSON.stringify(existing));
    }
    return challenge;
  }

  public getOTPChallenges(): OTPChallenge[] {
    if (!this.isBrowser) return [];
    const data = localStorage.getItem(STORAGE_KEYS.OTPS);
    return data ? JSON.parse(data) : [];
  }

  public verifyOTPChallenge(userId: string, inputCode: string): { success: boolean; message: string } {
    const challenges = this.getOTPChallenges();
    const active = challenges.find((c) => c.userId === userId && c.expiresAt > Date.now());

    if (!active) {
      return { success: false, message: 'No active OTP request found or code has expired. Request a new OTP.' };
    }

    if (active.code === inputCode.trim()) {
      // Clear completed challenge
      const remaining = challenges.filter((c) => c.id !== active.id);
      if (this.isBrowser) {
        localStorage.setItem(STORAGE_KEYS.OTPS, JSON.stringify(remaining));
      }
      return { success: true, message: '2FA OTP authentication confirmed!' };
    } else {
      active.attemptsLeft -= 1;
      if (this.isBrowser) {
        localStorage.setItem(STORAGE_KEYS.OTPS, JSON.stringify(challenges));
      }
      return { success: false, message: `Incorrect OTP code. ${active.attemptsLeft} attempts remaining.` };
    }
  }

  // Export CSV
  public exportLogsToCSV(logsToExport?: VerificationLog[]) {
    const logs = logsToExport || this.getVerificationLogs();
    const headers = ['Timestamp', 'Log ID', 'Member Name', 'Member ID', 'Result', 'Reason', 'Location/Gate', 'Verifier Name'];
    const rows = logs.map((l) => [
      `"${new Date(l.timestamp).toLocaleString()}"`,
      `"${l.id}"`,
      `"${l.userName.replace(/"/g, '""')}"`,
      `"${l.memberNumber}"`,
      `"${l.result}"`,
      `"${l.reason.replace(/"/g, '""')}"`,
      `"${l.locationTag.replace(/"/g, '""')}"`,
      `"${l.verifierName.replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `SecureID_Verification_Logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Reset to Factory Default
  public resetToDefaults() {
    if (this.isBrowser) {
      localStorage.clear();
      this.init();
      this.notify();
    }
  }
}

export const store = new DataStore();
