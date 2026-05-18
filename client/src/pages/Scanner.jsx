import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { analyzeTextWithAI } from '../utils/aiClient';

const SHORTENERS = ['bit.ly', 'tinyurl.com', 'ow.ly', 'goo.gl', 't.co', 'rebrand.ly', 'is.gd', 'buff.ly', 'adf.ly', 'shorte.st', 'clkme.me', 'dlvr.it'];
const SUSPICIOUS_KEYWORDS = ['secure', 'verify', 'update', 'login', 'account', 'bank', 'confirm', 'urgent', 'click', 'free', 'prize', 'win', 'kyc', 'otp', 'reward', 'claim', 'suspend', 'block', 'alert', 'act-now', 'limited'];
const PHISHING_PATTERNS = ['sbi', 'hdfc', 'icici', 'axis', 'paytm', 'phonepe', 'gpay', 'uidai', 'aadhaar', 'incometax', 'npci', 'upi', 'irctc'];
const KNOWN_MALICIOUS_TLDS = ['.xyz', '.top', '.click', '.loan', '.online', '.site', '.work', '.tech', '.buzz', '.monster'];

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function analyzeUrl(raw, t) {
  const url = raw.trim().toLowerCase();
  const checks = [];
  let score = 0;

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    checks.push({ icon: '⚠️', label: t('scanner.checks.invalid'), severity: 'warning' });
    score += 10;
  }

  if (url.startsWith('http://')) {
    checks.push({ icon: '🔓', label: t('scanner.checks.http'), severity: 'warning' });
    score += 20;
  } else {
    checks.push({ icon: '🔒', label: t('scanner.checks.https'), severity: 'safe' });
  }

  if (/https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(url)) {
    checks.push({ icon: '🚨', label: t('scanner.checks.ip'), severity: 'danger' });
    score += 40;
  }

  const isShortened = SHORTENERS.some(s => url.includes(s));
  if (isShortened) {
    checks.push({ icon: '🔗', label: t('scanner.checks.shortener'), severity: 'warning' });
    score += 25;
  }

  const badTld = KNOWN_MALICIOUS_TLDS.find(tld => url.split('/')[2]?.includes(tld) || url.includes(tld));
  if (badTld) {
    checks.push({ icon: '⛔', label: `${t('scanner.checks.tld')} "${badTld}"`, severity: 'danger' });
    score += 30;
  }

  try {
    const hostname = new URL(url.startsWith('http') ? url : 'https://' + url).hostname;
    const parts = hostname.split('.');
    if (parts.length > 4) {
      checks.push({ icon: '🚩', label: t('scanner.checks.subdomain'), severity: 'danger' });
      score += 25;
    }
  } catch (err) {
    checks.push({ icon: '⚠️', label: t('scanner.checks.invalid'), severity: 'warning' });
    score += 15;
  }

  const foundKeywords = SUSPICIOUS_KEYWORDS.filter(k => url.includes(k));
  if (foundKeywords.length >= 3) {
    checks.push({ icon: '🚨', label: t('scanner.checks.keywords'), severity: 'danger' });
    score += 30;
  } else if (foundKeywords.length >= 1) {
    checks.push({ icon: '⚠️', label: `${t('scanner.checks.keywords')}: ${foundKeywords.join(', ')}`, severity: 'warning' });
    score += 15;
  } else {
    checks.push({ icon: '✅', label: t('scanner.checks.noKeywords'), severity: 'safe' });
  }

  const foundBrands = PHISHING_PATTERNS.filter(b => url.includes(b));
  if (foundBrands.length > 0) {
    checks.push({ icon: '🏦', label: `${t('scanner.checks.brand')}: ${foundBrands.join(', ')}`, severity: 'danger' });
    score += 30;
  }

  if (url.length > 100) {
    checks.push({ icon: '📏', label: t('scanner.checks.long'), severity: 'warning' });
    score += 10;
  } else {
    checks.push({ icon: '✅', label: t('scanner.checks.length'), severity: 'safe' });
  }

  if (url.includes('@')) {
    checks.push({ icon: '🚨', label: t('scanner.checks.at'), severity: 'danger' });
    score += 35;
  }

  if (/https?:\/\/.+\/\//.test(url)) {
    checks.push({ icon: '⚠️', label: t('scanner.checks.doubleSlash'), severity: 'warning' });
    score += 10;
  }

  const clampedScore = Math.min(score, 100);
  let verdict, color, icon;
  if (clampedScore >= 50) { verdict = 'malicious'; color = 'danger'; icon = '🚨'; }
  else if (clampedScore >= 20) { verdict = 'suspicious'; color = 'suspicious'; icon = '⚠️'; }
  else { verdict = 'safe'; color = 'safe'; icon = '✅'; }

  return { score: clampedScore, verdict, color, icon, checks };
}

const EXAMPLE_URLS = [
  'https://www.google.com',
  'https://testsafebrowsing.appspot.com/s/phishing.html',
  'https://bit.ly/3xPhish',
  'https://www.phishtank.com',
  'http://example-phish-site.xyz/login', 
];

export default function Scanner({ addPoints, addToast }) {
  const { t } = useTranslation();
  const [url, setUrl] = useState('');
  const [scanning, setScanning] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('csb_scan_history') || '[]');
    } catch (err) {
      console.error('localStorage read error:', err);
      return [];
    }
  });

  const handleScan = async () => {
    if (!url.trim()) return;
    setScanning(true);
    setResult(null);
    setProgressMsg(t('scanner.progress.rules'));
    
    const ruleRes = analyzeUrl(url, t);
    setProgressMsg(t('scanner.progress.ai'));
    
    const tokenizedUrl = url.replace(/https?:\/\//, '').replace(/www\./, '').replace(/[-_./?=&+]/g, ' ');
    const aiRes = await analyzeTextWithAI("Is this website a phishing scam or banking alert or safe? " + tokenizedUrl, (info) => {
      if (info.status === 'progress') setProgressMsg(`AI model: ${Math.round(info.progress)}%`);
      else if (info.status === 'ready') setProgressMsg(t('scanner.progress.ai'));
    });

    setProgressMsg(t('scanner.progress.db'));
    let externalRes = { score: 0 };
    let externalIndicator = { icon: '🌐', label: 'No external DB connection', severity: 'info' };
    try {
      const extRes = await fetch(`${BACKEND_URL}/api/scan-external?url=${encodeURIComponent(url)}`);
      if (extRes.ok) {
        const data = await extRes.json();
        externalRes.score = data.score;
        externalIndicator = { 
          icon: '🌐', 
          label: `Threat DB: ${data.verdict} (${data.score}/100)`, 
          severity: data.verdict === 'malicious' ? 'danger' : data.verdict === 'suspicious' ? 'warning' : 'safe'
        };
      }
    } catch (err) {
      console.warn('External scan unavailable:', err.message);
    }

    const aiScore = aiRes.error ? 0 : aiRes.aiRiskScore;
    let blendedScore = (ruleRes.score * 0.4) + (aiScore * 0.2) + (externalRes.score * 0.4);
    if (externalRes.score >= 80) blendedScore = Math.max(blendedScore, 90);

    const clampedScore = Math.min(blendedScore, 100);
    const vKey = clampedScore >= 50 ? 'malicious' : clampedScore >= 25 ? 'suspicious' : 'safe';
    const color = clampedScore >= 50 ? 'danger' : clampedScore >= 25 ? 'suspicious' : 'safe';
    const icon = clampedScore >= 50 ? '🚨' : clampedScore >= 25 ? '⚠️' : '✅';

    const checks = [externalIndicator];
    let aiIndicator = null;
    if (!aiRes.error) {
      aiIndicator = { 
        icon: '🤖', 
        label: `Local AI: ${aiRes.label} (${Math.round(aiRes.confidence)}% conf.)`, 
        severity: aiRes.isScam ? 'danger' : 'safe' 
      };
      checks.push(aiIndicator);
    }
    checks.push(...ruleRes.checks);

    const finalResult = { score: Math.round(clampedScore), verdict: t(`scanner.verdict.${vKey}`), color, icon, checks };

    setResult(finalResult);
    setScanning(false);
    setProgressMsg('');

    const entry = { url: url.trim(), verdict: finalResult.verdict, score: finalResult.score, time: new Date().toLocaleTimeString() };
    const newHistory = [entry, ...history].slice(0, 10);
    setHistory(newHistory);
    try {
      localStorage.setItem('csb_scan_history', JSON.stringify(newHistory));
    } catch (err) {
      console.error('localStorage write error:', err);
    }
    addPoints(20);
    addToast(`${t('scanner.scanning')} ${finalResult.verdict}! +20 pts`, color === 'safe' ? 'success' : 'error', icon);
  };

  const scoreColor = result?.color === 'safe' ? 'var(--color-green)' : result?.color === 'suspicious' ? 'var(--color-warning)' : 'var(--color-danger)';
  const scoreDeg = result ? `${Math.round((result.score / 100) * 360)}deg` : '0deg';

  return (
    <div>
      <div className="page-header container">
        <span className="tag">{t('scanner.title')}</span>
        <h1>{t('scanner.subtitle').split(' ')[0]} <span className="gradient-text">{t('scanner.subtitle').split(' ').slice(1).join(' ')}</span></h1>
        <p>{t('scanner.description')}</p>
      </div>

      <div className="container section-sm" style={{ maxWidth: 800 }}>
        <div className="card card-glow-cyan">
          <div className="form-group">
            <label className="form-label">{t('scanner.label')}</label>
            <div className="input-group">
              <input 
                className="form-input font-mono" 
                value={url} 
                onChange={e => setUrl(e.target.value)} 
                placeholder="https://suspicious-site.xyz/login" 
                onKeyDown={e => e.key === 'Enter' && handleScan()}
              />
              <button 
                className="btn btn-primary" 
                onClick={handleScan} 
                disabled={scanning || !url.trim()}
              >
                {scanning ? <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> {t('scanner.scanning')}</> : `🚀 ${t('scanner.button')}`}
              </button>
            </div>
            <p className="text-xs text-muted mt-2">
              {t('scanner.progress.backend')}
            </p>
          </div>

          <div style={{ marginTop: 14 }}>
            <p className="text-muted text-xs mb-8">{t('scanner.examples')}:</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {EXAMPLE_URLS.map(u => (
                <button 
                  key={u} 
                  className="btn btn-secondary btn-sm font-mono" 
                  style={{ fontSize: '0.72rem' }} 
                  onClick={() => setUrl(u)}
                >
                  {u.length > 40 ? u.slice(0, 40) + '…' : u}
                </button>
              ))}
            </div>
          </div>

          {scanning && (
            <div style={{ marginTop: 24 }}>
              <div className="scan-container" style={{ height: 6, background: 'var(--bg-glass)', borderRadius: 3 }}>
                <div className="scan-line" style={{ height: '100%', top: 0 }} />
              </div>
              <div style={{ textAlign: 'center', marginTop: 12, color: 'var(--text-muted)', fontSize: '0.88rem', fontFamily: 'monospace' }}>
                🔍 {progressMsg}
              </div>
            </div>
          )}
        </div>

        {result && (
          <div className={`result-panel result-${result.color}`}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, flexWrap: 'wrap' }}>
              <div style={{ '--score-color': scoreColor, '--score-deg': scoreDeg, '--score-glow': scoreColor + '33' }} className="score-circle">
                <span className="score-num">{result.score}</span>
                <span className="score-label">{t('scanner.score')}</span>
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div className="result-icon">{result.icon}</div>
                <div className="result-title" style={{ color: scoreColor }}>{result.verdict}</div>
                <p className="text-secondary text-sm" style={{ marginTop: 4 }}>
                  {t('scanner.score')}: <strong>{result.score}/100</strong>{' '}
                  {result.color === 'safe' ? '✅ Appears legitimate.' :
                   result.color === 'suspicious' ? '⚠️ Use caution.' :
                   '🚨 DO NOT VISIT.'}
                </p>
              </div>
            </div>
            <div className="divider" />
            <h4 style={{ fontWeight: 700, marginBottom: 12, fontSize: '0.9rem' }}>Analysis Breakdown</h4>
            <div className="result-details">
              {result.checks.map((c, i) => (
                <div key={i} className="result-item">
                  <span className="result-item-icon">{c.icon}</span>
                  <span className={`text-sm ${c.severity === 'danger' ? 'text-danger' : c.severity === 'warning' ? 'text-warning' : c.severity === 'safe' ? 'text-green' : 'text-muted'}`}>{c.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {history.length > 0 && (
          <div style={{ marginTop: 28 }}>
            <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, marginBottom: 14, fontSize: '1rem' }}>{t('scanner.recent')}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {history.map((h, i) => (
                <div key={i} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', flexWrap: 'wrap' }}>
                  <span className={`badge badge-${h.verdict.toLowerCase().includes('safe') ? 'safe' : h.verdict.toLowerCase().includes('suspicious') ? 'suspicious' : 'danger'}`}>{h.verdict}</span>
                  <span className="font-mono text-sm text-secondary" style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.url}</span>
                  <span className="text-muted text-xs">{h.time}</span>
                  <span className="text-danger font-bold text-sm">{h.score}/100</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
