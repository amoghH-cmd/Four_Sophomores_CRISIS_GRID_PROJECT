const express  = require('express');
const cors     = require('cors');
const { v4: uuidv4 } = require('uuid');
const { NGO_SEED } = require('./data');
const { calcPriority, allocateNGOs, isDuplicate, findNearby, haversine } = require('./algorithms');
const https = require('https');
const path  = require('path');

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve React build
app.use(express.static(path.join(__dirname, '../client/build')));

// ── In-Memory Store ──────────────────────────────────────────────────────────
let requests = [];
let ngos     = JSON.parse(JSON.stringify(NGO_SEED));
let commsLog = [];
let sseClients = [];
let smsLog   = []; // Track SMS events

// ── SSE Broadcast ────────────────────────────────────────────────────────────
function broadcast(event, data) {
  const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach(res => res.write(msg));
}

function addComms(type, message) {
  const entry = { id: uuidv4(), type, message, ts: new Date().toISOString() };
  commsLog.unshift(entry);
  if (commsLog.length > 100) commsLog.pop();
  broadcast('comms', entry);
}

// ── Geocode Simulation ───────────────────────────────────────────────────────
const AREA_COORDS = {
  koramangala:      [12.9279, 77.6271],
  indiranagar:      [12.9784, 77.6408],
  whitefield:       [12.9698, 77.7500],
  jayanagar:        [12.9277, 77.5937],
  hebbal:           [13.0358, 77.5970],
  yelahanka:        [13.1007, 77.5963],
  btm:              [12.9166, 77.6101],
  hsr:              [12.9082, 77.6476],
  majestic:         [12.9772, 77.5713],
  'electronic city':[12.8442, 77.6602],
  marathahalli:     [12.9591, 77.6974],
  rajajinagar:      [12.9850, 77.5516],
  malleswaram:      [13.0023, 77.5660],
  bengaluru:        [12.9716, 77.5946],
  bangalore:        [12.9716, 77.5946],
};

async function geocode(locStr) {
  // 1. Check if user provided direct coordinates (e.g. "12.97, 77.59")
  const coordsMatch = locStr.match(/^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/);
  if (coordsMatch) {
    return [parseFloat(coordsMatch[1]), parseFloat(coordsMatch[3])];
  }

  // 2. Check mock areas for instant demo
  const lower = locStr.toLowerCase();
  for (const [k, v] of Object.entries(AREA_COORDS)) {
    if (lower.includes(k)) return v;
  }

  // 3. Fallback to OpenStreetMap Nominatim (Free alternative to Google Maps API)
  return new Promise((resolve) => {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locStr)}&format=json&limit=1`;
    const options = { headers: { 'User-Agent': 'CrisisGridApp/1.0' } };
    
    https.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed && parsed.length > 0) {
            resolve([parseFloat(parsed[0].lat), parseFloat(parsed[0].lon)]);
          } else {
            resolve([12.90 + Math.random() * 0.15, 77.55 + Math.random() * 0.20]);
          }
        } catch (e) {
          resolve([12.90 + Math.random() * 0.15, 77.55 + Math.random() * 0.20]);
        }
      });
    }).on('error', () => {
      resolve([12.90 + Math.random() * 0.15, 77.55 + Math.random() * 0.20]);
    });
  });
}

// ── SMS Parser ───────────────────────────────────────────────────────────────
// Parses SMS in format: "SOS [location] [type] [people] [description]"
// e.g. "SOS Koramangala medical 10 people trapped need urgent help"
function parseSMS(body) {
  const text = body.trim();
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const combined = lines.join(' ');

  // Must start with SOS
  if (!combined.toUpperCase().startsWith('SOS')) {
    return null;
  }

  const withoutSOS = combined.slice(3).trim();

  // Extract type (medical, food, rescue)
  let type = 'medical';
  if (/\bfood\b/i.test(withoutSOS)) type = 'food';
  else if (/\brescue\b/i.test(withoutSOS)) type = 'rescue';
  else if (/\bmedical\b/i.test(withoutSOS)) type = 'medical';

  // Extract number of people
  const peopleMatch = withoutSOS.match(/\b(\d+)\s*(?:people|persons?|ppl|men|women|individuals?)?\b/i);
  const people = peopleMatch ? parseInt(peopleMatch[1]) : 5;

  // Try to extract location (words before the type keyword)
  const typeIdx = withoutSOS.search(/\b(medical|food|rescue)\b/i);
  let loc = 'Bengaluru';
  if (typeIdx > 0) {
    loc = withoutSOS.slice(0, typeIdx).trim().replace(/^,|,$/g, '').trim() || 'Bengaluru';
  }

  // Description = everything after the type word
  const afterType = withoutSOS.slice(typeIdx >= 0 ? typeIdx : 0);
  const description = afterType.replace(/\b(medical|food|rescue)\b/i, '').replace(/\b\d+\b/, '').trim();

  return { loc, type, people: Math.max(1, people), description };
}

// ── Tracking Simulation ──────────────────────────────────────────────────────
function startTracking(req, assignedNGO) {
  const ngo = ngos.find(n => n.id === assignedNGO.id);
  if (!ngo) return;

  const lat1 = ngo.lat, lng1 = ngo.lng;
  const lat2 = req.lat, lng2 = req.lng;
  const totalEta = req.eta || Math.max(2, Math.round((assignedNGO.dist || 0) * 3 + 2));

  const url = `https://router.project-osrm.org/route/v1/driving/${lng1},${lat1};${lng2},${lat2}?geometries=geojson`;
  
  https.get(url, { headers: { 'User-Agent': 'CrisisGridApp/1.0' } }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      let coords = [];
      try {
        const parsed = JSON.parse(data);
        if (parsed.routes && parsed.routes.length > 0) {
          coords = parsed.routes[0].geometry.coordinates; // [[lng, lat], ...]
        }
      } catch (e) {}

      if (!coords || coords.length === 0) {
        coords = [ [lng1, lat1], [lng2, lat2] ]; // Fallback to straight line
      }

      const STEPS    = 60;
      const INTERVAL = 800;
      let   step     = 0;

      const r = requests.find(x => x.id === req.id);
      if (r) r.eta = totalEta;

      const iv = setInterval(() => {
        step++;
        const t = step / STEPS;
        
        const fIndex = t * (coords.length - 1);
        const iIndex = Math.floor(fIndex);
        const p = fIndex - iIndex;
        let curLng, curLat;
        
        if (iIndex >= coords.length - 1) {
          curLng = coords[coords.length - 1][0];
          curLat = coords[coords.length - 1][1];
        } else {
          const c1 = coords[iIndex];
          const c2 = coords[iIndex + 1];
          curLng = c1[0] + (c2[0] - c1[0]) * p;
          curLat = c1[1] + (c2[1] - c1[1]) * p;
        }

        const etaLeft = Math.max(0, Math.round((1 - t) * totalEta));

        const rq = requests.find(x => x.id === req.id);
        if (rq) rq.eta = etaLeft;

        broadcast('tracking', {
          reqId: req.id,
          ngoId: ngo.id,
          lat: curLat,
          lng: curLng,
          eta: etaLeft,
          progress: parseFloat(t.toFixed(3)),
        });

        if (step >= STEPS) {
          clearInterval(iv);
          if (rq) rq.status = 'in-progress';
          ngo.status = 'on-site';
          broadcast('requestUpdate', requests.find(x => x.id === req.id));
          broadcast('ngoUpdate', ngos);
          addComms('to-user',  `✅ → User [${req.id}]: Help has arrived at ${req.loc}!`);
          addComms('to-ngo',   `📡 → NGO [${ngo.name}]: On-site at ${req.loc}. Begin operations.`);
          setTimeout(() => completeRequest(req.id, ngo.id, assignedNGO.assignedCount || req.people), 25000);
        }
      }, INTERVAL);
    });
  }).on('error', () => {
    console.error('OSRM tracking failed');
  });
}

function completeRequest(reqId, ngoId, people) {
  const r = requests.find(x => x.id === reqId);
  if (r) {
    r.status = 'completed';
    r.completedAt = new Date().toISOString();
  }
  const n = ngos.find(x => x.id === ngoId);
  if (n) { n.used = Math.max(0, n.used - people); n.status = 'idle'; }
  broadcast('requestUpdate', r);
  broadcast('ngoUpdate', ngos);
  addComms('system', `✔ Request ${reqId} completed. NGO capacity freed.`);
}

function triggerAllocation(r, alloc) {
  r.status = 'awaiting-approval';
  r.assigned = alloc;
  broadcast('requestUpdate', r);
  addComms('to-ngo',  `📡 → NGO [${alloc[0].name}]: PENDING APPROVAL — Dispatch to ${r.loc}. Need: ${r.type} for ${r.people} people. [${r.priority}]`);
  if (alloc.length > 1) {
    addComms('to-ngo', `📡 → NGO [${alloc[1].name}]: PENDING APPROVAL — Support role — ${r.loc}. Cover ${alloc[1].assignedCount} people.`);
  }
}


// ── Process SOS (shared between form + SMS) ──────────────────────────────────
async function processSOSRequest({ loc, type, people, description, source = 'form' }) {
  const [lat, lng]       = await geocode(loc);
  const { score, priority } = calcPriority(description, people);
  const dup              = isDuplicate(lat, lng, type, requests);
  const nearby           = findNearby(lat, lng, requests, 2.0);

  const request = {
    id:          `REQ-${String(requests.length + 1).padStart(4, '0')}`,
    loc, type,
    people:      parseInt(people, 10),
    description: description || '',
    lat, lng,
    priority, score,
    status:      'pending',
    assigned:    [],
    rejectedBy:  [],
    eta:         null,
    isDuplicate: dup,
    nearbyCount: nearby.length,
    ts:          new Date().toISOString(),
    completedAt: null,
    source,      // 'form' | 'sms'
  };

  requests.unshift(request);
  broadcast('newRequest', request);

  const srcLabel = source === 'sms' ? '📱 SMS' : '💻 Form';
  addComms('system', `📥 [${srcLabel}] New SOS: ${request.id} — ${priority} · ${type} · ${people} people · ${loc}`);

  if (dup)            addComms('system', `⚠️ Possible duplicate at ${loc} (same type within 500m)`);
  if (nearby.length > 1) addComms('system', `🔥 HOTSPOT: ${nearby.length} active requests within 2km of ${loc}`);

  // Allocate
  const alloc = allocateNGOs(request, ngos, request.rejectedBy);
  if (alloc.length) {
    triggerAllocation(request, alloc);
  } else {
    addComms('system', `⚠️ No NGO available with [${type}] resources. Request queued.`);
  }

  return request;
}

// ── Auto-Escalation ──────────────────────────────────────────────────────────
setInterval(() => {
  const now = Date.now();
  requests.forEach(r => {
    if (r.status !== 'pending') return;
    const age = now - new Date(r.ts).getTime();
    if (age > 60000 && r.priority !== 'CRITICAL') {
      const oldPriority = r.priority;
      r.priority = r.priority === 'MEDIUM' ? 'HIGH' : 'CRITICAL';
      r.score += 25;
      broadcast('requestUpdate', r);
      addComms('system', `⬆ Auto-escalated ${r.id}: ${oldPriority} → ${r.priority} (unassigned for ${Math.round(age / 1000)}s)`);
    }
  });
}, 15000);

// ── Routes ───────────────────────────────────────────────────────────────────

// SSE stream
app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type',  'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection',    'keep-alive');
  res.flushHeaders();
  res.write(`event: init\ndata: ${JSON.stringify({ requests, ngos, commsLog, smsLog })}\n\n`);
  sseClients.push(res);
  req.on('close', () => { sseClients = sseClients.filter(c => c !== res); });
});

// GET state
app.get('/api/requests', (_req, res) => res.json(requests));
app.get('/api/ngos',     (_req, res) => res.json(ngos));
app.get('/api/comms',    (_req, res) => res.json(commsLog));
app.get('/api/sms-log',  (_req, res) => res.json(smsLog));

// GET stats
app.get('/api/stats', (_req, res) => {
  const active = requests.filter(r => r.status !== 'completed');
  const completed = requests.filter(r => r.status === 'completed');
  const totalPeople = requests.reduce((s, r) => s + r.people, 0);
  const helpedPeople = completed.reduce((s, r) => s + r.people, 0);

  let avgResponseMs = 0;
  if (completed.length > 0) {
    const totalMs = completed.reduce((s, r) => {
      if (!r.completedAt) return s;
      return s + (new Date(r.completedAt).getTime() - new Date(r.ts).getTime());
    }, 0);
    avgResponseMs = totalMs / completed.length;
  }

  const byType = {};
  requests.forEach(r => { byType[r.type] = (byType[r.type] || 0) + 1; });

  const byPriority = {};
  active.forEach(r => { byPriority[r.priority] = (byPriority[r.priority] || 0) + 1; });

  const totalCap = ngos.reduce((s, n) => s + n.capacity, 0);
  const usedCap  = ngos.reduce((s, n) => s + n.used, 0);

  res.json({
    totalRequests: requests.length,
    activeRequests: active.length,
    completedRequests: completed.length,
    totalPeople,
    helpedPeople,
    avgResponseMs: Math.round(avgResponseMs),
    byType,
    byPriority,
    ngoCapacity: { total: totalCap, used: usedCap },
    smsTriggers: smsLog.length,
  });
});

// ── POST /api/sos (form submission) ──────────────────────────────────────────
app.post('/api/sos', async (req, res) => {
  const { loc, type, people, description } = req.body;
  if (!loc || !type || !people) return res.status(400).json({ error: 'Missing fields' });
  const request = await processSOSRequest({ loc, type, people: parseInt(people), description, source: 'form' });
  res.json(request);
});

// ── POST /api/sms-trigger (Twilio webhook compatible) ────────────────────────
// Twilio sends: Body, From, To fields
// Can also be called manually with just { body: "SOS ..." }
app.post('/api/sms-trigger', async (req, res) => {
  // Support both Twilio webhook format (Body/From/To) and manual test format
  const rawBody = req.body.Body || req.body.body || req.body.message || '';
  const from    = req.body.From || req.body.from || 'unknown';
  const to      = req.body.To   || req.body.to   || '';

  const logEntry = {
    id: uuidv4(),
    ts: new Date().toISOString(),
    from,
    to,
    rawBody,
    status: 'received',
    reqId: null,
    error: null,
  };

  if (!rawBody.trim()) {
    logEntry.status = 'error';
    logEntry.error  = 'Empty message body';
    smsLog.unshift(logEntry);
    broadcast('smsLog', logEntry);
    // Twilio expects TwiML response
    res.set('Content-Type', 'text/xml');
    return res.send(`<?xml version="1.0" encoding="UTF-8"?><Response><Message>❌ Invalid SOS format. Send: SOS [location] [type] [people] [description]</Message></Response>`);
  }

  const parsed = parseSMS(rawBody);
  if (!parsed) {
    logEntry.status = 'ignored';
    logEntry.error  = 'Message does not start with SOS';
    smsLog.unshift(logEntry);
    broadcast('smsLog', logEntry);
    res.set('Content-Type', 'text/xml');
    return res.send(`<?xml version="1.0" encoding="UTF-8"?><Response><Message>Not an SOS request. Send: SOS [location] [type] [people] [description]</Message></Response>`);
  }

  try {
    const request = await processSOSRequest({ ...parsed, source: 'sms' });
    logEntry.status = 'processed';
    logEntry.reqId  = request.id;
    logEntry.parsed = parsed;
    smsLog.unshift(logEntry);
    if (smsLog.length > 200) smsLog.pop();
    broadcast('smsLog', logEntry);

    // TwiML response back to sender
    res.set('Content-Type', 'text/xml');
    res.send(`<?xml version="1.0" encoding="UTF-8"?><Response><Message>✅ SOS Received! ID: ${request.id} | Priority: ${request.priority} | Help dispatched. Stay safe.</Message></Response>`);
  } catch (err) {
    logEntry.status = 'error';
    logEntry.error  = err.message;
    smsLog.unshift(logEntry);
    broadcast('smsLog', logEntry);
    res.set('Content-Type', 'text/xml');
    res.send(`<?xml version="1.0" encoding="UTF-8"?><Response><Message>❌ System error processing your SOS. Please call emergency services.</Message></Response>`);
  }
});

// ── NGO CRUD & AUTH ──────────────────────────────────────────────────────────

// POST NGO login
app.post('/api/ngos/login', (req, res) => {
  const { name, password } = req.body;
  const ngo = ngos.find(n => n.name.toLowerCase() === name.toLowerCase());
  if (ngo && (!ngo.password || ngo.password === password)) {
    return res.json({ success: true, ngo });
  }
  return res.status(401).json({ success: false, message: 'Invalid credentials' });
});

// POST NGO register
app.post('/api/ngos/register', async (req, res) => {
  const { name, password, location, lat, lng, capacity, resources, phone, specialization } = req.body;
  if (!name || !capacity || !resources) return res.status(400).json({ success: false, message: 'Missing fields' });
  
  let finalLat = parseFloat(lat);
  let finalLng = parseFloat(lng);
  if (location && (!finalLat || !finalLng)) {
    const coords = await geocode(location);
    finalLat = coords[0];
    finalLng = coords[1];
  } else if (!finalLat || !finalLng) {
    finalLat = 12.9716;
    finalLng = 77.5946;
  }

  const id = `N${Date.now()}`;
  const ngo = {
    id, name, password,
    lat: finalLat, lng: finalLng,
    capacity: parseInt(capacity, 10),
    used: 0,
    resources: Array.isArray(resources) ? resources : resources.split(',').map(r => r.trim()),
    color: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`,
    status: 'idle', phone: phone || '', specialization: specialization || ''
  };
  ngos.push(ngo);
  broadcast('ngoUpdate', ngos);
  addComms('system', `➕ New NGO registered: ${name}`);
  res.json({ success: true, ngo });
});

// PATCH update NGO stock
app.patch('/api/ngos/:id/stock', (req, res) => {
  const ngo = ngos.find(n => n.id === req.params.id);
  if (!ngo) return res.status(404).json({ success: false, message: 'NGO not found' });
  const { addCapacity } = req.body;
  if (addCapacity) ngo.capacity += parseInt(addCapacity, 10);
  broadcast('ngoUpdate', ngos);
  addComms('system', `📦 NGO ${ngo.name} restocked capacity (+${addCapacity})`);
  res.json({ success: true, ngo });
});

// POST add single NGO
app.post('/api/ngos', (req, res) => {
  const { name, lat, lng, capacity, resources, phone, specialization, color } = req.body;
  if (!name || !capacity || !resources) return res.status(400).json({ error: 'Missing required fields: name, capacity, resources' });

  const id = `N${Date.now()}`;
  const ngo = {
    id,
    name,
    lat:            parseFloat(lat) || 12.9716,
    lng:            parseFloat(lng) || 77.5946,
    capacity:       parseInt(capacity, 10),
    used:           0,
    resources:      Array.isArray(resources) ? resources : resources.split(',').map(r => r.trim()),
    color:          color || `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`,
    status:         'idle',
    phone:          phone || '',
    specialization: specialization || '',
  };

  ngos.push(ngo);
  broadcast('ngoUpdate', ngos);
  addComms('system', `➕ New NGO registered: ${name} (cap: ${capacity}, resources: ${ngo.resources.join(', ')})`);
  res.json(ngo);
});

// POST bulk insert NGOs (array)
app.post('/api/ngos/bulk', (req, res) => {
  const list = req.body; // array of NGO objects
  if (!Array.isArray(list) || !list.length) return res.status(400).json({ error: 'Send an array of NGO objects' });

  const added = [];
  for (const item of list) {
    const { name, lat, lng, capacity, resources, phone, specialization, color } = item;
    if (!name || !capacity || !resources) continue;
    const id = `N${Date.now()}_${Math.random().toString(36).slice(2,6)}`;
    const ngo = {
      id,
      name,
      lat:            parseFloat(lat) || 12.9716,
      lng:            parseFloat(lng) || 77.5946,
      capacity:       parseInt(capacity, 10),
      used:           0,
      resources:      Array.isArray(resources) ? resources : resources.split(',').map(r => r.trim()),
      color:          color || `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`,
      status:         'idle',
      phone:          phone || '',
      specialization: specialization || '',
    };
    ngos.push(ngo);
    added.push(ngo);
  }

  broadcast('ngoUpdate', ngos);
  addComms('system', `➕ Bulk import: ${added.length} NGOs added to network`);
  res.json({ added: added.length, ngos: added });
});

// PUT update NGO
app.put('/api/ngos/:id', (req, res) => {
  const ngo = ngos.find(n => n.id === req.params.id);
  if (!ngo) return res.status(404).json({ error: 'NGO not found' });
  const { name, lat, lng, capacity, resources, phone, specialization, color } = req.body;
  if (name)           ngo.name           = name;
  if (lat)            ngo.lat            = parseFloat(lat);
  if (lng)            ngo.lng            = parseFloat(lng);
  if (capacity)       ngo.capacity       = parseInt(capacity, 10);
  if (resources)      ngo.resources      = Array.isArray(resources) ? resources : resources.split(',').map(r => r.trim());
  if (phone)          ngo.phone          = phone;
  if (specialization) ngo.specialization = specialization;
  if (color)          ngo.color          = color;
  broadcast('ngoUpdate', ngos);
  addComms('system', `✏️ NGO updated: ${ngo.name}`);
  res.json(ngo);
});

// DELETE NGO
app.delete('/api/ngos/:id', (req, res) => {
  const idx = ngos.findIndex(n => n.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'NGO not found' });
  const [removed] = ngos.splice(idx, 1);
  broadcast('ngoUpdate', ngos);
  addComms('system', `🗑 NGO removed: ${removed.name}`);
  res.json({ ok: true, removed: removed.name });
});

// ── Delete All Data ───────────────────────────────────────────────────────────

// DELETE all requests
app.delete('/api/requests', (_req, res) => {
  const count = requests.length;
  requests = [];
  broadcast('init', { requests, ngos, commsLog, smsLog });
  addComms('system', `🗑 All ${count} requests deleted by operator.`);
  res.json({ ok: true, deleted: count });
});

// DELETE all NGOs
app.delete('/api/ngos', (_req, res) => {
  const count = ngos.length;
  ngos = [];
  broadcast('ngoUpdate', ngos);
  addComms('system', `🗑 All ${count} NGOs removed by operator.`);
  res.json({ ok: true, deleted: count });
});

// DELETE all comms log
app.delete('/api/comms', (_req, res) => {
  const count = commsLog.length;
  commsLog = [];
  broadcast('commsCleared', {});
  res.json({ ok: true, deleted: count });
});

// DELETE all SMS log
app.delete('/api/sms-log', (_req, res) => {
  const count = smsLog.length;
  smsLog = [];
  broadcast('smsLogCleared', {});
  res.json({ ok: true, deleted: count });
});

// POST full reset (existing + seeds NGOs back)
app.post('/api/reset', (_req, res) => {
  requests = [];
  ngos     = JSON.parse(JSON.stringify(NGO_SEED));
  commsLog = [];
  smsLog   = [];
  broadcast('init', { requests, ngos, commsLog, smsLog });
  res.json({ ok: true });
});

// POST nuclear reset — wipes everything including NGOs
app.post('/api/reset/all', (_req, res) => {
  requests = [];
  ngos     = [];
  commsLog = [];
  smsLog   = [];
  broadcast('init', { requests, ngos, commsLog, smsLog });
  res.json({ ok: true });
});

// POST accept request
app.post('/api/requests/:id/accept', (req, res) => {
  const r = requests.find(x => x.id === req.params.id);
  if (!r) return res.status(404).json({ error: 'Request not found' });
  const { ngoId, eta } = req.body;
  const ngo = ngos.find(n => n.id === ngoId);
  if (!ngo) return res.status(404).json({ error: 'NGO not found' });

  const assignedData = r.assigned.find(a => a.id === ngoId);
  const count = assignedData ? assignedData.assignedCount : r.people;

  ngo.used = Math.min(ngo.capacity, ngo.used + count);
  ngo.status = 'busy';

  r.status = 'in-progress';
  r.eta = parseInt(eta, 10) || 5;

  broadcast('requestUpdate', r);
  broadcast('ngoUpdate', ngos);

  addComms('to-user', `📱 → User [${r.id}]: Help is on the way! ${ngo.name} dispatched. ETA ~${r.eta} mins.`);
  addComms('system', `✅ NGO [${ngo.name}] accepted dispatch for ${r.id}`);
  
  startTracking(r, assignedData || ngo);
  res.json(r);
});

// POST forward request
app.post('/api/requests/:id/forward', (req, res) => {
  const r = requests.find(x => x.id === req.params.id);
  if (!r) return res.status(404).json({ error: 'Request not found' });
  const { ngoId } = req.body;
  const ngo = ngos.find(n => n.id === ngoId);
  if (ngo) {
    if (!r.rejectedBy) r.rejectedBy = [];
    r.rejectedBy.push(ngo.id);
    addComms('system', `⏭ NGO [${ngo.name}] forwarded request ${r.id}`);
  }

  // Re-allocate
  const alloc = allocateNGOs(r, ngos, r.rejectedBy);
  if (alloc.length) {
    triggerAllocation(r, alloc);
  } else {
    r.status = 'pending';
    r.assigned = [];
    broadcast('requestUpdate', r);
    addComms('system', `⚠️ No other NGOs available for ${r.id}. Request returned to queue.`);
  }
  
  res.json(r);
});

// PATCH status override (manual)
app.patch('/api/requests/:id', (req, res) => {
  const r = requests.find(x => x.id === req.params.id);
  if (!r) return res.status(404).json({ error: 'Not found' });
  Object.assign(r, req.body);
  broadcast('requestUpdate', r);
  res.json(r);
});

// React catch-all (must be after all API routes)
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🚨 CRISIS GRID SERVER running on http://localhost:${PORT}\n`);
  console.log(`📱 SMS Webhook endpoint: POST http://localhost:${PORT}/api/sms-trigger`);
  console.log(`   Format: Body=SOS [location] [type] [people] [description]`);
  console.log(`   Compatible with Twilio webhooks\n`);
});
