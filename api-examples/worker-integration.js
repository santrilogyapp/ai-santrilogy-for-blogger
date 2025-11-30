// ========== SANTRILOGY AI - KONFIGURASI API CLOUDFLARE WORKERS ==========

// Konfigurasi untuk komunikasi dengan Cloudflare Worker
var CLOUDFLARE_WORKER_CONFIG = {
    BASE_URL: "https://worker-santrilogy-ai.santrilogyapp.workers.dev", // URL PRODUKSI
    ENDPOINTS: {
        CHAT: '/api/chat',
        HISTORY: '/api/history',
        SESSION: '/api/session',
        AUTH: '/api/auth',
        HEALTH: '/health'
    }
};

// Fungsi wrapper untuk komunikasi dengan API
var SantrilogyAPI = {
    request: async function(endpoint, method = 'GET', data = null) {
        try {
            const config = {
                method: method,
                headers: { 
                    'Content-Type': 'application/json',
                }
            };
            
            if (data && (method === 'POST' || method === 'PUT')) {
                config.body = JSON.stringify(data);
            }
            
            const fullUrl = CLOUDFLARE_WORKER_CONFIG.BASE_URL + endpoint;
            console.log('API Request:', fullUrl, config);
            
            const response = await fetch(fullUrl, config);
            
            if (!response.ok) {
                throw new Error(`API Error: ${response.status} - ${response.statusText}`);
            }
            
            const result = await response.json();
            console.log('API Response:', result);
            
            return result;
        } catch (error) {
            console.error('API request error:', error);
            throw error;
        }
    }
};

// API Wrapper Functions - Pengganti fungsi Firebase
var SantrilogyBackend = {
    // Kirim pesan ke AI melalui Cloudflare Worker
    sendChat: async function(message, userId, sessionId) {
        console.log('Sending chat message:', {message, userId, sessionId});
        return SantrilogyAPI.request(CLOUDFLARE_WORKER_CONFIG.ENDPOINTS.CHAT, 'POST', {
            message: message,
            userId: userId,
            sessionId: sessionId
        });
    },
    
    // Ambil histori chat dari Cloudflare Worker
    getHistory: async function(userId) {
        console.log('Getting history for user:', userId);
        const url = `${CLOUDFLARE_WORKER_CONFIG.ENDPOINTS.HISTORY}?userId=${encodeURIComponent(userId)}`;
        return SantrilogyAPI.request(url, 'GET');
    },
    
    // Operasi sesi (simpan, muat, hapus) melalui Cloudflare Worker
    sessionOp: async function(sessionId, userId, action, sessionData = null) {
        console.log('Session operation:', {sessionId, userId, action, sessionData});
        return SantrilogyAPI.request(CLOUDFLARE_WORKER_CONFIG.ENDPOINTS.SESSION, 'POST', {
            sessionId: sessionId,
            userId: userId, 
            action: action,
            sessionData: sessionData
        });
    },
    
    // Otentikasi melalui Cloudflare Worker
    authOp: async function(action, email = null, password = null, idToken = null) {
        console.log('Auth operation:', {action, email});
        return SantrilogyAPI.request(CLOUDFLARE_WORKER_CONFIG.ENDPOINTS.AUTH, 'POST', {
            action: action,
            email: email,
            password: password, 
            idToken: idToken
        });
    }
};

// Fungsi pengganti untuk Firebase di template
var FirebaseReplacement = {
    // Ganti window.firebaseLoadHistory
    loadHistory: async function() {
        try {
            const userId = this.getCurrentUserId();
            if (!userId) return [];
            
            const result = await SantrilogyBackend.getHistory(userId);
            console.log('History loaded:', result);
            
            // Konversi format respons ke format yang diharapkan oleh template
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

    // Ganti window.firebaseSaveSession
    saveSession: async function(sessionId, title, messages) {
        try {
            const userId = this.getCurrentUserId();
            const result = await SantrilogyBackend.sessionOp(
                sessionId, userId, 'save', {title, messages}
            );
            console.log('Session saved:', result);
            return result.success === true;
        } catch (error) {
            console.error('Save session error:', error);
            return false;
        }
    },

    // Ganti window.firebaseLoadSession
    loadSession: async function(sessionId) {
        try {
            const userId = this.getCurrentUserId();
            const result = await SantrilogyBackend.sessionOp(
                sessionId, userId, 'get'
            );
            console.log('Session loaded:', result);
            return result.data || null;
        } catch (error) {
            console.error('Load session error:', error);
            return null;
        }
    },

    // Ganti window.firebaseDeleteSession
    deleteSession: async function(sessionId) {
        try {
            const userId = this.getCurrentUserId();
            const result = await SantrilogyBackend.sessionOp(
                sessionId, userId, 'delete'
            );
            console.log('Session deleted:', result);
            return result.success === true;
        } catch (error) {
            console.error('Delete session error:', error);
            return false;
        }
    }
};

// Fungsi untuk mendapatkan user ID saat ini
FirebaseReplacement.getCurrentUserId = function() {
    // Coba ambil dari localStorage
    let userId = localStorage.getItem('santrilogy_user_id');
    
    if (!userId) {
        // Buat user ID baru jika tidak ditemukan
        userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('santrilogy_user_id', userId);
    }
    
    return userId;
};

// Test endpoint untuk verifikasi koneksi
FirebaseReplacement.testConnection = async function() {
    try {
        const result = await SantrilogyAPI.request(CLOUDFLARE_WORKER_CONFIG.ENDPOINTS.HEALTH, 'GET');
        console.log('Worker connection test successful:', result);
        return true;
    } catch (error) {
        console.error('Worker connection test failed:', error);
        return false;
    }
};

// Inisialisasi dan test koneksi
console.log('Santrilogy AI - Cloudflare Worker Integration Loaded');
console.log('Worker URL:', CLOUDFLARE_WORKER_CONFIG.BASE_URL);

// Test koneksi saat inisialisasi (opsional)
// FirebaseReplacement.testConnection();

// Export untuk digunakan oleh fungsi-fungsi di template
// Simulasikan fungsi-fungsi firebase agar template tetap kompatibel
window.firebaseLoadHistory = FirebaseReplacement.loadHistory;
window.firebaseSaveSession = FirebaseReplacement.saveSession;
window.firebaseLoadSession = FirebaseReplacement.loadSession;
window.firebaseDeleteSession = FirebaseReplacement.deleteSession;