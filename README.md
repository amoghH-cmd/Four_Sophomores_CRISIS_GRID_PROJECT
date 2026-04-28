# 🚨 CRISIS GRID — AI-Powered Disaster Response System

A full-stack MVP for real-time disaster response coordination. Collects SOS requests, scores priority, assigns NGOs intelligently, and tracks field teams live on a map.

---

## 🗂 Project Structure

```
crisis-grid/
├── server/               # Node.js + Express backend
│   ├── index.js          # Main server, routes, SSE, tracking simulation
│   ├── algorithms.js     # Priority scoring + smart NGO allocation
│   ├── data.js           # NGO seed data
│   └── package.json
├── client/               # React frontend
│   ├── src/
│   │   ├── App.js
│   │   ├── hooks/
│   │   │   └── useDisasterStore.js   # SSE + API state management
│   │   ├── components/
│   │   │   ├── Header.jsx
│   │   │   ├── SOSForm.jsx           # SMS simulation form
│   │   │   ├── RequestList.jsx       # Live request list with priority badges
│   │   │   ├── DisasterMap.jsx       # Leaflet map with markers + tracking
│   │   │   ├── NGOPanel.jsx          # NGO network + capacity bars
│   │   │   ├── CommsLog.jsx          # Real-time comms messages
│   │   │   └── RequestDetail.jsx     # Click-through detail modal
│   │   └── utils/helpers.js
│   └── package.json
└── package.json          # Root: runs both with `concurrently`
```

---

## ⚡ Quick Start

### Prerequisites
- Node.js >= 16
- npm >= 8

### 1. Install dependencies

```bash
# From project root
npm run install:all
```

Or manually:
```bash
cd server && npm install
cd ../client && npm install
```

### 2. Run both server + client together

```bash
# From project root
npm install          # installs concurrently
npm run dev
```

- **Server** → http://localhost:3001
- **Client** → http://localhost:3000

### 3. Or run separately

```bash
# Terminal 1
cd server && npm run dev

# Terminal 2
cd client && npm start
```

---

## 🧠 Intelligence Layer

### Priority Scoring (`server/algorithms.js`)
Keywords in the description are matched against a weighted table:
| Keyword | Score |
|---------|-------|
| dying   | 40    |
| unconscious | 35 |
| trapped / injured / bleeding | 30 |
| fire / critical | 25 |
| flood / collapsed | 20–25 |
| starving / urgent | 15–20 |

People count adds up to 40 extra points for 50+ people.

**Output:** `CRITICAL` (≥50) · `HIGH` (≥25) · `MEDIUM` (<25)

### Smart Allocation Formula
```
Score = urgencyWeight - (2 × distanceKm) + (0.5 × availableCapacity)
```
Where urgencyWeight = 100 (CRITICAL), 60 (HIGH), 30 (MEDIUM).

NGOs are ranked by score. If the top NGO can't serve all people, the request is **split** across multiple NGOs.

---

## 🗺 Features

| Feature | Description |
|---------|-------------|
| **SOS Form** | Simulated SMS input with location, type, people, description |
| **Priority Scoring** | Keyword + crowd-size analysis → CRITICAL / HIGH / MEDIUM |
| **Smart NGO Allocation** | Distance + capacity + urgency scoring, with request splitting |
| **Live Map** | Leaflet + CartoDB dark tiles, color-coded markers |
| **Vehicle Tracking** | Animated vehicle from NGO → incident, ETA countdown |
| **Hotspot Detection** | Highlights cluster areas (2+ requests within 1km) |
| **Duplicate Detection** | Flags same-type requests within 500m |
| **SSE Real-time** | Server-Sent Events push all updates to connected clients |
| **Comms Log** | Simulated SMS to user + dispatch orders to NGOs |
| **Request Detail** | Full modal with alloc score, NGO info, coordinates |
| **Demo Presets** | 3 pre-filled scenarios for quick testing |
| **Reset** | One-click reset of all state |

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/events` | SSE stream (requests, NGOs, tracking, comms) |
| GET | `/api/requests` | All requests |
| GET | `/api/ngos` | All NGOs + current capacity |
| GET | `/api/comms` | Communications log |
| POST | `/api/sos` | Submit new SOS request |
| PATCH | `/api/requests/:id` | Update request status |
| POST | `/api/reset` | Reset all state |

### POST /api/sos body
```json
{
  "loc": "Koramangala, Bengaluru",
  "type": "medical",
  "people": 12,
  "description": "injured, trapped, urgent help needed"
}
```

---

## 🎮 Demo Walkthrough

1. Open http://localhost:3000
2. Click **Demo 1 / Demo 2 / Demo 3** to load preset scenarios
3. Hit **⚡ SEND SOS REQUEST** — watch the map, request list, NGO bars, and comms log update in real-time
4. The animated 🚑 vehicle travels from the NGO base to the incident on the map
5. ETA counts down live in the request card
6. Click any request card or map marker for full detail
7. After ~25s on-site, the request auto-completes and NGO capacity is freed
8. Hit **↺ RESET ALL** to start fresh

---

## 🏗 Extending

- **Real SMS**: Replace `/api/sos` with a Twilio webhook
- **Real geocoding**: Swap `geocode()` in `server/index.js` for Google Maps / Nominatim API
- **Persistence**: Replace in-memory arrays with MongoDB or PostgreSQL
- **Auth**: Add JWT middleware to Express routes
- **More NGOs**: Edit `server/data.js` — changes reflect immediately on next server start
