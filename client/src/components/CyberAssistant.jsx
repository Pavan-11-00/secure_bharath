import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function CyberAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I am your Secure Bharat AI Assistant. How can I help you stay safe online today? 🛡️' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef();

  const API_URL = 'http://localhost:5000';

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          history: messages.slice(-5) // Send last few messages for context
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Assistant is offline');
      }

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I am having trouble connecting right now. Please try again later or call 1930 for urgent help.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cyber-assistant-container">
      {/* Floating Toggle Button */}
      <button 
        className={`assistant-toggle ${isOpen ? 'open' : ''}`} 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle AI Assistant"
      >
        {isOpen ? '❌' : '🤖'}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="assistant-window">
          <div className="assistant-header">
            <div className="assistant-avatar">🤖</div>
            <div>
              <div className="assistant-name">Secure Bharat AI</div>
              <div className="assistant-status">Online • Cybersecurity Expert</div>
            </div>
          </div>

          <div className="assistant-messages" ref={scrollRef}>
            {messages.map((msg, i) => (
              <div key={i} className={`message ${msg.role}`}>
                <div className="message-bubble">
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="message assistant">
                <div className="message-bubble loading">
                  <span>.</span><span>.</span><span>.</span>
                </div>
              </div>
            )}
          </div>

          <form className="assistant-input" onSubmit={handleSend}>
            <input 
              type="text" 
              placeholder="Ask me anything about cyber safety..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />
            <button type="submit" disabled={loading || !input.trim()}>
              {loading ? '...' : '✈️'}
            </button>
          </form>
        </div>
      )}

      <style jsx="true">{`
        .cyber-assistant-container {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 1000;
          font-family: 'Inter', sans-serif;
        }

        .assistant-toggle {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--color-cyan), var(--color-purple));
          border: none;
          color: white;
          font-size: 24px;
          cursor: pointer;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .assistant-toggle:hover {
          transform: scale(1.1) rotate(5deg);
        }

        .assistant-toggle.open {
          transform: scale(0.9);
          background: var(--bg-glass);
          border: 1px solid var(--border-glass);
        }

        .assistant-window {
          position: absolute;
          bottom: 80px;
          right: 0;
          width: 350px;
          height: 500px;
          background: rgba(15, 23, 42, 0.9);
          backdrop-filter: blur(16px);
          border: 1px solid var(--border-glass);
          border-radius: 20px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
          animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .assistant-header {
          padding: 16px;
          background: rgba(255, 255, 255, 0.05);
          border-bottom: 1px solid var(--border-glass);
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .assistant-avatar {
          width: 40px;
          height: 40px;
          background: var(--color-cyan-dim);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
        }

        .assistant-name {
          font-weight: 700;
          font-size: 14px;
          color: white;
        }

        .assistant-status {
          font-size: 11px;
          color: var(--color-cyan);
        }

        .assistant-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          scrollbar-width: thin;
          scrollbar-color: var(--border-glass) transparent;
        }

        .message {
          max-width: 85%;
          display: flex;
        }

        .message.assistant {
          align-self: flex-start;
        }

        .message.user {
          align-self: flex-end;
        }

        .message-bubble {
          padding: 10px 14px;
          border-radius: 15px;
          font-size: 13.5px;
          line-height: 1.5;
          white-space: pre-wrap;
        }

        .assistant .message-bubble {
          background: rgba(255, 255, 255, 0.08);
          color: #e2e8f0;
          border-bottom-left-radius: 2px;
        }

        .user .message-bubble {
          background: var(--color-cyan);
          color: #0f172a;
          font-weight: 500;
          border-bottom-right-radius: 2px;
        }

        .assistant-input {
          padding: 12px;
          background: rgba(255, 255, 255, 0.03);
          border-top: 1px solid var(--border-glass);
          display: flex;
          gap: 8px;
        }

        .assistant-input input {
          flex: 1;
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid var(--border-glass);
          border-radius: 10px;
          padding: 8px 12px;
          color: white;
          font-size: 13px;
        }

        .assistant-input input:focus {
          outline: none;
          border-color: var(--color-cyan);
        }

        .assistant-input button {
          background: var(--color-cyan);
          border: none;
          border-radius: 10px;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .assistant-input button:hover:not(:disabled) {
          transform: scale(1.05);
        }

        .assistant-input button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .loading span {
          animation: blink 1.4s infinite both;
          font-size: 20px;
          margin: 0 1px;
        }

        .loading span:nth-child(2) { animation-delay: 0.2s; }
        .loading span:nth-child(3) { animation-delay: 0.4s; }

        @keyframes blink {
          0% { opacity: 0.2; }
          20% { opacity: 1; }
          100% { opacity: 0.2; }
        }

        @media (max-width: 480px) {
          .assistant-window {
            width: calc(100vw - 48px);
            height: 70vh;
            bottom: 70px;
          }
        }
      `}</style>
    </div>
  );
}
