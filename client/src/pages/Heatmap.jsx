import { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Activity, Zap, Globe, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import 'leaflet/dist/leaflet.css';

const INDIA_CENTER = [20.5937, 78.9629];
const INITIAL_ZOOM = 5;

const SEVERITY_CONFIG = {
  critical: { color: '#ff1744', radius: 10, opacity: 0.9, label: 'CRITICAL' },
  high: { color: '#ff5722', radius: 8, opacity: 0.8, label: 'HIGH' },
  medium: { color: '#ff9800', radius: 6, opacity: 0.7, label: 'MEDIUM' },
  low: { color: '#4caf50', radius: 4, opacity: 0.6, label: 'LOW' },
};

const THREAT_TYPES = [
  { type: 'DDoS Attack', color: '#ff1744', icon: Zap },
  { type: 'Phishing', color: '#ff5722', icon: Shield },
  { type: 'SQL Injection', color: '#ff9800', icon: Activity },
  { type: 'Brute Force', color: '#9c27b0', icon: Lock },
  { type: 'Malware Spreading', color: '#4caf50', icon: Globe },
];

const INTERNATIONAL_SOURCES = [
  { name: 'Russia', lat: 61.524, lng: 105.318 },
  { name: 'China', lat: 35.861, lng: 104.195 },
  { name: 'USA', lat: 37.090, lng: -95.712 },
  { name: 'North Korea', lat: 40.339, lng: 127.510 },
  { name: 'Unknown Host', lat: 0, lng: 0 },
];

const INDIAN_CITIES = [
  { name: 'Mumbai', lat: 19.076, lng: 72.877 },
  { name: 'Delhi', lat: 28.679, lng: 77.069 },
  { name: 'Bengaluru', lat: 12.971, lng: 77.594 },
  { name: 'Hyderabad', lat: 17.385, lng: 78.486 },
  { name: 'Chennai', lat: 13.083, lng: 80.270 },
  { name: 'Kolkata', lat: 22.573, lng: 88.364 },
];

function RadarOverlay() {
  return <div className="radar-overlay" />;
}

function LiveLog({ logs, t }) {
  return (
    <div className="war-room-panel" style={{ height: '300px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '10px 15px', borderBottom: '1px solid var(--border-glass)', background: 'rgba(0,212,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--color-cyan)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Activity size={14} /> {t('heatmap.panels.telemetry')}
        </span>
        <span className="animate-pulse" style={{ fontSize: '0.65rem', color: '#ff4444' }}>● {t('heatmap.panels.recording')}</span>
      </div>
      <div className="terminal-log">
        <AnimatePresence initial={false}>
          {logs.map((log) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="terminal-line"
              style={{ color: log.severity === 'critical' ? '#ff1744' : log.severity === 'high' ? '#ff5722' : 'var(--color-cyan)' }}
            >
              <span style={{ opacity: 0.5 }}>[{log.time}]</span> <strong>{log.type}</strong> from {log.source} ➔ {log.target}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function Heatmap() {
  const { t } = useTranslation();
  const [events, setEvents] = useState([]);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ total: 0, critical: 0, blocked: 0 });

  const addEvent = useCallback(() => {
    const source = INTERNATIONAL_SOURCES[Math.floor(Math.random() * INTERNATIONAL_SOURCES.length)];
    const target = INDIAN_CITIES[Math.floor(Math.random() * INDIAN_CITIES.length)];
    const threat = THREAT_TYPES[Math.floor(Math.random() * THREAT_TYPES.length)];
    const severity = ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)];
    const id = Date.now();

    const newEvent = {
      id,
      lat: target.lat + (Math.random() - 0.5) * 0.1,
      lng: target.lng + (Math.random() - 0.5) * 0.1,
      source: source.name,
      target: target.name,
      type: threat.type,
      severity,
      timestamp: new Date().toISOString(),
      victims: Math.floor(Math.random() * 10) + 1,
      animationPhase: Math.random() * Math.PI * 2
    };

    setEvents(prev => [newEvent, ...prev].slice(0, 50));
    setLogs(prev => [{
      id,
      time: new Date().toLocaleTimeString(),
      type: threat.type,
      source: source.name,
      target: target.name,
      severity
    }, ...prev].slice(0, 15));
    
    setStats(prev => ({
      total: prev.total + 1,
      critical: severity === 'critical' ? prev.critical + 1 : prev.critical,
      blocked: prev.blocked + (Math.random() > 0.7 ? 1 : 0)
    }));
  }, []);

  useEffect(() => {
    for(let i=0; i<10; i++) setTimeout(addEvent, i * 200);
    const interval = setInterval(addEvent, 3000);
    return () => clearInterval(interval);
  }, [addEvent]);

  return (
    <div className="container" style={{ padding: '40px 24px', position: 'relative', zIndex: 5 }}>
      <header style={{ textAlign: 'center', marginBottom: '40px' }}>
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="page-header">
          <span className="tag">Cyber War Room v2.0</span>
          <h1 className="gradient-text" style={{ fontSize: '3rem', fontWeight: '900', letterSpacing: '-1px' }}>
            {t('heatmap.title')}
          </h1>
          <p>{t('heatmap.subtitle')}</p>
        </motion.div>
      </header>

      <div className="grid-3" style={{ gridTemplateColumns: '1fr 3fr 1fr', gap: '24px' }}>
        <div className="flex flex-col gap-4">
          <div className="card card-glow-cyan" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '15px' }}>{t('heatmap.panels.health')}</h3>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Global Sensor Grid</span>
                <span className="text-green font-bold text-xs">ONLINE</span>
              </div>
              <div className="meter-track"><div className="meter-fill meter-safe" style={{ width: '94%' }} /></div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Neural Firewall</span>
                <span className="text-green font-bold text-xs">ACTIVE</span>
              </div>
              <div className="meter-track"><div className="meter-fill meter-safe" style={{ width: '88%' }} /></div>
            </div>
          </div>

          <div className="stat-card" style={{ borderLeft: '4px solid var(--color-danger)' }}>
            <span className="stat-label">{t('heatmap.panels.stats')}</span>
            <span className="stat-value text-danger">{stats.blocked.toLocaleString()}</span>
            <span className="stat-sub">Last 24 Hours</span>
          </div>
          
          <div className="stat-card" style={{ borderLeft: '4px solid var(--color-cyan)' }}>
            <span className="stat-label">{t('heatmap.panels.nodes')}</span>
            <span className="stat-value text-cyan">1,422</span>
            <span className="stat-sub">Across 28 States</span>
          </div>
        </div>

        <div style={{ position: 'relative', borderRadius: '24px', overflow: 'hidden', border: '1px solid var(--border-glass)', boxShadow: '0 0 50px rgba(0,0,0,0.5)', height: '600px' }}>
          <RadarOverlay />
          <MapContainer center={INDIA_CENTER} zoom={INITIAL_ZOOM} style={{ height: '100%', width: '100%', background: '#050a18' }} zoomControl={false}>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution='&copy; CARTO' />
            {events.map((event) => {
              const cfg = SEVERITY_CONFIG[event.severity] || SEVERITY_CONFIG.low;
              return (
                <CircleMarker key={event.id} center={[event.lat, event.lng]} radius={cfg.radius + Math.sin(Date.now() * 0.005 + event.animationPhase) * 2} fillColor={cfg.color} color={cfg.color} weight={1} opacity={0.8} fillOpacity={0.4}>
                  <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                    <div className="font-mono text-xs" style={{ background: '#000', color: '#fff', padding: '8px', borderRadius: '4px', border: `1px solid ${cfg.color}` }}>
                      <div style={{ color: cfg.color, fontWeight: 'bold', marginBottom: '4px' }}>{event.severity.toUpperCase()} ALERT</div>
                      <div>TYPE: {event.type}</div>
                      <div>TARGET: {event.target}</div>
                      <div>SOURCE: {event.source}</div>
                    </div>
                  </Tooltip>
                </CircleMarker>
              );
            })}
          </MapContainer>
          <div style={{ position: 'absolute', bottom: '20px', left: '20px', zIndex: 500, pointerEvents: 'none' }}>
            <div className="badge badge-danger animate-pulse" style={{ padding: '8px 12px' }}>
              LIVE {t('heatmap.panels.level')}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <LiveLog logs={logs} t={t} />
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '15px' }}>{t('heatmap.legend')}</h3>
            <div className="flex flex-col gap-3">
              {Object.entries(SEVERITY_CONFIG).map(([key, cfg]) => (
                <div key={key} className="flex items-center gap-3">
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: cfg.color, boxShadow: `0 0 10px ${cfg.color}` }} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>{cfg.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="stat-card" style={{ background: 'linear-gradient(135deg, rgba(0,212,255,0.1), transparent)' }}>
            <span className="stat-label">{t('heatmap.panels.active')}</span>
            <span className="stat-value text-cyan" style={{ fontSize: '1.5rem' }}>{events.length}</span>
          </div>
        </div>
      </div>
      <style>{`.leaflet-container { filter: brightness(0.8) contrast(1.2); } .leaflet-tooltip { background: transparent !important; border: none !important; box-shadow: none !important; }`}</style>
    </div>
  );
}
