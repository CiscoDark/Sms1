import React, { useState, useRef, useEffect } from 'react';
import {
  Monitor,
  Smartphone,
  Tablet,
  BookOpen,
  Maximize2,
  Sliders,
  Check,
  ChevronDown,
  LayoutTemplate,
  SidebarClose,
  SidebarOpen,
  Info,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FormFactorMode,
  FormFactorType,
  NavLayoutMode,
  EffectiveNavLayout,
} from '../../lib/form-factor-store';

interface FormFactorSwitcherProps {
  currentMode: FormFactorMode;
  detectedType: FormFactorType;
  effectiveType: FormFactorType;
  aspectRatio: number;
  width: number;
  height: number;
  navLayoutPreference: NavLayoutMode;
  effectiveNavLayout: EffectiveNavLayout;
  onSelectMode: (mode: FormFactorMode) => void;
  onSelectNavLayout: (layout: NavLayoutMode) => void;
  simulateDeviceFrame?: boolean;
  onToggleDeviceFrame?: (enabled: boolean) => void;
  compact?: boolean;
}

export const FormFactorSwitcher: React.FC<FormFactorSwitcherProps> = ({
  currentMode,
  detectedType,
  effectiveType,
  aspectRatio,
  width,
  height,
  navLayoutPreference,
  effectiveNavLayout,
  onSelectMode,
  onSelectNavLayout,
  simulateDeviceFrame = false,
  onToggleDeviceFrame,
  compact = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const formFactorOptions: {
    id: FormFactorMode;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }[] = [
    {
      id: 'auto',
      label: 'Auto Detect',
      description: `Adapts dynamically to viewport (${width}×${height}, ${aspectRatio.toFixed(2)}:1)`,
      icon: Sliders,
      badge: `Live: ${detectedType}`,
    },
    {
      id: 'foldable-4-3',
      label: 'Foldable (4:3 Duo)',
      description: 'Optimized for 4:3 unfolded screens with iPhone Duo-style side bar',
      icon: BookOpen,
      badge: 'Duo Style',
    },
    {
      id: 'pc',
      label: 'PC / Desktop',
      description: 'Full-density widescreen desktop & web interface',
      icon: Monitor,
      badge: '16:9 Wide',
    },
    {
      id: 'tablet',
      label: 'Tablet',
      description: 'Balanced two-column layout for mid-sized touchscreens',
      icon: Tablet,
      badge: '768-1024px',
    },
    {
      id: 'foldable',
      label: 'Foldable (Dual Pane)',
      description: 'Multi-pane book layout for unfolded dual screens',
      icon: BookOpen,
      badge: 'Split Screen',
    },
    {
      id: 'mobile',
      label: 'Mobile Phone',
      description: 'Single-column thumb-reachable flow with gesture navigation',
      icon: Smartphone,
      badge: '< 768px',
    },
  ];

  const getEffectiveIcon = () => {
    switch (effectiveType) {
      case 'mobile':
        return Smartphone;
      case 'tablet':
        return Tablet;
      case 'foldable':
      case 'foldable-4-3':
        return BookOpen;
      case 'pc':
      default:
        return Monitor;
    }
  };

  const IconComponent = getEffectiveIcon();

  const getEffectiveLabel = () => {
    if (currentMode === 'auto') {
      if (effectiveType === 'foldable-4-3') return 'Foldable 4:3';
      if (effectiveType === 'pc') return 'PC Web';
      if (effectiveType === 'tablet') return 'Tablet';
      if (effectiveType === 'mobile') return 'Mobile';
      if (effectiveType === 'foldable') return 'Foldable';
      return 'Auto';
    }
    const match = formFactorOptions.find((o) => o.id === currentMode);
    return match ? match.label : currentMode;
  };

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl border backdrop-blur-md transition-all cursor-pointer active:bg-slate-200/50 dark:active:bg-slate-700/50 active:scale-95 shadow-2xs ${
          isOpen
            ? 'bg-indigo-50/90 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700'
            : 'bg-white/65 dark:bg-slate-800/65 text-slate-700 dark:text-slate-300 border-white/70 dark:border-slate-700/60 hover:bg-white/85 dark:hover:bg-slate-700/80'
        }`}
        title={`Current Form Factor: ${effectiveType} (${aspectRatio.toFixed(2)}:1). Click to change form factor or layout.`}
        aria-label="Form Factor and Layout Settings"
        aria-expanded={isOpen}
      >
        <IconComponent className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
        {!compact && (
          <span className="hidden sm:inline truncate max-w-[110px]">
            {getEffectiveLabel()}
          </span>
        )}
        {effectiveNavLayout === 'side' && !compact && (
          <span className="hidden lg:inline text-[9px] px-1 py-0.2 rounded bg-indigo-100/80 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold uppercase tracking-wider border border-indigo-200/50 dark:border-indigo-800/50">
            Duo
          </span>
        )}
        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-white/85 dark:bg-slate-900/85 backdrop-blur-2xl rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/80 dark:border-white/10 z-50 p-3.5 space-y-3"
          >
            {/* Header info */}
            <div className="flex items-center justify-between pb-2 border-b border-white/60 dark:border-white/10">
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <LayoutTemplate className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Form Factor & Layout</span>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Live Viewport: {width}×{height} ({aspectRatio.toFixed(2)}:1)
                </div>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-white/60 dark:bg-slate-800/60 backdrop-blur-xs border border-white/70 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 font-medium">
                {effectiveType.toUpperCase()}
              </span>
            </div>

            {/* Navigation Layout Section: iPhone Duo Side Bar vs Top Bar */}
            <div className="bg-white/50 dark:bg-slate-800/40 backdrop-blur-sm rounded-xl p-2.5 border border-white/70 dark:border-white/8 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-800 dark:text-slate-200">
                <span>Navigation Style</span>
                <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400">
                  {effectiveNavLayout === 'side' ? 'iPhone Duo Side Bar' : 'Classic Top Bar'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => onSelectNavLayout('side')}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium border transition-all cursor-pointer active:bg-slate-200/50 dark:active:bg-slate-700/50 active:scale-95 ${
                    effectiveNavLayout === 'side'
                      ? 'bg-indigo-600 text-white border-indigo-600 font-bold shadow-xs'
                      : 'bg-white/70 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 border-white/80 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700'
                  }`}
                >
                  <SidebarOpen className="w-3.5 h-3.5" />
                  <span>Side Bar (Duo)</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSelectNavLayout('top')}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium border transition-all cursor-pointer active:bg-slate-200/50 dark:active:bg-slate-700/50 active:scale-95 ${
                    effectiveNavLayout === 'top'
                      ? 'bg-indigo-600 text-white border-indigo-600 font-bold shadow-xs'
                      : 'bg-white/70 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 border-white/80 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700'
                  }`}
                >
                  <LayoutTemplate className="w-3.5 h-3.5" />
                  <span>Top Bar</span>
                </button>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                iPhone Duo style docks the navigation rail to the side to preserve 100% of vertical height on 4:3 and web.
              </p>
            </div>

            {/* Form Factor Options */}
            <div className="space-y-1">
              <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 px-1 mb-1">
                Target Form Factor
              </div>
              {formFactorOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = currentMode === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      onSelectMode(opt.id);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left p-2 rounded-xl flex items-center justify-between gap-2 transition-all cursor-pointer active:bg-slate-200/50 dark:active:bg-slate-700/50 active:scale-[0.99] ${
                      isSelected
                        ? 'bg-indigo-50/90 dark:bg-indigo-950/70 border border-indigo-200/80 dark:border-indigo-800/80 text-indigo-900 dark:text-indigo-100 shadow-2xs'
                        : 'hover:bg-white/70 dark:hover:bg-slate-800/70 border border-transparent text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : 'bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border border-white/60 dark:border-slate-700/60'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold flex items-center gap-1.5">
                          <span>{opt.label}</span>
                          {opt.badge && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium">
                              {opt.badge}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                          {opt.description}
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Optional Device Frame Simulation for Desktop Previewing */}
            {onToggleDeviceFrame && (
              <div className="pt-2 border-t border-white/60 dark:border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Maximize2 className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    Device Frame Wrapper
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onToggleDeviceFrame(!simulateDeviceFrame)}
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full border transition-all cursor-pointer active:bg-slate-200/50 dark:active:bg-slate-700/50 ${
                    simulateDeviceFrame
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {simulateDeviceFrame ? 'ON' : 'OFF'}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
