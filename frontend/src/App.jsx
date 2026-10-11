import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import AuthView from './components/AuthView';
import UserDashboard from './components/UserDashboard';
import PersonalVault from './components/PersonalVault';
import DocumentManager from './components/DocumentManager';
import AccessRequests from './components/AccessRequests';
import ActivePermissions from './components/ActivePermissions';
import EmergencyLock from './components/EmergencyLock';
import AuditHistory from './components/AuditHistory';
import OrganizationDashboard from './components/OrganizationDashboard';
import AdminDashboard from './components/AdminDashboard';
import { dashboardAPI } from './services/api';

const AppContent = () => {
  const { isAuthenticated, loading, user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Poll / refresh pending requests count for badge
  const refreshBadgeCounts = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await dashboardAPI.getStats();
      if (res.data?.data?.pendingRequestsCount !== undefined) {
        setPendingRequestsCount(res.data.data.pendingRequestsCount);
      }
    } catch (err) {
      // Ignored on background refresh
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      refreshBadgeCounts();
    }
  }, [isAuthenticated, activeTab]);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--color-bg)',
        color: 'var(--color-text-main)',
        gap: '12px'
      }}>
        <div style={{
          fontFamily: 'var(--font-editorial)',
          fontSize: '1.4rem',
          fontWeight: 500,
          color: 'var(--color-primary)'
        }}>
          DataVault
        </div>
        <div style={{
          fontSize: '0.84rem',
          color: 'var(--color-text-secondary)',
          fontFamily: 'var(--font-mono)'
        }}>
          Initializing cryptographic session...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthView />;
  }

  const role = user?.role || 'USER';

  const renderActiveScreen = () => {
    if (role === 'ORGANIZATION') {
      if (activeTab === 'audit') return <AuditHistory />;
      return <OrganizationDashboard subTab={activeTab} setSubTab={setActiveTab} />;
    }

    if (role === 'ADMIN') {
      if (activeTab === 'audit') return <AuditHistory />;
      return <AdminDashboard setActiveTab={setActiveTab} />;
    }

    // Role USER
    switch (activeTab) {
      case 'vault':
        return <PersonalVault />;
      case 'documents':
        return <DocumentManager />;
      case 'requests':
        return <AccessRequests onRequestHandled={refreshBadgeCounts} />;
      case 'permissions':
        return <ActivePermissions />;
      case 'lock':
        return <EmergencyLock />;
      case 'audit':
        return <AuditHistory />;
      case 'dashboard':
      default:
        return <UserDashboard setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="dv-app-layout">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingCount={pendingRequestsCount}
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
      />
      <div className="dv-main-wrapper">
        <Navbar onToggleMobileMenu={() => setIsMobileNavOpen(!isMobileNavOpen)} />
        <main className="dv-content-area">
          {renderActiveScreen()}
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
