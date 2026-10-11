import React, { useState, useEffect } from 'react';
import { documentAPI } from '../services/api';
import {
  Upload,
  Download,
  Trash2,
  FileText,
  File,
  Plus,
  AlertCircle,
  X
} from 'lucide-react';

const CATEGORIES = ['IDENTITY', 'FINANCIAL', 'MEDICAL', 'EMPLOYMENT', 'OTHER'];

const DocumentManager = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Upload modal state
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('IDENTITY');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await documentAPI.getDocuments();
      if (res.data && res.data.data) {
        setDocuments(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setUploadError('Please select a file to upload');
      return;
    }
    setUploadError('');
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);
      formData.append('dataCategory', category);

      await documentAPI.uploadDocument(formData);
      setShowModal(false);
      setTitle('');
      setFile(null);
      await fetchDocuments();
    } catch (err) {
      setUploadError(err.response?.data?.message || err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (doc) => {
    try {
      setDownloadingId(doc.id);
      const res = await documentAPI.downloadDocument(doc.id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', doc.originalFileName || `document-${doc.id}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download document: ' + (err.response?.data?.message || err.message));
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this document from secure storage?')) {
      return;
    }
    try {
      await documentAPI.deleteDocument(id);
      await fetchDocuments();
    } catch (err) {
      alert('Failed to delete document: ' + (err.response?.data?.message || err.message));
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div>
      {/* Header and Upload Action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 500, color: 'var(--color-text-main)' }}>
            Secure Document Storage
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.88rem', marginTop: '2px' }}>
            Privately stored outside public web paths with UUID filesystem isolation. Access is strictly authenticated.
          </p>
        </div>

        <button type="button" onClick={() => { setShowModal(true); setUploadError(''); }} className="dv-btn dv-btn-primary">
          <Upload size={15} />
          <span>Upload Document</span>
        </button>
      </div>

      {/* Documents Table */}
      <div className="dv-table-container">
        {loading ? (
          <div style={{ padding: '36px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            Loading secure documents...
          </div>
        ) : documents.length > 0 ? (
          <table className="dv-table">
            <thead>
              <tr>
                <th>Document Title & Original Name</th>
                <th>Category</th>
                <th>File Size</th>
                <th>Uploaded</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <FileText size={18} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>{doc.title}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>{doc.originalFileName}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="dv-badge dv-badge-category">{doc.dataCategory}</span>
                  </td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>
                    {formatFileSize(doc.fileSize)}
                  </td>
                  <td style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => handleDownload(doc)}
                        disabled={downloadingId === doc.id}
                        className="dv-btn dv-btn-secondary dv-btn-sm"
                        title="Download file"
                        aria-label={`Download ${doc.title}`}
                      >
                        <Download size={13} />
                        <span>{downloadingId === doc.id ? 'Fetching...' : 'Download'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(doc.id)}
                        className="dv-btn dv-btn-danger dv-btn-sm"
                        title="Delete file"
                        aria-label={`Delete ${doc.title}`}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--color-text-muted)' }}>
            <File size={32} style={{ color: 'var(--color-text-muted)', marginBottom: '10px' }} />
            <div style={{ fontSize: '0.98rem', fontWeight: 600, color: 'var(--color-text-main)' }}>No Documents Stored</div>
            <p style={{ fontSize: '0.84rem', marginTop: '4px', marginBottom: '16px' }}>
              Upload verification documents, certificates, identity cards, or medical records.
            </p>
            <button type="button" onClick={() => setShowModal(true)} className="dv-btn dv-btn-primary dv-btn-sm">
              <Upload size={13} />
              <span>Upload Document</span>
            </button>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showModal && (
        <div className="dv-modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="dv-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dv-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Upload size={17} style={{ color: 'var(--color-primary)' }} />
                <h3 className="dv-panel-title">Upload Document</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpload}>
              <div className="dv-modal-body">
                {uploadError && (
                  <div className="dv-alert dv-alert-danger">
                    <AlertCircle size={15} style={{ flexShrink: 0 }} />
                    <span>{uploadError}</span>
                  </div>
                )}

                <div className="dv-form-group">
                  <label className="dv-label" htmlFor="docTitle">Document Title *</label>
                  <input
                    id="docTitle"
                    type="text"
                    required
                    placeholder="e.g. Identity Proof 2026, Medical Certificate"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="dv-input"
                  />
                </div>

                <div className="dv-form-group">
                  <label className="dv-label" htmlFor="docCat">Category *</label>
                  <select
                    id="docCat"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="dv-select"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="dv-form-group">
                  <label className="dv-label" htmlFor="docFile">File Source * (Max 15MB: PDF, PNG, JPG, TXT, DOCX)</label>
                  <input
                    id="docFile"
                    type="file"
                    required
                    onChange={(e) => setFile(e.target.files[0])}
                    className="dv-input"
                    style={{ padding: '6px' }}
                  />
                </div>
              </div>

              <div className="dv-modal-footer">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="dv-btn dv-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="dv-btn dv-btn-primary"
                >
                  {uploading ? 'Storing...' : 'Upload File'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentManager;
