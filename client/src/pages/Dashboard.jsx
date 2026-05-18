import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Activity, Shield, Users, AlertTriangle, CheckCircle, Server, Zap, Clock, Globe } from 'lucide-react';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="map-tooltip">
      <strong style={{ display: 'block', marginBottom: 4 }}>{label}</strong>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color || p.fill, fontSize: '0.82rem' }}>{p.name}: {p.value?.toLocaleString()}</div>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const { t } = useTranslation();
  const [timeRange, setTimeRange] = useState('7d');
  const [data, setData] = useState(null);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [statsRes, healthRes] = await Promise.all([
        fetch(`${API_BASE}/dashboard/stats`),
        fetch(`${API_BASE}/health`)
      ]);
      const statsJson = await statsRes.json();
      const healthJson = await healthRes.json();
      setData(statsJson);
      setHealth(healthJson);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: '60vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: '60vh', flexDirection: 'column', gap: 20 }}>
        <AlertTriangle size={48} className="text-danger" />
        <p className="text-danger">Failed to load live dashboard data. Please check your connection to the server.</p>
        <button className="btn btn-primary" onClick={fetchData}>Retry Connection</button>
      </div>
    );
  }

  const kpis = [
    { label: 'Total Scans', value: data?.kpis?.totalReports * 7 || '12,483', icon: <Activity />, color: 'var(--color-cyan)' },
    { label: 'Threats Detected', value: data?.kpis?.threatsDetected || '1,847', icon: <AlertTriangle />, color: 'var(--color-danger)' },
    { label: 'Reports Logged', value: data?.kpis?.totalReports || '3,291', icon: <Shield />, color: 'var(--color-saffron)' },
    { label: 'Active Defenders', value: data?.kpis?.activeDefenders?.toLocaleString() || '89,247', icon: <Users />, color: 'var(--color-green)' },
  ];

  return (
    <div>
      <div className="page-header container">
        <span className="tag" style={{ background: 'var(--color-purple-dim)', borderColor: 'rgba(156,107,255,0.3)', color: 'var(--color-purple)' }}>📊 LIVE ANALYTICS</span>
        <h1>Secure Bharat <span className="gradient-text">Intelligence</span></h1>
        <p>Real-time citizen-sourced threat intelligence and infrastructure monitoring.</p>
      </div>

      <div className="container section-sm">
        {/* System Health Monitor */}
        <div className="card card-glow-cyan" style={{ marginBottom: 30, padding: '20px 28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 10, margin: 0, fontSize: '1.1rem' }}>
              <Server size={20} className="text-cyan" /> Infrastructure Health
            </h3>
            <div className="badge badge-safe" style={{ background: health?.status === 'healthy' ? 'var(--color-green-dim)' : 'var(--color-danger-dim)', color: health?.status === 'healthy' ? 'var(--color-green)' : 'var(--color-danger)' }}>
              {health?.status?.toUpperCase() || 'ONLINE'}
            </div>
          </div>
          
          <div className="grid-4">
            <div className="flex flex-col gap-2">
              <span className="text-xs text-muted">CPU LOAD</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="meter-track" style={{ flex: 1 }}><div className="meter-fill meter-safe" style={{ width: `${health?.metrics?.cpu?.percent || 12}%`, background: health?.metrics?.cpu?.percent > 70 ? 'var(--color-danger)' : 'var(--color-green)' }} /></div>
                <span className="font-mono text-xs">{health?.metrics?.cpu?.percent || 0}%</span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-xs text-muted">MEMORY USAGE</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="meter-track" style={{ flex: 1 }}><div className="meter-fill meter-safe" style={{ width: `${health?.metrics?.memory?.percent || 45}%` }} /></div>
                <span className="font-mono text-xs">{health?.metrics?.memory?.percent || 0}%</span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-xs text-muted">ACTIVE CONNECTIONS</span>
              <div className="flex items-center gap-2">
                <Zap size={14} className="text-saffron" />
                <span className="font-mono font-bold">{health?.metrics?.activeConnections || 0}</span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-xs text-muted">SERVER UPTIME</span>
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-cyan" />
                <span className="font-mono font-bold">{health?.metrics?.uptimeFormatted || '0h 0m'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
    <div className="container" style={{ paddingBottom: 60 }}>
      <div className="page-header">
        <span className="tag">📊 {t('dashboard.title')}</span>
        <h1>Cyber <span className="gradient-text">Intelligence</span> Center</h1>
        <p>{t('dashboard.subtitle')}</p>
      </div>

      <div className="stat-grid" style={{ marginBottom: 32 }}>
        {kpis.map(k => (
          <div key={k.label} className="card" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 20, padding: '24px' }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: k.color + '15', color: k.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>{k.icon}</div>
            <div>
              <div className="text-muted text-xs font-bold uppercase tracking-wider">{k.label}</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: 'Outfit, sans-serif' }}>{k.value.toLocaleString()}</div>
              <div className="text-green text-xs font-bold" style={{ marginTop: 2 }}>{k.change} <span className="text-muted font-normal">vs last month</span></div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        {/* Main Trend Chart */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1.1rem' }}>📈 {t('dashboard.trends')}</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              {[['7d','7 Days'], ['30d','30 Days'], ['90d','90 Days']].map(([k,l]) => (
                <button key={k} className={`btn btn-sm ${k === '30d' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '4px 10px', fontSize: '0.7rem' }}>{l}</button>
              ))}
            </div>
          </div>
          <div style={{ height: 320, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.monthlyTrends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  {[['upi','#ff3860'],['phishing','#00d4ff'],['sms','#ff9933'],['jobs','#9c6bff']].map(([id, color]) => (
                    <linearGradient key={id} id={`grad-${id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={color} stopOpacity={0}/>
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tickFormatter={(m) => ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m-1]} />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area type="monotone" dataKey="upi" name="UPI Phishing" stroke="#ff3860" fill="url(#grad-upi)" strokeWidth={2} />
                <Area type="monotone" dataKey="phishing" name="Banking Phishing" stroke="#00d4ff" fill="url(#grad-phishing)" strokeWidth={2} />
                <Area type="monotone" dataKey="sms" name="SMS Scams" stroke="#ff9933" fill="url(#grad-sms)" strokeWidth={2} />
                <Area type="monotone" dataKey="jobs" name="Job Scams" stroke="#9c6bff" fill="url(#grad-jobs)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Infrastructure Health */}
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, marginBottom: 20, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Server size={20} className="text-cyan" /> {t('dashboard.health.title')}
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="stat-card" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span className="text-muted text-xs uppercase font-bold">{t('dashboard.health.cpu')}</span>
                <span className={health?.metrics?.cpu?.percent > 70 ? 'text-danger' : 'text-green'} style={{ fontSize: '0.8rem', fontWeight: 700 }}>{health?.metrics?.cpu?.percent}%</span>
              </div>
              <div className="meter-track" style={{ height: 4 }}>
                <div className="meter-fill" style={{ width: `${health?.metrics?.cpu?.percent || 0}%`, background: health?.metrics?.cpu?.percent > 70 ? 'var(--color-danger)' : 'var(--color-cyan)' }} />
              </div>
            </div>

            <div className="stat-card" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span className="text-muted text-xs uppercase font-bold">{t('dashboard.health.mem')}</span>
                <span className="text-cyan" style={{ fontSize: '0.8rem', fontWeight: 700 }}>{health?.metrics?.memory?.percent}%</span>
              </div>
              <div className="meter-track" style={{ height: 4 }}>
                <div className="meter-fill" style={{ width: `${health?.metrics?.memory?.percent || 0}%`, background: 'var(--color-cyan)' }} />
              </div>
            </div>
          </div>

          <div className="divider" style={{ margin: '20px 0' }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--color-cyan-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-cyan)' }}>
                  <Zap size={14} />
                </div>
                <span className="text-sm font-bold">{t('dashboard.health.conn')}</span>
              </div>
              <span className="font-mono text-cyan" style={{ fontWeight: 800 }}>{health?.metrics?.activeConnections}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--color-purple-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-purple)' }}>
                  <Clock size={14} />
                </div>
                <span className="text-sm font-bold">{t('dashboard.health.uptime')}</span>
              </div>
              <span className="font-mono" style={{ fontSize: '0.85rem' }}>{health?.metrics?.uptimeFormatted || '0h 0m'}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className={`badge badge-${health?.status === 'healthy' ? 'safe' : 'suspicious'}`} style={{ width: 32, height: 32, padding: 0, justifyContent: 'center', borderRadius: '50%' }}>
                  <Shield size={14} />
                </div>
                <span className="text-sm font-bold">{t('dashboard.health.status')}</span>
              </div>
              <span className={`badge badge-${health?.status === 'healthy' ? 'safe' : 'suspicious'}`} style={{ textTransform: 'uppercase', fontSize: '0.65rem' }}>{health?.status}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, marginBottom: 20, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Globe size={18} className="text-green" /> {t('dashboard.platform')}
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={data?.platformData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40} strokeWidth={0}>
                {data?.platformData?.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(v, n) => [`${v} Reports`, n]} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: 8 }} />
              <Legend formatter={(value) => <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{value}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, marginBottom: 16, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle size={18} className="text-purple" /> {t('dashboard.topThreats')}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {data?.topThreats?.map((t_data, i) => (
              <div key={t_data.name} style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <span className="text-muted text-sm" style={{ width: 20, flexShrink: 0 }}>#{i+1}</span>
                <span style={{ flex: 1, minWidth: 120, fontWeight: 600, fontSize: '0.9rem' }}>{t_data.name}</span>
                <div className="meter-track" style={{ flex: 2, minWidth: 100, maxWidth: 300 }}>
                  <div style={{ height: '100%', width: `${Math.min(100, (t_data.count / (data.topThreats[0]?.count || 1)) * 100)}%`, background: t_data.color, borderRadius: 4, transition: 'width 1s ease' }} />
                </div>
                <span style={{ color: t_data.color, fontWeight: 700, fontSize: '0.9rem', minWidth: 60, textAlign: 'right' }}>{t_data.count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, marginBottom: 16, fontSize: '1.1rem' }}>⚡ {t('dashboard.actions')}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
          {[
            { icon: '🔍', label: t('nav.scanner'), link: '#/scanner' },
            { icon: '📱', label: t('nav.sms'), link: '#/sms' },
            { icon: '📋', label: t('nav.report'), link: '#/report' },
            { icon: '🎮', label: t('nav.challenges'), link: '#/challenges' },
            { icon: '🗺️', label: t('nav.heatmap'), link: '#/heatmap' },
            { icon: '🏆', label: t('nav.leaderboard'), link: '#/leaderboard' },
          ].map(a => (
            <a key={a.label} href={a.link} className="btn btn-secondary" style={{ justifyContent: 'center', flexDirection: 'column', gap: 4, padding: '14px', height: 70 }}>
              <span style={{ fontSize: '1.4rem' }}>{a.icon}</span>
              <span style={{ fontSize: '0.78rem' }}>{a.label}</span>
            </a>
          ))}
        </div>
      </div>
      </div>
    </div>
  </div>
  );
}
