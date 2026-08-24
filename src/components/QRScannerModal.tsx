'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { 
  Camera, 
  Upload, 
  Sparkles, 
  X, 
  Zap, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  ShieldCheck, 
  KeyRound, 
  FileCode,
  ScanLine
} from 'lucide-react';
import { store } from '@/lib/store';
import { createSignedQRToken } from '@/lib/crypto';
import { GateLocation } from '@/lib/types';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (decodedText: string) => void;
  activeGate: GateLocation;
}

export function QRScannerModal({ isOpen, onClose, onScanSuccess, activeGate }: QRScannerModalProps) {
  const [activeTab, setActiveTab] = useState<'camera' | 'upload' | 'presets'>('camera');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [isTorchOn, setIsTorchOn] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const qrRegionId = 'html5qr-code-region';

  // Initialize live camera
  useEffect(() => {
    if (!isOpen || activeTab !== 'camera') {
      stopScanner();
      return;
    }

    let isMounted = true;

    const startScanner = async () => {
      try {
        setCameraError(null);
        const html5QrCode = new Html5Qrcode(qrRegionId);
        scannerRef.current = html5QrCode;

        const config = {
          fps: 15,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        };

        await html5QrCode.start(
          { facingMode: 'environment' },
          config,
          (decodedText) => {
            if (isMounted) {
              stopScanner();
              onScanSuccess(decodedText);
            }
          },
          () => {
            // scan failure per frame - normal
          }
        );

        if (isMounted) setIsScanning(true);
      } catch (err: any) {
        if (isMounted) {
          console.warn('Camera start error:', err);
          setCameraError(
            err.name === 'NotAllowedError'
              ? 'Camera permission denied. Please allow camera access in your browser or use the Demo Presets / File Upload below.'
              : 'Could not connect to camera device. Switch to Demo Presets or upload an image.'
          );
        }
      }
    };

    const timeout = setTimeout(() => {
      startScanner();
    }, 200);

    return () => {
      isMounted = false;
      clearTimeout(timeout);
      stopScanner();
    };
  }, [isOpen, activeTab]);

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (e) {
        console.error('Error stopping scanner:', e);
      }
    }
    setIsScanning(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const html5QrCode = new Html5Qrcode(qrRegionId);
      const decodedText = await html5QrCode.scanFile(file, true);
      onScanSuccess(decodedText);
    } catch (err) {
      setCameraError('Failed to detect a valid QR code in the uploaded image.');
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      onScanSuccess(manualCode.trim());
    }
  };

  // Preset Handlers for instant testing without camera
  const handleTestPreset = async (type: 'active' | 'expired' | 'revoked' | 'tampered') => {
    const users = store.getUsers();

    if (type === 'active') {
      const user = users.find((u) => u.status === 'active' && u.role === 'user') || users[2];
      const { token } = await createSignedQRToken(user, 60);
      onScanSuccess(token);
    } else if (type === 'expired') {
      const user = users.find((u) => u.status === 'expired') || users[3];
      const { token } = await createSignedQRToken(user, 60);
      onScanSuccess(token);
    } else if (type === 'revoked') {
      const user = users.find((u) => u.status === 'revoked') || users[4];
      const { token } = await createSignedQRToken(user, 60);
      onScanSuccess(token);
    } else if (type === 'tampered') {
      const user = users[2];
      const { token } = await createSignedQRToken(user, 60);
      // Alter signature to trigger cryptographic tamper rejection
      const rawDecoded = atob(token);
      const parsed = JSON.parse(rawDecoded);
      parsed.sig = 'FORGED_TAMPERED_SIGNATURE_HASH_9999999999999999';
      const tamperedToken = btoa(JSON.stringify(parsed));
      onScanSuccess(tamperedToken);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <ScanLine className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Gate Scanner Reticle</h3>
              <p className="text-[11px] text-slate-400 font-mono">Location: {activeGate.name}</p>
            </div>
          </div>

          <button
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 p-1.5 gap-1 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('camera')}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition ${
              activeTab === 'camera'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Live Camera</span>
          </button>

          <button
            onClick={() => setActiveTab('presets')}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition ${
              activeTab === 'presets'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>1-Click Test Presets</span>
          </button>

          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition ${
              activeTab === 'upload'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Image</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 flex-1 overflow-y-auto">
          {/* CAMERA TAB */}
          {activeTab === 'camera' && (
            <div className="flex flex-col items-center justify-center">
              <div className="relative w-full aspect-square max-w-[320px] rounded-2xl overflow-hidden bg-slate-950 border-2 border-indigo-500/40 shadow-inner flex items-center justify-center">
                {/* HTML5 QR Code Container */}
                <div id={qrRegionId} className="w-full h-full"></div>

                {/* Laser scan line overlay */}
                {isScanning && <div className="scan-laser-line pointer-events-none"></div>}

                {/* Reticle Corner Brackets */}
                <div className="absolute inset-4 pointer-events-none border-2 border-transparent">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-cyan-400 rounded-tl"></div>
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-cyan-400 rounded-tr"></div>
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-cyan-400 rounded-bl"></div>
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-cyan-400 rounded-br"></div>
                </div>
              </div>

              {cameraError && (
                <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2 max-w-md">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Camera Access Notice</p>
                    <p className="text-[11px] text-rose-200/80 mt-0.5">{cameraError}</p>
                    <button
                      onClick={() => setActiveTab('presets')}
                      className="mt-2 inline-flex items-center gap-1 px-2 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-semibold"
                    >
                      <Sparkles className="w-3 h-3 text-cyan-300" />
                      Switch to 1-Click Test Presets
                    </button>
                  </div>
                </div>
              )}

              <p className="text-[11px] text-slate-400 mt-3 text-center">
                Align the member's dynamic QR code within the frame to verify identity in &lt;1 second.
              </p>
            </div>
          )}

          {/* 1-CLICK TEST PRESETS TAB */}
          {activeTab === 'presets' && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-slate-300">
                <p className="font-semibold text-indigo-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  Instant Verification Simulator:
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Click any identity scenario below to test the verification engine instantly with full cryptographic checks.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  onClick={() => handleTestPreset('active')}
                  className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-emerald-500/30 text-left transition flex items-start gap-3 group"
                >
                  <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 group-hover:scale-105 transition">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-emerald-300">Valid Active Member</h4>
                    <p className="text-[10px] text-slate-400">Alex Rivera (STU-2026-0941)</p>
                    <span className="text-[9px] font-mono text-emerald-400 font-semibold mt-1 inline-block">
                      Expect: ✅ PASS
                    </span>
                  </div>
                </button>

                <button
                  onClick={() => handleTestPreset('expired')}
                  className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-amber-500/30 text-left transition flex items-start gap-3 group"
                >
                  <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 group-hover:scale-105 transition">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-amber-300">Expired ID Credential</h4>
                    <p className="text-[10px] text-slate-400">Jordan Blake (Graduated 2024)</p>
                    <span className="text-[9px] font-mono text-amber-400 font-semibold mt-1 inline-block">
                      Expect: ❌ EXPIRED
                    </span>
                  </div>
                </button>

                <button
                  onClick={() => handleTestPreset('revoked')}
                  className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-rose-500/30 text-left transition flex items-start gap-3 group"
                >
                  <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400 group-hover:scale-105 transition">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-rose-300">Revoked Access Flag</h4>
                    <p className="text-[10px] text-slate-400">Sam Taylor (Dean Flagged)</p>
                    <span className="text-[9px] font-mono text-rose-400 font-semibold mt-1 inline-block">
                      Expect: ❌ REVOKED
                    </span>
                  </div>
                </button>

                <button
                  onClick={() => handleTestPreset('tampered')}
                  className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-purple-500/30 text-left transition flex items-start gap-3 group"
                >
                  <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400 group-hover:scale-105 transition">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-purple-300">Tampered / Forged Token</h4>
                    <p className="text-[10px] text-slate-400">Signature Hash Altered</p>
                    <span className="text-[9px] font-mono text-purple-400 font-semibold mt-1 inline-block">
                      Expect: ❌ FORGERY
                    </span>
                  </div>
                </button>
              </div>

              {/* Manual Input Form */}
              <form onSubmit={handleManualSubmit} className="pt-2 border-t border-slate-800 mt-3">
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  Or Paste Raw Encrypted QR Token / Member Number:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                    className="flex-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition"
                  >
                    Verify
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* UPLOAD IMAGE TAB */}
          {activeTab === 'upload' && (
            <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-700 rounded-2xl bg-slate-950/50">
              <Upload className="w-10 h-10 text-slate-400 mb-2" />
              <p className="text-xs font-semibold text-slate-200">Upload QR Code Image</p>
              <p className="text-[10px] text-slate-500 mt-0.5">PNG, JPG, WebP up to 10MB</p>

              <label className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs cursor-pointer transition shadow-md">
                <span>Select File from Device</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
