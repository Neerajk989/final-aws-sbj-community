const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 8080;
const ROOT_DIR = __dirname;
const DATA_DIR = process.env.VERCEL ? path.join('/tmp', 'data') : path.join(ROOT_DIR, 'data');
const DB_FILE = path.join(DATA_DIR, 'gallery.json');
const UPLOADS_DIR = process.env.VERCEL ? path.join('/tmp', 'uploads', 'gallery') : path.join(ROOT_DIR, 'uploads', 'gallery');

// Ensure data & upload directories exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Seed data if DB does not exist
if (!fs.existsSync(DB_FILE)) {
  const seed = [
  {
    "id": "gal-1",
    "title": "AWS Cloud Practitioner Kickoff & Roadmap",
    "category": "workshops",
    "categoryLabel": "Workshop",
    "date": "2026-02-24",
    "dateFormatted": "Feb 24, 2026",
    "location": "Auditorium, SBJITMR",
    "caption": "Student builders gathered for an in-depth orientation on AWS architecture, certification tracks, and building cloud fundamentals.",
    "imageUrl": "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80",
    "createdAt": "2026-02-24T10:00:00.000Z"
  },
  {
    "id": "gal-2",
    "title": "Hands-on GenAI with Amazon Bedrock",
    "category": "workshops",
    "categoryLabel": "Workshop",
    "date": "2026-02-12",
    "dateFormatted": "Feb 12, 2026",
    "location": "Cloud Computing Lab 402",
    "caption": "Deep dive into foundation models, prompt engineering, and building agentic workflows on Amazon Bedrock.",
    "imageUrl": "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1200&auto=format&fit=crop&q=80",
    "createdAt": "2026-02-12T14:30:00.000Z"
  },
  {
    "id": "gal-3",
    "title": "SB Jain Cloud Builder Hackathon 2026",
    "category": "hackathons",
    "categoryLabel": "Hackathon",
    "date": "2026-01-20",
    "dateFormatted": "Jan 20, 2026",
    "location": "Innovation Center, SBJITMR",
    "caption": "24-hour non-stop cloud challenge where student teams built scalable, serverless full-stack web applications.",
    "imageUrl": "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&auto=format&fit=crop&q=80",
    "createdAt": "2026-01-20T09:00:00.000Z"
  },
  {
    "id": "gal-4",
    "title": "Central India AWS Community Day Connect",
    "category": "community-day",
    "categoryLabel": "Community Day",
    "date": "2026-01-05",
    "dateFormatted": "Jan 05, 2026",
    "location": "Main Seminar Hall",
    "caption": "Keynote discussions with AWS Community Builders and industry solutions architects on career pathways in cloud and DevOps.",
    "imageUrl": "https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&auto=format&fit=crop&q=80",
    "createdAt": "2026-01-05T11:00:00.000Z"
  },
  {
    "id": "gal-5",
    "title": "AWS Student Builder Group Core Team Meetup",
    "category": "meetups",
    "categoryLabel": "Campus Meetup",
    "date": "2025-12-15",
    "dateFormatted": "Dec 15, 2025",
    "location": "Department Conference Room",
    "caption": "Brainstorming session aligning event roadmaps, workshop schedules, and student mentor programs for the upcoming semester.",
    "imageUrl": "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&auto=format&fit=crop&q=80",
    "createdAt": "2025-12-15T15:00:00.000Z"
  },
  {
    "id": "gal-6",
    "title": "Serverless Architecture & Lambda Microservices",
    "category": "workshops",
    "categoryLabel": "Workshop",
    "date": "2025-11-28",
    "dateFormatted": "Nov 28, 2025",
    "location": "CSE Lab 2",
    "caption": "Practical demonstration on event-driven architecture using AWS Lambda, API Gateway, and DynamoDB.",
    "imageUrl": "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&auto=format&fit=crop&q=80",
    "createdAt": "2025-11-28T13:30:00.000Z"
  }
];
  fs.writeFileSync(DB_FILE, JSON.stringify(seed, null, 2), 'utf8');
  console.log('[Database] Seeded initial gallery database:', DB_FILE);
}

// MIME types dictionary
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf'
};

function readGalleryData() {
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('[Error] Failed to read gallery database:', err);
    return [];
  }
}

function writeGalleryData(data) {
  try {
    const tmp = DB_FILE + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tmp, DB_FILE);
    return true;
  } catch (err) {
    console.error('[Error] Failed to write gallery database:', err);
    return false;
  }
}

// Request parser helper
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      // 25MB max payload for image uploads
      if (body.length > 25 * 1024 * 1024) {
        req.connection.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        resolve(body);
      }
    });
    req.on('error', reject);
  });
}


function openaiResponseRequest(apiKey, payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);

    const req = https.request({
      hostname: 'api.openai.com',
      path: '/v1/responses',
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      },
      timeout: 30000
    }, (upstream) => {
      let raw = '';

      upstream.on('data', (chunk) => {
        raw += chunk;
      });

      upstream.on('end', () => {
        let data;
        try {
          data = raw ? JSON.parse(raw) : {};
        } catch (err) {
          return reject(new Error('Invalid JSON from OpenAI API'));
        }

        resolve({
          ok: upstream.statusCode >= 200 && upstream.statusCode < 300,
          status: upstream.statusCode || 500,
          data
        });
      });
    });

    req.on('timeout', () => {
      req.destroy(new Error('OpenAI request timed out'));
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data));
}

// HTTP Server
const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    return res.end();
  }

  /* ----------------------------------------------------
     REST API ROUTES
  ---------------------------------------------------- */
  // 1. Health check
  if (pathname === '/api/health' && req.method === 'GET') {
    const gallery = readGalleryData();
    return sendJson(res, 200, {
      status: 'ok',
      timestamp: new Date().toISOString(),
      galleryItems: gallery.length
    });
  }


  // OpenAI chatbot API
  if (pathname === '/api/chat' && req.method === 'POST') {
    try {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        return sendJson(res, 503, {
          success: false,
          error: 'Chatbot is not configured yet. OPENAI_API_KEY is missing.'
        });
      }

      const payload = await parseBody(req);
      const message = typeof payload.message === 'string' ? payload.message.trim() : '';
      const history = Array.isArray(payload.history) ? payload.history.slice(-12) : [];
      const pageContext = typeof payload.pageContext === 'string' ? payload.pageContext.slice(0, 12000) : '';

      if (!message) {
        return sendJson(res, 400, { success: false, error: 'Message is required.' });
      }

      if (message.length > 3000) {
        return sendJson(res, 400, { success: false, error: 'Message is too long.' });
      }

      const safeHistory = history
        .filter(item => item && (item.role === 'user' || item.role === 'assistant') && typeof item.content === 'string')
        .map(item => ({
          role: item.role,
          content: [{
            type: item.role === 'assistant' ? 'output_text' : 'input_text',
            text: item.content.slice(0, 3000)
          }]
        }));

      const hasWebsiteContext = Boolean(pageContext && pageContext.trim());
      const explicitlyCurrent = /\b(latest|today|current|currently|news|live|now|recent|price|weather|score|result|release|update|updated|2026)\b/i.test(message);
      const externalFactQuestion = /\b(who|what|where|when|which|how many|how much|president|prime minister|company|country|city|college|university|product|service|version|date|time)\b/i.test(message);
      const modelOnlyTask = /\b(write|rewrite|summarize|translate|code|program|debug|solve|calculate|equation|essay|poem|story|email|caption|explain concept|algorithm)\b/i.test(message);
      const needsWeb = !hasWebsiteContext && (explicitlyCurrent || (externalFactQuestion && !modelOnlyTask));

      const requestBody = {
        model: 'gpt-5.6-luna',
        instructions:
          'You are SB Jain AWS AI, a general-purpose assistant. Answer the user\'s actual question directly and accurately. ' +
          'Follow this routing rule: (1) if WEBSITE CONTENT is supplied and answers the question, use it as the primary source of truth; (2) otherwise, for externally verifiable or current facts, use web search when available; (3) for coding, writing, math, explanations, and other non-current tasks, answer directly from the model. ' +
          'Never invent a website-specific fact. Never present an uncertain factual claim as certain. If sources disagree or a fact cannot be verified, say that clearly. When web search is used, ground the answer in the search results and keep citations/sources. Keep answers concise by default, but give clear step-by-step detail or code when requested.\n\n' +
          'WEBSITE CONTENT:\n' + (pageContext || '[No website context supplied for this question]'),
        input: [
          ...safeHistory,
          {
            role: 'user',
            content: [{ type: 'input_text', text: message }]
          }
        ],
        max_output_tokens: 1200
      };

      if (needsWeb) {
        requestBody.tools = [{ type: 'web_search' }];
        requestBody.tool_choice = 'auto';
      }

      const result = await openaiResponseRequest(apiKey, requestBody);
      const data = result.data;

      if (!result.ok) {
        console.error('[OpenAI API] Upstream error:', data);
        const upstreamMessage =
          data?.error?.message ||
          data?.error?.code ||
          ('OpenAI API error ' + result.status);
        return sendJson(res, result.status, {
          success: false,
          error: 'OpenAI error: ' + String(upstreamMessage).slice(0, 260)
        });
      }

      const outputItems = Array.isArray(data?.output) ? data.output : [];
      const textParts = [];
      const sources = [];

      for (const item of outputItems) {
        if (item?.type === 'message' && Array.isArray(item.content)) {
          for (const part of item.content) {
            if (part?.type === 'output_text' && part.text) {
              textParts.push(part.text);
              if (Array.isArray(part.annotations)) {
                for (const ann of part.annotations) {
                  if (ann?.type === 'url_citation' && ann.url) {
                    sources.push({
                      title: ann.title || ann.url,
                      url: ann.url
                    });
                  }
                }
              }
            }
          }
        }
      }

      const reply = textParts.join('\n').trim() || 'Sorry, I could not generate a response.';
      const uniqueSources = sources.filter((src, index, arr) =>
        src.url && arr.findIndex(x => x.url === src.url) === index
      ).slice(0, 5);

      return sendJson(res, 200, {
        success: true,
        reply,
        sources: uniqueSources,
        answerSource: hasWebsiteContext ? 'website' : (needsWeb ? 'web' : 'ai')
      });
    } catch (err) {
      console.error('[OpenAI API] Chat error:', err);
      if (err && /timed out/i.test(err.message || '')) {
        return sendJson(res, 504, { success: false, error: 'The AI took too long to respond. Please try again.' });
      }
      return sendJson(res, 500, { success: false, error: 'Chatbot request failed: ' + (err.message || 'unknown error') });
    }
  }

  // 2. GET /api/gallery
  if (pathname === '/api/gallery' && req.method === 'GET') {
    const category = parsedUrl.searchParams.get('category');
    let items = readGalleryData();
    if (category && category !== 'all') {
      items = items.filter(it => it.category === category);
    }
    return sendJson(res, 200, { success: true, count: items.length, items });
  }

  // 3. POST /api/gallery (Upload / Add event photo)
  if (pathname === '/api/gallery' && req.method === 'POST') {
    try {
      const payload = await parseBody(req);
      const { title, category, categoryLabel, date, location, caption, imageData, imageUrl: inputUrl } = payload;

      if (!title || !category) {
        return sendJson(res, 400, { success: false, error: 'Title and category are required.' });
      }

      const id = 'gal-' + Date.now() + '-' + crypto.randomBytes(3).toString('hex');
      let finalImageUrl = inputUrl || '';

      // If base64 imageData was sent, save it to disk
      if (imageData && imageData.startsWith('data:image/')) {
        const matches = imageData.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
        if (matches) {
          const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
          const fileName = `${id}.${ext}`;
          const filePath = path.join(UPLOADS_DIR, fileName);
          const buffer = Buffer.from(matches[2], 'base64');
          fs.writeFileSync(filePath, buffer);
          finalImageUrl = `/uploads/gallery/${fileName}`;
        }
      }

      if (!finalImageUrl) {
        finalImageUrl = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80';
      }

      // Format date
      let formattedDate = date || new Date().toISOString().slice(0, 10);
      try {
        const d = new Date(formattedDate);
        if (!isNaN(d.getTime())) {
          formattedDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }
      } catch (e) {}

      const newItem = {
        id,
        title: title.trim(),
        category: (category || 'workshops').toLowerCase().trim(),
        categoryLabel: categoryLabel || (category.charAt(0).toUpperCase() + category.slice(1)),
        date: date || new Date().toISOString().slice(0, 10),
        dateFormatted: formattedDate,
        location: (location || 'SB Jain Institute of Technology, Nagpur').trim(),
        caption: (caption || '').trim(),
        imageUrl: finalImageUrl,
        createdAt: new Date().toISOString()
      };

      const current = readGalleryData();
      current.unshift(newItem);
      writeGalleryData(current);

      console.log(`[Gallery API] Added new photo: "${newItem.title}" (${newItem.id})`);
      return sendJson(res, 201, { success: true, item: newItem });
    } catch (err) {
      console.error('[Gallery API] POST error:', err);
      return sendJson(res, 500, { success: false, error: 'Internal server error' });
    }
  }

  // 4. DELETE /api/gallery/:id
  if (pathname.startsWith('/api/gallery/') && req.method === 'DELETE') {
    const id = pathname.replace('/api/gallery/', '').trim();
    if (!id) {
      return sendJson(res, 400, { success: false, error: 'Missing photo ID' });
    }

    const current = readGalleryData();
    const itemIndex = current.findIndex(it => it.id === id);
    if (itemIndex === -1) {
      return sendJson(res, 404, { success: false, error: 'Photo not found' });
    }

    const [deletedItem] = current.splice(itemIndex, 1);
    writeGalleryData(current);

    // If local file was saved in uploads, delete it
    if (deletedItem.imageUrl && deletedItem.imageUrl.startsWith('/uploads/gallery/')) {
      const fileName = path.basename(deletedItem.imageUrl);
      const localFile = path.join(UPLOADS_DIR, fileName);
      if (fs.existsSync(localFile)) {
        try { fs.unlinkSync(localFile); } catch (e) {}
      }
    }

    console.log(`[Gallery API] Deleted photo: ${id}`);
    return sendJson(res, 200, { success: true, id });
  }

  /* ----------------------------------------------------
     STATIC FILE SERVING
  ---------------------------------------------------- */
  let safePath = path.normalize(pathname).replace(/^(\/\.\.[\/\\])+/, '');
  if (safePath === '/' || safePath === '\\') safePath = '/index.html';
  
  let filePath = path.join(ROOT_DIR, safePath);

  // If path is directory, look for index.html
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    // Fast static streaming with cache-control
    const stat = fs.statSync(filePath);
    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stat.size,
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=3600'
    });
    fs.createReadStream(filePath).pipe(res);
  } else {
    // 404 Not Found
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<h1>404 Not Found</h1><p>The path <code>${pathname}</code> does not exist.</p><p><a href="/">Return Home</a></p>`);
  }
});

server.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`🚀 SB JAIN AWS COMMUNITY SERVER ACTIVE`);
  console.log(`📍 Local Address : http://localhost:${PORT}`);
  console.log(`📁 Static Root   : ${ROOT_DIR}`);
  console.log(`💾 Data Storage  : ${DB_FILE}`);
  console.log(`📸 Uploads Store : ${UPLOADS_DIR}`);
  console.log(`==================================================`);
});
