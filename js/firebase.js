// ========== FIREBASE MODULE ==========

// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, deleteDoc, query, orderBy, limit, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Firebase configuration - INI HARUS DIGANTI DENGAN KONFIGURASI AMAN ANDA
const firebaseConfig = {
    apiKey: "AIzaSyDkz6cMrzMpqaqHgXXUges15kO_TuqSTT8", // GANTI DENGAN API KEY YANG AMAN
    authDomain: "santrilogy-ai.firebaseapp.com",
    projectId: "santrilogy-ai",
    storageBucket: "santrilogy-ai.firebasestorage.app",
    messagingSenderId: "579627248718",
    appId: "1:579627248718:web:0a7ae4d865b458abae271f"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// ========== AUTH FUNCTIONS ==========
window.firebaseGoogleAuth = async function() {
    try {
        await signInWithPopup(auth, provider);
        window.SantrilogyApp.closeModal('authModal');
        window.SantrilogyApp.showToast("Login berhasil! 🎉", "success");
    } catch (e) {
        window.SantrilogyApp.showToast(e.message, "error");
    }
};

window.firebaseEmailAuth = async function(email, password, mode) {
    try {
        if (mode === 'register') {
            await createUserWithEmailAndPassword(auth, email, password);
            window.SantrilogyApp.showToast("Akun berhasil dibuat! 🎉", "success");
        } else {
            await signInWithEmailAndPassword(auth, email, password);
            window.SantrilogyApp.showToast("Selamat datang kembali! 👋", "success");
        }
        window.SantrilogyApp.closeModal('authModal');
    } catch (e) {
        window.SantrilogyApp.showToast(e.message, "error");
    }
};

window.firebaseLogout = async function() {
    try {
        await signOut(auth);
        window.SantrilogyApp.showToast("Sampai jumpa! 👋", "success");
    } catch (e) {
        window.SantrilogyApp.showToast(e.message, "error");
    }
};

// ========== FIRESTORE FUNCTIONS ==========

// Simpan session ke Firestore
window.firebaseSaveSession = async function(sessionId, title, messages) {
    const user = auth.currentUser;
    if (!user) return false;

    try {
        const sessionRef = doc(db, 'users', user.uid, 'sessions', sessionId);
        await setDoc(sessionRef, {
            title: title,
            messages: messages,
            messageCount: messages.length,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        }, { merge: true });
        return true;
    } catch (e) {
        console.error('Save session error:', e);
        return false;
    }
};

// Load semua sessions (history list)
window.firebaseLoadHistory = async function() {
    const user = auth.currentUser;
    if (!user) return [];

    try {
        const sessionsRef = collection(db, 'users', user.uid, 'sessions');
        const q = query(sessionsRef, orderBy('updatedAt', 'desc'), limit(50));
        const snapshot = await getDocs(q);

        var history = [];
        snapshot.forEach(function(doc) {
            var data = doc.data();
            history.push({
                id: doc.id,
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
    const user = auth.currentUser;
    if (!user) return null;

    try {
        const sessionRef = doc(db, 'users', user.uid, 'sessions', sessionId);
        const snapshot = await getDoc(sessionRef);

        if (snapshot.exists()) {
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
    const user = auth.currentUser;
    if (!user) return false;

    try {
        const sessionRef = doc(db, 'users', user.uid, 'sessions', sessionId);
        await deleteDoc(sessionRef);
        return true;
    } catch (e) {
        console.error('Delete session error:', e);
        return false;
    }
};

// ========== AUTH STATE ==========
onAuthStateChanged(auth, (user) => {
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