import { useState } from 'react';
import { useTranslation } from 'react-i18next';

function calcEntropy(pwd) {
  const charset = (
    (/[a-z]/.test(pwd) ? 26 : 0) +
    (/[A-Z]/.test(pwd) ? 26 : 0) +
    (/[0-9]/.test(pwd) ? 10 : 0) +
    (/[^a-zA-Z0-9]/.test(pwd) ? 32 : 0)
  );
  return charset > 0 ? Math.round(pwd.length * Math.log2(charset)) : 0;
}

function estimateCrackTime(entropy, t) {
  const guesses = Math.pow(2, entropy) / 1e9;
  if (guesses < 1) return t('scanner.verdict.suspicious');
  if (guesses < 60) return `${Math.round(guesses)} seconds`;
  if (guesses < 3600) return `${Math.round(guesses/60)} minutes`;
  if (guesses < 86400) return `${Math.round(guesses/3600)} hours`;
  if (guesses < 31536000) return `${Math.round(guesses/86400)} days`;
  if (guesses < 3153600000) return `${Math.round(guesses/31536000)} years`;
  if (guesses < 3.15e13) return `${Math.round(guesses/3.15e9)} thousand years`;
  return t('password.crackTime');
}

function analyzePassword(pwd, t) {
  const checks = {
    length8: pwd.length >= 8,
    length12: pwd.length >= 12,
    length16: pwd.length >= 16,
    lowercase: /[a-z]/.test(pwd),
    uppercase: /[A-Z]/.test(pwd),
    numbers: /[0-9]/.test(pwd),
    symbols: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(pwd),
    noCommon: !['password', '123456', 'qwerty', 'abc123', '111111', 'admin', 'welcome', 'letmein', 'monkey', 'password1', 'iloveyou'].some(c => pwd.toLowerCase().includes(c)),
    noRepeat: !/(.)\1{2,}/.test(pwd),
    noSequential: !/(?:012|123|234|345|456|567|678|789|890|abc|bcd|cde)/.test(pwd.toLowerCase()),
  };

  const entropy = calcEntropy(pwd);
  const crackTime = estimateCrackTime(entropy, t);

  let score = 0;
  if (checks.length8) score += 10;
  if (checks.length12) score += 15;
  if (checks.length16) score += 10;
  if (checks.lowercase) score += 10;
  if (checks.uppercase) score += 15;
  if (checks.numbers) score += 15;
  if (checks.symbols) score += 20;
  if (checks.noCommon) score += 10;
  if (checks.noRepeat) score += 5;
  if (checks.noSequential) score += 5;

  let strengthLabel, strengthColor, strengthClass;
  if (score < 25) { strengthLabel = t('scanner.verdict.malicious'); strengthColor = 'var(--color-danger)'; strengthClass = 'meter-danger'; }
  else if (score < 45) { strengthLabel = t('scanner.verdict.malicious'); strengthColor = '#ff7733'; strengthClass = 'meter-danger'; }
  else if (score < 65) { strengthLabel = t('scanner.verdict.suspicious'); strengthColor = 'var(--color-warning)'; strengthClass = 'meter-warning'; }
  else if (score < 80) { strengthLabel = t('scanner.verdict.safe'); strengthColor = '#44dd77'; strengthClass = 'meter-safe'; }
  else { strengthLabel = t('scanner.verdict.safe'); strengthColor = 'var(--color-green)'; strengthClass = 'meter-safe'; }

  const suggestions = [];
  if (!checks.length8) suggestions.push(t('password.tips.0.text'));
  if (!checks.length12) suggestions.push(t('password.tips.3.text'));
  
  return { score, strengthLabel, strengthColor, strengthClass, entropy, crackTime, checks, suggestions };
}

export default function PasswordChecker({ addPoints, addToast }) {
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [checked, setChecked] = useState(false);

  const result = password.length > 0 ? analyzePassword(password, t) : null;

  const handleCheck = () => {
    if (!password) return;
    setChecked(true);
    addPoints(5);
    addToast(`${t('password.title')} ${t('common.verified')}! +5 pts`, 'info', '🔐');
  };

  const checkItems = [
    { key: 'length8', label: t('password.tips.0.text') },
    { key: 'length12', label: t('password.tips.3.text') },
    { key: 'lowercase', label: 'Lowercase letters' },
    { key: 'uppercase', label: 'Uppercase letters' },
    { key: 'numbers', label: 'Numbers (0-9)' },
    { key: 'symbols', label: 'Symbols (!@#)' },
    { key: 'noCommon', label: 'Unique password' },
  ];

  return (
    <div>
      <div className="page-header container">
        <span className="tag" style={{ background: 'var(--color-purple-dim)', borderColor: 'rgba(156,107,255,0.3)', color: 'var(--color-purple)' }}>🔐 {t('password.title')}</span>
        <h1>{t('password.subtitle').split(' ').slice(0, 1).join(' ')} <span className="gradient-text">{t('password.subtitle').split(' ').slice(1).join(' ')}</span></h1>
        <p>{t('password.desc')}</p>
      </div>

      <div className="container section-sm" style={{ maxWidth: 700 }}>
        <div className="card">
          <div className="form-group">
            <label className="form-label">{t('password.label')}</label>
            <div className="input-group">
              <input
                className="form-input font-mono"
                type={show ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setChecked(false); }}
                placeholder={t('password.placeholder')}
              />
              <button className="btn btn-secondary" onClick={() => setShow(s => !s)} style={{ minWidth: 60 }}>{show ? '🙈' : '👁️'}</button>
              <button className="btn btn-primary" onClick={handleCheck} disabled={!password}>{t('password.analyze')}</button>
            </div>
          </div>

          {result && (
            <div style={{ marginTop: 20 }}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span className="font-bold text-sm">{t('password.strength')}</span>
                  <span style={{ color: result.strengthColor, fontWeight: 700 }}>{result.strengthLabel}</span>
                </div>
                <div className="meter-track" style={{ height: 10 }}>
                  <div className={`meter-fill ${result.strengthClass}`} style={{ width: `${result.score}%` }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                  <span className="text-muted text-xs">0 ({t('scanner.verdict.malicious')})</span>
                  <span className="text-muted text-xs">Score: {result.score}/100</span>
                  <span className="text-muted text-xs">100 ({t('scanner.verdict.safe')})</span>
                </div>
              </div>

              <div className="grid-2" style={{ marginBottom: 20, gap: 12 }}>
                <div className="stat-card" style={{ textAlign: 'center' }}>
                  <div className="stat-label">{t('password.entropy')}</div>
                  <div className="stat-value text-cyan">{result.entropy}</div>
                  <div className="stat-sub">bits</div>
                </div>
                <div className="stat-card" style={{ textAlign: 'center' }}>
                  <div className="stat-label">{t('password.crackTime')}</div>
                  <div className="stat-value" style={{ color: result.strengthColor, fontSize: '1.2rem' }}>{result.crackTime}</div>
                  <div className="stat-sub">{t('password.guesses')}</div>
                </div>
              </div>

              <div>
                <h4 style={{ fontWeight: 700, marginBottom: 12, fontSize: '0.9rem' }}>{t('password.checklist')}</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 8 }}>
                  {checkItems.map(item => (
                    <div key={item.key} className="result-item" style={{ padding: '8px 12px' }}>
                      <span>{result.checks[item.key] ? '✅' : '❌'}</span>
                      <span className={`text-sm ${result.checks[item.key] ? 'text-green' : 'text-secondary'}`}>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {result.suggestions.length > 0 && (
                <div style={{ marginTop: 16, padding: '16px', background: 'var(--color-warning-dim)', border: '1px solid rgba(255,221,87,0.2)', borderRadius: 'var(--radius-md)' }}>
                  <h4 style={{ fontWeight: 700, marginBottom: 10, fontSize: '0.9rem', color: 'var(--color-warning)' }}>💡 {t('password.suggestions')}</h4>
                  <ul style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {result.suggestions.map((s, i) => (
                      <li key={i} className="text-sm text-secondary" style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                        <span>→</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="card" style={{ marginTop: 20 }}>
          <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, marginBottom: 16, fontSize: '1.05rem' }}>{t('password.tipsTitle')}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {t('password.tips', { returnObjects: true }).map((t, i) => (
              <div key={i} className="result-item">
                <span style={{ fontSize: '1.2rem' }}>{t.icon}</span>
                <span className="text-sm text-secondary">{t.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
