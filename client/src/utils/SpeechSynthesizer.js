import i18n from '../i18n/i18n';

/**
 * SpeechSynthesizer - A simple utility to read text aloud using the Web Speech API.
 */
export const speak = (text, options = {}) => {
    if (!window.speechSynthesis) {
        console.error('Speech synthesis not supported in this browser.');
        return null;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    const startSpeaking = () => {
        const voices = window.speechSynthesis.getVoices();
        const currentLng = i18n.language || 'en';
        const langPrefix = currentLng.split('-')[0].toLowerCase();

        const localeMap = {
            'en': 'en-US',
            'hi': 'hi-IN',
            'kn': 'kn-IN',
            'te': 'te-IN',
            'ta': 'ta-IN',
            'bn': 'bn-IN',
            'mr': 'mr-IN'
        };

        const targetLocale = (localeMap[langPrefix] || currentLng).toLowerCase();
        
        // Try to find the best matching voice
        // 1. Exact match (case-insensitive)
        // 2. Language prefix match (e.g. 'kn' matching 'kn-IN' or vice versa)
        // 3. Fallback to English
        const voice = voices.find(v => v.lang.toLowerCase() === targetLocale) || 
                      voices.find(v => v.lang.toLowerCase().startsWith(langPrefix)) ||
                      voices.find(v => langPrefix.startsWith(v.lang.toLowerCase())) ||
                      voices.find(v => v.lang.toLowerCase().startsWith('en'));

        if (voice) {
            utterance.voice = voice;
            utterance.lang = voice.lang;
        } else {
            utterance.lang = targetLocale;
        }

        utterance.pitch = options.pitch || 1;
        utterance.rate = options.rate || 0.9;
        utterance.volume = options.volume || 1;

        window.speechSynthesis.speak(utterance);
    };

    if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.addEventListener('voiceschanged', startSpeaking, { once: true });
    } else {
        startSpeaking();
    }

    return utterance;
};

export const stopSpeaking = () => {
    if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }
};
