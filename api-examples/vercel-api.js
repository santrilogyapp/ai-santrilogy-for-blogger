// ========== API SERVER UNTUK SANTRILOGY AI ==========
// Contoh implementasi untuk Vercel API Routes
// File: pages/api/santrilogy/[...endpoint].js (untuk Next.js) atau api/santrilogy/[...endpoint].js

export default async function handler(request, response) {
  // Konfigurasi - gunakan environment variables di production
  const config = {
    FIREBASE_API_KEY: process.env.FIREBASE_API_KEY || 'YOUR_FIREBASE_API_KEY',
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || 'your-project-id',
    AI_WORKER_URL: process.env.AI_WORKER_URL || 'https://your-ai-worker.your-namespace.workers.dev',
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS?.split(',') || [
      'https://your-blogger-site.blogspot.com',
      'https://your-custom-domain.com'
    ]
  };

  // CORS headers
  const origin = request.headers.origin;
  const isAllowedOrigin = config.ALLOWED_ORIGINS.includes(origin);
  
  response.setHeader('Access-Control-Allow-Credentials', 'true');
  response.setHeader('Access-Control-Allow-Origin', isAllowedOrigin ? origin : config.ALLOWED_ORIGINS[0]);
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight request
  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  // Ambil endpoint dari URL
  const { endpoint } = request.query;
  const path = endpoint?.[0] || '';
  const action = endpoint?.[1] || '';

  try {
    switch (path) {
      case 'chat':
        if (request.method === 'POST') {
          return handleChat(request, response, config);
        }
        break;
        
      case 'history':
        if (request.method === 'GET') {
          return handleHistory(request, response, config);
        }
        break;
        
      case 'session':
        if (request.method === 'POST') {
          return handleSession(request, response, config);
        }
        break;
        
      case 'auth':
        if (request.method === 'POST') {
          return handleAuth(request, response, config);
        }
        break;
        
      default:
        return response.status(404).json({ error: 'Endpoint tidak ditemukan' });
    }
    
    return response.status(405).json({ error: 'Method tidak diizinkan' });
  } catch (error) {
    console.error('API Error:', error);
    return response.status(500).json({ error: 'Internal Server Error' });
  }
}

// Handler untuk chat
async function handleChat(request, response, config) {
  const { message, userId, sessionId } = request.body;

  if (!message || !userId) {
    return response.status(400).json({ error: 'Parameter tidak lengkap' });
  }

  try {
    // Kirim ke AI Worker
    const aiResponse = await sendToAIWorker(config.AI_WORKER_URL, message, userId);

    // Simpan percakapan
    await saveConversationToFirestore(config, userId, sessionId, message, aiResponse);

    return response.status(200).json({ 
      response: aiResponse,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Chat handler error:', error);
    return response.status(500).json({ error: 'Gagal memproses pesan' });
  }
}

// Handler untuk histori
async function handleHistory(request, response, config) {
  const { userId } = request.query || request.body;

  if (!userId) {
    return response.status(400).json({ error: 'User ID dibutuhkan' });
  }

  try {
    const history = await getHistoryFromFirestore(config, userId);
    return response.status(200).json({ history });
  } catch (error) {
    console.error('History handler error:', error);
    return response.status(500).json({ error: 'Gagal mengambil histori' });
  }
}

// Handler untuk sesi
async function handleSession(request, response, config) {
  const { sessionId, userId, action, sessionData } = request.body;

  if (!sessionId || !userId || !action) {
    return response.status(400).json({ error: 'Parameter tidak lengkap' });
  }

  try {
    let result;
    
    switch (action) {
      case 'get':
        result = await getSessionFromFirestore(config, userId, sessionId);
        break;
      case 'save':
        result = await saveSessionToFirestore(config, userId, sessionId, sessionData);
        break;
      case 'delete':
        result = await deleteSessionFromFirestore(config, userId, sessionId);
        break;
      default:
        return response.status(400).json({ error: 'Aksi tidak valid' });
    }

    return response.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('Session handler error:', error);
    return response.status(500).json({ error: 'Gagal memproses sesi' });
  }
}

// Handler untuk otentikasi
async function handleAuth(request, response, config) {
  const { action, email, password, idToken } = request.body;

  if (!action) {
    return response.status(400).json({ error: 'Aksi otentikasi dibutuhkan' });
  }

  try {
    let result;
    
    switch (action) {
      case 'login':
        result = await firebaseLogin(config, email, password);
        break;
      case 'signup':
        result = await firebaseSignup(config, email, password);
        break;
      case 'verify':
        result = await firebaseVerifyToken(config, idToken);
        break;
      default:
        return response.status(400).json({ error: 'Aksi tidak valid' });
    }

    return response.status(200).json(result);
  } catch (error) {
    console.error('Auth handler error:', error);
    return response.status(500).json({ error: 'Gagal otentikasi' });
  }
}

// Fungsi-fungsi utility
async function sendToAIWorker(workerUrl, message, userId) {
  const response = await fetch(workerUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: message,
      userId: userId,
    })
  });

  if (!response.ok) {
    throw new Error(`AI Worker error: ${response.status}`);
  }

  const data = await response.json();
  return data.response || data;
}

async function saveConversationToFirestore(config, userId, sessionId, userMessage, aiResponse) {
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

  const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${config.FIREBASE_PROJECT_ID}/databases/(default)/documents/users/${userId}/sessions/${sessionId}/conversations`;
  
  const response = await fetch(firestoreUrl + `/${Date.now()}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${process.env.GOOGLE_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(document)
  });

  if (!response.ok) {
    console.error('Firestore save error:', await response.text());
  }
}

async function getHistoryFromFirestore(config, userId) {
  const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${config.FIREBASE_PROJECT_ID}/databases/(default)/documents:runQuery`;
  
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
      'Authorization': `Bearer ${process.env.GOOGLE_ACCESS_TOKEN}`,
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

// Implementasi fungsi lainnya (getSessionFromFirestore, saveSessionToFirestore, dll)
// akan serupa dengan fungsi di atas

async function firebaseLogin(config, email, password) {
  const loginUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${config.FIREBASE_API_KEY}`;
  
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

async function firebaseSignup(config, email, password) {
  const signupUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${config.FIREBASE_API_KEY}`;
  
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

async function firebaseVerifyToken(config, idToken) {
  const verifyUrl = `https://www.googleapis.com/identitytoolkit/v3/relyingparty/getAccountInfo?key=${config.FIREBASE_API_KEY}`;
  
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