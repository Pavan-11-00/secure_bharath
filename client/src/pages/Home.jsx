import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

function useCountUp(target, duration = 2000) {
  const [count, setCount] = useState(0);
  const rafRef = useRef(null);
  useEffect(() => {
    const start = Date.now();
    const animate = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target]);
  return count;
}

function StatCard({ label, value, suffix, color }) {
  const count = useCountUp(value);
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={{ color }}>{count.toLocaleString()}{suffix}</div>
    </div>
  );
}

export default function Home({ addPoints }) {
  const { t } = useTranslation();
  const [liveThreats, setLiveThreats] = useState([]);
  const [threatStats, setThreatStats] = useState(null);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const stats = [
    { label: t('home.stats.scanned'), value: 142830, suffix: '+', color: 'var(--color-cyan)' },
    { label: t('home.stats.blocked'), value: 23456, suffix: '+', color: 'var(--color-danger)' },
    { label: t('home.stats.citizens'), value: 89200, suffix: '+', color: 'var(--color-saffron)' },
    { label: t('home.stats.cities'), value: 512, suffix: '', color: 'var(--color-green)' },
  ];

  const features = [
    { icon: '🔍', title: t('nav.scanner'), desc: t('home.features.desc'), link: '/scanner', color: 'var(--color-cyan)', bg: 'var(--color-cyan-dim)' },
    { icon: '📱', title: t('nav.sms'), desc: t('home.features.desc'), link: '/sms', color: 'var(--color-saffron)', bg: 'var(--color-saffron-dim)' },
    { icon: '🔐', title: t('nav.password'), desc: t('home.features.desc'), link: '/password', color: 'var(--color-purple)', bg: 'var(--color-purple-dim)' },
    { icon: '🎮', title: t('nav.challenges'), desc: t('home.features.desc'), link: '/challenges', color: 'var(--color-green)', bg: 'var(--color-green-dim)' },
    { icon: '🏆', title: t('nav.leaderboard'), desc: t('home.features.desc'), link: '/leaderboard', color: 'var(--color-saffron)', bg: 'var(--color-saffron-dim)' },
    { icon: '🗺️', title: t('nav.heatmap'), desc: t('home.features.desc'), link: '/heatmap', color: 'var(--color-danger)', bg: 'var(--color-danger-dim)' },
    { icon: '📋', title: t('nav.report'), desc: t('home.features.desc'), link: '/report', color: 'var(--color-cyan)', bg: 'var(--color-cyan-dim)' },
    { icon: '📊', title: t('nav.dashboard'), desc: t('home.features.desc'), link: '/dashboard', color: 'var(--color-purple)', bg: 'var(--color-purple-dim)' },
  ];

  useEffect(() => {
    const fetchThreats = async () => {
      try {
        const res = await fetch(`${API_URL}/api/live-threats`);
        const data = await res.json();
        setLiveThreats(data.events.slice(0, 5));
        setThreatStats(data.stats);
      } catch (err) {
        console.error('Failed to fetch threats:', err);
      }
    };
    fetchThreats();
    const interval = setInterval(fetchThreats, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ position: 'relative' }}>
      {/* HERO */}
      <section style={{ padding: '80px 0 60px', textAlign: 'center' }}>
        <div className="container">
          <div style={{ marginBottom: 20 }}>
            <span className="badge badge-info animate-pulse">{t('home.hero.badge')}</span>
          </div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 'clamp(2.2rem, 6vw, 4rem)', fontWeight: 900, lineHeight: 1.1, marginBottom: 20 }}>
            {t('home.hero.title').split(' ').slice(0, -2).join(' ')}{' '}
            <span className="gradient-text">{t('home.hero.title').split(' ').slice(-2).join(' ')}</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: 580, margin: '0 auto 32px', lineHeight: 1.7 }}>
            {t('home.hero.subtitle')}
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/scanner" className="btn btn-primary btn-lg">
              {t('home.hero.ctaScan')}
            </Link>
            <Link to="/challenges" className="btn btn-secondary btn-lg">
              {t('home.hero.ctaChallenge')}
            </Link>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="section-sm">
        <div className="container">
          <div className="stat-grid">
            {stats.map(s => <StatCard key={s.label} {...s} />)}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="section">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div className="tag" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 20, marginBottom: 12, background: 'var(--color-saffron-dim)', border: '1px solid var(--border-glow-saffron)', color: 'var(--color-saffron)', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>⚡ {t('home.features.title')}</div>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 'clamp(1.5rem,3vw,2.2rem)', fontWeight: 800, marginBottom: 10 }}>{t('home.features.subtitle')}</h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: 500, margin: '0 auto' }}>{t('home.features.desc')}</p>
          </div>
          <div className="grid-auto">
            {features.map(f => (
              <Link key={f.title} to={f.link} style={{ textDecoration: 'none' }}>
                <div className="card" style={{ height: '100%', cursor: 'pointer' }}>
                  <div style={{ width: 52, height: 52, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', background: f.bg, marginBottom: 14 }}>{f.icon}</div>
                  <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1.05rem', marginBottom: 6, color: f.color }}>{f.title}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.5 }}>{f.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* LIVE FEED */}
      <section className="section-sm">
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, gap: 10, flexWrap: 'wrap' }}>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.4rem' }}>{t('home.feed.title')}</h2>
            <div style={{ display: 'flex', gap: 10 }}>
              {threatStats && <span className="badge badge-info">{threatStats.total} {t('home.feed.reportsToday')}</span>}
              <span className="badge badge-danger animate-pulse">{t('heatmap.status.live')}</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {liveThreats.length > 0 ? liveThreats.map((t_data, i) => (
              <div key={i} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', flexWrap: 'wrap', borderLeft: `4px solid var(--color-${t_data.severity === 'critical' ? 'danger' : t_data.severity === 'high' ? 'saffron' : 'cyan'})` }}>
                <span style={{ fontSize: '1.4rem' }}>{t_data.severity === 'critical' ? '🚨' : '⚠️'}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                    <span className={`badge badge-${t_data.severity === 'critical' ? 'danger' : 'info'}`}>{t_data.type}</span>
                    <span className="text-muted text-xs">📍 {t_data.city}</span>
                    {t_data.isReal && <span className="badge badge-green" style={{ fontSize: '0.65rem' }}>{t('common.verified')}</span>}
                  </div>
                  <p className="text-sm text-secondary font-mono">{t_data.isReal ? t('home.feed.verified') : t('home.feed.pattern')} in {t_data.city}</p>
                </div>
                <span className="text-muted text-xs">{new Date(t_data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            )) : (
              <div className="card" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                {t('home.feed.loading')}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section" style={{ textAlign: 'center' }}>
        <div className="container">
          <div className="card card-glow-cyan" style={{ maxWidth: 650, margin: '0 auto', padding: '48px 40px' }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>🇮🇳</div>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 'clamp(1.4rem,3vw,2rem)', marginBottom: 12 }}>
              {t('home.cta.title')}
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 28, lineHeight: 1.6 }}>{t('home.cta.desc')}</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/report" className="btn btn-primary">{t('home.cta.report')}</Link>
              <Link to="/challenges" className="btn btn-secondary">{t('home.cta.earn')}</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
