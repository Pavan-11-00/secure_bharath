const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const API_KEY = import.meta.env.VITE_GROQ_API_KEY;

const LEVEL_CONTEXT = {
  beginner: 'basic cybersecurity awareness for everyday Indian internet users — UPI, OTP, phishing SMS',
  intermediate: 'intermediate cybersecurity — URL analysis, social engineering, password security, 2FA',
  advanced: 'advanced cybersecurity — malware, network attacks, zero-day exploits, digital forensics, CERT-In guidelines',
};

export async function generateGroqChallenge(level) {
  if (!API_KEY || API_KEY === 'your_groq_api_key_here') {
    return null;
  }

  const prompt = `Generate a unique multiple-choice cybersecurity quiz question about ${LEVEL_CONTEXT[level]}.
Return ONLY valid JSON in this exact format, no extra text:
{
  "question": "...",
  "options": [
    { "text": "...", "correct": false },
    { "text": "...", "correct": true },
    { "text": "...", "correct": false },
    { "text": "...", "correct": false }
  ],
  "explanation": "..."
}
Rules: exactly 4 options, exactly 1 correct, explanation must be educational and specific to India's cyber landscape.`;

  try {
    const res = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.9,
        max_tokens: 512,
      }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content?.trim();
    if (!raw) return null;

    // Extract JSON even if model wraps it in markdown
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);
    if (!parsed.question || !Array.isArray(parsed.options) || parsed.options.length !== 4) return null;

    return parsed;
  } catch {
    return null;
  }
}
