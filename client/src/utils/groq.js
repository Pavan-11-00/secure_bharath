// AI Question Generator - Gemini (primary) + Groq (fallback) + Local bank (last resort)
// Anti-repeat: tracks recently asked topics and questions per session

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Domain-based topics for each level
const LEVEL_DOMAINS = {
  phishing: {
    name: 'Phishing & Email Security',
    topics: [
      'email phishing red flags', 'spear phishing targeting executives', 'whaling attack on CFO',
      'clone phishing with modified attachments', 'pharming via DNS poisoning', 'fake login page detection',
      'URL spoofing techniques', 'homograph attacks using unicode', 'email header analysis',
      'DMARC and SPF records', 'business email compromise', 'phishing kits on dark web',
      'social media phishing', 'QR code phishing (quishing)', 'voice phishing (vishing)',
      'calendar invite phishing', 'OAuth consent phishing', 'browser-in-the-browser attack',
    ],
  },
  password: {
    name: 'Password & Authentication',
    topics: [
      'password entropy and strength', 'brute force vs dictionary attacks', 'TOTP-based 2FA',
      'hardware security keys (FIDO2)', 'biometric authentication risks', 'password manager benefits',
      'credential stuffing attacks', 'rainbow table attacks', 'salting and hashing passwords',
      'passkey (WebAuthn) technology', 'single sign-on security', 'multi-factor authentication bypass',
      'session hijacking via cookies', 'keylogger detection', 'shoulder surfing prevention',
      'password reuse dangers', 'bcrypt vs SHA-256 for passwords', 'account lockout policies',
    ],
  },
  sms: {
    name: 'SMS & OTP Scams',
    topics: [
      'smishing attack patterns', 'OTP interception methods', 'SIM swapping fraud process',
      'vishing social engineering', 'missed call scam tactics', 'WhatsApp account takeover',
      'Telegram bot scams', 'fake delivery SMS links', 'bank impersonation SMS',
      'premium rate SMS fraud', 'RCS message spoofing', 'call forwarding hijack (*401#)',
      'fake KYC verification calls', 'remote access app scams (AnyDesk)', 'TRAI DND registration',
      'flash SMS attacks', 'SS7 protocol vulnerability', 'number spoofing technology',
    ],
  },
  upi: {
    name: 'UPI & Banking Fraud',
    topics: [
      'UPI collect request scam', 'QR code payment fraud', 'fake banking app detection',
      'card skimming at ATMs', 'juice jacking via public USB', 'fake KYC update fraud',
      'loan app harassment and data theft', 'digital arrest scam', 'refund initiation fraud',
      'screen sharing fraud', 'mule account operations', 'RBI ombudsman complaints',
      'tokenization of card details', 'virtual credit card safety', 'NPCI dispute resolution',
      'fake cashback offers', 'investment/crypto fraud', 'task-based earning scam',
    ],
  },
  network: {
    name: 'Network & Advanced Security',
    topics: [
      'man-in-the-middle on public WiFi', 'DNS spoofing and cache poisoning', 'ransomware families (WannaCry, LockBit)',
      'zero-day exploit marketplace', 'supply chain attack (SolarWinds style)', 'honeypot deployment',
      'DDoS attack mitigation', 'SQL injection prevention', 'cross-site scripting (XSS)',
      'VPN tunneling and encryption', 'TLS certificate verification', 'firewall rules and configuration',
      'CERT-In incident reporting (6hr rule)', 'digital forensics basics', 'threat intelligence platforms',
      'sandboxing malware analysis', 'intrusion detection systems', 'bug bounty programs in India',
    ],
  },
};

// Session anti-repeat tracking
const sessionHistory = {
  usedTopics: {},   // { domain: Set<topicIndex> }
  recentQuestions: new Set(), // hashes of recent questions
};

function pickRandomTopic(domain) {
  const topics = LEVEL_DOMAINS[domain]?.topics || ['cybersecurity'];
  if (!sessionHistory.usedTopics[domain]) sessionHistory.usedTopics[domain] = new Set();

  // Reset if all topics used
  if (sessionHistory.usedTopics[domain].size >= topics.length) {
    sessionHistory.usedTopics[domain].clear();
  }

  let idx;
  let attempts = 0;
  do {
    idx = Math.floor(Math.random() * topics.length);
    attempts++;
  } while (sessionHistory.usedTopics[domain].has(idx) && attempts < topics.length * 2);

  sessionHistory.usedTopics[domain].add(idx);
  return topics[idx];
}

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return hash.toString();
}

function isDuplicate(question) {
  const hash = simpleHash(question.question);
  if (sessionHistory.recentQuestions.has(hash)) return true;
  sessionHistory.recentQuestions.add(hash);
  // Keep only last 50 questions in memory
  if (sessionHistory.recentQuestions.size > 50) {
    const first = sessionHistory.recentQuestions.values().next().value;
    sessionHistory.recentQuestions.delete(first);
  }
  return false;
}

function buildPrompt(domain, topicHint) {
  const randomSeed = Math.random().toString(36).substring(2, 8);
  return `Generate a UNIQUE cybersecurity multiple-choice quiz question.
Domain: ${LEVEL_DOMAINS[domain]?.name || domain}
Specific topic: ${topicHint}
Seed: ${randomSeed}
Context: Make it relevant to Indian users. Reference real Indian services (HDFC, SBI, IRCTC, UPI, Aadhaar, PhonePe, Paytm, GPay, Jio, Airtel) where appropriate.

Return ONLY valid JSON, no markdown fences, no extra text:
{"question":"...","options":[{"text":"...","correct":false},{"text":"...","correct":true},{"text":"...","correct":false},{"text":"...","correct":false}],"explanation":"..."}

Rules:
- Exactly 4 options, exactly 1 correct
- The question must be specifically about: ${topicHint}
- Explanation must be educational (2-3 sentences)
- Do NOT repeat common generic questions — make it creative and scenario-based
- Randomize the position of the correct answer`;
}

function parseAIResponse(raw) {
  // Strip markdown code fences if present
  let cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    const parsed = JSON.parse(jsonMatch[0]);
    if (!parsed.question || !Array.isArray(parsed.options) || parsed.options.length !== 4) return null;
    const correctCount = parsed.options.filter(o => o.correct).length;
    if (correctCount !== 1) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function tryGemini(domain) {
  if (!GEMINI_API_KEY) return null;
  const topic = pickRandomTopic(domain);
  console.log(`[Gemini] Generating question for domain="${domain}", topic="${topic}"`);
  try {
    const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildPrompt(domain, topic) }] }],
        generationConfig: { temperature: 1.0, maxOutputTokens: 800 },
      }),
    });
    if (!res.ok) { console.warn('Gemini HTTP error:', res.status); return null; }
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!text) return null;
    const q = parseAIResponse(text);
    if (q && !isDuplicate(q)) return q;
    return null;
  } catch (e) {
    console.warn('Gemini fetch error:', e.message);
    return null;
  }
}

async function tryGroq(domain) {
  if (!GROQ_API_KEY) return null;
  const topic = pickRandomTopic(domain);
  console.log(`[Groq] Generating question for domain="${domain}", topic="${topic}"`);
  try {
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: buildPrompt(domain, topic) }],
        temperature: 1.0, max_tokens: 800,
      }),
    });
    if (!res.ok) { console.warn('Groq HTTP error:', res.status); return null; }
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) return null;
    const q = parseAIResponse(text);
    if (q && !isDuplicate(q)) return q;
    return null;
  } catch (e) {
    console.warn('Groq fetch error:', e.message);
    return null;
  }
}

// Main export - tries AI first (with retry), falls back to local bank
export async function generateQuestion(domain = 'phishing') {
  // Try Groq first (primary - key is known to work)
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const q = await tryGroq(domain);
      if (q) { q._source = 'groq'; return q; }
    } catch (e) { console.warn(`Groq attempt ${attempt + 1} failed:`, e.message); }
  }

  // Try Gemini as fallback (only if a valid Gemini API key is configured)
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const q = await tryGemini(domain);
      if (q) { q._source = 'gemini'; return q; }
    } catch (e) { console.warn(`Gemini attempt ${attempt + 1} failed:`, e.message); }
  }

  // Local fallback
  console.warn('All AI providers failed, using fallback question bank');
  return getRandomFallback(domain);
}

// ─── LOCAL FALLBACK QUESTION BANK ───────────────────────────────
export const fallbackQuestions = {
  phishing: [
    { question: 'You receive an email from "support@sbi-banking.xyz" asking you to verify your account. What should you do?', options: [{ text: 'Click the link - it mentions SBI so it must be real', correct: false }, { text: 'Delete it - SBI uses sbi.co.in, not .xyz domains', correct: true }, { text: 'Reply with your account number to check', correct: false }, { text: 'Forward it to friends to warn them', correct: false }], explanation: 'SBI\'s official domain is sbi.co.in. Phishing emails use look-alike domains (.xyz, .co, .net) to trick users. Never click links in suspicious emails.' },
    { question: 'Which is a common sign of a phishing email?', options: [{ text: 'Personalized greeting with your full name', correct: false }, { text: 'Generic greeting like "Dear Customer" with urgent language', correct: true }, { text: 'Email from a known contact about a meeting', correct: false }, { text: 'A newsletter you subscribed to', correct: false }], explanation: 'Phishing emails use generic greetings and create urgency ("Account suspended!", "Act NOW!") to bypass critical thinking.' },
    { question: 'What is "spear phishing"?', options: [{ text: 'Mass emails sent to thousands of people', correct: false }, { text: 'Targeted attacks using personal info about the victim', correct: true }, { text: 'Phishing through SMS messages', correct: false }, { text: 'Phishing through phone calls', correct: false }], explanation: 'Spear phishing targets specific individuals using researched personal details (name, company, role) making it far more convincing than generic phishing.' },
    { question: 'You get an IRCTC email saying "Your ticket is confirmed. Download e-ticket: bit.ly/irctc-ticket". What\'s suspicious?', options: [{ text: 'IRCTC always sends tickets by email', correct: false }, { text: 'Shortened URL hides the real destination - could be malware', correct: true }, { text: 'The email looks professional so it\'s fine', correct: false }, { text: 'Nothing, this is normal', correct: false }], explanation: 'Shortened URLs (bit.ly, tinyurl) hide the real destination. IRCTC sends tickets from official domains with direct links, not URL shorteners.' },
    { question: 'What is a "clone phishing" attack?', options: [{ text: 'Creating a copy of a legitimate email but replacing links with malicious ones', correct: true }, { text: 'Cloning someone\'s SIM card', correct: false }, { text: 'Making an exact copy of a website', correct: false }, { text: 'Duplicating someone\'s Aadhaar card', correct: false }], explanation: 'Clone phishing takes a real email you\'ve received before and re-sends it with malicious links/attachments. It\'s effective because the content looks familiar.' },
    { question: 'An email claims your PhonePe account will be "permanently deleted in 24 hours" unless you click a link. This is likely:', options: [{ text: 'A real warning from PhonePe', correct: false }, { text: 'A phishing attempt using fear and urgency', correct: true }, { text: 'A system-generated reminder', correct: false }, { text: 'A legal notice from RBI', correct: false }], explanation: 'Creating artificial urgency is a core phishing tactic. Legitimate companies never threaten permanent deletion via email with a 24-hour deadline.' },
  ],
  password: [
    { question: 'Which password is the most secure?', options: [{ text: 'Mumbai@2024', correct: false }, { text: 'p@$$w0rd', correct: false }, { text: 'j7#Kq!mR9$vL2xP', correct: true }, { text: 'abcdefgh', correct: false }], explanation: 'Random combinations of uppercase, lowercase, numbers, and symbols are strongest. Dictionary words with simple substitutions (@ for a, 0 for o) are easily cracked.' },
    { question: 'What is a "brute force" attack?', options: [{ text: 'Physically breaking into a server room', correct: false }, { text: 'Systematically trying every possible password combination', correct: true }, { text: 'Guessing passwords based on personal info', correct: false }, { text: 'Stealing passwords from a database', correct: false }], explanation: 'Brute force attacks try every combination. An 8-character lowercase password has 200 billion combos, crackable in hours. Adding uppercase, numbers, symbols makes it exponentially harder.' },
    { question: 'Why should you NOT reuse passwords across sites?', options: [{ text: 'It\'s hard to remember them all', correct: false }, { text: 'If one site is breached, attackers try those credentials everywhere (credential stuffing)', correct: true }, { text: 'Websites don\'t allow duplicate passwords', correct: false }, { text: 'It slows down your browser', correct: false }], explanation: 'Credential stuffing uses leaked username-password pairs from one breach to attack other sites. If you reuse passwords, one breach compromises all your accounts.' },
    { question: 'What does two-factor authentication (2FA) protect against?', options: [{ text: 'Only phishing attacks', correct: false }, { text: 'Someone who has stolen your password but not your phone', correct: true }, { text: 'Viruses on your computer', correct: false }, { text: 'Slow internet connections', correct: false }], explanation: '2FA adds a second layer — even if your password is stolen, the attacker needs your phone/authenticator to log in. It stops 99% of automated attacks.' },
    { question: 'Which is the safest way to store passwords?', options: [{ text: 'Write them in a notebook', correct: false }, { text: 'Save them in a browser auto-fill', correct: false }, { text: 'Use a reputable password manager like Bitwarden or 1Password', correct: true }, { text: 'Keep a text file on your desktop', correct: false }], explanation: 'Password managers encrypt all your passwords with one master password. They generate unique strong passwords for each site and auto-fill them securely.' },
    { question: 'Your bank asks you to set a 4-digit PIN. Which is safest?', options: [{ text: 'Your birth year (1998)', correct: false }, { text: 'A random number like 7293', correct: true }, { text: '1234', correct: false }, { text: 'Your phone number\'s last 4 digits', correct: false }], explanation: 'PINs based on personal info (birthdays, phone numbers) are easily guessed. 1234, 0000, and birth years are the most commonly tried combinations by attackers.' },
  ],
  sms: [
    { question: 'You receive: "SBI Alert: Your A/c is blocked. Call 9876543210 to reactivate." What should you do?', options: [{ text: 'Call the number immediately', correct: false }, { text: 'Ignore - SBI never sends such SMS. Call official number if concerned', correct: true }, { text: 'Reply STOP to unsubscribe', correct: false }, { text: 'Visit the nearest SBI branch within 24 hours', correct: false }], explanation: 'Banks never ask you to call random numbers. SBI\'s official helpline is 1800-11-2211. Scammers use urgency to make you call and then extract OTP/card details.' },
    { question: 'What is "SIM swapping" fraud?', options: [{ text: 'Physically stealing someone\'s SIM card', correct: false }, { text: 'Tricking the telecom provider to transfer your number to attacker\'s SIM', correct: true }, { text: 'Using two SIM cards in one phone', correct: false }, { text: 'Changing your mobile network provider', correct: false }], explanation: 'SIM swap fraud: attacker impersonates you at Airtel/Jio store, gets your number on their SIM, then receives all your OTPs and drains your bank accounts.' },
    { question: 'Someone calls claiming to be from "Jio KYC team" and asks you to download an app. This is:', options: [{ text: 'A legitimate KYC verification', correct: false }, { text: 'A scam - they\'ll install a screen-sharing app to steal data', correct: true }, { text: 'A mandatory government requirement', correct: false }, { text: 'Safe if you verify their employee ID', correct: false }], explanation: 'Telecom KYC is done in-store or through official apps. Scammers ask you to install AnyDesk/TeamViewer to see your screen, then steal banking credentials and OTPs.' },
    { question: 'You get a WhatsApp message: "Congratulations! You won ₹25 Lakh in KBC! WhatsApp +91-XXXXX to claim." This is:', options: [{ text: 'A real prize from Sony TV', correct: false }, { text: 'A lottery/advance-fee scam', correct: true }, { text: 'Worth checking just in case', correct: false }, { text: 'A government lucky draw', correct: false }], explanation: 'KBC never contacts winners via WhatsApp. These scams ask for "processing fees" or personal details. No legitimate lottery contacts you without you entering it.' },
    { question: 'What is "smishing"?', options: [{ text: 'Phishing done via SMS text messages', correct: true }, { text: 'Smoking while using a phone', correct: false }, { text: 'A type of malware', correct: false }, { text: 'Social media hacking', correct: false }], explanation: 'Smishing = SMS + phishing. Attackers send fake texts with malicious links or phone numbers, often impersonating banks, delivery services, or government agencies.' },
    { question: 'An OTP arrives that you didn\'t request. Someone then calls asking for it to "cancel the transaction." You should:', options: [{ text: 'Share it to cancel the unauthorized transaction', correct: false }, { text: 'Never share it - the caller initiated the transaction and needs YOUR OTP to complete it', correct: true }, { text: 'Share only the first 3 digits', correct: false }, { text: 'Text the OTP instead of saying it aloud', correct: false }], explanation: 'If you receive an unsolicited OTP, someone is trying to make a transaction from your account. They need YOUR OTP to complete it. Never share OTPs with anyone, ever.' },
  ],
  upi: [
    { question: 'A buyer on OLX says "I\'ll send money via UPI, please scan this QR code to receive ₹5000." What happens if you scan it?', options: [{ text: 'You receive ₹5000', correct: false }, { text: 'Money gets DEBITED from your account, not credited', correct: true }, { text: 'Nothing - QR codes are safe', correct: false }, { text: 'Your UPI ID gets verified', correct: false }], explanation: 'Scanning a QR code initiates a PAYMENT, not a receipt. You never need to scan QR codes or enter PIN to RECEIVE money. This is India\'s most common UPI scam.' },
    { question: 'You get a UPI collect request from "IRCTC-REFUND" for ₹1. Should you approve it?', options: [{ text: 'Yes, ₹1 is harmless', correct: false }, { text: 'No - collect requests DEBIT money, and this tests if your account is active', correct: true }, { text: 'Yes, IRCTC is a government site', correct: false }, { text: 'Approve only if you recently booked a ticket', correct: false }], explanation: 'UPI collect requests take money FROM you. Scammers send ₹1 requests to verify active accounts, then follow up with larger scam attempts. Decline unknown collect requests.' },
    { question: 'What is "juice jacking"?', options: [{ text: 'Overcharging your phone battery', correct: false }, { text: 'Stealing data through compromised public USB charging stations', correct: true }, { text: 'A type of DDoS attack', correct: false }, { text: 'Hacking through Bluetooth', correct: false }], explanation: 'Juice jacking uses tampered public USB ports to install malware or steal data while your phone charges. RBI has warned about this. Always use your own charger or a power bank.' },
    { question: 'RBI\'s rule on UPI transaction disputes: if a bank doesn\'t resolve in 30 days, what happens?', options: [{ text: 'Nothing, you lose the money', correct: false }, { text: 'The bank must pay ₹100/day compensation to the customer', correct: true }, { text: 'RBI files a police complaint', correct: false }, { text: 'Your account gets frozen', correct: false }], explanation: 'RBI mandates banks resolve UPI disputes within 30 days. Failure attracts ₹100/day compensation. Know your rights - file complaints at bankingombudsman.rbi.org.in.' },
    { question: 'What is card tokenization mandated by RBI?', options: [{ text: 'Converting cash to digital tokens', correct: false }, { text: 'Replacing actual card numbers with unique tokens for each merchant', correct: true }, { text: 'A new cryptocurrency by RBI', correct: false }, { text: 'Encrypting ATM PIN numbers', correct: false }], explanation: 'Tokenization replaces your real card number with a unique token per merchant. Even if a merchant is breached, your actual card details are safe. This is mandatory since Oct 2022.' },
    { question: 'Someone sends you ₹10 on PhonePe and then calls saying it was a mistake, asks you to return ₹10,000. This is:', options: [{ text: 'An honest mistake - return the money', correct: false }, { text: 'A scam - they sent ₹10 intentionally to build trust before a bigger fraud', correct: true }, { text: 'A UPI glitch', correct: false }, { text: 'Safe if you return exactly ₹10', correct: false }], explanation: 'The "accidental transfer" scam: scammers send small amounts, then claim they sent more and pressure you to "refund" a larger amount. Block and report such contacts.' },
  ],
  network: [
    { question: 'What is a "man-in-the-middle" (MITM) attack?', options: [{ text: 'Someone standing between you and the ATM', correct: false }, { text: 'An attacker secretly intercepting communication between two parties', correct: true }, { text: 'A virus that spreads through WiFi', correct: false }, { text: 'Hacking into a router physically', correct: false }], explanation: 'MITM attacks intercept data between you and a server (e.g., on public WiFi). Attackers can read passwords, modify data, or inject malware. Always use VPN on public networks.' },
    { question: 'What is ransomware?', options: [{ text: 'Software that speeds up your computer', correct: false }, { text: 'Malware that encrypts your files and demands payment to unlock them', correct: true }, { text: 'A type of firewall', correct: false }, { text: 'An antivirus program', correct: false }], explanation: 'Ransomware encrypts all your files and demands cryptocurrency payment. India\'s AIIMS was hit in 2022, crippling hospital systems for weeks. Regular backups are the best defense.' },
    { question: 'CERT-In requires Indian organizations to report cyber incidents within:', options: [{ text: '24 hours', correct: false }, { text: '6 hours', correct: true }, { text: '7 days', correct: false }, { text: '30 days', correct: false }], explanation: 'CERT-In\'s 2022 directive mandates reporting cyber incidents within 6 hours. This applies to data breaches, ransomware, and unauthorized access. Citizens can report at cybercrime.gov.in.' },
    { question: 'What is a "zero-day" vulnerability?', options: [{ text: 'A bug fixed on the same day it was found', correct: false }, { text: 'A security flaw unknown to the vendor with no patch available', correct: true }, { text: 'A virus that activates at midnight', correct: false }, { text: 'An attack that takes zero seconds', correct: false }], explanation: 'Zero-day = "zero days" of protection since the vendor doesn\'t know about it. These are extremely dangerous and valuable — sold for millions on dark web markets.' },
    { question: 'What is the purpose of a "honeypot" in cybersecurity?', options: [{ text: 'Storing encrypted passwords', correct: false }, { text: 'A decoy system designed to attract and study attackers', correct: true }, { text: 'A secure VPN server', correct: false }, { text: 'A type of encryption algorithm', correct: false }], explanation: 'Honeypots are intentionally vulnerable decoy systems. They attract attackers, letting security teams study attack methods and gather threat intelligence without risking real systems.' },
    { question: 'What is DNS spoofing?', options: [{ text: 'Making your internet faster', correct: false }, { text: 'Corrupting DNS records to redirect users to fake websites', correct: true }, { text: 'Blocking DNS servers', correct: false }, { text: 'A type of DDoS attack', correct: false }], explanation: 'DNS spoofing poisons DNS cache so that "sbi.co.in" resolves to an attacker\'s IP instead. Users see the correct URL but land on a fake site. Use DNS-over-HTTPS for protection.' },
  ],
};

// Session-based tracking to avoid repeats in fallback
const usedQuestions = {};

export function getRandomFallback(domain) {
  const questions = fallbackQuestions[domain] || fallbackQuestions.phishing;
  if (!usedQuestions[domain]) usedQuestions[domain] = new Set();
  if (usedQuestions[domain].size >= questions.length) usedQuestions[domain].clear();

  let idx;
  do { idx = Math.floor(Math.random() * questions.length); } while (usedQuestions[domain].has(idx));
  usedQuestions[domain].add(idx);

  const q = JSON.parse(JSON.stringify(questions[idx])); // deep clone
  q.options = q.options.sort(() => Math.random() - 0.5); // shuffle options
  q._source = 'fallback';
  return q;
}
