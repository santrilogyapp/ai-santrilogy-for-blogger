# Panduan Deployment Santrilogy AI Worker

## Persiapan

1. Pastikan Anda memiliki akun Cloudflare
2. Instal Wrangler CLI:
```bash
npm install -g wrangler
```

## Konfigurasi Environment Variables

Sebelum mendeploy, Anda perlu menyiapkan environment variables untuk Worker:

```bash
# Login ke akun Cloudflare Anda
wrangler login

# Set environment variables (secret) satu per satu:
wrangler secret put FIREBASE_PROJECT_ID
wrangler secret put FIREBASE_CLIENT_EMAIL
wrangler secret put FIREBASE_PRIVATE_KEY
wrangler secret put FIREBASE_API_KEY
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
wrangler secret put AI_WORKER_URL  # Opsional
wrangler secret put ALLOWED_ORIGINS  # Contoh: https://santrilogy-ai.blogspot.com
```

## Deployment

1. Pastikan semua environment variables telah diset
2. Deploy Worker:
```bash
wrangler deploy
```

## Konfigurasi Setelah Deployment

1. Setelah deployment berhasil, Worker akan aktif di URL: `https://worker-santrilogy-ai.YOUR_SUBDOMAIN.workers.dev`
2. Pastikan URL tersebut cocok dengan konfigurasi di file XML
3. Di file `santrilogy-ai-updated-secure.xml`, parameter `BASE_URL` sudah disesuaikan ke `https://worker-santrilogy-ai.santrilogyapp.workers.dev`

## Endpoint yang Tersedia

- `GET /health` - Cek status kesehatan Worker
- `POST /api/auth` - Autentikasi (login/register/verify)
- `GET /api/auth/google` - Redirect ke Google OAuth
- `GET /api/auth/callback` - Callback dari Google OAuth
- `POST /api/chat` - Pengolahan pesan AI
- `GET /api/history` - Ambil riwayat chat
- `POST /api/session` - Manajemen sesi chat

## Troubleshooting

Jika sistem auth masih menampilkan pesan "Sistem autentikasi sedang dimuat...":

1. Pastikan Worker sudah dideploy dan aktif
2. Cek URL Worker yang digunakan di file XML
3. Pastikan environment variables sudah di-set dengan benar
4. Cek apakah origin yang digunakan diizinkan di ALLOWED_ORIGINS

## Testing

Untuk testing Worker:

```bash
wrangler dev
```

Ini akan menjalankan Worker secara lokal dan bisa diuji sebelum deployment.