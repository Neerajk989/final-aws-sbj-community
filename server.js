const http = require('http');
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


  // NVIDIA Nemotron chatbot API
  if (pathname === '/api/chat' && req.method === 'POST') {
    try {
      const apiKey = process.env.NVIDIA_API_KEY;
      if (!apiKey) {
        return sendJson(res, 503, {
          success: false,
          error: 'Chatbot is not configured yet. NVIDIA_API_KEY is missing.'
        });
      }

      const payload = await parseBody(req);
      const message = typeof payload.message === 'string' ? payload.message.trim() : '';
      const history = Array.isArray(payload.history) ? payload.history.slice(-8) : [];

      if (!message) {
        return sendJson(res, 400, { success: false, error: 'Message is required.' });
      }

      if (message.length > 3000) {
        return sendJson(res, 400, { success: false, error: 'Message is too long.' });
      }

      const safeHistory = history
        .filter(item => item && (item.role === 'user' || item.role === 'assistant') && typeof item.content === 'string')
        .map(item => ({ role: item.role, content: item.content.slice(0, 3000) }));

      const upstream = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'nvidia/nemotron-3.5-lightning-30b-a3b',
          messages: [
            {
              role: 'system',
              content: 'You are the AI assistant for the SB Jain AWS Student Community in Nagpur. Be helpful, concise, student-friendly, and especially useful for AWS, cloud computing, programming, projects, events, and learning questions. If asked about information not provided by the website or conversation, say you may not have the latest community-specific details.'
            },
            ...safeHistory,
            { role: 'user', content: message }
          ],
          temperature: 0.6,
          top_p: 0.9,
          max_tokens: 700
        })
      });

      const data = await upstream.json();

      if (!upstream.ok) {
        console.error('[Nemotron API] Upstream error:', data);
        return sendJson(res, upstream.status, {
          success: false,
          error: 'The AI service could not answer right now.'
        });
      }

      const reply = data?.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';
      return sendJson(res, 200, { success: true, reply });
    } catch (err) {
      console.error('[Nemotron API] Chat error:', err);
      return sendJson(res, 500, { success: false, error: 'Chatbot request failed.' });
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
