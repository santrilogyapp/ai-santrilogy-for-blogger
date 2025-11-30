/**
 * SANTRILOGY AI - SECURE BACKEND WORKER (FINAL v2.0)
 * Platform: Cloudflare Workers
 * * REQUIRED ENV VARIABLES (Set via 'npx wrangler secret put'):
 * - FIREBASE_PROJECT_ID
 * - FIREBASE_CLIENT_EMAIL
 * - FIREBASE_PRIVATE_KEY
 * - FIREBASE_API_KEY
 * - GOOGLE_CLIENT_ID      (Untuk Login Google)
 * - GOOGLE_CLIENT_SECRET  (Untuk Login Google)
 * - AI_WORKER_URL         (Optional)
 * - ALLOWED_ORIGINS       (e.g., https://santrilogy-ai.blogspot.com)
 */

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

      // --- 2. ROUTING ---

      // Home / Health Check
      if (path === '/' || path === '/health') {
        return new Response(JSON.stringify({
          status: 'Online',
          service: 'Santrilogy AI Backend',
          version: '2.0.0',
          auth_mode: 'Hybrid (Email + Google OAuth)'
        }), { headers: corsHeaders });
      }

      // Auth: Email/Password & Verify
      if (path === '/api/auth' && request.method === 'POST') {
        return await handleAuth(request, env, corsHeaders);
      }

      // Auth: Google Login (Redirect user to Google)
      if (path === '/api/auth/google' && request.method === 'GET') {
        return await handleGoogleLogin(request, env);
      }

      // Auth: Google Callback (Handle return from Google)
      if (path === '/api/auth/callback' && request.method === 'GET') {
        return await handleGoogleCallback(request, env);
      }
      
      // Chat: AI Processing + Firestore Save
      if (path === '/api/chat' && request.method === 'POST') {
        return await handleChat(request, env, corsHeaders);
      }

      // History: Get Chats from Firestore
      if (path === '/api/history' && request.method === 'GET') {
        return await handleHistory(request, env, corsHeaders);
      }
      
      // Session: Manage chat sessions
      if (path === '/api/session' && request.method === 'POST') {
        return await handleSession(request, env, corsHeaders);
      }

      return new Response(JSON.stringify({ error: 'Endpoint Not Found' }), { status: 404, headers: corsHeaders });

    } catch (e) {
      console.error("Worker Error:", e);
      return new Response(JSON.stringify({ error: e.message || 'Internal Server Error' }), { status: 500, headers: corsHeaders });
    }
  }
};

// =========================================================
// 3. HANDLER FUNCTIONS
// =========================================================

/**
 * Handle Auth Standard (Email/Password)
 */
async function handleAuth(req, env, headers) {
  const body = await req.json();
  const { action, email, password, idToken } = body;
  const apiKey = env.FIREBASE_API_KEY;

  if (!apiKey) return errorResp('Server config error: API Key missing', 500, headers);

  let endpoint = "";
  let payload = {};

  if (action === 'signup') {
    endpoint = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`;
    payload = { email, password, returnSecureToken: true };
  } else if (action === 'login') {
    endpoint = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;
    payload = { email, password, returnSecureToken: true };
  } else if (action === 'verify') {
    endpoint = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`;
    payload = { idToken };
  } else {
    return errorResp('Invalid Action', 400, headers);
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (data.error) {
    return errorResp(data.error.message, 400, headers);
  }

  return new Response(JSON.stringify(data), { headers });
}

/**
 * Handle Google OAuth - Step 1: Redirect to Google
 */
async function handleGoogleLogin(req, env) {
  if (!env.GOOGLE_CLIENT_ID) return new Response("Google Client ID not configured", { status: 500 });

  const url = new URL(req.url);
  const redirectUri = `${url.origin}/api/auth/callback`;
  
  // Construct Google OAuth URL
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${env.GOOGLE_CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `response_type=code&` +
    `scope=openid%20email%20profile&` +
    `access_type=online&` +
    `prompt=select_account`;

  return Response.redirect(googleAuthUrl, 302);
}

/**
 * Handle Google OAuth - Step 2: Callback & Exchange Token
 */
async function handleGoogleCallback(req, env) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  // Redirect back to Blogger if user cancels or error
  const bloggerUrl = env.ALLOWED_ORIGINS ? env.ALLOWED_ORIGINS.split(',')[0] : 'https://santrilogy-ai.blogspot.com';
  
  if (error || !code) {
    return Response.redirect(`${bloggerUrl}?error=auth_failed`, 302);
  }

  try {
    const redirectUri = `${url.origin}/api/auth/callback`;

    // 1. Exchange Code for Google Access Token
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
    if (!tokenData.access_token) throw new Error('Failed to get Google Access Token');

    // 2. Exchange Google Token for Firebase ID Token (SignInWithIdp)
    const firebaseRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=${env.FIREBASE_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        postBody: `access_token=${tokenData.access_token}&providerId=google.com`,
        requestUri: bloggerUrl,
        returnIdpCredential: true,
        returnSecureToken: true
      })
    });

    const firebaseData = await firebaseRes.json();
    if (firebaseData.error) throw new Error(firebaseData.error.message);

    // 3. Redirect back to Blogger with Token in Hash (Secure way to pass data to frontend)
    // Format: #token=XYZ&user=JSON_STRING
    const userSafe = encodeURIComponent(JSON.stringify({
      email: firebaseData.email,
      displayName: firebaseData.displayName,
      photoURL: firebaseData.photoUrl,
      uid: firebaseData.localId
    }));

    const finalUrl = `${bloggerUrl}/#auth_token=${firebaseData.idToken}&refresh_token=${firebaseData.refreshToken}&user=${userSafe}`;
    
    return Response.redirect(finalUrl, 302);

  } catch (e) {
    console.error("OAuth Error:", e);
    return Response.redirect(`${bloggerUrl}?error=${encodeURIComponent(e.message)}`, 302);
  }
}

/**
 * Handle Chat (AI + DB)
 */
async function handleChat(req, env, headers) {
  const body = await req.json();
  const { message, userId, sessionId } = body;

  if (!message || !userId) return errorResp('Missing parameters', 400, headers);

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
       aiResponseText = aiData.response || aiData.text || JSON.stringify(aiData);
     } catch (err) {
       console.error("AI Error:", err);
       aiResponseText = "Gagal menghubungi otak AI. Coba lagi nanti.";
     }
  } else {
     // Fallback for testing
     aiResponseText = `[Simulasi] AI URL belum diset. Pesanmu: "${message}"`;
  }

  // B. Save to Firestore (Fire and Forget - don't block response)
  // Kita gunakan waitUntil agar Worker tidak mati sebelum save selesai
  const savePromise = saveToFirestore(env, userId, sessionId, message, aiResponseText);
  // Di Cloudflare Workers, ctx.waitUntil sangat disarankan, tapi karena 'ctx' kadang undefined di struktur export default objek sederhana,
  // kita await saja sebentar atau biarkan promise berjalan (mungkin terpotong jika worker mati).
  // Untuk keamanan data, kita await.
  try {
    await savePromise;
  } catch (e) {
    console.error("DB Save Failed:", e);
  }

  return new Response(JSON.stringify({ 
    response: aiResponseText, 
    timestamp: Date.now() 
  }), { headers });
}

/**
 * Handle History
 */
async function handleHistory(req, env, headers) {
  const url = new URL(req.url);
  const userId = url.searchParams.get('userId');
  if (!userId) return errorResp('Missing userId', 400, headers);

  try {
    const accessToken = await getGoogleAccessToken(env);
    const projectId = env.FIREBASE_PROJECT_ID;
    
    // Firestore REST API: runQuery
    const queryUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery`;
    
    const queryPayload = {
      structuredQuery: {
        from: [{ collectionId: "chats" }],
        where: {
          fieldFilter: {
            field: { fieldPath: "userId" },
            op: "EQUAL",
            value: { stringValue: userId }
          }
        },
        orderBy: [{ field: { fieldPath: "createdAt" }, direction: "DESCENDING" }],
        limit: 20
      }
    };

    const res = await fetch(queryUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(queryPayload)
    });

    const data = await res.json();
    
    // Handle error jika Index belum dibuat
    if (data.error || (Array.isArray(data) && data[0] && data[0].error)) {
        const errMsg = data.error ? data.error.message : data[0].error.message;
        console.error("Firestore Query Error:", errMsg);
        // Jika error index, tetap return array kosong agar frontend tidak crash
        return new Response(JSON.stringify({ history: [] }), { headers });
    }

    const history = (data || []).map(item => {
      if (!item.document) return null;
      const fields = item.document.fields;
      return {
        id: item.document.name.split('/').pop(),
        userMessage: fields.userMessage?.stringValue || "",
        aiResponse: fields.aiResponse?.stringValue || "",
        createdAt: fields.createdAt?.timestampValue || ""
      };
    }).filter(Boolean);

    return new Response(JSON.stringify({ history }), { headers });

  } catch (err) {
    return errorResp(err.message, 500, headers);
  }
}

/**
 * Handle Session (Manage chat sessions)
 */
async function handleSession(req, env, headers) {
  try {
    const body = await req.json();
    const { sessionId, userId, action, sessionData } = body;

    if (!sessionId || !userId || !action) {
      return errorResp('Missing required parameters: sessionId, userId, action', 400, headers);
    }

    if (action === 'save') {
      if (!sessionData) {
        return errorResp('sessionData is required for save action', 400, headers);
      }
      await saveSessionToFirestore(env, userId, sessionId, sessionData);
      return new Response(JSON.stringify({ success: true, message: 'Session saved successfully' }), { headers });
    } 
    else if (action === 'get') {
      const sessionData = await getSessionFromFirestore(env, userId, sessionId);
      return new Response(JSON.stringify({ success: true, data: sessionData }), { headers });
    } 
    else if (action === 'delete') {
      await deleteSessionFromFirestore(env, userId, sessionId);
      return new Response(JSON.stringify({ success: true, message: 'Session deleted successfully' }), { headers });
    } 
    else {
      return errorResp('Invalid action. Use: save, get, or delete', 400, headers);
    }
  } catch (e) {
    console.error("Session Error:", e);
    return errorResp(e.message, 500, headers);
  }
}

// =========================================================
// 4. SESSION MANAGEMENT FUNCTIONS
// =========================================================

async function saveSessionToFirestore(env, userId, sessionId, sessionData) {
  if (!env.FIREBASE_PRIVATE_KEY) return; // Skip if no DB config

  const accessToken = await getGoogleAccessToken(env);
  const projectId = env.FIREBASE_PROJECT_ID;
  
  const docData = {
    fields: {
      userId: { stringValue: userId },
      sessionId: { stringValue: sessionId },
      title: { stringValue: sessionData.title || 'New Session' },
      messages: { mapValue: { fields: {
        content: { stringValue: JSON.stringify(sessionData.messages || []) }
      }}},
      createdAt: { timestampValue: new Date().toISOString() },
      updatedAt: { timestampValue: new Date().toISOString() }
    }
  };

  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${userId}/sessions/${sessionId}`;
  
  const res = await fetch(url, {
    method: 'PATCH',  // Use PATCH to update or PUT to create/overwrite
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(docData)
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    console.error("Firestore Session Save Error:", errorText);
    throw new Error(`Firestore Save Error: ${errorText}`);
  }
}

async function getSessionFromFirestore(env, userId, sessionId) {
  if (!env.FIREBASE_PRIVATE_KEY) return null; // Skip if no DB config

  const accessToken = await getGoogleAccessToken(env);
  const projectId = env.FIREBASE_PROJECT_ID;
  
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${userId}/sessions/${sessionId}`;
  
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!res.ok) {
    if (res.status === 404) {
      // Session doesn't exist, return null
      return null;
    }
    const errorText = await res.text();
    console.error("Firestore Session Get Error:", errorText);
    throw new Error(`Firestore Get Error: ${errorText}`);
  }
  
  const data = await res.json();
  if (data && data.fields) {
    return {
      id: sessionId,
      title: data.fields.title?.stringValue || 'Untitled Session',
      messages: JSON.parse(data.fields.messages?.mapValue?.fields?.content?.stringValue || '[]'),
      createdAt: data.fields.createdAt?.timestampValue,
      updatedAt: data.fields.updatedAt?.timestampValue
    };
  }
  
  return null;
}

async function deleteSessionFromFirestore(env, userId, sessionId) {
  if (!env.FIREBASE_PRIVATE_KEY) return; // Skip if no DB config

  const accessToken = await getGoogleAccessToken(env);
  const projectId = env.FIREBASE_PROJECT_ID;
  
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${userId}/sessions/${sessionId}`;
  
  const res = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    console.error("Firestore Session Delete Error:", errorText);
    throw new Error(`Firestore Delete Error: ${errorText}`);
  }
}

// =========================================================
// 5. HELPER FUNCTIONS (Service Account & Crypto)
// =========================================================

function errorResp(msg, status, headers) {
  return new Response(JSON.stringify({ error: msg }), { status, headers });
}

async function saveToFirestore(env, userId, sessionId, userMsg, aiMsg) {
    if (!env.FIREBASE_PRIVATE_KEY) return; // Skip if no DB config

    const accessToken = await getGoogleAccessToken(env);
    const projectId = env.FIREBASE_PROJECT_ID;
    
    const docData = {
      fields: {
        userId: { stringValue: userId },
        sessionId: { stringValue: sessionId || 'default' },
        userMessage: { stringValue: userMsg },
        aiResponse: { stringValue: aiMsg },
        createdAt: { timestampValue: new Date().toISOString() }
      }
    };

    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${userId}/chats`;
    
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(docData)
    });
    
    if (!res.ok) console.error("Firestore Save Error:", await res.text());
}

async function getGoogleAccessToken(env) {
  if (!env.FIREBASE_PRIVATE_KEY || !env.FIREBASE_CLIENT_EMAIL) {
      throw new Error("Firebase Credentials not set in Worker Secrets");
  }

  // Sanitasi Private Key (Ganti \\n jadi \n)
  const privateKeyPem = env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
  const clientEmail = env.FIREBASE_CLIENT_EMAIL;
  
  const scopes = [
    "https://www.googleapis.com/auth/datastore",
    "https://www.googleapis.com/auth/cloud-platform",
    "https://www.googleapis.com/auth/firestore"
  ];

  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: clientEmail,
    scope: scopes.join(' '),
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now
  };

  const header = { alg: "RS256", typ: "JWT" };
  
  const encodedHeader = btoaUrl(JSON.stringify(header));
  const encodedClaim = btoaUrl(JSON.stringify(claim));
  const signatureInput = `${encodedHeader}.${encodedClaim}`;
  
  const signature = await signWithPrivateKey(signatureInput, privateKeyPem);
  const jwt = `${signatureInput}.${signature}`;

  const params = new URLSearchParams();
  params.append('grant_type', 'urn:ietf:params:oauth:grant-type:jwt-bearer');
  params.append('assertion', jwt);

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params
  });

  const data = await res.json();
  if (!data.access_token) {
    throw new Error(`Google Auth Failed: ${JSON.stringify(data)}`);
  }
  return data.access_token;
}

async function signWithPrivateKey(text, privateKeyPem) {
  const pemContents = privateKeyPem
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s/g, '');
  
  const binaryDerString = atob(pemContents);
  const binaryDer = new Uint8Array(binaryDerString.length);
  for (let i = 0; i < binaryDerString.length; i++) {
    binaryDer[i] = binaryDerString.charCodeAt(i);
  }

  const key = await crypto.subtle.importKey(
    "pkcs8",
    binaryDer.buffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(text)
  );

  return btoaUrl(String.fromCharCode(...new Uint8Array(signature)));
}

function btoaUrl(str) {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}