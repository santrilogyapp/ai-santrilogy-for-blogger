// ========== SANTRILOGY AI - VERSI AMAN UNTUK CLOUDFLARE WORKERS ==========

// Konfigurasi untuk komunikasi dengan Cloudflare Worker
var CLOUDFLARE_WORKER_CONFIG = {
    BASE_URL: "https://worker-santrilogy-ai.santrilogyapp.workers.dev", // GANTI DENGAN URL WORKER ANDA
    ENDPOINTS: {
        CHAT: '/api/chat',
        HISTORY: '/api/history',
        SESSION: '/api/session',
        AUTH: '/api/auth'
    }
};

// Fungsi untuk berkomunikasi dengan Cloudflare Worker
var SantrilogyWorkerAPI = {
    // Kirim pesan ke AI melalui worker
    sendMessage: async function(message, userId, sessionId) {
        try {
            const response = await fetch(CLOUDFLARE_WORKER_CONFIG.BASE_URL + CLOUDFLARE_WORKER_CONFIG.ENDPOINTS.CHAT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    userId: userId,
                    sessionId: sessionId
                })
            });
            
            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Send message error:', error);
            throw error;
        }
    },

    // Ambil histori chat melalui worker
    getHistory: async function(userId) {
        try {
            const response = await fetch(`${CLOUDFLARE_WORKER_CONFIG.BASE_URL}${CLOUDFLARE_WORKER_CONFIG.ENDPOINTS.HISTORY}?userId=${userId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Get history error:', error);
            throw error;
        }
    },

    // Operasi sesi melalui worker
    sessionOperation: async function(sessionId, userId, action, sessionData = null) {
        try {
            const response = await fetch(CLOUDFLARE_WORKER_CONFIG.BASE_URL + CLOUDFLARE_WORKER_CONFIG.ENDPOINTS.SESSION, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sessionId: sessionId,
                    userId: userId,
                    action: action,
                    sessionData: sessionData
                })
            });
            
            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Session operation error:', error);
            throw error;
        }
    },

    // Otentikasi melalui worker
    authenticate: async function(action, email, password, idToken) {
        try {
            const response = await fetch(CLOUDFLARE_WORKER_CONFIG.BASE_URL + CLOUDFLARE_WORKER_CONFIG.ENDPOINTS.AUTH, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: action,
                    email: email,
                    password: password,
                    idToken: idToken
                })
            });
            
            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Authentication error:', error);
            throw error;
        }
    }
};

// Contoh integrasi dengan fungsi-fungsi Santrilogy AI yang ada
// Ganti semua panggilan Firebase langsung dengan panggilan ke SantrilogyWorkerAPI

// Contoh: Ganti firebaseSaveSession
function saveSessionSecurely(sessionId, title, messages) {
    const userId = getCurrentUserId(); // Implementasi fungsi ini sesuai kebutuhan
    return SantrilogyWorkerAPI.sessionOperation(sessionId, userId, 'save', {
        title: title,
        messages: messages,
        timestamp: Date.now()
    });
}

// Contoh: Ganti firebaseLoadHistory
async function loadHistorySecurely() {
    const userId = getCurrentUserId();
    if (!userId) return [];
    
    try {
        const result = await SantrilogyWorkerAPI.getHistory(userId);
        return result.history || [];
    } catch (error) {
        console.error('Failed to load history:', error);
        return [];
    }
}

// Contoh: Ganti firebaseGoogleAuth
async function secureGoogleAuth() {
    // Implementasi login Google di frontend, lalu kirim token ke worker
    // untuk validasi di server side
    // Ini hanya contoh - implementasi sebenarnya tergantung kebutuhan Anda
    console.log('Use frontend auth, then send token to worker for validation');
}

// Fungsi-fungsi utilitas lain tetap sama
// Yang berubah adalah bagian yang berinteraksi dengan Firebase

// Contoh penggunaan dalam konteks chat
async function sendChatMessageSecurely(userMessage, userId, sessionId) {
    try {
        // Tampilkan loading indicator
        showTypingIndicator();
        
        // Kirim melalui Cloudflare Worker
        const response = await SantrilogyWorkerAPI.sendMessage(userMessage, userId, sessionId);
        
        // Sembunyikan loading indicator
        hideTypingIndicator();
        
        // Tampilkan respons AI
        displayAIResponse(response.response);
        
        return response;
    } catch (error) {
        hideTypingIndicator();
        showErrorMessage('Gagal mengirim pesan. Silakan coba lagi.');
        console.error('Chat error:', error);
    }
}

// Fungsi untuk mendapatkan user ID saat ini (sesuaikan dengan implementasi Anda)
function getCurrentUserId() {
    // Implementasi tergantung dari bagaimana Anda mengelola session
    // Bisa dari localStorage, cookie, atau token yang divalidasi di frontend
    return localStorage.getItem('santrilogy_user_id') || 'anonymous_' + Date.now();
}

// Fungsi untuk menampilkan pesan error
function showErrorMessage(message) {
    console.error('Santrilogy AI Error:', message);
    // Tambahkan logika UI untuk menampilkan pesan error
}

// Fungsi untuk menampilkan loading
function showTypingIndicator() {
    // Implementasi UI untuk menunjukkan AI sedang mengetik
    console.log('AI is typing...');
}

// Fungsi untuk menyembunyikan loading
function hideTypingIndicator() {
    // Sembunyikan UI loading
    console.log('AI finished typing');
}

// Fungsi untuk menampilkan respons AI
function displayAIResponse(response) {
    // Implementasi untuk menampilkan respons AI di UI
    console.log('AI Response:', response);
}