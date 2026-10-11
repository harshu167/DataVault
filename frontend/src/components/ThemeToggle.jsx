import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

const ThemeToggle = ({ compact = false, showLabel = false }) => {
  const { theme, isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="dv-btn dv-btn-secondary dv-btn-sm"
      style={{
        padding: compact ? '6px 8px' : '6px 12px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '0.8rem',
      }}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Currently in ${theme} mode. Click to toggle.`}
    >
      {isDark ? (
        <Sun size={15} style={{ color: 'var(--color-primary)' }} />
      ) : (
        <Moon size={15} style={{ color: 'var(--color-primary)' }} />
      )}
      {showLabel && <span>{isDark ? 'Light' : 'Dark'}</span>}
    </button>
  );
};

export default ThemeToggle;
