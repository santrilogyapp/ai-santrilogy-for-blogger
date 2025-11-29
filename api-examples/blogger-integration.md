# Santrilogy AI - Template Blogger Keamanan Terpadu

## Ikhtisar
File ini memberikan panduan tentang cara mengganti Firebase langsung di template Blogger dengan komunikasi yang aman melalui Cloudflare Workers API.

## Konfigurasi API Endpoint

### 1. Update Konfigurasi di Template
Di template Blogger Anda, ganti bagian konfigurasi dengan URL Cloudflare Worker Anda:

```javascript
// Ganti bagian konfigurasi worker di template
var API_CONFIG = {
    BASE_URL: "https://worker-santrilogy-ai.santrilogyapp.workers.dev", // URL PRODUKSI ANDA
    ENDPOINTS: {
        CHAT: '/api/chat',
        HISTORY: '/api/history',
        SESSION: '/api/session',
        AUTH: '/api/auth'
    }
};
```

### 2. Hapus Referensi Firebase dari Template
Hapus atau komen bagian ini dari template Blogger:
```html
<!-- HAPUS ATAU KOMEN INI -->
<!--
<script src='https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js'/>
<script src='https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js'/>
<script src='https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js'/>
<script src='https://cdn.jsdelivr.net/gh/santrilogyapp/ai-santrilogy-for-blogger@v1.0.0/js/firebase.js'/>
-->
```

### 3. Tambahkan Fungsi API Wrapper
Tambahkan fungsi ini ke template Anda (sebelum fungsi-fungsi utama):

```javascript
// API Wrapper Functions
var SantrilogyAPI = {
    request: async function(endpoint, method = 'GET', data = null) {
        try {
            const config = {
                method: method,
                headers: { 'Content-Type': 'application/json' }
            };
            
            if (data && (method === 'POST' || method === 'PUT')) {
                config.body = JSON.stringify(data);
            }
            
            const response = await fetch(API_CONFIG.BASE_URL + endpoint, config);
            
            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API request error:', error);
            throw error;
        }
    }
};

// Fungsi-fungsi pengganti Firebase
var SantrilogyBackend = {
    // Kirim pesan ke AI
    sendChat: async function(message, userId, sessionId) {
        return SantrilogyAPI.request(API_CONFIG.ENDPOINTS.CHAT, 'POST', {
            message: message,
            userId: userId,
            sessionId: sessionId
        });
    },
    
    // Ambil histori chat
    getHistory: async function(userId) {
        const url = `${API_CONFIG.ENDPOINTS.HISTORY}?userId=${encodeURIComponent(userId)}`;
        return SantrilogyAPI.request(url, 'GET');
    },
    
    // Operasi sesi
    sessionOp: async function(sessionId, userId, action, sessionData = null) {
        return SantrilogyAPI.request(API_CONFIG.ENDPOINTS.SESSION, 'POST', {
            sessionId: sessionId,
            userId: userId, 
            action: action,
            sessionData: sessionData
        });
    },
    
    // Otentikasi
    authOp: async function(action, email = null, password = null, idToken = null) {
        return SantrilogyAPI.request(API_CONFIG.ENDPOINTS.AUTH, 'POST', {
            action: action,
            email: email,
            password: password, 
            idToken: idToken
        });
    }
};
```

### 4. Ganti Panggilan Firebase di Fungsi Utama

Ganti fungsi-fungsi di main.js seperti berikut:

```javascript
// GANTI INI:
// async function saveToFirestore(sessionId, title, messages) {
//     return await window.firebaseSaveSession(sessionId, title, messages);
// }

// DENGAN INI:
async function saveToFirestore(sessionId, title, messages) {
    try {
        const userId = getCurrentUserId();
        const result = await SantrilogyBackend.sessionOp(
            sessionId, userId, 'save', {title, messages}
        );
        return result.success;
    } catch (error) {
        console.error('Save session error:', error);
        return false;
    }
}

// GANTI INI:
// async function loadHistoryFromFirestore() {
//     return await window.firebaseLoadHistory();
// }

// DENGAN INI:  
async function loadHistoryFromFirestore() {
    try {
        const userId = getCurrentUserId();
        if (!userId) return [];
        
        const result = await SantrilogyBackend.getHistory(userId);
        return result.history || [];
    } catch (error) {
        console.error('Load history error:', error);
        return [];
    }
}
```

### 5. Fungsi getCurrentUserId()

Implementasi sesuaikan dengan cara Anda mengelola session pengguna:

```javascript
function getCurrentUserId() {
    // Contoh: Dari localStorage
    let userId = localStorage.getItem('santrilogy_user_id');
    
    if (!userId) {
        // Buat user ID anonim jika belum ada
        userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('santrilogy_user_id', userId);
    }
    
    return userId;
}
```

## Keamanan Tambahan

### Validasi di Frontend
Tambahkan validasi sederhana di frontend:
```javascript
function validateMessage(message) {
    if (!message || message.trim().length === 0) {
        return { valid: false, error: 'Pesan tidak boleh kosong' };
    }
    
    if (message.length > 2000) {
        return { valid: false, error: 'Pesan terlalu panjang' };
    }
    
    return { valid: true };
}
```

### Error Handling
Pastikan semua panggilan API dibungkus dengan try-catch:
```javascript
async function safeAPICall(apiFunction, ...args) {
    try {
        return await apiFunction(...args);
    } catch (error) {
        console.error('API call failed:', error);
        // Tampilkan pesan ke pengguna atau fallback
        showErrorMessage('Terjadi kesalahan. Silakan coba lagi.');
        return null;
    }
}
```

## Testing

### Endpoint Testing
Pastikan endpoint API Anda berfungsi dengan baik sebelum integrasi:
- Test `/api/history?userId=test` di browser
- Test POST ke `/api/chat` dengan curl atau Postman
- Verifikasi CORS headers

### Fallback
Pertimbangkan untuk memiliki fallback jika API tidak merespons:
```javascript
// Jika API tidak merespons, mungkin tampilkan pesan bahwa fitur sedang maintenance
```

---
*Dengan mengikuti panduan ini, template Blogger Anda akan berkomunikasi melalui backend API yang aman, menjaga semua kredensial Firebase tetap terlindungi.*