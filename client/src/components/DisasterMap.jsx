import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { PRIORITY_COLORS, TYPE_ICONS } from '../utils/helpers';

const CENTER = [12.9716, 77.5946];

function makeReqIcon(priority, type, isHotspot) {
  const color = PRIORITY_COLORS[priority] || '#ffd600';
  const icon  = TYPE_ICONS[type] || '📍';
  
  const hotspotStyles = isHotspot ? `
    border: 2px solid #ff3030;
    box-shadow: 0 0 25px #ff3030, inset 0 0 10px #ff3030;
    animation: reqPulse 1s ease-in-out infinite;
  ` : `
    border: 1.5px solid ${color};
    box-shadow: 0 0 14px ${color}55, inset 0 0 8px ${color}15;
    animation: reqPulse 2s ease-in-out infinite;
  `;

  return L.divIcon({
    className: '',
    html: `<div style="
      width:38px;height:38px;border-radius:10px;
      background:${color}18;
      ${hotspotStyles}
      display:flex;align-items:center;justify-content:center;
      font-size:17px;
      backdrop-filter:blur(4px);
    ">
      ${icon}
      ${isHotspot ? `<div style="position:absolute; top:-16px; left:-35px; width:108px; text-align:center; color:#fff; font-size:8px; font-weight:bold; font-family:monospace; background:#ff3030; border-radius:4px; padding:2px;">🚨 URGENT ACTION NEEDED</div>` : ''}
    </div>`,
    iconSize: [38, 38], iconAnchor: [19, 19],
  });
}

function makeNGOIcon(color, name) {
  const initials = name.split(' ').slice(0, 2).map(w => w[0]).join('');
  return L.divIcon({
    className: '',
    html: `<div style="
      width:32px;height:32px;border-radius:50%;
      background:${color};
      border:2px solid rgba(255,255,255,.85);
      display:flex;align-items:center;justify-content:center;
      font-size:10px;font-weight:700;color:#000;
      font-family:'JetBrains Mono','Space Mono',monospace;
      box-shadow:0 0 12px ${color}88, 0 2px 8px rgba(0,0,0,.3);
    ">${initials}</div>`,
    iconSize: [32, 32], iconAnchor: [16, 16],
  });
}

function makeVehicleIcon(color) {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:24px;height:24px;border-radius:50%;
      background:${color};border:2px solid #fff;
      box-shadow:0 0 10px ${color}, 0 0 20px ${color}66;
      display:flex;align-items:center;justify-content:center;
      font-size:12px;
      animation:pulse 1s ease-in-out infinite;
    ">🚑</div>`,
    iconSize: [24, 24], iconAnchor: [12, 12],
  });
}

export default function DisasterMap({ requests, ngos, tracking, onSelectRequest }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const reqMarkersRef = useRef({});
  const ngoMarkersRef = useRef({});
  const vehiclesRef = useRef({});
  const trackLinesRef = useRef({});
  const hotspotCircles = useRef({});

  useEffect(() => {
    if (mapInstance.current) return;
    const m = L.map(mapRef.current, { zoomControl: true, preferCanvas: true })
      .setView(CENTER, 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors', maxZoom: 19,
    }).addTo(m);
    mapInstance.current = m;
  }, []);

  useEffect(() => {
    const m = mapInstance.current;
    if (!m) return;
    ngos.forEach(n => {
      const icon = makeNGOIcon(n.color, n.name);
      const tip = `<b>${n.name}</b><br>Free: ${n.capacity - n.used}/${n.capacity}<br>Resources: ${n.resources.join(', ')}<br>Status: ${n.status}`;
      if (ngoMarkersRef.current[n.id]) {
        ngoMarkersRef.current[n.id].setIcon(icon);
        ngoMarkersRef.current[n.id].setTooltipContent(tip);
      } else {
        const marker = L.marker([n.lat, n.lng], { icon }).addTo(m).bindTooltip(tip);
        ngoMarkersRef.current[n.id] = marker;
      }
    });
  }, [ngos]);

  useEffect(() => {
    const m = mapInstance.current;
    if (!m) return;
    const activeIds = new Set();
    requests.forEach(r => {
      if (r.status === 'completed') return;
      activeIds.add(r.id);
      const isHotspot = r.nearbyCount > 1;
      const icon = makeReqIcon(r.priority, r.type, isHotspot);
      const tooltip = `<b>${r.id}</b><br>${r.priority} · ${r.type}<br>${r.people} people<br>Status: ${r.status}${isHotspot ? '<br><b style="color:#ff3030">🚨 URGENT ACTION NEEDED</b>' : ''}`;
      if (reqMarkersRef.current[r.id]) {
        reqMarkersRef.current[r.id].setIcon(icon);
        reqMarkersRef.current[r.id].setTooltipContent(tooltip);
      } else {
        const marker = L.marker([r.lat, r.lng], { icon }).addTo(m).bindTooltip(tooltip)
          .on('click', () => onSelectRequest(r.id));
        reqMarkersRef.current[r.id] = marker;
      }
      if (r.nearbyCount > 1 && !hotspotCircles.current[r.id]) {
        const c = L.circle([r.lat, r.lng], {
          radius: 2000, color: '#ff3030', fillColor: '#ff3030',
          fillOpacity: 0.06, weight: 1, dashArray: '6 4',
        }).addTo(m);
        hotspotCircles.current[r.id] = c;
      }
    });
    Object.keys(reqMarkersRef.current).forEach(id => {
      if (!activeIds.has(id)) {
        m.removeLayer(reqMarkersRef.current[id]);
        delete reqMarkersRef.current[id];
        if (hotspotCircles.current[id]) {
          m.removeLayer(hotspotCircles.current[id]);
          delete hotspotCircles.current[id];
        }
      }
    });
  }, [requests, onSelectRequest]);

  useEffect(() => {
    const m = mapInstance.current;
    if (!m) return;
    Object.entries(tracking).forEach(([reqId, t]) => {
      const req = requests.find(r => r.id === reqId);
      const ngo = ngos.find(n => n.id === t.ngoId);
      if (!req || !ngo) return;
      if (!vehiclesRef.current[reqId]) {
        vehiclesRef.current[reqId] = L.marker([t.lat, t.lng], { icon: makeVehicleIcon(ngo.color) }).addTo(m);
      } else {
        vehiclesRef.current[reqId].setLatLng([t.lat, t.lng]);
      }
      if (!trackLinesRef.current[reqId]) {
        trackLinesRef.current[reqId] = L.polyline(
          [[ngo.lat, ngo.lng], [req.lat, req.lng]],
          { color: ngo.color, weight: 2, dashArray: '6 4', opacity: 0.5 }
        ).addTo(m);
      }
      if (t.progress >= 1) {
        if (vehiclesRef.current[reqId]) { m.removeLayer(vehiclesRef.current[reqId]); delete vehiclesRef.current[reqId]; }
        if (trackLinesRef.current[reqId]) { m.removeLayer(trackLinesRef.current[reqId]); delete trackLinesRef.current[reqId]; }
      }
    });
  }, [tracking, requests, ngos]);

  return (
    <div style={{ flex:1, position:'relative', overflow:'hidden' }}>
      <div ref={mapRef} style={{ width:'100%', height:'100%' }} />
      {/* Scanline overlay */}
      <div style={styles.scanOverlay} />
      {/* Corner brackets */}
      <div style={{ ...styles.bracket, top:12, left:12 }}>┌</div>
      <div style={{ ...styles.bracket, top:12, right:12 }}>┐</div>
      <div style={{ ...styles.bracket, bottom:12, left:12 }}>└</div>
      <div style={{ ...styles.bracket, bottom:12, right:12 }}>┘</div>
      <MapLegend />
    </div>
  );
}

function MapLegend() {
  return (
    <div style={styles.legend}>
      <div style={styles.legendTitle}>LEGEND</div>
      {[
        ['#ff3030', 'CRITICAL'],
        ['#ff8c00', 'HIGH'],
        ['#ffd600', 'MEDIUM'],
        ['#4fc3f7', 'NGO Base'],
        ['#00e676', 'Vehicle'],
      ].map(([c, l]) => (
        <div key={l} style={{ display:'flex', alignItems:'center', gap:7, marginBottom:3 }}>
          <div style={{ width:8, height:8, borderRadius:'50%', background:c, boxShadow:`0 0 6px ${c}88` }} />
          <span style={{ color:'#9aa0b8', fontSize:10 }}>{l}</span>
        </div>
      ))}
    </div>
  );
}

const styles = {
  scanOverlay: {
    position:'absolute', top:0, left:0, right:0, bottom:0,
    pointerEvents:'none', zIndex:800,
    background:'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,230,118,.012) 2px, rgba(0,230,118,.012) 4px)',
  },
  bracket: {
    position:'absolute', zIndex:850,
    fontFamily:"var(--font-mono)",
    fontSize:20, color:'rgba(79,195,247,.25)',
    pointerEvents:'none',
  },
  legend: {
    position:'absolute', bottom:20, left:12, zIndex:900,
    background:'rgba(17,22,34,.88)', border:'1px solid rgba(38,46,68,.6)',
    borderRadius:10, padding:'10px 14px',
    fontFamily:"var(--font-mono)",
    backdropFilter:'blur(12px)',
  },
  legendTitle: {
    fontSize:9, color:'#6b7394', letterSpacing:1.5,
    marginBottom:6, paddingBottom:4,
    borderBottom:'1px solid rgba(38,46,68,.5)',
  },
};
