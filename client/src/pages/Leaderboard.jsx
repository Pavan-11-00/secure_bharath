import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const USERS = [
  { rank: 1, name: 'Priya Sharma', avatar: '👩‍💻', city: 'Bengaluru', college: 'IIT Bengaluru', clan: 'CyberGuardians', score: 12480, badge: '🏆' },
  { rank: 2, name: 'Rahul Verma', avatar: '👨‍💼', city: 'Delhi', college: 'DTU', clan: 'TechShield', score: 11350, badge: '🥈' },
  { rank: 3, name: 'Ananya Krishnan', avatar: '👩‍🎓', city: 'Chennai', college: 'IIT Madras', clan: 'CyberPatrols', score: 10920, badge: '🥉' },
  { rank: 4, name: 'Vikram Singh', avatar: '👨‍💻', city: 'Mumbai', college: 'VJTI', clan: 'DataDefenders', score: 9875, badge: '⭐' },
  { rank: 5, name: 'Sneha Patel', avatar: '👩‍🔬', city: 'Ahmedabad', college: 'DAIICT', clan: 'CyberGuardians', score: 9340, badge: '⭐' },
  { rank: 6, name: 'Arjun Nair', avatar: '👨‍🎓', city: 'Kochi', college: 'NIT Calicut', clan: 'TechShield', score: 8760, badge: '⭐' },
  { rank: 7, name: 'Kavya Reddy', avatar: '👩‍💻', city: 'Hyderabad', college: 'IIIT Hyderabad', clan: 'CyberPatrols', score: 8290, badge: '⭐' },
  { rank: 8, name: 'Manish Kumar', avatar: '👨‍🏫', city: 'Patna', college: 'NIT Patna', clan: 'DataDefenders', score: 7840, badge: '⭐' },
  { rank: 9, name: 'Divya Menon', avatar: '👩‍💼', city: 'Pune', college: 'COEP', clan: 'WebWatchdog', score: 7320, badge: '⭐' },
  { rank: 10, name: 'Rohit Gupta', avatar: '👨‍💻', city: 'Jaipur', college: 'MNIT', clan: 'WebWatchdog', score: 6980, badge: '⭐' },
];

const CITIES = [
  { rank: 1, name: 'Bengaluru', icon: '🌆', score: 284930, members: 8420, badge: '🏆' },
  { rank: 2, name: 'Delhi', icon: '🏛️', score: 271540, members: 7850, badge: '🥈' },
  { rank: 3, name: 'Mumbai', icon: '🌊', score: 259880, members: 7420, badge: '🥉' },
  { rank: 4, name: 'Chennai', icon: '🌴', score: 198760, members: 5620, badge: '⭐' },
  { rank: 5, name: 'Hyderabad', icon: '🔷', score: 187340, members: 5180, badge: '⭐' },
  { rank: 6, name: 'Pune', icon: '🎓', score: 162910, members: 4890, badge: '⭐' },
  { rank: 7, name: 'Ahmedabad', icon: '🕌', score: 143280, members: 4120, badge: '⭐' },
  { rank: 8, name: 'Kochi', icon: '⛵', score: 128570, members: 3960, badge: '⭐' },
];

const CLANS = [
  { rank: 1, name: 'CyberGuardians', icon: '🛡️', members: 234, score: 542890, color: 'var(--color-cyan)', desc: 'Open to all — protecting India together' },
  { rank: 2, name: 'TechShield', icon: '⚔️', members: 198, score: 489230, color: 'var(--color-saffron)', desc: 'Engineering students cybersecurity group' },
  { rank: 3, name: 'CyberPatrols', icon: '🔍', members: 176, score: 421650, color: 'var(--color-green)', desc: 'Active threat hunters and reporters' },
  { rank: 4, name: 'DataDefenders', icon: '🔐', members: 152, score: 387420, color: 'var(--color-purple)', desc: 'Privacy-first cybersecurity advocates' },
  { rank: 5, name: 'WebWatchdog', icon: '🐕', members: 134, score: 312890, color: 'var(--color-warning)', desc: 'Online fraud prevention specialists' },
];

function UserRow({ u, t }) {
  return (
    <div className="rank-row">
      <span className={`rank-num rank-${u.rank <= 3 ? u.rank : ''}`}>{u.rank <= 3 ? ['🥇','🥈','🥉'][u.rank-1] : `#${u.rank}`}</span>
      <div className="rank-avatar">{u.avatar}</div>
      <div className="rank-info">
        <div className="rank-name">{u.name}</div>
        <div className="rank-sub">📍 {u.city} · 🎓 {u.college}</div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div className="rank-score">{u.score.toLocaleString()}</div>
        <div className="text-muted text-xs">{t('common.points')} · {u.clan}</div>
      </div>
    </div>
  );
}

function CityRow({ c, t }) {
  return (
    <div className="rank-row">
      <span className={`rank-num rank-${c.rank <= 3 ? c.rank : ''}`}>{c.rank <= 3 ? ['🥇','🥈','🥉'][c.rank-1] : `#${c.rank}`}</span>
      <div className="rank-avatar" style={{ fontSize: '1.5rem' }}>{c.icon}</div>
      <div className="rank-info">
        <div className="rank-name">{c.name}</div>
        <div className="rank-sub">👥 {c.members.toLocaleString()} {t('leaderboard.members')}</div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div className="rank-score">{c.score.toLocaleString()}</div>
        <div className="text-muted text-xs">{t('leaderboard.totalPts')}</div>
      </div>
    </div>
  );
}

function ClanCard({ c, t }) {
  return (
    <div className="card" style={{ borderLeft: `3px solid ${c.color}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: '1.8rem' }}>{c.icon}</span>
          <div>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, color: c.color }}>{c.name}</div>
            <div className="text-muted text-xs">👥 {c.members} {t('leaderboard.members')}</div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, color: c.color, fontSize: '1.2rem' }}>#{c.rank}</div>
        </div>
      </div>
      <p className="text-sm text-secondary" style={{ marginBottom: 12 }}>{c.desc}</p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <span className="text-sm font-bold" style={{ color: 'var(--color-saffron)' }}>⭐ {c.score.toLocaleString()} {t('common.points')}</span>
        <button className="btn btn-secondary btn-sm">{t('leaderboard.join')}</button>
      </div>
    </div>
  );
}

export default function Leaderboard({ points }) {
  const { t } = useTranslation();
  const [tab, setTab] = useState('users');

  return (
    <div>
      <div className="page-header container">
        <span className="tag" style={{ background: 'var(--color-saffron-dim)', borderColor: 'var(--border-glow-saffron)', color: 'var(--color-saffron)' }}>🏆 {t('leaderboard.title')}</span>
        <h1>{t('leaderboard.subtitle').split(' ').slice(0, 1).join(' ')} <span className="gradient-text">{t('leaderboard.subtitle').split(' ').slice(1).join(' ')}</span></h1>
        <p>{t('leaderboard.desc')}</p>
      </div>

      <div className="container section-sm">
        <div className="card card-glow-saffron" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '2rem' }}>🧑‍💻</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800 }}>{t('leaderboard.yourStats')}</div>
              <div className="text-muted text-sm">{t('leaderboard.statsDesc')}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: '1.6rem', color: 'var(--color-saffron)' }}>{points.toLocaleString()}</div>
              <div className="text-muted text-xs">{t('leaderboard.yourPoints')}</div>
            </div>
          </div>
        </div>

        <div className="tabs" style={{ marginBottom: 20 }}>
          {[['users', t('leaderboard.tabs.users')], ['cities', t('leaderboard.tabs.cities')], ['clans', t('leaderboard.tabs.clans')]].map(([k,l]) => (
            <button key={k} className={`tab${tab === k ? ' active' : ''}`} onClick={() => setTab(k)}>{l}</button>
          ))}
        </div>

        {tab === 'users' && (
          <div>
            {USERS.map(u => <UserRow key={u.rank} u={u} t={t} />)}
          </div>
        )}

        {tab === 'cities' && (
          <div>
            {CITIES.map(c => <CityRow key={c.rank} c={c} t={t} />)}
          </div>
        )}

        {tab === 'clans' && (
          <div className="grid-auto">
            {CLANS.map(c => <ClanCard key={c.rank} c={c} t={t} />)}
          </div>
        )}
      </div>
    </div>
  );
}
