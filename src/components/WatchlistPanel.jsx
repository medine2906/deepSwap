import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchWalletInfo, fetchWalletTxns } from '../services/monadApi';

function timeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60000) return `${Math.floor(diff / 1000)}s`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
  return `${Math.floor(diff / 86400000)}d`;
}

function weiToMon(wei) {
  const val = parseFloat(wei || '0') / 1e18;
  if (val === 0) return null;
  if (val >= 1000) return val.toFixed(0) + ' MON';
  if (val >= 0.001) return val.toFixed(3) + ' MON';
  return null;
}

function methodIcon(method, txTypes) {
  const m = (method || '').toLowerCase();
  if (m.includes('swap')) return '🔄';
  if (m === 'transfer' || (txTypes || []).includes('token_transfer')) return '📤';
  if (m.includes('mint')) return '🌿';
  if (m.includes('approve')) return '✅';
  if (m.includes('stake') || m.includes('deposit')) return '🏦';
  if (m.includes('claim') || m.includes('harvest')) return '🌾';
  if ((txTypes || []).includes('coin_transfer') || m === '') return '💸';
  return '⚡';
}

function TxRow({ tx }) {
  const mon = weiToMon(tx.value);
  const method = tx.method || (tx.tx_types?.includes('coin_transfer') ? 'Transfer' : 'Contract Call');
  const ago = timeAgo(tx.timestamp);
  const isSuccess = tx.status === 'ok' || tx.result === 'success' || tx.status === null;

  return (
    <a
      href={`https://testnet.monadexplorer.com/tx/${tx.hash}`}
      target="_blank"
      rel="noreferrer"
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 0', textDecoration: 'none',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      <div style={{
        width: 30, height: 30, borderRadius: 8, flexShrink: 0,
        background: isSuccess ? 'rgba(123,97,255,0.15)' : 'rgba(255,71,87,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 14,
      }}>
        {methodIcon(method, tx.tx_types)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#fff', textTransform: 'capitalize', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {method}
        </div>
        {mon && <div style={{ fontSize: 10, color: '#7b61ff', fontWeight: 700 }}>{mon}</div>}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, flexShrink: 0 }}>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>{ago}</div>
        <div style={{ fontSize: 9, color: isSuccess ? '#00f5a0' : '#f72585' }}>{isSuccess ? '✓' : '✗'}</div>
      </div>
    </a>
  );
}

function WalletCard({ wallet, onRemove }) {
  const [txns, setTxns] = useState([]);
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);
  const mountedRef = useRef(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [infoData, txData] = await Promise.all([
      fetchWalletInfo(wallet),
      fetchWalletTxns(wallet, 8),
    ]);
    if (!mountedRef.current) return;
    if (infoData) setInfo(infoData);
    setTxns(txData);
    setLoading(false);
  }, [wallet]);

  useEffect(() => {
    mountedRef.current = true;
    refresh();
    const id = setInterval(refresh, 30000);
    return () => { mountedRef.current = false; clearInterval(id); };
  }, [refresh]);

  const balanceMon = info?.coin_balance
    ? parseFloat(info.coin_balance) / 1e18
    : null;

  const tier = balanceMon !== null
    ? balanceMon > 100000 ? { icon: '🐋', label: 'WHALE', color: '#7b61ff' }
    : balanceMon > 10000 ? { icon: '🧠', label: 'SMART $', color: '#4cc9f0' }
    : balanceMon > 1000  ? { icon: '⚡', label: 'PRO', color: '#00f5a0' }
    : { icon: '🎰', label: 'DEGEN', color: '#ff9f1c' }
    : null;

  const txCount = info?.transactions_count ?? null;
  const recentActivity = txns[0]?.timestamp
    ? timeAgo(txns[0].timestamp) + ' ago'
    : null;

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 16,
      overflow: 'hidden',
      marginBottom: 10,
    }}>
      {/* Header */}
      <div
        style={{ padding: '12px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
        onClick={() => setExpanded(e => !e)}
      >
        <div style={{
          width: 38, height: 38, borderRadius: 10, flexShrink: 0,
          background: 'linear-gradient(135deg, #7b61ff, #4cc9f0)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 900, color: '#fff', fontFamily: 'monospace',
        }}>
          {wallet.slice(2, 4).toUpperCase()}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#fff', fontFamily: 'monospace' }}>
              {wallet.slice(0, 6)}…{wallet.slice(-4)}
            </span>
            {tier && (
              <span style={{ fontSize: 8, fontWeight: 800, color: tier.color, background: `${tier.color}18`, border: `1px solid ${tier.color}30`, borderRadius: 6, padding: '1px 5px', letterSpacing: '0.08em' }}>
                {tier.icon} {tier.label}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 3, alignItems: 'center' }}>
            {balanceMon !== null && (
              <span style={{ fontSize: 10, color: '#7b61ff', fontWeight: 700 }}>
                {balanceMon >= 1000 ? (balanceMon / 1000).toFixed(1) + 'K' : balanceMon.toFixed(2)} MON
              </span>
            )}
            {txCount !== null && (
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{txCount} txns</span>
            )}
            {recentActivity && (
              <span style={{ fontSize: 10, color: 'rgba(0,245,160,0.7)' }}>● {recentActivity}</span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <button
            onClick={e => { e.stopPropagation(); refresh(); }}
            title="Yenile"
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 6, fontSize: 15,
              color: loading ? '#7b61ff' : 'rgba(255,255,255,0.3)',
              animation: loading ? 'spin 1s linear infinite' : 'none',
            }}
          >
            ↻
          </button>
          <a
            href={`https://testnet.monadexplorer.com/address/${wallet}`}
            target="_blank"
            rel="noreferrer"
            onClick={e => e.stopPropagation()}
            title="Explorer'da aç"
            style={{ color: 'rgba(255,255,255,0.3)', fontSize: 15, padding: 6, textDecoration: 'none', lineHeight: 1 }}
          >
            ↗
          </a>
          <button
            onClick={e => { e.stopPropagation(); onRemove(wallet); }}
            title="Kaldır"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, fontSize: 13, color: 'rgba(255,71,87,0.5)' }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Transactions */}
      {expanded && (
        <div style={{ padding: '0 14px 10px' }}>
          {loading && txns.length === 0 ? (
            <div style={{ padding: '14px 0', textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: 11 }}>
              Yükleniyor…
            </div>
          ) : txns.length === 0 ? (
            <div style={{ padding: '14px 0', textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: 11 }}>
              İşlem bulunamadı
            </div>
          ) : (
            txns.slice(0, 6).map(tx => <TxRow key={tx.hash} tx={tx} />)
          )}
        </div>
      )}
    </div>
  );
}

export default function WatchlistPanel({ wallets, onAdd, onRemove }) {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  const handleAdd = () => {
    const addr = input.trim().toLowerCase();
    if (!/^0x[0-9a-f]{40}$/i.test(addr)) {
      setError('Geçersiz adres — 0x ile başlayan 42 karakterli adres girin.');
      return;
    }
    if (wallets.includes(addr)) {
      setError('Bu adres zaten listende.');
      return;
    }
    setError('');
    onAdd(addr);
    setInput('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Input */}
      <div style={{ padding: '0 16px 12px', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={input}
            onChange={e => { setInput(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="0x… balina adresi ekle"
            style={{
              flex: 1, padding: '10px 13px', borderRadius: 12, minWidth: 0,
              border: `1px solid ${error ? 'rgba(255,71,87,0.45)' : 'rgba(255,255,255,0.1)'}`,
              background: 'rgba(255,255,255,0.05)',
              color: '#fff', fontSize: 11, fontFamily: 'monospace',
              outline: 'none',
            }}
          />
          <button
            onClick={handleAdd}
            style={{
              padding: '10px 14px', borderRadius: 12, border: 'none', flexShrink: 0,
              background: 'linear-gradient(135deg, #7b61ff, #4cc9f0)',
              color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer',
            }}
          >
            + Ekle
          </button>
        </div>
        {error && (
          <p style={{ fontSize: 10, color: 'rgba(255,71,87,0.8)', margin: '6px 0 0', lineHeight: 1.4 }}>
            {error}
          </p>
        )}
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px', scrollbarWidth: 'none' }}>
        {wallets.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, paddingTop: 36, textAlign: 'center' }}>
            <span style={{ fontSize: 44 }}>🐋</span>
            <p style={{ fontSize: 15, fontWeight: 900, color: '#fff', margin: 0 }}>Balina Takibi</p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: 0, maxWidth: 230, lineHeight: 1.6 }}>
              Takip etmek istediğin cüzdan adresini yukarıya yapıştır.
              Son işlemleri otomatik yenilenir.
            </p>
          </div>
        ) : (
          wallets.map(addr => (
            <WalletCard key={addr} wallet={addr} onRemove={onRemove} />
          ))
        )}
      </div>
    </div>
  );
}
