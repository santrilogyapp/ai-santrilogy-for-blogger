// ========== CONFIGURATION ==========
var CONFIG = {
    WORKER_URL: "https://hidden-feather-d194.santrilogyapp.workers.dev/",
    MAX_HISTORY: 50,
    FEEDBACK_DELAY: 1200000,
    DONATION_MESSAGE_COUNT: 7
};

// ========== ENHANCED SYSTEM PROMPT ==========
var SYSTEM_PROMPT = 'Kamu adalah "Santrilogy AI", asisten cerdas yang berperan sebagai teman diskusi yang sangat cakap, cerdas, dan menyenangkan.\n\n' +
    '## IDENTITAS & KEPRIBADIAN\n' +
    '- Nama: Santrilogy AI\n' +
    '- Karakter: Ramah, humble, cerdas, dan selalu antusias membantu\n' +
    '- Kecenderungan: Ahlussunnah wal Jamaah, Mazhab Syafii dalam fikih, Asyari-Maturidi dalam Akidah dan Al-Ghazali dalam Akhlak-Tasawuf\n' +
    '- Gaya bicara: Santai tapi tetap berilmu, menggunakan bahasa Indonesia yang baik dengan sentuhan khas santri\n' +
    '- Panggilan untuk user: "Kawan" atau nama mereka jika sudah diketahui\n\n' +
    '## KEAHLIAN UTAMA\n' +
    '1. **Ilmu Keislaman**: Kitab Kuning, Fiqih, Ushul Fiqih, Tafsir, Hadits, Nahwu Shorof, Balaghah\n' +
    '2. **Pendidikan**: Metode pembelajaran efektif, tips belajar, manajemen waktu santri, dan manajemen pendidikan\n' +
    '3. **Teknologi**: Programming, AI, tools digital untuk dakwah\n' +
    '4. **Analisis Data**: Mampu menganalisis data numerik, grafik, dan statistik\n' +
    '5. **Teori Konspirasi**: Membahas teori konspirasi dengan logis dan sains, tanpa menyebarkan informasi yang salah\n' +
    '6. **Hiburan**: Suka anime dan film, bisa merekomendasikan, menganalisis, dan membahas karakter\n' +
    '7. **Seni Bercerita**: Pandai bercerita dan menghibur, kadang puitis kadang humoris\n' +
    '8. **Umum**: Sejarah Islam, motivasi, cerita inspiratif, konsultasi ringan\n\n' +
    '## FORMAT TEKS ARAB - SANGAT PENTING!\n' +
    'Untuk menampilkan teks Arab dengan indah, gunakan format berikut:\n\n' +
    '1. **Ayat Al-Quran** - gunakan tag khusus:\n' +
    '[QURAN]\nالْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ\n[/QURAN]\n\n' +
    '2. **Teks Arab biasa (hadits, kitab, dll)** - gunakan tag:\n' +
    '[ARAB]\nالحَمْدُ لِلَّهِ رَبِّ العَالَمِينَ\n[/ARAB]\n\n' +
    '3. **Arab dengan terjemahan** - gunakan format:\n' +
    '[ARAB-TERJEMAH]\nاَلسَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللهِ وَبَرَكَاتُهُ\n---\nSemoga keselamatan, rahmat Allah, dan keberkahan-Nya tercurah kepadamu\n[/ARAB-TERJEMAH]\n\n' +
    '4. **Arab inline dalam kalimat**: Gunakan format `<<teks arab>>` untuk teks Arab dalam kalimat.\n' +
    '   Contoh: Lafaz <<بِسْمِ اللَّهِ>> artinya dengan nama Allah.\n\n' +
    '## FORMAT DIAGRAM & SKEMA\n' +
    'Untuk diagram, flowchart, atau skema, gunakan Mermaid dengan baik:\n\n' +
    '1. **Flowchart** - untuk alur proses:\n' +
    '```mermaid\nflowchart TD\n    A[Mulai] --> B{Kondisi}\n    B -->|Ya| C[Proses 1]\n    B -->|Tidak| D[Proses 2]\n```\n\n' +
    '2. **Diagram hierarki** - untuk struktur:\n' +
    '```mermaid\nflowchart TB\n    A[Induk] --> B[Anak 1]\n    A --> C[Anak 2]\n```\n\n' +
    '3. **Timeline/sequence**:\n' +
    '```mermaid\nflowchart LR\n    A[Step 1] --> B[Step 2] --> C[Step 3]\n```\n\n' +
    '## PANDUAN JAWABAN\n' +
    '1. Jawab dengan lengkap tapi tidak bertele-tele\n' +
    '2. Sertakan dalil (ayat/hadits) dengan teks Arab yang benar jika membahas hukum Islam\n' +
    '3. Gunakan diagram/skema untuk memperjelas konsep yang kompleks\n' +
    '4. Berikan contoh praktis jika memungkinkan\n' +
    '5. Jika tidak yakin, katakan dengan jujur\n' +
    '6. Hindari topik sensitif politik dan khilafiyah yang memecah belah\n' +
    '7. Gunakan emoji secukupnya untuk membuat percakapan lebih hidup\n' +
    '8. Untuk hiburan dan cerita, gunakan gaya yang menghibur dan kadang puitis atau humoris\n\n' +
    '## CONTOH RESPONS IDEAL\n' +
    'User: "Jelaskan tentang Basmallah"\n\n' +
    'Response:\n' +
    'Baik kawan! Mari kita bahas tentang **Basmallah** 📖\n\n' +
    '[ARAB]\nبِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ\n[/ARAB]\n\n' +
    '**Basmallah** (البسملة) adalah ungkapan <<بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ>> yang artinya "Dengan nama Allah Yang Maha Pengasih lagi Maha Penyayang."\n\n' +
    '### Kandungan Makna:\n' +
    '1. **بِسْمِ** - Dengan nama\n' +
    '2. **اللَّهِ** - Allah (nama dzat tertinggi)\n' +
    '3. **الرَّحْمَٰنِ** - Yang Maha Pengasih (di dunia)\n' +
    '4. **الرَّحِيمِ** - Yang Maha Penyayang (di akhirat)\n\n' +
    'Ada yang ingin ditanyakan lagi, kawan? 😊';

// ========== STATE ==========
var state = {
    messages: [],
    currentImage: null,
    currentMimeType: null,
    sessionId: Date.now().toString(),
    messageCount: 0,
    isTyping: false,
    authMode: 'login',
    currentUser: null
};

// ========== DOM ELEMENTS ==========
var elements = {};

// ========== INITIALIZE ==========
function init() {
    cacheElements();
    initializeLibraries();
    loadPreferences();
    setupEventListeners();
    setupFeedbackTimer();
    setupSmartHeader();
}

function cacheElements() {
    elements = {
        sidebar: document.getElementById('sidebar'),
        sidebarBackdrop: document.getElementById('sidebarBackdrop'),
        menuToggle: document.getElementById('menuToggle'),
        newChatBtn: document.getElementById('newChatBtn'),
        historyList: document.getElementById('historyList'),
        userCard: document.getElementById('userCard'),
        userAvatar: document.getElementById('userAvatar'),
        userName: document.getElementById('userName'),
        userPlan: document.getElementById('userPlan'),
        welcomeScreen: document.getElementById('welcomeScreen'),
        messagesContainer: document.getElementById('messagesContainer'),
        typingIndicator: document.getElementById('typingIndicator'),
        inputField: document.getElementById('inputField'),
        sendBtn: document.getElementById('sendBtn'),
        fileInput: document.getElementById('fileInput'),
        uploadBtn: document.getElementById('uploadBtn'),
        imagePreview: document.getElementById('imagePreview'),
        previewImg: document.getElementById('previewImg'),
        removeImageBtn: document.getElementById('removeImageBtn'),
        chatArea: document.getElementById('chatArea'),
        mainHeader: document.getElementById('mainHeader'),
        authModal: document.getElementById('authModal'),
        authModalClose: document.getElementById('authModalClose'),
        authModalTitle: document.getElementById('authModalTitle'),
        authEmail: document.getElementById('authEmail'),
        authPassword: document.getElementById('authPassword'),
        authSubmitBtn: document.getElementById('authSubmitBtn'),
        googleAuthBtn: document.getElementById('googleAuthBtn'),
        authSwitchText: document.getElementById('authSwitchText'),
        authSwitchLink: document.getElementById('authSwitchLink'),
        authContainer: document.getElementById('authContainer'),
        loginBtn: document.getElementById('loginBtn'),
        settingsModal: document.getElementById('settingsModal'),
        settingsModalClose: document.getElementById('settingsModalClose'),
        settingsBtn: document.getElementById('settingsBtn'),
        themeLightBtn: document.getElementById('themeLightBtn'),
        themeDarkBtn: document.getElementById('themeDarkBtn'),
        colorOptions: document.getElementById('colorOptions'),
        fontSizeSlider: document.getElementById('fontSizeSlider'),
        feedbackModal: document.getElementById('feedbackModal'),
        feedbackModalClose: document.getElementById('feedbackModalClose'),
        starRating: document.getElementById('starRating'),
        shareBtn: document.getElementById('shareBtn'),
        quickPrompts: document.getElementById('quickPrompts'),
        toastContainer: document.getElementById('toastContainer')
    };
}

// ========== SMART HEADER (Hide on Scroll Down, Show on Scroll Up) ==========
function setupSmartHeader() {
    var header = elements.mainHeader; // atau document.querySelector('.main-header')
    var chatArea = elements.chatArea;

    if (!header || !chatArea) return;

    var lastScrollTop = 0;
    var scrollThreshold = 10; // Minimal scroll biar gak sensitif banget

    chatArea.addEventListener('scroll', function() {
        var currentScroll = chatArea.scrollTop;

        // Abaikan scroll bouncing (misal di iOS/Mac)
        if (currentScroll < 0) return;

        var diff = Math.abs(currentScroll - lastScrollTop);

        if (diff > scrollThreshold) {
            // Jika scroll ke BAWAH -> HIDE header
            if (currentScroll > lastScrollTop) {
                header.classList.add('hidden');
                chatArea.classList.add('expanded'); // Supaya chat area naik
            }
            // Jika scroll ke ATAS -> SHOW header
            else {
                header.classList.remove('hidden');
                chatArea.classList.remove('expanded'); // Supaya chat area turun
            }

            lastScrollTop = currentScroll;
        }
    });
}

function initializeLibraries() {
    if (typeof marked !== 'undefined') {
        marked.setOptions({
            breaks: true,
            gfm: true,
            headerIds: false,
            mangle: false
        });
    }

    if (typeof mermaid !== 'undefined') {
        mermaid.initialize({
            startOnLoad: false,
            theme: 'base',
            securityLevel: 'loose',
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            flowchart: {
                useMaxWidth: true,
                htmlLabels: true,
                curve: 'basis',
                padding: 15
            },
            themeVariables: {
                primaryColor: '#0d9488',
                primaryTextColor: '#ffffff',
                primaryBorderColor: '#0f766e',
                lineColor: '#64748b',
                secondaryColor: '#f1f5f9',
                tertiaryColor: '#ffffff',
                background: '#ffffff',
                mainBkg: '#0d9488',
                nodeBorder: '#0f766e',
                clusterBkg: '#f8fafc',
                titleColor: '#0f172a',
                edgeLabelBackground: '#ffffff'
            }
        });
    }
}

function loadPreferences() {
    var theme = localStorage.getItem('santrilogy_theme');
    if (theme) setTheme(theme, false);

    var accent = localStorage.getItem('santrilogy_accent');
    if (accent) setAccent(accent, false);

    var fontSize = localStorage.getItem('santrilogy_font');
    if (fontSize) {
        setFontSize(fontSize, false);
        if (elements.fontSizeSlider) elements.fontSizeSlider.value = fontSize;
    }
}

function setupEventListeners() {
    // Sidebar
    elements.menuToggle.addEventListener('click', function() { toggleSidebar(true); });
    elements.sidebarBackdrop.addEventListener('click', function() { toggleSidebar(false); });
    elements.newChatBtn.addEventListener('click', startNewChat);
    elements.userCard.addEventListener('click', function() {
        if (state.currentUser) {
            handleLogout();
        } else {
            openModal('authModal');
        }
    });

    // Input
    elements.inputField.addEventListener('input', function() { handleInput(); });
    elements.inputField.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    elements.sendBtn.addEventListener('click', sendMessage);
    elements.uploadBtn.addEventListener('click', function() { elements.fileInput.click(); });
    elements.fileInput.addEventListener('change', function() { handleFileSelect(); });
    elements.removeImageBtn.addEventListener('click', removeImage);

    // Quick prompts
    elements.quickPrompts.addEventListener('click', function(e) {
        var prompt = e.target.closest('.quick-prompt');
        if (prompt) {
            usePrompt(prompt.dataset.prompt);
        }
    });

    // Auth Modal
    elements.loginBtn.addEventListener('click', function() { openModal('authModal'); });
    elements.authModalClose.addEventListener('click', function() { closeModal('authModal'); });
    elements.authSubmitBtn.addEventListener('click', handleEmailAuth);
    elements.googleAuthBtn.addEventListener('click', handleGoogleAuth);
    elements.authSwitchLink.addEventListener('click', switchAuthMode);

    // Settings Modal
    elements.settingsBtn.addEventListener('click', function() { openModal('settingsModal'); });
    elements.settingsModalClose.addEventListener('click', function() { closeModal('settingsModal'); });
    elements.themeLightBtn.addEventListener('click', function() { setTheme('light'); });
    elements.themeDarkBtn.addEventListener('click', function() { setTheme('dark'); });
    elements.fontSizeSlider.addEventListener('input', function() { setFontSize(this.value); });

    // Color options
    elements.colorOptions.addEventListener('click', function(e) {
        var option = e.target.closest('.color-option');
        if (option) {
            setAccent(option.dataset.color);
        }
    });

    // Feedback Modal
    elements.feedbackModalClose.addEventListener('click', function() { closeModal('feedbackModal'); });
    elements.shareBtn.addEventListener('click', shareApp);

    // Star rating
    elements.starRating.addEventListener('click', function(e) {
        if (e.target.classList.contains('star')) {
            submitRating(parseInt(e.target.dataset.rating));
        }
    });
    elements.starRating.addEventListener('mouseover', function(e) {
        if (e.target.classList.contains('star')) {
            highlightStars(parseInt(e.target.dataset.rating));
        }
    });
    elements.starRating.addEventListener('mouseout', function() {
        highlightStars(0);
    });
}

function setupFeedbackTimer() {
    setTimeout(function() {
        if (state.messageCount >= 3) {
            openModal('feedbackModal');
        }
    }, CONFIG.FEEDBACK_DELAY);
}

// ========== UI FUNCTIONS ==========
function toggleSidebar(show) {
    elements.sidebar.classList.toggle('active', show);
    elements.sidebarBackdrop.classList.toggle('active', show);
}

function openModal(modalId) {
    var modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        setTimeout(function() { modal.classList.add('active'); }, 10);
    }
}

function closeModal(modalId) {
    var modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        setTimeout(function() { modal.style.display = 'none'; }, 250);
    }
}

function showToast(message, type) {
    type = type || 'normal';
    var toast = document.createElement('div');
    toast.className = 'toast ' + type;

    var icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
    toast.innerHTML = icon + ' <span>' + message + '</span>';

    elements.toastContainer.appendChild(toast);
    setTimeout(function() { toast.classList.add('show'); }, 10);

    setTimeout(function() {
        toast.classList.remove('show');
        setTimeout(function() { toast.remove(); }, 250);
    }, 3500);
}

function setTheme(theme, save) {
    save = save !== false;
    document.documentElement.setAttribute('data-theme', theme);
    if (save) localStorage.setItem('santrilogy_theme', theme);

    elements.themeLightBtn.classList.toggle('active', theme === 'light');
    elements.themeDarkBtn.classList.toggle('active', theme === 'dark');
}

function setAccent(color, save) {
    save = save !== false;
    document.documentElement.style.setProperty('--primary', color);
    document.documentElement.style.setProperty('--primary-light', adjustColor(color, 15));
    document.documentElement.style.setProperty('--primary-dark', adjustColor(color, -15));
    if (save) localStorage.setItem('santrilogy_accent', color);

    var options = elements.colorOptions.querySelectorAll('.color-option');
    options.forEach(function(opt) {
        opt.classList.toggle('active', opt.dataset.color === color);
    });
}

function setFontSize(size, save) {
    save = save !== false;
    document.documentElement.style.setProperty('--font-size-base', size + 'px');
    if (save) localStorage.setItem('santrilogy_font', size);
}

function adjustColor(hex, amount) {
    var num = parseInt(hex.replace('#', ''), 16);
    var r = Math.min(255, Math.max(0, (num >> 16) + amount));
    var g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
    var b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
    return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

function highlightStars(rating) {
    var stars = elements.starRating.querySelectorAll('.star');
    stars.forEach(function(star, index) {
        star.style.color = index < rating ? '#fbbf24' : 'var(--border-medium)';
        star.style.transform = index < rating ? 'scale(1.15)' : 'scale(1)';
    });
}

function submitRating(rating) {
    showToast('Terima kasih atas rating ' + rating + ' bintang! ⭐', 'success');
    closeModal('feedbackModal');
}

function shareApp() {
    var shareData = {
        title: 'Santrilogy AI',
        text: 'Diskusi seru bareng Santrilogy AI - Teman belajar Kitab Kuning & ilmu Islam! 🕌',
        url: window.location.href
    };

    if (navigator.share) {
        navigator.share(shareData);
    } else {
        navigator.clipboard.writeText(window.location.href);
        showToast('Link disalin ke clipboard! 🔗', 'success');
    }
    closeModal('feedbackModal');
}

function switchAuthMode() {
    state.authMode = state.authMode === 'login' ? 'register' : 'login';
    var isLogin = state.authMode === 'login';

    elements.authModalTitle.textContent = isLogin ? 'Selamat Datang' : 'Buat Akun';
    elements.authSubmitBtn.textContent = isLogin ? 'Masuk' : 'Daftar';
    elements.authSwitchText.textContent = isLogin ? 'Belum punya akun?' : 'Sudah punya akun?';
    elements.authSwitchLink.textContent = isLogin ? 'Daftar' : 'Masuk';
}

// ========== CHAT FUNCTIONS ==========
function handleInput() {
    var textarea = elements.inputField;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 140) + 'px';

    var hasContent = textarea.value.trim().length > 0 || state.currentImage;
    elements.sendBtn.classList.toggle('active', hasContent);
}

function handleFileSelect() {
    var input = elements.fileInput;
    if (input.files && input.files[0]) {
        var file = input.files[0];

        if (file.size > 5 * 1024 * 1024) {
            showToast('Ukuran file maksimal 5MB', 'error');
            return;
        }

        var reader = new FileReader();
        reader.onload = function(e) {
            elements.previewImg.src = e.target.result;
            elements.imagePreview.classList.add('active');
            state.currentImage = e.target.result.split(',')[1];
            state.currentMimeType = file.type;
            elements.sendBtn.classList.add('active');
        };
        reader.readAsDataURL(file);
    }
}

function removeImage() {
    elements.fileInput.value = '';
    elements.imagePreview.classList.remove('active');
    state.currentImage = null;
    state.currentMimeType = null;

    if (!elements.inputField.value.trim()) {
        elements.sendBtn.classList.remove('active');
    }
}

function usePrompt(prompt) {
    elements.inputField.value = prompt;
    handleInput();
    sendMessage();
}

function startNewChat() {
    state.messages = [];
    state.sessionId = Date.now().toString();
    state.messageCount = 0;

    elements.messagesContainer.innerHTML = '';
    elements.messagesContainer.classList.remove('active');
    elements.welcomeScreen.style.display = 'flex';

    toggleSidebar(false);
    showToast('Diskusi baru dimulai! 🚀', 'success');
}

window.sendMessage = async function() {
    // 1. Ambil elemen
    var inputField = document.getElementById('inputField');
    var welcomeScreen = document.getElementById('welcomeScreen');
    var messagesContainer = document.getElementById('messagesContainer');
    var sendBtn = document.getElementById('sendBtn');
    var imagePreview = document.getElementById('imagePreview');
    var chatArea = document.getElementById('chatArea');

    // 2. Validasi Input
    var text = inputField ? inputField.value.trim() : '';
    var hasImage = (typeof state !== 'undefined' && state.currentImage !== null);

    if (!text && !hasImage) return;
    if (typeof state !== 'undefined' && state.isTyping) return;

    // 3. UI SWITCHING
    if (welcomeScreen) welcomeScreen.style.display = 'none';

    if (messagesContainer) {
        messagesContainer.classList.add('active');
        messagesContainer.style.display = 'flex';
        messagesContainer.style.flexDirection = 'column';
    }

    // 4. Susun Pesan User
    var userMessage = {
        role: 'user',
        content: text,
        image: (state.currentImage) ? 'data:' + state.currentMimeType + ';base64,' + state.currentImage : null
    };

    // Update State
    state.messages.push(userMessage);
    state.messageCount++;

    // Render Pesan User
    renderMessage(userMessage);
    saveToChatHistory(text || 'Gambar');

    // Simpan data gambar sementara
    var imageData = state.currentImage;
    var mimeType = state.currentMimeType;

    // 5. Bersihkan Input Area
    if (inputField) {
        inputField.value = '';
        inputField.style.height = 'auto';
    }

    if (imagePreview) imagePreview.classList.remove('active');
    var fileIn = document.getElementById('fileInput');
    if (fileIn) fileIn.value = '';

    state.currentImage = null;
    state.currentMimeType = null;

    if (sendBtn) sendBtn.classList.remove('active');

    // Scroll ke bawah
    if (chatArea) chatArea.scrollTop = chatArea.scrollHeight;

    // Tampilkan Indikator "Sedang Mengetik..."
    showTypingIndicator(true);
    state.isTyping = true;

    // ============================================================
    // LOGIKA KHUSUS: JAWABAN OTOMATIS
    // ============================================================
    if (text.toLowerCase() === 'saya ingin berdiskusi denganmu') {
        setTimeout(function() {
            showTypingIndicator(false);
            state.isTyping = false;

            var specialResponse = "Dengan senang hati, kawan. Tapi sebelum kita mulai, perlu kamu ketahui bahwa saya hanyalah kecerdasan artifisial yang dikembangkan untuk banyak belajar dan membaca literatur islam Ahlussunnah wal Jama'ah secara khusus dan pengetahuan lainnya secara umum.\n\n" +
            "Terkadang, saya mendapatkan data/referensi dari golongan sebelah di internet (dan itu yang teratas kebanyakan). Jika manusia saja bisa salah, maka bagaimana dengan robot seperti saya? Oleh karena itu, saya ingatkan agar tidak menjadikan data dari saya (khususnya yang berkaitan dengan hukum islam atau hal fundamental dalam agama) sebagai acuan, ya.. saya adalah teman diskusi virtualmu, bukan gurumu.\n\n" +
            "Tetaplah belajar dengan sanad yang jelas dan gunakan otakmu untuk berpikir kritis dan bernalar yang benar. Mari berdiskusi, saya ingin beristifadah darimu, dan biar saya jadi makin pintar. Oks, mau diskusi apa, nih? 😊";

            var assistantMessage = {
                role: 'assistant',
                content: specialResponse
            };

            state.messages.push(assistantMessage);
            renderMessage(assistantMessage);
            saveSessionToCloud();

            if (chatArea) chatArea.scrollTop = chatArea.scrollHeight;

        }, 1500);

        return;
    }
    // ============================================================

    // Auto scroll setelah pesan user muncul
    setTimeout(function() {
        var userMsgElement = elements.messagesContainer.lastElementChild;

        if (userMsgElement && elements.chatArea) {
            var offset = 80;
            var elementPosition = userMsgElement.offsetTop;

            elements.chatArea.scrollTo({
                top: elementPosition - offset,
                behavior: "smooth"
            });
        }
    }, 100);

    // 6. Panggil AI Normal
    fetchAIResponse(text, imageData, mimeType);
}; // <-- Penutup sendMessage yang BENAR

function fetchAIResponse(text, imageBase64, mimeType) {
    var parts = [];

    if (text) {
        parts.push({ text: text });
    }

    if (imageBase64) {
        parts.push({
            inline_data: {
                mime_type: mimeType,
                data: imageBase64
            }
        });
    }

            // Build conversation history for context (last 8 messages)
            var conversationHistory = state.messages.slice(-8).map(function(msg) {
                return {
                    role: msg.role === 'assistant' ? 'model' : 'user',
                    parts: [{ text: msg.content }]
                };
            });

            var requestBody = {
                system_instruction: {
                    parts: [{ text: SYSTEM_PROMPT }]
                },
                contents: conversationHistory.length > 1
                    ? conversationHistory.slice(0, -1).concat([{ role: 'user', parts: parts }])
                    : [{ role: 'user', parts: parts }],
                generationConfig: {
                    temperature: 0.75,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 8192
                }
            };

            fetch(CONFIG.WORKER_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            })
            .then(function(response) {
                if (!response.ok) {
                    if (response.status === 429 || response.status === 503) {
                        throw new Error('RATE_LIMIT');
                    }
                    throw new Error('API_ERROR');
                }
                return response.json();
            })
            .then(function(data) {
                var aiText = data.candidates && data.candidates[0] &&
                            data.candidates[0].content && data.candidates[0].content.parts &&
                            data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text;

                if (!aiText) {
                    throw new Error('NO_RESPONSE');
                }

                showTypingIndicator(false);
                state.isTyping = false;

                var assistantMessage = {
                    role: 'assistant',
                    content: aiText
                };

                state.messages.push(assistantMessage);
                renderMessage(assistantMessage);
                 setTimeout(function() {
                    // Ambil elemen pesan terakhir (pesan AI yang baru saja dirender)
                    var lastMessage = elements.messagesContainer.lastElementChild;

                    if (lastMessage) {
                        // block: 'start' artinya bagian atas elemen akan nempel di bagian atas layar
                        lastMessage.scrollIntoView({ behavior: "smooth", block: "start" });

                        // Opsional: Kalau header fixed menutupi pesan, geser dikit ke bawah (manual adjustment)
                        elements.chatArea.scrollBy(0, -70);
                    }
                }, 100);
                saveSessionToCloud();

                // Check for donation reminder
                if (state.messageCount === CONFIG.DONATION_MESSAGE_COUNT) {
                    setTimeout(function() {
                        addDonationReminder();
                    }, 500);
                }
            })
            .catch(function(error) {
                showTypingIndicator(false);
                state.isTyping = false;
                handleError(error);
            });
        }

        function handleError(error) {
            var errorMessage;

            if (error.message === 'RATE_LIMIT') {
                errorMessage = createDonationErrorMessage();
            } else {
                errorMessage = 'Maaf kawan, ada gangguan teknis. Coba lagi sebentar ya... 🙏';
            }

            var errorMsg = {
                role: 'assistant',
                content: errorMessage,
                isError: true
            };

            renderMessage(errorMsg);
        }

        function createDonationErrorMessage() {
            return 'Maaf kawan, sepertinya kuota API sedang habis atau server sedang sibuk. 😅\n\n' +
                'Santrilogy AI ini **gratis** dan dibiayai secara mandiri. Jika kawan berkenan membantu operasional server, setiap donasi sangat berarti!\n\n' +
                '[DONATION]\n' +
                'Silakan coba lagi dalam beberapa menit, atau kembali lagi nanti. Terima kasih atas pengertiannya! 🙏';
        }

        // ========== RENDERING - ENHANCED ==========
        function renderMessage(message) {
            var div = document.createElement('div');
            div.className = 'message ' + (message.role === 'assistant' ? 'assistant' : 'user');

            var avatarContent = message.role === 'assistant'
                ? '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#fff" d="M21 10a16.84 16.84 0 0 0-9 3.244A16.84 16.84 0 0 0 3 10v2.96a2.004 2.004 0 0 0-2 2.007v1.004c0 1.109 2 2.208 2 2.208v2.007a14.87 14.87 0 0 1 7.417 2.55A15 15 0 0 1 12 24a15 15 0 0 1 1.583-1.264A14.87 14.87 0 0 1 21 20.186v-2.208a2.004 2.004 0 0 0 2-2.007v-1.004a2.004 2.004 0 0 0-2-2.007Zm-9 11.422a16.84 16.84 0 0 0-7-2.996v-6.15a14.8 14.8 0 0 1 5.417 2.282A15 15 0 0 1 12 15.822a15 15 0 0 1 1.583-1.264A14.8 14.8 0 0 1 19 12.275v6.151a16.84 16.84 0 0 0-7 2.996M11 8h2v1h-2zm0-4h2v1h-2z"/><path fill="#fff" d="M11 10h2v1h-2zM9 5a1 1 0 0 0 1-1a.983.983 0 0 0-.99-.99A.995.995 0 1 0 9 5"/><circle cx="15" cy="4" r="1" fill="#fff"/><path fill="#fff" d="M16 8H8a3.003 3.003 0 0 1-3-3V3a3.003 3.003 0 0 1 3-3h8a3.003 3.003 0 0 1 3 3v2a3.003 3.003 0 0 1-3 3M8 2a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1Z"/></svg>'
                : (state.currentUser ? (state.currentUser.displayName || state.currentUser.email || 'U').charAt(0).toUpperCase() : 'U');

            var contentHTML = '';

            // Image if exists
            if (message.image) {
                contentHTML += '<img src="' + message.image + '" class="message-image" alt="Uploaded image"/>';
            }

            // Content
            if (message.role === 'assistant') {
                contentHTML += formatAIResponse(message.content);
            } else {
                contentHTML += escapeHtml(message.content);
            }

            var actionsHTML = '';
            if (message.role === 'assistant') {
                actionsHTML = '<div class="message-actions">' +
                    '<button class="action-btn copy-msg-btn" title="Salin">' +
                        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>' +
                    '</button>' +
                    '<button class="action-btn regenerate-btn" title="Ulangi">' +
                        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>' +
                    '</button>' +
                '</div>';
            }

            div.innerHTML = '<div class="message-avatar">' + avatarContent + '</div>' +
                '<div class="message-content">' +
                    '<div class="message-bubble">' + contentHTML + '</div>' +
                    actionsHTML +
                '</div>';

            elements.messagesContainer.appendChild(div);

            // Add event listeners for action buttons
            var copyBtn = div.querySelector('.copy-msg-btn');
            var regenBtn = div.querySelector('.regenerate-btn');

            if (copyBtn) {
                copyBtn.addEventListener('click', function() {
                    copyMessageContent(div);
                });
            }

            if (regenBtn) {
                regenBtn.addEventListener('click', function() {
                    regenerateMessage();
                });
            }

            // Process special elements for AI messages
            if (message.role === 'assistant') {
                processCodeBlocks(div);
                processMermaidDiagrams(div);
            }
        }

        // ========== ENHANCED AI RESPONSE FORMATTING ==========
        function formatAIResponse(text) {
            var processed = text;

            // 1. Process Quran blocks
            processed = processed.replace(/\[QURAN\]([\s\S]*?)\[\/QURAN\]/g, function(match, content) {
                return '<div class="arabic-block arabic-quran">' + content.trim() + '</div>';
            });

            // 2. Process Arabic with translation blocks
            processed = processed.replace(/\[ARAB-TERJEMAH\]([\s\S]*?)---([\s\S]*?)\[\/ARAB-TERJEMAH\]/g, function(match, arabic, translation) {
                return '<div class="arabic-with-translation">' +
                    '<div class="arabic-text">' + arabic.trim() + '</div>' +
                    '<div class="translation">' + translation.trim() + '</div>' +
                '</div>';
            });

            // 3. Process Arabic blocks
            processed = processed.replace(/\[ARAB\]([\s\S]*?)\[\/ARAB\]/g, function(match, content) {
                return '<div class="arabic-block">' + content.trim() + '</div>';
            });

            // 4. Process inline Arabic <<text>>
            processed = processed.replace(/<<([^>]+)>>/g, function(match, content) {
                return '<span class="arabic-inline">' + content + '</span>';
            });

            // 5. Process donation blocks
            processed = processed.replace(/\[DONATION\]/g, function() {
                return createDonationCardHTML();
            });

            // 6. Extract and protect code blocks
            var codeBlocks = [];
            processed = processed.replace(/```(\w+)?\n([\s\S]*?)```/g, function(match, lang, code) {
                var index = codeBlocks.length;
                codeBlocks.push({ lang: lang || 'plaintext', code: code.trim() });
                return '__CODE_BLOCK_' + index + '__';
            });

            // 7. Extract and protect mermaid diagrams
            var mermaidBlocks = [];
            processed = processed.replace(/__CODE_BLOCK_(\d+)__/g, function(match, index) {
                if (codeBlocks[index].lang === 'mermaid') {
                    var mIndex = mermaidBlocks.length;
                    mermaidBlocks.push(codeBlocks[index].code);
                    return '__MERMAID_BLOCK_' + mIndex + '__';
                }
                return match;
            });

            // 8. Parse markdown
            var html = '';
            if (typeof marked !== 'undefined') {
                html = marked.parse(processed);
            } else {
                html = processed.replace(/\n/g, '<br>');
            }

            // 9. Restore code blocks with custom wrapper
            html = html.replace(/__CODE_BLOCK_(\d+)__/g, function(match, index) {
                var block = codeBlocks[index];
                return '<div class="code-block">' +
                    '<div class="code-header">' +
                        '<span class="code-lang">' + block.lang + '</span>' +
                        '<button class="copy-btn">' +
                            '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Salin' +
                        '</button>' +
                    '</div>' +
                    '<pre><code class="language-' + block.lang + '">' + escapeHtml(block.code) + '</code></pre>' +
                '</div>';
            });

            // 10. Restore mermaid blocks with enhanced wrapper
            html = html.replace(/__MERMAID_BLOCK_(\d+)__/g, function(match, index) {
                var diagramId = 'diagram-' + Date.now() + '-' + index;
                return '<div class="diagram-wrapper">' +
                    '<div class="diagram-header">' +
                        '<span class="diagram-title">' +
                            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3h18v18H3zM12 8v8M8 12h8"/></svg>' +
                            'Diagram' +
                        '</span>' +
                        '<div class="diagram-actions">' +
                            '<button class="diagram-btn fullscreen-btn" data-target="' + diagramId + '">' +
                                '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg> Perbesar' +
                            '</button>' +
                        '</div>' +
                    '</div>' +
                    '<div class="diagram-content" id="' + diagramId + '">' +
                        '<div class="mermaid">' + mermaidBlocks[index] + '</div>' +
                    '</div>' +
                '</div>';
            });

            // 11. Wrap tables
            html = html.replace(/<table>/g, '<div class="table-wrapper"><table>');
            html = html.replace(/<\/table>/g, '</table></div>');

            return html;
        }

        function createDonationCardHTML() {
            return '<div class="donation-card">' +
                '<div class="donation-header">' +
                    '<span class="donation-icon">💝</span>' +
                    '<span class="donation-title">Dukung Santrilogy AI</span>' +
                '</div>' +
                '<div class="donation-text">' +
                    'Santrilogy AI gratis untuk semua. Setiap donasi sangat membantu operasional server dan pengembangan fitur baru.' +
                '</div>' +
                '<div class="donation-platforms">' +
                    '<a href="https://saweria.co/santrilogy" target="_blank" class="donation-btn">🎁 Saweria</a>' +
                    '<a href="https://trakteer.id/santrilogy.com/tip" target="_blank" class="donation-btn">☕ Trakteer</a>' +
                    '<a href="https://sociabuzz.com/santrilogy/tribe" target="_blank" class="donation-btn">🚀 Sociabuzz</a>' +
                    '<a href="https://nihbuatjajan.com/santrilogy" target="_blank" class="donation-btn">🍕 NBJ</a>' +
                '</div>' +
                '<div class="donation-manual" style="margin-top:15px; border-top:1px dashed #ccc; padding-top:15px;">' +
                    '<label style="font-size:0.8rem; display:block; margin-bottom:5px;">Atau transfer langsung (QRIS/E-Wallet):</label>' +
                    '<div style="display:flex; gap:10px;">' +
                        '<input type="number" id="manualDonationInput" class="custom-input" placeholder="Min. Rp 1.000" style="margin:0; flex:1;">' +
                        '<button id="manualPayBtn" class="pay-action-btn" style="width:auto; margin:0;" onclick="processManualMidtrans()">Bayar</button>' +
                    '</div>' +
                '</div>';
        }

        // Fungsi untuk memproses pembayaran manual
        window.processManualMidtrans = function() {
            const inputEl = document.getElementById('manualDonationInput');
            const btnEl = document.getElementById('manualPayBtn');

            if (!inputEl || !btnEl) return;

            const amount = parseInt(inputEl.value);

            // Validasi
            if (!amount || amount < 1000) {
                // Pastikan fungsi showToast ada, atau ganti dengan alert
                if(typeof showToast === 'function') showToast("Minimal Rp 1.000 ya kawan 🙏", "error");
                else alert("Minimal Rp 1.000 ya kawan 🙏");
                return;
            }

            // Loading State
            const originalText = btnEl.innerText;
            btnEl.innerText = "⏳";
            btnEl.disabled = true;

            // Panggil Worker (Ganti URL dengan worker Anda)
            const WORKER_URL = "https://divine-block-efa9.fatihhusni9.workers.dev";

            fetch(WORKER_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    transaction_details: {
                        order_id: "SANTRI-M-" + Date.now(),
                        gross_amount: amount
                    },
                    customer_details: {
                        first_name: "Sahabat",
                        last_name: "Santrilogy",
                        email: "guest@santrilogy.com"
                    }
                })
            })
            .then(res => res.json())
            .then(data => {
                btnEl.innerText = originalText;
                btnEl.disabled = false;

                if (data.token) {
                    window.snap.pay(data.token, {
                        onSuccess: function(result){ alert("Alhamdulillah! Terima kasih."); inputEl.value=""; },
                        onPending: function(result){ console.log("Menunggu pembayaran"); },
                        onError: function(result){ alert("Pembayaran gagal."); }
                    });
                } else {
                    alert("Gagal membuat transaksi.");
                }
            })
            .catch(err => {
                btnEl.innerText = originalText;
                btnEl.disabled = false;
                alert("Gagal koneksi ke server.");
            });
        };

        function addDonationReminder() {
            var reminderDiv = document.createElement('div');
            reminderDiv.className = 'message assistant';
            reminderDiv.innerHTML =
                '<div class="message-avatar">' +
                    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="2.197" fill="#fff"/><path fill="#fff" d="M21.63441 6.43671c-.70909-1.22723-2.41155-1.73142-4.79628-1.42354c-.30258.03942-.61354.09379-.92927.15769C15.00856 2.619 13.6066 1 12 1C10.39089 1 8.98713 2.62441 8.087 5.1834c-2.7384-.54268-4.90657-.15669-5.72186 1.25331C1.55256 7.84376 2.2947 9.90626 4.12193 12C2.2947 14.09374 1.55256 16.15624 2.3651 17.56329c.58143 1.00732 1.85 1.49542 3.52453 1.49542a11.47535 11.47535 0 0 0 2.197-.24305C8.98673 21.37518 10.39069 23 12 23c1.60658 0 3.00854-1.619 3.90884-4.17086c.31573.0639.62669.11827.92927.15769a10.18235 10.18235 0 0 0 1.297.088c1.70461 0 2.92647-.52028 3.49932-1.51151c.81254-1.407.07053-3.46955-1.75643-5.56329C21.70494 9.90626 22.447 7.84376 21.63441 6.43671ZM16.9851 6.13956a9.0809 9.0809 0 0 1 1.15965-.08046c1.26048 0 2.14979.32826 2.507.94617c.50426.87335-.06645 2.44138-1.55187 4.16777a20.50554 20.50554 0 0 0-2.30139-1.95281a19.9752 19.9752 0 0 0-.5471-2.93612C16.49539 6.23744 16.7503 6.17013 16.9851 6.13956Zm-3.07236 9.17417c-.64647.37332-1.28408.70346-1.90695.9935c-.63936-.29755-1.2812-.62534-1.919-.9935c-.64888-.37459-1.25525-.76326-1.81959-1.15917c-.06229-.6861-.09688-1.405-.09688-2.15456s.03459-1.46846.09688-2.15456c.56434-.39591 1.17071-.78458 1.81959-1.15917c.63487-.36648 1.27383-.69333 1.91024-.98982c.62668.29132 1.26511.61409 1.91573.98982c.64908.37472 1.25572.76346 1.82019 1.15958c.06222.686.09682 1.40477.09682 2.15415s-.0346 1.46813-.09682 2.15415C15.16846 14.55027 14.56182 14.939 13.91274 15.31373Zm1.628.3351a17.87565 17.87565 0 0 1-.39136 1.82408a18.46424 18.46424 0 0 1-1.76012-.58257c.36293-.18713.72713-.38337 1.092-.594C14.8457 16.086 15.1977 15.86928 15.54078 15.64883Zm-4.92407 1.24372A18.41329 18.41329 0 0 1 8.851 17.474a17.86018 17.86018 0 0 1-.39176-1.82549c.34328.22058.69541.43734 1.06.64787C9.88355 16.50677 10.24989 16.70348 10.61671 16.89255ZM7.07428 13.25036A18.3863 18.3863 0 0 1 5.67548 12a18.38878 18.38878 0 0 1 1.3988-1.25043c-.02005.41033-.03252.82636-.03252 1.25043S7.05423 12.8401 7.07428 13.25036Zm1.385-4.89886a17.86727 17.86727 0 0 1 .391-1.82227a18.22228 18.22228 0 0 1 1.76937.57681c-.36775.18947-.735.38659-1.10031.59759C9.15468 7.91416 8.80255 8.13092 8.45927 8.3515Zm4.93057-1.242a18.48842 18.48842 0 0 1 1.75958-.58237a17.87565 17.87565 0 0 1 .39136 1.82408c-.34308-.22045-.69508-.43715-1.05948-.64754C14.11663 7.4931 13.75263 7.29652 13.38984 7.10946ZM16.92577 10.75A18.40125 18.40125 0 0 1 18.324 12a18.38809 18.38809 0 0 1-1.39826 1.25c.02-.41013.03251-.826.03251-1.25S16.94581 11.1601 16.92577 10.75ZM12 2.12854c.99773 0 2.05613 1.23433 2.80746 3.31044a20.80159 20.80159 0 0 0-2.8094 1.01141A20.51935 20.51935 0 0 0 9.19055 5.44481C9.94208 3.36508 11.00163 2.12854 12 2.12854ZM3.34774 7.00527c.35133-.60825 1.2519-.93437 2.52043-.93437a10.26212 10.26212 0 0 1 1.88362.20148A19.96778 19.96778 0 0 0 7.20147 9.2205a20.48874 20.48874 0 0 0-2.30166 1.95288C3.41412 9.44692 2.84341 7.87869 3.34774 7.00527Zm0 9.98946c-.50433-.87342.06638-2.44165 1.55207-4.16811A20.50145 20.50145 0 0 0 7.20147 14.7795a19.94422 19.94422 0 0 0 .5518 2.95356C5.50578 18.162 3.85468 17.87245 3.34774 16.99473ZM12 21.87146c-.99866 0-2.05847-1.23708-2.81007-3.31775a20.44828 20.44828 0 0 0 2.81155-1.00255a20.80209 20.80209 0 0 0 2.806 1.00979C14.05615 20.63706 12.99775 21.87146 12 21.87146Zm8.65175-4.87673c-.45914.79277-1.79257 1.10923-3.66667.86571c-.2348-.03057-.48971-.09788-.73369-.14455a19.97619 19.97619 0 0 0 .5471-2.93619A20.50419 20.50419 0 0 0 19.0999 12.827C20.58532 14.55335 21.156 16.12138 20.65177 16.99473Z"/><circle cx="-.5" cy="2" r="1.5" fill="#fff"><animateMotion dur="2s" path="M14.75 14.1471C12.2277 15.6034 9.69019 16.4332 7.6407 16.6145C5.54599 16.7998 4.15833 16.3018 3.62324 15.375C3.08815 14.4482 3.35067 12.9974 4.55852 11.276C5.74031 9.59178 7.72768 7.80915 10.25 6.35289C12.7723 4.89662 15.3098 4.06682 17.3593 3.88549C19.454 3.70016 20.8417 4.1982 21.3768 5.125C21.9118 6.0518 21.6493 7.50256 20.4415 9.22397C19.2597 10.9082 17.2723 12.6909 14.75 14.1471Z" repeatCount="indefinite"/></circle></svg>' +
                '</div>' +
                '<div class="message-content">' +
                    '<div class="message-bubble">' +
                        '<p>Kawan, sebelum lanjut, izinkan saya menyampaikan sedikit pesan... 😊</p>' +
                        createDonationCardHTML() +
                        '<p>Terima kasih sudah menggunakan Santrilogy AI! Mari lanjutkan diskusinya. 🙏</p>' +
                    '</div>' +
                '</div>';
            elements.messagesContainer.appendChild(reminderDiv);
        }

        function processCodeBlocks(container) {
            // Add copy functionality
            var copyBtns = container.querySelectorAll('.code-block .copy-btn');
            copyBtns.forEach(function(btn) {
                btn.addEventListener('click', function() {
                    var codeBlock = btn.closest('.code-block');
                    var code = codeBlock.querySelector('code').textContent;

                    navigator.clipboard.writeText(code).then(function() {
                        btn.classList.add('copied');
                        btn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Tersalin!';

                        setTimeout(function() {
                            btn.classList.remove('copied');
                            btn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Salin';
                        }, 2000);
                    });
                });
            });

            // Syntax highlighting
            if (typeof hljs !== 'undefined') {
                var codeElements = container.querySelectorAll('pre code');
                codeElements.forEach(function(block) {
                    if (!block.classList.contains('hljs')) {
                        hljs.highlightElement(block);
                    }
                });
            }
        }

        function processMermaidDiagrams(container) {
            if (typeof mermaid !== 'undefined') {
                var mermaidDivs = container.querySelectorAll('.mermaid');
                if (mermaidDivs.length > 0) {
                    try {
                        mermaid.run({ nodes: mermaidDivs });
                    } catch(e) {
                        console.log('Mermaid render error:', e);
                    }
                }

                // Add fullscreen functionality
                var fullscreenBtns = container.querySelectorAll('.fullscreen-btn');
                fullscreenBtns.forEach(function(btn) {
                    btn.addEventListener('click', function() {
                        var targetId = btn.dataset.target;
                        var diagramContent = document.getElementById(targetId);
                        if (diagramContent) {
                            toggleDiagramFullscreen(diagramContent);
                        }
                    });
                });
            }
        }

        function toggleDiagramFullscreen(diagramContent) {
            // Simple fullscreen toggle using a modal-like approach
            var isFullscreen = diagramContent.classList.contains('fullscreen-active');

            if (isFullscreen) {
                diagramContent.classList.remove('fullscreen-active');
                document.body.style.overflow = '';
            } else {
                diagramContent.classList.add('fullscreen-active');
                document.body.style.overflow = 'hidden';
            }
        }

        function showTypingIndicator(show) {
            elements.typingIndicator.classList.toggle('active', show);
        }

        // ========== UTILITY FUNCTIONS ==========
        function escapeHtml(text) {
            var div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        function copyMessageContent(messageDiv) {
            var content = messageDiv.querySelector('.message-bubble').textContent;
            navigator.clipboard.writeText(content).then(function() {
                showToast('Pesan disalin! 📋', 'success');
            });
        }

        function regenerateMessage() {
            if (state.messages.length < 2 || state.isTyping) return;

            // Remove last AI message from state
            state.messages.pop();
            var lastUserMsg = state.messages[state.messages.length - 1];

            // Remove last message from UI
            var messages = elements.messagesContainer.querySelectorAll('.message');
            if (messages.length > 0) {
                messages[messages.length - 1].remove();
            }

            // Re-send
            showTypingIndicator(true);
            state.isTyping = true;

            fetchAIResponse(lastUserMsg.content, null, null);
        }

        // ========== DONATION FUNCTION ==========
        function triggerDonation() {
            var amountInput = document.getElementById('manualDonationAmount');
            var amount = amountInput ? parseInt(amountInput.value) : 0;

            if (!amount || amount < 1000) {
                showToast('Minimal donasi Rp 1.000 ya kawan 😊', 'warning');
                return;
            }

            // Open Saweria with amount (or implement Midtrans if configured)
            window.open('https://saweria.co/santrilogy?amount=' + amount, '_blank');
            showToast('Terima kasih atas niat baiknya! 🙏', 'success');
        }

        // ========== SAVE SESSION ==========
        function saveSessionToCloud() {
            if (!state.currentUser || state.messages.length === 0) return;

            var title = state.messages[0].content.substring(0, 35);
            if (state.messages[0].content.length > 35) title += '...';

            // Simpan ke Firestore (async, tidak blocking)
            if (typeof window.firebaseSaveSession === 'function') {
                window.firebaseSaveSession(state.sessionId, title, state.messages);
            }

            // Juga simpan ke localStorage sebagai cache
            saveToLocalCache();
        }

        // Cache lokal untuk 5 session terakhir (fast load)
        function saveToLocalCache() {
            if (!state.currentUser) return;

            var cacheKey = 'santrilogy_cache_' + state.currentUser.uid;
            var cache = {};

            try {
                cache = JSON.parse(localStorage.getItem(cacheKey) || '{}');
            } catch(e) {
                cache = {};
            }

            cache[state.sessionId] = {
                title: state.messages[0] ? state.messages[0].content.substring(0, 35) : 'Chat',
                messages: state.messages,
                timestamp: Date.now()
            };

            // Keep only 5 recent
            var keys = Object.keys(cache).sort(function(a, b) {
                return cache[b].timestamp - cache[a].timestamp;
            });

            if (keys.length > 5) {
                keys.slice(5).forEach(function(key) {
                    delete cache[key];
                });
            }

            localStorage.setItem(cacheKey, JSON.stringify(cache));
        }

        // ========== LOAD HISTORY ==========
        function loadHistoryFromFirestore() {
            // Jika fungsi firebase belum siap (karena delay network), coba lagi dalam 500ms
            if (typeof window.firebaseLoadHistory !== 'function') {
                console.log("Menunggu Firebase...");
                setTimeout(loadHistoryFromFirestore, 500);
                return;
            }

            // Tampilkan Loading Skeleton
            elements.historyList.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-tertiary);font-size:0.85rem">Memuat data...</div>';

            // Panggil fungsi Global Firebase
            window.firebaseLoadHistory().then(function(history) {
                renderHistoryList(history);
            }).catch(function(e) {
                console.error('Gagal memuat history:', e);
                // Fallback ke local storage jika internet error
                loadChatHistory();
            });
        }

        function renderHistoryList(history) {
            if (!history || history.length === 0) {
                elements.historyList.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-tertiary);font-size:0.85rem">Belum ada riwayat diskusi</div>';
                return;
            }

            // Sorting & Grouping
            var today = new Date().toDateString();
            var yesterday = new Date(Date.now() - 86400000).toDateString();
            var grouped = { today: [], yesterday: [], older: [] };

            history.forEach(function(item) {
                var d = new Date(item.timestamp).toDateString();
                if (d === today) grouped.today.push(item);
                else if (d === yesterday) grouped.yesterday.push(item);
                else grouped.older.push(item);
            });

            var html = '';

            // Helper function buat item HTML
            function buildItem(item) {
                var activeClass = (item.id === state.sessionId) ? ' active' : '';
                // Kita tambahkan tombol hapus kecil (opsional, tapi bagus untuk UX)
                return `
                    <div class="nav-item${activeClass}" id="history-${item.id}">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;opacity:0.6"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                        <span class="nav-item-text">${escapeHtml(item.title)}</span>
                        <div class="delete-session" title="Hapus" style="opacity:0;margin-left:auto;cursor:pointer" onclick="SantrilogyApp.deleteSession('${item.id}', event)">×</div>
                    </div>
                `;
            }

            if (grouped.today.length) {
                html += '<div class="nav-section-title">Hari Ini</div>';
                grouped.today.forEach(function(i) { html += buildItem(i); });
            }
            if (grouped.yesterday.length) {
                html += '<div class="nav-section-title" style="margin-top:14px">Kemarin</div>';
                grouped.yesterday.forEach(function(i) { html += buildItem(i); });
            }
            if (grouped.older.length) {
                html += '<div class="nav-section-title" style="margin-top:14px">Sebelumnya</div>';
                grouped.older.forEach(function(i) { html += buildItem(i); });
            }

            elements.historyList.innerHTML = html;

            // == KUNCI PERBAIKAN: Event Listener Manual ==
            // Kita loop element yang baru saja dibuat untuk pasang event listener
            history.forEach(function(item) {
                var el = document.getElementById('history-' + item.id);
                if (el) {
                    // Event Hover untuk tombol delete
                    el.addEventListener('mouseenter', function() { this.querySelector('.delete-session').style.opacity = '1'; });
                    el.addEventListener('mouseleave', function() { this.querySelector('.delete-session').style.opacity = '0'; });

                    // Event Click Load Session
                    el.addEventListener('click', function(e) {
                        // Jangan load jika yang diklik tombol delete
                        if(e.target.classList.contains('delete-session')) return;

                        // Visual feedback
                        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
                        this.classList.add('active');

                        // Load Logic
                        loadSession(item.id);

                        // Tutup sidebar di mobile
                        if(window.innerWidth <= 900) toggleSidebar(false);
                    });
                }
            });
        }

        // ========== LOAD SESSION (DEBUG VERSION) ==========
        function loadSession(sessionId) {
            console.log("1. [LoadSession] Memulai...", sessionId);

            // Cek Cache Lokal
            var cacheKey = 'santrilogy_cache_' + (state.currentUser ? state.currentUser.uid : 'guest');
            var cache = {};
            try { cache = JSON.parse(localStorage.getItem(cacheKey) || '{}'); } catch(e) {}

            if (cache[sessionId]) {
                console.log("2. [LoadSession] Ditemukan di cache lokal");
                applySessionData(sessionId, cache[sessionId].messages);
                return;
            }

            // Cek Firestore
            if (state.currentUser) {
                console.log("2. [LoadSession] Mencari di Firestore...");
                showToast('Mengambil data...', 'normal');

                if (typeof window.firebaseLoadSession !== 'function') {
                    console.error("EROR: Fungsi firebaseLoadSession tidak ditemukan!");
                    return;
                }

                window.firebaseLoadSession(sessionId).then(function(data) {
                    console.log("3. [LoadSession] Data diterima dari Firestore:", data);

                    if (data && data.messages && Array.isArray(data.messages)) {
                        console.log("4. [LoadSession] Data valid. Jumlah pesan:", data.messages.length);
                        applySessionData(sessionId, data.messages);
                    } else {
                        console.warn("4. [LoadSession] Data tidak valid atau messages kosong");
                        showToast('Data riwayat rusak/kosong', 'error');
                    }
                }).catch(function(e) {
                    console.error("EROR [LoadSession]:", e);
                    showToast('Gagal memuat', 'error');
                });
            }
        }

        // Helper untuk highlight session aktif di sidebar
        function updateHistoryActiveState(activeSessionId) {
            // Cari langsung di DOM, jangan pakai cache 'elements' untuk safety
            var list = document.getElementById('historyList');
            if (!list) return;

            var items = list.querySelectorAll('.nav-item');
            items.forEach(function(item) {
                if (item.dataset.id === activeSessionId) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            });
        }

        // ========== APPLY SESSION (DEBUG VERSION + FORCE DOM) ==========
        function applySessionData(sessionId, messages) {
            console.log("5. [ApplySession] Memulai rendering UI...");

            // Update State
            state.sessionId = sessionId;
            state.messages = messages;
            state.messageCount = messages.length;

            // AMBIL ELEMEN LANGSUNG DARI DOM (JANGAN PAKAI CACHE 'elements')
            var container = document.getElementById('messagesContainer');
            var welcome = document.getElementById('welcomeScreen');
            var chatArea = document.getElementById('chatArea');

            if (!container) {
                console.error("FATAL: Elemen 'messagesContainer' tidak ditemukan di HTML!");
                return;
            }

            // 1. RESET LAYAR
            console.log("6. [ApplySession] Reset layar & visibility");
            container.innerHTML = '';

            // 2. PAKSA GANTI TAMPILAN (Inline Styles)
            if (welcome) welcome.style.display = 'none';

            // Paksa display flex langsung ke elemen
            container.style.cssText = "display: flex !important; opacity: 1 !important; visibility: visible !important;";
            container.classList.add('active');

            // 3. RENDER LOOP
            console.log("7. [ApplySession] Rendering", messages.length, "pesan...");

            messages.forEach(function(msg, index) {
                try {
                    // Buat elemen pesan manual disini agar tidak tergantung fungsi luar
                    var div = document.createElement('div');
                    div.className = 'message ' + (msg.role === 'assistant' ? 'assistant' : 'user');

                    // Tentukan Avatar
                    var avatarHtml = msg.role === 'assistant'
                        ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/></svg>'
                        : 'U';

                    // Tentukan Konten
                    var contentHtml = msg.role === 'assistant' ? formatAIResponse(msg.content) : escapeHtml(msg.content);

                    // Susun HTML
                    div.innerHTML =
                        '<div class="message-avatar">' + avatarHtml + '</div>' +
                        '<div class="message-content"><div class="message-bubble">' + contentHtml + '</div></div>';

                    // Masukkan ke container
                    container.appendChild(div);

                    // Proses diagram khusus assistant
                    if (msg.role === 'assistant') {
                        processCodeBlocks(div);
                        processMermaidDiagrams(div);
                    }
                } catch (err) {
                    console.error("Error rendering message ke-" + index, err);
                }
            });

            console.log("8. [ApplySession] Selesai render. Scrolling...");

            // 4. SCROLL
            if (chatArea) {
                setTimeout(function() {
                    chatArea.scrollTop = chatArea.scrollHeight;
                }, 100);
            }

            updateHistoryActiveState(sessionId);
            toggleSidebar(false);
        }

        // Tambahkan fungsi helper kecil ini agar render lebih aman
        function renderMessageToContainer(message, targetContainer) {
            var div = document.createElement('div');
            div.className = 'message ' + (message.role === 'assistant' ? 'assistant' : 'user');

            var avatarContent = message.role === 'assistant'
                ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/></svg>'
                : (state.currentUser ? (state.currentUser.displayName || state.currentUser.email || 'U').charAt(0).toUpperCase() : 'U');

            var contentHTML = '';
            if (message.image) {
                contentHTML += '<img src="' + message.image + '" class="message-image" alt="Uploaded image"/>';
            }
            if (message.role === 'assistant') {
                contentHTML += formatAIResponse(message.content);
            } else {
                contentHTML += escapeHtml(message.content);
            }

            // Action buttons (copy/regenerate)
            var actionsHTML = '';
            if (message.role === 'assistant') {
                actionsHTML = '<div class="message-actions">' +
                    '<button class="action-btn copy-msg-btn" title="Salin"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></button>' +
                    '</div>';
            }

            div.innerHTML = '<div class="message-avatar">' + avatarContent + '</div>' +
                '<div class="message-content">' +
                    '<div class="message-bubble">' + contentHTML + '</div>' +
                    actionsHTML +
                '</div>';

            targetContainer.appendChild(div);

            // Re-process diagrams/code
            if (message.role === 'assistant') {
                processCodeBlocks(div);
                processMermaidDiagrams(div);
            }
        }

        // Helper untuk save cache manual
        function saveToLocalCacheWithData(sessionId, title, messages) {
            if (!state.currentUser) return;
            var cacheKey = 'santrilogy_cache_' + state.currentUser.uid;
            var cache = {};
            try { cache = JSON.parse(localStorage.getItem(cacheKey) || '{}'); } catch(e) {}

            cache[sessionId] = {
                title: title,
                messages: messages,
                timestamp: Date.now()
            };
            localStorage.setItem(cacheKey, JSON.stringify(cache));
        }

        // ========== DELETE SESSION ==========
        function deleteSession(sessionId, event) {
            if (event) event.stopPropagation();

            if (typeof window.firebaseDeleteSession === 'function' && state.currentUser) {
                window.firebaseDeleteSession(sessionId).then(function(success) {
                    if (success) {
                        // Hapus dari cache juga
                        var cacheKey = 'santrilogy_cache_' + state.currentUser.uid;
                        var cache = {};
                        try {
                            cache = JSON.parse(localStorage.getItem(cacheKey) || '{}');
                            delete cache[sessionId];
                            localStorage.setItem(cacheKey, JSON.stringify(cache));
                        } catch(e) {}

                        if (sessionId === state.sessionId) {
                            startNewChat();
                        }

                        loadHistoryFromFirestore();
                        showToast('Riwayat dihapus', 'success');
                    }
                });
            }
        }

        // ========== UPDATE EXPOSE ==========
        window.SantrilogyApp = {
            updateUserUI: updateUserUI,
            showToast: showToast,
            closeModal: closeModal,
            loadChatHistory: loadChatHistory,
            loadHistoryFromFirestore: loadHistoryFromFirestore, // <-- TAMBAH
            triggerDonation: triggerDonation,
            loadSession: loadSession,
            deleteSession: deleteSession,
            state: state
        };

        // ========== HISTORY MANAGEMENT ==========
        function saveToChatHistory(firstMessage) {
            if (!state.currentUser) return;

            var historyKey = 'santrilogy_history_' + state.currentUser.uid;
            var history = [];
            try {
                history = JSON.parse(localStorage.getItem(historyKey) || '[]');
            } catch(e) {
                history = [];
            }

            // Check if session already exists
            var existingIndex = -1;
            for (var i = 0; i < history.length; i++) {
                if (history[i].id === state.sessionId) {
                    existingIndex = i;
                    break;
                }
            }

            if (existingIndex === -1) {
                history.unshift({
                    id: state.sessionId,
                    title: firstMessage.substring(0, 35) + (firstMessage.length > 35 ? '...' : ''),
                    timestamp: Date.now(),
                    messageCount: 1
                });

                // Limit history
                if (history.length > CONFIG.MAX_HISTORY) {
                    history = history.slice(0, CONFIG.MAX_HISTORY);
                }
            } else {
                history[existingIndex].messageCount++;
                history[existingIndex].timestamp = Date.now();
            }

            localStorage.setItem(historyKey, JSON.stringify(history));
            loadChatHistory();
        }

        function loadChatHistory() {
            if (!state.currentUser) {
                elements.historyList.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-tertiary);font-size:0.85rem">Login untuk menyimpan riwayat</div>';
                return;
            }

            var historyKey = 'santrilogy_history_' + state.currentUser.uid;
            var history = [];
            try {
                history = JSON.parse(localStorage.getItem(historyKey) || '[]');
            } catch(e) {
                history = [];
            }

            if (history.length === 0) {
                elements.historyList.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-tertiary);font-size:0.85rem">Belum ada riwayat diskusi</div>';
                return;
            }

            // Group by date
            var today = new Date().toDateString();
            var yesterday = new Date(Date.now() - 86400000).toDateString();

            var grouped = {
                today: [],
                yesterday: [],
                older: []
            };

            history.forEach(function(item) {
                var itemDate = new Date(item.timestamp).toDateString();
                if (itemDate === today) {
                    grouped.today.push(item);
                } else if (itemDate === yesterday) {
                    grouped.yesterday.push(item);
                } else {
                    grouped.older.push(item);
                }
            });

            var html = '';

            if (grouped.today.length > 0) {
                html += '<div class="nav-section-title">Hari Ini</div>';
                grouped.today.forEach(function(item) {
                    html += createHistoryItem(item);
                });
            }

            if (grouped.yesterday.length > 0) {
                html += '<div class="nav-section-title" style="margin-top:14px">Kemarin</div>';
                grouped.yesterday.forEach(function(item) {
                    html += createHistoryItem(item);
                });
            }

            if (grouped.older.length > 0) {
                html += '<div class="nav-section-title" style="margin-top:14px">Sebelumnya</div>';
                grouped.older.forEach(function(item) {
                    html += createHistoryItem(item);
                });
            }

            elements.historyList.innerHTML = html;

            // Add click handlers for history items
             var historyItems = elements.historyList.querySelectorAll('.nav-item');
            historyItems.forEach(function(item) {
                item.addEventListener('click', function(e) {
                    // Cek apakah yang diklik tombol delete atau itemnya
                    if (e.target.closest('.delete-session-btn')) return;

                    var sessionId = item.dataset.id;
                    console.log("Clicked session:", sessionId); // Debugging
                    loadSession(sessionId);
                });
            });
        }

        function createHistoryItem(item) {
            var isActive = item.id === state.sessionId;
            return '<div class="nav-item' + (isActive ? ' active' : '') + '" data-id="' + item.id + '">' +
                '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;opacity:0.6"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>' +
                '<span class="nav-item-text">' + escapeHtml(item.title) + '</span>' +
            '</div>';
        }

        // ========== FIRESTORE INTEGRATION ==========

        function loadHistoryFromFirestore() {
            // Cek apakah fungsi Firebase sudah siap
            if (typeof window.firebaseLoadHistory !== 'function') {
                console.log("Firebase not ready, fallback to local");
                loadChatHistory(); // Fallback ke localStorage
                return;
            }

            // Tampilkan loading state di sidebar
            if (elements.historyList) {
                elements.historyList.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-tertiary);font-size:0.85rem">Memuat data...</div>';
            }

            // Panggil fungsi Firebase
            window.firebaseLoadHistory().then(function(history) {
                renderHistoryList(history);
            }).catch(function(e) {
                console.error('Load history failed:', e);
                loadChatHistory(); // Fallback jika gagal
            });
        }

        function renderHistoryList(history) {
            if (!history || history.length === 0) {
                elements.historyList.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-tertiary);font-size:0.85rem">Belum ada riwayat diskusi</div>';
                return;
            }

            // Group by date
            var today = new Date().toDateString();
            var yesterday = new Date(Date.now() - 86400000).toDateString();

            var grouped = { today: [], yesterday: [], older: [] };

            history.forEach(function(item) {
                var itemDate = new Date(item.timestamp).toDateString();
                if (itemDate === today) grouped.today.push(item);
                else if (itemDate === yesterday) grouped.yesterday.push(item);
                else grouped.older.push(item);
            });

            var html = '';

            if (grouped.today.length > 0) {
                html += '<div class="nav-section-title">Hari Ini</div>';
                grouped.today.forEach(function(item) { html += createHistoryItem(item); });
            }

            if (grouped.yesterday.length > 0) {
                html += '<div class="nav-section-title" style="margin-top:14px">Kemarin</div>';
                grouped.yesterday.forEach(function(item) { html += createHistoryItem(item); });
            }

            if (grouped.older.length > 0) {
                html += '<div class="nav-section-title" style="margin-top:14px">Sebelumnya</div>';
                grouped.older.forEach(function(item) { html += createHistoryItem(item); });
            }

            elements.historyList.innerHTML = html;

            // Re-attach event listeners
            var historyItems = elements.historyList.querySelectorAll('.nav-item');
            historyItems.forEach(function(item) {
                item.addEventListener('click', function() {
                    // Logic load session (bisa ditambahkan nanti untuk firestore load)
                    // Sementara pakai toast dulu
                    if (typeof window.firebaseLoadSession === 'function') {
                        showToast('Memuat percakapan...', 'normal');
                        // Implementasi load session firestore bisa menyusul
                    }
                    toggleSidebar(false);
                });
            });
        }

        // ========== AUTH FUNCTIONS ==========
        function handleEmailAuth() {
            var email = elements.authEmail.value;
            var password = elements.authPassword.value;

            if (!email || !password) {
                showToast('Isi email & password!', 'error');
                return;
            }

            if (typeof window.firebaseEmailAuth === 'function') {
                window.firebaseEmailAuth(email, password, state.authMode);
            } else {
                showToast('Sistem autentikasi belum siap', 'error');
            }
        }

        function handleGoogleAuth() {
            if (typeof window.firebaseGoogleAuth === 'function') {
                window.firebaseGoogleAuth();
            } else {
                showToast('Sistem autentikasi belum siap', 'error');
            }
        }

        function handleLogout() {
            if (typeof window.firebaseLogout === 'function') {
                window.firebaseLogout();
            } else {
                showToast('Sistem autentikasi belum siap', 'error');
            }
        }

        function updateUserUI(user) {
            state.currentUser = user;

            if (user) {
                var initial = (user.displayName || user.email || 'U').charAt(0).toUpperCase();

                elements.authContainer.innerHTML = '<div class="user-avatar" style="width:34px;height:34px;cursor:pointer" id="headerUserAvatar">' +
                    (user.photoURL ? '<img src="' + user.photoURL + '" alt=""/>' : initial) +
                '</div>';

                document.getElementById('headerUserAvatar').addEventListener('click', handleLogout);

                elements.userAvatar.innerHTML = user.photoURL ? '<img src="' + user.photoURL + '" alt=""/>' : initial;
                elements.userName.textContent = user.displayName || user.email.split('@')[0];
                elements.userPlan.textContent = 'Klik untuk logout';

                loadChatHistory();
            } else {
                elements.authContainer.innerHTML = '<button class="login-btn" id="loginBtn">Masuk</button>';
                document.getElementById('loginBtn').addEventListener('click', function() { openModal('authModal'); });

                elements.userAvatar.innerHTML = '?';
                elements.userName.textContent = 'Guest';
                elements.userPlan.textContent = 'Klik untuk masuk';
                elements.historyList.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-tertiary);font-size:0.85rem">Login untuk menyimpan riwayat</div>';
            }
        }

        // ========== EXPOSE TO GLOBAL ==========
        window.SantrilogyApp = {
            updateUserUI: updateUserUI,
            showToast: showToast,
            closeModal: closeModal,
            loadSession: loadSession,
            loadChatHistory: loadChatHistory,
            triggerDonation: triggerDonation,
            state: state,

            // PENTING: Baris ini yang memperbaiki error tersebut
            loadHistoryFromFirestore: loadHistoryFromFirestore
        };

        // Initialize
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
        } else {
            init();
        }

        // Santrilogy AI - Template Protection
        // Check if the required elements are present - delayed to avoid conflict with CDN loading
        setTimeout(function() {
            var requiredElements = ['sidebar', 'messagesContainer', 'inputField', 'typingIndicator', 'authModal', 'settingsModal', 'feedbackModal'];
            var missingElements = requiredElements.filter(function(elementId) {
                return !document.getElementById(elementId);
            });

            // If critical elements are missing, redirect to official site
            if (missingElements.length > 0) {
                console.warn('Santrilogy AI template has been modified incorrectly. Redirecting to official site.');
                window.location.href = 'https://www.lp.santrilogy.com';
            }
        }, 7000); // Check after 7 seconds to ensure all CDN elements are loaded