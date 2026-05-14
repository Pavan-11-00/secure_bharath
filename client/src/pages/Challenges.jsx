import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { generateQuestion } from '../utils/groq.js';

const LEVELS = [
  { id: 1, icon: '🎣', titleKey: 'challenges.level1', domain: 'phishing', color: '#4CC9F0', difficulty: 'EASY', pointsPerQ: 25 },
  { id: 2, icon: '🔑', titleKey: 'challenges.level2', domain: 'password', color: '#F72585', difficulty: 'MEDIUM', pointsPerQ: 50 },
  { id: 3, icon: '📱', titleKey: 'challenges.level3', domain: 'sms', color: '#7209B7', difficulty: 'MEDIUM', pointsPerQ: 75 },
  { id: 4, icon: '💰', titleKey: 'challenges.level4', domain: 'upi', color: '#F48C06', difficulty: 'HARD', pointsPerQ: 100 },
  { id: 5, icon: '🌐', titleKey: 'challenges.level5', domain: 'expert', color: '#2A9D8F', difficulty: 'EXPERT', pointsPerQ: 150 },
];

export default function Challenges({ addPoints, addToast }) {
  const { t } = useTranslation();
  const { levelProgress, updateLevelProgress } = useAuth();
  const [currentLevel, setCurrentLevel] = useState(1);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [selected, setSelected] = useState(null);
  const [streak, setStreak] = useState(0);
  const [sessionPoints, setSessionPoints] = useState(0);
  const [sessionCorrect, setSessionCorrect] = useState(0);

  const level = LEVELS[currentLevel - 1];
  const progress = (levelProgress || {})[level.id] || { questions: 0, points: 0 };
  const totalPoints = Object.values(levelProgress || {}).reduce((sum, lp) => sum + (lp?.points || 0), 0);

  const generateNewQuestion = async () => {
    if (loading) return;
    setLoading(true);
    setAnswered(false);
    setSelected(null);
    setCurrentQuestion(null);
    try {
      const question = await generateQuestion(level.domain);
      setCurrentQuestion(question);
    } catch (error) {
      console.error('Question generation failed:', error);
      addToast(t('common.retry'), 'error', '❌');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (idx) => {
    if (answered || loading) return;
    setSelected(idx);
    setAnswered(true);
    const isCorrect = currentQuestion.options[idx].correct;
    if (isCorrect) {
      const bonus = streak >= 4 ? 2 : streak >= 2 ? 1.5 : 1;
      const earned = Math.round(level.pointsPerQ * bonus);
      const newProgress = {
        ...progress,
        questions: (progress.questions || 0) + 1,
        points: (progress.points || 0) + earned,
      };
      updateLevelProgress({ [level.id]: newProgress });
      addPoints(earned);
      setStreak(s => s + 1);
      setSessionPoints(sp => sp + earned);
      setSessionCorrect(sc => sc + 1);
      const streakMsg = streak >= 2 ? ` 🔥 ${streak + 1}x Streak! +${earned}pts` : `+${earned} pts!`;
      addToast(streakMsg, 'success', '⭐');
    } else {
      setStreak(0);
      addToast('Incorrect! Keep going 💪', 'error', '📚');
    }
  };

  const correctIdx = currentQuestion ? currentQuestion.options.findIndex(o => o.correct) : -1;
  const isCorrectAnswer = selected === correctIdx;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
      {/* Header */}
      <header style={{ textAlign: 'center', marginBottom: '48px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(156,107,255,0.15)', border: '1px solid rgba(156,107,255,0.3)', color: '#9c6bff', padding: '6px 16px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
          🎮 CYBER CHALLENGES
        </div>
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 900, marginBottom: 12, background: 'linear-gradient(135deg, #4CC9F0, #9c6bff, #F72585)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          {t('challenges.title')}
        </h1>
        <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: 24 }}>
          All levels unlocked · Unlimited questions · Earn points forever
        </p>

        {/* Session stats bar */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, flexWrap: 'wrap' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: 12, padding: '10px 20px', minWidth: 100 }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#4CC9F0' }}>{totalPoints.toLocaleString()}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total Points</div>
          </div>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: 12, padding: '10px 20px', minWidth: 100 }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#F48C06' }}>{streak}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>🔥 Streak</div>
          </div>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: 12, padding: '10px 20px', minWidth: 100 }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#2A9D8F' }}>{sessionCorrect}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Correct Today</div>
          </div>
        </div>
      </header>

      {/* Level Selector */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 36 }}>
        {LEVELS.map((lvl) => {
          const lvlProg = (levelProgress || {})[lvl.id] || { questions: 0, points: 0 };
          const isSelected = currentLevel === lvl.id;
          return (
            <div
              key={lvl.id}
              onClick={() => { setCurrentLevel(lvl.id); setCurrentQuestion(null); setAnswered(false); setSelected(null); }}
              style={{
                background: isSelected ? lvl.color + '18' : 'var(--bg-card)',
                border: `2px solid ${isSelected ? lvl.color : 'var(--border-glass)'}`,
                borderRadius: 16,
                padding: '18px 16px',
                cursor: 'pointer',
                transition: 'all 0.25s ease',
                transform: isSelected ? 'translateY(-3px)' : 'none',
                boxShadow: isSelected ? `0 8px 24px ${lvl.color}30` : 'none',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: lvl.color + '22', color: lvl.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>
                  {lvl.icon}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: isSelected ? lvl.color : 'var(--text-primary)' }}>{t(lvl.titleKey)}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>{lvl.difficulty} · {lvl.pointsPerQ}pts/Q</div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <span>✅ {lvlProg.questions || 0} answered</span>
                <span style={{ color: lvl.color, fontWeight: 700 }}>{(lvlProg.points || 0).toLocaleString()} pts</span>
              </div>
              {isSelected && (
                <div style={{ position: 'absolute', top: 10, right: 10, width: 10, height: 10, borderRadius: '50%', background: lvl.color, boxShadow: `0 0 8px ${lvl.color}` }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Question Card */}
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div className="card" style={{ padding: '36px 32px' }}>
          {/* Level header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: level.color + '22', color: level.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem' }}>
                {level.icon}
              </div>
              <div>
                <h2 style={{ margin: 0, color: level.color, fontSize: '1.4rem', fontWeight: 800 }}>{t(level.titleKey)}</h2>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {level.pointsPerQ} pts per correct answer
                  {streak >= 2 && <span style={{ color: '#F48C06', marginLeft: 8, fontWeight: 700 }}>🔥 x{streak} streak bonus!</span>}
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: level.color }}>{progress.questions || 0}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>answered</div>
            </div>
          </div>

          {currentQuestion ? (
            <>
              {/* Question */}
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-glass)', padding: '20px 24px', borderRadius: 14, marginBottom: 20 }}>
                <p style={{ fontSize: '1.05rem', lineHeight: 1.7, margin: 0, fontWeight: 500 }}>{currentQuestion.question}</p>
              </div>

              {/* Options */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {currentQuestion.options.map((opt, i) => {
                  let bg = 'rgba(255,255,255,0.04)';
                  let border = 'var(--border-glass)';
                  let textColor = 'var(--text-primary)';
                  if (answered) {
                    if (opt.correct) { bg = 'rgba(16,185,129,0.15)'; border = '#10b981'; textColor = '#10b981'; }
                    else if (selected === i) { bg = 'rgba(239,68,68,0.15)'; border = '#ef4444'; textColor = '#ef4444'; }
                  }
                  return (
                    <button
                      key={i}
                      onClick={() => handleAnswer(i)}
                      disabled={answered}
                      style={{
                        background: bg,
                        border: `2px solid ${border}`,
                        padding: '14px 18px',
                        borderRadius: 12,
                        textAlign: 'left',
                        cursor: answered ? 'default' : 'pointer',
                        color: textColor,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                        transition: 'all 0.2s ease',
                        fontSize: '0.95rem',
                        fontWeight: answered && opt.correct ? 600 : 400,
                      }}
                    >
                      <span style={{ width: 28, height: 28, borderRadius: '50%', background: answered && opt.correct ? '#10b981' : answered && selected === i ? '#ef4444' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 }}>
                        {answered && opt.correct ? '✓' : answered && selected === i ? '✗' : String.fromCharCode(65 + i)}
                      </span>
                      {opt.text}
                    </button>
                  );
                })}
              </div>

              {/* Feedback */}
              {answered && (
                <div style={{ marginTop: 20 }}>
                  <div style={{
                    padding: '18px 20px',
                    borderRadius: 12,
                    background: isCorrectAnswer ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                    border: `1px solid ${isCorrectAnswer ? '#10b981' : '#ef4444'}`,
                    marginBottom: 16,
                    borderLeft: `4px solid ${isCorrectAnswer ? '#10b981' : '#ef4444'}`
                  }}>
                    <div style={{ fontWeight: 700, marginBottom: 6, color: isCorrectAnswer ? '#10b981' : '#ef4444', fontSize: '1rem' }}>
                      {isCorrectAnswer ? `✅ Correct! +${Math.round(level.pointsPerQ * (streak > 1 ? (streak >= 4 ? 2 : 1.5) : 1))} pts` : '❌ Wrong Answer'}
                    </div>
                    <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}>{currentQuestion.explanation}</p>
                  </div>
                  <button
                    onClick={generateNewQuestion}
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '14px',
                      background: loading ? 'var(--bg-glass)' : `linear-gradient(135deg, ${level.color}, ${level.color}bb)`,
                      border: 'none',
                      borderRadius: 12,
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '1rem',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8
                    }}
                  >
                    {loading ? <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Generating...</> : '➡️ Next Question'}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: '4rem', marginBottom: 20 }}>🧠</div>
              <h3 style={{ color: level.color, marginBottom: 8, fontSize: '1.4rem' }}>Ready to Play?</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 28, fontSize: '0.95rem' }}>
                Answer unlimited questions and keep earning points. No cap — challenge yourself!
              </p>
              {progress.questions > 0 && (
                <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '12px 20px', marginBottom: 20, display: 'inline-flex', gap: 24 }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>✅ {progress.questions} answered</span>
                  <span style={{ color: level.color, fontWeight: 700, fontSize: '0.9rem' }}>{(progress.points || 0).toLocaleString()} pts earned</span>
                </div>
              )}
              <button
                onClick={generateNewQuestion}
                disabled={loading}
                style={{
                  padding: '14px 40px',
                  background: loading ? 'var(--bg-glass)' : `linear-gradient(135deg, ${level.color}, ${level.color}bb)`,
                  border: 'none',
                  borderRadius: 14,
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '1.05rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10
                }}
              >
                {loading ? <><span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> Generating...</> : '🚀 Start Challenge'}
              </button>
            </div>
          )}
        </div>

        {/* Streak tip */}
        {streak >= 2 && (
          <div style={{ textAlign: 'center', marginTop: 16, padding: '10px 16px', background: 'rgba(244,140,6,0.12)', border: '1px solid rgba(244,140,6,0.3)', borderRadius: 10, color: '#F48C06', fontWeight: 600, fontSize: '0.9rem' }}>
            🔥 {streak} answer streak! {streak >= 4 ? '2x bonus points active!' : 'Keep going for 2x bonus at 5!'}
          </div>
        )}
      </div>
    </div>
  );
}
