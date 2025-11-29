# Panduan Penggunaan Repository Santrilogy AI for Blogger

## Ikhtisar Proyek

Repository ini berisi file-file JavaScript terpisah dari template Blogger Santrilogy AI, yang memungkinkan penggunaan CDN untuk mengurangi ukuran template dan meningkatkan keamanan.

## Struktur Repository

```
ai-santrilogy-for-blogger/
├── js/
│   ├── main.js          # Fungsi utama aplikasi
│   ├── firebase.js      # Konfigurasi dan fungsi Firebase (versi aman)
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

### 2. Ganti API Keys Firebase (PENTING)

Sebelum menggunakan template di produksi, **harus** mengganti API keys Firebase:

1. Lihat file `API-KEYS-GUIDE.md` untuk instruksi lengkap
2. Gunakan file `js/firebase-safe.js` sebagai referensi
3. Buat proyek Firebase baru dan ganti konfigurasi

### 3. Gunakan CDN di Template Blogger

Ganti bagian JavaScript di template XML Anda:

```html
<!-- Hapus semua JavaScript inline dari template XML -->

<!-- Gantilah dengan skrip berikut -->
<script src='https://cdn.jsdelivr.net/gh/santrilogyapp/ai-santrilogy-for-blogger@main/js/main.js'/>
<script src='https://cdn.jsdelivr.net/gh/santrilogyapp/ai-santrilogy-for-blogger@main/js/firebase.js'/>
<script src='https://cdn.jsdelivr.net/gh/santrilogyapp/ai-santrilogy-for-blogger@main/js/utils.js'/>

<!-- External Libraries -->
<script src='https://cdn.jsdelivr.net/npm/marked/marked.min.js'/>
<script src='https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js'/>
<script src='https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js'/>
```

### 4. Gunakan Versi Tertentu untuk Produksi

Untuk stabilitas, gunakan versi tertentu:

```html
<script src='https://cdn.jsdelivr.net/gh/santrilogyapp/ai-santrilogy-for-blogger@v1.0.0/js/main.js'/>
```

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