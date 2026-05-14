import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const BACKEND_URL = 'http://localhost:5000';

const MiniChart = ({ data, label, maxValue = 100 }) => {
  if (!data || data.length === 0) return <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No data</div>;
  
  const recent = data.slice(-20);
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: '60px' }}>
        {recent.map((val, i) => {
          const height = (val / maxValue) * 100;
          const color = val > 85 ? '#ff4757' : val > 70 ? 'var(--color-saffron)' : 'var(--color-cyan)';
          return (
            <div
              key={i}
              style={{
                flex: 1,
                height: `${height}%`,
                background: color,
                borderRadius: '2px',
                minHeight: '2px',
                opacity: 0.7 + (i / recent.length) * 0.3
              }}
              title={`${val}%`}
            />
          );
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 4 }}>
        <span>0%</span>
        <span>{maxValue}%</span>
      </div>
    </div>
  );
};

export default function AdminDashboard() {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const [health, setHealth] = useState(null);
  const [history, setHistory] = useState([]);
  const [reports, setReports] = useState([]);
  const [adminStats, setAdminStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_URL = 'http://localhost:5000';

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const [healthRes, historyRes, reportsRes, statsRes] = await Promise.all([
          fetch(`${API_URL}/api/health`),
          fetch(`${API_URL}/api/health/history`),
          fetch(`${API_URL}/api/reports`),
          fetch(`${API_URL}/api/admin/stats`)
        ]);
        
        if (healthRes.ok) {
          const healthData = await healthRes.json();
          setHealth(healthData);
        }
        
        if (historyRes.ok) {
          const historyData = await historyRes.json();
          setHistory(historyData.history || []);
        }

        if (reportsRes.ok) {
          const reportsData = await reportsRes.json();
          setReports(reportsData);
        }

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setAdminStats(statsData);
        }
        
        setError(null);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  const getHealthColor = (status) => {
    switch (status) {
      case 'healthy': return 'var(--color-green)';
      case 'good': return 'var(--color-cyan)';
      case 'warning': return 'var(--color-saffron)';
      case 'critical': return '#ff4757';
      default: return 'var(--text-secondary)';
    }
  };

  const getHealthIcon = (status) => {
    switch (status) {
      case 'healthy': return '✅';
      case 'good': return '⚡';
      case 'warning': return '⚠️';
      case 'critical': return '🚨';
      default: return '❓';
    }
  };

  const stats = (health && adminStats) ? [
    { label: t('admin.totalUsers'), value: adminStats.totalUsers.toLocaleString(), icon: '👥', color: 'var(--color-cyan)' },
    { label: t('admin.activeThreats'), value: adminStats.activeThreats.toString(), icon: '⚠️', color: 'var(--color-saffron)' },
    { 
      label: t('admin.systemHealth'), 
      value: `${health.healthScore}%`, 
      icon: getHealthIcon(health.status), 
      color: getHealthColor(health.status),
      status: health.status
    },
    { label: t('admin.totalReports'), value: adminStats.totalReports.toString(), icon: '📋', color: 'var(--text-secondary)' },
  ] : null;

  const handleStatusUpdate = async (id, status) => {
    try {
      const res = await fetch(`${API_URL}/api/reports/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setReports(prev => prev.map(r => r.reportId === id ? { ...r, status } : r));
      }
    } catch (err) {
      console.error('Update failed:', err);
    }
  };

  return (
    <div className="container section">
      <div className="page-header" style={{ textAlign: 'left', marginBottom: 40 }}>
        <span className="tag" style={{ background: 'rgba(255, 71, 87, 0.1)', borderColor: 'rgba(255, 71, 87, 0.3)', color: '#ff4757' }}>
          🛡️ {t('admin.title')}
        </span>
        <h1 style={{ marginTop: 16 }}>{t('admin.system')} <span className="gradient-text">{t('admin.overview')}</span></h1>
        <p>{t('admin.description')}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24, marginBottom: 48 }}>
        {!stats ? (
          <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            {loading ? `⏳ ${t('common.loading')}` : `❌ ${error || 'Unable to load health data'}`}
          </div>
        ) : (
          stats.map((stat, i) => (
            <div key={i} className="card card-glow-purple" style={{ 
              padding: 24, 
              display: 'flex', 
              alignItems: 'center', 
              gap: 20,
              borderColor: stat.status === 'critical' ? 'rgba(255, 71, 87, 0.5)' : undefined,
              borderLeft: stat.status === 'critical' ? '3px solid #ff4757' : undefined
            }}>
              <div style={{ fontSize: '2.5rem' }}>{stat.icon}</div>
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 4 }}>{stat.label}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: stat.color }}>{stat.value}</div>
              </div>
            </div>
          ))
        )}
      </div>

      {health && health.metrics && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, marginBottom: 48 }}>
          <div className="card" style={{ padding: 24 }}>
            <h4 style={{ marginBottom: 16, color: 'var(--text-primary)' }}>💾 {t('admin.metrics.mem')}</h4>
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.9rem' }}>
                <span>{health.metrics.memory.used} MB</span>
                <span style={{ color: 'var(--text-muted)' }}>{health.metrics.memory.total} MB</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{
                  width: `${health.metrics.memory.percent}%`,
                  height: '100%',
                  background: health.metrics.memory.percent > 85 ? '#ff4757' : health.metrics.memory.percent > 70 ? 'var(--color-saffron)' : 'var(--color-cyan)',
                  transition: 'width 0.3s ease'
                }} />
              </div>
              <div style={{ marginTop: 8, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {health.metrics.memory.percent}% utilized
              </div>
            </div>
            <MiniChart data={history.map(h => h.memory)} label={t('admin.metrics.trend')} maxValue={100} />
          </div>

          <div className="card" style={{ padding: 24 }}>
            <h4 style={{ marginBottom: 16, color: 'var(--text-primary)' }}>⚙️ {t('admin.metrics.cpu')}</h4>
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.9rem' }}>
                <span>Load: {health.metrics.cpu.load}</span>
                <span style={{ color: 'var(--text-muted)' }}>Cores: {health.metrics.cpu.cores}</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{
                  width: `${health.metrics.cpu.percent}%`,
                  height: '100%',
                  background: health.metrics.cpu.percent > 85 ? '#ff4757' : health.metrics.cpu.percent > 70 ? 'var(--color-saffron)' : 'var(--color-purple)',
                  transition: 'width 0.3s ease'
                }} />
              </div>
              <div style={{ marginTop: 8, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {health.metrics.cpu.percent}% utilized
              </div>
            </div>
            <MiniChart data={history.map(h => h.cpu)} label={t('admin.metrics.trend')} maxValue={100} />
          </div>

          <div className="card" style={{ padding: 24 }}>
            <h4 style={{ marginBottom: 16, color: 'var(--text-primary)' }}>⏱️ {t('admin.metrics.status')}</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 4 }}>{t('admin.metrics.uptime')}</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{health.metrics.uptimeFormatted}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 4 }}>{t('admin.metrics.conn')}</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-cyan)' }}>{health.metrics.activeConnections}</div>
              </div>
            </div>
            <MiniChart data={history.map(h => h.connections)} label={t('admin.metrics.trend')} maxValue={Math.max(10, ...history.map(h => h.connections))} />
          </div>
        </div>
      )}

      <div className="grid">
        <div className="card" style={{ padding: 32 }}>
          <h3 style={{ marginBottom: 24 }}>{t('admin.recentReports')}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxHeight: '600px', overflowY: 'auto', paddingRight: '8px' }}>
            {reports.length > 0 ? reports.map(r => (
              <div key={r.reportId} style={{ padding: 20, background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid var(--border-glass)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span className="font-mono text-xs text-cyan">{r.reportId}</span>
                  <span className={`badge badge-${r.status === 'Verified' ? 'green' : r.status === 'Dismissed' ? 'muted' : 'saffron'}`}>{r.status}</span>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>{r.type}</div>
                  <div className="text-sm text-secondary">{r.description}</div>
                  <div className="text-xs text-muted" style={{ marginTop: 8 }}>📍 {r.city} • {r.platform} • {new Date(r.timestamp).toLocaleString()}</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {r.status === 'Submitted' && (
                    <>
                      <button onClick={() => handleStatusUpdate(r.reportId, 'Verified')} className="btn btn-primary btn-sm" style={{ background: 'var(--color-green)', border: 'none' }}>✅ {t('admin.verify')}</button>
                      <button onClick={() => handleStatusUpdate(r.reportId, 'Dismissed')} className="btn btn-secondary btn-sm">❌ {t('admin.dismiss')}</button>
                    </>
                  )}
                </div>
              </div>
            )) : (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>No reports found</div>
            )}
          </div>
        </div>

        <div className="card" style={{ padding: 32 }}>
          <h3 style={{ marginBottom: 24 }}>{t('admin.stats.userTrend')}</h3>
          {adminStats && adminStats.reportTrend && (
            <div style={{ marginBottom: 24 }}>
              <MiniChart data={adminStats.reportTrend.map(t => t.count)} label={t('admin.stats.reportTrend')} maxValue={Math.max(5, ...adminStats.reportTrend.map(t => t.count))} />
            </div>
          )}
          <h4 style={{ marginBottom: 16, fontSize: '0.9rem' }}>{t('admin.actions.title')}</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <button className="btn btn-secondary" style={{ padding: '20px', flexDirection: 'column', gap: 8 }}>
              <span>📢</span> {t('admin.actions.alert')}
            </button>
            <button className="btn btn-secondary" style={{ padding: '20px', flexDirection: 'column', gap: 8 }}>
              <span>🔒</span> {t('admin.actions.lock')}
            </button>
            <button className="btn btn-secondary" style={{ padding: '20px', flexDirection: 'column', gap: 8 }}>
              <span>📝</span> {t('admin.actions.rules')}
            </button>
            <button className="btn btn-secondary" style={{ padding: '20px', flexDirection: 'column', gap: 8 }}>
              <span>👤</span> {t('admin.actions.users')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
