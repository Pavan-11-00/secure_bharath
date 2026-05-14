// SMS Scam Detector - keyword + heuristic analysis
// Targets Indian cybercrime patterns: UPI fraud, OTP phishing, fake jobs

const HIGH_RISK_KEYWORDS = [
  { word: 'otp', weight: 25 }, { word: 'aadhar', weight: 20 },
  { word: 'aadhaar', weight: 20 }, { word: 'pan card', weight: 20 },
  { word: 'kyc', weight: 20 }, { word: 'upi pin', weight: 30 },
  { word: 'atm pin', weight: 35 }, { word: 'cvv', weight: 35 },
  { word: 'password', weight: 25 }, { word: 'click here', weight: 15 },
  { word: 'bit.ly', weight: 30 }, { word: 'tinyurl', weight: 25 },
  { word: 'suspended', weight: 20 }, { word: 'blocked', weight: 20 },
  { word: 'urgent', weight: 15 }, { word: 'immediately', weight: 15 },
  { word: 'verify account', weight: 25 }, { word: 'update details', weight: 20 },
  { word: 'won', weight: 15 }, { word: 'winner', weight: 20 },
  { word: 'prize', weight: 20 }, { word: 'lottery', weight: 25 },
  { word: 'free gift', weight: 20 }, { word: 'cashback', weight: 10 },
  { word: 'job offer', weight: 10 }, { word: 'work from home', weight: 12 },
  { word: 'earn', weight: 8 }, { word: 'per day', weight: 10 },
  { word: 'investment', weight: 8 }, { word: 'double your money', weight: 30 },
  { word: 'guaranteed', weight: 12 }, { word: 'govt approved', weight: 15 },
  { word: 'pm modi', weight: 20 }, { word: 'rbi approved', weight: 20 },
  { word: 'sbi', weight: 8 }, { word: 'hdfc', weight: 8 },
  { word: 'icici bank', weight: 12 }, { word: 'refund', weight: 10 },
  { word: 'tax refund', weight: 15 }, { word: 'income tax', weight: 10 },
  // Hindi / Hinglish scam terms
  { word: 'inaam', weight: 20 }, { word: 'inam', weight: 20 },
  { word: 'jeet', weight: 15 }, { word: 'jeeto', weight: 18 },
  { word: 'paisa', weight: 10 }, { word: 'paise', weight: 10 },
  { word: 'khata', weight: 12 }, { word: 'khata band', weight: 30 },
  { word: 'link par click', weight: 35 }, { word: 'abhi click', weight: 25 },
  { word: 'turant', weight: 18 }, { word: 'jaldi', weight: 12 },
  { word: 'free recharge', weight: 22 }, { word: 'sim band', weight: 28 },
  { word: 'number band', weight: 28 }, { word: 'police case', weight: 25 },
  { word: 'arrest', weight: 30 }, { word: 'cyber crime', weight: 20 },
  { word: 'loan approved', weight: 22 }, { word: 'loan offer', weight: 15 },
  { word: 'emi', weight: 8 }, { word: 'processing fee', weight: 20 },
  { word: 'registration fee', weight: 20 }, { word: 'advance fee', weight: 25 }
];

const SAFE_INDICATORS = [
  'your order', 'has been shipped', 'delivery', 'appointment',
  'otp is', 'verification code', 'do not share', 'never share',
  'transaction id', 'booking confirmed', 'your otp for', 'use this otp'
];

const HIGH_RISK_PHRASES = [
  { phrase: 'send your otp', weight: 50 },
  { phrase: 'share your otp', weight: 50 },
  { phrase: 'enter your pin', weight: 45 },
  { phrase: 'account will be blocked', weight: 40 },
  { phrase: 'kyc not completed', weight: 35 },
  { phrase: 'click to verify', weight: 30 },
  { phrase: 'claim your reward', weight: 28 },
  { phrase: 'you have won', weight: 30 },
  { phrase: 'call immediately', weight: 25 },
  { phrase: 'limited time offer', weight: 18 },
  { phrase: 'update your kyc', weight: 32 },
  { phrase: 'aadhar link', weight: 28 },
  { phrase: 'upi id verify', weight: 35 },
  { phrase: 'send money', weight: 22 },
  { phrase: 'transfer now', weight: 25 },
  { phrase: 'your account is at risk', weight: 40 },
  { phrase: 'confirm your details', weight: 28 },
  { phrase: 'verify your identity', weight: 25 },
  { phrase: 'click the link below', weight: 22 },
  { phrase: 'apna otp share karo', weight: 55 },
  { phrase: 'apna pin batao', weight: 50 },
  { phrase: 'account block ho jayega', weight: 42 }
];

export function analyzeSMS(text) {
  if (!text || text.trim().length < 5) {
    return {
      score: 0, status: 'safe', riskLevel: 'Low',
      highlights: [], detectedKeywords: [], summary: 'No content to analyze.'
    };
  }

  const lower = text.toLowerCase();
  let riskScore = 0;
  const detectedKeywords = [];
  const highlights = [];
  // Track matched ranges to avoid double-counting overlapping matches
  const matchedRanges = [];

  const overlaps = (start, end) =>
    matchedRanges.some(([s, e]) => start < e && end > s);

  // Check safe indicators first
  const safeCount = SAFE_INDICATORS.filter(s => lower.includes(s)).length;
  if (safeCount > 0) riskScore -= safeCount * 10;

  // High-risk phrases (multi-word, checked first to prevent keyword double-count)
  HIGH_RISK_PHRASES.forEach(({ phrase, weight }) => {
    let idx = lower.indexOf(phrase);
    while (idx !== -1) {
      if (!overlaps(idx, idx + phrase.length)) {
        matchedRanges.push([idx, idx + phrase.length]);
        riskScore += weight;
        highlights.push({ text: phrase, severity: 'malicious' });
        detectedKeywords.push({ keyword: phrase, weight, type: 'phrase' });
      }
      idx = lower.indexOf(phrase, idx + 1);
    }
  });

  // Individual keywords — skip if already covered by a phrase match
  HIGH_RISK_KEYWORDS.forEach(({ word, weight }) => {
    let idx = lower.indexOf(word);
    while (idx !== -1) {
      if (!overlaps(idx, idx + word.length)) {
        matchedRanges.push([idx, idx + word.length]);
        riskScore += weight;
        highlights.push({ text: word, severity: weight >= 25 ? 'malicious' : 'suspicious' });
        detectedKeywords.push({ keyword: word, weight, type: 'keyword' });
      }
      idx = lower.indexOf(word, idx + 1);
    }
  });

  // URL detection
  const urlRegex = /https?:\/\/[^\s]+|www\.[^\s]+|bit\.ly\/[^\s]+/gi;
  const urls = text.match(urlRegex) || [];
  if (urls.length > 0) {
    riskScore += 20 * urls.length;
    highlights.push({ text: urls[0], severity: 'malicious' });
    detectedKeywords.push({ keyword: `URL detected: ${urls[0].substring(0, 30)}...`, weight: 20, type: 'url' });
  }

  // Phone number in suspicious context
  const phoneRegex = /(\+91|0)?[6-9]\d{9}/g;
  const phones = text.match(phoneRegex) || [];
  if (phones.length > 0 && riskScore > 20) {
    riskScore += 10;
    detectedKeywords.push({ keyword: 'Phone number in suspicious context', weight: 10, type: 'phone' });
  }

  // Excessive caps (urgency tactic)
  const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length;
  if (capsRatio > 0.4 && text.length > 20) {
    riskScore += 15;
    detectedKeywords.push({ keyword: 'Excessive capital letters (urgency tactic)', weight: 15, type: 'style' });
  }

  riskScore = Math.max(0, Math.min(100, riskScore));

  let status, riskLevel;
  if (riskScore >= 60) { status = 'malicious'; riskLevel = 'Critical'; }
  else if (riskScore >= 35) { status = 'suspicious'; riskLevel = 'High'; }
  else if (riskScore >= 15) { status = 'suspicious'; riskLevel = 'Medium'; }
  else { status = 'safe'; riskLevel = 'Low'; }

  // Build highlighted HTML — sort by length desc to avoid partial replacements
  let highlightedText = text;
  [...detectedKeywords]
    .filter(k => k.type !== 'url' && k.type !== 'phone' && k.type !== 'style')
    .sort((a, b) => b.keyword.length - a.keyword.length)
    .forEach(({ keyword, weight }) => {
      const cls = weight >= 25 ? 'keyword-highlight' : 'keyword-warn';
      const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      highlightedText = highlightedText.replace(regex, `<span class="${cls}">$1</span>`);
    });

  let summary;
  if (status === 'safe') summary = 'This message appears legitimate. No major scam indicators detected.';
  else if (riskLevel === 'Medium') summary = 'Some suspicious patterns detected. Exercise caution before clicking any links.';
  else if (riskLevel === 'High') summary = 'High risk! Multiple scam indicators found. Do NOT share any personal information.';
  else summary = '⚠️ CRITICAL SCAM ALERT! This message uses classic fraud tactics. Delete immediately and report.';

  return { score: riskScore, status, riskLevel, highlights, detectedKeywords, highlightedText, summary, urlsFound: urls };
}
