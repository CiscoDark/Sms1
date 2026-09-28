import { useState, useEffect } from 'react';

export type FormFactorMode = 'auto' | 'pc' | 'mobile' | 'tablet' | 'foldable' | 'foldable-4-3';
export type FormFactorType = 'pc' | 'mobile' | 'tablet' | 'foldable' | 'foldable-4-3';
export type NavLayoutMode = 'auto' | 'side' | 'top';
export type EffectiveNavLayout = 'side' | 'top';

export interface FormFactorInfo {
  mode: FormFactorMode;
  detected: FormFactorType;
  effective: FormFactorType;
  aspectRatio: number;
  width: number;
  height: number;
  isLandscape: boolean;
  navLayoutPreference: NavLayoutMode;
  effectiveNavLayout: EffectiveNavLayout;
}

/**
 * Detect the form factor based on window dimensions, aspect ratio, and folding/screen query heuristics.
 */
export function detectFormFactor(): {
  type: FormFactorType;
  aspectRatio: number;
  width: number;
  height: number;
} {
  if (typeof window === 'undefined') {
    return { type: 'pc', aspectRatio: 16 / 9, width: 1440, height: 900 };
  }

  const width = window.innerWidth;
  const height = window.innerHeight;
  const aspectRatio = width / (height || 1);

  // Check for dual-screen / foldable viewport segment media query if supported
  const isDualScreenFoldable =
    window.matchMedia?.('(horizontal-viewport-segments: 2)')?.matches ||
    window.matchMedia?.('(vertical-viewport-segments: 2)')?.matches;

  // 1. Mobile devices (< 768px width)
  if (width < 768) {
    // If small screen is nearly 4:3 (e.g. unfolded compact foldable)
    if (aspectRatio >= 1.20 && aspectRatio <= 1.48 && width >= 540) {
      return { type: 'foldable-4-3', aspectRatio, width, height };
    }
    return { type: 'mobile', aspectRatio, width, height };
  }

  // 2. Foldable Dual-Screen (Book style, approx square or dual segment)
  if (isDualScreenFoldable || (width >= 600 && width <= 1180 && aspectRatio >= 0.85 && aspectRatio <= 1.18)) {
    return { type: 'foldable', aspectRatio, width, height };
  }

  // 3. Foldable 4:3 (Aspect ratio between 1.20 and 1.48, such as 4:3 = 1.33)
  // This covers unfolded Pixel Fold, Galaxy Z Fold (inner display in landscape), Surface Duo, iPad 4:3 landscape
  if (width >= 700 && aspectRatio >= 1.20 && aspectRatio <= 1.48) {
    return { type: 'foldable-4-3', aspectRatio, width, height };
  }

  // 4. Tablet (768px - 1023px, portrait or tall aspect ratios)
  if (width >= 768 && width < 1024) {
    return { type: 'tablet', aspectRatio, width, height };
  }

  // 5. PC / Desktop (1024px+ wide displays, 16:9, 16:10, ultrawide)
  return { type: 'pc', aspectRatio, width, height };
}

/**
 * Determine effective navigation layout:
 * - 'side' = iPhone Duo / Web vertical side rail dock
 * - 'top' = Classic horizontal top bar
 */
export function resolveNavLayout(
  pref: NavLayoutMode,
  formFactor: FormFactorType
): EffectiveNavLayout {
  // Mobile devices (< 768px width) must ALWAYS use top navigation to preserve full viewport width
  if (formFactor === 'mobile') {
    return 'top';
  }

  if (pref === 'side') return 'side';
  if (pref === 'top') return 'top';

  // Auto behavior:
  // - Foldable 4:3: Defaults to SIDE rail (Duo style) to maximize precious vertical screen space!
  // - PC Desktop: Defaults to side bar for web productivity, or top bar if compact
  // - Foldable Book: Defaults to side bar
  // - Mobile: Defaults to top/swipe navigation
  // - Tablet: Defaults to side bar in landscape (aspectRatio > 1.2), top in portrait
  if (formFactor === 'foldable-4-3' || formFactor === 'foldable') {
    return 'side';
  }
  if (formFactor === 'pc') {
    return 'side'; // Duo style & web
  }
  return 'top';
}

const STORAGE_KEY_FORM_FACTOR = 'sms_form_factor_mode';
const STORAGE_KEY_NAV_LAYOUT = 'sms_nav_layout_mode';
const STORAGE_KEY_SIDEBAR_COLLAPSED = 'sms_sidebar_collapsed';

export function getStoredFormFactorMode(): FormFactorMode {
  try {
    const val = localStorage.getItem(STORAGE_KEY_FORM_FACTOR);
    if (val && ['auto', 'pc', 'mobile', 'tablet', 'foldable', 'foldable-4-3'].includes(val)) {
      return val as FormFactorMode;
    }
  } catch {
    // Ignore storage errors
  }
  return 'auto';
}

export function setStoredFormFactorMode(mode: FormFactorMode): void {
  try {
    localStorage.setItem(STORAGE_KEY_FORM_FACTOR, mode);
  } catch {
    // Ignore storage errors
  }
}

export function getStoredNavLayoutMode(): NavLayoutMode {
  try {
    const val = localStorage.getItem(STORAGE_KEY_NAV_LAYOUT);
    if (val && ['auto', 'side', 'top'].includes(val)) {
      return val as NavLayoutMode;
    }
  } catch {
    // Ignore storage errors
  }
  return 'auto';
}

export function setStoredNavLayoutMode(layout: NavLayoutMode): void {
  try {
    localStorage.setItem(STORAGE_KEY_NAV_LAYOUT, layout);
  } catch {
    // Ignore storage errors
  }
}

export function getStoredSidebarCollapsed(): boolean {
  try {
    const val = localStorage.getItem(STORAGE_KEY_SIDEBAR_COLLAPSED);
    return val === 'true';
  } catch {
    return false;
  }
}

export function setStoredSidebarCollapsed(collapsed: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY_SIDEBAR_COLLAPSED, collapsed ? 'true' : 'false');
  } catch {
    // Ignore storage errors
  }
}

/**
 * React Hook for Form Factor and Navigation layout state
 */
export function useFormFactor() {
  const [mode, setModeState] = useState<FormFactorMode>(() => getStoredFormFactorMode());
  const [navLayoutPreference, setNavLayoutPreferenceState] = useState<NavLayoutMode>(() =>
    getStoredNavLayoutMode()
  );
  const [isSidebarCollapsed, setIsSidebarCollapsedState] = useState<boolean>(() =>
    getStoredSidebarCollapsed()
  );

  const [dimensions, setDimensions] = useState(() => detectFormFactor());

  useEffect(() => {
    const handleResize = () => {
      setDimensions(detectFormFactor());
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  const detected = dimensions.type;
  const effective: FormFactorType = mode === 'auto' ? detected : mode;
  const effectiveNavLayout = resolveNavLayout(navLayoutPreference, effective);

  const setMode = (newMode: FormFactorMode) => {
    setModeState(newMode);
    setStoredFormFactorMode(newMode);
  };

  const setNavLayoutPreference = (newPref: NavLayoutMode) => {
    setNavLayoutPreferenceState(newPref);
    setStoredNavLayoutMode(newPref);
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsedState((prev) => {
      const next = !prev;
      setStoredSidebarCollapsed(next);
      return next;
    });
  };

  const setSidebarCollapsed = (collapsed: boolean) => {
    setIsSidebarCollapsedState(collapsed);
    setStoredSidebarCollapsed(collapsed);
  };

  return {
    mode,
    setMode,
    detected,
    effective,
    aspectRatio: dimensions.aspectRatio,
    width: dimensions.width,
    height: dimensions.height,
    navLayoutPreference,
    setNavLayoutPreference,
    effectiveNavLayout,
    isSidebarCollapsed,
    toggleSidebar,
    setSidebarCollapsed,
    isMobile: effective === 'mobile',
    isTablet: effective === 'tablet',
    isPc: effective === 'pc',
    isFoldable: effective === 'foldable',
    isFoldable43: effective === 'foldable-4-3',
  };
}
