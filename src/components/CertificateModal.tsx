'use client';

import React, { useRef, useState } from 'react';
import { Certificate } from '@/lib/types';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Award, 
  Download, 
  X, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  Calendar, 
  Building2,
  FileCheck
} from 'lucide-react';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

interface CertificateModalProps {
  certificate: Certificate | null;
  onClose: () => void;
}

export function CertificateModal({ certificate, onClose }: CertificateModalProps) {
  const [isExporting, setIsExporting] = useState(false);
  const certRef = useRef<HTMLDivElement>(null);

  if (!certificate) return null;

  const handleDownloadPDF = async () => {
    if (!certRef.current) return;
    setIsExporting(true);
    try {
      const imgData = await toPng(certRef.current, { quality: 0.98, pixelRatio: 2.5 });
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      pdf.addImage(imgData, 'PNG', 0, 0, 297, 210);
      pdf.save(`SecureID_Certificate_${certificate.certificateNumber}.pdf`);
    } catch (e) {
      console.error('Certificate PDF export failed:', e);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Verifiable Digital Certificate</h3>
              <p className="text-[11px] font-mono text-slate-400">ID: {certificate.certificateNumber}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-semibold shadow-md transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExporting ? 'Generating PDF...' : 'Download Official PDF'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Display Canvas */}
        <div className="p-6 overflow-y-auto flex justify-center bg-slate-950/40">
          <div
            ref={certRef}
            className="w-full max-w-3xl aspect-[1.414/1] bg-gradient-to-br from-slate-900 via-indigo-950/80 to-slate-950 border-4 border-amber-500/40 rounded-2xl p-8 flex flex-col justify-between relative shadow-2xl overflow-hidden"
          >
            {/* Decorative Corner Ornaments */}
            <div className="absolute top-2 left-2 w-10 h-10 border-t-2 border-l-2 border-amber-400/80"></div>
            <div className="absolute top-2 right-2 w-10 h-10 border-t-2 border-r-2 border-amber-400/80"></div>
            <div className="absolute bottom-2 left-2 w-10 h-10 border-b-2 border-l-2 border-amber-400/80"></div>
            <div className="absolute bottom-2 right-2 w-10 h-10 border-b-2 border-r-2 border-amber-400/80"></div>

            {/* Inner Border */}
            <div className="absolute inset-4 border border-amber-500/20 rounded-xl pointer-events-none"></div>

            {/* Background Watermark Crest */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
              <Award className="w-96 h-96 text-white" />
            </div>

            {/* Top Certificate Header */}
            <div className="relative z-10 text-center space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono tracking-widest uppercase mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                {certificate.orgName}
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-400 tracking-wider uppercase font-serif">
                Certificate of Authenticity
              </h2>
              <p className="text-xs text-slate-400 tracking-widest uppercase">
                THIS IS PROUDLY PRESENTED TO
              </p>
            </div>

            {/* Recipient Name */}
            <div className="relative z-10 text-center my-auto py-2">
              <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight underline decoration-amber-500/50 underline-offset-8">
                {certificate.userName}
              </h3>
              <p className="text-xs font-mono text-indigo-300 mt-2 font-semibold">
                Member ID: {certificate.memberNumber}
              </p>

              <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto mt-4 leading-relaxed font-sans">
                {certificate.description}
              </p>

              <div className="inline-block mt-3 px-4 py-1.5 rounded-lg bg-indigo-950/60 border border-indigo-500/30 text-indigo-200 font-bold text-xs sm:text-sm">
                {certificate.title}
              </div>
            </div>

            {/* Bottom Section: QR Authenticity Verification + Signature */}
            <div className="relative z-10 flex items-end justify-between pt-4 border-t border-slate-800">
              {/* Left: Verifiable Cryptographic QR Code */}
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-white rounded-lg shadow-md">
                  <QRCodeSVG
                    value={`https://secureid.techverse.edu/verify?cert=${certificate.certificateNumber}`}
                    size={60}
                    level="H"
                  />
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  <span className="text-amber-400 font-bold block flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Cryptographically Sealed
                  </span>
                  <span>Issued: {certificate.issueDate}</span>
                  <span className="block text-slate-500">Hash: {certificate.qrProofToken.substring(0, 16)}...</span>
                </div>
              </div>

              {/* Right: Dean / Signatory Signature */}
              <div className="text-center">
                <div className="font-serif italic text-base sm:text-lg text-amber-300 font-bold tracking-wider">
                  {certificate.signatoryName}
                </div>
                <div className="w-36 h-[1px] bg-amber-500/40 mx-auto my-0.5"></div>
                <span className="text-[10px] text-slate-400 uppercase font-mono block">
                  {certificate.signatoryTitle}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
