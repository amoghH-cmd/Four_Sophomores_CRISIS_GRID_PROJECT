// ── Priority Scoring ────────────────────────────────────────────────────────
const KEYWORD_SCORES = {
  trapped: 30, injured: 30, critical: 25, dying: 40,
  flood: 20, fire: 25, bleeding: 30, unconscious: 35,
  collapsed: 25, stranded: 20, 'no food': 15, starving: 20,
  urgent: 15, help: 5, crush: 28, drowning: 35, buried: 32,
};

function calcPriority(description = '', people = 1) {
  let score = 0;
  const d = description.toLowerCase();

  for (const [kw, pts] of Object.entries(KEYWORD_SCORES)) {
    if (d.includes(kw)) score += pts;
  }

  if (people >= 50)      score += 40;
  else if (people >= 20) score += 25;
  else if (people >= 10) score += 15;
  else if (people >= 5)  score += 8;

  const priority = score >= 50 ? 'CRITICAL' : score >= 25 ? 'HIGH' : 'MEDIUM';
  return { score, priority };
}

// ── Haversine Distance (km) ──────────────────────────────────────────────────
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Smart NGO Allocation ─────────────────────────────────────────────────────
// Score = (urgencyWeight * priority) - (distWeight * dist) + (capWeight * availCap)
const URGENCY_WEIGHT = { CRITICAL: 100, HIGH: 60, MEDIUM: 30 };
const DIST_WEIGHT    = 2;
const CAP_WEIGHT     = 0.5;

function allocateNGOs(request, ngos, rejectedBy = []) {
  const urgencyW = URGENCY_WEIGHT[request.priority] || 30;

  const eligible = ngos
    .filter(n => !rejectedBy.includes(n.id) && n.resources.includes(request.type) && n.used < n.capacity)
    .map(n => {
      const dist  = haversine(request.lat, request.lng, n.lat, n.lng);
      const avail = n.capacity - n.used;
      const score = urgencyW - DIST_WEIGHT * dist + CAP_WEIGHT * avail;
      return { ...n, dist: parseFloat(dist.toFixed(2)), allocScore: parseFloat(score.toFixed(1)) };
    })
    .sort((a, b) => b.allocScore - a.allocScore);

  if (!eligible.length) return [];

  // Split request across NGOs if needed
  let remaining = request.people;
  const assigned = [];
  for (const n of eligible) {
    if (remaining <= 0) break;
    const avail = n.capacity - n.used;
    const give  = Math.min(avail, remaining);
    assigned.push({ ...n, assignedCount: give });
    remaining -= give;
  }
  return assigned;
}

// ── Duplicate & Hotspot Detection ────────────────────────────────────────────
function isDuplicate(lat, lng, type, existingRequests) {
  return existingRequests.some(
    r => r.type === type &&
         r.status !== 'completed' &&
         haversine(lat, lng, r.lat, r.lng) < 0.5
  );
}

function findNearby(lat, lng, existingRequests, radiusKm = 1.0) {
  return existingRequests.filter(
    r => r.status !== 'completed' && haversine(lat, lng, r.lat, r.lng) < radiusKm
  );
}

module.exports = { calcPriority, allocateNGOs, isDuplicate, findNearby, haversine };
