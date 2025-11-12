export type TTSOptions = {
  lang: string; // IETF BCP 47, e.g. "te-IN"
  rate?: number;
  pitch?: number;
  voiceName?: string;
};

// Map app language codes to suitable TTS locales
export function getTTSLocale(appLanguage: string): string {
  const map: Record<string, string> = {
    en: "en-IN",
    hi: "hi-IN",
    te: "te-IN",
    ta: "ta-IN",
    kn: "kn-IN",
    ml: "ml-IN",
    mr: "mr-IN",
    bn: "bn-IN",
    ur: "ur-IN",
    or: "or-IN",
    gu: "gu-IN",
    pa: "pa-IN",
  };
  // Use exact match, else fallback to regional English India, then generic English
  return map[appLanguage] || "en-IN";
}

function pickVoiceForLocale(locale: string): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices?.() || [];
  if (!voices.length) return null;
  // Prefer exact locale, then language-only match
  const exact = voices.find(v => v.lang?.toLowerCase() === locale.toLowerCase());
  if (exact) return exact;
  const base = locale.split("-")?.[0];
  const langMatch = voices.find(v => v.lang?.toLowerCase().startsWith(base.toLowerCase()));
  return langMatch || null;
}

export function speak(message: string, options: TTSOptions) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const utterance = new SpeechSynthesisUtterance(message);
  utterance.lang = options.lang;
  utterance.rate = options.rate ?? 0.95;
  utterance.pitch = options.pitch ?? 1;

  const maybeSetVoice = () => {
    const voice = options.voiceName
      ? (window.speechSynthesis.getVoices?.() || []).find(v => v.name === options.voiceName) || null
      : pickVoiceForLocale(options.lang);
    if (voice) utterance.voice = voice;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  // If voices not loaded yet, wait for the event
  if ((window.speechSynthesis.getVoices?.() || []).length === 0) {
    const handler = () => { maybeSetVoice(); window.speechSynthesis.removeEventListener("voiceschanged", handler as any); };
    window.speechSynthesis.addEventListener("voiceschanged", handler as any);
    // Also try once after a short delay as a fallback
    setTimeout(maybeSetVoice, 200);
  } else {
    maybeSetVoice();
  }
}

// Helper: speak with app language code directly
export function speakWithLanguage(message: string, appLanguage: string, options?: Omit<TTSOptions, "lang">) {
  const lang = getTTSLocale(appLanguage);
  speak(message, { lang, rate: options?.rate, pitch: options?.pitch, voiceName: options?.voiceName });
}


