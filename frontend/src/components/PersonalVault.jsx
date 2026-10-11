import React, { useState, useEffect } from 'react';
import { vaultAPI } from '../services/api';
import {
  Plus,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  Lock,
  Search,
  AlertCircle,
  X,
  ShieldCheck
} from 'lucide-react';

const CATEGORIES = ['ALL', 'IDENTITY', 'FINANCIAL', 'MEDICAL', 'EMPLOYMENT', 'CONTACT', 'OTHER'];

const PersonalVault = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [revealedIds, setRevealedIds] = useState(new Set());

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [modalTitle, setModalTitle] = useState('');
  const [modalCategory, setModalCategory] = useState('IDENTITY');
  const [modalValue, setModalValue] = useState('');
  const [modalDescription, setModalDescription] = useState('');
  const [modalError, setModalError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const res = await vaultAPI.getRecords();
      if (res.data && res.data.data) {
        setRecords(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load vault records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const toggleReveal = (id) => {
    setRevealedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleOpenCreate = () => {
    setEditingRecord(null);
    setModalTitle('');
    setModalCategory('IDENTITY');
    setModalValue('');
    setModalDescription('');
    setModalError('');
    setShowModal(true);
  };

  const handleOpenEdit = (rec) => {
    setEditingRecord(rec);
    setModalTitle(rec.title);
    setModalCategory(rec.dataCategory);
    setModalValue(rec.value);
    setModalDescription(rec.description || '');
    setModalError('');
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this record from your vault? This will permanently remove the encrypted ciphertext from storage.')) {
      return;
    }
    try {
      await vaultAPI.deleteRecord(id);
      await fetchRecords();
    } catch (err) {
      alert('Failed to delete record: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setModalError('');
    setSubmitting(true);

    try {
      if (editingRecord) {
        await vaultAPI.updateRecord(editingRecord.id, {
          title: modalTitle,
          dataCategory: modalCategory,
          value: modalValue,
          description: modalDescription,
        });
      } else {
        await vaultAPI.createRecord({
          title: modalTitle,
          dataCategory: modalCategory,
          value: modalValue,
          description: modalDescription,
        });
      }
      setShowModal(false);
      await fetchRecords();
    } catch (err) {
      setModalError(err.response?.data?.message || err.message || 'Failed to save record');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRecords = records.filter((rec) => {
    const matchesCategory = selectedCategory === 'ALL' || rec.dataCategory === selectedCategory;
    const matchesSearch =
      rec.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.dataCategory.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (rec.description && rec.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div>
      {/* Header and Add Action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 500, color: 'var(--color-text-main)' }}>
            Personal Data Vault
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.88rem', marginTop: '2px' }}>
            Encrypted personal attributes protected with AES-256-GCM. Plaintext is never stored in the database.
          </p>
        </div>

        <button type="button" onClick={handleOpenCreate} className="dv-btn dv-btn-primary">
          <Plus size={15} />
          <span>Add Vault Record</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="dv-panel" style={{ padding: '14px 18px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        {/* Category Pills */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`dv-badge ${isSelected ? 'dv-badge-active' : 'dv-badge-neutral'}`}
                style={{
                  cursor: 'pointer',
                  padding: '5px 12px',
                  fontSize: '0.74rem',
                  border: isSelected ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                  backgroundColor: isSelected ? 'var(--color-sage-soft)' : 'var(--color-surface)'
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', minWidth: '220px' }}>
          <input
            type="text"
            placeholder="Search records..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="dv-input"
            style={{ paddingLeft: '32px', fontSize: '0.84rem' }}
          />
          <Search size={14} style={{ color: 'var(--color-text-muted)', position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
        </div>
      </div>

      {/* Vault Table */}
      <div className="dv-table-container">
        {loading ? (
          <div style={{ padding: '36px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            Retrieving encrypted vault records...
          </div>
        ) : filteredRecords.length > 0 ? (
          <table className="dv-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Decrypted / Masked Value</th>
                <th>Context / Notes</th>
                <th>Created</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((rec) => {
                const isRevealed = revealedIds.has(rec.id);
                return (
                  <tr key={rec.id}>
                    <td style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Lock size={13} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                        <span>{rec.title}</span>
                      </div>
                    </td>
                    <td>
                      <span className="dv-badge dv-badge-info">{rec.dataCategory}</span>
                    </td>
                    <td>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.82rem',
                          backgroundColor: 'var(--color-surface-subtle)',
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-xs)',
                          border: '1px solid var(--color-border)',
                          color: isRevealed ? 'var(--color-text-main)' : 'var(--color-text-muted)'
                        }}>
                          {isRevealed ? rec.value : '••••••••••••••••'}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleReveal(rec.id)}
                          style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', display: 'flex' }}
                          title={isRevealed ? 'Hide sensitive value' : 'Reveal sensitive value'}
                          aria-label={isRevealed ? 'Hide sensitive value' : 'Reveal sensitive value'}
                        >
                          {isRevealed ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', maxWidth: '240px' }}>
                      {rec.description || '—'}
                    </td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(rec.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(rec)}
                          className="dv-btn dv-btn-secondary dv-btn-sm"
                          title="Edit Record"
                          aria-label={`Edit ${rec.title}`}
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(rec.id)}
                          className="dv-btn dv-btn-danger dv-btn-sm"
                          title="Delete Record"
                          aria-label={`Delete ${rec.title}`}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--color-text-muted)' }}>
            <Lock size={32} style={{ color: 'var(--color-text-muted)', marginBottom: '10px' }} />
            <div style={{ fontSize: '0.98rem', fontWeight: 600, color: 'var(--color-text-main)' }}>No Vault Records Found</div>
            <p style={{ fontSize: '0.84rem', marginTop: '4px', marginBottom: '16px' }}>
              Store sensitive credentials, identity codes, financial indicators, or medical values safely.
            </p>
            <button type="button" onClick={handleOpenCreate} className="dv-btn dv-btn-primary dv-btn-sm">
              <Plus size={13} />
              <span>Create Record</span>
            </button>
          </div>
        )}
      </div>

      {/* Modal Dialog */}
      {showModal && (
        <div className="dv-modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="dv-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dv-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={18} style={{ color: 'var(--color-primary)' }} />
                <h3 className="dv-panel-title">
                  {editingRecord ? 'Edit Vault Record' : 'New Encrypted Record'}
                </h3>
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

            <form onSubmit={handleSave}>
              <div className="dv-modal-body">
                {modalError && (
                  <div className="dv-alert dv-alert-danger">
                    <AlertCircle size={15} style={{ flexShrink: 0 }} />
                    <span>{modalError}</span>
                  </div>
                )}

                <div className="dv-form-group">
                  <label className="dv-label" htmlFor="recTitle">Record Label / Title *</label>
                  <input
                    id="recTitle"
                    type="text"
                    required
                    placeholder="e.g. Passport Number, SSN, Blood Type"
                    value={modalTitle}
                    onChange={(e) => setModalTitle(e.target.value)}
                    className="dv-input"
                  />
                </div>

                <div className="dv-form-group">
                  <label className="dv-label" htmlFor="recCategory">Data Category *</label>
                  <select
                    id="recCategory"
                    value={modalCategory}
                    onChange={(e) => setModalCategory(e.target.value)}
                    className="dv-select"
                  >
                    <option value="IDENTITY">IDENTITY</option>
                    <option value="FINANCIAL">FINANCIAL</option>
                    <option value="MEDICAL">MEDICAL</option>
                    <option value="EMPLOYMENT">EMPLOYMENT</option>
                    <option value="CONTACT">CONTACT</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>

                <div className="dv-form-group">
                  <label className="dv-label" htmlFor="recValue">Sensitive Value *</label>
                  <input
                    id="recValue"
                    type="text"
                    required
                    placeholder="Value to be encrypted (e.g. A98765432)"
                    value={modalValue}
                    onChange={(e) => setModalValue(e.target.value)}
                    className="dv-input"
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--color-primary)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ShieldCheck size={12} />
                    <span>Protected with authenticated AES-256-GCM before write</span>
                  </span>
                </div>

                <div className="dv-form-group">
                  <label className="dv-label" htmlFor="recDesc">Context Notes (Optional)</label>
                  <textarea
                    id="recDesc"
                    rows={2}
                    placeholder="Reference notes or issuing authority..."
                    value={modalDescription}
                    onChange={(e) => setModalDescription(e.target.value)}
                    className="dv-textarea"
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
                  disabled={submitting}
                  className="dv-btn dv-btn-primary"
                >
                  {submitting ? 'Encrypting...' : editingRecord ? 'Update Record' : 'Encrypt & Store'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonalVault;
