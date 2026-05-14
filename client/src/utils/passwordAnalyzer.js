// Password Strength Analyzer
// Checks entropy, complexity, common patterns

const COMMON_PASSWORDS = [
  '123456', 'password', '12345678', 'admin', 'qwerty', 'abc123',
  '111111', 'welcome', 'letmein', 'monkey', 'dragon', 'master',
  'sunshine', 'princess', 'shadow', 'password1', 'iloveyou',
  'india123', '1234567890', 'pass123', 'test123', 'bharat123'
];

const KEYBOARD_PATTERNS = ['qwerty', 'asdfgh', 'zxcvbn', '123456', 'qweasd'];

export function analyzePassword(password) {
  if (!password) return defaultResult();

  const len = password.length;
  let score = 0;
  const suggestions = [];
  const checks = {
    length: len >= 12,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    digits: /[0-9]/.test(password),
    special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]/.test(password),
    noCommon: !COMMON_PASSWORDS.includes(password.toLowerCase()),
    noKeyboard: !KEYBOARD_PATTERNS.some(p => password.toLowerCase().includes(p)),
    noRepeat: !/(.)\1{2,}/.test(password),
    longEnough: len >= 8
  };

  // Scoring
  if (len >= 8) score += 10;
  if (len >= 12) score += 15;
  if (len >= 16) score += 10;
  if (checks.lowercase) score += 10;
  if (checks.uppercase) score += 15;
  if (checks.digits) score += 10;
  if (checks.special) score += 20;
  if (checks.noCommon) score += 10;
  if (checks.noKeyboard) score += 5;
  if (checks.noRepeat) score += 5;

  // Entropy calculation (bits)
  let charsetSize = 0;
  if (checks.lowercase) charsetSize += 26;
  if (checks.uppercase) charsetSize += 26;
  if (checks.digits) charsetSize += 10;
  if (checks.special) charsetSize += 32;
  const entropy = charsetSize > 0 ? Math.floor(len * Math.log2(charsetSize)) : 0;

  // Suggestions
  if (len < 8) suggestions.push('Use at least 8 characters');
  if (len < 12) suggestions.push('Increase to 12+ characters for better security');
  if (!checks.uppercase) suggestions.push('Add uppercase letters (A-Z)');
  if (!checks.lowercase) suggestions.push('Add lowercase letters (a-z)');
  if (!checks.digits) suggestions.push('Include numbers (0-9)');
  if (!checks.special) suggestions.push('Add special characters (!@#$%^&*)');
  if (!checks.noCommon) suggestions.push('Avoid common passwords and dictionary words');
  if (!checks.noKeyboard) suggestions.push('Avoid keyboard patterns like "qwerty"');
  if (!checks.noRepeat) suggestions.push('Avoid repeated characters (aaa, 111)');

  score = Math.min(100, score);

  let strength, color, label;
  if (score < 25) { strength = 'Very Weak'; color = '#ff1744'; label = 'danger'; }
  else if (score < 45) { strength = 'Weak'; color = '#ff4757'; label = 'poor'; }
  else if (score < 60) { strength = 'Fair'; color = '#ffab00'; label = 'fair'; }
  else if (score < 80) { strength = 'Strong'; color = '#00b0ff'; label = 'good'; }
  else { strength = 'Very Strong'; color = '#00e676'; label = 'excellent'; }

  const crackTime = estimateCrackTime(entropy);

  return { score, strength, color, label, entropy, checks, suggestions, crackTime };
}

function estimateCrackTime(entropy) {
  // Estimates assuming 1 billion guesses/second (modern GPU)
  const combinations = Math.pow(2, entropy);
  const secondsTocrack = combinations / 1e9 / 2; // average case

  if (secondsTocrack < 1) return 'Instantly';
  if (secondsTocrack < 60) return `${Math.round(secondsTocrack)} seconds`;
  if (secondsTocrack < 3600) return `${Math.round(secondsTocrack / 60)} minutes`;
  if (secondsTocrack < 86400) return `${Math.round(secondsTocrack / 3600)} hours`;
  if (secondsTocrack < 2592000) return `${Math.round(secondsTocrack / 86400)} days`;
  if (secondsTocrack < 31536000) return `${Math.round(secondsTocrack / 2592000)} months`;
  if (secondsTocrack < 3153600000) return `${Math.round(secondsTocrack / 31536000)} years`;
  return `${(secondsTocrack / 3153600000).toFixed(1)} centuries`;
}

function defaultResult() {
  return {
    score: 0, strength: 'None', color: '#4a5568', label: 'none',
    entropy: 0, checks: {}, suggestions: ['Start typing your password to analyze'],
    crackTime: '—'
  };
}
