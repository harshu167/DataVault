import React, { useState, useEffect } from 'react';
import { sharingAPI } from '../services/api';
import {
  KeyRound,
  ShieldBan,
  Clock,
  Building2,
  AlertCircle,
  CheckCircle2,
  Info
} from 'lucide-react';

const ActivePermissions = () => {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const res = await sharingAPI.getPermissions();
      if (res.data && res.data.data) {
        setPermissions(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load permissions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  const handleRevoke = async (id) => {
    if (!window.confirm('Are you sure you want to revoke this permission immediately? The organization will be blocked from accessing your data.')) {
      return;
    }

    setRevokingId(id);
    setFeedback(null);
    try {
      await sharingAPI.revokePermission(id);
      setFeedback({
        type: 'success',
        message: `Permission #${id} revoked successfully. All future access by this organization is permanently blocked.`,
      });
      await fetchPermissions();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || err.message || 'Failed to revoke permission',
      });
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '22px' }}>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 500, color: 'var(--color-text-main)' }}>
          Active Sharing Permissions
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.88rem', marginTop: '2px' }}>
          Permissions automatically expire when their time window ends. You can revoke access immediately at any time.
        </p>
      </div>

      {/* Technical Transparency Note */}
      <div className="dv-alert dv-alert-info" style={{ marginBottom: '20px' }}>
        <Info size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
        <div style={{ fontSize: '0.82rem', lineHeight: 1.5 }}>
          <strong>Understanding Immediate Revocation:</strong> Revoking access immediately prevents any future viewing or downloading of your vault records and documents on the backend. Live server checks reject subsequent access requests instantaneously.
        </div>
      </div>

      {feedback && (
        <div className={`dv-alert ${feedback.type === 'success' ? 'dv-alert-success' : 'dv-alert-danger'}`}>
          {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{feedback.message}</span>
        </div>
      )}

      <div className="dv-table-container">
        {loading ? (
          <div style={{ padding: '36px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            Retrieving sharing permissions...
          </div>
        ) : permissions.length > 0 ? (
          <table className="dv-table">
            <thead>
              <tr>
                <th>Authorized Organization</th>
                <th>Approved Purpose</th>
                <th>Permitted Scope</th>
                <th>Status</th>
                <th>Expires At</th>
                <th>Granted On</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {permissions.map((perm) => {
                const isExpired = perm.expired || (perm.expiresAt && new Date(perm.expiresAt) < new Date());
                const isActive = perm.status === 'ACTIVE' && !isExpired;

                return (
                  <tr key={perm.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Building2 size={15} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>{perm.requesterName}</div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>{perm.requesterEmail}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ maxWidth: '240px', fontSize: '0.84rem' }}>
                      <span style={{ color: 'var(--color-text-main)' }}>{perm.purpose}</span>
                    </td>
                    <td>
                      <span className="dv-badge dv-badge-info">{perm.approvedCategories}</span>
                    </td>
                    <td>
                      <span className={`dv-badge ${
                        perm.status === 'REVOKED'
                          ? 'dv-badge-danger'
                          : isExpired
                          ? 'dv-badge-pending'
                          : 'dv-badge-active'
                      }`}>
                        {perm.status === 'REVOKED' ? 'REVOKED' : isExpired ? 'EXPIRED' : 'ACTIVE'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.82rem', color: isExpired ? 'var(--status-danger-text)' : 'var(--color-text-main)', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={13} />
                        <span>{new Date(perm.expiresAt).toLocaleString()}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(perm.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {isActive ? (
                        <button
                          type="button"
                          onClick={() => handleRevoke(perm.id)}
                          disabled={revokingId === perm.id}
                          className="dv-btn dv-btn-danger dv-btn-sm"
                          title="Immediately revoke future access"
                        >
                          <ShieldBan size={13} />
                          <span>{revokingId === perm.id ? 'Revoking...' : 'Revoke Access'}</span>
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                          {perm.status === 'REVOKED' ? 'Revoked' : 'Expired'}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--color-text-muted)' }}>
            <KeyRound size={32} style={{ color: 'var(--color-text-muted)', marginBottom: '10px' }} />
            <div style={{ fontSize: '0.98rem', fontWeight: 600, color: 'var(--color-text-main)' }}>No Active Permissions</div>
            <p style={{ fontSize: '0.84rem', marginTop: '4px' }}>
              When you approve incoming data requests, active time-limited permissions will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivePermissions;
