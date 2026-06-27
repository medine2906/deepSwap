import { useEffect, useState, useCallback } from 'react';
import { fetchMONPrice, fetchTokensByAddresses, calcPnL } from '../services/dexscreenerApi';

/* ── helpers ── */
function fmtUsd(val) {
  if (val == null) return '—';
  const abs = Math.abs(val);
  if (abs >= 1000) return `$${(val / 1000).toFixed(2)}k`;
  if (abs >= 1)    return `$${val.toFixed(2)}`;
  return `$${val.toFixed(4)}`;
}
function fmtPct(val) {
  if (val == null) return '—';
  const sign = val >= 0 ? '+' : '';
  return `${sign}${val.toFixed(2)}%`;
}
function timeAgo(ts) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/* ── PnL progress bar ── */
function PnLBar({ pct }) {
  if (pct == null) return null;
  const positive = pct >= 0;
  const width = Math.min(100, Math.abs(pct) * 5);
  return (
    <div style={{ height: 3, borderRadius: 2, background: '#f3f4f6', overflow: 'hidden', marginTop: 8 }}>
      <div style={{
        width: `${width}%`,
        height: '100%',
        background: positive ? '#10b981' : '#ef4444',
        borderRadius: 2,
        transition: 'width 0.6s ease',
      }} />
    </div>
  );
}

/* ── MON price banner ── */
function MonPriceTicker({ data, loading }) {
  if (loading && !data) {
    return (
      <div style={{
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 16,
        padding: '12px 14px',
        marginBottom: 10,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: '#f3f4f6',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, color: '#7b61ff', flexShrink: 0,
        }}>◈</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#111827' }}>MON</div>
          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>Fetching price from DexScreener…</div>
        </div>
        <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid #e5e7eb', borderTopColor: '#7b61ff', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }
  if (!data) return null;

  const ch24 = data.priceChange?.h24 ?? 0;
  const ch1  = data.priceChange?.h1  ?? 0;
  const positive = ch24 >= 0;

  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e5e7eb',
      borderRadius: 16,
      padding: '12px 14px',
      marginBottom: 10,
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 11,
          background: 'rgba(123,97,255,0.1)',
          border: '1px solid rgba(123,97,255,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 17, color: '#7b61ff', fontWeight: 900, flexShrink: 0,
        }}>◈</div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
            <span style={{ fontSize: 13, fontWeight: 900, color: '#111827' }}>MON</span>
            <span style={{ fontSize: 10, color: '#9ca3af' }}>Monad · DexScreener</span>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 3 }}>
            <span style={{ fontSize: 10, color: '#6b7280' }}>
              1h <span style={{ color: ch1 >= 0 ? '#10b981' : '#ef4444', fontWeight: 700 }}>{fmtPct(ch1)}</span>
            </span>
            <span style={{ fontSize: 10, color: '#6b7280' }}>
              Vol <span style={{ color: '#111827', fontWeight: 700 }}>
                {data.volume?.h24 >= 1e6
                  ? `$${(data.volume.h24 / 1e6).toFixed(1)}M`
                  : `$${Math.round(data.volume?.h24 ?? 0).toLocaleString()}`}
              </span>
            </span>
          </div>
        </div>

        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 900, color: '#111827' }}>
            ${data.priceUsd?.toFixed(4)}
          </div>
          <div style={{
            fontSize: 11, fontWeight: 700,
            color: positive ? '#10b981' : '#ef4444',
            marginTop: 1,
          }}>
            {positive ? '▲' : '▼'} {fmtPct(ch24)} 24h
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Summary bar ── */
function PortfolioSummary({ items, monData }) {
  const totalSpent = items.reduce((s, i) => s + i.amount, 0);
  const totalSpentUsd = monData ? totalSpent * monData.priceUsd : null;
  const pnlItems = items.filter((i) => i.pnl != null);
  const totalPnlUsd = pnlItems.reduce((s, i) => s + i.pnl.pnlUsd, 0);
  const winCount = pnlItems.filter((i) => i.pnl.pnlPct >= 0).length;
  const avgPct = pnlItems.length
    ? pnlItems.reduce((s, i) => s + i.pnl.pnlPct, 0) / pnlItems.length
    : null;

  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e5e7eb',
      borderRadius: 16,
      padding: '12px 14px',
      marginBottom: 10,
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      gap: 0,
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    }}>
      {/* Deployed */}
      <div style={{ paddingRight: 12 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
          Deployed
        </div>
        <div style={{ fontSize: 13, fontWeight: 900, color: '#111827' }}>
          {totalSpent.toFixed(4)}
          <span style={{ fontSize: 9, color: '#7b61ff', marginLeft: 3, fontWeight: 800 }}>MON</span>
        </div>
        {totalSpentUsd != null && (
          <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 1 }}>≈ {fmtUsd(totalSpentUsd)}</div>
        )}
      </div>

      {/* Total PnL */}
      <div style={{ borderLeft: '1px solid #f3f4f6', paddingLeft: 12, paddingRight: 12 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
          Total PnL
        </div>
        {pnlItems.length > 0 ? (
          <>
            <div style={{ fontSize: 13, fontWeight: 900, color: totalPnlUsd >= 0 ? '#10b981' : '#ef4444' }}>
              {totalPnlUsd >= 0 ? '+' : ''}{fmtUsd(totalPnlUsd)}
            </div>
            {avgPct != null && (
              <div style={{ fontSize: 10, color: totalPnlUsd >= 0 ? '#10b981' : '#ef4444', marginTop: 1 }}>
                avg {fmtPct(avgPct)}
              </div>
            )}
          </>
        ) : (
          <div style={{ fontSize: 12, color: '#d1d5db' }}>Loading…</div>
        )}
      </div>

      {/* Win Rate */}
      <div style={{ borderLeft: '1px solid #f3f4f6', paddingLeft: 12 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
          Win Rate
        </div>
        <div style={{ fontSize: 13, fontWeight: 900, color: pnlItems.length > 0 && winCount > 0 ? '#10b981' : '#d1d5db' }}>
          {pnlItems.length > 0 ? `${Math.round((winCount / pnlItems.length) * 100)}%` : '—'}
        </div>
        <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 1 }}>
          {winCount}/{pnlItems.length} trades
        </div>
      </div>
    </div>
  );
}

/* ── Portfolio card ── */
function PortfolioCard({ item, monData }) {
  const pnl = item.pnl;
  const isCopy = item.action === 'COPY';

  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e5e7eb',
      borderRadius: 18,
      padding: '14px',
      marginBottom: 8,
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      transition: 'border-color 0.18s, box-shadow 0.18s',
      cursor: 'default',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.borderColor = 'rgba(123,97,255,0.35)';
      e.currentTarget.style.boxShadow = '0 2px 8px rgba(123,97,255,0.1)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.borderColor = '#e5e7eb';
      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
    }}
    >
      {/* Main row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        {/* Icon */}
        <div style={{
          width: 44, height: 44, borderRadius: 13,
          background: 'rgba(123,97,255,0.08)',
          border: '1px solid rgba(123,97,255,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, color: '#7b61ff', fontWeight: 900, flexShrink: 0,
        }}>◈</div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, fontWeight: 900, color: '#111827', fontFamily: 'monospace' }}>
              {item.trader.address.slice(0, 6)}…{item.trader.address.slice(-4)}
            </span>
            {/* Action badge */}
            <span style={{
              fontSize: 9, fontWeight: 900, letterSpacing: '0.05em',
              padding: '2px 7px', borderRadius: 20,
              background: isCopy ? 'rgba(123,97,255,0.1)' : 'rgba(245,158,11,0.1)',
              color: isCopy ? '#7b61ff' : '#f59e0b',
              border: `1px solid ${isCopy ? 'rgba(123,97,255,0.2)' : 'rgba(245,158,11,0.25)'}`,
            }}>
              {isCopy ? '✓ COPY' : '💸 ALL IN'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: '#6b7280' }}>
              Spent&nbsp;
              <span style={{ color: '#7b61ff', fontWeight: 800 }}>{item.amount} MON</span>
              {item.token && item.token.symbol && item.token.symbol !== 'MON' && (
                <span>&nbsp;→ <span style={{ fontWeight: 800, color: '#111827' }}>{item.token.symbol}</span></span>
              )}
            </span>
            {monData && (
              <span style={{ fontSize: 11, color: '#9ca3af' }}>
                ≈ {fmtUsd(item.amount * monData.priceUsd)}
              </span>
            )}
          </div>

          {item.entryPriceUsd != null && (
            <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>
              Entry @ ${item.entryPriceUsd.toFixed(4)} · {timeAgo(item.time)}
            </div>
          )}
        </div>

        {/* PnL chip */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          {pnl == null ? (
            <span style={{ fontSize: 11, color: '#d1d5db', fontStyle: 'italic' }}>loading…</span>
          ) : (
            <>
              <div style={{ fontSize: 14, fontWeight: 900, color: pnl.pnlUsd >= 0 ? '#10b981' : '#ef4444' }}>
                {pnl.pnlUsd >= 0 ? '+' : ''}{fmtUsd(pnl.pnlUsd)}
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, color: pnl.pnlPct >= 0 ? '#10b981' : '#ef4444', marginTop: 1 }}>
                {fmtPct(pnl.pnlPct)}
              </div>
            </>
          )}
        </div>
      </div>

      {/* PnL bar */}
      {pnl && <PnLBar pct={pnl.pnlPct} />}

      {/* Bottom row: price stats + DSX link */}
      {item.pairData && (
        <div style={{
          marginTop: 10,
          paddingTop: 9,
          borderTop: '1px solid #f3f4f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', gap: 14 }}>
            {[
              { label: 'PRICE', val: `$${item.pairData.priceUsd?.toFixed(4)}`, col: '#111827' },
              { label: '1H',    val: fmtPct(item.pairData.priceChange?.h1),  col: (item.pairData.priceChange?.h1 ?? 0) >= 0 ? '#10b981' : '#ef4444' },
              { label: '24H',   val: fmtPct(item.pairData.priceChange?.h24), col: (item.pairData.priceChange?.h24 ?? 0) >= 0 ? '#10b981' : '#ef4444' },
            ].map(({ label, val, col }) => (
              <div key={label}>
                <div style={{ fontSize: 9, color: '#9ca3af', marginBottom: 2, fontWeight: 600, letterSpacing: '0.04em' }}>{label}</div>
                <div style={{ fontSize: 11, fontWeight: 800, color: col }}>{val}</div>
              </div>
            ))}
          </div>
          <a
            href={`https://dexscreener.com/monad/${item.pairData.pairAddress}`}
            target="_blank"
            rel="noreferrer"
            style={{
              fontSize: 9, fontWeight: 800,
              color: '#7b61ff', letterSpacing: '0.04em',
              textDecoration: 'none',
              background: 'rgba(123,97,255,0.08)',
              padding: '4px 9px', borderRadius: 8,
              border: '1px solid rgba(123,97,255,0.2)',
            }}
          >
            DSX ↗
          </a>
        </div>
      )}
    </div>
  );
}

/* ── Main Portfolio export ── */
export default function Portfolio({ portfolio }) {
  const [monData, setMonData]       = useState(null);
  const [loading, setLoading]       = useState(false);
  const [enriched, setEnriched]     = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);

  const refresh = useCallback(async () => {
    if (!portfolio.length) return;
    setLoading(true);
    try {
      const data = await fetchMONPrice();
      if (!data) return;
      setMonData(data);
      setLastUpdated(Date.now());

      const uniqueAddrs = [...new Set(portfolio.map(i => i.token?.address).filter(Boolean))];
      let pairMap = {};
      if (uniqueAddrs.length > 0) {
        const tokenPairs = await fetchTokensByAddresses(uniqueAddrs);
        tokenPairs.forEach(p => { if (p.baseToken?.address) pairMap[p.baseToken.address.toLowerCase()] = p; });
      }

      const currentMonPrice = data.priceUsd;
      setEnriched(
        portfolio.map((item) => {
          const addr = item.token?.address?.toLowerCase();
          const pair = pairMap[addr] || data; // use specific token pair, or fallback to MON
          
          const isMon = !item.token?.symbol || item.token.symbol === 'MON';
          
          let pnl;
          if (isMon) {
            const entryPriceUsd = item.entryPriceUsd ?? currentMonPrice / (1 + (data.priceChange?.h24 ?? 0) / 100);
            pnl = calcPnL(entryPriceUsd, currentMonPrice, item.amount);
          } else {
            // For other tokens, simulate PnL based on their 24h change since we don't snapshot their exact entry price.
            // Or if we have a real precise logic, we apply it. Here we use 24h as proxy for the mock app.
            const entryValueUsd = item.amount * currentMonPrice;
            const pnlPct = pair.priceChange?.h24 ?? 0;
            const pnlUsd = entryValueUsd * (pnlPct / 100);
            pnl = { entryValue: entryValueUsd, currentValue: entryValueUsd + pnlUsd, pnlUsd, pnlPct };
          }

          return { ...item, pairData: pair, pnl };
        })
      );
    } catch { /* keep previous */ }
    finally { setLoading(false); }
  }, [portfolio]);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 30000);
    return () => clearInterval(id);
  }, [refresh]);

  /* ── Empty state ── */
  if (portfolio.length === 0) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', height: '100%', textAlign: 'center',
        paddingBottom: 80, gap: 12,
      }}>
        <span style={{ fontSize: 40, opacity: 0.25, filter: 'grayscale(1)' }}>📊</span>
        <div style={{ fontWeight: 900, fontSize: 16, color: '#111827' }}>Portfolio Empty</div>
        <div style={{ fontSize: 13, color: '#6b7280', maxWidth: 220 }}>
          Swipe right on a trader to copy their trade and track live PnL here.
        </div>
      </div>
    );
  }

  const items = enriched.length > 0 ? enriched : portfolio;

  return (
    <div style={{ height: '100%', overflowY: 'auto', paddingBottom: 16, scrollbarWidth: 'none' }}>
      {/* Header row */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 10,
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          {portfolio.length} Position{portfolio.length !== 1 ? 's' : ''}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {lastUpdated && (
            <span style={{ fontSize: 9, color: '#d1d5db' }}>
              {timeAgo(lastUpdated)}
            </span>
          )}
          <button
            onClick={refresh}
            disabled={loading}
            style={{
              background: 'none',
              border: '1px solid #e5e7eb',
              borderRadius: 9,
              padding: '3px 10px',
              fontSize: 10, fontWeight: 800,
              color: loading ? '#d1d5db' : '#7b61ff',
              cursor: loading ? 'default' : 'pointer',
              letterSpacing: '0.03em',
            }}
          >
            {loading ? '⟳ syncing' : '⟳ Refresh'}
          </button>
        </div>
      </div>

      {/* Price ticker */}
      <MonPriceTicker data={monData} loading={loading} />

      {/* Summary */}
      {monData && <PortfolioSummary items={items} monData={monData} />}

      {/* Source note */}
      {lastUpdated && (
        <div style={{ fontSize: 9, color: '#d1d5db', textAlign: 'right', marginBottom: 6 }}>
          via DexScreener · auto-refresh 30s
        </div>
      )}

      {/* Position cards */}
      {items.map((item, i) => (
        <PortfolioCard key={i} item={item} monData={monData} />
      ))}
    </div>
  );
}
