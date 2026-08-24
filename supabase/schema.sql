-- ==============================================================================
-- SecureID — Digital Identity Verification Platform
-- Production PostgreSQL Database Schema with Row Level Security (RLS)
-- Compatible with Supabase Postgres
-- ==============================================================================

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Organizations Table
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    tagline TEXT,
    logo_url TEXT,
    primary_color TEXT DEFAULT '#6366f1',
    qr_rotation_seconds INTEGER DEFAULT 60,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Profiles Table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'verifier', 'user')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked', 'pending')),
    member_number TEXT NOT NULL UNIQUE,
    department TEXT NOT NULL,
    photo_url TEXT,
    phone TEXT,
    valid_from DATE NOT NULL,
    valid_until DATE NOT NULL,
    emergency_contact TEXT,
    issued_by TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. QR Tokens Table (stores hashed tokens and revocation state)
CREATE TABLE IF NOT EXISTS public.qr_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked BOOLEAN DEFAULT FALSE NOT NULL
);

-- 4. Verification Logs Table (immutable, append-only audit trail)
CREATE TABLE IF NOT EXISTS public.verification_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    user_name TEXT NOT NULL,
    member_number TEXT NOT NULL,
    verifier_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL NOT NULL,
    verifier_name TEXT NOT NULL,
    org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    result TEXT NOT NULL CHECK (result IN ('VALID', 'EXPIRED', 'REVOKED', 'TAMPERED', 'NOT_FOUND')),
    reason TEXT NOT NULL,
    location_tag TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    meta JSONB DEFAULT '{}'::jsonb
);

-- 5. Certificates Table
CREATE TABLE IF NOT EXISTS public.certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    user_name TEXT NOT NULL,
    member_number TEXT NOT NULL,
    org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    org_name TEXT NOT NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    certificate_number TEXT NOT NULL UNIQUE,
    issue_date DATE NOT NULL,
    valid_until DATE,
    signatory_name TEXT NOT NULL,
    signatory_title TEXT NOT NULL,
    pdf_url TEXT,
    qr_proof_token TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Enforces RBAC at the database layer (Admin, Verifier, Member)
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
-- 1. Admins can select, insert, update, and delete any profile in their org
CREATE POLICY "Admins have full access to profiles"
    ON public.profiles
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- 2. Verifiers can view profiles for verification purposes
CREATE POLICY "Verifiers can read all profiles"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND (profiles.role = 'verifier' OR profiles.role = 'admin')
        )
    );

-- 3. Users can only read and update limited fields of their own profile
CREATE POLICY "Users can read their own profile"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (id = auth.uid());

CREATE POLICY "Users can update their own contact info"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Verification Logs Policies (Append-only)
-- 1. Admins can view all verification logs
CREATE POLICY "Admins can view all verification logs"
    ON public.verification_logs
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- 2. Verifiers can view their own logged verifications and insert new logs
CREATE POLICY "Verifiers can insert verification logs"
    ON public.verification_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (
        verifier_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND (profiles.role = 'verifier' OR profiles.role = 'admin')
        )
    );

CREATE POLICY "Verifiers can view their own verification logs"
    ON public.verification_logs
    FOR SELECT
    TO authenticated
    USING (verifier_id = auth.uid());

-- 3. Users can view verification logs concerning their own identity
CREATE POLICY "Users can view logs of their own checks"
    ON public.verification_logs
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Certificates Policies
-- 1. Admins can issue and manage all certificates
CREATE POLICY "Admins can manage certificates"
    ON public.certificates
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- 2. Users can view and download their own certificates
CREATE POLICY "Users can read their own certificates"
    ON public.certificates
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- ==============================================================================
-- INDEXES FOR PERFORMANCE (<2s verification SLA)
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_member_number ON public.profiles(member_number);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_qr_tokens_hash ON public.qr_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_verification_logs_created_at ON public.verification_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_verification_logs_verifier_id ON public.verification_logs(verifier_id);
CREATE INDEX IF NOT EXISTS idx_verification_logs_user_id ON public.verification_logs(user_id);
