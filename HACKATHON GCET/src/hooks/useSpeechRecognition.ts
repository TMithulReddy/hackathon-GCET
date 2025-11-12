import { useCallback, useEffect, useRef, useState } from 'react';

type Recognition = any;

export function useSpeechRecognition({ lang = 'en-IN' }: { lang?: string } = {}) {
  const [supported, setSupported] = useState<boolean>(false);
  const [listening, setListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const recRef = useRef<Recognition | null>(null);

  useEffect(() => {
    const SR: any = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SR) return;
    setSupported(true);
    const rec = new SR();
    rec.lang = lang;
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e: any) => {
      const text = e.results?.[0]?.[0]?.transcript ?? '';
      setTranscript(text);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
  }, [lang]);

  const start = useCallback(() => {
    if (!recRef.current) return;
    setTranscript('');
    setListening(true);
    try { recRef.current.start(); } catch {}
  }, []);

  const stop = useCallback(() => {
    if (!recRef.current) return;
    try { recRef.current.stop(); } catch {}
  }, []);

  return { supported, listening, transcript, start, stop };
}


