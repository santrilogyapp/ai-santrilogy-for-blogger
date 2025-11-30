// ========== SANTRILOGY AI - SECURE WORKER PROXY AUTHENTICATION ==========

// Konfigurasi untuk komunikasi dengan Cloudflare Worker (Firebase Proxy)
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
    },

    // Request with authentication headers
    authRequest: async function(endpoint, method = 'GET', data = null) {
        try {
            const token = localStorage.getItem('santrilogy_id_token');

            const config = {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                }
            };

            if (data && (method === 'POST' || method === 'PUT')) {
                config.body = JSON.stringify(data);
            }

            const fullUrl = CLOUDFLARE_WORKER_CONFIG.BASE_URL + endpoint;
            console.log('Auth API Request:', fullUrl, config);

            const response = await fetch(fullUrl, config);

            if (response.status === 401) {
                // Token expired, logout user
                handleTokenExpired();
                throw new Error('Sesi habis, silakan login kembali');
            }

            if (!response.ok) {
                throw new Error(`API Error: ${response.status} - ${response.statusText}`);
            }

            const result = await response.json();
            console.log('Auth API Response:', result);

            return result;
        } catch (error) {
            console.error('Auth API request error:', error);
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

// Update email auth function - use worker as the ONLY authentication method (secure proxy approach)
window.firebaseEmailAuth = async function(email, password, authMode) {
    const originalButtonText = document.getElementById('authSubmitBtn')?.textContent || '';

    try {
        // Tampilkan loading state
        updateAuthButtonState(true, originalButtonText);

        // ONLY use worker to handle authentication (secure proxy approach)
        // This prevents direct Firebase SDK usage and API key exposure
        console.log('Using worker as secure Firebase proxy for authentication request');

        // Panggil API auth backend
        const response = await SantrilogyAPI.request(
            CLOUDFLARE_WORKER_CONFIG.ENDPOINTS.AUTH,
            'POST',
            {
                action: authMode === 'register' ? 'signup' : 'login',
                email: email,
                password: password
            }
        );

        // Cek jika request sukses
        if (response.success && response.idToken) {
            // Simpan token ke localStorage
            localStorage.setItem('santrilogy_id_token', response.idToken);
            localStorage.setItem('santrilogy_refresh_token', response.refreshToken || '');

            // Parse user info dari token atau response
            let user;
            if (response.user) {
                user = {
                    uid: response.user.localId || 'user_' + Date.now(),
                    email: response.user.email || email,
                    displayName: response.user.displayName || email.split('@')[0],
                    photoURL: response.user.photoUrl || null,
                    emailVerified: response.user.emailVerified || false,
                    isAnonymous: false
                };
            } else {
                // Fallback jika user info tidak ada di response
                user = {
                    uid: 'user_' + Date.now(),
                    email: email,
                    displayName: email.split('@')[0],
                    isAnonymous: false
                };
            }

            // Simpan user info ke localStorage
            localStorage.setItem('santrilogy_user', JSON.stringify(user));

            // Update UI untuk login sukses
            if (window.SantrilogyApp && typeof window.SantrilogyApp.updateUserUI === 'function') {
                window.SantrilogyApp.updateUserUI(user);

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
            const errorMsg = response.error?.message || response.message || "Login gagal, silakan coba lagi";
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

// Google auth - worker only (secure proxy approach)
window.firebaseGoogleAuth = async function() {
    try {
        // ONLY use worker for Google OAuth (secure proxy approach)
        // This prevents direct Firebase SDK usage and API key exposure
        console.log('Using worker as secure Firebase proxy for Google authentication request');

        // Redirect to worker for Google OAuth flow, include origin for redirect
        const origin = window.location.origin || window.location.protocol + "//" + window.location.hostname + (window.location.port ? ':' + window.location.port : '');
        const googleAuthUrl = `${CLOUDFLARE_WORKER_CONFIG.BASE_URL}${CLOUDFLARE_WORKER_CONFIG.ENDPOINTS.AUTH}/google?origin=${encodeURIComponent(origin)}`;
        window.location.href = googleAuthUrl;
    } catch (e) {
        console.error('Google auth error:', e);
        if (window.SantrilogyApp && typeof window.SantrilogyApp.showToast === 'function') {
            window.SantrilogyApp.showToast(e.message, "error");
        }
    }
};

// Check for token in URL hash and process it
function checkForTokenInUrl() {
    const hash = window.location.hash.substring(1);
    if (hash) {
        const params = new URLSearchParams(hash);
        const token = params.get('token');
        const userParam = params.get('user');

        if (token && userParam) {
            // Save token to localStorage
            localStorage.setItem('santrilogy_id_token', token);

            // Decode and save user data
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

                // Clear the hash from the URL
                history.replaceState('', document.title, window.location.pathname);

                // Load history
                if (typeof window.SantrilogyApp.loadHistoryFromFirestore === 'function') {
                    setTimeout(() => {
                        window.SantrilogyApp.loadHistoryFromFirestore();
                    }, 500);
                }
            } catch (e) {
                console.error('Error parsing user data from URL:', e);
                if (window.SantrilogyApp && typeof window.SantrilogyApp.showToast === 'function') {
                    window.SantrilogyApp.showToast("Gagal memproses data pengguna", "error");
                }
            }
        }
    }
}


// Logout function - only clear local storage (worker handles server-side cleanup if needed)
window.firebaseLogout = async function() {
    try {
        // Clear auth data from localStorage
        localStorage.removeItem('santrilogy_id_token');
        localStorage.removeItem('santrilogy_refresh_token');
        localStorage.removeItem('santrilogy_user');

        // Update UI for logout
        if (window.SantrilogyApp && typeof window.SantrilogyApp.updateUserUI === 'function') {
            window.SantrilogyApp.updateUserUI(null); // null means logged out
            if (typeof window.SantrilogyApp.showToast === 'function') {
                window.SantrilogyApp.showToast("Sampai jumpa! 👋", "success");
            }
        }
    } catch (e) {
        console.error('Logout error:', e);
        if (window.SantrilogyApp && typeof window.SantrilogyApp.showToast === 'function') {
            window.SantrilogyApp.showToast(e.message, "error");
        }
    }
};

// Fungsi untuk cek status auth saat page load (session persistence)
function checkAuthStatus() {
    const token = localStorage.getItem('santrilogy_id_token');

    if (token) {
        // Jika ada token, coba verify ke backend
        verifyTokenAndRestoreSession(token);
    }
}

// Fungsi untuk verify token dan restore session
async function verifyTokenAndRestoreSession(token) {
    try {
        const response = await SantrilogyAPI.request(
            CLOUDFLARE_WORKER_CONFIG.ENDPOINTS.AUTH,
            'POST',
            {
                action: 'verify',
                idToken: token
            }
        );

        if (response.success && response.user) {
            // Token valid, restore session
            const user = {
                uid: response.user.localId || 'user_' + Date.now(),
                email: response.user.email,
                displayName: response.user.displayName || response.user.email?.split('@')[0],
                photoURL: response.user.photoUrl || null,
                emailVerified: response.user.emailVerified || false,
                isAnonymous: false
            };

            // Simpan user info ke localStorage
            localStorage.setItem('santrilogy_user', JSON.stringify(user));

            // Update UI
            if (window.SantrilogyApp && typeof window.SantrilogyApp.updateUserUI === 'function') {
                window.SantrilogyApp.updateUserUI(user);
            }

            // Muat history
            if (typeof window.SantrilogyApp.loadHistoryFromFirestore === 'function') {
                setTimeout(() => {
                    window.SantrilogyApp.loadHistoryFromFirestore();
                }, 500);
            }

            console.log('Session restored successfully');
        } else {
            // Token tidak valid, logout
            handleTokenExpired();
        }
    } catch (error) {
        console.error('Token verification failed:', error);
        handleTokenExpired();
    }
}

// Fungsi untuk handle token expired
function handleTokenExpired() {
    localStorage.removeItem('santrilogy_id_token');
    localStorage.removeItem('santrilogy_refresh_token');
    localStorage.removeItem('santrilogy_user');

    // Update UI ke guest mode
    if (window.SantrilogyApp && typeof window.SantrilogyApp.updateUserUI === 'function') {
        window.SantrilogyApp.updateUserUI(null);
    }
}


// API Wrapper Functions - Pengganti fungsi Firebase
var SantrilogyBackend = {
    // Kirim pesan ke AI melalui Cloudflare Worker
    sendChat: async function(message, userId, sessionId) {
        console.log('Sending chat message:', {message, userId, sessionId});
        return SantrilogyAPI.authRequest(CLOUDFLARE_WORKER_CONFIG.ENDPOINTS.CHAT, 'POST', {
            message: message,
            userId: userId,
            sessionId: sessionId
        });
    },

    // Ambil histori chat dari Cloudflare Worker
    getHistory: async function(userId) {
        console.log('Getting history for user:', userId);
        const url = `${CLOUDFLARE_WORKER_CONFIG.ENDPOINTS.HISTORY}?userId=${encodeURIComponent(userId)}`;
        return SantrilogyAPI.authRequest(url, 'GET');
    },

    // Operasi sesi (simpan, muat, hapus) melalui Cloudflare Worker
    sessionOp: async function(sessionId, userId, action, sessionData = null) {
        console.log('Session operation:', {sessionId, userId, action, sessionData});
        return SantrilogyAPI.authRequest(CLOUDFLARE_WORKER_CONFIG.ENDPOINTS.SESSION, 'POST', {
            sessionId: sessionId,
            userId: userId,
            action: action,
            sessionData: sessionData
        });
    }
};

// Fungsi pengganti untuk Firebase di template
var FirebaseReplacement = {
    // Ganti window.firebaseLoadHistory
    loadHistory: async function() {
        try {
            // Gunakan user ID dari localStorage jika login, atau generate guest ID
            let user = JSON.parse(localStorage.getItem('santrilogy_user')) || null;
            const userId = user ? user.uid : this.getCurrentUserId();

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
            // Fallback to localStorage if API fails
            try {
                const userId = this.getCurrentUserId();
                const history = JSON.parse(localStorage.getItem('santrilogy_history_' + userId) || '[]');
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
            // Gunakan user ID dari localStorage jika login, atau generate guest ID
            let user = JSON.parse(localStorage.getItem('santrilogy_user')) || null;
            const userId = user ? user.uid : this.getCurrentUserId();

            const result = await SantrilogyBackend.sessionOp(
                sessionId, userId, 'save', {title, messages}
            );
            console.log('Session saved:', result);
            return result.success === true;
        } catch (error) {
            console.error('Save session error:', error);
            // Fallback to localStorage if API fails
            try {
                const userId = this.getCurrentUserId();
                let cache = {};
                try {
                    cache = JSON.parse(localStorage.getItem('santrilogy_cache_' + userId) || '{}');
                } catch(e) {
                    cache = {};
                }

                cache[sessionId] = {
                    title: title,
                    messages: messages,
                    timestamp: Date.now()
                };

                localStorage.setItem('santrilogy_cache_' + userId, JSON.stringify(cache));
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
            // Gunakan user ID dari localStorage jika login, atau generate guest ID
            let user = JSON.parse(localStorage.getItem('santrilogy_user')) || null;
            const userId = user ? user.uid : this.getCurrentUserId();

            const result = await SantrilogyBackend.sessionOp(
                sessionId, userId, 'get'
            );
            console.log('Session loaded:', result);
            return result.data || null;
        } catch (error) {
            console.error('Load session error:', error);
            // Fallback to localStorage if API fails
            try {
                const userId = this.getCurrentUserId();
                let cache = {};
                try {
                    cache = JSON.parse(localStorage.getItem('santrilogy_cache_' + userId) || '{}');
                } catch(e) {
                    cache = {};
                }

                return cache[sessionId] || null;
            } catch (e) {
                console.error('Fallback session load failed:', e);
                return null;
            }
        }
    },

    // Ganti window.firebaseDeleteSession
    deleteSession: async function(sessionId) {
        try {
            // Gunakan user ID dari localStorage jika login, atau generate guest ID
            let user = JSON.parse(localStorage.getItem('santrilogy_user')) || null;
            const userId = user ? user.uid : this.getCurrentUserId();

            const result = await SantrilogyBackend.sessionOp(
                sessionId, userId, 'delete'
            );
            console.log('Session deleted:', result);
            return result.success === true;
        } catch (error) {
            console.error('Delete session error:', error);
            // Fallback to removeFrom localStorage if API fails
            try {
                const userId = this.getCurrentUserId();
                let cache = {};
                try {
                    cache = JSON.parse(localStorage.getItem('santrilogy_cache_' + userId) || '{}');
                } catch(e) {
                    cache = {};
                }

                delete cache[sessionId];
                localStorage.setItem('santrilogy_cache_' + userId, JSON.stringify(cache));
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
        const result = await SantrilogyAPI.request(CLOUDFLARE_WORKER_CONFIG.ENDPOINTS.HEALTH, 'GET');
        console.log('Worker connection test successful:', result);
        return true;
    } catch (error) {
        console.error('Worker connection test failed:', error);
        return false;
    }
};

// Inisialisasi dan test koneksi
console.log('Santrilogy AI - Real Backend Authentication Integration Loaded');
console.log('Worker URL:', CLOUDFLARE_WORKER_CONFIG.BASE_URL);

// Export untuk digunakan oleh fungsi-fungsi di template
// Simulasikan fungsi-fungsi firebase agar template tetap kompatibel
window.firebaseLoadHistory = FirebaseReplacement.loadHistory;
window.firebaseSaveSession = FirebaseReplacement.saveSession;
window.firebaseLoadSession = FirebaseReplacement.loadSession;
window.firebaseDeleteSession = FirebaseReplacement.deleteSession;

// Pastikan semua fungsi autentikasi siap sebelum main.js menggunakannya
function ensureAuthFunctionsAreReady() {
    // Daftar fungsi autentikasi yang harus tersedia
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

    // Tambahkan flag untuk mengetahui status autentikasi
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
        const response = await fetch(CLOUDFLARE_WORKER_CONFIG.BASE_URL + '/health', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        return response.ok;
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
            console.log('Santrilogy AI: Backend Worker terhubung');
        } else {
            console.warn('Santrilogy AI: Backend Worker tidak terhubung');
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
        // Load fallback from firebase-safe.js
        console.warn('Main auth functions not loaded, ensuring fallbacks are available');
    }
}, 1000);

// Pastikan semua fungsi autentikasi ekspor juga tersedia sebagai fungsi utama
window.firebaseLoadHistory = FirebaseReplacement.loadHistory;
window.firebaseSaveSession = FirebaseReplacement.saveSession;
window.firebaseLoadSession = FirebaseReplacement.loadSession;
window.firebaseDeleteSession = FirebaseReplacement.deleteSession;

// Tandai bahwa inisialisasi utama selesai
window.mainAuthFunctionsInitialized = true;
console.log('Santrilogy AI: All main authentication functions initialized');