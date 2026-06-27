import { useState } from 'react';
import { BlockieAvatar } from './SwipeCard';

function shortenAddress(addr) {
  if (!addr) return '0x000...000';
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export default function Inbox({ matches, lastMessages, onOpenChat }) {
  if (matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center pb-20 px-8" style={{ gap: 16 }}>
        <div style={{ fontSize: 48, opacity: 0.8 }}>💬</div>
        <h3 style={{ fontSize: 18, fontWeight: 900, color: '#ffffff', margin: 0 }}>No Messages</h3>
        <p style={{ color: 'rgba(255,255,255,0.45)', margin: 0, fontSize: 13, lineHeight: 1.5 }}>
          When you swipe right on a trader and they accept, your chat will appear here.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Matches Horizontal List */}
      <div style={{ padding: '16px 16px 8px' }}>
        <h3 style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#f72585', margin: '0 0 12px' }}>
          New Matches
        </h3>
        <div className="hide-scrollbar" style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8 }}>
          {matches.map(trader => {
            const hasMessages = lastMessages[trader.address] && lastMessages[trader.address].length > 0;
            if (hasMessages) return null; // Show only new matches with no chat history
            return (
              <div key={`new-${trader.address}`} onClick={() => onOpenChat(trader)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer', flexShrink: 0 }}>
                <div style={{ padding: 2, background: 'linear-gradient(135deg, #f72585, #7b61ff)', borderRadius: '50%' }}>
                  <div style={{ border: '2px solid #080810', borderRadius: '50%', overflow: 'hidden' }}>
                    <BlockieAvatar addr={trader.address} size={50} />
                  </div>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', fontFamily: 'monospace' }}>
                  {trader.address.slice(2, 6)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Messages Vertical List */}
      <div style={{ flex: 1, padding: '8px 16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <h3 style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.4)', margin: '8px 0 4px' }}>
          Messages
        </h3>
        {matches.map(trader => {
          const thread = lastMessages[trader.address];
          if (!thread || thread.length === 0) return null;
          const lastMsg = thread[thread.length - 1];

          return (
            <div
              key={`msg-${trader.address}`}
              onClick={() => onOpenChat(trader)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 16, cursor: 'pointer', transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
            >
              <BlockieAvatar addr={trader.address} size={48} />
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#fff', fontFamily: 'monospace' }}>
                    {shortenAddress(trader.address)}
                  </span>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>
                    {new Date(lastMsg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p style={{
                  fontSize: 12, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  color: lastMsg.sender === 'me' ? 'rgba(255,255,255,0.4)' : '#fff',
                  fontWeight: lastMsg.sender === 'them' ? 600 : 400
                }}>
                  {lastMsg.sender === 'me' ? 'You: ' : ''}{lastMsg.text}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
