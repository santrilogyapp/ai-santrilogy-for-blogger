# Panduan Penggunaan Repository Santrilogy AI for Blogger

## Ikhtisar Proyek

Repository ini berisi file-file JavaScript terpisah dari template Blogger Santrilogy AI, yang memungkinkan penggunaan CDN untuk mengurangi ukuran template dan meningkatkan keamanan.

## Struktur Repository

```
ai-santrilogy-for-blogger/
├── js/
│   ├── main.js          # Fungsi utama aplikasi
│   ├── (removed)          # Firebase files removed - using Cloudflare D1 + JWT instead
│   └── utils.js         # Fungsi utilitas umum
├── README.md           # Dokumentasi utama
├── CDN-CONFIG.md       # Konfigurasi CDN
├── SECURITY.md         # Panduan keamanan
├── API-KEYS-GUIDE.md   # Panduan penggantian API keys
├── package.json        # Informasi proyek
└── .gitignore          # File yang diabaikan oleh Git
```

## Langkah-langkah Penggunaan

### 1. Siapkan Repository GitHub Anda

1. Buat repository baru di GitHub dengan nama `ai-santrilogy-for-blogger`
2. Clone repository ke lokal Anda
3. Tambahkan file-file dari folder ini ke repository Anda

### 2. Konfigurasi Cloudflare D1 + JWT (PENTING)

Sebelum menggunakan template di produksi, **harus** mengkonfigurasi Cloudflare D1 + JWT:

1. Lihat file `API-KEYS-GUIDE.md` untuk instruksi lengkap
2. Gunakan file `js/firebase-safe.js` sebagai referensi
3. Setup Cloudflare Worker dengan D1 database dan konfigurasi JWT

### 3. Gunakan CDN di Template Blogger

Ganti bagian JavaScript di template XML Anda:

```html
<!-- Hapus semua JavaScript inline dari template XML -->

<!-- Gantilah dengan skrip berikut (urutan sangat penting!) -->
<!-- External Libraries - Load Firebase SDK first -->
<script src='https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js'/>
<script src='https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js'/>
<script src='https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js'/>
<script src='https://cdn.jsdelivr.net/npm/marked/marked.min.js'/>
<script src='https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js'/>
<script src='https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js'/>

<!-- Main Application Scripts -->
<script src='https://cdn.jsdelivr.net/gh/santrilogyapp/ai-santrilogy-for-blogger@main/js/main.js'/>
<script src='https://cdn.jsdelivr.net/gh/santrilogyapp/ai-santrilogy-for-blogger@main/js/firebase.js'/>
<script src='https://cdn.jsdelivr.net/gh/santrilogyapp/ai-santrilogy-for-blogger@main/js/utils.js'/>
```

### 4. Gunakan Versi Tertentu untuk Produksi

Untuk stabilitas, gunakan versi tertentu:

```html
<script src='https://cdn.jsdelivr.net/gh/santrilogyapp/ai-santrilogy-for-blogger@v1.0.0/js/main.js'/>
```

## 5. Arsitektur Aman dengan Backend API (Direkomendasikan untuk Produksi)

Untuk keamanan maksimal di lingkungan produksi, disarankan menggunakan backend API sebagai lapisan aman. Ini memindahkan semua kredensial sensitif dari sisi klien ke server yang dilindungi.

### Ikhtisar Arsitektur
```
Browser (Template Blogger) → Backend API → Firebase/Backend Services
```

### Keunggulan:
- Tidak ada kunci API yang terpapar di sisi klien
- Perlindungan dari penyalahgunaan API
- Validasi input dan otentikasi di server
- Pembatasan akses origin
- Kemampuan untuk menambahkan rate limiting

### Platform yang Didukung:

1. **Cloudflare Workers** (Performa terbaik)
   - Tanpa perlu Wrangler CLI: bisa ditulis langsung di dashboard
   - Serverless dan cepat
   - Biaya rendah
   - **URL Production Contoh**: `https://worker-santrilogy-ai.santrilogyapp.workers.dev`

2. **Vercel** (Paling mudah untuk Next.js)
   - Deploy dengan `vercel` command
   - Edge functions tersedia

3. **Netlify Functions** (Bagus untuk pengguna Netlify)
   - Mudah diintegrasikan
   - Serverless functions

4. **Express.js Server** (Penuh kendali)
   - Deploy ke berbagai platform: Railway, Render, Heroku, dll
   - Konfigurasi penuh

### Endpoint API Standar:
- `POST /api/chat` - Kirim pesan ke AI
- `GET /api/history` - Ambil histori percakapan
- `POST /api/session` - Operasi sesi (simpan, muat, hapus)
- `POST /api/auth` - Operasi otentikasi

### Setup untuk Berbagai Platform:

Lihat `api-examples/deployment-options.md` untuk panduan lengkap deployment ke berbagai platform.

### Update Template Blogger:
- Ganti konfigurasi URL API di template
- Hapus semua referensi Firebase langsung
- Gunakan `api-examples/vercel-api.js` sebagai contoh backend
- **Atau gunakan template siap pakai**: `santrilogy-ai-updated-secure.xml` (versi telah diupdate tanpa Firebase langsung)

## Konfigurasi Tambahan

### Worker Endpoint
Ganti URL worker di main.js dengan endpoint Anda sendiri:

```javascript
var CONFIG = {
    WORKER_URL: "https://your-own-worker-url.workers.dev/",
    // ... konfigurasi lainnya
};
```

### Firebase Security Rules
Pastikan untuk mengimplementasikan Firebase Security Rules yang ketat seperti yang dijelaskan di `SECURITY.md`.

## Keamanan

### Harus Dilakukan Sebelum Produksi:
- [ ] Ganti semua API keys Firebase
- [ ] Terapkan Firebase Security Rules
- [ ] Gunakan konfigurasi produksi di Firebase
- [ ] Audit semua fungsi untuk potensi XSS
- [ ] Tambahkan Content Security Policy

### Praktik Terbaik:
- Gunakan versi spesifik dari CDN untuk stabilitas
- Jangan pernah commit API keys ke repository publik
- Lakukan backup konfigurasi secara berkala
- Pantau penggunaan API secara berkala

## Pembaruan dan Maintenance

### Untuk Pembaruan:
1. Lakukan perubahan di repository lokal
2. Push ke branch development terlebih dahulu
3. Uji di lingkungan staging
4. Merge ke main jika sudah siap
5. Gunakan versi baru di template Blogger

### Untuk Backup:
- Simpan salinan konfigurasi penting secara aman
- Backup Firebase Security Rules
- Simpan API keys di tempat aman

## Troubleshooting

### Jika CDN tidak bisa diakses:
- Pastikan repository dan file-file publik
- Cek apakah ada pembatasan akses di GitHub
- Gunakan alternatif CDN jika diperlukan

### Jika fitur tidak berfungsi setelah pemindahan:
- Periksa console browser untuk error
- Pastikan semua dependency dimuat dengan benar
- Verifikasi bahwa fungsi-fungsi global masih bisa diakses

## Dukungan dan Kontribusi

Jika Anda menemukan masalah atau ingin berkontribusi:
1. Buka issue di repository
2. Kirim pull request untuk perbaikan
3. Ikuti panduan kontribusi yang akan ditambahkan

## Lisensi

Repository ini disediakan sebagai referensi dan bantuan untuk mengimplementasikan template Santrilogy AI. Pastikan untuk mematuhi semua ketentuan dari pihak ketiga yang digunakan dalam template ini.