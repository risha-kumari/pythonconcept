const NATURAL_VOICE_PRIORITY = [
  'natural',
  'neural',
  'online',
  'google uk english male',
  'google us english',
  'microsoft guy',
  'microsoft andrew',
  'microsoft brian',
  'microsoft david',
  'daniel',
  'alex',
  'samantha',
  'aaron',
  'arthur',
  'oliver',
];

let cachedCleanVoice: SpeechSynthesisVoice | null = null;

export function getConsistentCleanVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  if (cachedCleanVoice) return cachedCleanVoice;

  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  const englishVoices = voices.filter((v) => v.lang.toLowerCase().startsWith('en'));
  const pool = englishVoices.length ? englishVoices : voices;

  for (const hint of NATURAL_VOICE_PRIORITY) {
    const match = pool.find((v) => v.name.toLowerCase().includes(hint));
    if (match) {
      cachedCleanVoice = match;
      return match;
    }
  }

  cachedCleanVoice = pool[0];
  return cachedCleanVoice;
}

export function stopPureSpeech(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

export function speakPureEnglish(
  text: string,
  rateMultiplier = 1,
  onEnd?: () => void,
): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();

  const voice = getConsistentCleanVoice();
  const utterance = new SpeechSynthesisUtterance(text);
  if (voice) utterance.voice = voice;
  utterance.lang = voice?.lang || 'en-US';
  // Keep pitch strictly at 1.0 so the voice stays natural, pure, and un-distorted
  utterance.rate = Math.min(1.45, Math.max(0.75, 0.96 * rateMultiplier));
  utterance.pitch = 1.0;
  utterance.volume = 1;
  if (onEnd) {
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
  }
  window.speechSynthesis.speak(utterance);
}

// Backwards-compatible aliases used in LearningView
export const stopMaleSpeech = stopPureSpeech;
export const speakWithMaleVoice = speakPureEnglish;
export const getConsistentMaleVoice = getConsistentCleanVoice;
