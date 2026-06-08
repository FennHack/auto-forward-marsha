# Marsha JKT48 Auto-Post Telegram Bot

Bot Telegram otomatis yang memposting semua konten media Marsha JKT48 dari berbagai platform sosial media ke channel Telegram kamu — **foto, video, reels, story IG, story TikTok, dan lainnya**.

---

## Fitur

| Platform | Posts | Stories/Live |
|----------|-------|--------------|
| Instagram | Foto, Video, Reels, Carousel | Story IG |
| TikTok | Video | Story TikTok |
| Twitter/X | Foto & Video | — |
| Threads | Foto & Video | — |

- **Auto-check setiap 15 menit** via Vercel Cron
- **Anti-duplikat** menggunakan Upstash Redis
- **Caption otomatis** dengan link ke post original
- **Gratis 100%** (Vercel free tier + RapidAPI free + Upstash free)

---

## Cara Deploy (Step by Step)

### Step 1: Buat Bot Telegram
1. Buka Telegram → cari **@BotFather**
2. Ketik `/newbot` → ikuti instruksi
3. Salin **Bot Token** (format: `1234567890:AAxxxx...`)
4. Buat channel Telegram kamu
5. **Tambahkan bot sebagai Admin** di channel (wajib agar bisa posting)
6. Salin **Channel ID** (cek via @userinfobot atau pakai `@namaChannel`)

---

### Step 2: Daftar RapidAPI (Gratis)
1. Buka [rapidapi.com](https://rapidapi.com) → daftar akun
2. Salin **API Key** dari dashboard
3. Subscribe ke API-API berikut (**semua ada free tier**):
   - [instagram-scraper-api2](https://rapidapi.com/search/instagram-scraper-api2)
   - [tiktok-scraper7](https://rapidapi.com/search/tiktok-scraper7)
   - [twitter241](https://rapidapi.com/search/twitter241)
   - [threads-api4](https://rapidapi.com/search/threads-api4)

---

### Step 3: Buat Database Redis (Gratis)
1. Buka [upstash.com](https://upstash.com) → daftar akun
2. Buat **Redis Database** (pilih region terdekat, misal Singapore)
3. Salin **REST URL** dan **REST Token**

---

### Step 4: Deploy ke Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Clone / download project ini
cd marsha-jkt48-bot

# Install dependencies
npm install

# Deploy
vercel deploy --prod
```

Saat ditanya, jawab:
- Framework: **Other**
- Build command: (kosongkan)
- Output directory: (kosongkan)

---

### Step 5: Set Environment Variables di Vercel
Buka dashboard Vercel → project kamu → **Settings → Environment Variables**

Tambahkan semua variabel berikut:

| Key | Value |
|-----|-------|
| `TELEGRAM_BOT_TOKEN` | Token dari BotFather |
| `TELEGRAM_CHANNEL_ID` | `@namaChannel` atau `-100xxxxxx` |
| `RAPIDAPI_KEY` | Key dari RapidAPI |
| `UPSTASH_REDIS_URL` | REST URL dari Upstash |
| `UPSTASH_REDIS_TOKEN` | REST Token dari Upstash |
| `CRON_SECRET` | String acak (opsional, untuk keamanan) |

Setelah set env vars, **redeploy** project:
```bash
vercel deploy --prod
```

---

### Step 6: Verifikasi Bot Berjalan
Buka browser: `https://nama-project-kamu.vercel.app/api/status`

Harusnya muncul:
```json
{
  "bot": "Marsha JKT48 Auto-Post Bot",
  "status": " Running",
  "platforms": {
    "instagram": "Active",
    "tiktok": "Active",
    "twitter": "Active",
    "threads": "Active"
  }
}
```

---

## Trigger Manual
Untuk test, bisa trigger cron manual:
```
GET https://nama-project.vercel.app/api/cron
```
(Tambahkan header `Authorization: Bearer <CRON_SECRET>` jika set)

---

## Jadwal Cron
Bot dicek otomatis setiap **15 menit** oleh Vercel Cron.
```
*/15 * * * *
```
Konfigurasi ada di `vercel.json`. Bisa diubah ke:
- `*/5 * * * *` → setiap 5 menit
- `*/30 * * * *` → setiap 30 menit

---

## Struktur Project
```
marsha-jkt48-bot/
├── api/
│   ├── cron.js          # Endpoint cron Vercel
│   └── status.js        # Status page
├── lib/
│   ├── processor.js     # Logic utama
│   ├── telegram.js      # Kirim ke Telegram
│   ├── storage.js       # Anti-duplikat (Redis)
│   └── scrapers/
│       ├── instagram.js # Scraper IG + Story
│       ├── tiktok.js    # Scraper TikTok + Story
│       ├── twitter.js   # Scraper Twitter
│       └── threads.js   # Scraper Threads
├── config/
│   └── index.js         # Konfigurasi
├── vercel.json          # Config cron Vercel
├── .env.example         # Template env vars
└── package.json
```

---

## FAQ

**Q: Bot tidak posting apa-apa?**
- Cek `/api/status` apakah semua env vars ter-set
- Pastikan bot sudah jadi Admin di channel
- Cek Vercel logs di dashboard

**Q: Story tidak ter-capture?**
- Story IG/TikTok expire dalam 24 jam, jadi bot harus cek sebelum expired
- Pastikan `fetchStories: true` di `config/index.js`

**Q: Kena rate limit RapidAPI?**
- Free tier biasanya 100-500 req/bulan per API
- Naikkan interval di `vercel.json` ke `*/30 * * * *`

**Q: Bisa untuk akun JKT48 lain?**
- Ganti `username` di `config/index.js`
- Bisa duplikat project untuk tiap member

---

## Lisensi
Dibuat untuk keperluan fenn community. Gunakan dengan bijak.
