import React, { useState, useEffect } from 'react';
import { sharingAPI } from '../services/api';
import {
  Inbox,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  AlertCircle
} from 'lucide-react';

const AccessRequests = ({ onRequestHandled }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await sharingAPI.getRequests();
      if (res.data && res.data.data) {
        setRequests(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load access requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (id) => {
    setActingId(id);
    setFeedback(null);
    try {
      const res = await sharingAPI.approveRequest(id);
      setFeedback({
        type: 'success',
        message: `Request #${id} approved. Permission is active until ${new Date(res.data.data.expiresAt).toLocaleString()}.`,
      });
      await fetchRequests();
      if (onRequestHandled) onRequestHandled();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || err.message || 'Failed to approve request',
      });
    } finally {
      setActingId(null);
    }
  };

  const handleDeny = async (id) => {
    const reason = window.prompt('Provide an optional reason for denying this request:', 'Access not authorized');
    if (reason === null) return;

    setActingId(id);
    setFeedback(null);
    try {
      await sharingAPI.denyRequest(id, reason);
      setFeedback({
        type: 'success',
        message: `Request #${id} denied. Organization access rejected.`,
      });
      await fetchRequests();
      if (onRequestHandled) onRequestHandled();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || err.message || 'Failed to deny request',
      });
    } finally {
      setActingId(null);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '22px' }}>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 500, color: 'var(--color-text-main)' }}>
          Incoming Data Access Requests
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.88rem', marginTop: '2px' }}>
          External organizations must provide a verified purpose and time limit before access can be authorized.
        </p>
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
            Retrieving incoming requests...
          </div>
        ) : requests.length > 0 ? (
          <table className="dv-table">
            <thead>
              <tr>
                <th>Requesting Organization</th>
                <th>Stated Purpose</th>
                <th>Requested Categories</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Requested On</th>
                <th style={{ textAlign: 'right' }}>Decision</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Building2 size={15} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>{req.requesterName}</div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>{req.requesterEmail}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ maxWidth: '260px', fontSize: '0.84rem' }}>
                    <div style={{ color: 'var(--color-text-main)' }}>{req.purpose}</div>
                    {req.decisionNotes && (
                      <div style={{ fontSize: '0.74rem', color: 'var(--status-danger-text)', marginTop: '2px' }}>
                        Note: {req.decisionNotes}
                      </div>
                    )}
                  </td>
                  <td>
                    <span className="dv-badge dv-badge-info">{req.dataCategories}</span>
                  </td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={13} />
                      <span>{req.durationHours} hrs</span>
                    </div>
                  </td>
                  <td>
                    <span className={`dv-badge ${
                      req.status === 'APPROVED'
                        ? 'dv-badge-active'
                        : req.status === 'DENIED'
                        ? 'dv-badge-danger'
                        : 'dv-badge-pending'
                    }`}>
                      {req.status}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                    {new Date(req.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {req.status === 'PENDING' ? (
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => handleApprove(req.id)}
                          disabled={actingId === req.id}
                          className="dv-btn dv-btn-primary dv-btn-sm"
                          title="Approve access request"
                        >
                          <CheckCircle2 size={13} />
                          <span>{actingId === req.id ? 'Approving...' : 'Approve'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeny(req.id)}
                          disabled={actingId === req.id}
                          className="dv-btn dv-btn-danger dv-btn-sm"
                          title="Deny access request"
                        >
                          <XCircle size={13} />
                          <span>Deny</span>
                        </button>
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                        Decided {new Date(req.decidedAt || req.createdAt).toLocaleDateString()}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--color-text-muted)' }}>
            <Inbox size={32} style={{ color: 'var(--color-text-muted)', marginBottom: '10px' }} />
            <div style={{ fontSize: '0.98rem', fontWeight: 600, color: 'var(--color-text-main)' }}>No Pending Requests</div>
            <p style={{ fontSize: '0.84rem', marginTop: '4px' }}>
              When external organizations request verification access to your data, they will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccessRequests;
