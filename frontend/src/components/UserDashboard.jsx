import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI, privacyLockAPI } from '../services/api';
import {
  Database,
  FileText,
  Inbox,
  KeyRound,
  ShieldAlert,
  ShieldCheck,
  Plus,
  Upload,
  ArrowRight,
  Clock
} from 'lucide-react';

const UserDashboard = ({ setActiveTab }) => {
  const { user, updateLockState } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lockLoading, setLockLoading] = useState(false);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await dashboardAPI.getStats();
      if (res.data && res.data.data) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleToggleLock = async () => {
    setLockLoading(true);
    try {
      const nextState = !user?.emergencyLockActive;
      const res = await privacyLockAPI.toggle(nextState);
      if (res.data && res.data.data) {
        updateLockState(res.data.data.emergencyLockActive);
        await fetchStats();
      }
    } catch (err) {
      alert('Failed to toggle Emergency Privacy Lock: ' + (err.response?.data?.message || err.message));
    } finally {
      setLockLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '36px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
        Retrieving verified vault status...
      </div>
    );
  }

  const isLockActive = user?.emergencyLockActive || stats?.emergencyLockActive;

  return (
    <div>
      {/* Editorial Page Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 500, color: 'var(--color-text-main)' }}>
          Privacy Dashboard
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.88rem', marginTop: '3px' }}>
          Personal vault overview for {user?.fullName}. Encrypted records, document status, and external permissions.
        </p>
      </div>

      {/* Emergency Privacy Lock Notice Banner */}
      <div
        className="dv-panel"
        style={{
          padding: '16px 20px',
          marginBottom: '24px',
          backgroundColor: isLockActive ? 'var(--status-danger-bg)' : 'var(--color-surface)',
          borderColor: isLockActive ? 'var(--status-danger-border)' : 'var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {isLockActive ? (
            <ShieldAlert size={22} style={{ color: 'var(--status-danger-text)', flexShrink: 0 }} />
          ) : (
            <ShieldCheck size={22} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
          )}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 600, fontSize: '0.95rem', color: isLockActive ? 'var(--status-danger-text)' : 'var(--color-text-main)' }}>
                {isLockActive ? 'Emergency Privacy Lock is Engaged' : 'Sharing Policy Normal'}
              </span>
              <span className={`dv-badge ${isLockActive ? 'dv-badge-danger' : 'dv-badge-active'}`}>
                {isLockActive ? 'Suspended' : 'Protected'}
              </span>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', marginTop: '2px', maxWidth: '640px' }}>
              {isLockActive
                ? 'All external organization sharing permissions are suspended at the backend. No organization can view or download approved data.'
                : 'Approved organizations can access only the specific categories you authorized within their time windows.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleToggleLock}
          disabled={lockLoading}
          className={`dv-btn dv-btn-sm ${isLockActive ? 'dv-btn-secondary' : 'dv-btn-danger'}`}
        >
          {lockLoading ? 'Updating...' : isLockActive ? 'Deactivate Privacy Lock' : 'Engage Emergency Lock'}
        </button>
      </div>

      {/* Balanced 4-Card Summary Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        {/* Metric 1 */}
        <div className="dv-panel" style={{ padding: '16px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-secondary)' }}>
              Vault Records
            </span>
            <Database size={16} style={{ color: 'var(--color-text-muted)' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontFamily: 'var(--font-editorial)', fontWeight: 500, color: 'var(--color-text-main)', marginTop: '4px' }}>
            {stats?.vaultRecordsCount || 0}
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('vault')}
            style={{
              background: 'none', border: 'none', color: 'var(--color-primary)',
              fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '8px', padding: 0
            }}
          >
            <span>Manage records</span>
            <ArrowRight size={12} />
          </button>
        </div>

        {/* Metric 2 */}
        <div className="dv-panel" style={{ padding: '16px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-secondary)' }}>
              Stored Documents
            </span>
            <FileText size={16} style={{ color: 'var(--color-text-muted)' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontFamily: 'var(--font-editorial)', fontWeight: 500, color: 'var(--color-text-main)', marginTop: '4px' }}>
            {stats?.documentsCount || 0}
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('documents')}
            style={{
              background: 'none', border: 'none', color: 'var(--color-primary)',
              fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '8px', padding: 0
            }}
          >
            <span>Inspect files</span>
            <ArrowRight size={12} />
          </button>
        </div>

        {/* Metric 3 */}
        <div className="dv-panel" style={{ padding: '16px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-secondary)' }}>
              Pending Requests
            </span>
            <Inbox size={16} style={{ color: 'var(--color-text-muted)' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontFamily: 'var(--font-editorial)', fontWeight: 500, color: (stats?.pendingRequestsCount > 0 ? 'var(--status-pending-text)' : 'var(--color-text-main)'), marginTop: '4px' }}>
            {stats?.pendingRequestsCount || 0}
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('requests')}
            style={{
              background: 'none', border: 'none', color: 'var(--color-primary)',
              fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '8px', padding: 0
            }}
          >
            <span>Review requests</span>
            <ArrowRight size={12} />
          </button>
        </div>

        {/* Metric 4 */}
        <div className="dv-panel" style={{ padding: '16px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-secondary)' }}>
              Active Permissions
            </span>
            <KeyRound size={16} style={{ color: 'var(--color-text-muted)' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontFamily: 'var(--font-editorial)', fontWeight: 500, color: 'var(--color-text-main)', marginTop: '4px' }}>
            {stats?.activePermissionsCount || 0}
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('permissions')}
            style={{
              background: 'none', border: 'none', color: 'var(--color-primary)',
              fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '8px', padding: 0
            }}
          >
            <span>Inspect & revoke</span>
            <ArrowRight size={12} />
          </button>
        </div>
      </div>

      {/* Quick Action Navigation */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '28px' }}>
        <button type="button" onClick={() => setActiveTab('vault')} className="dv-btn dv-btn-primary dv-btn-sm">
          <Plus size={14} />
          <span>New Vault Record</span>
        </button>
        <button type="button" onClick={() => setActiveTab('documents')} className="dv-btn dv-btn-secondary dv-btn-sm">
          <Upload size={14} />
          <span>Upload Document</span>
        </button>
        <button type="button" onClick={() => setActiveTab('requests')} className="dv-btn dv-btn-secondary dv-btn-sm">
          <Inbox size={14} />
          <span>Pending Requests ({stats?.pendingRequestsCount || 0})</span>
        </button>
        <button type="button" onClick={() => setActiveTab('audit')} className="dv-btn dv-btn-secondary dv-btn-sm">
          <Clock size={14} />
          <span>Audit History</span>
        </button>
      </div>

      {/* Recent Activity Table */}
      <div className="dv-panel">
        <div className="dv-panel-header">
          <div>
            <h2 className="dv-panel-title">Recent Audit Events</h2>
            <p className="dv-panel-subtitle">Transparent record of all cryptographic and access events involving your data</p>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className="dv-btn dv-btn-secondary dv-btn-sm"
          >
            Full Trail &rarr;
          </button>
        </div>

        {stats?.recentAuditLogs && stats.recentAuditLogs.length > 0 ? (
          <div className="dv-table-container">
            <table className="dv-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Actor</th>
                  <th>Outcome</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentAuditLogs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td>
                      <span className="dv-badge dv-badge-neutral">{log.action}</span>
                    </td>
                    <td style={{ fontSize: '0.84rem' }}>{log.actorEmail}</td>
                    <td>
                      <span className={`dv-badge ${log.outcome === 'SUCCESS' ? 'dv-badge-active' : log.outcome === 'DENIED' || log.outcome === 'BLOCKED' ? 'dv-badge-danger' : 'dv-badge-pending'}`}>
                        {log.outcome}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>{log.details || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '28px', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
            No recent activity recorded yet.
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;
