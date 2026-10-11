import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import ThemeToggle from './ThemeToggle';
import { Shield, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

const AuthView = () => {
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [accountType, setAccountType] = useState('USER'); // 'USER' or 'ORGANIZATION'

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        if (accountType === 'ORGANIZATION') {
          await authAPI.registerOrg({
            fullName,
            email,
            password,
            organizationName: organizationName || fullName,
          });
        } else {
          await authAPI.register({
            fullName,
            email,
            password,
            role: 'USER',
          });
        }
        setSuccessMsg('Account created successfully. You may now sign in.');
        setIsLogin(true);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Operation failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      backgroundColor: 'var(--color-bg)',
      position: 'relative'
    }}>
      {/* Top Right Controls */}
      <div style={{ position: 'absolute', top: '20px', right: '20px' }}>
        <ThemeToggle showLabel />
      </div>

      <div style={{ width: '100%', maxWidth: '400px' }}>
        {/* Minimal Refined Wordmark */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{
              display: 'inline-block',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-primary)'
            }}></span>
            <span style={{
              fontFamily: 'var(--font-editorial)',
              fontSize: '1.65rem',
              fontWeight: 500,
              letterSpacing: '-0.02em',
              color: 'var(--color-text-main)'
            }}>
              DataVault
            </span>
          </div>
          <p style={{
            fontSize: '0.82rem',
            color: 'var(--color-text-secondary)',
            fontFamily: 'var(--font-sans)',
            letterSpacing: '0.01em'
          }}>
            Secure personal data sharing & privacy management
          </p>
        </div>

        {/* Panel Form */}
        <div className="dv-panel" style={{ padding: '28px 24px' }}>
          {/* Subtle Auth Mode Toggle */}
          <div style={{
            display: 'flex',
            borderBottom: '1px solid var(--color-border)',
            marginBottom: '20px'
          }}>
            <button
              type="button"
              onClick={() => { setIsLogin(true); setError(''); setSuccessMsg(''); }}
              style={{
                flex: 1,
                padding: '8px 0',
                background: 'none',
                border: 'none',
                borderBottom: isLogin ? '2px solid var(--color-primary)' : '2px solid transparent',
                color: isLogin ? 'var(--color-text-main)' : 'var(--color-text-muted)',
                fontWeight: isLogin ? 600 : 500,
                fontSize: '0.88rem',
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                transition: 'all 0.15s ease'
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsLogin(false); setError(''); setSuccessMsg(''); }}
              style={{
                flex: 1,
                padding: '8px 0',
                background: 'none',
                border: 'none',
                borderBottom: !isLogin ? '2px solid var(--color-primary)' : '2px solid transparent',
                color: !isLogin ? 'var(--color-text-main)' : 'var(--color-text-muted)',
                fontWeight: !isLogin ? 600 : 500,
                fontSize: '0.88rem',
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                transition: 'all 0.15s ease'
              }}
            >
              Register
            </button>
          </div>

          {/* Feedback Alerts */}
          {error && (
            <div className="dv-alert dv-alert-danger">
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="dv-alert dv-alert-success">
              <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Account Role Selector on Register */}
            {!isLogin && (
              <div className="dv-form-group">
                <label className="dv-label">Account Category</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setAccountType('USER')}
                    className={`dv-btn dv-btn-sm ${accountType === 'USER' ? 'dv-btn-primary' : 'dv-btn-secondary'}`}
                    style={{ fontSize: '0.8rem' }}
                  >
                    Personal User
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccountType('ORGANIZATION')}
                    className={`dv-btn dv-btn-sm ${accountType === 'ORGANIZATION' ? 'dv-btn-primary' : 'dv-btn-secondary'}`}
                    style={{ fontSize: '0.8rem' }}
                  >
                    Organization
                  </button>
                </div>
              </div>
            )}

            {!isLogin && (
              <div className="dv-form-group">
                <label className="dv-label" htmlFor="fullName">Full Name</label>
                <input
                  id="fullName"
                  type="text"
                  required
                  placeholder="e.g. Alice Smith"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="dv-input"
                />
              </div>
            )}

            {!isLogin && accountType === 'ORGANIZATION' && (
              <div className="dv-form-group">
                <label className="dv-label" htmlFor="organizationName">Organization Name</label>
                <input
                  id="organizationName"
                  type="text"
                  required
                  placeholder="e.g. Global Health Services"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  className="dv-input"
                />
              </div>
            )}

            <div className="dv-form-group">
              <label className="dv-label" htmlFor="email">Email Address / User ID</label>
              <input
                id="email"
                type="text"
                required
                placeholder="Email address or user ID"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="dv-input"
              />
            </div>

            <div className="dv-form-group">
              <label className="dv-label" htmlFor="password">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="dv-input"
                  style={{ paddingRight: '36px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="dv-btn dv-btn-primary"
              style={{ width: '100%', marginTop: '8px', padding: '10px' }}
            >
              {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>

        {/* Footer Security Note */}
        <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.74rem', color: 'var(--color-text-muted)' }}>
          AES-256-GCM encrypted database storage &middot; Server-enforced privacy
        </div>
      </div>
    </div>
  );
};

export default AuthView;
