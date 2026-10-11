import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Database,
  FileText,
  Inbox,
  KeyRound,
  ShieldAlert,
  History,
  Send,
  Eye,
  X
} from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab, pendingCount = 0, isOpen = false, onClose }) => {
  const { user } = useAuth();
  const role = user?.role || 'USER';

  const userNavItems = [
    { id: 'dashboard', label: 'Privacy Overview', icon: LayoutDashboard },
    { id: 'vault', label: 'Personal Vault', icon: Database },
    { id: 'documents', label: 'Secure Documents', icon: FileText },
    { id: 'requests', label: 'Access Requests', icon: Inbox, badge: pendingCount > 0 ? pendingCount : null },
    { id: 'permissions', label: 'Permissions & Scope', icon: KeyRound },
    { id: 'lock', label: 'Emergency Lock', icon: ShieldAlert, alert: user?.emergencyLockActive },
    { id: 'audit', label: 'Audit Trail', icon: History },
  ];

  const orgNavItems = [
    { id: 'dashboard', label: 'Console Overview', icon: LayoutDashboard },
    { id: 'request-access', label: 'Request Access', icon: Send },
    { id: 'org-requests', label: 'Sent Requests', icon: Inbox },
    { id: 'authorized-data', label: 'Authorized Vault Data', icon: Eye },
    { id: 'audit', label: 'Access History', icon: History },
  ];

  const adminNavItems = [
    { id: 'dashboard', label: 'System Overview', icon: LayoutDashboard },
    { id: 'audit', label: 'Platform Audit Logs', icon: History },
  ];

  const navItems = role === 'ORGANIZATION' ? orgNavItems : role === 'ADMIN' ? adminNavItems : userNavItems;

  const handleSelect = (id) => {
    setActiveTab(id);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        className={`dv-sidebar-overlay ${isOpen ? 'open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className={`dv-sidebar ${isOpen ? 'open' : ''}`}>
        {/* Brand Header */}
        <div style={{
          padding: '20px 20px',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-primary)'
              }}></span>
              <span style={{
                fontFamily: 'var(--font-editorial)',
                fontSize: '1.35rem',
                fontWeight: 500,
                letterSpacing: '-0.02em',
                color: 'var(--color-text-main)'
              }}>
                DataVault
              </span>
            </div>
            <div style={{
              fontSize: '0.72rem',
              color: 'var(--color-text-secondary)',
              marginTop: '1px',
              letterSpacing: '0.02em',
              textTransform: 'uppercase'
            }}>
              {role === 'ORGANIZATION' ? 'Organization Portal' : role === 'ADMIN' ? 'Admin Platform' : 'Personal Privacy'}
            </div>
          </div>

          {/* Mobile close button */}
          <button
            type="button"
            onClick={onClose}
            className="dv-btn dv-btn-secondary dv-btn-sm"
            style={{ display: isOpen ? 'inline-flex' : 'none', padding: '4px' }}
            aria-label="Close sidebar menu"
          >
            <X size={16} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav style={{ padding: '16px 10px', display: 'flex', flexDirection: 'column', gap: '3px', flex: 1, overflowY: 'auto' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid',
                  borderColor: isActive ? 'var(--color-border)' : 'transparent',
                  backgroundColor: isActive ? 'var(--color-sage-soft)' : 'transparent',
                  color: isActive ? 'var(--color-text-main)' : 'var(--color-text-secondary)',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '0.86rem',
                  fontFamily: 'var(--font-sans)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.12s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'var(--color-surface-subtle)';
                    e.currentTarget.style.color = 'var(--color-text-main)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--color-text-secondary)';
                  }
                }}
              >
                <Icon size={16} style={{ color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)' }} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge && (
                  <span className="dv-badge dv-badge-warning" style={{ fontSize: '0.68rem', padding: '1px 5px' }}>
                    {item.badge}
                  </span>
                )}
                {item.alert && (
                  <span className="dv-badge dv-badge-danger" style={{ fontSize: '0.65rem', padding: '1px 5px' }}>
                    Locked
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom System Identity */}
        <div style={{
          padding: '16px 18px',
          borderTop: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-surface-subtle)',
          fontSize: '0.74rem',
          color: 'var(--color-text-muted)'
        }}>
          <div style={{ fontWeight: 600, color: 'var(--color-text-secondary)' }}>
            AES-256-GCM Cryptographic Vault
          </div>
          <div style={{ marginTop: '2px' }}>
            Zero-Trust Server Policy
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
