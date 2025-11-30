// ========== SANTRILOGY AI - CLOUDFLARE AUTH INTEGRATION WITH DEBUG ==========
// File integrasi baru untuk sistem autentikasi berbasis Cloudflare Workers + D1 (dengan debug)

// Konfigurasi untuk komunikasi dengan API auth berbasis Cloudflare
var CLOUDFLARE_AUTH_CONFIG = {
    BASE_URL: "https://worker-santrilogy-ai.santrilogyapp.workers.dev", // GANTI DENGAN URL WORKER ANDA YANG SEBENARNYA
    ENDPOINTS: {
        CHAT: '/api/chat',
        HISTORY: '/api/history',
        SESSION: '/api/session',
        AUTH: {
            REGISTER: '/auth/register',
            LOGIN: '/auth/login',
            VERIFY: '/auth/verify',
            LOGOUT: '/auth/logout',
            GOOGLE: '/auth/google',
            HEALTH: '/health'  // Endpoint health adalah di root, bukan /auth/health
        }
    }
};

// Fungsi wrapper untuk komunikasi dengan API dengan debug
var SantrilogyAPI = {
    request: async function(endpoint, method = 'GET', data = null, includeAuth = false) {
        try {
            const config = {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                }
            };

            // Tambahkan header autentikasi jika diminta dan token tersedia
            if (includeAuth) {
                const token = localStorage.getItem('santrilogy_auth_token');
                if (token) {
                    config.headers['Authorization'] = `Bearer ${token}`;
                    console.log('Using token for request:', token.substring(0, 10) + '...');
                } else {
                    console.warn('Token tidak ditemukan untuk permintaan otentikasi');
                }
            }

            if (data && (method === 'POST' || method === 'PUT')) {
                config.body = JSON.stringify(data);
            }

            const fullUrl = CLOUDFLARE_AUTH_CONFIG.BASE_URL + endpoint;
            console.log('API Request:', fullUrl, config);

            const response = await fetch(fullUrl, config);
            console.log('Response status:', response.status);

            // Baca response text dulu untuk debugging
            const responseText = await response.text();
            console.log('Raw response:', responseText);

            // Cek jika response 401 (unauthorized), logout user
            if (response.status === 401) {
                console.log('Received 401, logging out user');
                handleAuthFailure();
                throw new Error('Sesi habis, silakan login kembali');
            }

            if (!response.ok) {
                console.error('Response not ok:', response.status, response.statusText);
                throw new Error(`API Error: ${response.status} - ${response.statusText}`);
            }

            // Coba parse JSON
            let result;
            try {
                result = JSON.parse(responseText);
            } catch (parseError) {
                console.error('JSON parse error:', parseError);
                console.log('Response text that failed to parse:', responseText);
                throw new Error('Invalid JSON response from server');
            }

            console.log('Parsed API Response:', result);

            return result;
        } catch (error) {
            console.error('API request error:', error);
            throw error;
        }
    }
};

// Fungsi untuk mengupdate status button loading
function updateAuthButtonState(isLoading, originalText = null) {
    const submitBtn = document.getElementById('authSubmitBtn');
    if (!submitBtn) return;

    if (isLoading) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Memproses...';
    } else {
        submitBtn.disabled = false;
        if (originalText) {
            submitBtn.textContent = originalText;
        }
    }
}

// Update email auth function - use Cloudflare D1 + JWT auth (no Firebase)
window.firebaseEmailAuth = async function(email, password, authMode) {
    console.log('handleEmailAuth called with:', {email, authMode});
    const originalButtonText = document.getElementById('authSubmitBtn')?.textContent || '';

    try {
        // Tampilkan loading state
        updateAuthButtonState(true, originalButtonText);

        let endpoint, data;
        if (authMode === 'register') {
            endpoint = CLOUDFLARE_AUTH_CONFIG.ENDPOINTS.AUTH.REGISTER;
            data = {
                email: email || '',
                password: password || '',
                name: (email.split('@')[0] || 'User').trim()
            };
            console.log('Registering with data:', data);
        } else {
            endpoint = CLOUDFLARE_AUTH_CONFIG.ENDPOINTS.AUTH.LOGIN;
            data = {
                email: email || '',
                password: password || ''
            };
            console.log('Logging in with data:', data);
        }

        const response = await SantrilogyAPI.request(endpoint, 'POST', data);

        console.log('Auth response received:', response);

        if (response.success && response.token) {
            // Simpan token ke localStorage
            localStorage.setItem('santrilogy_auth_token', response.token);

            // Simpan user info ke localStorage
            localStorage.setItem('santrilogy_user', JSON.stringify(response.user));

            // Update UI
            if (window.SantrilogyApp && typeof window.SantrilogyApp.updateUserUI === 'function') {
                window.SantrilogyApp.updateUserUI(response.user);

                if (typeof window.SantrilogyApp.closeModal === 'function') {
                    window.SantrilogyApp.closeModal('authModal');
                }

                const successMsg = authMode === 'register' ? "Akun berhasil dibuat! 🎉" : "Selamat datang kembali! 👋";
                if (typeof window.SantrilogyApp.showToast === 'function') {
                    window.SantrilogyApp.showToast(successMsg, "success");
                }
            }

            // Muat history otomatis setelah login
            if (typeof window.SantrilogyApp.loadHistoryFromFirestore === 'function') {
                setTimeout(() => {
                    window.SantrilogyApp.loadHistoryFromFirestore();
                }, 500);
            }
        } else {
            // Tangani error dari API
            const errorMsg = response.error || response.message || "Login gagal, silakan coba lagi";
            if (window.SantrilogyApp && typeof window.SantrilogyApp.showToast === 'function') {
                window.SantrilogyApp.showToast(errorMsg, "error");
            }
            throw new Error(errorMsg);
        }
    } catch (error) {
        console.error('Email auth error:', error);

        // Tampilkan error ke user
        const errorMsg = error.message || "Terjadi kesalahan saat login";
        if (window.SantrilogyApp && typeof window.SantrilogyApp.showToast === 'function') {
            window.SantrilogyApp.showToast(errorMsg, "error");
        }
    } finally {
        // Kembalikan button state
        updateAuthButtonState(false, originalButtonText);
    }
};

// Google auth - Cloudflare D1 + JWT only
window.firebaseGoogleAuth = async function() {
    try {
        // ONLY use Cloudflare worker for Google OAuth (secure approach)
        console.log('Using worker for Google authentication request');

        // Redirect to worker for Google OAuth flow, include origin for redirect
        const origin = window.location.origin || window.location.protocol + "//" + window.location.hostname + (window.location.port ? ':' + window.location.port : '');
        const googleAuthUrl = `${CLOUDFLARE_AUTH_CONFIG.BASE_URL}${CLOUDFLARE_AUTH_CONFIG.ENDPOINTS.AUTH.GOOGLE}?origin=${encodeURIComponent(origin)}`;
        window.location.href = googleAuthUrl;
    } catch (e) {
        console.error('Google auth error:', e);
        if (window.SantrilogyApp && typeof window.SantrilogyApp.showToast === 'function') {
            window.SantrilogyApp.showToast(e.message || "Terjadi kesalahan saat login Google", "error");
        }
    }
};

// Check for token in URL hash and process it
function checkForTokenInUrl() {
    const hash = window.location.hash.substring(1);
    if (hash) {
        console.log('Found hash in URL:', hash);
        const params = new URLSearchParams(hash);
        const token = params.get('auth_token');
        const userParam = params.get('user');

        if (token) {
            console.log('Found auth token in URL hash');
            // Simpan token
            localStorage.setItem('santrilogy_auth_token', token);

            // Simpan user data jika ada
            if (userParam) {
                try {
                    const userData = JSON.parse(decodeURIComponent(userParam));
                    localStorage.setItem('santrilogy_user', JSON.stringify(userData));

                    // Update UI
                    if (window.SantrilogyApp && typeof window.SantrilogyApp.updateUserUI === 'function') {
                        window.SantrilogyApp.updateUserUI(userData);
                        if (typeof window.SantrilogyApp.showToast === 'function') {
                            window.SantrilogyApp.showToast("Login berhasil dengan Google! 🎉", "success");
                        }
                    }

                    // Muat history
                    if (typeof window.SantrilogyApp.loadHistoryFromFirestore === 'function') {
                        setTimeout(() => {
                            window.SantrilogyApp.loadHistoryFromFirestore();
                        }, 500);
                    }
                } catch (e) {
                    console.error('Error parsing user data from URL:', e);
                }
            }

            // Hapus hash dari URL
            history.replaceState('', document.title, window.location.pathname + window.location.search);
        }
    }
}


// Logout function - only clear local storage (Cloudflare worker handles server-side cleanup if needed)
window.firebaseLogout = async function() {
    try {
        // Panggil endpoint logout (walaupun untuk JWT stateless, kita tetap bisa panggil untuk logging)
        await SantrilogyAPI.request(CLOUDFLARE_AUTH_CONFIG.ENDPOINTS.AUTH.LOGOUT, 'POST', null, true);
    } catch (error) {
        console.warn('Logout API call failed, continuing with local cleanup:', error);
        // Lanjutkan dengan membersihkan lokal meskipun API gagal
    } finally {
        // Hapus data auth dari localStorage
        localStorage.removeItem('santrilogy_auth_token');
        localStorage.removeItem('santrilogy_user');

        // Update UI
        if (window.SantrilogyApp && typeof window.SantrilogyApp.updateUserUI === 'function') {
            window.SantrilogyApp.updateUserUI(null);

            if (typeof window.SantrilogyApp.showToast === 'function') {
                window.SantrilogyApp.showToast("Berhasil logout! 👋", "success");
            }
        }
    }
};

// Fungsi untuk cek status auth saat page load (session persistence)
function checkAuthStatus() {
    const token = localStorage.getItem('santrilogy_auth_token');

    if (token) {
        console.log('Found token, attempting verification...');
        verifyAuthToken();
    }
}

// Fungsi untuk verify token dan restore session
async function verifyAuthToken() {
    const token = localStorage.getItem('santrilogy_auth_token');

    if (token) {
        try {
            const response = await SantrilogyAPI.request(CLOUDFLARE_AUTH_CONFIG.ENDPOINTS.AUTH.VERIFY, 'POST', null, true);

            console.log('Token verification response:', response);

            if (response.success && response.user) {
                localStorage.setItem('santrilogy_user', JSON.stringify(response.user));

                if (window.SantrilogyApp && typeof window.SantrilogyApp.updateUserUI === 'function') {
                    window.SantrilogyApp.updateUserUI(response.user);
                }
            } else {
                // Token tidak valid, logout
                console.log('Token not valid, logging out');
                handleAuthFailure();
            }
        } catch (error) {
            console.error('Token verification failed:', error);
            handleAuthFailure();
        }
    } else {
        console.log('No token found in localStorage');
    }
}

// Handler untuk kegagalan autentikasi
function handleAuthFailure() {
    localStorage.removeItem('santrilogy_auth_token');
    localStorage.removeItem('santrilogy_user');

    if (window.SantrilogyApp && typeof window.SantrilogyApp.updateUserUI === 'function') {
        window.SantrilogyApp.updateUserUI(null);
    }
}


// API Wrapper Functions - Pengganti fungsi Firebase (now using Cloudflare D1 + JWT)
var SantrilogyBackend = {
    // Kirim pesan ke AI melalui Cloudflare Worker
    sendChat: async function(message, userId, sessionId) {
        console.log('Sending chat message:', {message, userId, sessionId});
        return SantrilogyAPI.request(CLOUDFLARE_AUTH_CONFIG.ENDPOINTS.CHAT, 'POST', {
            message: message,
            userId: userId,
            sessionId: sessionId
        }, true); // include auth token
    },

    // Ambil histori chat dari Cloudflare Worker
    getHistory: async function(userId) {
        console.log('Getting history for user:', userId);
        return SantrilogyAPI.request(CLOUDFLARE_AUTH_CONFIG.ENDPOINTS.HISTORY, 'GET', null, true);
    },

    // Operasi sesi (simpan, muat, hapus) melalui Cloudflare Worker
    sessionOp: async function(sessionId, userId, action, sessionData = null) {
        console.log('Session operation:', {sessionId, userId, action, sessionData});
        return SantrilogyAPI.request(CLOUDFLARE_AUTH_CONFIG.ENDPOINTS.SESSION, 'POST', {
            sessionId: sessionId,
            action: action,
            sessionData: sessionData
        }, true);
    }
};

// Fungsi pengganti untuk Firebase dengan Cloudflare D1 + JWT
var CloudflareD1Replacement = {
    // Ganti window.firebaseLoadHistory
    loadHistory: async function() {
        try {
            console.log('Attempting to load history from Cloudflare D1 + JWT...');
            const result = await SantrilogyBackend.getHistory();
            console.log('History loaded from Cloudflare D1 + JWT:', result);

            // Konversi format respons ke format yang diharapkan oleh template
            return (result.history || []).map((item, index) => ({
                id: item.id || `session_${index}`,
                userMessage: item.userMessage,
                aiResponse: item.aiResponse,
                timestamp: item.createdAt,
                title: (item.userMessage || '').substring(0, 35) + ((item.userMessage || '').length > 35 ? '...' : '')
            }));
        } catch (error) {
            console.error('Load history error:', error);
            // Fallback to localStorage if API fails
            try {
                const user = JSON.parse(localStorage.getItem('santrilogy_user') || null);
                const userId = user ? `user_${user.id}` : 'guest';
                const history = JSON.parse(localStorage.getItem(`santrilogy_history_${userId}`) || '[]');
                console.log('Loaded history from localStorage:', history);
                return history;
            } catch (e) {
                console.error('Fallback history load failed:', e);
                return [];
            }
        }
    },

    // Ganti window.firebaseSaveSession
    saveSession: async function(sessionId, title, messages) {
        try {
            console.log('Attempting to save session to Cloudflare D1 + JWT:', {sessionId, title});
            const result = await SantrilogyBackend.sessionOp(
                sessionId, null, 'save', {title, messages}
            );
            console.log('Session saved to Cloudflare D1 + JWT:', result);
            return result.success === true;
        } catch (error) {
            console.error('Save session error:', error);
            // Fallback to localStorage if API fails
            try {
                const user = JSON.parse(localStorage.getItem('santrilogy_user') || null);
                const userId = user ? `user_${user.id}` : 'guest';

                // Save to local cache
                let cache = {};
                try {
                    cache = JSON.parse(localStorage.getItem(`santrilogy_cache_${userId}`) || '{}');
                } catch(e) {
                    cache = {};
                }

                cache[sessionId] = {
                    title: title,
                    messages: messages,
                    timestamp: Date.now()
                };

                localStorage.setItem(`santrilogy_cache_${userId}`, JSON.stringify(cache));

                // Juga update history
                let history = [];
                try {
                    history = JSON.parse(localStorage.getItem(`santrilogy_history_${userId}`) || '[]');
                } catch(e) {
                    history = [];
                }

                const existingIndex = history.findIndex(item => item.id === sessionId);
                if (existingIndex >= 0) {
                    history[existingIndex].title = title;
                    history[existingIndex].timestamp = Date.now();
                } else {
                    history.unshift({
                        id: sessionId,
                        title: title,
                        timestamp: Date.now()
                    });
                }

                if (history.length > 50) history = history.slice(0, 50);
                localStorage.setItem(`santrilogy_history_${userId}`, JSON.stringify(history));

                console.log('Saved session to localStorage');
                return true;
            } catch (e) {
                console.error('Fallback session save failed:', e);
                return false;
            }
        }
    },

    // Ganti window.firebaseLoadSession
    loadSession: async function(sessionId) {
        try {
            console.log('Attempting to load session from Cloudflare:', sessionId);
            const result = await SantrilogyBackend.sessionOp(
                sessionId, null, 'get'
            );
            console.log('Session loaded from Cloudflare:', result);
            return result.data || null;
        } catch (error) {
            console.error('Load session error:', error);
            // Fallback to localStorage if API fails
            try {
                const user = JSON.parse(localStorage.getItem('santrilogy_user') || null);
                const userId = user ? `user_${user.id}` : 'guest';

                let cache = {};
                try {
                    cache = JSON.parse(localStorage.getItem(`santrilogy_cache_${userId}`) || '{}');
                } catch(e) {
                    cache = {};
                }

                const session = cache[sessionId] || null;
                console.log('Loaded session from localStorage:', session);
                return session;
            } catch (e) {
                console.error('Fallback session load failed:', e);
                return null;
            }
        }
    },

    // Ganti window.firebaseDeleteSession
    deleteSession: async function(sessionId) {
        try {
            console.log('Attempting to delete session from Cloudflare:', sessionId);
            const result = await SantrilogyBackend.sessionOp(
                sessionId, null, 'delete'
            );
            console.log('Session deleted from Cloudflare:', result);
            return result.success === true;
        } catch (error) {
            console.error('Delete session error:', error);
            // Fallback to localStorage if API fails
            try {
                const user = JSON.parse(localStorage.getItem('santrilogy_user') || null);
                const userId = user ? `user_${user.id}` : 'guest';

                // Hapus dari cache
                let cache = {};
                try {
                    cache = JSON.parse(localStorage.getItem(`santrilogy_cache_${userId}`) || '{}');
                } catch(e) {
                    cache = {};
                }

                delete cache[sessionId];
                localStorage.setItem(`santrilogy_cache_${userId}`, JSON.stringify(cache));

                // Hapus dari history
                let history = [];
                try {
                    history = JSON.parse(localStorage.getItem(`santrilogy_history_${userId}`) || '[]');
                } catch(e) {
                    history = [];
                }

                history = history.filter(item => item.id !== sessionId);
                localStorage.setItem(`santrilogy_history_${userId}`, JSON.stringify(history));

                console.log('Deleted session from localStorage');
                return true;
            } catch (e) {
                console.error('Fallback session delete failed:', e);
                return false;
            }
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
        // Gunakan endpoint health yang benar
        const response = await fetch(CLOUDFLARE_AUTH_CONFIG.BASE_URL + '/health', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (response.ok) {
            const result = await response.json();
            console.log('Worker connection test successful:', result);
            return true;
        } else {
            console.error('Health check failed with status:', response.status);
            return false;
        }
    } catch (error) {
        console.error('Worker connection test failed:', error);
        return false;
    }
};

// Inisialisasi dan test koneksi
console.log('Santrilogy AI - Cloudflare D1 + JWT Authentication Integration Loaded');
console.log('Worker URL:', CLOUDFLARE_AUTH_CONFIG.BASE_URL);

// Export untuk digunakan oleh fungsi-fungsi di template
// Simulasikan fungsi-fungsi Cloudflare D1 + JWT agar template tetap kompatibel
window.firebaseLoadHistory = CloudflareD1Replacement.loadHistory;
window.firebaseSaveSession = CloudflareD1Replacement.saveSession;
window.firebaseLoadSession = CloudflareD1Replacement.loadSession;
window.firebaseDeleteSession = CloudflareD1Replacement.deleteSession;

// Pastikan semua fungsi autentikasi siap sebelum main.js menggunakannya
function ensureAuthFunctionsAreReady() {
    // Daftar fungsi autentikasi Cloudflare D1 + JWT yang harus tersedia
    const requiredAuthFunctions = [
        'firebaseLoadHistory',
        'firebaseSaveSession',
        'firebaseLoadSession',
        'firebaseDeleteSession',
        'firebaseEmailAuth',
        'firebaseGoogleAuth',
        'firebaseLogout'
    ];

    // Cek apakah semua fungsi sudah tersedia
    let allFunctionsReady = true;
    for (const funcName of requiredAuthFunctions) {
        if (typeof window[funcName] !== 'function') {
            console.warn(`Auth function ${funcName} not ready yet`);
            allFunctionsReady = false;
        } else {
            //console.log(`Auth function ${funcName} is ready`);
        }
    }

    // Jika tidak semua fungsi siap, coba lagi setelah delay kecil
    if (!allFunctionsReady) {
        setTimeout(ensureAuthFunctionsAreReady, 50);
        return;
    }

    // Semua fungsi siap, sekarang jalankan inisialisasi
    runAuthInitialization();
}

// Set a timeout to provide fallback functions if backend doesn't respond in time
setTimeout(function() {
    // If main functions are still not available after 2 seconds, provide basic fallbacks
    if (typeof window.firebaseEmailAuth !== 'function') {
        window.firebaseEmailAuth = async function(email, password, authMode) {
            console.warn('Worker auth unavailable, using secure fallback');
            if (window.SantrilogyApp && typeof window.SantrilogyApp.showToast === 'function') {
                window.SantrilogyApp.showToast('Sistem sedang dimuat ulang...', 'error');
            }
            // Wait for firebase-safe.js to load if needed
            setTimeout(() => {
                if (typeof window.firebaseEmailAuth === 'function' &&
                    window.firebaseEmailAuth.toString().includes('safe fallback')) {
                    window.firebaseEmailAuth(email, password, authMode);
                }
            }, 100);
        };
    }

    if (typeof window.firebaseGoogleAuth !== 'function') {
        window.firebaseGoogleAuth = async function() {
            console.warn('Worker Google auth unavailable, using secure fallback');
            if (window.SantrilogyApp && typeof window.SantrilogyApp.showToast === 'function') {
                window.SantrilogyApp.showToast('Sistem sedang dimuat ulang...', 'error');
            }
        };
    }

    if (typeof window.firebaseLogout !== 'function') {
        window.firebaseLogout = async function() {
            console.warn('Worker logout unavailable, using secure fallback');
            if (window.SantrilogyApp && typeof window.SantrilogyApp.showToast === 'function') {
                window.SantrilogyApp.showToast('Sistem sedang dimuat ulang...', 'error');
            }
        };
    }
}, 2000); // 2 seconds timeout

function runAuthInitialization() {
    // Jalankan cek auth saat halaman dimuat
    setTimeout(checkForTokenInUrl, 100); // Small delay to ensure SantrilogyApp is available
    setTimeout(checkAuthStatus, 500); // Delay biar UI sudah siap

    // Tandai bahwa sistem autentikasi siap
    window.firebaseReady = true;
    console.log('Santrilogy AI: Authentication system ready');

    // Tambahkan flag untuk mengetahui status Cloudflare D1 + JWT autentikasi
    window.authSystemStatus = {
        ready: true,
        timestamp: Date.now(),
        functions: {
            loadHistory: typeof window.firebaseLoadHistory === 'function',
            saveSession: typeof window.firebaseSaveSession === 'function',
            loadSession: typeof window.firebaseLoadSession === 'function',
            deleteSession: typeof window.firebaseDeleteSession === 'function',
            emailAuth: typeof window.firebaseEmailAuth === 'function',
            googleAuth: typeof window.firebaseGoogleAuth === 'function',
            logout: typeof window.firebaseLogout === 'function'
        }
    };
}

// Jalankan pengecekan saat DOM selesai dimuat
document.addEventListener('DOMContentLoaded', function() {
    //console.log('DOM loaded, checking auth functions...');
    ensureAuthFunctionsAreReady();
});

// Juga coba eksekusi segera jika DOM sudah siap
if (document.readyState === 'complete') {
    //console.log('DOM already complete, checking auth functions...');
    setTimeout(ensureAuthFunctionsAreReady, 1);
}

// Tambahkan fallback untuk kompatibilitas
if (typeof window.checkAuthStatus === 'function' && typeof window.checkForTokenInUrl === 'function') {
    setTimeout(ensureAuthFunctionsAreReady, 10);
}

// Tambahkan fungsi cek untuk main.js (jika digunakan sebelum inisialisasi selesai)
if (typeof window.firebaseEmailAuth !== 'function') {
    window.firebaseEmailAuth = async function(email, password, authMode) {
        console.warn('Authentication system not ready yet. Please try again in a moment.');
        if (window.SantrilogyApp && typeof window.SantrilogyApp.showToast === 'function') {
            window.SantrilogyApp.showToast('Sistem autentikasi sedang dimuat...', 'error');
        }
    };
}

if (typeof window.firebaseGoogleAuth !== 'function') {
    window.firebaseGoogleAuth = async function() {
        console.warn('Authentication system not ready yet. Please try again in a moment.');
        if (window.SantrilogyApp && typeof window.SantrilogyApp.showToast === 'function') {
            window.SantrilogyApp.showToast('Sistem autentikasi sedang dimuat...', 'error');
        }
    };
}

if (typeof window.firebaseLogout !== 'function') {
    window.firebaseLogout = async function() {
        console.warn('Authentication system not ready yet. Please try again in a moment.');
        if (window.SantrilogyApp && typeof window.SantrilogyApp.showToast === 'function') {
            window.SantrilogyApp.showToast('Sistem autentikasi sedang dimuat...', 'error');
        }
    };
}

// Fungsi untuk mengecek koneksi dengan Worker
async function checkWorkerConnection() {
    try {
        const response = await fetch(CLOUDFLARE_AUTH_CONFIG.BASE_URL + '/health', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        console.log('Worker connection test response status:', response.status);
        if (response.ok) {
            const result = await response.json();
            console.log('Worker connection test successful:', result);
            return true;
        } else {
            console.warn('Health check failed with status:', response.status);
            return false;
        }
    } catch (error) {
        console.warn('Worker connection failed:', error);
        return false;
    }
}

// Tandai bahwa auth system sedang dimuat dan cek koneksi
window.authSystemStatus = {
    ready: false,
    loading: true,
    connected: false,
    timestamp: Date.now(),
    async initialize() {
        // Cek koneksi ke Worker
        this.connected = await checkWorkerConnection();
        this.loading = false;

        if (this.connected) {
            console.log('Santrilogy AI: Cloudflare Backend Worker terhubung');
        } else {
            console.warn('Santrilogy AI: Cloudflare Backend Worker tidak terhubung');
        }

        return this.connected;
    }
};

// Jalankan inisialisasi status koneksi
window.authSystemStatus.initialize();

// Additional initialization for better reliability
document.addEventListener('DOMContentLoaded', function() {
    // Double-check that auth functions are available after all scripts load
    setTimeout(function() {
        if (typeof window.firebaseEmailAuth === 'function' &&
            typeof window.firebaseGoogleAuth === 'function' &&
            typeof window.firebaseLogout === 'function') {
            window.authSystemStatus.ready = true;
        }
    }, 500); // Small delay to ensure all scripts are processed
});

// Ensure fallback auth functions are available if main functions fail to load properly
setTimeout(function() {
    if (typeof window.firebaseEmailAuth !== 'function') {
        console.warn('Main auth functions not loaded, ensuring fallbacks are available');
    }
}, 1000);

// Pastikan semua fungsi autentikasi ekspor juga tersedia sebagai fungsi utama
window.firebaseLoadHistory = CloudflareD1Replacement.loadHistory;
window.firebaseSaveSession = CloudflareD1Replacement.saveSession;
window.firebaseLoadSession = CloudflareD1Replacement.loadSession;
window.firebaseDeleteSession = CloudflareD1Replacement.deleteSession;

// Tandai bahwa inisialisasi utama selesai
window.mainAuthFunctionsInitialized = true;
console.log('Santrilogy AI: All main Cloudflare authentication functions initialized');