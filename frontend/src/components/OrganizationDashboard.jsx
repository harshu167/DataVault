import React, { useState, useEffect } from 'react';
import { organizationAPI, sharingAPI, dashboardAPI } from '../services/api';
import {
  Send,
  Download,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  FileText,
  Database
} from 'lucide-react';

const CATEGORIES_OPTIONS = ['IDENTITY', 'FINANCIAL', 'MEDICAL', 'EMPLOYMENT', 'ALL'];

const OrganizationDashboard = ({ subTab = 'dashboard', setSubTab }) => {
  const [stats, setStats] = useState(null);
  const [eligibleUsers, setEligibleUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Request form state
  const [selectedOwnerId, setSelectedOwnerId] = useState('');
  const [selectedCategories, setSelectedCategories] = useState(['IDENTITY']);
  const [purpose, setPurpose] = useState('');
  const [durationHours, setDurationHours] = useState(24);
  const [submittingReq, setSubmittingReq] = useState(false);
  const [requestFeedback, setRequestFeedback] = useState(null);

  // Authorized data view state
  const [selectedPermission, setSelectedPermission] = useState(null);
  const [authorizedData, setAuthorizedData] = useState(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState('');
  const [downloadingDocId, setDownloadingDocId] = useState(null);

  const loadOrgData = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes, reqRes, permRes] = await Promise.all([
        dashboardAPI.getStats(),
        organizationAPI.getEligibleUsers(),
        sharingAPI.getRequests(),
        sharingAPI.getPermissions(),
      ]);

      if (statsRes.data?.data) setStats(statsRes.data.data);
      if (usersRes.data?.data) setEligibleUsers(usersRes.data.data);
      if (reqRes.data?.data) setRequests(reqRes.data.data);
      if (permRes.data?.data) setPermissions(permRes.data.data);
    } catch (err) {
      console.error('Failed to load organization data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrgData();
  }, []);

  const handleToggleCategory = (cat) => {
    if (cat === 'ALL') {
      setSelectedCategories(['ALL']);
      return;
    }
    let updated = selectedCategories.filter((c) => c !== 'ALL');
    if (updated.includes(cat)) {
      updated = updated.filter((c) => c !== cat);
    } else {
      updated.push(cat);
    }
    if (updated.length === 0) updated = ['IDENTITY'];
    setSelectedCategories(updated);
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    if (!selectedOwnerId) {
      setRequestFeedback({ type: 'error', message: 'Please select a data owner' });
      return;
    }
    if (!purpose.trim()) {
      setRequestFeedback({ type: 'error', message: 'A purpose is mandatory for data requests' });
      return;
    }

    setSubmittingReq(true);
    setRequestFeedback(null);
    try {
      await sharingAPI.createRequest({
        ownerId: parseInt(selectedOwnerId),
        dataCategories: selectedCategories.join(','),
        purpose: purpose.trim(),
        durationHours: parseInt(durationHours),
      });

      setRequestFeedback({
        type: 'success',
        message: 'Data access request submitted successfully! Awaiting owner decision.',
      });
      setPurpose('');
      await loadOrgData();
      if (setSubTab) setSubTab('org-requests');
    } catch (err) {
      setRequestFeedback({
        type: 'error',
        message: err.response?.data?.message || err.message || 'Failed to submit request',
      });
    } finally {
      setSubmittingReq(false);
    }
  };

  const handleFetchAuthorizedData = async (perm) => {
    setSelectedPermission(perm);
    setDataLoading(true);
    setDataError('');
    setAuthorizedData(null);

    try {
      const res = await organizationAPI.getAuthorizedData(perm.id);
      if (res.data?.data) {
        setAuthorizedData(res.data.data);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Access blocked';
      setDataError(msg);
    } finally {
      setDataLoading(false);
    }
  };

  const handleDownloadDoc = async (permId, doc) => {
    setDownloadingDocId(doc.id);
    try {
      const res = await organizationAPI.downloadAuthorizedDoc(permId, doc.id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', doc.originalFileName || `authorized-doc-${doc.id}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Download blocked: ' + (err.response?.data?.message || err.message));
    } finally {
      setDownloadingDocId(null);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '36px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
        Retrieving organization console status...
      </div>
    );
  }

  return (
    <div>
      {/* Overview Metrics Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 500, color: 'var(--color-text-main)' }}>
          Organization Access Console
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.88rem', marginTop: '2px' }}>
          Request time-bounded and purpose-limited access to verified user records. All queries are audited.
        </p>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        <div className="dv-metric-card">
          <div className="dv-metric-label">Pending Requests</div>
          <div className="dv-metric-value" style={{ color: 'var(--status-pending-text)' }}>
            {stats?.pendingRequestsCount || 0}
          </div>
          <div className="dv-metric-sub">Awaiting user decisions</div>
        </div>

        <div className="dv-metric-card">
          <div className="dv-metric-label">Approved Requests</div>
          <div className="dv-metric-value" style={{ color: 'var(--status-active-text)' }}>
            {stats?.approvedRequestsCount || 0}
          </div>
          <div className="dv-metric-sub">Authorized by owners</div>
        </div>

        <div className="dv-metric-card">
          <div className="dv-metric-label">Active Permissions</div>
          <div className="dv-metric-value" style={{ color: 'var(--color-primary)' }}>
            {stats?.activePermissionsCount || 0}
          </div>
          <div className="dv-metric-sub">Currently accessible</div>
        </div>

        <div className="dv-metric-card">
          <div className="dv-metric-label">Revoked / Expired</div>
          <div className="dv-metric-value" style={{ color: 'var(--status-danger-text)' }}>
            {(stats?.revokedPermissionsCount || 0) + (stats?.expiredPermissionsCount || 0)}
          </div>
          <div className="dv-metric-sub">Access terminated</div>
        </div>
      </div>

      {/* Sub-view: Request Access Form */}
      {subTab === 'request-access' && (
        <div className="dv-panel" style={{ padding: '24px', maxWidth: '720px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Send size={18} style={{ color: 'var(--color-primary)' }} />
            <h2 className="dv-panel-title">
              Create Purpose-Bound Data Request
            </h2>
          </div>

          {requestFeedback && (
            <div className={`dv-alert ${requestFeedback.type === 'success' ? 'dv-alert-success' : 'dv-alert-danger'}`} style={{ marginBottom: '18px' }}>
              {requestFeedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{requestFeedback.message}</span>
            </div>
          )}

          <form onSubmit={handleSubmitRequest}>
            <div className="dv-form-group">
              <label className="dv-form-label">Select Target Data Owner *</label>
              <select
                value={selectedOwnerId}
                onChange={(e) => setSelectedOwnerId(e.target.value)}
                className="dv-select"
                required
              >
                <option value="">-- Choose Data Owner --</option>
                {eligibleUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName} ({u.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="dv-form-group">
              <label className="dv-form-label">Requested Data Categories *</label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                {CATEGORIES_OPTIONS.map((cat) => {
                  const isSelected = selectedCategories.includes(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleToggleCategory(cat)}
                      className="dv-btn dv-btn-sm"
                      style={{
                        backgroundColor: isSelected ? 'var(--color-primary)' : 'var(--color-surface-subtle)',
                        color: isSelected ? '#ffffff' : 'var(--color-text-secondary)',
                        borderColor: isSelected ? 'var(--color-primary)' : 'var(--color-border)',
                        padding: '5px 12px',
                        fontSize: '0.76rem',
                        fontWeight: isSelected ? 600 : 500,
                      }}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="dv-form-group">
              <label className="dv-form-label">Mandatory Purpose * (Required by privacy policy)</label>
              <textarea
                rows={3}
                required
                placeholder="Explain explicitly why your organization requires this information (e.g., Employment background verification, Insurance policy underwriting)"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="dv-textarea"
              />
            </div>

            <div className="dv-form-group">
              <label className="dv-form-label">Requested Access Duration (Hours) *</label>
              <input
                type="number"
                min="1"
                max="720"
                value={durationHours}
                onChange={(e) => setDurationHours(e.target.value)}
                className="dv-input"
                required
              />
              <span className="dv-form-hint">
                Access automatically expires once this time limit concludes.
              </span>
            </div>

            <button
              type="submit"
              disabled={submittingReq}
              className="dv-btn dv-btn-primary"
              style={{ marginTop: '12px', width: '100%', padding: '10px' }}
            >
              {submittingReq ? 'Submitting Request...' : 'Submit Access Request'}
            </button>
          </form>
        </div>
      )}

      {/* Outgoing Requests View */}
      {(subTab === 'org-requests' || subTab === 'dashboard') && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--color-text-main)' }}>
              Sent Access Requests
            </h2>
            {subTab === 'dashboard' && setSubTab && (
              <button
                type="button"
                onClick={() => setSubTab('request-access')}
                className="dv-btn dv-btn-secondary dv-btn-sm"
              >
                <Send size={13} />
                <span>New Request</span>
              </button>
            )}
          </div>

          <div className="dv-table-container">
            {requests.length > 0 ? (
              <table className="dv-table">
                <thead>
                  <tr>
                    <th>Data Owner</th>
                    <th>Purpose</th>
                    <th>Categories</th>
                    <th>Duration</th>
                    <th>Status</th>
                    <th>Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req) => (
                    <tr key={req.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>{req.ownerName}</div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>{req.ownerEmail}</div>
                      </td>
                      <td style={{ maxWidth: '280px', fontSize: '0.84rem' }}>{req.purpose}</td>
                      <td>
                        <span className="dv-badge dv-badge-info">{req.dataCategories}</span>
                      </td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>{req.durationHours} hrs</td>
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
                      <td style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                        {new Date(req.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ textAlign: 'center', padding: '36px', color: 'var(--color-text-muted)' }}>
                No access requests sent yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Authorized Data Viewer */}
      {(subTab === 'authorized-data' || subTab === 'dashboard') && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ marginBottom: '12px' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--color-text-main)' }}>
              Authorized Permissions & Decrypted Data
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.84rem' }}>
              Select an approved permission to fetch the authorized decrypted vault records and documents.
            </p>
          </div>

          {/* Permissions selector list */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px', marginBottom: '20px' }}>
            {permissions.map((perm) => {
              const isSelected = selectedPermission?.id === perm.id;
              const isExpired = perm.expired || (perm.expiresAt && new Date(perm.expiresAt) < new Date());
              return (
                <div
                  key={perm.id}
                  onClick={() => handleFetchAuthorizedData(perm)}
                  className="dv-panel"
                  style={{
                    padding: '14px',
                    cursor: 'pointer',
                    borderColor: isSelected ? 'var(--color-primary)' : 'var(--color-border)',
                    backgroundColor: isSelected ? 'var(--color-sage-soft)' : 'var(--color-surface)',
                    transition: 'all 0.12s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ fontWeight: 600, color: 'var(--color-text-main)', fontSize: '0.88rem' }}>
                      {perm.ownerName}
                    </div>
                    <span className={`dv-badge ${perm.status === 'REVOKED' ? 'dv-badge-danger' : isExpired ? 'dv-badge-pending' : 'dv-badge-active'}`} style={{ fontSize: '0.62rem' }}>
                      {perm.status === 'REVOKED' ? 'REVOKED' : isExpired ? 'EXPIRED' : 'ACTIVE'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                    Scope: {perm.approvedCategories}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                    Expires: {new Date(perm.expiresAt).toLocaleDateString()}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Data Error Banner */}
          {dataError && (
            <div className="dv-alert dv-alert-danger" style={{ marginBottom: '20px' }}>
              <ShieldAlert size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ display: 'block', fontSize: '0.88rem', marginBottom: '2px' }}>
                  ACCESS REJECTED BY BACKEND
                </strong>
                <span style={{ fontSize: '0.82rem' }}>{dataError}</span>
              </div>
            </div>
          )}

          {dataLoading && (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              Verifying permissions and decrypting records...
            </div>
          )}

          {/* Decrypted Vault Records & Documents Display */}
          {authorizedData && !dataLoading && (
            <div className="dv-panel" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-main)' }}>
                    Authorized Records for {authorizedData.ownerName}
                  </h3>
                  <span style={{ fontSize: '0.76rem', color: 'var(--color-text-secondary)' }}>
                    Purpose: {authorizedData.purpose} | Valid until: {new Date(authorizedData.expiresAt).toLocaleString()}
                  </span>
                </div>
                <span className="dv-badge dv-badge-active">VERIFIED & DECRYPTED</span>
              </div>

              {/* Vault Records */}
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Database size={15} style={{ color: 'var(--color-primary)' }} />
                  <span>Authorized Vault Records ({authorizedData.vaultRecords?.length || 0})</span>
                </h4>
                {authorizedData.vaultRecords?.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '10px' }}>
                    {authorizedData.vaultRecords.map((r) => (
                      <div key={r.id} style={{ backgroundColor: 'var(--color-surface-subtle)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 600, color: 'var(--color-text-main)', fontSize: '0.86rem' }}>{r.title}</span>
                          <span className="dv-badge dv-badge-info" style={{ fontSize: '0.62rem' }}>{r.dataCategory}</span>
                        </div>
                        <div style={{ marginTop: '8px', backgroundColor: 'var(--color-surface)', padding: '6px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontFamily: 'var(--font-mono)', color: 'var(--color-text-main)', fontSize: '0.82rem' }}>
                          {r.value}
                        </div>
                        {r.description && (
                          <div style={{ fontSize: '0.74rem', color: 'var(--color-text-secondary)', marginTop: '6px' }}>{r.description}</div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>No vault records authorized in this scope.</div>
                )}
              </div>

              {/* Documents */}
              <div>
                <h4 style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText size={15} style={{ color: 'var(--color-sage)' }} />
                  <span>Authorized Documents ({authorizedData.documents?.length || 0})</span>
                </h4>
                {authorizedData.documents?.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '10px' }}>
                    {authorizedData.documents.map((d) => (
                      <div key={d.id} style={{ backgroundColor: 'var(--color-surface-subtle)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--color-text-main)', fontSize: '0.86rem' }}>{d.title}</div>
                          <span className="dv-badge dv-badge-neutral" style={{ fontSize: '0.62rem', marginTop: '4px' }}>{d.dataCategory}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDownloadDoc(selectedPermission.id, d)}
                          disabled={downloadingDocId === d.id}
                          className="dv-btn dv-btn-secondary dv-btn-sm"
                          title="Download authorized document"
                        >
                          <Download size={13} />
                          <span>{downloadingDocId === d.id ? 'Downloading...' : 'Download'}</span>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>No documents authorized in this scope.</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OrganizationDashboard;
