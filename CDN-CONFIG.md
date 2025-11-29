# Konfigurasi Penggunaan JS dari CDN

## Cara Menggunakan JS dari CDN di Template Blogger

Setelah file JavaScript dipindahkan ke GitHub, Anda bisa menggunakan CDN untuk mengakses file-file tersebut dari template Blogger.

### 1. Gunakan jsDelivr CDN

Ganti blok JavaScript di template Blogger Anda dengan skrip berikut (urutan penting!):

```html
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

### 2. Versi Spesifik

Untuk stabilitas produksi, gunakan versi spesifik:

```html
<script src='https://cdn.jsdelivr.net/gh/santrilogyapp/ai-santrilogy-for-blogger@v1.0.0/js/main.js'/>
```

### 3. Alternatif CDN

Anda juga bisa menggunakan CDN lain:

**UNPKG:**
```html
<script src='https://unpkg.com/santrilogy-ai-for-blogger@latest/js/main.js'/>
```

**GitHub Pages:**
Jika Anda menggunakan GitHub Pages, file akan tersedia di:
`https://santrilogyapp.github.io/ai-santrilogy-for-blogger/js/main.js`

## Penting: Keamanan API Keys

Sebelum menggunakan template ini di produksi, pastikan untuk:

1. Ganti Firebase config di `firebase.js` dengan konfigurasi Anda sendiri
2. Gunakan Firebase Security Rules yang ketat
3. Jangan tampilkan API keys sensitif di kode client-side

## Struktur Direktori

```
js/
├── main.js          # Fungsi utama aplikasi
├── firebase.js      # Konfigurasi dan fungsi Firebase
└── utils.js         # Fungsi utilitas umum
```

## Memperbarui File JS

Jika Anda memperbarui file JS di repository GitHub, perubahan tersebut akan otomatis tersedia melalui CDN setelah beberapa saat. Untuk penggunaan produksi, disarankan menggunakan versi spesifik untuk menghindari breaking changes.

## Penanganan Error

Jika CDN tidak dapat diakses, tambahkan fallback script:

```html
<script>
if(typeof SantrilogyApp === 'undefined') {
  console.warn('Santrilogy AI script failed to load from CDN, using fallback...');
  // Tambahkan fallback jika diperlukan
}
</script>
```