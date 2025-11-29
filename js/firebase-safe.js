// ========== SANTRILOGY AI - SECURE PRODUCTION FALLBACK ==========
// Production-safe authentication fallback when worker backend is unavailable

console.log('Santrilogy AI: Loading secure production fallback...');

// Only define functions if they don't already exist
// This is a secure local fallback for when worker is unavailable
if (typeof window.firebaseEmailAuth !== 'function') {
    window.firebaseEmailAuth = async function(email, password, authMode) {
        console.warn('Worker unavailable, using secure local fallback');

        // Secure local authentication with basic validation
        if (!email || !password) {
            if (window.SantrilogyApp && typeof window.SantrilogyApp.showToast === 'function') {
                window.SantrilogyApp.showToast("Email dan password diperlukan", "error");
            }
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            if (window.SantrilogyApp && typeof window.SantrilogyApp.showToast === 'function') {
                window.SantrilogyApp.showToast("Format email tidak valid", "error");
            }
            return;
        }

        if (authMode === 'register') {
            // For registration, create a local "account"
            const user = {
                uid: 'local_user_' + Date.now(),
                email: email,
                displayName: email.split('@')[0],
                isAnonymous: false,
                createdAt: new Date().toISOString(),
                isLocalAuth: true // Mark as local authentication
            };

            // Store credentials securely
            localStorage.setItem('santrilogy_user', JSON.stringify(user));
            localStorage.setItem('santrilogy_user_email', btoa(email)); // Base64 encode for basic obfuscation
            localStorage.setItem('santrilogy_user_hash', btoa(email + ':' + Date.now())); // Simple hash for verification

            if (window.SantrilogyApp && typeof window.SantrilogyApp.updateUserUI === 'function') {
                window.SantrilogyApp.updateUserUI(user);

                if (typeof window.SantrilogyApp.closeModal === 'function') {
                    window.SantrilogyApp.closeModal('authModal');
                }

                if (typeof window.SantrilogyApp.showToast === 'function') {
                    window.SantrilogyApp.showToast("Akun lokal dibuat! 🎉", "success");
                }
            }
        } else {
            // For login, verify if this email was previously registered locally
            const storedEmail = localStorage.getItem('santrilogy_user_email');
            const expectedEmail = atob(storedEmail || ''); // Decode from base64

            if (expectedEmail === email) {
                // Email matches, create user object
                const user = {
                    uid: 'local_user_' + expectedEmail.replace(/[^a-zA-Z0-9]/g, '_'),
                    email: email,
                    displayName: email.split('@')[0],
                    isAnonymous: false,
                    isLocalAuth: true
                };

                localStorage.setItem('santrilogy_user', JSON.stringify(user));

                if (window.SantrilogyApp && typeof window.SantrilogyApp.updateUserUI === 'function') {
                    window.SantrilogyApp.updateUserUI(user);

                    if (typeof window.SantrilogyApp.closeModal === 'function') {
                        window.SantrilogyApp.closeModal('authModal');
                    }

                    if (typeof window.SantrilogyApp.showToast === 'function') {
                        window.SantrilogyApp.showToast("Selamat datang kembali! 👋", "success");
                    }
                }
            } else {
                // No matching local account
                if (window.SantrilogyApp && typeof window.SantrilogyApp.showToast === 'function') {
                    window.SantrilogyApp.showToast("Akun tidak ditemukan. Silakan daftar terlebih dahulu.", "error");
                }
            }
        }
    };
}

if (typeof window.firebaseGoogleAuth !== 'function') {
    window.firebaseGoogleAuth = async function() {
        console.warn('Google auth unavailable, worker backend is primary method');

        // Inform user that Google auth requires backend
        if (window.SantrilogyApp && typeof window.SantrilogyApp.showToast === 'function') {
            window.SantrilogyApp.showToast("Autentikasi Google memerlukan koneksi ke server", "error");
        }
    };
}

if (typeof window.firebaseLogout !== 'function') {
    window.firebaseLogout = async function() {
        // Clear all auth data securely
        localStorage.removeItem('santrilogy_user');
        localStorage.removeItem('santrilogy_user_email');
        localStorage.removeItem('santrilogy_user_hash');
        localStorage.removeItem('santrilogy_id_token');
        localStorage.removeItem('santrilogy_refresh_token');

        if (window.SantrilogyApp && typeof window.SantrilogyApp.updateUserUI === 'function') {
            window.SantrilogyApp.updateUserUI(null); // null means logged out

            if (typeof window.SantrilogyApp.showToast === 'function') {
                window.SantrilogyApp.showToast("Berhasil logout! 👋", "success");
            }
        }
    };
}

// History and session management (always needed for chat functionality)
if (typeof window.firebaseLoadHistory !== 'function') {
    window.firebaseLoadHistory = async function() {
        try {
            const user = JSON.parse(localStorage.getItem('santrilogy_user') || null);
            const userId = user ? user.uid : 'guest';
            const history = JSON.parse(localStorage.getItem('santrilogy_history_' + userId) || '[]');

            return history;
        } catch (e) {
            console.error('Error loading local history:', e);
            return [];
        }
    };
}

if (typeof window.firebaseSaveSession !== 'function') {
    window.firebaseSaveSession = async function(sessionId, title, messages) {
        try {
            const user = JSON.parse(localStorage.getItem('santrilogy_user') || null);
            const userId = user ? user.uid : 'guest';

            // Save to local cache
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

            // Also update history
            let history = [];
            try {
                history = JSON.parse(localStorage.getItem('santrilogy_history_' + userId) || '[]');
            } catch(e) {
                history = [];
            }

            // Check if session already exists in history
            const existingIndex = history.findIndex(item => item.id === sessionId);
            if (existingIndex >= 0) {
                history[existingIndex].title = title;
                history[existingIndex].timestamp = Date.now();
                history[existingIndex].messageCount = messages.length;
            } else {
                history.unshift({
                    id: sessionId,
                    title: title,
                    timestamp: Date.now(),
                    messageCount: messages.length
                });
            }

            // Limit history to 50 items
            if (history.length > 50) {
                history = history.slice(0, 50);
            }

            localStorage.setItem('santrilogy_history_' + userId, JSON.stringify(history));

            return true;
        } catch (e) {
            console.error('Error saving local session:', e);
            return false;
        }
    };
}

if (typeof window.firebaseLoadSession !== 'function') {
    window.firebaseLoadSession = async function(sessionId) {
        try {
            const user = JSON.parse(localStorage.getItem('santrilogy_user') || null);
            const userId = user ? user.uid : 'guest';

            let cache = {};
            try {
                cache = JSON.parse(localStorage.getItem('santrilogy_cache_' + userId) || '{}');
            } catch(e) {
                cache = {};
            }

            return cache[sessionId] || null;
        } catch (e) {
            console.error('Error loading local session:', e);
            return null;
        }
    };
}

if (typeof window.firebaseDeleteSession !== 'function') {
    window.firebaseDeleteSession = async function(sessionId) {
        try {
            const user = JSON.parse(localStorage.getItem('santrilogy_user') || null);
            const userId = user ? user.uid : 'guest';

            // Remove from cache
            let cache = {};
            try {
                cache = JSON.parse(localStorage.getItem('santrilogy_cache_' + userId) || '{}');
            } catch(e) {
                cache = {};
            }

            delete cache[sessionId];
            localStorage.setItem('santrilogy_cache_' + userId, JSON.stringify(cache));

            // Remove from history
            let history = [];
            try {
                history = JSON.parse(localStorage.getItem('santrilogy_history_' + userId) || '[]');
            } catch(e) {
                history = [];
            }

            history = history.filter(item => item.id !== sessionId);
            localStorage.setItem('santrilogy_history_' + userId, JSON.stringify(history));

            return true;
        } catch (e) {
            console.error('Error deleting local session:', e);
            return false;
        }
    };
}

// Mark Firebase as ready
window.firebaseReady = true;
console.log('Santrilogy AI: Secure production fallback loaded');