import { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, NavLink, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './i18n/i18n';
import Home from './pages/Home';
import Scanner from './pages/Scanner';
import SMSDetector from './pages/SMSDetector';
import PasswordChecker from './pages/PasswordChecker';
import Challenges from './pages/Challenges';
import Leaderboard from './pages/Leaderboard';
import Heatmap from './pages/Heatmap';
import ReportThreat from './pages/ReportThreat';
import Dashboard from './pages/Dashboard';
import Auth from './pages/Auth';
import AdminDashboard from './pages/AdminDashboard';
import Education from './pages/Education';
import CyberAssistant from './components/CyberAssistant';
import { AuthProvider, useAuth } from './context/AuthContext';
import './index.css';

function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();
  if (!currentUser) {
    return <Navigate to="/auth" replace />;
  }
  return children;
}

function AdminRoute({ children }) {
  const { currentUser, isAdmin } = useAuth();
  if (!currentUser || !isAdmin) {
    return <Navigate to="/" replace />;
  }
  return children;
}

const navItems = [
  { path: '/', label: 'nav.home', icon: '🏠' },
  { path: '/education', label: 'nav.education', icon: '🎓' },
  { path: '/scanner', label: 'nav.scanner', icon: '🔍' },
  { path: '/sms', label: 'nav.sms', icon: '📱' },
  { path: '/password', label: 'nav.password', icon: '🔐' },
  { path: '/challenges', label: 'nav.challenges', icon: '🎮' },
  { path: '/leaderboard', label: 'nav.leaderboard', icon: '🏆' },
  { path: '/heatmap', label: 'nav.heatmap', icon: '🗺️' },
  { path: '/report', label: 'nav.report', icon: '📋' },
  { path: '/dashboard', label: 'nav.dashboard', icon: '📊' },
];

function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
    { code: 'kn', name: 'ಕನ್ನಡ', flag: '🇮🇳' },
    { code: 'te', name: 'తెలుగు', flag: '🇮🇳' },
    { code: 'bn', name: 'বাংলা', flag: '🇮🇳' },
    { code: 'mr', name: 'मराठी', flag: '🇮🇳' },
  ];

  return (
    <div className="language-switcher">
      <select
        value={i18n.language}
        onChange={(e) => i18n.changeLanguage(e.target.value)}
        className="lang-select"
      >
        {languages.map(lang => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
}

function Navbar({ points, menuOpen, setMenuOpen }) {
  const { isAdmin } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();

  const displayNavItems = isAdmin
    ? [...navItems, { path: '/admin', label: 'nav.admin', icon: '⚙️' }]
    : navItems;

  return (
    <>
      <nav className="navbar">
        <div className="nav-logo">
          <span className="logo-icon">🛡️</span>
          <span className="logo-text">Secure Bharat</span>
        </div>
        <div className="nav-links">
          {displayNavItems.map(item => (
            <NavLink key={item.path} to={item.path} end={item.path === '/'} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              {t(item.label) || item.label}
            </NavLink>
          ))}
        </div>
        <div className="nav-right">
          <LanguageSwitcher />
          <UserProfile />
          <div className="nav-points">⭐ {points.toLocaleString()} {t('common.points')}</div>
          <button className="hamburger" onClick={() => setMenuOpen(o => !o)} aria-label="menu">
            <span /><span /><span />
          </button>
        </div>
      </nav>
      <div className={`mobile-nav${menuOpen ? ' open' : ''}`}>
        <UserProfile mobile={true} />
        {displayNavItems.map(item => (
          <NavLink key={item.path} to={item.path} end={item.path === '/'} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} onClick={() => setMenuOpen(false)}>
            {item.icon} {t(item.label) || item.label}
          </NavLink>
        ))}
      </div>
    </>
  );
}

function UserProfile({ mobile }) {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  if (!currentUser) {
    return (
      <button
        className={`btn btn-secondary ${mobile ? 'mobile-auth-btn' : ''}`}
        onClick={() => navigate('/auth')}
        style={mobile ? { margin: '16px', justifyContent: 'center' } : { marginRight: '16px', padding: '6px 12px', fontSize: '0.85rem' }}
      >
        {t('auth.signIn')}
      </button>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginRight: mobile ? 0 : '16px', padding: mobile ? '16px' : 0 }}>
      {currentUser.photoURL ? (
        <img src={currentUser.photoURL} alt="Profile" style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid var(--color-cyan)' }} />
      ) : (
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--color-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
          {(currentUser.displayName || currentUser.email || 'U').charAt(0).toUpperCase()}
        </div>
      )}
      {!mobile && <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{currentUser.displayName || currentUser.email.split('@')[0]}</span>}
      <button 
        onClick={logout} 
        className="btn" 
        style={{ 
          background: 'rgba(255, 56, 96, 0.1)', 
          border: '1px solid rgba(255, 56, 96, 0.3)', 
          color: 'var(--color-danger)',
          padding: '4px 10px', 
          fontSize: '0.75rem',
          borderRadius: '8px'
        }}
      >
        {t('auth.logout')}
      </button>
    </div>
  );
}

function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`} onClick={() => removeToast(t.id)} style={{ cursor: 'pointer' }}>
          <span>{t.icon}</span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}

function AppContent() {
  const { currentUser, points, addPoints } = useAuth();
  const [toasts, setToasts] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);

  const addToast = (message, type = 'info', icon = '💡') => {
    const id = Date.now();
    setToasts(t => [...t, { id, message, type, icon }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000);
  };

  const removeToast = (id) => setToasts(t => t.filter(x => x.id !== id));

  const ctx = { points, addPoints, addToast };

  return (
    <>
      <div className="bg-grid" />
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />
      <div className="bg-orb bg-orb-3" />
      {currentUser && <Navbar points={points} menuOpen={menuOpen} setMenuOpen={setMenuOpen} />}
      <main className="page">
        <Routes>
          <Route path="/" element={<ProtectedRoute><Home {...ctx} /></ProtectedRoute>} />
          <Route path="/education" element={<ProtectedRoute><Education {...ctx} /></ProtectedRoute>} />
          <Route path="/scanner" element={<ProtectedRoute><Scanner {...ctx} /></ProtectedRoute>} />
          <Route path="/sms" element={<ProtectedRoute><SMSDetector {...ctx} /></ProtectedRoute>} />
          <Route path="/password" element={<ProtectedRoute><PasswordChecker {...ctx} /></ProtectedRoute>} />
          <Route path="/challenges" element={<ProtectedRoute><Challenges {...ctx} /></ProtectedRoute>} />
          <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard {...ctx} /></ProtectedRoute>} />
          <Route path="/heatmap" element={<ProtectedRoute><Heatmap {...ctx} /></ProtectedRoute>} />
          <Route path="/report" element={<ProtectedRoute><ReportThreat {...ctx} /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard {...ctx} /></ProtectedRoute>} />
          <Route path="/admin" element={<AdminRoute><AdminDashboard {...ctx} /></AdminRoute>} />
          <Route path="/auth" element={<Auth {...ctx} />} />
        </Routes>
      </main>
      <CyberAssistant />
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <AppContent />
      </HashRouter>
    </AuthProvider>
  );
}

