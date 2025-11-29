# Panduan Keamanan Santrilogy AI

## 1. API Keys dan Konfigurasi Sensitif

### JANGAN MASUKKAN KE KODE CLIENT-SIDE
- API keys Firebase tidak boleh disertakan di file JavaScript yang bisa diakses publik
- Gunakan environment variables di sisi server
- Jangan pernah commit API keys ke repository publik

### Ganti Konfigurasi Default
File `firebase.js` saat ini berisi konfigurasi default yang harus diganti:

```javascript
// SEGERA GANTI KONFIGURASI INI DENGAN KONFIGURASI ANDA SENDIRI
const firebaseConfig = {
    apiKey: "AIzaSyDkz6cMrzMpqaqHgXXUges15kO_TuqSTT8", // GANTI INI
    authDomain: "santrilogy-ai.firebaseapp.com",        // GANTI INI
    projectId: "santrilogy-ai",                         // GANTI INI
    // ... dll
};
```

## 2. Firebase Security Rules

### Firestore Rules
Pastikan untuk mengimplementasikan aturan keamanan Firebase berikut:

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Hanya pengguna terotentikasi yang bisa mengakses data mereka sendiri
    match /users/{userId}/sessions/{sessionId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Authentication
- Batasi provider otentikasi yang diperbolehkan
- Aktifkan verifikasi email jika diperlukan
- Gunakan multi-factor authentication jika memungkinkan

## 3. Content Security Policy (CSP)

Tambahkan kebijakan CSP di template Blogger Anda:

```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://www.gstatic.com https://*.firebase.com https://*.googleapis.com https://cdnjs.cloudflare.com;
               style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
               font-src 'self' https://fonts.gstatic.com;
               img-src 'self' data: https:;
               connect-src 'self' https://*.santrilogyapp.workers.dev https://*.googleapis.com https://*.firebase.com;">
```

## 4. Input Validation

### Validasi dari Client-side
```javascript
// Validasi input sebelum mengirim ke server
function validateInput(text) {
    if (!text || text.trim().length === 0) return false;
    if (text.length > 10000) return false; // Batasi panjang input
    return true;
}
```

### Sanitasi Output
Pastikan semua output yang ditampilkan di layar disanitasi untuk mencegah XSS.

## 5. Penanganan Error

### Jangan Tampilkan Error Detail ke Pengguna
```javascript
// JANGAN
console.error(error); // Ini bisa bocorkan informasi sensitif

// SEBAIKNYA
if (process.env.NODE_ENV === 'production') {
    console.error('Terjadi kesalahan'); // Pesan umum
} else {
    console.error(error); // Hanya untuk development
}
```

## 6. CDN dan Third-party Libraries

### Gunakan Versi Tertentu
```html
<!-- Gunakan versi tertentu untuk keamanan -->
<script src='https://cdn.jsdelivr.net/npm/marked@4.3.0/marked.min.js'></script>
```

### Verifikasi Integritas
Gunakan Subresource Integrity (SRI) bila memungkinkan:
```html
<script src='...' integrity='sha384-...' crossorigin='anonymous'></script>
```

## 7. API Communication

### Worker Endpoint Security
- Gunakan API key validasi untuk endpoint worker Anda
- Batasi rate limit untuk mencegah abuse
- Gunakan HTTPS untuk semua komunikasi

## 8. Data Pengguna

### Jangan Simpan Data Sensitif
- Jangan simpan informasi pribadi sensitif di localStorage
- Gunakan enkripsi untuk data yang disimpan secara lokal
- Ikuti regulasi privasi data yang berlaku (GDPR, etc)

## 9. Deployment Checklist

Sebelum deployment ke produksi:
- [ ] Ganti semua API keys default
- [ ] Implementasi Firebase Security Rules
- [ ] Gunakan konfigurasi produksi
- [ ] Nonaktifkan console logs yang tidak perlu
- [ ] Uji semua fungsi otentikasi
- [ ] Cek validasi input
- [ ] Uji kebijakan keamanan CORS

## 10. Monitoring dan Logging

- Gunakan layanan monitoring untuk mendeteksi aktivitas mencurigakan
- Log aktivitas penting di sisi server, bukan client
- Tetapkan alert untuk percobaan akses yang mencurigakan

## 11. Backup dan Recovery

- Backup konfigurasi dan data penting secara berkala
- Siapkan prosedur recovery bencana
- Uji restore data secara berkala

## 12. Update dan Pemeliharaan

- Secara rutin perbarui dependencies untuk patch keamanan
- Pantau advisories keamanan untuk library yang digunakan
- Lakukan audit keamanan berkala