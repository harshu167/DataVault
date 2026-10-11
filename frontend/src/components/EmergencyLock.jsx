import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { privacyLockAPI } from '../services/api';
import {
  ShieldAlert,
  ShieldCheck,
  AlertCircle,
  Lock,
  Unlock,
  CheckCircle2,
  Server,
  FileCheck2
} from 'lucide-react';

const EmergencyLock = () => {
  const { user, updateLockState } = useAuth();
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const isLockActive = user?.emergencyLockActive;

  const handleToggle = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const nextState = !isLockActive;
      const res = await privacyLockAPI.toggle(nextState);
      if (res.data && res.data.data) {
        updateLockState(res.data.data.emergencyLockActive);
        setFeedback({
          type: 'success',
          message: res.data.data.message
        });
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || err.message || 'Failed to update privacy lock'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 500, color: 'var(--color-text-main)' }}>
          Emergency Privacy Lock
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.88rem', marginTop: '2px' }}>
          An immediate server-side kill-switch that suspends all external data sharing without revoking historical permissions.
        </p>
      </div>

      {feedback && (
        <div className={`dv-alert ${feedback.type === 'success' ? 'dv-alert-success' : 'dv-alert-danger'}`} style={{ marginBottom: '20px' }}>
          {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Main Status Panel */}
      <div
        className="dv-panel"
        style={{
          padding: '36px 32px',
          textAlign: 'center',
          borderColor: isLockActive ? 'var(--status-danger-border)' : 'var(--color-border)',
          backgroundColor: isLockActive ? 'var(--status-danger-bg)' : 'var(--color-surface)',
          marginBottom: '24px'
        }}
      >
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          backgroundColor: isLockActive ? 'rgba(163, 67, 67, 0.12)' : 'var(--color-sage-soft)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px',
          border: '1px solid',
          borderColor: isLockActive ? 'var(--status-danger-border)' : 'var(--color-border)'
        }}>
          {isLockActive ? (
            <ShieldAlert size={32} style={{ color: 'var(--status-danger-text)' }} />
          ) : (
            <ShieldCheck size={32} style={{ color: 'var(--color-primary)' }} />
          )}
        </div>

        <div style={{ marginBottom: '12px' }}>
          <span className={`dv-badge ${isLockActive ? 'dv-badge-danger' : 'dv-badge-active'}`} style={{ fontSize: '0.82rem', padding: '4px 10px' }}>
            {isLockActive ? 'LOCK ENGAGED: ALL EXTERNAL ACCESS BLOCKED' : 'LOCK INACTIVE: NORMAL SHARING OPERATIONAL'}
          </span>
        </div>

        <p style={{
          color: 'var(--color-text-secondary)',
          fontSize: '0.9rem',
          maxWidth: '560px',
          margin: '0 auto 24px',
          lineHeight: 1.6
        }}>
          {isLockActive
            ? 'Backend security filters are actively blocking every attempt by external organizations to read your vault records or download documents. No external entity can bypass this state.'
            : 'Standard sharing policies are in effect. Approved organizations can only read categories you explicitly authorized within their approved time window.'}
        </p>

        <div>
          <button
            type="button"
            onClick={handleToggle}
            disabled={loading}
            className={`dv-btn ${isLockActive ? 'dv-btn-secondary' : 'dv-btn-danger'}`}
            style={{ padding: '10px 24px', fontSize: '0.92rem' }}
          >
            {loading ? (
              <span>Updating Server State...</span>
            ) : isLockActive ? (
              <>
                <Unlock size={16} />
                <span>Deactivate Lock (Restore Normal Sharing)</span>
              </>
            ) : (
              <>
                <Lock size={16} />
                <span>Engage Emergency Privacy Lock</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Technical Guarantees Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div className="dv-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Server size={18} style={{ color: 'var(--color-primary)' }} />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-text-main)' }}>
              Server-Side Enforcement
            </h3>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', lineHeight: 1.55 }}>
            The privacy lock is strictly enforced at the database and controller filter level. Every external API request verifies the owner's live lock status before decrypting any vault records or streaming document bytes.
          </p>
        </div>

        <div className="dv-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <FileCheck2 size={18} style={{ color: 'var(--color-primary)' }} />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-text-main)' }}>
              Immutable Audit Recording
            </h3>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', lineHeight: 1.55 }}>
            All lock engagements, releases, and blocked access attempts are recorded in the append-only audit trail with timestamps, actor IDs, and IP metadata for end-to-end transparency.
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmergencyLock;
