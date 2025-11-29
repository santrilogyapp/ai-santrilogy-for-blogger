# Panduan Setup Cloudflare Workers untuk Santrilogy AI
## URL Production: https://worker-santrilogy-ai.santrilogyapp.workers.dev

## Ikhtisar

Panduan ini menjelaskan cara mengganti Firebase langsung di template Blogger Santrilogy AI dengan komunikasi aman melalui Cloudflare Workers Anda.

## Endpoint API Tersedia

### 1. Chat Endpoint
- **URL**: `POST https://worker-santrilogy-ai.santrilogyapp.workers.dev/api/chat`
- **Deskripsi**: Kirim pesan ke AI dan simpan percakapan
- **Request Body**:
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

### 2. History Endpoint
- **URL**: `GET https://worker-santrilogy-ai.santrilogyapp.workers.dev/api/history?userId={userId}`
- **Deskripsi**: Ambil histori percakapan pengguna
- **Response**:
```json
{
  "history": [...]
}
```

### 3. Session Endpoint
- **URL**: `POST https://worker-santrilogy-ai.santrilogyapp.workers.dev/api/session`
- **Deskripsi**: Operasi sesi (simpan, muat, hapus)
- **Request Body**:
```json
{
  "sessionId": "id_sesi",
  "userId": "id_pengguna", 
  "action": "get|save|delete",
  "sessionData": {...}
}
```

### 4. Auth Endpoint
- **URL**: `POST https://worker-santrilogy-ai.santrilogyapp.workers.dev/api/auth`
- **Deskripsi**: Operasi otentikasi
- **Request Body**:
```json
{
  "action": "login|signup|verify",
  "email": "email@pengguna.com",
  "password": "password",
  "idToken": "token_otentikasi"
}
```

## Update Template Blogger

### 1. Hapus Skrip Firebase Lama
Hapus atau komen skrip berikut dari template XML Anda:
```xml
<!-- HAPUS ATAU KOMENTARI SKRIP INI -->
<!--
<script src='https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js'/>
<script src='https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js'/>
<script src='https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js'/>
<script src='https://cdn.jsdelivr.net/gh/santrilogyapp/ai-santrilogy-for-blogger@v1.0.0/js/firebase.js'/>
-->
```

### 2. Tambahkan Fungsi Wrapper API
Tambahkan kode berikut ke template Blogger (sebelum skrip utama):
```javascript
// ========== CLOUDFLARE WORKER INTEGRATION ==========
// URL Production: https://worker-santrilogy-ai.santrilogyapp.workers.dev

var CLOUDFLARE_WORKER_CONFIG = {
    BASE_URL: "https://worker-santrilogy-ai.santrilogyapp.workers.dev",
    ENDPOINTS: {
        CHAT: '/api/chat',
        HISTORY: '/api/history', 
        SESSION: '/api/session',
        AUTH: '/api/auth',
        HEALTH: '/health'
    }
};

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
            
            const response = await fetch(CLOUDFLARE_WORKER_CONFIG.BASE_URL + endpoint, config);
            
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

var SantrilogyBackend = {
    sendChat: async function(message, userId, sessionId) {
        return SantrilogyAPI.request(CLOUDFLARE_WORKER_CONFIG.ENDPOINTS.CHAT, 'POST', {
            message: message,
            userId: userId,
            sessionId: sessionId
        });
    },
    
    getHistory: async function(userId) {
        const url = `${CLOUDFLARE_WORKER_CONFIG.ENDPOINTS.HISTORY}?userId=${encodeURIComponent(userId)}`;
        return SantrilogyAPI.request(url, 'GET');
    },
    
    sessionOp: async function(sessionId, userId, action, sessionData = null) {
        return SantrilogyAPI.request(CLOUDFLARE_WORKER_CONFIG.ENDPOINTS.SESSION, 'POST', {
            sessionId: sessionId,
            userId: userId, 
            action: action,
            sessionData: sessionData
        });
    }
};

// Fungsi pengganti Firebase
var FirebaseReplacement = {
    loadHistory: async function() {
        try {
            const userId = this.getCurrentUserId();
            if (!userId) return [];
            
            const result = await SantrilogyBackend.getHistory(userId);
            return (result.history || []).map((item, index) => ({
                id: item.id || `session_${index}`,
                title: item.title || 'Untitled Session',
                messageCount: item.messages?.length || 0,
                timestamp: item.timestamp || Date.now()
            }));
        } catch (error) {
            console.error('Load history error:', error);
            return [];
        }
    },

    saveSession: async function(sessionId, title, messages) {
        try {
            const userId = this.getCurrentUserId();
            const result = await SantrilogyBackend.sessionOp(
                sessionId, userId, 'save', {title, messages}
            );
            return result.success === true;
        } catch (error) {
            console.error('Save session error:', error);
            return false;
        }
    },

    loadSession: async function(sessionId) {
        try {
            const userId = this.getCurrentUserId();
            const result = await SantrilogyBackend.sessionOp(
                sessionId, userId, 'get'
            );
            return result.data || null;
        } catch (error) {
            console.error('Load session error:', error);
            return null;
        }
    },

    deleteSession: async function(sessionId) {
        try {
            const userId = this.getCurrentUserId();
            const result = await SantrilogyBackend.sessionOp(
                sessionId, userId, 'delete'
            );
            return result.success === true;
        } catch (error) {
            console.error('Delete session error:', error);
            return false;
        }
    }
};

FirebaseReplacement.getCurrentUserId = function() {
    let userId = localStorage.getItem('santrilogy_user_id');
    if (!userId) {
        userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('santrilogy_user_id', userId);
    }
    return userId;
};

// Simulasikan fungsi-fungsi firebase agar kompatibel
window.firebaseLoadHistory = FirebaseReplacement.loadHistory;
window.firebaseSaveSession = FirebaseReplacement.saveSession;
window.firebaseLoadSession = FirebaseReplacement.loadSession;
window.firebaseDeleteSession = FirebaseReplacement.deleteSession;
```

### 3. Update Fungsi-fungsi di main.js

Ganti fungsi-fungsi Firebase di file main.js yang dimasukkan ke template dengan panggilan ke API wrapper baru.

## Testing Endpoint

### 1. Test Health Check
```bash
curl https://worker-santrilogy-ai.santrilogyapp.workers.dev/health
```

### 2. Test Chat
```bash
curl -X POST https://worker-santrilogy-ai.santrilogyapp.workers.dev/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Halo, ini test dari template Blogger",
    "userId": "test_user_123",
    "sessionId": "test_session_456"
  }'
```

### 3. Test History
```bash
curl "https://worker-santrilogy-ai.santrilogyapp.workers.dev/api/history?userId=test_user_123"
```

## Troubleshooting

### 1. API Tidak Merespon
- Pastikan semua environment variables telah diset di Cloudflare Workers
- Check logs di dashboard Cloudflare Workers

### 2. CORS Error
- Pastikan origin Anda termasuk dalam ALLOWED_ORIGINS di worker
- Check response headers CORS

### 3. Firebase Functions Tidak Ditemukan
- Pastikan semua fungsi `window.firebaseX` telah diganti
- Pastikan kode wrapper di-load sebelum fungsi yang menggunakan Firebase

## Keamanan

### 1. Production Ready
- URL Cloudflare Worker Anda: `https://worker-santrilogy-ai.santrilogyapp.workers.dev`
- Tidak ada API keys Firebase terekspos di sisi klien
- Semua operasi data melalui backend aman

### 2. Rate Limiting
Pertimbangkan untuk menambahkan rate limiting di Cloudflare Workers untuk mencegah abuse.

---
*Gunakan URL https://worker-santrilogy-ai.santrilogyapp.workers.dev untuk semua komunikasi API di template Blogger Anda.*