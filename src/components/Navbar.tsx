'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { store } from '@/lib/store';
import { UserProfile, Organization } from '@/lib/types';
import { 
  Shield, 
  QrCode, 
  ScanLine, 
  LayoutDashboard, 
  Award, 
  History, 
  ChevronDown, 
  LogOut, 
  RotateCcw,
  Sparkles,
  Menu,
  X,
  ExternalLink,
  Lock
} from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<UserProfile>(store.getCurrentUser());
  const [org, setOrg] = useState<Organization>(store.getOrganization());
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    setCurrentUser(store.getCurrentUser());
    setOrg(store.getOrganization());

    const unsubscribe = store.subscribe(() => {
      setCurrentUser(store.getCurrentUser());
      setOrg(store.getOrganization());
    });
    return unsubscribe;
  }, []);

  const navLinks = [
    {
      name: 'Digital ID Card',
      href: '/dashboard/member',
      icon: QrCode,
      role: 'all',
      badge: currentUser.status === 'active' ? 'Active' : currentUser.status,
      badgeColor: currentUser.status === 'active' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300',
    },
    {
      name: 'Gate Scanner',
      href: '/dashboard/verifier',
      icon: ScanLine,
      role: 'verifier_or_admin',
      badge: 'Live',
      badgeColor: 'bg-cyan-500/20 text-cyan-300',
    },
    {
      name: 'Admin Console',
      href: '/dashboard/admin',
      icon: LayoutDashboard,
      role: 'admin',
      badge: 'RBAC',
      badgeColor: 'bg-purple-500/20 text-purple-300',
    },
  ];

  const handleResetData = () => {
    if (confirm('Reset demo database to original initial records?')) {
      store.resetToDefaults();
      setDropdownOpen(false);
    }
  };

  return (
    <nav className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-[37px] z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg text-white tracking-tight">SecureID</span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    DCE v1.0
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium hidden sm:block truncate max-w-[220px]">
                  {org.name}
                </p>
              </div>
            </Link>
          </div>

          {/* Desktop Nav Items */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              href="/"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === '/'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              Overview
            </Link>

            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
                    isActive
                      ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 font-semibold'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                  <span>{link.name}</span>
                  {link.badge && (
                    <span className={`text-[10px] font-mono uppercase px-1.5 py-0.2 rounded ${link.badgeColor}`}>
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right: Active Profile Dropdown & Action Controls */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2.5 p-1.5 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700/80 transition text-left"
              >
                <img
                  src={currentUser.photoUrl}
                  alt={currentUser.fullName}
                  className="w-8 h-8 rounded-lg object-cover ring-2 ring-indigo-500/40"
                />
                <div className="hidden sm:block pr-1">
                  <p className="text-xs font-semibold text-white leading-tight">{currentUser.fullName}</p>
                  <p className="text-[10px] text-slate-400 capitalize font-mono">
                    {currentUser.role} • {currentUser.memberNumber}
                  </p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl bg-slate-900/95 backdrop-blur-xl border border-slate-700 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="p-2 border-b border-slate-800 mb-1">
                    <p className="text-xs font-semibold text-white">{currentUser.fullName}</p>
                    <p className="text-[11px] text-slate-400 truncate">{currentUser.email}</p>
                    <p className="text-[10px] font-mono text-indigo-400 mt-1">{currentUser.department}</p>
                  </div>

                  <Link
                    href="/dashboard/member"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-300 hover:bg-slate-800 hover:text-white"
                  >
                    <QrCode className="w-4 h-4 text-indigo-400" />
                    <span>My Digital ID & Profile</span>
                  </Link>

                  <Link
                    href="/dashboard/verifier"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-300 hover:bg-slate-800 hover:text-white"
                  >
                    <ScanLine className="w-4 h-4 text-cyan-400" />
                    <span>Gate Scanner Console</span>
                  </Link>

                  <Link
                    href="/dashboard/admin"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-300 hover:bg-slate-800 hover:text-white"
                  >
                    <LayoutDashboard className="w-4 h-4 text-purple-400" />
                    <span>Admin Operations Center</span>
                  </Link>

                  <div className="border-t border-slate-800 my-1"></div>

                  <button
                    onClick={handleResetData}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-amber-300/90 hover:bg-amber-500/10 transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Demo Data to Default</span>
                  </button>

                  <Link
                    href="/auth/login"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-rose-300/90 hover:bg-rose-500/10 transition"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile menu hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 md:hidden"
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {menuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 pt-2 pb-4 space-y-1">
          <Link
            href="/"
            onClick={() => setMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-slate-200 hover:bg-slate-800"
          >
            Overview
          </Link>
          <Link
            href="/dashboard/member"
            onClick={() => setMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-slate-200 hover:bg-slate-800"
          >
            Digital ID Card
          </Link>
          <Link
            href="/dashboard/verifier"
            onClick={() => setMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-slate-200 hover:bg-slate-800"
          >
            Gate Scanner
          </Link>
          <Link
            href="/dashboard/admin"
            onClick={() => setMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-slate-200 hover:bg-slate-800"
          >
            Admin Center
          </Link>
        </div>
      )}
    </nav>
  );
}
