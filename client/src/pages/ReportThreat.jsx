import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const THREAT_TYPES = [
  'UPI Phishing', 'OTP Fraud', 'Job Scam', 'Fake Banking Alert',
  'Identity Theft', 'Fake App / APK', 'Social Media Scam',
  'Investment Fraud', 'Sextortion', 'Other',
];

const CITIES = [
  'Mumbai', 'Delhi', 'Bengaluru', 'Chennai', 'Hyderabad', 'Kolkata',
  'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow', 'Bhopal', 'Patna',
  'Kochi', 'Chandigarh', 'Guwahati', 'Surat', 'Nagpur', 'Other',
];

const PLATFORMS = [
  'SMS', 'WhatsApp', 'Email', 'Phone Call', 'Website', 'Mobile App',
  'Telegram', 'Instagram', 'Facebook', 'YouTube', 'Other',
];

export default function ReportThreat({ addPoints, addToast }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({ type: '', platform: '', city: '', description: '', url: '', phone: '', financial_loss: '', consent: false });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reports, setReports] = useState(() => JSON.parse(localStorage.getItem('csb_reports') || '[]'));
  const [showHistory, setShowHistory] = useState(false);

  const API_URL = 'http://localhost:5000';

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.type || !form.platform || !form.city || !form.description || !form.consent) {
      addToast(t('report.form.consent'), 'error', '⚠️');
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/api/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          timestamp: new Date().toISOString(),
          status: 'Submitted'
        })
      });

      if (!response.ok) throw new Error('Failed to submit report');

      const report = await response.json();
      const newReports = [report, ...reports];
      setReports(newReports);
      localStorage.setItem('csb_reports', JSON.stringify(newReports));
      setSubmitted(true);
      addPoints(50);
      addToast(`${t('report.success.title')} +50 pts`, 'success', '🛡️');
    } catch (err) {
      console.error('Report error:', err);
      addToast(t('common.retry'), 'error', '❌');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    const lastReport = reports[0];
    return (
      <div>
        <div className="page-header container">
          <span className="tag">📋 {t('report.success.id')}</span>
          <h1>{t('report.success.title').split(',')[0]}, <span className="gradient-text">{t('report.success.title').split(',')[1]}</span></h1>
        </div>
        <div className="container section-sm" style={{ maxWidth: 600 }}>
          <div className="card card-glow-cyan" style={{ textAlign: 'center', padding: '48px 32px' }}>
            <div style={{ fontSize: '4rem', marginBottom: 16, animation: 'float 3s ease-in-out infinite' }}>🛡️</div>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, marginBottom: 10 }}>{t('report.success.id')}: <span className="text-cyan">{lastReport?.reportId}</span></h2>
            <p className="text-secondary" style={{ marginBottom: 24 }}>{t('report.success.desc')}</p>
            <div style={{ background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', padding: '16px', marginBottom: 24, textAlign: 'left' }}>
              {[[t('report.form.type'), lastReport?.type], [t('report.form.platform'), lastReport?.platform], [t('report.form.city'), lastReport?.city], [t('nav.overview'), lastReport?.status]].map(([k,v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-glass)' }}>
                  <span className="text-muted text-sm">{k}</span>
                  <span className="text-sm font-bold">{v}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={() => { setSubmitted(false); setForm({ type: '', platform: '', city: '', description: '', url: '', phone: '', financial_loss: '', consent: false }); }}>
                {t('report.success.another')}
              </button>
              <a href="https://cybercrime.gov.in" target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
                {t('report.success.official')}
              </a>
            </div>
            <p className="text-muted text-xs" style={{ marginTop: 16 }}>National Cyber Crime Helpline: <strong className="text-cyan">1930</strong></p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header container">
        <span className="tag" style={{ background: 'var(--color-cyan-dim)', borderColor: 'var(--border-glow-cyan)', color: 'var(--color-cyan)' }}>📋 {t('report.title')}</span>
        <h1>{t('report.subtitle').split(' ').slice(0, 2).join(' ')} <span className="gradient-text">{t('report.subtitle').split(' ').slice(2).join(' ')}</span></h1>
        <p>{t('report.desc')}</p>
      </div>

      <div className="container section-sm" style={{ maxWidth: 700 }}>
        <div style={{ background: 'var(--color-danger-dim)', border: '1px solid rgba(255,56,96,0.3)', borderRadius: 'var(--radius-md)', padding: '14px 18px', marginBottom: 24, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <span style={{ fontSize: '1.4rem' }}>🚨</span>
          <div>
            <div className="font-bold text-sm text-danger">{t('report.emergency')}</div>
            <div className="text-sm text-secondary">{t('report.emergencyDesc')} <strong className="text-cyan">cybercrime.gov.in</strong></div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="card">
            <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, marginBottom: 20, fontSize: '1.1rem' }}>{t('report.form.title')}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="grid-2" style={{ gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">{t('report.form.type')} *</label>
                  <select className="form-input form-select" value={form.type} onChange={e => set('type', e.target.value)} required>
                    <option value="">{t('common.loading')}</option>
                    {THREAT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">{t('report.form.platform')} *</label>
                  <select className="form-input form-select" value={form.platform} onChange={e => set('platform', e.target.value)} required>
                    <option value="">{t('common.loading')}</option>
                    {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">{t('report.form.city')} *</label>
                <select className="form-input form-select" value={form.city} onChange={e => set('city', e.target.value)} required>
                  <option value="">{t('common.loading')}</option>
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">{t('report.form.url')}</label>
                <input className="form-input font-mono" type="text" value={form.url} onChange={e => set('url', e.target.value)} placeholder="https://malicious-site.xyz/phishing" />
              </div>

              <div className="grid-2" style={{ gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">{t('report.form.phone')}</label>
                  <input className="form-input" type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 XXXXX XXXXX" />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('report.form.loss')}</label>
                  <input className="form-input" type="number" value={form.financial_loss} onChange={e => set('financial_loss', e.target.value)} placeholder="0" min="0" />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">{t('report.form.desc')} *</label>
                <textarea className="form-input form-textarea" value={form.description} onChange={e => set('description', e.target.value)} placeholder={t('report.form.desc')} required />
              </div>

              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '12px 14px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)' }}>
                <input type="checkbox" id="consent" checked={form.consent} onChange={e => set('consent', e.target.checked)} style={{ marginTop: 3, accentColor: 'var(--color-cyan)', flexShrink: 0 }} />
                <label htmlFor="consent" className="text-sm text-secondary" style={{ cursor: 'pointer' }}>
                  {t('report.form.consent')}
                </label>
              </div>

              <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={submitting}>
                {submitting ? <><span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />{t('report.form.submitting')}</> : t('report.form.submit')}
              </button>
            </div>
          </div>
        </form>

        {reports.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowHistory(h => !h)}>
              {showHistory ? `▲ ${t('report.history.hide')}` : `▼ ${t('report.history.show')}`} ({reports.length})
            </button>
            {showHistory && (
              <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {reports.map(r => (
                  <div key={r.reportId} className="card" style={{ padding: '14px 18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
                      <div>
                        <span className="font-mono text-xs text-cyan">{r.reportId}</span>
                        <span className="badge badge-info" style={{ marginLeft: 8 }}>{r.status}</span>
                      </div>
                      <span className="text-muted text-xs">{r.timestamp}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <span className="badge badge-danger">{r.type}</span>
                      <span className="badge badge-info">{r.platform}</span>
                      <span className="badge badge-saffron">📍 {r.city}</span>
                    </div>
                    <p className="text-sm text-secondary" style={{ marginTop: 8, lineHeight: 1.5 }}>{r.description.slice(0, 120)}{r.description.length > 120 ? '…' : ''}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
