import type { Metadata } from 'next';
import './globals.css';
import { RoleSwitcher } from '@/components/RoleSwitcher';
import { Navbar } from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'SecureID — Digital Identity Verification Platform',
  description: 'Enterprise-grade digital identity issuance, dynamic signed QR verification, gate access control, and audit trail platform for colleges and organizations.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#090d16] text-slate-100 min-h-screen flex flex-col antialiased selection:bg-indigo-500 selection:text-white">
        <RoleSwitcher />
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
        <footer className="bg-slate-950/80 border-t border-slate-800/80 py-8 px-4 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-indigo-600 flex items-center justify-center text-white text-[10px] font-bold">
                S
              </div>
              <span className="font-semibold text-slate-300">SecureID Identity Network</span>
              <span>• DCE Edition</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Built with Next.js 15, HMAC-SHA256 Cryptographic Signing & Postgres RLS
            </p>
            <div className="flex gap-4 text-slate-400">
              <span>Gate Latency &lt; 2.0s</span>
              <span>•</span>
              <span>100% Tamper Evident</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
