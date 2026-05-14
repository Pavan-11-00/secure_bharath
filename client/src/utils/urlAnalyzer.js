// URL Analyzer - Rule-based + heuristic threat detection

const SUSPICIOUS_KEYWORDS = [
  'free', 'prize', 'winner', 'claim', 'reward', 'lucky', 'selected',
  'verify', 'confirm', 'update', 'urgent', 'suspended', 'blocked',
  'login', 'signin', 'secure', 'account', 'bank', 'payment',
  'kyc', 'upi', 'otp', 'aadhar', 'aadhaar', 'pan', 'ifsc',
  'refund', 'cashback', 'offer', 'limited', 'expires', 'wallet',
  'recharge', 'loan', 'emi', 'insurance', 'invest'
];

const MALICIOUS_KEYWORDS = [
  'phishing', 'scam', 'hack', 'malware', 'ransomware',
  'fake', 'fraud', 'cheat', 'exploit', 'steal'
];

const URL_SHORTENERS = [
  'bit.ly', 'tinyurl', 't.co', 'goo.gl', 'ow.ly', 'short.io',
  'rb.gy', 'cutt.ly', 'tiny.cc', 'is.gd', 'v.gd', 'clck.ru',
  'wp.me', 'buff.ly', 'ift.tt', 'dlvr.it', 'adf.ly', 'shorte.st',
  'linktr.ee', 'rebrand.ly', 'bl.ink', 'snip.ly'
];

const SUSPICIOUS_TLDS = [
  '.xyz', '.top', '.club', '.online', '.site', '.icu',
  '.tk', '.ml', '.ga', '.cf', '.gq', '.pw', '.cc', '.ws',
  '.info', '.biz', '.link', '.click', '.download', '.zip',
  '.review', '.country', '.kim', '.science', '.work', '.party'
];

const TRUSTED_DOMAINS = [
  'google.com', 'github.com', 'microsoft.com', 'apple.com',
  'amazon.com', 'sbi.co.in', 'hdfcbank.com', 'icicibank.com',
  'axisbank.com', 'paytm.com', 'phonepe.com', 'npci.org.in',
  'gov.in', 'nic.in', 'india.gov.in', 'cert-in.org.in',
  'incometax.gov.in', 'uidai.gov.in', 'mha.gov.in', 'rbi.org.in',
  'irctc.co.in', 'digilocker.gov.in', 'onlinesbi.sbi'
];

// Expanded typosquatting / lookalike patterns
const LOOKALIKE_PATTERNS = [
  'paypa1', 'g00gle', 'arnazon', 'amaz0n', 'faceb00k', 'facebok',
  'micros0ft', 'sb1', 'hdfcbonk', 'hdfcbamk', 'icicibamk',
  'paytm-', '-paytm', 'sbi-', '-sbi', 'hdfc-', '-hdfc',
  'phonepe-', '-phonepe', 'gpay-', 'googlepay-',
  'rbi-', 'incometax-', 'uidai-', 'gov-in', 'india-gov'
];

// Unicode homograph characters mapped to ASCII lookalikes
const HOMOGRAPH_CHARS = /[àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]/i;

export function analyzeURL(url) {
  const result = { url, score: 0, status: 'safe', indicators: [], details: {} };
  let riskScore = 0;
  const indicators = [];

  try {
    let normalizedUrl = url.trim().toLowerCase();
    if (!normalizedUrl.startsWith('http')) normalizedUrl = 'https://' + normalizedUrl;

    let urlObj;
    try {
      urlObj = new URL(normalizedUrl);
    } catch {
      indicators.push({ type: 'error', text: 'Invalid URL structure', severity: 'malicious' });
      result.score = 70;
      result.status = 'suspicious';
      result.indicators = indicators;
      return result;
    }

    const hostname = urlObj.hostname;
    const fullUrl = normalizedUrl;
    const protocol = urlObj.protocol;
    const subdCount = hostname.split('.').length - 2;

    // Trusted domain check — only reduces score if NO other major red flags
    const isTrusted = TRUSTED_DOMAINS.some(d => hostname === d || hostname.endsWith('.' + d));
    if (isTrusted) {
      indicators.push({ type: 'safe', text: `Trusted domain: ${hostname}`, severity: 'safe' });
      // Don't subtract — just note it; other signals may still make it risky
    }

    // HTTP
    if (protocol === 'http:') {
      riskScore += 20;
      indicators.push({ type: 'warning', text: 'Unencrypted HTTP connection (no HTTPS)', severity: 'suspicious' });
    } else {
      indicators.push({ type: 'safe', text: 'Secure HTTPS connection', severity: 'safe' });
    }

    // URL shortener
    if (URL_SHORTENERS.some(s => hostname.includes(s))) {
      riskScore += 30;
      indicators.push({ type: 'warning', text: `URL shortener detected: ${hostname}`, severity: 'malicious' });
    }

    // Suspicious TLD
    if (SUSPICIOUS_TLDS.some(tld => hostname.endsWith(tld))) {
      riskScore += 25;
      indicators.push({ type: 'warning', text: `Suspicious top-level domain`, severity: 'suspicious' });
    }

    // Long URL
    if (fullUrl.length > 100) {
      riskScore += 15;
      indicators.push({ type: 'warning', text: `Abnormally long URL (${fullUrl.length} chars)`, severity: 'suspicious' });
    }

    // IP address as hostname
    if (/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) {
      riskScore += 40;
      indicators.push({ type: 'danger', text: 'IP address used instead of domain name', severity: 'malicious' });
    }

    // Excessive subdomains
    if (subdCount > 2) {
      riskScore += 15;
      indicators.push({ type: 'warning', text: `Excessive subdomains (${subdCount})`, severity: 'suspicious' });
    }

    // Lookalike / typosquatting
    if (LOOKALIKE_PATTERNS.some(l => hostname.includes(l))) {
      riskScore += 50;
      indicators.push({ type: 'danger', text: 'Possible lookalike/typosquatting domain', severity: 'malicious' });
    }

    // Homograph attack (unicode chars in domain)
    if (HOMOGRAPH_CHARS.test(hostname)) {
      riskScore += 45;
      indicators.push({ type: 'danger', text: 'Unicode homograph characters detected in domain', severity: 'malicious' });
    }

    // Brand name in subdomain but not as root domain (e.g. sbi.fraud.com)
    const trustedBrands = ['sbi', 'hdfc', 'icici', 'paytm', 'phonepe', 'rbi', 'uidai', 'npci', 'irctc'];
    const rootDomain = hostname.split('.').slice(-2).join('.');
    const brandInSubdomain = trustedBrands.some(b =>
      hostname.includes(b) && !TRUSTED_DOMAINS.some(d => rootDomain === d || rootDomain.endsWith('.' + d))
    );
    if (brandInSubdomain) {
      riskScore += 40;
      indicators.push({ type: 'danger', text: `Trusted brand name used in suspicious domain`, severity: 'malicious' });
    }

    // Suspicious keywords in URL
    const foundSuspicious = SUSPICIOUS_KEYWORDS.filter(kw => fullUrl.includes(kw));
    if (foundSuspicious.length > 0) {
      riskScore += foundSuspicious.length * 8;
      indicators.push({
        type: 'warning',
        text: `Suspicious keywords: ${foundSuspicious.slice(0, 3).join(', ')}`,
        severity: foundSuspicious.length >= 3 ? 'malicious' : 'suspicious'
      });
    }

    // Malicious keywords
    if (MALICIOUS_KEYWORDS.some(kw => fullUrl.includes(kw))) {
      riskScore += 40;
      indicators.push({ type: 'danger', text: 'Malicious pattern detected in URL', severity: 'malicious' });
    }

    // Excessive special characters
    const specialChars = (fullUrl.match(/[@%&=~]/g) || []).length;
    if (specialChars > 5) {
      riskScore += 15;
      indicators.push({ type: 'warning', text: `Excessive special characters (${specialChars})`, severity: 'suspicious' });
    }

    // Sensitive data in query params
    if (/[?&](token|otp|password|pin|cvv|card)=/i.test(urlObj.search)) {
      riskScore += 30;
      indicators.push({ type: 'danger', text: 'Sensitive data exposed in URL parameters', severity: 'malicious' });
    }

    // Trusted domain bonus — only apply if score is still low (genuinely safe)
    if (isTrusted && riskScore < 20) riskScore = Math.max(0, riskScore - 20);

    riskScore = Math.max(0, Math.min(100, riskScore));
    result.score = riskScore;
    result.status = riskScore >= 60 ? 'malicious' : riskScore >= 30 ? 'suspicious' : 'safe';
    result.indicators = indicators;
    result.details = { hostname, protocol, length: fullUrl.length, subdomains: subdCount };

  } catch (err) {
    result.score = 50;
    result.status = 'suspicious';
    result.indicators = [{ type: 'error', text: 'Could not analyze URL', severity: 'suspicious' }];
  }

  return result;
}
