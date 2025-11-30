// ========== DEBUG AUTHENTICATION SYSTEM ==========
// Ini adalah versi khusus untuk debugging masalah autentikasi

console.log('Santrilogy AI: Loading debug authentication system...');

// Fungsi untuk mengecek status kesiapan auth sistem
function checkAuthSystemStatus() {
    const status = {
        firebaseEmailAuth: typeof window.firebaseEmailAuth === 'function',
        firebaseGoogleAuth: typeof window.firebaseGoogleAuth === 'function',
        firebaseLogout: typeof window.firebaseLogout === 'function',
        firebaseLoadHistory: typeof window.firebaseLoadHistory === 'function',
        firebaseSaveSession: typeof window.firebaseSaveSession === 'function',
        firebaseLoadSession: typeof window.firebaseLoadSession === 'function',
        firebaseDeleteSession: typeof window.firebaseDeleteSession === 'function',
        santrilogyAppAvailable: typeof window.SantrilogyApp !== 'undefined',
        elementsAvailable: document.getElementById('authModal') !== null
    };

    console.log('Auth System Status:', status);
    return status;
}

// Override fungsi-fungsi fallback untuk memberikan informasi debug
if (typeof window.firebaseEmailAuth !== 'function' || 
    window.firebaseEmailAuth.toString().includes('not ready yet')) {
    
    console.log('Reinitializing firebaseEmailAuth function...');
    
    window.firebaseEmailAuth = async function(email, password, authMode) {
        console.log('firebaseEmailAuth called with:', {email, authMode});
        console.log('Current auth system status:', checkAuthSystemStatus());
        
        // Cek lagi apakah fungsi sebenarnya tersedia sekarang
        if (typeof window.originalFirebaseEmailAuth === 'function') {
            return window.originalFirebaseEmailAuth(email, password, authMode);
        } else {
            // Coba cari lagi fungsi dari worker-integration
            if (typeof window.SantrilogyAPI !== 'undefined') {
                console.log('Found SantrilogyAPI, attempting authentication...');
                try {
                    const response = await window.SantrilogyAPI.request('/api/auth', 'POST', {
                        action: authMode === 'register' ? 'signup' : 'login',
                        email: email,
                        password: password
                    });
                    
                    if (window.SantrilogyApp && typeof window.SantrilogyApp.updateUserUI === 'function') {
                        window.SantrilogyApp.updateUserUI(response.user || {
                            uid: response.localId || 'user_' + Date.now(),
                            email: email,
                            displayName: email.split('@')[0]
                        });
                        
                        if (typeof window.SantrilogyApp.closeModal === 'function') {
                            window.SantrilogyApp.closeModal('authModal');
                        }
                        
                        if (typeof window.SantrilogyApp.showToast === 'function') {
                            const successMsg = authMode === 'register' ? "Akun berhasil dibuat! 🎉" : "Selamat datang kembali! 👋";
                            window.SantrilogyApp.showToast(successMsg, "success");
                        }
                    }
                    
                    return response;
                } catch (error) {
                    console.error('Authentication error:', error);
                    if (window.SantrilogyApp && typeof window.SantrilogyApp.showToast === 'function') {
                        window.SantrilogyApp.showToast(error.message || 'Gagal melakukan autentikasi', 'error');
                    }
                }
            } else {
                // Fallback ke localStorage jika semua backend gagal
                console.warn('All auth methods failed, using local storage fallback');
                
                if (authMode === 'register') {
                    const user = {
                        uid: 'local_user_' + Date.now(),
                        email: email,
                        displayName: email.split('@')[0],
                        isAnonymous: false,
                        createdAt: new Date().toISOString(),
                        isLocalAuth: true
                    };

                    localStorage.setItem('santrilogy_user', JSON.stringify(user));
                    localStorage.setItem('santrilogy_user_email', btoa(email));

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
                    // Login - cek apakah email sudah terdaftar
                    const storedEmail = localStorage.getItem('santrilogy_user_email');
                    const expectedEmail = storedEmail ? atob(storedEmail) : null;

                    if (expectedEmail === email) {
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
                        if (window.SantrilogyApp && typeof window.SantrilogyApp.showToast === 'function') {
                            window.SantrilogyApp.showToast("Akun tidak ditemukan. Silakan daftar terlebih dahulu.", "error");
                        }
                    }
                }
            }
        }
    };
}

// Ulangi untuk fungsi auth lainnya
if (typeof window.firebaseGoogleAuth !== 'function' || 
    window.firebaseGoogleAuth.toString().includes('not ready yet')) {
    
    console.log('Reinitializing firebaseGoogleAuth function...');
    
    window.firebaseGoogleAuth = async function() {
        console.log('firebaseGoogleAuth called');
        console.log('Current auth system status:', checkAuthSystemStatus());
        
        // Redirect ke endpoint Google auth di worker
        const workerUrl = "https://worker-santrilogy-ai.santrilogyapp.workers.dev";
        const redirectUrl = `${workerUrl}/api/auth/google`;
        
        console.log('Redirecting to Google auth:', redirectUrl);
        window.location.href = redirectUrl;
    };
}

if (typeof window.firebaseLogout !== 'function' || 
    window.firebaseLogout.toString().includes('not ready yet')) {
    
    console.log('Reinitializing firebaseLogout function...');
    
    window.firebaseLogout = async function() {
        console.log('firebaseLogout called');
        
        // Hapus data auth dari localStorage
        localStorage.removeItem('santrilogy_user');
        localStorage.removeItem('santrilogy_user_email');
        localStorage.removeItem('santrilogy_user_hash');
        localStorage.removeItem('santrilogy_id_token');
        localStorage.removeItem('santrilogy_refresh_token');

        if (window.SantrilogyApp && typeof window.SantrilogyApp.updateUserUI === 'function') {
            window.SantrilogyApp.updateUserUI(null);
            if (typeof window.SantrilogyApp.showToast === 'function') {
                window.SantrilogyApp.showToast("Berhasil logout! 👋", "success");
            }
        }
    };
}

// Tambahkan fungsi untuk debugging
window.testWorkerConnection = async function() {
    try {
        console.log('Testing worker connection...');
        const response = await fetch('https://worker-santrilogy-ai.santrilogyapp.workers.dev/health');
        const data = await response.json();
        console.log('Worker connection successful:', data);
        return true;
    } catch (error) {
        console.error('Worker connection failed:', error);
        return false;
    }
};

// Jalankan pengecekan status saat diinisialisasi
setTimeout(() => {
    console.log('=== Santrilogy AI Authentication Debug ===');
    checkAuthSystemStatus();
    
    // Coba test connection
    window.testWorkerConnection();
}, 1000);

// Tandai bahwa sistem debug sudah dimuat
window.authDebugReady = true;
console.log('Santrilogy AI: Debug authentication system loaded');