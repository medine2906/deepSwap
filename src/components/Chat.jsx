import { useState, useEffect, useRef } from 'react';
import { BlockieAvatar } from './SwipeCard';

function shortenAddress(addr) {
  if (!addr) return '0x000...000';
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

const MOCK_REPLIES = [
  "LFG! 🚀",
  "WAGMI brother 💎🙌",
  "Just aped into some MON",
  "Bullish on Monad ngl",
  "Send it! 💸",
  "What's the alpha?",
  "Gm gm",
  "👀",
];

export default function Chat({ trader, initialMessages = [], onBack, onUpdateMessages }) {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMsg = { sender: 'me', text: input.trim(), time: Date.now() };
    const updated = [...messages, newMsg];
    setMessages(updated);
    onUpdateMessages(trader.address, updated);
    setInput('');

    // Simulate reply
    setIsTyping(true);
    setTimeout(() => {
      const reply = {
        sender: 'them',
        text: MOCK_REPLIES[Math.floor(Math.random() * MOCK_REPLIES.length)],
        time: Date.now()
      };
      const finalUpdated = [...updated, reply];
      setMessages(finalUpdated);
      onUpdateMessages(trader.address, finalUpdated);
      setIsTyping(false);
    }, 1500 + Math.random() * 2000); // 1.5s - 3.5s delay
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0a0a1a' }}>
      
      {/* HEADER */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '16px',
        background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)'
      }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 24, cursor: 'pointer', padding: '0 8px 0 0' }}>
          ‹
        </button>
        <BlockieAvatar addr={trader.address} size={40} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', fontFamily: 'monospace' }}>
            {shortenAddress(trader.address)}
          </div>
          <div style={{ fontSize: 10, color: '#00f5a0', fontWeight: 600 }}>● Online</div>
        </div>
      </div>

      {/* MESSAGES AREA */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 40 }}>
            You matched with {shortenAddress(trader.address)}!<br />
            Say gm to start the conversation.
          </div>
        )}
        
        {messages.map((msg, i) => {
          const isMe = msg.sender === 'me';
          return (
            <div key={i} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '75%',
                padding: '10px 14px',
                borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                background: isMe ? 'linear-gradient(135deg, #f72585, #7b61ff)' : 'rgba(255,255,255,0.1)',
                color: '#fff',
                fontSize: 14,
                boxShadow: isMe ? '0 4px 12px rgba(247,37,133,0.3)' : 'none',
                wordBreak: 'break-word',
              }}>
                {msg.text}
                <div style={{ fontSize: 9, color: isMe ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.4)', marginTop: 4, textAlign: isMe ? 'right' : 'left' }}>
                  {new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}
        {isTyping && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{
              padding: '12px 16px', borderRadius: '18px 18px 18px 4px',
              background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontSize: 12
            }}>
              typing...
            </div>
          </div>
        )}
      </div>

      {/* INPUT AREA */}
      <form onSubmit={handleSend} style={{
        padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', gap: 8
      }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Message..."
          style={{
            flex: 1, padding: '12px 16px', borderRadius: 24, border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.05)', color: '#fff', outline: 'none', fontSize: 14
          }}
        />
        <button
          type="submit"
          disabled={!input.trim()}
          style={{
            width: 44, height: 44, borderRadius: 22, border: 'none',
            background: input.trim() ? '#7b61ff' : 'rgba(255,255,255,0.1)',
            color: '#fff', cursor: input.trim() ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </form>
    </div>
  );
}
