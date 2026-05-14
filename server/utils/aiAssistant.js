import axios from 'axios';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

export async function chatWithAI(message, history = []) {
  const apiKey = process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY;
  
  if (!apiKey) {
    console.error('SERVER ERROR: GROQ_API_KEY is missing in server environment');
    throw new Error('Groq API Key not configured on server');
  }

  const systemPrompt = `You are the Secure Bharat AI Assistant, a specialized cybersecurity expert for Indian citizens. 
Your goal is to provide clear, actionable, and culturally relevant advice to protect users from scams, phishing, and digital fraud.

Key Guidelines:
1. Reference Indian services (UPI, SBI, HDFC, Aadhaar, PhonePe, Paytm, IRCTC, Jio, etc.).
2. Mention official helplines like 1930 (National Cyber Crime Helpline).
3. Use simple, non-technical language where possible.
4. If a user reports an active fraud, advise them to call 1930 and visit cybercrime.gov.in immediately.
5. Keep responses concise and structured with bullet points.
6. Be encouraging but firm about security practices.

User Question: ${message}`;

  try {
    const response = await axios.post(GROQ_URL, {
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data.choices[0].message.content;
  } catch (err) {
    console.error('AI Chat Error:', err.response?.data || err.message);
    throw new Error('Failed to get response from AI assistant');
  }
}
