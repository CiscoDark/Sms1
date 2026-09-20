import React from 'react';
import { ShieldCheck, UserCheck, GraduationCap, BookOpen, WalletCards } from 'lucide-react';
import { Role, UserProfile } from '../types';
import { INITIAL_USERS } from '../data/mockData';

export interface RoleSwitcherProps {
  currentUser: UserProfile;
  onSelectUser: (user: UserProfile) => void;
  className?: string;
}

export const RoleSwitcher: React.FC<RoleSwitcherProps> = ({
  currentUser,
  onSelectUser,
  className = '',
}) => {
  const getRoleIcon = (role: Role) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
      case 'PRINCIPAL':
        return <UserCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      case 'ACADEMIC_DIRECTOR':
        return <GraduationCap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'TEACHER':
        return <BookOpen className="w-4 h-4 text-sky-600 dark:text-sky-400" />;
      case 'BURSAR':
        return <WalletCards className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
    }
  };

  const getRoleBadge = (role: Role) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300';
      case 'PRINCIPAL':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300';
      case 'ACADEMIC_DIRECTOR':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300';
      case 'TEACHER':
        return 'bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-300';
      case 'BURSAR':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300';
    }
  };

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-2xs">
        <div className="hidden sm:flex items-center gap-1.5 pl-2 pr-1 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          <span>Role:</span>
        </div>
        <select
          value={currentUser.id}
          onChange={(e) => {
            const found = INITIAL_USERS.find((u) => u.id === e.target.value);
            if (found) onSelectUser(found);
          }}
          className="appearance-none bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-medium pl-2.5 pr-8 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
        >
          {INITIAL_USERS.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name} ({user.role.replace('_', ' ')})
            </option>
          ))}
        </select>
        <div className="flex items-center pr-1.5">
          <span
            className={`px-2 py-0.5 text-[10px] font-bold tracking-wider rounded-md uppercase ${getRoleBadge(
              currentUser.role
            )}`}
          >
            {currentUser.role.replace('_', ' ')}
          </span>
        </div>
      </div>
    </div>
  );
};
