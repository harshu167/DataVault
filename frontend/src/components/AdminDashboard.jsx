import React, { useState, useEffect } from 'react';
import { dashboardAPI } from '../services/api';
import {
  Users,
  Building2,
  Database,
  FileText,
  Inbox,
  KeyRound,
  History,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  RefreshCw
} from 'lucide-react';

const AdminDashboard = ({ setActiveTab }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAdminStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await dashboardAPI.getStats();
      if (res.data && res.data.data) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load admin statistics:', err);
      setError(err.response?.data?.message || err.message || 'Failed to retrieve system overview statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminStats();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <RefreshCw size={18} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
          <span>Retrieving system overview telemetry...</span>
        </div>
        <style>{`
          @keyframes spin { 100% { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: '700px', margin: '40px auto' }}>
        <div className="dv-alert dv-alert-danger" style={{ marginBottom: '16px' }}>
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <div>
            <strong>Error Loading System Overview:</strong>
            <p style={{ marginTop: '2px', fontSize: '0.84rem' }}>{error}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={fetchAdminStats}
          className="dv-btn dv-btn-secondary"
        >
          <RefreshCw size={14} />
          <span>Retry Connection</span>
        </button>
      </div>
    );
  }

  const recentLogs = stats?.recentAuditLogs || [];

  return (
    <div>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 500, color: 'var(--color-text-main)' }}>
            System Overview & Platform Telemetry
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.88rem', marginTop: '2px' }}>
            System-level resource counts, cryptographic asset metrics, and real-time audit stream.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={fetchAdminStats}
            className="dv-btn dv-btn-secondary dv-btn-sm"
            title="Refresh system metrics"
          >
            <RefreshCw size={13} />
            <span>Refresh Telemetry</span>
          </button>
          <span className="dv-badge dv-badge-neutral" style={{ fontSize: '0.74rem' }}>
            Role: Platform Admin
          </span>
        </div>
      </div>

      {/* Genuine Backend Statistics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        {/* Total Users */}
        <div className="dv-metric-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="dv-metric-label">Registered Users</span>
            <Users size={16} style={{ color: 'var(--color-primary)' }} />
          </div>
          <div className="dv-metric-value" style={{ color: 'var(--color-text-main)' }}>
            {stats?.totalUsers !== undefined ? stats.totalUsers : '—'}
          </div>
          <div className="dv-metric-sub">Personal vault owners</div>
        </div>

        {/* Total Organizations */}
        <div className="dv-metric-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="dv-metric-label">Organizations</span>
            <Building2 size={16} style={{ color: 'var(--color-sage)' }} />
          </div>
          <div className="dv-metric-value" style={{ color: 'var(--color-text-main)' }}>
            {stats?.totalOrganizations !== undefined ? stats.totalOrganizations : '—'}
          </div>
          <div className="dv-metric-sub">Registered requesting entities</div>
        </div>

        {/* Total Vault Records */}
        <div className="dv-metric-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="dv-metric-label">Encrypted Records</span>
            <Database size={16} style={{ color: 'var(--color-primary)' }} />
          </div>
          <div className="dv-metric-value" style={{ color: 'var(--color-text-main)' }}>
            {stats?.totalVaultRecords !== undefined ? stats.totalVaultRecords : '—'}
          </div>
          <div className="dv-metric-sub">AES-256-GCM ciphertexts in DB</div>
        </div>

        {/* Total Documents */}
        <div className="dv-metric-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="dv-metric-label">Stored Documents</span>
            <FileText size={16} style={{ color: 'var(--color-sage)' }} />
          </div>
          <div className="dv-metric-value" style={{ color: 'var(--color-text-main)' }}>
            {stats?.totalDocuments !== undefined ? stats.totalDocuments : '—'}
          </div>
          <div className="dv-metric-sub">Private UUID-mapped files</div>
        </div>

        {/* Total Access Requests */}
        <div className="dv-metric-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="dv-metric-label">Access Requests</span>
            <Inbox size={16} style={{ color: 'var(--status-pending-text)' }} />
          </div>
          <div className="dv-metric-value" style={{ color: 'var(--status-pending-text)' }}>
            {stats?.totalRequests !== undefined ? stats.totalRequests : '—'}
          </div>
          <div className="dv-metric-sub">Total lifecycle sharing requests</div>
        </div>

        {/* Total Permissions */}
        <div className="dv-metric-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="dv-metric-label">Permissions</span>
            <KeyRound size={16} style={{ color: 'var(--status-active-text)' }} />
          </div>
          <div className="dv-metric-value" style={{ color: 'var(--status-active-text)' }}>
            {stats?.totalPermissions !== undefined ? stats.totalPermissions : '—'}
          </div>
          <div className="dv-metric-sub">Authorized scopes granted</div>
        </div>

        {/* Total Audit Logs */}
        <div className="dv-metric-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="dv-metric-label">Audit Logs</span>
            <History size={16} style={{ color: 'var(--color-primary)' }} />
          </div>
          <div className="dv-metric-value" style={{ color: 'var(--color-text-main)' }}>
            {stats?.totalAuditLogs !== undefined ? stats.totalAuditLogs : '—'}
          </div>
          <div className="dv-metric-sub">Immutable append-only events</div>
        </div>
      </div>

      {/* Security Architecture Guarantees Callout */}
      <div className="dv-panel" style={{ padding: '20px 24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
          <ShieldCheck size={22} style={{ color: 'var(--color-primary)', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h3 style={{ fontSize: '0.98rem', fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '4px' }}>
              Zero-Trust Administrative Isolation
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--color-text-secondary)', lineHeight: 1.55 }}>
              In accordance with DataVault’s privacy-by-design policy, administrators oversee platform health, resource volumes, and system-wide audit telemetry without access to users' plaintext personal vault records or private document contents. Cryptographic keys and plaintext records remain strictly bounded to data owners and explicitly approved organization scopes.
            </p>
          </div>
        </div>
      </div>

      {/* Recent Platform Audit Activity Section */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--color-text-main)' }}>
              Recent Platform Audit Stream
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
              Latest security and access events logged across all system actors.
            </p>
          </div>

          {setActiveTab && (
            <button
              type="button"
              onClick={() => setActiveTab('audit')}
              className="dv-btn dv-btn-secondary dv-btn-sm"
            >
              <span>View Full Audit Trail</span>
              <ArrowRight size={13} />
            </button>
          )}
        </div>

        <div className="dv-table-container">
          {recentLogs.length > 0 ? (
            <table className="dv-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Actor / Role</th>
                  <th>Target Owner</th>
                  <th>Resource</th>
                  <th>Outcome</th>
                  <th>Event Details</th>
                </tr>
              </thead>
              <tbody>
                {recentLogs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)' }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td>
                      <span className="dv-badge dv-badge-info" style={{ fontSize: '0.7rem' }}>
                        {log.action}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-main)' }}>
                        {log.actorEmail}
                      </div>
                      <span className="dv-badge dv-badge-neutral" style={{ fontSize: '0.64rem', padding: '1px 5px', marginTop: '2px' }}>
                        {log.actorRole}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>
                      {log.ownerEmail || '—'}
                    </td>
                    <td>
                      <span className="dv-badge dv-badge-neutral" style={{ fontSize: '0.68rem' }}>
                        {log.resourceType}
                      </span>
                    </td>
                    <td>
                      <span className={`dv-badge ${
                        log.outcome === 'SUCCESS'
                          ? 'dv-badge-active'
                          : log.outcome === 'DENIED' || log.outcome === 'BLOCKED'
                          ? 'dv-badge-danger'
                          : 'dv-badge-pending'
                      }`}>
                        {log.outcome}
                      </span>
                    </td>
                    <td style={{ maxWidth: '280px', fontSize: '0.82rem', color: 'var(--color-text-main)' }}>
                      {log.details || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ textAlign: 'center', padding: '36px', color: 'var(--color-text-muted)' }}>
              No recent audit events found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
