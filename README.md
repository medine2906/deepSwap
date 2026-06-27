# DegenSlide — Monad Copy-Trade Uygulaması

Monad zincirindeki en iyi trader'ları Tinder tarzı kaydırma arayüzüyle keşfedip tek dokunuşla kopyalayan mobil-öncelikli bir DeFi uygulaması.

---

## Ne Yapar?

- **Swipe-to-Trade:** Sağa kaydır → trader'ı kopyala (Copy Trade), sola kaydır → geç, yukarı kaydır → tüm bakiyeyle gir (All In 💸)
- **Canlı Veriler:** Monad ağından gerçek zamanlı en iyi trader'ları ve MON fiyatını çeker (DexScreener + Monad Explorer API)
- **Cüzdan Entegrasyonu:** MetaMask ile bağlan, onchain işlemleri doğrudan uygulama içinden gönder
- **Token Seçimi:** MON veya trending tokenlarla işlem yap; miktar için 3 hazır kademe ya da özel giriş
- **Portföy Takibi:** Kopyaladığın işlemlerin geçmişi ve giriş fiyatı kaydı
- **Leaderboard:** Trader sıralamalarını ve kişisel watchlist'ini görüntüle
- **Match & Inbox:** Swipe'ta eşleşme simülasyonu, trader'larla mesajlaşma ekranı
- **Favoriler:** Beğendiğin trader'ları profil sekmesinde sakla

---

## Teknoloji Yığını

| Katman | Teknoloji |
|--------|-----------|
| UI | React 18, Tailwind CSS |
| Animasyon | react-tinder-card, @react-spring/web |
| Build | Vite |
| Zincir | Monad Testnet |
| Cüzdan | MetaMask (EIP-1193) |
| Fiyat | DexScreener API |

---

## Kurulum

```bash
npm install
npm run dev
```

Tarayıcıda `http://localhost:5173` adresini aç ve MetaMask'ı Monad Testnet'e bağla.

---

## Klasör Yapısı

```
src/
├── components/
│   ├── SwipeCard.jsx      # Kaydırılabilir trader kartı
│   ├── Portfolio.jsx      # İşlem geçmişi ve PnL
│   ├── Leaderboard.jsx    # Trader sıralaması
│   ├── Inbox.jsx          # Eşleşmeler listesi
│   ├── Chat.jsx           # Trader ile sohbet
│   └── WatchlistPanel.jsx # Takip edilen cüzdanlar
├── services/
│   ├── wallet.js          # MetaMask bağlantısı ve işlem gönderimi
│   ├── monadApi.js        # Monad Explorer API
│   └── dexscreenerApi.js  # MON fiyatı ve trending tokenlar
├── data/
│   └── mockTraders.json   # Bağlantı öncesi örnek veriler
└── App.jsx                # Ana uygulama ve sekme yönetimi
```

---

## Nasıl Kullanılır?

1. Sağ üstteki **Connect** butonuna tıkla, MetaMask'ı onayla
2. Token ve miktar seç (MON veya trend tokenlar, 0.001 – özel)
3. Trader kartlarını kaydır:
   - Sağ → Copy Trade
   - Sol → Geç
   - Yukarı → All In
4. **Portfolio** sekmesinden işlemlerini takip et
5. **Top** sekmesinden Leaderboard veya Watchlist'i görüntüle
