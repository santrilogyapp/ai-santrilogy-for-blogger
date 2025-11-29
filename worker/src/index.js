// ========== CLOUDFLARE WORKER FOR SANTRILOGY AI WITH GOOGLE OAUTH ==========

// Konfigurasi yang harus diatur di Cloudflare Workers Environment Variables
// FIREBASE_API_KEY, FIREBASE_AUTH_DOMAIN, dll
// GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
// AI_WORKER_URL - URL untuk layanan AI Anda

/**
 * Handle permintaan masuk ke Santrilogy AI
 */
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Validasi origin untuk keamanan
    const allowedOrigins = [
      'https://your-blogger-site.blogspot.com',  // Ganti dengan domain Anda
      'https://your-custom-domain.com',          // Atau domain Anda sendiri
      ...(env.ALLOWED_ORIGINS ? env.ALLOWED_ORIGINS.split(',') : [])
    ];

    // Set header CORS
    const headers = {
      'Access-Control-Allow-Origin': allowedOrigins.includes(request.headers.get('Origin')) ? request.headers.get('Origin') : allowedOrigins[0],
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Content-Type': 'application/json',
    };

    // Handle preflight request
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers });
    }

    try {
      // Routing untuk endpoint yang berbeda
      if (path === '/api/chat' && request.method === 'POST') {
        return await handleChatRequest(request, env, headers);
      } else if (path === '/api/history' && request.method === 'GET') {
        return await handleHistoryRequest(request, env, headers);
      } else if (path === '/api/session' && request.method === 'POST') {
        return await handleSessionRequest(request, env, headers);
      } else if (path === '/api/auth' && request.method === 'POST') {
        return await handleAuthRequest(request, env, headers);
      } else if (path === '/api/auth/google' && request.method === 'GET') {
        return await handleGoogleAuthRedirect(request, env, headers);
      } else if (path === '/api/auth/callback' && request.method === 'GET') {
        return await handleGoogleAuthCallback(request, env, headers);
      } else if (path === '/health' && request.method === 'GET') {
        return new Response(JSON.stringify({
          status: 'healthy',
          timestamp: Date.now(),
          service: 'Santrilogy AI Worker'
        }), {
          status: 200,
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          }
        });
      } else if (path === '/' && request.method === 'GET') {
        return new Response(JSON.stringify({
          message: 'Santrilogy AI Worker - Backend Authentication Service',
          endpoints: [
            '/api/chat',
            '/api/history',
            '/api/session',
            '/api/auth',
            '/api/auth/google',
            '/api/auth/callback',
            '/health'
          ]
        }), {
          status: 200,
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          }
        });
      } else {
        return new Response(JSON.stringify({ error: 'Endpoint tidak ditemukan' }), {
          status: 404,
          headers
        });
      }
    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
        status: 500,
        headers
      });
    }
  }
};

/**
 * Handle Google OAuth redirect - initiate the flow
 */
async function handleGoogleAuthRedirect(request, env, headers) {
  try {
    const url = new URL(request.url);
    // Get the original origin from query parameter
    const origin = url.searchParams.get('origin') || '';
    let redirectOrigin = origin;

    // Validate origin against allowed origins for security
    const allowedOrigins = env.ALLOWED_ORIGINS ? env.ALLOWED_ORIGINS.split(',') : [];
    if (origin && !allowedOrigins.includes(origin)) {
      // Use the first allowed origin as fallback if origin is not in whitelist
      redirectOrigin = allowedOrigins[0] || 'https://santrilogy-ai.blogspot.com';
    } else if (!redirectOrigin) {
      // Use first allowed origin if no origin provided
      redirectOrigin = allowedOrigins[0] || 'https://santrilogy-ai.blogspot.com';
    }

    // Generate a random state parameter for security
    const state = generateRandomString(32);
    const nonce = generateRandomString(32);

    // Store state in KV for validation later (if available) or in session
    // For now, we'll use URL parameters but in production, should use secure storage
    const redirectUri = `${env.WORKER_URL}/api/auth/callback`;

    // Create state that includes the redirect origin for secure return
    const stateWithOrigin = btoa(JSON.stringify({ state, origin: redirectOrigin, nonce }));

    const googleAuthUrl = new URL('https://accounts.google.com/oauth/authorize');
    googleAuthUrl.searchParams.set('response_type', 'code');
    googleAuthUrl.searchParams.set('client_id', env.GOOGLE_CLIENT_ID);
    googleAuthUrl.searchParams.set('redirect_uri', redirectUri);
    googleAuthUrl.searchParams.set('scope', 'openid email profile');
    googleAuthUrl.searchParams.set('state', stateWithOrigin); // Include origin in state

    // Redirect to Google OAuth
    return new Response(null, {
      status: 302,
      headers: {
        'Location': googleAuthUrl.toString()
      }
    });
  } catch (error) {
    console.error('Google auth redirect error:', error);
    return new Response(JSON.stringify({ error: 'Failed to initiate Google Auth' }), {
      status: 500,
      headers
    });
  }
}

/**
 * Handle Google OAuth callback - exchange code for tokens
 */
async function handleGoogleAuthCallback(request, env, headers) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');

    if (!code) {
      return new Response('Authorization code not found', {
        status: 400,
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    // Decode the state to get the original origin
    let redirectOrigin = 'https://santrilogy-ai.blogspot.com'; // default fallback
    let originalState = '';

    if (state) {
      try {
        // The state was encoded as base64 JSON containing origin
        const stateObj = JSON.parse(atob(state));
        if (stateObj && stateObj.origin) {
          // Validate origin against allowed origins for security
          const allowedOrigins = env.ALLOWED_ORIGINS ? env.ALLOWED_ORIGINS.split(',') : [];
          if (allowedOrigins.includes(stateObj.origin)) {
            redirectOrigin = stateObj.origin;
          } else {
            console.warn('Untrusted origin in state parameter, using default:', stateObj.origin);
          }
        }
        if (stateObj && stateObj.state) {
          originalState = stateObj.state; // This is the original random state for validation
        }
      } catch (e) {
        console.error('Error parsing state parameter:', e);
      }
    }

    // Exchange authorization code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code: code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${env.WORKER_URL}/api/auth/callback`,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error(`Token exchange failed: ${tokenResponse.statusText}`);
    }

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      throw new Error('No access token received from Google');
    }

    // Get user info from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userInfoResponse.ok) {
      throw new Error(`User info fetch failed: ${userInfoResponse.statusText}`);
    }

    const googleUser = await userInfoResponse.json();

    // Exchange Google access token for Firebase ID token using Identity Toolkit
    const firebaseTokenResponse = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=${env.FIREBASE_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postBody: `access_token=${tokenData.access_token}&providerId=google.com`,
          requestUri: request.url,
          returnIdpCredential: true,
          returnSecureToken: true,
        }),
      }
    );

    if (!firebaseTokenResponse.ok) {
      console.error('Firebase token exchange failed:', await firebaseTokenResponse.text());
      throw new Error('Failed to exchange for Firebase token');
    }

    const firebaseData = await firebaseTokenResponse.json();

    // Create user data object
    const userData = {
      uid: firebaseData.localId,
      email: googleUser.email,
      displayName: googleUser.name,
      photoURL: googleUser.picture,
      emailVerified: googleUser.verified_email || false,
      provider: 'google'
    };

    // Encode the user data to pass in the URL hash
    const encodedUser = encodeURIComponent(JSON.stringify(userData));

    // Redirect back to the original origin with the token in the hash
    const redirectUrl = `${redirectOrigin}/#token=${firebaseData.idToken}&user=${encodedUser}`;

    return new Response(null, {
      status: 302,
      headers: {
        'Location': redirectUrl
      }
    });
  } catch (error) {
    console.error('Google auth callback error:', error);
    return new Response(`Error during Google authentication: ${error.message}`, {
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

/**
 * Handle permintaan chat ke AI
 */
async function handleChatRequest(request, env, headers) {
  try {
    const body = await request.json();
    const { message, userId, sessionId } = body;

    // Validasi input
    if (!message || !userId) {
      return new Response(JSON.stringify({ error: 'Parameter tidak lengkap' }), {
        status: 400,
        headers
      });
    }

    // Kirim ke AI Worker Anda
    const aiResponse = await sendToAIWorker(env.AI_WORKER_URL, message, userId);

    // Simpan percakapan ke Firestore melalui REST API
    await saveConversationToFirestore(env, userId, sessionId, message, aiResponse);

    return new Response(JSON.stringify({
      response: aiResponse,
      timestamp: Date.now()
    }), { headers });

  } catch (error) {
    console.error('Chat request error:', error);
    return new Response(JSON.stringify({ error: 'Gagal memproses pesan' }), {
      status: 500,
      headers
    });
  }
}

/**
 * Handle permintaan histori chat
 */
async function handleHistoryRequest(request, env, headers) {
  try {
    const urlParams = new URL(request.url).searchParams;
    const userId = urlParams.get('userId');

    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID dibutuhkan' }), {
        status: 400,
        headers
      });
    }

    // Ambil histori dari Firestore melalui REST API
    const history = await getHistoryFromFirestore(env, userId);

    return new Response(JSON.stringify({ history }), { headers });

  } catch (error) {
    console.error('History request error:', error);
    return new Response(JSON.stringify({ error: 'Gagal mengambil histori' }), {
      status: 500,
      headers
    });
  }
}

/**
 * Handle permintaan sesi
 */
async function handleSessionRequest(request, env, headers) {
  try {
    const body = await request.json();
    const { sessionId, userId, action } = body;

    if (!sessionId || !userId || !action) {
      return new Response(JSON.stringify({ error: 'Parameter tidak lengkap' }), {
        status: 400,
        headers
      });
    }

    let result;
    if (action === 'get') {
      result = await getSessionFromFirestore(env, userId, sessionId);
    } else if (action === 'save') {
      result = await saveSessionToFirestore(env, userId, sessionId, body.sessionData);
    } else if (action === 'delete') {
      result = await deleteSessionFromFirestore(env, userId, sessionId);
    } else {
      return new Response(JSON.stringify({ error: 'Aksi tidak valid' }), {
        status: 400,
        headers
      });
    }

    return new Response(JSON.stringify({ success: true, data: result }), { headers });

  } catch (error) {
    console.error('Session request error:', error);
    return new Response(JSON.stringify({ error: 'Gagal memproses sesi' }), {
      status: 500,
      headers
    });
  }
}

/**
 * Handle permintaan otentikasi (akan diintegrasikan dengan Firebase Auth via REST)
 */
async function handleAuthRequest(request, env, headers) {
  try {
    const body = await request.json();
    const { action, email, password, idToken } = body;

    if (!action) {
      return new Response(JSON.stringify({ error: 'Aksi otentikasi dibutuhkan' }), {
        status: 400,
        headers
      });
    }

    let result;
    if (action === 'login') {
      result = await firebaseLogin(env, email, password);
    } else if (action === 'signup') {
      result = await firebaseSignup(env, email, password);
    } else if (action === 'verify') {
      result = await firebaseVerifyToken(env, idToken);
    } else {
      return new Response(JSON.stringify({ error: 'Aksi tidak valid' }), {
        status: 400,
        headers
      });
    }

    return new Response(JSON.stringify(result), { headers });

  } catch (error) {
    console.error('Auth request error:', error);
    return new Response(JSON.stringify({ error: 'Gagal otentikasi' }), {
      status: 500,
      headers
    });
  }
}

/**
 * Kirim permintaan ke AI Worker Anda
 */
async function sendToAIWorker(workerUrl, message, userId) {
  const response = await fetch(workerUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: message,
      userId: userId,
      // tambahkan parameter lain yang dibutuhkan oleh AI Worker Anda
    })
  });

  if (!response.ok) {
    throw new Error(`AI Worker error: ${response.status}`);
  }

  const data = await response.json();
  return data.response || data;
}

/**
 * Simpan percakapan ke Firestore via REST API
 */
async function saveConversationToFirestore(env, userId, sessionId, userMessage, aiResponse) {
  const docId = Date.now().toString();

  const document = {
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    userId: userId,
    sessionId: sessionId,
    messages: [
      { role: 'user', content: userMessage, timestamp: Date.now() },
      { role: 'assistant', content: aiResponse, timestamp: Date.now() }
    ]
  };

  const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/users/${userId}/sessions/${sessionId}/conversations/${docId}`;

  const response = await fetch(firestoreUrl, {
    method: 'PATCH', // atau 'POST' tergantung kebutuhan
    headers: {
      'Authorization': `Bearer ${env.GOOGLE_ACCESS_TOKEN}`, // Anda butuh service account token
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(document)
  });

  if (!response.ok) {
    console.error('Firestore save error:', await response.text());
  }
}

/**
 * Ambil histori dari Firestore via REST API
 */
async function getHistoryFromFirestore(env, userId) {
  const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents:runQuery`;

  const query = {
    structuredQuery: {
      from: [{
        collectionId: `users/${userId}/sessions`
      }],
      orderBy: [{
        field: { fieldPath: "updatedAt" },
        direction: "DESCENDING"
      }]
    }
  };

  const response = await fetch(firestoreUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.GOOGLE_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(query)
  });

  if (!response.ok) {
    console.error('Firestore query error:', await response.text());
    return [];
  }

  const data = await response.json();
  return data;
}

/**
 * Validasi pengguna
 */
async function validateUser(env, userId) {
  // Implementasi validasi pengguna
  // Anda bisa menggunakan Firebase Auth REST API di sini
  return true; // Placeholder
}

/**
 * Fungsi untuk operasi Firestore lainnya
 */
async function getSessionFromFirestore(env, userId, sessionId) {
  // Implementasi ambil sesi
  return { sessionId, userId, messages: [] }; // Placeholder
}

async function saveSessionToFirestore(env, userId, sessionId, sessionData) {
  // Implementasi simpan sesi
  return { success: true }; // Placeholder
}

async function deleteSessionFromFirestore(env, userId, sessionId) {
  // Implementasi hapus sesi
  return { success: true }; // Placeholder
}

/**
 * Fungsi untuk otentikasi Firebase via REST API
 */
async function firebaseLogin(env, email, password) {
  const loginUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${env.FIREBASE_API_KEY}`;

  const response = await fetch(loginUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      returnSecureToken: true
    })
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${await response.text()}`);
  }

  const data = await response.json();
  return { success: true, idToken: data.idToken, refreshToken: data.refreshToken };
}

async function firebaseSignup(env, email, password) {
  const signupUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${env.FIREBASE_API_KEY}`;

  const response = await fetch(signupUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      returnSecureToken: true
    })
  });

  if (!response.ok) {
    throw new Error(`Signup failed: ${await response.text()}`);
  }

  const data = await response.json();
  return { success: true, idToken: data.idToken, refreshToken: data.refreshToken };
}

async function firebaseVerifyToken(env, idToken) {
  const verifyUrl = `https://www.googleapis.com/identitytoolkit/v3/relyingparty/getAccountInfo?key=${env.FIREBASE_API_KEY}`;

  const response = await fetch(verifyUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken })
  });

  if (!response.ok) {
    throw new Error(`Token verification failed: ${await response.text()}`);
  }

  const data = await response.json();
  return { success: true, user: data.users[0] };
}

// Helper function to generate random strings
function generateRandomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}