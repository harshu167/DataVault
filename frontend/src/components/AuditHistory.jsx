import React, { useState, useEffect } from 'react';
import { auditAPI } from '../services/api';
import {
  History,
  Search,
  Shield,
  CheckCircle2,
  Lock
} from 'lucide-react';

const AuditHistory = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState('ALL');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await auditAPI.getLogs();
      if (res.data && res.data.data) {
        setLogs(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchesOutcome = outcomeFilter === 'ALL' || log.outcome === outcomeFilter;
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      log.action.toLowerCase().includes(query) ||
      log.actorEmail.toLowerCase().includes(query) ||
      (log.ownerEmail && log.ownerEmail.toLowerCase().includes(query)) ||
      (log.purpose && log.purpose.toLowerCase().includes(query)) ||
      (log.details && log.details.toLowerCase().includes(query)) ||
      log.resourceType.toLowerCase().includes(query);

    return matchesOutcome && matchesSearch;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 500, color: 'var(--color-text-main)' }}>
            Audit History & Access Transparency
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.88rem', marginTop: '2px' }}>
            Complete chronological record of all authentication, sharing, data access, and emergency lock actions.
          </p>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '0.76rem',
          color: 'var(--color-text-secondary)',
          backgroundColor: 'var(--color-surface-subtle)',
          padding: '5px 12px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--color-border)'
        }}>
          <Lock size={13} style={{ color: 'var(--color-sage)' }} />
          <span>Immutable Append-Only Audit Trail</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="dv-panel" style={{ padding: '14px 18px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {['ALL', 'SUCCESS', 'DENIED', 'BLOCKED', 'FAILURE'].map((outcome) => {
            const isSelected = outcomeFilter === outcome;
            return (
              <button
                key={outcome}
                type="button"
                onClick={() => setOutcomeFilter(outcome)}
                className="dv-btn dv-btn-sm"
                style={{
                  backgroundColor: isSelected ? 'var(--color-primary)' : 'var(--color-surface-subtle)',
                  color: isSelected ? '#ffffff' : 'var(--color-text-secondary)',
                  borderColor: isSelected ? 'var(--color-primary)' : 'var(--color-border)',
                  fontSize: '0.74rem',
                  padding: '4px 10px',
                  fontWeight: isSelected ? 600 : 500,
                }}
              >
                {outcome}
              </button>
            );
          })}
        </div>

        <div style={{ position: 'relative', minWidth: '260px' }}>
          <input
            type="text"
            placeholder="Search action, actor, details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="dv-input"
            style={{ paddingLeft: '34px', fontSize: '0.82rem', paddingBlock: '6px' }}
          />
          <Search size={14} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
        </div>
      </div>

      {/* Table */}
      <div className="dv-table-container">
        {loading ? (
          <div style={{ padding: '36px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            Retrieving audit records...
          </div>
        ) : filteredLogs.length > 0 ? (
          <table className="dv-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Action</th>
                <th>Actor / Role</th>
                <th>Owner</th>
                <th>Resource</th>
                <th>Outcome</th>
                <th>Details & Purpose</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
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
                  <td style={{ maxWidth: '300px', fontSize: '0.82rem' }}>
                    <div style={{ color: 'var(--color-text-main)' }}>{log.details || '—'}</div>
                    {log.purpose && (
                      <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                        Purpose: {log.purpose}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--color-text-muted)' }}>
            <History size={32} style={{ color: 'var(--color-text-muted)', marginBottom: '10px' }} />
            <div style={{ fontSize: '0.98rem', fontWeight: 600, color: 'var(--color-text-main)' }}>No Audit Logs Found</div>
            <p style={{ fontSize: '0.84rem', marginTop: '4px' }}>
              All interactions with your data will be transparently logged here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditHistory;
