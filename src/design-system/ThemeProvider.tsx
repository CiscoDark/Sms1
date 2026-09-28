import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  actualTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function applyThemeToDom(resolved: 'light' | 'dark') {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (resolved === 'dark') {
    root.classList.add('dark');
    document.body.classList.add('dark');
    root.setAttribute('data-theme', 'dark');
    root.style.colorScheme = 'dark';
  } else {
    root.classList.remove('dark');
    document.body.classList.remove('dark');
    root.setAttribute('data-theme', 'light');
    root.style.colorScheme = 'light';
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const outerContext = useContext(ThemeContext);
  if (outerContext) {
    return <>{children}</>;
  }

  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('sms-theme') as Theme | null;
      if (stored && ['light', 'dark', 'system'].includes(stored)) return stored;
    }
    return 'light';
  });

  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('sms-theme') as Theme | null;
      if (stored === 'dark') return 'dark';
      if (stored === 'light') return 'light';
      if (stored === 'system') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
    }
    return 'light';
  });

  useEffect(() => {
    let resolved: 'light' | 'dark' = 'light';

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      resolved = mediaQuery.matches ? 'dark' : 'light';
      setActualTheme(resolved);
      applyThemeToDom(resolved);

      const handleChange = (e: MediaQueryListEvent) => {
        const newResolved = e.matches ? 'dark' : 'light';
        setActualTheme(newResolved);
        applyThemeToDom(newResolved);
      };

      mediaQuery.addEventListener('change', handleChange);
      try {
        localStorage.setItem('sms-theme', 'system');
      } catch {
        // ignore storage errors
      }
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      resolved = theme;
      setActualTheme(resolved);
      applyThemeToDom(resolved);
      try {
        localStorage.setItem('sms-theme', resolved);
      } catch {
        // ignore storage errors
      }
    }
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme: Theme = actualTheme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    setActualTheme(nextTheme);
    applyThemeToDom(nextTheme);
    try {
      localStorage.setItem('sms-theme', nextTheme);
    } catch {
      // ignore
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, actualTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

