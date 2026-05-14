import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Auth({ addToast }) {
  const { t } = useTranslation();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const { login, signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const getFriendlyAuthError = (err) => {
    const code = err?.code || '';
    if (code.includes('user-not-found')) return 'No account found. Try creating one.';
    if (code.includes('wrong-password') || code.includes('invalid-credential')) return 'Wrong email or password.';
    if (code.includes('email-already-in-use')) return 'Email already registered.';
    return err.message || 'Authentication failed.';
  };

  const passwordRules = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  };

  const isPasswordValid = Object.values(passwordRules).every(Boolean);

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    if (!isLogin) {
      if (!isPasswordValid) return;
      if (password !== confirmPassword) {
        addToast(t('auth.passMismatch'), 'error', '⚠️');
        return;
      }
    }
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
        addToast(t('auth.successLogin'), 'success', '👋');
      } else {
        await signup(email, password, name);
        addToast(t('auth.successSignup'), 'success', '🎉');
      }
      navigate('/');
    } catch (err) {
      addToast(getFriendlyAuthError(err), 'error', '🚨');
    }
    setLoading(false);
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
      addToast(t('auth.successLogin'), 'success', '🌟');
      navigate('/');
    } catch (err) {
      addToast(getFriendlyAuthError(err), 'error', '🚨');
    }
    setLoading(false);
  };

  return (
    <div>
      <div className="page-header container">
        <span className="tag" style={{ background: 'var(--color-purple-dim)', borderColor: 'rgba(156,107,255,0.3)', color: 'var(--color-purple)' }}>
          🔒 {t('auth.title')}
        </span>
        <h1>{t('auth.subtitle').split(' ').slice(0, 2).join(' ')} <span className="gradient-text">{t('auth.subtitle').split(' ').slice(2).join(' ')}</span></h1>
        <p>{t('auth.desc')}</p>
      </div>

      <div className="container section-sm" style={{ display: 'flex', justifyContent: 'center' }}>
        <div className="card card-glow-purple" style={{ width: '100%', maxWidth: 450, padding: 32 }}>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.6rem', marginBottom: 24, textAlign: 'center' }}>
            {isLogin ? t('auth.signIn') : t('auth.signUp')}
          </h2>

          <button className="btn btn-secondary" style={{ width: '100%', marginBottom: 24, justifyContent: 'center', background: '#ffffff', color: '#333' }} onClick={handleGoogleAuth} disabled={loading}>
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: 18, marginRight: 8 }} />
            {t('auth.google')}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text-muted)', margin: '24px 0', fontSize: '0.85rem' }}>
            <hr style={{ flex: 1, borderColor: 'var(--border-glass)' }} />
            <span style={{ padding: '0 12px' }}>{t('auth.or')}</span>
            <hr style={{ flex: 1, borderColor: 'var(--border-glass)' }} />
          </div>

          <form onSubmit={handleEmailAuth} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {!isLogin && (
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">{t('auth.name')}</label>
                <input type="text" className="form-input" placeholder="Rahul Sharma" value={name} onChange={(e) => setName(e.target.value)} required={!isLogin} disabled={loading} />
              </div>
            )}
            
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">{t('auth.email')}</label>
              <input type="email" className="form-input" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">{t('auth.password')}</label>
              <input type="password" className="form-input" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={loading} />
            </div>

            {!isLogin && (
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">{t('auth.confirm')}</label>
                <input type="password" className="form-input" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required={!isLogin} disabled={loading} />
              </div>
            )}

            {!isLogin && password && (
              <div className="password-requirements" style={{ padding: 12, borderRadius: 8, background: 'rgba(0,0,0,0.2)', fontSize: '0.75rem' }}>
                <div style={{ marginBottom: 8, fontWeight: 600, color: 'var(--text-secondary)' }}>{t('auth.requirements')}:</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div style={{ color: passwordRules.length ? 'var(--color-cyan)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>{passwordRules.length ? '✓' : '○'} {t('auth.length')}</div>
                  <div style={{ color: passwordRules.uppercase ? 'var(--color-cyan)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>{passwordRules.uppercase ? '✓' : '○'} {t('auth.uppercase')}</div>
                  <div style={{ color: passwordRules.number ? 'var(--color-cyan)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>{passwordRules.number ? '✓' : '○'} {t('auth.number')}</div>
                  <div style={{ color: passwordRules.special ? 'var(--color-cyan)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>{passwordRules.special ? '✓' : '○'} {t('auth.special')}</div>
                </div>
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} disabled={loading || (!isLogin && !isPasswordValid)}>
              {loading ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></span> : (isLogin ? t('auth.signIn') : t('auth.signUp'))}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 24, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            {isLogin ? t('auth.noAccount') : t('auth.hasAccount')}
            <button onClick={() => setIsLogin(!isLogin)} style={{ background: 'none', border: 'none', color: 'var(--color-cyan)', fontWeight: 600, cursor: 'pointer', padding: 0, marginLeft: 5 }}>
              {isLogin ? t('auth.create') : t('auth.back')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
