import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { privacyLockAPI } from '../services/api';
import ThemeToggle from './ThemeToggle';
import { ShieldCheck, ShieldAlert, LogOut, Menu, User, Building2 } from 'lucide-react';

const Navbar = ({ onToggleMobileMenu }) => {
  const { user, logout, updateLockState } = useAuth();
  const [locking, setLocking] = useState(false);

  const handleQuickLockToggle = async () => {
    if (!user || user.role !== 'USER') return;
    setLocking(true);
    try {
      const res = await privacyLockAPI.toggle(!user.emergencyLockActive);
      if (res.data && res.data.data) {
        updateLockState(res.data.data.emergencyLockActive);
      }
    } catch (err) {
      alert('Failed to update privacy lock: ' + (err.response?.data?.message || err.message));
    } finally {
      setLocking(false);
    }
  };

  const isLockActive = user?.emergencyLockActive;

  return (
    <header className="dv-topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Mobile menu trigger */}
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="dv-btn dv-btn-secondary dv-btn-sm"
          style={{ display: 'none', padding: '6px' }}
          id="mobile-menu-btn"
          aria-label="Toggle navigation menu"
        >
          <Menu size={18} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            fontFamily: 'var(--font-editorial)',
            fontSize: '1.15rem',
            fontWeight: 500,
            color: 'var(--color-text-main)'
          }}>
            DataVault Console
          </span>
          <span style={{ color: 'var(--color-border)', margin: '0 4px' }}>/</span>
          <span className={`dv-badge ${user?.role === 'ORGANIZATION' ? 'dv-badge-info' : 'dv-badge-neutral'}`}>
            {user?.role === 'ORGANIZATION' ? 'Organization Portal' : user?.role === 'ADMIN' ? 'System Console' : 'Personal Vault'}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Emergency Lock Quick Toggle (USER only) */}
        {user?.role === 'USER' && (
          <button
            type="button"
            onClick={handleQuickLockToggle}
            disabled={locking}
            className={`dv-btn dv-btn-sm ${isLockActive ? 'dv-btn-danger' : 'dv-btn-secondary'}`}
            style={{ fontSize: '0.78rem' }}
            title={isLockActive ? 'Emergency Privacy Lock is engaged. Click to restore normal sharing.' : 'Click to activate Emergency Privacy Lock.'}
          >
            {isLockActive ? (
              <>
                <ShieldAlert size={14} />
                <span>Lock Active</span>
              </>
            ) : (
              <>
                <ShieldCheck size={14} style={{ color: 'var(--color-sage)' }} />
                <span>Lock Inactive</span>
              </>
            )}
          </button>
        )}

        {/* Theme Toggle Button */}
        <ThemeToggle />

        {/* User Identity Chip */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '4px 10px',
          backgroundColor: 'var(--color-surface-subtle)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--color-border)'
        }}>
          {user?.role === 'ORGANIZATION' ? (
            <Building2 size={14} style={{ color: 'var(--color-text-secondary)' }} />
          ) : (
            <User size={14} style={{ color: 'var(--color-text-secondary)' }} />
          )}
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-main)', maxWidth: '140px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {user?.organizationName || user?.fullName}
          </span>
        </div>

        {/* Sign Out */}
        <button
          type="button"
          onClick={logout}
          className="dv-btn dv-btn-secondary dv-btn-sm"
          style={{ color: 'var(--status-danger-text)' }}
          title="Sign out securely"
        >
          <LogOut size={14} />
          <span style={{ display: 'inline-block' }}>Sign Out</span>
        </button>
      </div>

      <style>{`
        @media (max-width: 900px) {
          #mobile-menu-btn {
            display: inline-flex !important;
          }
        }
      `}</style>
    </header>
  );
};

export default Navbar;
