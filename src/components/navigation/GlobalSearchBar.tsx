import React, { useState, useRef, useEffect } from 'react';
import { Search, User, X, ArrowRight, ShieldCheck, ChevronRight } from 'lucide-react';
import { Student } from '../../types';

interface GlobalSearchBarProps {
  students: Student[];
  onSelectStudent: (student: Student) => void;
  inputRef?: React.RefObject<HTMLInputElement>;
}

export const GlobalSearchBar: React.FC<GlobalSearchBarProps> = ({
  students,
  onSelectStudent,
  inputRef,
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter students based on name or admission number
  const filtered = query.trim().length > 0
    ? students.filter((s) => {
        const q = query.toLowerCase();
        const fullName = `${s.firstName} ${s.middleName || ''} ${s.lastName}`.toLowerCase();
        const adm = s.admissionNumber.toLowerCase();
        const cls = `${s.classLevel} ${s.classArm}`.toLowerCase();
        return fullName.includes(q) || adm.includes(q) || cls.includes(q);
      }).slice(0, 7)
    : [];

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full max-w-xs sm:max-w-sm">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          placeholder="Search students, ID (Ctrl+K)..."
          className="w-full pl-9 pr-8 py-1.5 text-xs bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-white/70 dark:border-slate-700/60 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white/90 dark:focus:bg-slate-800/90 shadow-2xs transition-all"
        />
        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setIsOpen(false);
            }}
            className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-mono text-slate-400 dark:text-slate-500 bg-white/80 dark:bg-slate-700/80 rounded border border-white/80 dark:border-slate-600">
              ⌘K
            </kbd>
          </div>
        )}
      </div>

      {/* Dropdown Results */}
      {isOpen && query.trim().length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white/88 dark:bg-slate-900/85 backdrop-blur-2xl border border-white/80 dark:border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.14)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 overflow-hidden divide-y divide-white/40 dark:divide-white/6">
          <div className="p-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-white/40 dark:bg-slate-800/40 backdrop-blur-xs">
            Student Matches ({filtered.length})
          </div>

          {filtered.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500 dark:text-slate-400">
              No students found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto divide-y divide-white/40 dark:divide-white/6">
              {filtered.map((student) => (
                <button
                  key={student.id}
                  type="button"
                  onClick={() => {
                    onSelectStudent(student);
                    setIsOpen(false);
                    setQuery('');
                  }}
                  className="w-full text-left p-2.5 hover:bg-white/70 dark:hover:bg-slate-800/70 flex items-center justify-between gap-3 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 font-bold text-xs">
                      {student.firstName[0]}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate">
                        {student.firstName} {student.lastName}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-mono">
                        <span>{student.admissionNumber}</span>
                        <span>•</span>
                        <span>{student.classLevel} {student.classArm}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 text-slate-400 group-hover:text-indigo-500">
                    <span className="text-[10px] font-medium hidden sm:inline">Dossier</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
