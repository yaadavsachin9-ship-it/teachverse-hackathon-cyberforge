export type UserRole = 'admin' | 'verifier' | 'user';

export type MembershipStatus = 'active' | 'expired' | 'revoked' | 'pending';

export interface Organization {
  id: string;
  name: string;
  code: string;
  tagline: string;
  logoUrl?: string;
  primaryColor: string;
  allowedGates: GateLocation[];
  qrRotationSeconds: number; // e.g. 60 for dynamic rotation, 0 for static
  requireOtpForGates?: string[]; // Gate IDs requiring OTP
}

export interface GateLocation {
  id: string;
  name: string;
  code: string;
  description: string;
  highSecurity?: boolean;
}

export interface UserProfile {
  id: string;
  orgId: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: MembershipStatus;
  memberNumber: string;
  department: string;
  photoUrl: string;
  phone: string;
  validFrom: string;
  validUntil: string;
  emergencyContact?: string;
  issuedBy?: string;
  notes?: string;
  createdAt: string;
}

export interface QRTokenPayload {
  v: number; // version e.g. 1
  uid: string; // user id
  oid: string; // organization id
  num: string; // member number
  iat: number; // issued at (timestamp in seconds)
  exp: number; // expires at (timestamp in seconds)
  nonce: string; // anti-replay random nonce
  sig: string; // HMAC signature
}

export type VerificationStatusType = 'VALID' | 'EXPIRED' | 'REVOKED' | 'TAMPERED' | 'NOT_FOUND' | 'OTP_REQUIRED';

export interface VerificationResult {
  result: VerificationStatusType;
  isValid: boolean;
  reason: string;
  profile?: UserProfile;
  timestamp: string;
  verifierId?: string;
  locationTag?: string;
  otpRequired?: boolean;
  otpChallengeId?: string;
}

export interface VerificationLog {
  id: string;
  userId: string;
  userName: string;
  memberNumber: string;
  verifierId: string;
  verifierName: string;
  orgId: string;
  result: VerificationStatusType;
  reason: string;
  locationTag: string;
  timestamp: string;
  meta?: Record<string, unknown>;
}

export interface Certificate {
  id: string;
  userId: string;
  userName: string;
  memberNumber: string;
  orgId: string;
  orgName: string;
  title: string;
  category: string;
  description: string;
  certificateNumber: string;
  issueDate: string;
  validUntil?: string;
  signatoryName: string;
  signatoryTitle: string;
  qrProofToken: string;
}

export interface OTPChallenge {
  id: string;
  userId: string;
  code: string;
  expiresAt: number;
  attemptsLeft: number;
  gateId: string;
  verifierId: string;
}
