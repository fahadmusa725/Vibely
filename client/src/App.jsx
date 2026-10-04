import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import MobileNav from './components/MobileNav';
import LeftSidebar from './components/LeftSidebar';
import CreatePostModal from './components/CreatePostModal';
import Feed from './pages/Feed';
import Explore from './pages/Explore';
import Notifications from './pages/Notifications';
import Search from './pages/Search';
import Profile from './pages/Profile';
import Saved from './pages/Saved';
import Settings from './pages/Settings';
import Auth from './pages/Auth';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import './App.css';

const isThreeColPath = (pathname) => {
  return pathname === '/' || pathname === '/explore';
};

function AppContent() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const location = useLocation();
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="app-loading" />;
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Auth mode="login" />} />
        <Route path="/register" element={<Auth mode="register" />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  const useThreeCol = isThreeColPath(location.pathname);

  return (
    <div className="app-container">
      <Navbar onOpenCreateModal={() => setIsCreateModalOpen(true)} />

      <main className="app-main-viewport">
        {useThreeCol ? (
          <div className="three-col-shell">
            <aside className="app-left-sidebar">
              <LeftSidebar onOpenCreateModal={() => setIsCreateModalOpen(true)} />
            </aside>

            <Routes>
              <Route
                path="/"
                element={<Feed onOpenCreateModal={() => setIsCreateModalOpen(true)} />}
              />
              <Route path="/explore" element={<Explore />} />
            </Routes>
          </div>
        ) : (
          <Routes>
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/search" element={<Search />} />
            <Route path="/saved" element={<Saved />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/profile/:username" element={<Profile />} />
            <Route path="/login" element={<Auth mode="login" />} />
            <Route path="/register" element={<Auth mode="register" />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        )}
      </main>

      <MobileNav onOpenCreateModal={() => setIsCreateModalOpen(true)} />

      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onPostCreated={() => {
          window.location.reload();
        }}
      />
    </div>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '24px',
          textAlign: 'center',
          background: 'var(--bg-primary, #0b0e14)',
          color: 'var(--text-primary, #f8fafc)',
          fontFamily: 'sans-serif'
        }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '12px' }}>Something went wrong</h2>
          <p style={{ color: 'var(--text-tertiary, #94a3b8)', marginBottom: '20px', maxWidth: '400px' }}>
            An unexpected error occurred in the application.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              background: 'var(--accent-primary, #6c5ce7)',
              color: '#ffffff',
              border: 'none',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
