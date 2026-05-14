import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { analyzeTextWithAI } from '../utils/aiClient';

const SCAM_KEYWORDS = {
  'OTP / Bank': ['otp', 'one time password', 'bank account', 'your account', 'kyc', 'pan card', 'aadhaar', 'debit card', 'credit card', 'net banking', 'atm pin', 'cvv', 'account blocked', 'account suspended'],
  'UPI / Payment': ['upi', 'phonepe', 'gpay', 'paytm', 'payment failed', 'payment link', 'add money', 'wallet', 'cashback', 'refund pending', 'transaction failed'],
  'Urgency': ['immediately', 'urgent', 'immediately', 'last chance', 'limited time', 'act now', 'expire', 'suspended', 'blocked', 'click now', 'verify now', 'within 24 hours', 'within 48 hours'],
  'Prize / Reward': ['congratulations', 'you have won', 'prize', 'reward', 'lucky winner', 'gift card', 'free', 'claim now', 'lottery', 'selected', 'bonus'],
  'Job Scam': ['work from home', 'earn daily', 'part time job', 'earn ₹', 'earn rs', 'make money', 'per day income', 'whatsapp group', 'investment plan', 'high returns'],
  'Phishing Links': ['click here', 'visit link', 'open link', 'http://', 'bit.ly', 'tinyurl', '.xyz', '.top', '.click'],
};

const EXAMPLE_SMS = [
  `Dear Customer, your HDFC account will be BLOCKED. Update KYC immediately. Click: http://hdfc-kyc.xyz/update`,
  `CONGRATULATIONS! You've won ₹50,000 cashback on your UPI transaction. Claim within 24hrs: bit.ly/claim50k`,
  `Work from home & earn ₹5000/day. Just join our WhatsApp group and follow simple tasks. DM now!`,
  `[IRCTC] Your PNR 1234567890 is confirmed. Train departs 08:45. Platform 3. Have a safe journey!`,
  `OTP for SBI banking login is 847392. Valid for 10 mins. Never share OTP with anyone. -SBI`,
];

function analyzeSMS(text) {
  const lower = text.toLowerCase();
  const found = [];
  let score = 0;

  for (const [category, keywords] of Object.entries(SCAM_KEYWORDS)) {
    const hits = keywords.filter(k => lower.includes(k));
    if (hits.length > 0) {
      found.push({ category, hits: hits.slice(0, 3), count: hits.length });
      score += hits.length * (category === 'Urgency' || category === 'Phishing Links' ? 18 : category === 'OTP / Bank' || category === 'UPI / Payment' ? 15 : 10);
    }
  }

  const phoneMatches = text.match(/\b[6-9]\d{9}\b/g);
  if (phoneMatches) {
    score += 8;
    found.push({ category: 'Phone Number', hits: phoneMatches.slice(0, 2), count: phoneMatches.length });
  }

  const urlMatches = text.match(/https?:\/\/\S+/g);
  if (urlMatches) {
    const suspUrls = urlMatches.filter(u => !u.includes('irctc.co.in') && !u.includes('sbi.co.in') && !u.includes('hdfc.com'));
    if (suspUrls.length > 0) score += 20;
  }

  if (text.length < 200 && found.length >= 3) score += 10;

  const clamped = Math.min(score, 100);
  let verdict, color, icon;
  if (clamped >= 50) { verdict = 'malicious'; color = 'danger'; icon = '🚨'; }
  else if (clamped >= 25) { verdict = 'suspicious'; color = 'suspicious'; icon = '⚠️'; }
  else { verdict = 'safe'; color = 'safe'; icon = '✅'; }

  return { score: clamped, verdict, color, icon, found };
}

export default function SMSDetector({ addPoints, addToast }) {
  const { t } = useTranslation();
  const [sms, setSms] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [result, setResult] = useState(null);

  const handleAnalyze = async () => {
    if (!sms.trim()) return;
    setAnalyzing(true);
    setResult(null);
    setProgressMsg(t('sms.detecting'));
    
    const ruleRes = analyzeSMS(sms);
    setProgressMsg(t('scanner.progress.ai'));
    
    try {
      const aiResponse = await fetch('http://localhost:5000/api/ai/analyze-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: sms })
      });

      if (!aiResponse.ok) throw new Error('AI Server offline');
      const aiRes = await aiResponse.json();

      const finalScore = Math.max(ruleRes.score, aiRes.score);
      const aiIndicator = { 
        category: 'AI Security Analysis', 
        hits: [`${aiRes.reason} (Recommendation: ${aiRes.action})`], 
        count: 1 
      };

      const clamped = Math.min(finalScore, 100);
      const vKey = clamped >= 50 ? 'malicious' : clamped >= 25 ? 'suspicious' : 'safe';
      const color = clamped >= 50 ? 'danger' : clamped >= 25 ? 'suspicious' : 'safe';
      const icon = clamped >= 50 ? '🚨' : clamped >= 25 ? '⚠️' : '✅';

      const finalResult = {
        score: clamped,
        verdict: t(`scanner.verdict.${vKey}`),
        color,
        icon,
        found: [aiIndicator, ...ruleRes.found]
      };

      setResult(finalResult);
      addPoints(20);
      addToast(`${t('sms.detecting')} ${finalResult.verdict}! +20 pts`, finalResult.color === 'safe' ? 'success' : 'error', finalResult.icon);
    } catch (err) {
      console.warn('Backend AI failed, falling back to local analysis:', err.message);
      const vKey = ruleRes.score >= 50 ? 'malicious' : ruleRes.score >= 25 ? 'suspicious' : 'safe';
      const localizedVerdict = t(`scanner.verdict.${vKey}`);
      const fallbackResult = { ...ruleRes, verdict: localizedVerdict };
      setResult(fallbackResult);
      addPoints(10);
      addToast(`${t('sms.detecting')} ${localizedVerdict}!`, ruleRes.color === 'safe' ? 'success' : 'error', ruleRes.icon);
    }
    setAnalyzing(false);
    setProgressMsg('');
  };

  const scoreColor = result?.color === 'safe' ? 'var(--color-green)' : result?.color === 'suspicious' ? 'var(--color-warning)' : 'var(--color-danger)';
  const meterClass = result?.color === 'safe' ? 'meter-safe' : result?.color === 'suspicious' ? 'meter-warning' : 'meter-danger';

  return (
    <div>
      <div className="page-header container">
        <span className="tag" style={{ background: 'var(--color-saffron-dim)', borderColor: 'var(--border-glow-saffron)', color: 'var(--color-saffron)' }}>📱 {t('sms.title')}</span>
        <h1>{t('sms.subtitle').split(' ')[0]} <span className="gradient-text">{t('sms.subtitle').split(' ').slice(1).join(' ')}</span></h1>
        <p>{t('scanner.description')}</p>
      </div>

      <div className="container section-sm" style={{ maxWidth: 800 }}>
        <div className="card">
          <div className="form-group">
            <label className="form-label">{t('sms.placeholder')}</label>
            <textarea className="form-input form-textarea" style={{ minHeight: 140 }} value={sms} onChange={e => setSms(e.target.value)} placeholder={t('sms.placeholder')} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <span className="text-muted text-xs">{sms.length} characters</span>
              <button className="btn btn-primary" onClick={handleAnalyze} disabled={analyzing || !sms.trim()}>
                {analyzing ? <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />{t('sms.detecting')}</> : `📱 ${t('sms.analyze')}`}
              </button>
            </div>
          </div>

          <div style={{ marginTop: 14 }}>
            <p className="text-muted text-xs" style={{ marginBottom: 8 }}>{t('sms.examples')}:</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {EXAMPLE_SMS.map((s, i) => (
                <button key={i} className="btn btn-secondary btn-sm" style={{ fontSize: '0.76rem' }} onClick={() => setSms(s)}>
                  {t('common.retry')} {i + 1}
                </button>
              ))}
            </div>
          </div>
        </div>

        {analyzing && (
          <div className="card" style={{ marginTop: 16, textAlign: 'center', padding: '32px 24px' }}>
            <div className="animate-pulse" style={{ fontSize: '2.5rem', marginBottom: 12 }}>🤖</div>
            <p className="text-secondary font-mono text-sm">{progressMsg}</p>
          </div>
        )}

        {result && (
          <div className={`result-panel result-${result.color}`} style={{ marginTop: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
              <span style={{ fontSize: '3rem' }}>{result.icon}</span>
              <div>
                <div className="result-title" style={{ color: scoreColor }}>{result.verdict}</div>
                <div className="text-secondary text-sm">{t('sms.result')}: <strong style={{ color: scoreColor }}>{result.score}/100</strong></div>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span className="text-sm font-bold">{t('scanner.score')}</span>
                <span className="text-sm" style={{ color: scoreColor }}>{result.score}%</span>
              </div>
              <div className="meter-track">
                <div className={`meter-fill ${meterClass}`} style={{ width: `${result.score}%` }} />
              </div>
            </div>

            {result.found.length > 0 ? (
              <>
                <h4 style={{ fontWeight: 700, marginBottom: 12, fontSize: '0.9rem' }}>🔎 Detected Indicators</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {result.found.map((f, i) => (
                    <div key={i} className="result-item">
                      <span className="result-item-icon">🚩</span>
                      <div>
                        <span className="font-bold text-sm text-danger">{f.category}: </span>
                        <span className="text-secondary text-sm">{f.hits.join(', ')}</span>
                        {f.count > 3 && <span className="text-muted text-xs"> +{f.count - 3} more</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="result-item">
                <span>✅</span>
                <span className="text-green text-sm">{t('scanner.verdict.safe')}</span>
              </div>
            )}

            <div className="divider" />
            <div style={{ padding: '14px 16px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)', borderLeft: `3px solid ${scoreColor}` }}>
              <p className="text-sm text-secondary">
                {result.color === 'danger' ? '🚨 DO NOT reply, click any links, or share personal info. Report to CERT-In or cybercrime.gov.in' :
                 result.color === 'suspicious' ? '⚠️ Be cautious. Verify through official channels before taking any action.' :
                 '✅ This message appears safe, but always remain vigilant about sharing sensitive information.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
