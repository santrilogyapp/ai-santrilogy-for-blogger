# Panduan Setup Cloudflare Workers untuk Santrilogy AI

## Ikhtisar

Arsitektur ini memindahkan semua logika dan kredensial sensitif dari sisi klien ke backend Cloudflare Workers, memberikan keamanan maksimum untuk implementasi Santrilogy AI di produksi.

## Arsitektur

```
Browser (Template Blogger) → Cloudflare Workers → Firebase API → AI Workers
```

## Keamanan

- Tidak ada kunci API terpapar di sisi klien
- Semua validasi dan otentikasi dilakukan di server
- Perlindungan dari penyalahgunaan API
- Pembatasan akses origin

## Prasyarat

1. Akun Cloudflare
2. Proyek Firebase dengan konfigurasi yang benar
3. Worker AI untuk pemrosesan percakapan
4. Service account Firebase untuk akses server

## Setup

### 1. Instal Wrangler CLI

```bash
npm install -g wrangler
```

### 2. Login ke Cloudflare

```bash
wrangler login
```

### 3. Konfigurasi Variabel Lingkungan

Edit file `wrangler.toml` dengan kredensial Anda:

```toml
[vars]
FIREBASE_API_KEY = "kunci_api_firebase_anda"
FIREBASE_PROJECT_ID = "id_proyek_firebase_anda"
AI_WORKER_URL = "https://worker-ai-anda.nama-workspace.workers.dev"
# ... variabel lainnya
```

### 4. Deploy Worker

```bash
cd worker
wrangler deploy
```

## Endpoint API

### Chat Endpoint
- **URL**: `POST /api/chat`
- **Request**:
  ```json
  {
    "message": "pesan dari pengguna",
    "userId": "id_pengguna",
    "sessionId": "id_sesi"
  }
  ```
- **Response**:
  ```json
  {
    "response": "respons dari AI",
    "timestamp": 1234567890
  }
  ```

### Histori Endpoint
- **URL**: `GET /api/history?userId={userId}`
- **Response**:
  ```json
  {
    "history": [...]
  }
  ```

### Sesi Endpoint
- **URL**: `POST /api/session`
- **Request**:
  ```json
  {
    "sessionId": "id_sesi",
    "userId": "id_pengguna",
    "action": "get|save|delete",
    "sessionData": {...}
  }
  ```

### Otentikasi Endpoint
- **URL**: `POST /api/auth`
- **Request**:
  ```json
  {
    "action": "login|signup|verify",
    "email": "email@pengguna.com",
    "password": "password",
    "idToken": "token_otentikasi"
  }
  ```

## Integrasi dengan Template Blogger

### Ganti Panggilan Firebase Langsung

Dari:
```javascript
// Jangan lagi menggunakan ini di template
window.firebaseLoadHistory()
```

Ke:
```javascript
// Gunakan endpoint worker Anda
fetch('https://nama-worker.klien.workers.dev/api/history?userId=' + userId)
  .then(response => response.json())
  .then(data => console.log(data));
```

## Security Best Practices

1. **Batasi Origins**: Hanya izinkan domain Anda
2. **Validasi Input**: Selalu validasi data yang masuk
3. **Rate Limiting**: Implementasi pembatasan permintaan
4. **Logging**: Catat semua permintaan untuk audit
5. **Enkripsi**: Gunakan HTTPS untuk semua komunikasi

## Troubleshooting

### Error Firebase
- Pastikan service account token valid
- Periksa Firebase Security Rules
- Verifikasi project ID

### Error Cross-Origin
- Tambahkan domain Anda ke `allowedOrigins`
- Periksa header CORS

## Update Template Blogger

File-file yang perlu diperbarui untuk menggunakan Cloudflare Worker:
- Ganti semua panggilan `window.firebaseX` dengan panggilan ke endpoint Anda
- Perbarui URL worker AI
- Tambahkan validasi keamanan

---
*Pastikan untuk menyimpan kredensial Anda dengan aman dan tidak pernah mengkomitnya ke repositori publik.*