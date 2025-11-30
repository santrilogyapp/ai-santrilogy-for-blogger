/**
 * SANTRILOGY AI - FINAL SMART VERSION
 * Fitur: Auth, D1, Vectorize RAG, & Smart Topic Classification
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // --- 1. CONFIG & CORS ---
    const allowedOrigins = (env.ALLOWED_ORIGINS || 'https://santrilogy-ai.blogspot.com,https://www.santrilogy-ai.blogspot.com').split(',');
    const origin = request.headers.get('Origin');

    // Only allow origins from the allowed list (prevent wildcard usage)
    let allowOrigin = null; // Default to no origin allowed
    if (origin && allowedOrigins.some(allowed => allowed.trim() === origin)) {
      allowOrigin = origin;
    } else if (!origin && allowedOrigins.length > 0) {
      // Fallback to first allowed origin for non-cors requests
      allowOrigin = allowedOrigins[0].trim();
    }

    // If no valid origin found, use the first allowed origin as default
    if (!allowOrigin) {
      allowOrigin = allowedOrigins[0].trim();
    }

    const corsHeaders = {
      'Access-Control-Allow-Origin': allowOrigin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true', // Allow credentials to be sent
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      const path = url.pathname;

      // --- 2. MAIN & ADMIN ROUTES ---
      if (path === '/admin/input') {
        return await handleAdminInput(request, env);
      }

      if (path === '/' || path === '/health' || path === '/auth/health') {
        return safeJSONResponse({ status: 'Online', mode: 'Smart RAG' }, 200, corsHeaders);
      }

      // --- 3. AUTH ROUTES ---
      if (path.startsWith('/auth/')) {
        return await handleAuthRoutes(request, env, corsHeaders);
      }

      // --- 4. PROTECTED ROUTES ---
      const authResult = await authenticateRequest(request, env);
      
      if (!authResult.authenticated && requiresAuth(path)) {
        return errorResp('Authorization required', 401, corsHeaders);
      }

      const userId = authResult.userId;

      if (path === '/api/chat' && request.method === 'POST') {
        // Panggil fungsi SMART CHAT
        return await handleSmartChat(request, env, ctx, corsHeaders, userId);
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
      return safeJSONResponse({ error: 'Internal Server Error' }, 500, corsHeaders);
    }
  }
};

// =========================================================
// 1. SMART CHAT HANDLER (LOGIKA BARU DI SINI)
// =========================================================

async function handleSmartChat(request, env, ctx, headers, userId) {
  try {
    const rawBody = await request.text();
    let body;
    try { body = JSON.parse(sanitizeString(rawBody)); } 
    catch (e) { return errorResp('Invalid JSON', 400, headers); }
    
    let { message, sessionId } = body;
    message = sanitizeString(message || '');
    sessionId = sanitizeString(sessionId || 'default');

    if (!message) return errorResp('Message required', 400, headers);

    // --- STEP A: KLASIFIKASI TOPIK (ISLAMIC CHECKER) ---
    // Tanya AI: Apakah ini soal agama?
    const classifierPrompt = `
      Analisa teks ini: "${message}". 
      Apakah teks tersebut berkaitan dengan:
      1. Hukum Islam (Fiqih)
      2. Akidah / Teologi Islam
      3. Keislaman / Ibadah / Dalil / Sejarah Nabi
      
      Jawab HANYA dengan kata "YES" jika berkaitan, atau "NO" jika ini percakapan umum/teknis/basa-basi/curhat.
      Jangan ada penjelas lain.
    `;

    const classifierRes = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
      messages: [{ role: 'user', content: classifierPrompt }]
    });

    // Cek jawaban AI (Yes/No)
    const isIslamic = classifierRes.response.trim().toUpperCase().includes("YES");
    
    let aiResponseText = "";
    let sources = [];

    // --- JALUR 1: BUKAN SOAL AGAMA (Bebas) ---
    if (!isIslamic) {
      const response = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
        messages: [
          { role: 'system', content: "Anda adalah Santrilogy AI. Teman diskusi yang cerdas, sopan, dan asik. Jawablah pertanyaan user dengan santai." },
          { role: 'user', content: message }
        ]
      });
      aiResponseText = response.response;
    } 
    
    // --- JALUR 2: SOAL AGAMA (Cek Database) ---
    else {
      // 1. Cari di Vectorize
      const embedding = await env.AI.run('@cf/baai/bge-base-en-v1.5', { text: [message] });
      const vectorQuery = await env.VECTORIZE_INDEX.query(embedding.data[0], {
        topK: 3, 
        returnMetadata: true
      });

      // 2. Validasi Score (Harus > 0.55 agar dianggap valid)
      const matches = vectorQuery.matches || [];
      const validMatches = matches.filter(match => match.score > 0.55); 

      // --- KONDISI: ADA DATA DI DATABASE ---
      if (validMatches.length > 0) {
        sources = validMatches.map(m => m.metadata.kitab);
        const contextText = validMatches
          .map(m => `[Kitab: ${m.metadata.kitab} | Bab: ${m.metadata.bab}]\nIsi: "${m.metadata.text}"`)
          .join("\n\n");

        const systemPrompt = `Anda adalah Santrilogy AI, pakar rujukan kitab kuning.
        Jawablah pertanyaan user HANYA berdasarkan referensi berikut ini.
        
        REFERENSI VALID:
        ${contextText}`;

        const response = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
          ]
        });
        aiResponseText = response.response;
      } 
      
      // --- KONDISI: DATABASE KOSONG / TIDAK RELEVAN ---
      else {
        // AI Menjawab sendiri + Disclaimer Wajib
        const systemPrompt = `
        Anda adalah Santrilogy AI. User bertanya soal agama, TAPI database internal anda KOSONG atau TIDAK RELEVAN untuk topik ini.
        
        TUGAS ANDA:
        1. Jawablah pertanyaan user menggunakan analisa/ilmu umum anda sebagai AI.
        2. WAJIB Mengawali jawaban dengan kalimat persis ini:
           "Maaf, pertanyaanmu sepertinya belum ada di database saya. Kalau menurut saya pribadi begini..."
        3. WAJIB Mengakhiri paragraf analisa dengan kalimat:
           "...tapi sekali lagi, ini analisa pribadi saya sebagai AI. Ayo kita diskusikan, bagian mana yang menurutmu perlu dikoreksi?"
        4. Tambahkan ajakan di akhir:
           "Jika hasil diskusi kita ini dirasa benar, coba ajukan rangkuman ini ke Tim Tashih saya, siapa tau bisa jadi tambahan database Santrilogy AI."
        `;

        const response = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
          ]
        });
        aiResponseText = response.response;
      }
    }

    // --- SAVE HISTORY & RETURN ---
    ctx.waitUntil(saveToD1(env, userId, sessionId, message, aiResponseText));

    return safeJSONResponse({
      response: aiResponseText,
      sources: sources,
      timestamp: Date.now()
    }, 200, headers);

  } catch (error) {
    console.error("Smart Chat Error:", error);
    return errorResp('AI Processing Error', 500, headers);
  }
}

// =========================================================
// 2. ADMIN HANDLER (Input Kitab)
// =========================================================

async function handleAdminInput(request, env) {
  if (request.method === 'POST') {
    const formData = await request.formData();
    const text = formData.get('text'); 
    const kitab = formData.get('kitab');
    const bab = formData.get('bab');
    
    if (!text || !kitab) return new Response("Data tidak lengkap", { status: 400 });

    const { data } = await env.AI.run('@cf/baai/bge-base-en-v1.5', { text: [text] });
    const id = crypto.randomUUID();
    await env.VECTORIZE_INDEX.upsert([{
      id: id, values: data[0], metadata: { text, kitab, bab }
    }]);

    // Sanitize the ID to prevent XSS
    const sanitizedId = id.replace(/[<>'"&]/g, (match) => {
      return {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;'
      }[match];
    });

    return new Response(`✅ Tersimpan! ID: ${sanitizedId}. <a href="/admin/input">Input Lagi</a>`, {
        headers: {'Content-Type': 'text/html'}
    });
  }

  return new Response(`
    <html><body style="font-family:sans-serif;max-width:600px;margin:2rem auto;padding:1rem">
    <h2>📚 Input Referensi Kitab</h2>
    <form method="POST">
      <input name="kitab" placeholder="Nama Kitab" required style="width:100%;margin-bottom:10px;padding:8px">
      <input name="bab" placeholder="Bab" required style="width:100%;margin-bottom:10px;padding:8px">
      <textarea name="text" rows="8" placeholder="Paste teks..." required style="width:100%;margin-bottom:10px;padding:8px"></textarea>
      <button type="submit" style="width:100%;padding:10px;background:#0d9488;color:white;border:none">Simpan</button>
    </form></body></html>
  `, { headers: { "Content-Type": "text/html" } });
}

// =========================================================
// 3. AUTH & UTILS (SAMA SEPERTI SEBELUMNYA)
// =========================================================

async function handleAuthRoutes(request, env, headers) {
  const url = new URL(request.url);
  const path = url.pathname;
  if (path === '/auth/register' && request.method === 'POST') return await handleRegister(request, env, headers);
  if (path === '/auth/login' && request.method === 'POST') return await handleLogin(request, env, headers);
  if (path === '/auth/verify' && request.method === 'POST') return await handleVerify(request, env, headers);
  if (path === '/auth/google' && request.method === 'GET') return await handleGoogleAuth(request, env);
  if (path === '/auth/google/callback' && request.method === 'GET') return await handleGoogleCallback(request, env);
  return safeJSONResponse({ error: 'Auth endpoint not found' }, 404, headers);
}

// -- REGISTER --
async function handleRegister(request, env, headers) {
  try {
    const body = await request.json();
    let { email, password, name } = body;
    email = sanitizeString(email);
    if (!email || !password) return errorResp('Email & Pass required', 400, headers);

    const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
    if (existing) return errorResp('Email sudah terdaftar', 409, headers);

    // Hash password sebelum disimpan
    const passwordHash = await hashPassword(password);
    const result = await env.DB.prepare('INSERT INTO users (email, password_hash, name, provider) VALUES (?, ?, ?, ?)').bind(email, passwordHash, sanitizeString(name), 'email').run();
    const userId = result.lastRowId;
    const token = await generateJWT({ userId, email }, env.JWT_SECRET);
    await env.DB.prepare('INSERT INTO user_preferences (user_id) VALUES (?)').bind(userId).run();
    return safeJSONResponse({ success: true, token, user: { id: userId, email, name } }, 200, headers);
  } catch (e) {
    console.error("Registration error:", e);
    return errorResp("Registration failed", 500, headers);
  }
}

// -- LOGIN --
async function handleLogin(request, env, headers) {
  try {
    const body = await request.json();
    const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(body.email).first();
    if (!user || !await verifyPassword(body.password, user.password_hash)) {
      return errorResp('Email atau password salah', 401, headers);
    }
    const token = await generateJWT({ userId: user.id, email: user.email }, env.JWT_SECRET);
    await env.DB.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').bind(user.id).run();
    return safeJSONResponse({ success: true, token, user: { id: user.id, email: user.email, name: user.name, provider: user.provider } }, 200, headers);
  } catch (e) {
    console.error("Login error:", e);
    return errorResp("Login failed", 500, headers);
  }
}

// -- VERIFY --
async function handleVerify(request, env, headers) {
  const authRes = await authenticateRequest(request, env);
  if (!authRes.authenticated) return errorResp('Invalid Token', 401, headers);
  const user = await env.DB.prepare('SELECT id, email, name, provider FROM users WHERE id = ?').bind(authRes.userId).first();
  return safeJSONResponse({ success: true, user }, 200, headers);
}

// -- GOOGLE --
async function handleGoogleAuth(request, env) {
  const redirectUri = `${new URL(request.url).origin}/auth/google/callback`;
  const state = crypto.randomUUID();
  const expiry = new Date(Date.now() + 600000).toISOString();
  await env.DB.prepare('INSERT INTO oauth_state (state, expires_at) VALUES (?, ?)').bind(state, expiry).run();
  const googleUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${env.GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid%20email%20profile&access_type=online&state=${state}`;
  return Response.redirect(googleUrl, 302);
}

async function handleGoogleCallback(request, env) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const bloggerUrl = (env.ALLOWED_ORIGINS || '').split(',')[0] || 'https://santrilogy-ai.blogspot.com';
  if (!code) return Response.redirect(`${bloggerUrl}?error=no_code`, 302);
  const savedState = await env.DB.prepare('SELECT id FROM oauth_state WHERE state = ?').bind(state).first();
  if (!savedState) return Response.redirect(`${bloggerUrl}?error=invalid_state`, 302);
  await env.DB.prepare('DELETE FROM oauth_state WHERE state = ?').bind(state).run();
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ code, client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET, redirect_uri: `${url.origin}/auth/google/callback`, grant_type: 'authorization_code' }) });
  const tokenData = await tokenRes.json();
  const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', { headers: { 'Authorization': `Bearer ${tokenData.access_token}` } });
  const gUser = await userRes.json();
  let user = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(gUser.email).first();
  if (!user) {
    const res = await env.DB.prepare('INSERT INTO users (email, name, provider, provider_id, email_verified) VALUES (?, ?, ?, ?, ?)').bind(gUser.email, gUser.name, 'google', gUser.id, 1).run();
    user = { id: res.lastRowId, email: gUser.email, name: gUser.name };
    await env.DB.prepare('INSERT INTO user_preferences (user_id) VALUES (?)').bind(user.id).run();
  }
  const token = await generateJWT({ userId: user.id, email: user.email }, env.JWT_SECRET);
  const userStr = encodeURIComponent(JSON.stringify({ id: user.id, email: user.email, name: user.name }));
  return Response.redirect(`${bloggerUrl}/#auth_token=${token}&user=${userStr}`, 302);
}

// -- HELPERS --
async function handleHistory(request, env, headers, userId) {
  const result = await env.DB.prepare('SELECT id, user_message, ai_response FROM chat_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 20').bind(userId).all();
  return safeJSONResponse({ history: result.results }, 200, headers);
}

async function handleSession(request, env, headers, userId) {
  const body = await request.json();
  const { sessionId, action, sessionData } = body;
  if (action === 'save') {
    await env.DB.prepare('INSERT OR REPLACE INTO user_sessions (user_id, session_id, title, messages, updated_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)').bind(userId, sessionId, sessionData.title, JSON.stringify(sessionData.messages)).run();
    return safeJSONResponse({ success: true }, 200, headers);
  }
  if (action === 'get') {
    const data = await env.DB.prepare('SELECT * FROM user_sessions WHERE user_id = ? AND session_id = ?').bind(userId, sessionId).first();
    if(data) data.messages = JSON.parse(data.messages);
    return safeJSONResponse({ success: true, data }, 200, headers);
  }
  return errorResp('Invalid action', 400, headers);
}

async function saveToD1(env, userId, sessionId, userMsg, aiMsg) {
  await env.DB.prepare('INSERT INTO chat_history (user_id, session_id, user_message, ai_response) VALUES (?, ?, ?, ?)').bind(userId, sessionId, sanitizeString(userMsg), sanitizeString(aiMsg)).run();
}

function sanitizeString(str) {
  if (typeof str !== 'string') return str;

  // Remove null bytes, control characters, and potential injection patterns
  let sanitized = str.replace(/[\x00-\x1F\x7F]/g, '')
                    .replace(/'/g, "''")
                    .replace(/--/g, '') // SQL comment prevention
                    .replace(/;/g, '') // SQL statement separator
                    .replace(/\/\*/g, '') // SQL comment start
                    .replace(/\*\//g, '') // SQL comment end
                    .replace(/\b(ALTER|CREATE|DELETE|DROP|EXEC(UTE)?|INSERT( +INTO)?|MERGE|SELECT|UPDATE|UNION( +ALL)?|USE|TRUNCATE|GRANT|REVOKE|CALL|DECLARE)\b/gi, ''); // SQL keywords

  // Limit length to prevent abuse
  if (sanitized.length > 1000) {
    sanitized = sanitized.substring(0, 1000);
  }

  return sanitized;
}
function safeJSONResponse(data, status = 200, headers = {}) { return new Response(JSON.stringify(data), { status, headers: { ...headers, 'Content-Type': 'application/json' } }); }
function errorResp(msg, status, headers) { return safeJSONResponse({ error: msg }, status, headers); }
function requiresAuth(path) { return path.startsWith('/api/') && path !== '/api/chat'; }

// Password hashing functions
async function hashPassword(password) {
  // Create a salt and hash the password
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyPassword(password, hash) {
  const testHash = await hashPassword(password);
  return testHash === hash;
}

// JWT
async function generateJWT(payload, secret) {
  if (!secret) throw new Error('JWT secret is required');

  const header = { alg: 'HS256', typ: 'JWT' };
  const headerBase64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  // Set expiration time (24 hours from now)
  const payloadWithExp = { ...payload,
    exp: Math.floor(Date.now() / 1000) + 86400,
    iat: Math.floor(Date.now() / 1000) // Add issued at timestamp
  };

  const payloadBase64 = btoa(JSON.stringify(payloadWithExp)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const signatureInput = `${headerBase64}.${payloadBase64}`;
  const signature = await hmacSha256(signatureInput, secret);

  return `${headerBase64}.${payloadBase64}.${signature}`;
}

async function verifyJWT(token, secret) {
  if (!secret) throw new Error('JWT secret is required');
  if (!token || typeof token !== 'string') throw new Error('Invalid token');

  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid token format');

  const [header, payload, signature] = parts;

  // Verify signature by reconstructing it
  const signatureInput = `${header}.${payload}`;
  const expectedSignature = await hmacSha256(signatureInput, secret);

  if (signature !== expectedSignature) throw new Error('Invalid signature');

  // Decode and check expiration
  try {
    const payloadJson = atob(decodeURIComponent(escape(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))));
    const payloadObj = JSON.parse(payloadJson);

    const now = Math.floor(Date.now() / 1000);
    if (payloadObj.exp && payloadObj.exp < now) {
      throw new Error('Token expired');
    }

    return payloadObj;
  } catch (e) {
    throw new Error('Invalid token payload');
  }
}

async function hmacSha256(msg, secret) {
  if (!secret) throw new Error('Secret is required for HMAC');

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(msg));
  // Convert signature to base64url format
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}
async function authenticateRequest(req, env) {
  const h = req.headers.get('Authorization');
  if (!h || !h.startsWith('Bearer ')) return { authenticated: false };
  try { const dec = await verifyJWT(h.substring(7), env.JWT_SECRET); return { authenticated: true, userId: dec.userId }; } catch (e) { return { authenticated: false }; }
}