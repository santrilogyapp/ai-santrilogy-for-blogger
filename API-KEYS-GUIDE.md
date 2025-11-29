# Panduan Mengganti API Keys Firebase

## Penting: Keamanan API Keys

Firebase API keys **tidak boleh** disertakan di kode client-side yang bisa diakses publik. API keys yang disertakan dalam template asli hanya untuk demonstrasi dan **harus diganti** sebelum deployment ke produksi.

## Langkah-langkah Mengganti API Keys

### 1. Buat Proyek Firebase Baru

1. Kunjungi [Firebase Console](https://console.firebase.google.com/)
2. Klik "Tambah proyek" atau pilih proyek yang sudah ada
3. Setelah proyek dibuat, klik pada ikon "Setelan" (roda gigi) di panel kiri
4. Pilih "Setelan proyek" → "Umum"

### 2. Dapatkan Konfigurasi Firebase Baru

1. Di bagian "SDK setup code", pilih "JavaScript"
2. Salin konfigurasi yang ditampilkan:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "XXXXXXXXXXXX",
  appId: "1:XXXXXXXXXXXX:web:XXXXXXXXXXXXXXXX"
};
```

### 3. Ganti Konfigurasi di Kode

Ganti file `js/firebase.js` dengan konfigurasi baru Anda:

```javascript
const firebaseConfig = {
    apiKey: "SALIN_API_KEY_ANDA_DI_SINI", // GANTI DENGAN API KEY ANDA
    authDomain: "SALIN_AUTH_DOMAIN_ANDA_DI_SINI", // GANTI DENGAN DOMAIN ANDA
    projectId: "SALIN_PROJECT_ID_ANDA_DI_SINI", // GANTI DENGAN PROJECT ID ANDA
    storageBucket: "SALIN_STORAGE_BUCKET_ANDA_DI_SINI", // GANTI DENGAN STORAGE BUCKET ANDA
    messagingSenderId: "SALIN_MESSAGING_SENDER_ID_ANDA_DI_SINI", // GANTI DENGAN SENDER ID ANDA
    appId: "SALIN_APP_ID_ANDA_DI_SINI" // GANTI DENGAN APP ID ANDA
};
```

### 4. Atur Firebase Security Rules

Pastikan untuk mengatur Security Rules yang ketat:

1. Pergi ke "Firestore Database" di Firebase Console
2. Klik "Aturan" dan ganti dengan aturan berikut:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/sessions/{sessionId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

3. Klik "Terbitkan" untuk menyimpan perubahan

### 5. Atur Otentikasi Firebase

1. Di Firebase Console, pilih "Authentication"
2. Klik "Metode login"
3. Aktifkan provider yang ingin Anda gunakan (email/password, Google, dll.)
4. Atur domain yang sah di bagian "Domain yang sah" (Authorized domains)

### 6. Ganti Worker URL

Ganti URL worker di file `js/main.js`:

```javascript
// Ganti dengan URL worker Anda sendiri
var CONFIG = {
    WORKER_URL: "https://your-worker-url.workers.dev/", // GANTI INI
    // ... konfigurasi lainnya
};
```

## Cara Aman Menyimpan API Keys (Opsional)

Jika Anda ingin menyimpan API keys secara lebih aman, Anda bisa:

### 1. Gunakan Environment Variables di Server Build

Jika menggunakan build system (seperti Webpack, Vite, dll), gunakan environment variables:

```javascript
const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    // ... dll
};
```

### 2. Gunakan Server-side Template

Jika menggunakan sistem templating di server, sisipkan konfigurasi secara dinamis:

```html
<script>
const firebaseConfig = {
    apiKey: "{{FIREBASE_API_KEY}}",
    authDomain: "{{FIREBASE_AUTH_DOMAIN}}",
    // ... dll
};
</script>
```

## Verifikasi Penggantian

Setelah mengganti API keys:

1. Uji fungsi login dan registrasi
2. Uji penyimpanan dan pengambilan riwayat chat
3. Pastikan tidak ada error di console browser
4. Verifikasi bahwa hanya pengguna terotentikasi yang bisa mengakses data mereka sendiri

## Troubleshooting

### API Keys Masih Bocor di Kode
- Periksa kembali semua file JavaScript untuk API keys
- Gunakan `grep` atau fitur find untuk mencari API key di semua file:

```bash
grep -r "AIzaSy" /path/to/your/project
```

### Error Firebase Setelah Penggantian
- Pastikan semua konfigurasi benar dan tidak ada yang terlewat
- Periksa apakah domain Anda sudah ditambahkan ke "Authorized domains"
- Verifikasi bahwa Firebase Security Rules sudah disetel dengan benar

### Fitur Tidak Berfungsi
- Pastikan semua API yang dibutuhkan diaktifkan di Firebase Console
- Periksa apakah billing diaktifkan jika diperlukan
- Verifikasi bahwa Firebase App tidak dihapus atau dinonaktifkan

## Catatan Tambahan

- Simpan konfigurasi asli Anda dengan aman
- Gunakan versi kontrol (Git) dengan hati-hati untuk memastikan API keys tidak masuk ke repository
- Pertimbangkan untuk menggunakan .env files untuk menyimpan konfigurasi lokal
- Lakukan backup konfigurasi sebelum membuat perubahan penting