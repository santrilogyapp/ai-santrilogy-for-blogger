/**
 * SANTRILOGY AI - CLOUDFLARE AUTH + AI WORKER (v3.0) - SAFE VERSION
 * Platform: Cloudflare Workers + D1 Database
 *
 * ENV Variables yang dibutuhkan:
 * - JWT_SECRET: Secret untuk JWT signing
 * - GOOGLE_CLIENT_ID: Google OAuth Client ID
 * - GOOGLE_CLIENT_SECRET: Google OAuth Client Secret
 * - AI_WORKER_URL: URL untuk AI processing (opsional)
 * - ALLOWED_ORIGINS: Origins yang diizinkan (comma separated)
 * - DB: D1 Database binding
 */

// JWT Utils untuk Cloudflare Workers (inline)
// Implementasi sederhana dari JWT signing/verification untuk Cloudflare Workers

async function generateJWT(payload, secret) {
  // Tambahkan exp jika tidak ada
  if (!payload.exp) {
    payload.exp = Math.floor(Date.now() / 1000) + (24 * 60 * 60); // 24 jam
  }

  // Header JWT
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  // Encode header dan payload
  const encodedHeader = urlEncodeBase64(JSON.stringify(header));
  const encodedPayload = urlEncodeBase64(JSON.stringify(payload));

  // Buat signature input
  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  // Buat signature
  const signature = await createHMACSignature(signatureInput, secret);

  // Gabungkan semua bagian
  return `${signatureInput}.${signature}`;
}

async function verifyJWT(token, secret) {
  const [encodedHeader, encodedPayload, signature] = token.split('.');

  if (!encodedHeader || !encodedPayload || !signature) {
    throw new Error('Token tidak valid');
  }

  // Decode payload
  const payload = JSON.parse(urlDecodeBase64(encodedPayload));

  // Verifikasi waktu kadaluarsa
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) {
    throw new Error('Token telah kadaluarsa');
  }

  // Buat ulang signature input
  const signatureInput = `${encodedHeader}.${encodedPayload}`;
  const expectedSignature = await createHMACSignature(signatureInput, secret);

  // Bandingkan signature
  if (expectedSignature !== signature) {
    throw new Error('Signature tidak valid');
  }

  return payload;
}

async function createHMACSignature(message, secret) {
  // Convert secret dan message ke ArrayBuffer
  const encoder = new TextEncoder();
  const keyBuffer = encoder.encode(secret);
  const messageBuffer = encoder.encode(message);

  // Impor secret key
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  // Buat signature
  const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, messageBuffer);

  // Encode ke base64url
  return arrayBufferToBase64Url(signatureBuffer);
}

function urlEncodeBase64(str) {
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function urlDecodeBase64(str) {
  // Tambah padding jika diperlukan
  const padding = '='.repeat((4 - str.length % 4) % 4);
  const paddedStr = str.replace(/-/g, '+').replace(/_/g, '/') + padding;
  return atob(paddedStr);
}

function arrayBufferToBase64Url(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Fungsi untuk membersihkan string dari karakter tidak aman
function sanitizeString(str) {
  if (typeof str !== 'string') return str;

  // Hapus atau ganti karakter kontrol
  return str
    .replace(/[\x00-\x1F\x7F]/g, '') // Hapus karakter kontrol ASCII
    .replace(/\u0000/g, '') // Hapus null byte
    .replace(/\r\n/g, ' ') // Ganti CRLF dengan spasi
    .replace(/\n/g, ' ') // Ganti newline dengan spasi
    .replace(/\r/g, ' ') // Ganti carriage return dengan spasi
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ''); // Hapus kontrol lain
}

// Fungsi untuk membuat response JSON yang aman
function safeJSONResponse(obj, status = 200, headers = {}) {
  // Sanitasi semua string dalam objek
  const sanitized = JSON.parse(JSON.stringify(obj, (key, value) => {
    return typeof value === 'string' ? sanitizeString(value) : value;
  }));

  return new Response(JSON.stringify(sanitized, null, 2), {
    status: status,
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    }
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // --- 1. CONFIG & CORS ---
    const allowedOrigins = (env.ALLOWED_ORIGINS || '*').split(',');
    const origin = request.headers.get('Origin');
    const allowOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];

    const corsHeaders = {
      'Access-Control-Allow-Origin': allowOrigin || '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      const path = url.pathname;
      console.log('Processing path:', path); // Debug logging

      // --- 2. MAIN API ROUTES ---
      if (path === '/' || path === '/health') {
        return safeJSONResponse({
          status: 'Online',
          service: 'Santrilogy AI Backend with Custom Auth',
          version: '3.0.0',
          auth_mode: 'Custom (Email + Google OAuth)'
        }, 200, corsHeaders);
      }

      // --- 3. AUTHENTICATION ROUTES ---
      // Periksa dengan tepat apakah path dimulai dengan /auth/
      if (path.startsWith('/auth/')) {
        console.log('Processing auth route:', path); // Debug logging
        return await handleAuthRoutes(request, env, corsHeaders);
      }

      // --- 4. PROTECTED ROUTES (memerlukan auth) ---
      const authResult = await authenticateRequest(request, env);
      if (!authResult.authenticated && requiresAuth(path)) {
        return errorResp('Authorization required', 401, corsHeaders);
      }

      const userId = authResult.userId;

      if (path === '/api/chat' && request.method === 'POST') {
        return await handleChat(request, env, corsHeaders, userId);
      }

      if (path === '/api/history' && request.method === 'GET') {
        return await handleHistory(request, env, corsHeaders, userId);
      }

      if (path === '/api/session' && request.method === 'POST') {
        return await handleSession(request, env, corsHeaders, userId);
      }

      return safeJSONResponse({ error: 'Endpoint Not Found' }, 404, corsHeaders);

    } catch (e) {
      console.error("Worker Error:", e);
      return safeJSONResponse({ error: e.message || 'Internal Server Error' }, 500, corsHeaders);
    }
  }
};

// =========================================================
// AUTHENTICATION ROUTES
// =========================================================

async function handleAuthRoutes(request, env, headers) {
  const url = new URL(request.url);
  const path = url.pathname;
  console.log('Handling auth route:', path, 'method:', request.method); // Debug logging

  // Email/Password Auth
  if (path === '/auth/register' && request.method === 'POST') {
    console.log('Processing register'); // Debug logging
    return await handleRegister(request, env, headers);
  }
  if (path === '/auth/login' && request.method === 'POST') {
    console.log('Processing login'); // Debug logging
    return await handleLogin(request, env, headers);
  }
  if (path === '/auth/verify' && request.method === 'POST') {
    console.log('Processing verify'); // Debug logging
    return await handleVerify(request, env, headers);
  }
  if (path === '/auth/logout' && request.method === 'POST') {
    console.log('Processing logout'); // Debug logging
    return await handleLogout(request, env, headers);
  }

  // OAuth Routes
  if (path === '/auth/google' && request.method === 'GET') {
    console.log('Processing google auth redirect'); // Debug logging
    return await handleGoogleAuth(request, env);
  }
  if (path === '/auth/google/callback' && request.method === 'GET') {
    console.log('Processing google auth callback'); // Debug logging
    return await handleGoogleCallback(request, env);
  }

  // Jika tidak ada endpoint auth yang cocok, kembalikan error
  console.log('No matching auth endpoint found for:', path); // Debug logging
  return safeJSONResponse({ error: 'Auth endpoint not found' }, 404, headers);
}

// =========================================================
// AUTH HANDLERS
// =========================================================

async function handleRegister(request, env, headers) {
  try {
    console.log('Starting registration process'); // Debug logging

    // Parse body dan sanitasi input
    const rawBody = await request.text();
    let body;

    try {
      // Sanitasi body dari karakter kontrol sebelum parsing
      const sanitizedBody = sanitizeString(rawBody);
      body = JSON.parse(sanitizedBody);
    } catch (parseError) {
      console.error('JSON parse error:', parseError, 'raw body:', rawBody); // Debug logging
      return errorResp('Invalid JSON format', 400, headers);
    }

    let { email, password, name } = body;

    // Sanitasi input
    email = sanitizeString(email || '');
    password = sanitizeString(password || '');
    name = sanitizeString(name || '');

    if (!email || !password) {
      return errorResp('Email dan password diperlukan', 400, headers);
    }

    // Validasi email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return errorResp('Format email tidak valid', 400, headers);
    }

    if (password.length < 6) {
      return errorResp('Password minimal 6 karakter', 400, headers);
    }

    // Hash password (placeholder - butuh bcrypt sebenarnya)
    const passwordHash = await hashPassword(password);

    // Cek apakah email sudah terdaftar
    const existingUser = await env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(email).first();

    if (existingUser) {
      return errorResp('Email sudah terdaftar', 409, headers);
    }

    // Sanitasi nama untuk digunakan di database
    const sanitizedName = name || email.split('@')[0];

    // Simpan user baru
    const result = await env.DB.prepare(
      'INSERT INTO users (email, password_hash, name, provider) VALUES (?, ?, ?, ?)'
    ).bind(email, passwordHash, sanitizedName, 'email').run();

    const userId = result.lastRowId;

    // Generate JWT token
    const token = await generateJWT({
      userId: userId,
      email: email,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    }, env.JWT_SECRET);

    // Update last login
    await env.DB.prepare(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(userId).run();

    // Buat preferensi default
    await env.DB.prepare(
      'INSERT INTO user_preferences (user_id) VALUES (?)'
    ).bind(userId).run();

    console.log('Registration successful for user:', userId); // Debug logging

    return safeJSONResponse({
      success: true,
      token: token,
      user: {
        id: userId,
        email: email,
        name: sanitizedName
      }
    }, 200, headers);
  } catch (error) {
    console.error('Register error:', error);
    return errorResp('Gagal mendaftarkan akun: ' + error.message, 500, headers);
  }
}

async function handleLogin(request, env, headers) {
  try {
    console.log('Starting login process'); // Debug logging

    // Parse body dan sanitasi input
    const rawBody = await request.text();
    let body;

    try {
      // Sanitasi body dari karakter kontrol sebelum parsing
      const sanitizedBody = sanitizeString(rawBody);
      body = JSON.parse(sanitizedBody);
    } catch (parseError) {
      console.error('JSON parse error in login:', parseError); // Debug logging
      return errorResp('Invalid JSON format', 400, headers);
    }

    let { email, password } = body;

    // Sanitasi input
    email = sanitizeString(email || '');
    password = sanitizeString(password || '');

    if (!email || !password) {
      return errorResp('Email dan password diperlukan', 400, headers);
    }

    // Cari user berdasarkan email
    const user = await env.DB.prepare(
      'SELECT id, email, password_hash, name, provider FROM users WHERE email = ?'
    ).bind(email).first();

    if (!user) {
      return errorResp('Email atau password salah', 401, headers);
    }

    // Verifikasi password
    const passwordValid = await verifyPassword(password, user.password_hash);

    if (!passwordValid) {
      return errorResp('Email atau password salah', 401, headers);
    }

    // Generate JWT token
    const token = await generateJWT({
      userId: user.id,
      email: user.email,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    }, env.JWT_SECRET);

    // Update last login
    await env.DB.prepare(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(user.id).run();

    console.log('Login successful for user:', user.id); // Debug logging

    return safeJSONResponse({
      success: true,
      token: token,
      user: {
        id: user.id,
        email: user.email,
        name: sanitizeString(user.name || ''),
        provider: user.provider
      }
    }, 200, headers);
  } catch (error) {
    console.error('Login error:', error);
    return errorResp('Gagal login: ' + error.message, 500, headers);
  }
}

async function handleVerify(request, env, headers) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return errorResp('Authorization header dibutuhkan', 401, headers);
  }

  const token = authHeader.substring(7);

  try {
    const decoded = await verifyJWT(token, env.JWT_SECRET);

    // Cek apakah user masih valid di database
    const user = await env.DB.prepare(
      'SELECT id, email, name, provider FROM users WHERE id = ?'
    ).bind(decoded.userId).first();

    if (!user) {
      return errorResp('Token tidak valid - user tidak ditemukan', 401, headers);
    }

    return safeJSONResponse({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: sanitizeString(user.name || ''),
        provider: user.provider
      }
    }, 200, headers);
  } catch (error) {
    return errorResp('Token tidak valid', 401, headers);
  }
}

async function handleLogout(request, env, headers) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return errorResp('Authorization header dibutuhkan', 401, headers);
  }

  // Dalam sistem JWT stateless, kita hanya mengembalikan success
  return safeJSONResponse({
    success: true,
    message: 'Logout berhasil'
  }, 200, headers);
}

async function handleGoogleAuth(request, env) {
  if (!env.GOOGLE_CLIENT_ID) {
    return new Response("Google Client ID not configured", { status: 500 });
  }

  const url = new URL(request.url);
  const redirectUri = `${url.origin}/auth/google/callback`;

  // Generate state parameter untuk CSRF protection
  const state = generateRandomString(32);

  // Simpan state di database sementara
  const stateExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await env.DB.prepare(
    'INSERT INTO oauth_state (state, expires_at) VALUES (?, ?)'
  ).bind(state, stateExpiry.toISOString()).run();

  // Redirect ke Google OAuth
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${env.GOOGLE_CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `response_type=code&` +
    `scope=openid%20email%20profile&` +
    `access_type=online&` +
    `prompt=select_account&` +
    `state=${state}`;

  return Response.redirect(googleAuthUrl, 302);
}

async function handleGoogleCallback(request, env) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  const bloggerUrl = env.ALLOWED_ORIGINS ? env.ALLOWED_ORIGINS.split(',')[0] : 'https://santrilogy-ai.blogspot.com';

  if (error || !code) {
    return Response.redirect(`${bloggerUrl}?error=auth_failed`, 302);
  }

  try {
    // Verifikasi state parameter
    const savedState = await env.DB.prepare(
      'SELECT id FROM oauth_state WHERE state = ? AND expires_at > CURRENT_TIMESTAMP'
    ).bind(state).first();

    if (!savedState) {
      return Response.redirect(`${bloggerUrl}?error=invalid_state`, 302);
    }

    // Hapus state setelah digunakan
    await env.DB.prepare('DELETE FROM oauth_state WHERE state = ?').bind(state).run();

    const redirectUri = `${url.origin}/auth/google/callback`;

    // Exchange code for access token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      throw new Error('Failed to get Google Access Token');
    }

    // Get user info from Google
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
    });

    let googleUser = await userRes.json();

    // Sanitasi data dari Google
    googleUser = {
      ...googleUser,
      name: sanitizeString(googleUser.name || ''),
      email: sanitizeString(googleUser.email || ''),
    };

    // Cek apakah user sudah terdaftar
    let user = await env.DB.prepare(
      'SELECT id, email, name FROM users WHERE provider = ? AND provider_id = ?'
    ).bind('google', googleUser.id).first();

    if (!user) {
      // Cek apakah email sudah terdaftar (untuk menghindari duplikasi akun)
      user = await env.DB.prepare(
        'SELECT id, email, name FROM users WHERE email = ?'
      ).bind(googleUser.email).first();

      if (user) {
        // Update user untuk menambahkan Google provider ID
        await env.DB.prepare(
          'UPDATE users SET provider_id = ?, provider = ? WHERE id = ?'
        ).bind(googleUser.id, 'google', user.id).run();
      } else {
        // Buat user baru
        const result = await env.DB.prepare(
          'INSERT INTO users (email, name, provider, provider_id, email_verified) VALUES (?, ?, ?, ?, ?)'
        ).bind(
          googleUser.email,
          googleUser.name,
          'google',
          googleUser.id,
          googleUser.verified_email ? 1 : 0
        ).run();

        user = {
          id: result.lastRowId,
          email: googleUser.email,
          name: googleUser.name
        };

        // Buat preferensi default untuk user baru
        await env.DB.prepare(
          'INSERT INTO user_preferences (user_id) VALUES (?)'
        ).bind(user.id).run();
      }
    }

    // Generate JWT token internal
    const token = await generateJWT({
      userId: user.id,
      email: user.email,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    }, env.JWT_SECRET);

    // Update last login
    await env.DB.prepare(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(user.id).run();

    // Redirect dengan token ke aplikasi frontend
    const userSafe = encodeURIComponent(JSON.stringify({
      id: user.id,
      email: user.email,
      name: sanitizeString(user.name || ''),
      provider: 'google'
    }));

    const finalUrl = `${bloggerUrl}/#auth_token=${token}&user=${userSafe}`;
    return Response.redirect(finalUrl, 302);

  } catch (e) {
    console.error("Google OAuth Error:", e);
    return Response.redirect(`${bloggerUrl}?error=${encodeURIComponent(sanitizeString(e.message || 'Unknown error'))}`, 302);
  }
}

// =========================================================
// PROTECTED API HANDLERS
// =========================================================

async function handleChat(request, env, headers, userId) {
  try {
    // Parse body dan sanitasi input
    const rawBody = await request.text();
    let body;

    try {
      // Sanitasi body dari karakter kontrol sebelum parsing
      const sanitizedBody = sanitizeString(rawBody);
      body = JSON.parse(sanitizedBody);
    } catch (parseError) {
      return errorResp('Invalid JSON format', 400, headers);
    }

    let { message, sessionId } = body;

    // Sanitasi input
    message = sanitizeString(message || '');
    sessionId = sanitizeString(sessionId || '');

    if (!message) {
      return errorResp('Missing message parameter', 400, headers);
    }

    // A. AI Processing
    let aiResponseText = "Maaf, sistem AI sedang offline.";
    if (env.AI_WORKER_URL) {
       try {
         const aiRes = await fetch(env.AI_WORKER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, userId })
         });
         const aiData = await aiRes.json();
         aiResponseText = sanitizeString(aiData.response || aiData.text || JSON.stringify(aiData));
       } catch (err) {
         console.error("AI Error:", err);
         aiResponseText = "Gagal menghubungi otak AI. Coba lagi nanti.";
       }
    } else {
       // Fallback for testing
       aiResponseText = `[Simulasi] AI URL belum diset. Pesanmu: "${sanitizeString(message)}"`;
    }

    // B. Save to D1 Database (Fire and Forget - don't block response)
    const savePromise = saveToD1(env, userId, sessionId, message, aiResponseText);
    try {
      await savePromise;
    } catch (e) {
      console.error("DB Save Failed:", e);
    }

    return safeJSONResponse({
      response: aiResponseText,
      timestamp: Date.now()
    }, 200, headers);
  } catch (error) {
    console.error("Chat error:", error);
    return errorResp('Chat processing error: ' + error.message, 500, headers);
  }
}

async function handleHistory(request, env, headers, userId) {
  try {
    // Ambil riwayat chat dari D1
    const result = await env.DB.prepare(
      `SELECT id, user_message as userMessage, ai_response as aiResponse, created_at as createdAt
       FROM chat_history
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 20`
    ).bind(userId).all();

    // Sanitasi hasil sebelum mengembalikan
    const sanitizedResults = (result.results || []).map(item => ({
      ...item,
      userMessage: sanitizeString(item.userMessage || ''),
      aiResponse: sanitizeString(item.aiResponse || ''),
    }));

    return safeJSONResponse({
      history: sanitizedResults
    }, 200, headers);
  } catch (err) {
    console.error("History Error:", err);
    return errorResp('History error: ' + err.message, 500, headers);
  }
}

async function handleSession(request, env, headers, userId) {
  try {
    // Parse body dan sanitasi input
    const rawBody = await request.text();
    let body;

    try {
      // Sanitasi body dari karakter kontrol sebelum parsing
      const sanitizedBody = sanitizeString(rawBody);
      body = JSON.parse(sanitizedBody);
    } catch (parseError) {
      return errorResp('Invalid JSON format', 400, headers);
    }

    let { sessionId, action, sessionData } = body;

    // Sanitasi input
    sessionId = sanitizeString(sessionId || '');
    action = sanitizeString(action || '');

    if (!sessionId || !action) {
      return errorResp('Missing required parameters: sessionId, action', 400, headers);
    }

    if (action === 'save') {
      if (!sessionData) {
        return errorResp('sessionData is required for save action', 400, headers);
      }

      // Sanitasi data sesi
      if (sessionData.messages) {
        sessionData.messages = sessionData.messages.map(msg => ({
          ...msg,
          content: sanitizeString(msg.content || ''),
        }));
      }

      await saveSessionToD1(env, userId, sessionId, sessionData);
      return safeJSONResponse({
        success: true,
        message: 'Session saved successfully'
      }, 200, headers);
    }
    else if (action === 'get') {
      const sessionData = await getSessionFromD1(env, userId, sessionId);
      return safeJSONResponse({
        success: true,
        data: sessionData
      }, 200, headers);
    }
    else if (action === 'delete') {
      await deleteSessionFromD1(env, userId, sessionId);
      return safeJSONResponse({
        success: true,
        message: 'Session deleted successfully'
      }, 200, headers);
    }
    else {
      return errorResp('Invalid action. Use: save, get, or delete', 400, headers);
    }
  } catch (e) {
    console.error("Session Error:", e);
    return errorResp('Session error: ' + e.message, 500, headers);
  }
}

// =========================================================
// D1 DATABASE OPERATIONS
// =========================================================

async function saveToD1(env, userId, sessionId, userMsg, aiMsg) {
  const stmt = env.DB.prepare(
    'INSERT INTO chat_history (user_id, session_id, user_message, ai_response) VALUES (?, ?, ?, ?)'
  );

  // Sanitasi pesan sebelum menyimpan ke database
  await stmt.bind(userId, sessionId || 'default', sanitizeString(userMsg), sanitizeString(aiMsg)).run();
}

async function saveSessionToD1(env, userId, sessionId, sessionData) {
  const stmt = env.DB.prepare(`
    INSERT OR REPLACE INTO user_sessions
    (user_id, session_id, title, messages, created_at, updated_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `);

  // Sanitasi data sebelum menyimpan
  const sanitizedName = sanitizeString(sessionData.title || 'New Session');
  const messagesJson = JSON.stringify((sessionData.messages || []).map(msg => ({
    ...msg,
    content: sanitizeString(msg.content || ''),
  })));

  await stmt.bind(
    userId,
    sessionId,
    sanitizedName,
    messagesJson
  ).run();
}

async function getSessionFromD1(env, userId, sessionId) {
  const result = await env.DB.prepare(`
    SELECT session_id, title, messages, created_at, updated_at
    FROM user_sessions
    WHERE user_id = ? AND session_id = ?
  `).bind(userId, sessionId).first();

  if (result && result.messages) {
    try {
      result.messages = JSON.parse(result.messages);
      // Sanitasi pesan-pesan yang dimuat
      if (Array.isArray(result.messages)) {
        result.messages = result.messages.map(msg => ({
          ...msg,
          content: sanitizeString(msg.content || ''),
        }));
      }
    } catch (e) {
      console.error("Error parsing messages JSON:", e);
      result.messages = [];
    }
  }

  return result;
}

async function deleteSessionFromD1(env, userId, sessionId) {
  const stmt = env.DB.prepare(
    'DELETE FROM user_sessions WHERE user_id = ? AND session_id = ?'
  );

  await stmt.bind(userId, sessionId).run();
}

// =========================================================
// AUTHENTICATION HELPER
// =========================================================

async function authenticateRequest(request, env) {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { authenticated: false, userId: null };
  }

  const token = authHeader.substring(7);

  try {
    const decoded = await verifyJWT(token, env.JWT_SECRET);
    return { authenticated: true, userId: decoded.userId };
  } catch (error) {
    console.error('Auth error:', error);
    return { authenticated: false, userId: null };
  }
}

function requiresAuth(path) {
  // Daftar endpoint yang memerlukan autentikasi
  return path.startsWith('/api/') && path !== '/api/chat' && path !== '/api/history';
}

// =========================================================
// HELPER FUNCTIONS
// =========================================================

function errorResp(msg, status, headers) {
  return safeJSONResponse({ error: sanitizeString(msg || '') }, status, headers);
}

// Placeholder untuk password hashing - dalam implementasi sebenarnya butuh library bcrypt
async function hashPassword(password) {
  // Dalam implementasi sebenarnya, kita butuh library bcrypt atau scrypt
  // Untuk sementara, gunakan placeholder
  return password; // Ganti dengan implementasi yang aman
}

async function verifyPassword(password, hash) {
  // Implementasi verifikasi password
  return password === hash; // Ganti dengan implementasi yang aman
}

function generateRandomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}