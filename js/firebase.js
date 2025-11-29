// ========== FIREBASE GLOBAL NAMESPACE ==========

// Firebase configuration - GANTI DENGAN KONFIGURASI FIREBASE ANDA SENDIRI
// JANGAN COMMIT KONFIGURASI INI DENGAN API KEY SEBENARNYA
const firebaseConfig = {
    apiKey: "YOUR_API_KEY_HERE", // GANTI DENGAN API KEY ANDA
    authDomain: "your-project.firebaseapp.com", // GANTI DENGAN DOMAIN ANDA
    projectId: "your-project-id", // GANTI DENGAN PROJECT ID ANDA
    storageBucket: "your-project.appspot.com", // GANTI DENGAN STORAGE BUCKET ANDA
    messagingSenderId: "your-sender-id", // GANTI DENGAN SENDER ID ANDA
    appId: "your-app-id" // GANTI DENGAN APP ID ANDA
};

// Initialize Firebase using global namespace (no ES6 imports required)
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth(app);
const db = firebase.firestore(app);
const provider = new firebase.auth.GoogleAuthProvider();

// ========== AUTH FUNCTIONS ==========
window.firebaseGoogleAuth = async function() {
    try {
        await firebase.auth().signInWithPopup(provider);
        window.SantrilogyApp.closeModal('authModal');
        window.SantrilogyApp.showToast("Login berhasil! 🎉", "success");
    } catch (e) {
        window.SantrilogyApp.showToast(e.message, "error");
    }
};

window.firebaseEmailAuth = async function(email, password, mode) {
    try {
        if (mode === 'register') {
            await firebase.auth().createUserWithEmailAndPassword(email, password);
            window.SantrilogyApp.showToast("Akun berhasil dibuat! 🎉", "success");
        } else {
            await firebase.auth().signInWithEmailAndPassword(email, password);
            window.SantrilogyApp.showToast("Selamat datang kembali! 👋", "success");
        }
        window.SantrilogyApp.closeModal('authModal');
    } catch (e) {
        window.SantrilogyApp.showToast(e.message, "error");
    }
};

window.firebaseLogout = async function() {
    try {
        await firebase.auth().signOut();
        window.SantrilogyApp.showToast("Sampai jumpa! 👋", "success");
    } catch (e) {
        window.SantrilogyApp.showToast(e.message, "error");
    }
};

// ========== FIRESTORE FUNCTIONS ==========

// Simpan session ke Firestore
window.firebaseSaveSession = async function(sessionId, title, messages) {
    const user = firebase.auth().currentUser;
    if (!user) return false;

    try {
        const sessionRef = db.collection('users').doc(user.uid).collection('sessions').doc(sessionId);
        await sessionRef.set({
            title: title,
            messages: messages,
            messageCount: messages.length,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        return true;
    } catch (e) {
        console.error('Save session error:', e);
        return false;
    }
};

// Load semua sessions (history list)
window.firebaseLoadHistory = async function() {
    const user = firebase.auth().currentUser;
    if (!user) return [];

    try {
        const sessionsCollection = db.collection('users').doc(user.uid).collection('sessions');
        const q = sessionsCollection.orderBy('updatedAt', 'desc').limit(50);
        const snapshot = await q.get();

        var history = [];
        snapshot.forEach(function(docSnap) {
            var data = docSnap.data();
            history.push({
                id: docSnap.id,
                title: data.title,
                messageCount: data.messageCount || 0,
                timestamp: data.updatedAt ? data.updatedAt.toMillis() : Date.now()
            });
        });

        return history;
    } catch (e) {
        console.error('Load history error:', e);
        return [];
    }
};

// Load satu session (messages)
window.firebaseLoadSession = async function(sessionId) {
    const user = firebase.auth().currentUser;
    if (!user) return null;

    try {
        const sessionRef = db.collection('users').doc(user.uid).collection('sessions').doc(sessionId);
        const snapshot = await sessionRef.get();

        if (snapshot.exists) {
            return snapshot.data();
        }
        return null;
    } catch (e) {
        console.error('Load session error:', e);
        return null;
    }
};

// Hapus session
window.firebaseDeleteSession = async function(sessionId) {
    const user = firebase.auth().currentUser;
    if (!user) return false;

    try {
        const sessionRef = db.collection('users').doc(user.uid).collection('sessions').doc(sessionId);
        await sessionRef.delete();
        return true;
    } catch (e) {
        console.error('Delete session error:', e);
        return false;
    }
};

// ========== AUTH STATE ==========
firebase.auth().onAuthStateChanged((user) => {
    // Fungsi Safety Check: Cek apakah SantrilogyApp sudah siap?
    function safeUpdate() {
        if (window.SantrilogyApp && typeof window.SantrilogyApp.updateUserUI === 'function') {
            // Sudah siap, jalankan!
            window.SantrilogyApp.updateUserUI(user);
        } else {
            // Belum siap, tunggu 100ms lalu cek lagi
            setTimeout(safeUpdate, 100);
        }
    }

    // Jalankan safety check
    safeUpdate();
});

// Santrilogy AI - Template Protection
// Additional check for Firebase configuration integrity
setTimeout(function() {
    if (typeof window.firebaseLoadHistory !== 'function' ||
        typeof window.firebaseSaveSession !== 'function' ||
        typeof window.SantrilogyApp === 'undefined') {
        console.warn('Santrilogy AI Firebase functions have been modified incorrectly. Redirecting to official site.');
        window.location.href = 'https://www.lp.santrilogy.com';
    }
}, 3000); // Check after 3 seconds to ensure Firebase is loaded