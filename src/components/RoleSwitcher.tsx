'use client';

import React, { useEffect, useState } from 'react';
import { store } from '@/lib/store';
import { UserProfile, UserRole } from '@/lib/types';
import { Shield, UserCheck, ShieldAlert, Sparkles, RefreshCw, KeyRound, UserX, Clock } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function RoleSwitcher() {
  const [currentUser, setCurrentUser] = useState<UserProfile>(store.getCurrentUser());
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setCurrentUser(store.getCurrentUser());
    setAllUsers(store.getUsers());

    const unsubscribe = store.subscribe(() => {
      setCurrentUser(store.getCurrentUser());
      setAllUsers(store.getUsers());
    });
    return unsubscribe;
  }, []);

  const handleSelectUser = (user: UserProfile) => {
    store.setCurrentUser(user);
    setIsOpen(false);
  };

  const getRoleBadge = (role: UserRole, status: string) => {
    if (status === 'revoked') {
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30"><UserX className="w-3 h-3" /> Revoked</span>;
    }
    if (status === 'expired') {
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30"><Clock className="w-3 h-3" /> Expired</span>;
    }
    if (role === 'admin') {
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30"><Shield className="w-3 h-3" /> Admin</span>;
    }
    if (role === 'verifier') {
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"><KeyRound className="w-3 h-3" /> Verifier</span>;
    }
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"><UserCheck className="w-3 h-3" /> Active Member</span>;
  };

  return (
    <div className="bg-slate-950/80 border-b border-indigo-950/60 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: Interactive Demo Identity Switcher */}
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 font-mono uppercase tracking-wider text-indigo-400 font-bold bg-indigo-950/80 px-2.5 py-1 rounded-md border border-indigo-800/60">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            Quick Role Switcher:
          </span>

          <div className="flex items-center gap-1.5 flex-wrap">
            {allUsers.map((user) => {
              const isSelected = currentUser.id === user.id;
              return (
                <button
                  key={user.id}
                  onClick={() => handleSelectUser(user)}
                  className={`px-2.5 py-1 rounded-md flex items-center gap-1.5 transition-all text-xs font-medium ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 font-semibold ring-1 ring-indigo-400'
                      : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
                  }`}
                  title={`${user.fullName} (${user.role.toUpperCase()} - ${user.status.toUpperCase()})`}
                >
                  <img
                    src={user.photoUrl}
                    alt={user.fullName}
                    className="w-4 h-4 rounded-full object-cover border border-white/20"
                  />
                  <span>{user.fullName.split(' ')[0]}</span>
                  <span className="opacity-75 text-[10px]">
                    ({user.status === 'active' ? user.role : user.status})
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Active Identity Info + Quick Links */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <span className="text-slate-400">Acting as:</span>
            <span className="font-semibold text-slate-100">{currentUser.fullName}</span>
            {getRoleBadge(currentUser.role, currentUser.status)}
          </div>

          <div className="hidden md:flex items-center gap-1.5 bg-slate-900/80 px-2 py-1 rounded border border-slate-800">
            <Link
              href="/dashboard/member"
              className={`px-2 py-0.5 rounded transition ${
                pathname === '/dashboard/member' ? 'bg-indigo-500/20 text-indigo-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Member View
            </Link>
            <span className="text-slate-700">|</span>
            <Link
              href="/dashboard/verifier"
              className={`px-2 py-0.5 rounded transition ${
                pathname === '/dashboard/verifier' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Verifier Scanner
            </Link>
            <span className="text-slate-700">|</span>
            <Link
              href="/dashboard/admin"
              className={`px-2 py-0.5 rounded transition ${
                pathname === '/dashboard/admin' ? 'bg-purple-500/20 text-purple-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Admin Center
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
