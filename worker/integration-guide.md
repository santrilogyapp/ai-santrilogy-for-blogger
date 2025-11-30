# Integrasi Template Blogger dengan Cloudflare Workers

## Ikhtisar

Dokumentasi ini menjelaskan cara mengganti komponen Firebase langsung di template Blogger Santrilogy AI dengan komunikasi yang aman melalui Cloudflare Workers.

## Sebelum Anda Memulai

Pastikan Anda sudah:
1. Mempunyai Cloudflare Worker yang sudah dideploy
2. Mengkonfigurasi semua environment variables di Worker
3. Mempunyai endpoint API yang berfungsi

## Langkah 1: Ganti Referensi Firebase dengan Cloudflare D1 + JWT

### Hapus dari Template Blogger:
- Semua skrip Firebase SDK
- Semua panggilan `window.firebaseX`
- Konfigurasi Firebase langsung

### Gantilah dengan:
- Skrip `worker-integration.js` yang baru
- Panggilan API ke Cloudflare Worker dengan D1 + JWT

## Langkah 2: Update Konfigurasi Worker

Edit file `safe-template.js` dan ganti URL worker:

```javascript
var CLOUDFLARE_WORKER_CONFIG = {
    BASE_URL: "https://nama-worker-anda.your-account.workers.dev", // GANTI INI
    // ... endpoint lainnya
};
```

## Langkah 3: Ganti Fungsi Firebase

### Dari:
```javascript
// Kode lama
window.firebaseSaveSession(sessionId, title, messages)
```

### Ke:
```javascript
// Kode baru
saveSessionSecurely(sessionId, title, messages)
```

### Fungsi yang Digrandong:
- `loadHistorySecurely` → Fungsi untuk mengambil riwayat dari Cloudflare D1
- `saveSessionSecurely` → Fungsi untuk menyimpan sesi ke Cloudflare D1
- `firebaseLoadSession` → Gunakan `SantrilogyWorkerAPI.sessionOperation` dengan action 'get'
- `firebaseDeleteSession` → Gunakan `SantrilogyWorkerAPI.sessionOperation` dengan action 'delete'
- `secureGoogleAuth` → Fungsi otentikasi Google hanya frontend, validasi server dilakukan di worker
- `SantrilogyWorkerAPI.authenticate` → Fungsi untuk otentikasi melalui endpoint worker
- `frontend logout` → Tangani di frontend (hapus lokal storage, dll)

## Langkah 4: Update Template Blogger

### Hapus Skrip Lama:
```html
<!-- Hapus ini dari template -->
<script src='https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js'/>
<script src='https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js'/>
<script src='https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js'/>
<script src='https://cdn.jsdelivr.net/gh/santrilogyapp/ai-santrilogy-for-blogger@v1.0.0/js/firebase.js'/>
```

### Ganti dengan:
```html
<!-- Tambahkan ini -->
<script src='https://cdn.jsdelivr.net/gh/santrilogyapp/ai-santrilogy-for-blogger@v1.0.0/js/main.js'/>
<script src='https://cdn.jsdelivr.net/gh/santrilogyapp/ai-santrilogy-for-blogger@v1.0.0/js/utils.js'/>
<!-- Tambahkan safe-template setelah ini -->
<script>
// Sisipkan isi dari safe-template.js di sini
// Atau load sebagai file CDN terpisah
</script>
```

## Langkah 5: Update Fungsi-fungsi di main.js

Anda perlu memperbarui beberapa fungsi di main.js untuk menggunakan API worker baru:

```javascript
// Di file main.js, ganti fungsi-fungsi yang memanggil Firebase langsung

// Ganti loadHistoryFromFirestore
async function loadHistoryFromFirestore() {
    // Ganti implementasi lama dengan:
    try {
        const userId = getCurrentUserId();
        const result = await SantrilogyWorkerAPI.getHistory(userId);
        return result.history || [];
    } catch (error) {
        console.error('Load history error:', error);
        return [];
    }
}

// Ganti saveToFirestore
async function saveToFirestore(sessionId, title, messages) {
    try {
        const userId = getCurrentUserId();
        const result = await SantrilogyWorkerAPI.sessionOperation(
            sessionId, userId, 'save', {title, messages}
        );
        return result.success;
    } catch (error) {
        console.error('Save session error:', error);
        return false;
    }
}
```

## Langkah 6: Testing

### Uji Endpoint API:
1. Pastikan semua endpoint worker berfungsi
2. Periksa CORS headers
3. Validasi respons data

### Uji Fungsi Aplikasi:
1. Login/registrasi
2. Kirim pesan
3. Muat histori
4. Simpan sesi
5. Hapus sesi

## Penanganan Error

### Kesalahan Umum:
- **CORS Error**: Periksa origin yang diizinkan di worker
- **Network Error**: Pastikan URL worker benar
- **Auth Error**: Validasi token dan session

### Logging:
Tambahkan logging di worker untuk debugging:
```javascript
console.log('Request received:', request.url);
console.log('Request body:', await request.text());
```

## Keamanan Tambahan

### Rate Limiting:
Pertimbangkan untuk menambahkan rate limiting di worker:
```javascript
// Di worker Anda
const ip = request.headers.get('CF-Connecting-IP');
// Implementasi rate limiting berdasarkan IP
```

### Validasi Input:
Pastikan semua input divalidasi di worker sebelum diproses lebih lanjut.

## Performa

### Caching:
Pertimbangkan untuk menambahkan caching di worker untuk permintaan yang sering:
```javascript
// Gunakan KV namespace untuk caching
const cached = await CACHE.get(key);
if (cached) return new Response(cached);
```

### Compression:
Aktifkan compression di worker untuk mengurangi ukuran respons.

---
*Dengan mengikuti panduan ini, template Blogger Anda akan berkomunikasi dengan sistem yang lebih aman melalui Cloudflare Workers, menjaga semua kredensial sensitif tetap terlindungi.*