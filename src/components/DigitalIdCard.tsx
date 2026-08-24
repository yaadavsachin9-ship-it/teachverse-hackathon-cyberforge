'use client';

import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { UserProfile, Organization, QRTokenPayload } from '@/lib/types';
import { createSignedQRToken } from '@/lib/crypto';
import { 
  Shield, 
  RotateCw, 
  Download, 
  Sparkles, 
  Calendar, 
  Building2, 
  UserCheck, 
  ShieldAlert, 
  Clock, 
  Phone, 
  CheckCircle2, 
  FileText,
  Lock,
  Layers,
  Fingerprint
} from 'lucide-react';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

interface DigitalIdCardProps {
  user: UserProfile;
  org: Organization;
  onRefreshQR?: () => void;
}

export function DigitalIdCard({ user, org, onRefreshQR }: DigitalIdCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [qrData, setQrData] = useState<{ token: string; payload: QRTokenPayload; expiresAtFormatted: string } | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(org.qrRotationSeconds || 60);
  const [isRotating, setIsRotating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Generate & Rotate Token
  const generateToken = async () => {
    setIsRotating(true);
    try {
      const data = await createSignedQRToken(user, org.qrRotationSeconds || 60);
      setQrData(data);
      setSecondsRemaining(org.qrRotationSeconds || 60);
      if (onRefreshQR) onRefreshQR();
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setIsRotating(false), 500);
    }
  };

  useEffect(() => {
    generateToken();
  }, [user.id, user.status, org.qrRotationSeconds]);

  // Countdown timer for dynamic rotation
  useEffect(() => {
    if ((org.qrRotationSeconds || 60) <= 0) return;

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          generateToken();
          return org.qrRotationSeconds || 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [user.id, org.qrRotationSeconds]);

  const rotationPercent = Math.max(0, Math.min(100, (secondsRemaining / (org.qrRotationSeconds || 60)) * 100));

  // Export ID Card to PNG
  const handleDownloadPNG = async () => {
    if (!cardRef.current) return;
    setIsDownloading(true);
    try {
      // Temporarily ensure front face is active for clean snapshot
      const wasFlipped = isFlipped;
      setIsFlipped(false);
      await new Promise((r) => setTimeout(r, 200));

      const dataUrl = await toPng(cardRef.current, { quality: 0.95, pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `SecureID_Card_${user.memberNumber}_${user.fullName.replace(/\s+/g, '_')}.png`;
      link.href = dataUrl;
      link.click();
      if (wasFlipped) setIsFlipped(true);
    } catch (err) {
      console.error('Failed to export ID card PNG:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  // Export ID Card to PDF
  const handleDownloadPDF = async () => {
    if (!cardRef.current) return;
    setIsDownloading(true);
    try {
      const wasFlipped = isFlipped;
      setIsFlipped(false);
      await new Promise((r) => setTimeout(r, 200));

      const imgData = await toPng(cardRef.current, { quality: 0.95, pixelRatio: 2 });
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Background accent
      pdf.setFillColor(10, 15, 29);
      pdf.rect(0, 0, 210, 297, 'F');

      // Title & Org Header
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(20);
      pdf.text('SECURE DIGITAL IDENTITY CREDENTIAL', 105, 30, { align: 'center' });

      pdf.setFontSize(12);
      pdf.setTextColor(148, 163, 184);
      pdf.text(org.name.toUpperCase(), 105, 38, { align: 'center' });
      pdf.text(`Official Tamper-Evident ID Card • Issued for ${user.fullName}`, 105, 45, { align: 'center' });

      // Embed Card Image in the center
      // A typical ID card ratio ~ 85.6mm x 54mm scaled up nicely
      const cardWidth = 140;
      const cardHeight = 88;
      const xPos = (210 - cardWidth) / 2;
      const yPos = 60;

      pdf.addImage(imgData, 'PNG', xPos, yPos, cardWidth, cardHeight);

      // Security Verification Notes
      pdf.setFontSize(10);
      pdf.setTextColor(203, 213, 225);
      pdf.text('VERIFICATION & AUTHENTICITY INSTRUCTIONS:', 20, 165);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(148, 163, 184);
      pdf.text('1. Scan the encrypted dynamic QR code using any authorized SecureID Verifier scanner.', 20, 175);
      pdf.text('2. The embedded HMAC-SHA256 signature guarantees cryptographic authenticity and prevents forgery.', 20, 182);
      pdf.text(`3. Member ID: ${user.memberNumber} | Security Status: ${user.status.toUpperCase()} | Valid Until: ${user.validUntil}`, 20, 189);
      pdf.text(`4. Digital Token Nonce: ${qrData?.payload.nonce || 'N/A'} | System Timestamp: ${new Date().toISOString()}`, 20, 196);

      // Digital Seal
      pdf.setDrawColor(99, 102, 241);
      pdf.setLineWidth(0.5);
      pdf.line(20, 210, 190, 210);

      pdf.setFontSize(8);
      pdf.setTextColor(99, 102, 241);
      pdf.text('VERIFIED DIGITAL ISSUANCE AUTHORITY • SECUREID PLATFORM v1.0', 105, 220, { align: 'center' });

      pdf.save(`SecureID_Credential_${user.memberNumber}.pdf`);
      if (wasFlipped) setIsFlipped(true);
    } catch (e) {
      console.error('Failed to export PDF:', e);
    } finally {
      setIsDownloading(false);
    }
  };

  const getStatusBadge = () => {
    switch (user.status) {
      case 'active':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-semibold shadow-sm shadow-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            ACTIVE CREDENTIAL
          </div>
        );
      case 'expired':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-semibold">
            <Clock className="w-3.5 h-3.5" />
            EXPIRED
          </div>
        );
      case 'revoked':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-semibold shadow-sm shadow-rose-500/20">
            <ShieldAlert className="w-3.5 h-3.5" />
            REVOKED ACCESS
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-500/20 text-slate-300 border border-slate-500/40 text-xs font-semibold">
            PENDING
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* 3D Flip Card Container */}
      <div className="w-full max-w-[440px] perspective-1000 cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
        <div
          ref={cardRef}
          className={`relative w-full aspect-[1.58/1] rounded-2xl transition-transform duration-700 transform-style-3d shadow-2xl ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
        >
          {/* ================================================================= */}
          {/* FRONT FACE */}
          {/* ================================================================= */}
          <div className="absolute inset-0 w-full h-full backface-hidden rounded-2xl p-5 flex flex-col justify-between overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950/90 to-slate-950 border border-indigo-500/40 shadow-2xl shadow-indigo-950/80">
            {/* Hologram Iridescent Shimmer Overlay */}
            <div className="absolute inset-0 hologram-shimmer pointer-events-none opacity-40"></div>

            {/* Background Circuit Pattern Accent */}
            <div className="absolute right-0 bottom-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

            {/* Top Bar: Org Logo & Identity Type */}
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center shadow-md shadow-indigo-500/30">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white tracking-wider uppercase">{org.name}</h3>
                  <p className="text-[10px] font-mono text-cyan-300 uppercase tracking-widest">
                    Digital Smart ID • {user.role.toUpperCase()}
                  </p>
                </div>
              </div>

              {/* Status Pill */}
              <div>{getStatusBadge()}</div>
            </div>

            {/* Middle Section: Member Photo + Details + Dynamic QR */}
            <div className="relative z-10 flex items-center justify-between gap-3 mt-1">
              {/* Photo & Holographic Seal */}
              <div className="relative flex-shrink-0">
                <div className="relative w-20 h-20 sm:w-22 sm:h-22 rounded-xl overflow-hidden ring-2 ring-indigo-400/60 shadow-lg">
                  <img
                    src={user.photoUrl}
                    alt={user.fullName}
                    className="w-full h-full object-cover"
                  />
                  {/* Hologram Corner Badge */}
                  <div className="absolute bottom-0 right-0 bg-gradient-to-r from-cyan-400 to-indigo-500 p-1 rounded-tl-lg shadow">
                    <Fingerprint className="w-3 h-3 text-slate-950" />
                  </div>
                </div>
              </div>

              {/* User Bio Details */}
              <div className="flex-1 min-w-0 pr-1">
                <h4 className="text-base sm:text-lg font-extrabold text-white truncate leading-tight tracking-tight">
                  {user.fullName}
                </h4>
                <div className="flex items-center gap-1 text-[11px] font-mono text-indigo-300 font-bold mt-0.5">
                  <span>ID:</span>
                  <span className="bg-indigo-950/90 px-1.5 py-0.5 rounded border border-indigo-700/50">
                    {user.memberNumber}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 font-medium truncate mt-1 flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-slate-400 flex-shrink-0" />
                  {user.department}
                </p>
                <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                  <Calendar className="w-3 h-3 text-slate-500" />
                  Expires: <span className="text-slate-200 font-mono font-semibold">{user.validUntil}</span>
                </p>
              </div>

              {/* Cryptographic Dynamic QR Code */}
              <div className="relative flex-shrink-0 flex flex-col items-center">
                <div className="p-2 bg-white rounded-xl shadow-lg border border-indigo-200/40 relative group">
                  {qrData ? (
                    <QRCodeSVG
                      value={qrData.token}
                      size={74}
                      level="M"
                      includeMargin={false}
                    />
                  ) : (
                    <div className="w-[74px] h-[74px] bg-slate-200 animate-pulse rounded"></div>
                  )}
                  {/* Glowing Security Dot in Center */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-4 h-4 bg-indigo-600/90 rounded-full flex items-center justify-center shadow-md">
                      <Shield className="w-2.5 h-2.5 text-white" />
                    </div>
                  </div>
                </div>
                <span className="text-[9px] font-mono text-cyan-300 font-semibold mt-1">
                  TAP TO FLIP
                </span>
              </div>
            </div>

            {/* Bottom Bar: Anti-Fraud Rotating Hash & Nonce */}
            <div className="relative z-10 flex items-center justify-between pt-2 border-t border-indigo-900/60 text-[10px] text-slate-400 font-mono">
              <div className="flex items-center gap-1.5 truncate max-w-[240px]">
                <Lock className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                <span className="truncate">HMAC-SHA256: {qrData?.payload.sig.substring(0, 16)}...</span>
              </div>
              <div className="flex items-center gap-1 text-indigo-300 font-semibold flex-shrink-0">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span>NONCE: {qrData?.payload.nonce || 'TDCE'}</span>
              </div>
            </div>
          </div>

          {/* ================================================================= */}
          {/* BACK FACE */}
          {/* ================================================================= */}
          <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-2xl p-5 flex flex-col justify-between overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 border border-slate-700 shadow-2xl">
            {/* Top Bar on Back */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold text-slate-200 tracking-wider">OFFICIAL CREDENTIAL RECORD</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">ORG REF: {org.code}</span>
            </div>

            {/* Middle: Magnetic Stripe / Chip + Terms */}
            <div className="space-y-2 text-[11px] text-slate-300 my-auto">
              <div className="w-full h-7 bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 rounded flex items-center px-3 justify-between">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-amber-400/80"></div>
                  <div className="w-3 h-3 rounded-full bg-cyan-400/80"></div>
                </div>
                <span className="font-mono text-[9px] text-slate-400 tracking-widest">NFC // RFID ENABLED SMART CHIP</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px] pt-1">
                <div>
                  <span className="text-slate-500 block">Emergency Contact:</span>
                  <span className="text-slate-200 font-medium">{user.emergencyContact || 'Campus Security Ext. 101'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Issuing Authority:</span>
                  <span className="text-slate-200 font-medium">{user.issuedBy || 'Registrar Office'}</span>
                </div>
              </div>

              <p className="text-[9px] text-slate-400 leading-tight pt-1">
                Property of {org.name}. If found, return to Campus Security Office. Use is subject to organizational governance and safety compliance.
              </p>
            </div>

            {/* Bottom Bar: Barcode simulation & Signature */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              {/* Simulated 1D Barcode */}
              <div className="flex items-end gap-[2px] h-6">
                {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 3, 1, 2, 3, 1, 4, 2, 1, 3, 2, 4, 1, 2, 3].map((h, i) => (
                  <div
                    key={i}
                    className="bg-slate-300 w-[2px] rounded-t"
                    style={{ height: `${h * 5 + 6}px` }}
                  ></div>
                ))}
              </div>

              <div className="text-right">
                <div className="font-serif italic text-xs text-indigo-300 font-bold tracking-wider">
                  Sarah Connor
                </div>
                <span className="text-[8px] text-slate-500 font-mono uppercase block">Authorized Seal & Signature</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Token Live Rotation Progress Bar */}
      <div className="w-full max-w-[440px] mt-4 p-3 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <div className="flex items-center gap-1.5 text-slate-300 font-medium">
            <RotateCw className={`w-3.5 h-3.5 text-cyan-400 ${isRotating ? 'animate-spin' : ''}`} />
            <span>Anti-Replay Dynamic Token:</span>
          </div>
          <div className="flex items-center gap-1 font-mono text-cyan-400 font-semibold">
            <span>{secondsRemaining}s</span>
            <span className="text-[10px] text-slate-500">remaining</span>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 to-indigo-500 transition-all duration-1000 ease-linear rounded-full"
            style={{ width: `${rotationPercent}%` }}
          ></div>
        </div>

        <p className="text-[10px] text-slate-400 mt-1.5 text-center">
          QR token updates automatically every {org.qrRotationSeconds || 60}s to prevent static screenshot tampering.
        </p>
      </div>

      {/* Control Buttons (Flip, Regenerate, Download PNG, Download PDF) */}
      <div className="w-full max-w-[440px] grid grid-cols-3 gap-2 mt-3">
        <button
          onClick={() => setIsFlipped(!isFlipped)}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition border border-slate-700 shadow-sm"
        >
          <Layers className="w-3.5 h-3.5 text-indigo-400" />
          <span>{isFlipped ? 'Show Front' : 'Flip 3D Card'}</span>
        </button>

        <button
          onClick={generateToken}
          disabled={isRotating}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-semibold transition border border-indigo-500/30 shadow-sm"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isRotating ? 'animate-spin text-indigo-400' : 'text-indigo-400'}`} />
          <span>Refresh QR</span>
        </button>

        <div className="relative group flex">
          <button
            onClick={handleDownloadPNG}
            disabled={isDownloading}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-semibold transition shadow-md shadow-indigo-600/20"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>

          {/* Download Dropdown Option for PDF */}
          <div className="absolute right-0 bottom-full mb-1 hidden group-hover:flex flex-col bg-slate-900 border border-slate-700 rounded-lg p-1 shadow-xl z-50 w-36">
            <button
              onClick={handleDownloadPNG}
              className="text-left px-2 py-1.5 rounded text-[11px] text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-1.5"
            >
              <Download className="w-3 h-3 text-cyan-400" />
              <span>PNG Image</span>
            </button>
            <button
              onClick={handleDownloadPDF}
              className="text-left px-2 py-1.5 rounded text-[11px] text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-1.5"
            >
              <FileText className="w-3 h-3 text-indigo-400" />
              <span>Printable PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
