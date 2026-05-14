import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Volume2, VolumeX, Shield, Lock, Fingerprint } from 'lucide-react';
import { useState } from 'react';
import { speak, stopSpeaking } from '../utils/SpeechSynthesizer';

const EducationCard = ({ title, description, image, icon: Icon, color }) => {
    const { t } = useTranslation();
    const [isPlaying, setIsPlaying] = useState(false);

    const handleSpeak = () => {
        if (isPlaying) {
            stopSpeaking();
            setIsPlaying(false);
        } else {
            const utterance = speak(`${title}. ${description}`);
            if (utterance) {
                setIsPlaying(true);
                utterance.onend = () => setIsPlaying(false);
            }
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            whileHover={{ y: -10, transition: { duration: 0.3 } }}
            viewport={{ once: true }}
            className="card education-card"
            style={{
                overflow: 'hidden',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.3s ease',
                cursor: 'default'
            }}
        >
            <div className="education-image-container" style={{ position: 'relative', height: '220px', background: `linear-gradient(135deg, ${color}22, ${color}44)`, overflow: 'hidden' }}>
                <motion.img
                    src={image}
                    alt={title}
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.5 }}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.9 }}
                />
                <div style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', borderRadius: '50%', padding: '8px' }}>
                    <Icon size={24} color={color} />
                </div>
            </div>

            <div className="card-content" style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-card)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.4rem', color: color, fontWeight: '700' }}>{title}</h3>
                    <button
                        onClick={handleSpeak}
                        className={`btn-icon ${isPlaying ? 'active' : ''}`}
                        title={isPlaying ? t('common.stopReading') : t('common.readAloud')}
                        style={{
                            padding: '10px',
                            borderRadius: '50%',
                            background: isPlaying ? color : 'var(--bg-glass)',
                            color: isPlaying ? 'white' : color,
                            border: `2px solid ${color}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease',
                            cursor: 'pointer'
                        }}
                    >
                        {isPlaying ? <VolumeX size={20} /> : <Volume2 size={20} />}
                    </button>
                </div>

                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '1rem', margin: 0 }}>
                    {description}
                </p>

                <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
                    <div style={{ display: 'flex', gap: '8px', opacity: 0.8 }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 'bold', padding: '4px 10px', background: `${color}22`, color: color, borderRadius: '20px', border: `1px solid ${color}44` }}>#CyberSafety</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 'bold', padding: '4px 10px', background: `${color}22`, color: color, borderRadius: '20px', border: `1px solid ${color}44` }}>#VisualLearning</span>
                    </div>
                </div>
            </div>
        </motion.div>

    );
};

const Education = () => {
    const { t } = useTranslation();

    const cards = [
        {
            id: 'phishing',
            title: t('education.phishing.title'),
            description: t('education.phishing.desc'),
            image: '/assets/education/phishing.svg',
            icon: Shield,
            color: '#4CC9F0'
        },
        {
            id: 'passwords',
            title: t('education.passwords.title'),
            description: t('education.passwords.desc'),
            image: '/assets/education/passwords.svg',
            icon: Lock,
            color: '#F72585'
        },
        {
            id: 'otp',
            title: t('education.otp.title'),
            description: t('education.otp.desc'),
            image: '/assets/education/otp.svg',
            icon: Fingerprint,
            color: '#7209B7'
        }
    ];

    return (
        <div className="education-page" style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
            <header style={{ textAlign: 'center', marginBottom: '60px' }}>
                <motion.h1
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ fontSize: '3rem', fontWeight: '800', marginBottom: '16px', background: 'linear-gradient(to right, var(--color-cyan), var(--color-purple))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                >
                    {t('education.title')}
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}
                >
                    {t('education.subtitle')}
                </motion.p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px' }}>
                {cards.map((card, index) => (
                    <EducationCard key={card.id} {...card} />
                ))}
            </div>

            <motion.section
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                style={{ marginTop: '80px', padding: '40px', background: 'var(--bg-glass)', borderRadius: '24px', border: '1px solid var(--border-glass)', textAlign: 'center' }}
            >
                <h2 style={{ marginBottom: '20px' }}>{t('education.future.title')}</h2>
                <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto 30px' }}>
                    {t('education.future.desc')}
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
                    <div className="stat-pill">{t('education.future.items.video')}</div>
                    <div className="stat-pill">{t('education.future.items.sim')}</div>
                    <div className="stat-pill">{t('education.future.items.voice')}</div>
                </div>
            </motion.section>
        </div>
    );
};

export default Education;
