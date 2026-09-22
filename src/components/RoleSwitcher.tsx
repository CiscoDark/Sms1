import React from 'react';
import { motion } from 'motion/react';
import {
  ShieldCheck,
  UserCheck,
  GraduationCap,
  BookOpen,
  WalletCards,
  Users,
  Award,
  ChevronDown,
  User,
  Sparkles,
} from 'lucide-react';
import { Role, UserProfile } from '../types';
import { INITIAL_USERS } from '../data/mockData';

export interface RoleSwitcherProps {
  currentUser: UserProfile;
  onSelectUser: (user: UserProfile) => void;
  onSwitchRole?: (newRole: Role) => void;
  onRoleChange?: (newRole: Role) => void;
  className?: string;
}

export const RoleSwitcher: React.FC<RoleSwitcherProps> = ({
  currentUser,
  onSelectUser,
  onSwitchRole,
  onRoleChange,
  className = '',
}) => {
  const handleRoleChangeInternal = (role: Role) => {
    onSwitchRole?.(role);
    onRoleChange?.(role);
  };
  const allRoles = currentUser.roles || [currentUser.role];
  const hasMultipleRoles = allRoles.length > 1;

  const getRoleIcon = (role: Role) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />;
      case 'PRINCIPAL':
        return <UserCheck className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />;
      case 'ACADEMIC_DIRECTOR':
        return <GraduationCap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />;
      case 'TEACHER':
        return <BookOpen className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />;
      case 'BURSAR':
        return <WalletCards className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />;
      case 'PARENT':
        return <Users className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />;
      case 'CLASS_CAPTAIN':
        return <Award className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />;
      case 'STUDENT':
        return <User className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />;
    }
  };

  const getRoleLabel = (role: Role) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'Admin View';
      case 'PRINCIPAL':
        return 'Principal View';
      case 'ACADEMIC_DIRECTOR':
        return 'Academic Dean';
      case 'TEACHER':
        return 'Teacher View';
      case 'BURSAR':
        return 'Bursar View';
      case 'PARENT':
        return 'Parent View';
      case 'CLASS_CAPTAIN':
        return 'Captain View';
      case 'STUDENT':
        return 'Student View';
    }
  };

  const getRoleBadge = (role: Role) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300 border-indigo-200';
      case 'PRINCIPAL':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300 border-purple-200';
      case 'ACADEMIC_DIRECTOR':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 border-emerald-200';
      case 'TEACHER':
        return 'bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-300 border-sky-200';
      case 'BURSAR':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 border-amber-200';
      case 'PARENT':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300 border-rose-200';
      case 'CLASS_CAPTAIN':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 border-amber-200';
      case 'STUDENT':
        return 'bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-300 border-teal-200';
    }
  };

  const handleRoleToggle = (selectedRole: Role) => {
    if (selectedRole === currentUser.role) return;

    const updatedUser: UserProfile = {
      ...currentUser,
      role: selectedRole,
    };

    onSelectUser(updatedUser);
    handleRoleChangeInternal(selectedRole);
  };

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* 1. ANIMATED MULTI-ROLE SWITCHER (Visible prominently when account holds 2+ roles) */}
      {hasMultipleRoles && (
        <div
          className="relative flex items-center p-1 bg-slate-900 text-white rounded-xl shadow-md border border-slate-700/80"
          title="Account holds multiple roles. Click to switch active view instantly without re-logging in."
        >
          <div className="flex items-center gap-1">
            {allRoles.map((role) => {
              const isActive = currentUser.role === role;
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleRoleToggle(role)}
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'text-slate-950 font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeRoleIndicator"
                      className="absolute inset-0 bg-white rounded-lg shadow-sm"
                      transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    {getRoleIcon(role)}
                    <span>{getRoleLabel(role)}</span>
                  </span>
                </button>
              );
            })}
          </div>
          <div className="hidden md:flex items-center pl-2 pr-1 border-l border-slate-700 text-[10px] text-amber-400 font-medium">
            <Sparkles className="w-3 h-3 mr-1 text-amber-400" />
            <span>Dual Role</span>
          </div>
        </div>
      )}

      {/* 2. USER PERSONA SELECTOR DROPDOWN */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/90 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-2xs">
        <div className="hidden lg:flex items-center gap-1 pl-2 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          <span>Persona:</span>
        </div>
        <div className="relative flex items-center">
          <select
            value={currentUser.id}
            onChange={(e) => {
              const found = INITIAL_USERS.find((u) => u.id === e.target.value);
              if (found) {
                onSelectUser(found);
                if (onSwitchRole) onSwitchRole(found.role);
              }
            }}
            className="appearance-none bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-semibold pl-2.5 pr-7 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            {INITIAL_USERS.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} (
                {(user.roles && user.roles.length > 1
                  ? user.roles.map((r) => r.replace('_', ' ')).join(' + ')
                  : user.role.replace('_', ' ')
                ).toLowerCase()}
                )
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 pointer-events-none" />
        </div>

        {/* Current Active Role Badge */}
        {!hasMultipleRoles && (
          <div className="flex items-center pr-1">
            <span
              className={`px-2 py-0.5 text-[10px] font-bold tracking-wider rounded-md uppercase border ${getRoleBadge(
                currentUser.role
              )}`}
            >
              {currentUser.role.replace('_', ' ')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
