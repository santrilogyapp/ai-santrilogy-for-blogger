// ========== SANTRILOGY AI v2.0.0 - UTILITY FUNCTIONS ==========
// Production-ready utility functions for Santrilogy AI application
// Global Namespace Implementation for Maximum Browser Compatibility

(function(global) {
    'use strict';

    // Check for required features
    if (typeof window === 'undefined') {
        console.error('Santrilogy AI Utils: Requires browser environment');
        return;
    }

    // Function untuk format angka
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Function untuk generate ID unik
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Function untuk validasi email
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Function untuk debounce
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Function untuk throttle
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Function untuk format tanggal
function formatDate(date) {
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return new Date(date).toLocaleDateString('id-ID', options);
}

// Function untuk format waktu
function formatTime(date) {
    const options = { hour: '2-digit', minute: '2-digit' };
    return new Date(date).toLocaleTimeString('id-ID', options);
}

// Function untuk cek apakah mobile
function isMobile() {
    return window.innerWidth <= 768;
}

// Function untuk cek apakah touch device
function isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints;
}

// Function untuk cek koneksi internet
function isOnline() {
    return navigator.onLine;
}

// Function untuk konversi byte ke ukuran yang lebih mudah dibaca
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Function untuk cek dukungan fitur
function supportsFeature(feature) {
    switch(feature) {
        case 'webp':
            return new Promise(resolve => {
                const webP = new Image();
                webP.onload = webP.onerror = () => {
                    resolve(webP.height === 2);
                };
                webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
            });
        case 'serviceWorker':
            return 'serviceWorker' in navigator;
        case 'indexedDB':
            return 'indexedDB' in window;
        default:
            return false;
    }
}

// Function untuk generate random string
function randomString(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Function untuk delay
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Function untuk escape HTML
function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Function untuk unescape HTML
function unescapeHtml(text) {
    var div = document.createElement('div');
    div.innerHTML = text;
    return div.textContent || div.innerText || '';
}

// Function untuk parse query string
function parseQueryString(queryString) {
    const params = {};
    const pairs = queryString.split('&');
    
    for (let i = 0; i < pairs.length; i++) {
        const pair = pairs[i].split('=');
        params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
    }
    
    return params;
}

// Function untuk menampilkan pesan error
function showError(message, elementId) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.cssText = `
        background: #fee2e2;
        color: #dc2626;
        padding: 10px 15px;
        border-radius: 6px;
        margin: 10px 0;
        border: 1px solid #fecaca;
        font-size: 0.9rem;
    `;
    errorDiv.textContent = message;
    
    if (elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.appendChild(errorDiv);
        }
    } else {
        document.body.appendChild(errorDiv);
    }
    
    // Hapus error setelah beberapa detik
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv);
        }
    }, 5000);
}

// Function untuk menyembunyikan semua error
function hideAllErrors() {
    const errors = document.querySelectorAll('.error-message');
    errors.forEach(error => error.remove());
}

// Function untuk cek apakah browser mendukung fitur modern
function checkModernFeatures() {
    const features = {
        fetch: typeof fetch !== 'undefined',
        promises: typeof Promise !== 'undefined',
        asyncAwait: true,
        localStorage: typeof localStorage !== 'undefined',
        sessionStorage: typeof sessionStorage !== 'undefined',
        webSockets: typeof WebSocket !== 'undefined',
        canvas: !!document.createElement('canvas').getContext,
        indexedDB: typeof indexedDB !== 'undefined'
    };
    
    // Coba async/await
    try {
        new Function('return async function() {}')();
    } catch(e) {
        features.asyncAwait = false;
    }
    
    return features;
}

// Function untuk cek dukungan CSS
function supportsCSS(property, value) {
    const div = document.createElement('div');
    div.style[property] = value;
    return div.style[property] === value;
}

// Function untuk mencegah multiple submit
function preventMultipleSubmit(button, timeout = 2000) {
    if (button.dataset.submitting === 'true') {
        return false;
    }
    
    button.dataset.submitting = 'true';
    button.disabled = true;
    
    setTimeout(() => {
        button.dataset.submitting = 'false';
        button.disabled = false;
    }, timeout);
    
    return true;
}

// Export functions jika menggunakan module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        formatNumber,
        generateId,
        validateEmail,
        debounce,
        throttle,
        formatDate,
        formatTime,
        isMobile,
        isTouchDevice,
        isOnline,
        formatBytes,
        supportsFeature,
        randomString,
        delay,
        escapeHtml,
        unescapeHtml,
        parseQueryString,
        showError,
        hideAllErrors,
        checkModernFeatures,
        supportsCSS,
        preventMultipleSubmit
    };
}

})(typeof window !== 'undefined' ? window : global);