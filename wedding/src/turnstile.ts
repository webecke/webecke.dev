import { useCallback, useEffect, useRef, useState } from 'react';

interface TurnstileApi {
  render(el: HTMLElement, opts: Record<string, unknown>): string;
  reset(id: string): void;
  remove(id: string): void;
}
declare global {
  interface Window { turnstile?: TurnstileApi }
}

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
let scriptPromise: Promise<TurnstileApi> | null = null;

function loadScript(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  scriptPromise ??= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = SCRIPT_SRC;
    s.async = true;
    s.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error('Turnstile missing')));
    s.onerror = () => { scriptPromise = null; reject(new Error('Turnstile failed to load')); };
    document.head.appendChild(s);
  });
  return scriptPromise;
}

/**
 * Cloudflare Turnstile, the free "are you a person?" check. It usually runs
 * invisibly; it only shows a checkbox when Cloudflare isn't sure.
 * `getToken` waits for a token (up to 15 seconds) and hands it over once,
 * since each token can only be used for one submission.
 */
export function useTurnstile() {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const token = useRef<string | null>(null);
  const waiters = useRef<Array<(t: string | null) => void>>([]);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/config');
        const { turnstileSiteKey } = (await res.json()) as { turnstileSiteKey: string | null };
        if (!turnstileSiteKey) throw new Error('No Turnstile site key configured');
        const api = await loadScript();
        if (cancelled || !containerRef.current) return;
        widgetId.current = api.render(containerRef.current, {
          sitekey: turnstileSiteKey,
          appearance: 'interaction-only',
          size: 'flexible',
          callback: (t: string) => {
            token.current = t;
            waiters.current.splice(0).forEach((w) => w(t));
          },
          'expired-callback': () => { token.current = null; },
          'error-callback': () => { token.current = null; },
        });
      } catch (err) {
        console.warn(err);
        if (!cancelled) setUnavailable(true);
        waiters.current.splice(0).forEach((w) => w(null));
      }
    })();
    return () => {
      cancelled = true;
      if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current);
      widgetId.current = null;
    };
  }, []);

  const getToken = useCallback((): Promise<string | null> => {
    const take = (t: string | null) => { token.current = null; return t; };
    if (token.current) return Promise.resolve(take(token.current));
    if (unavailable) return Promise.resolve(null);
    return new Promise((resolve) => {
      const timer = setTimeout(() => resolve(null), 15_000);
      waiters.current.push((t) => { clearTimeout(timer); resolve(take(t)); });
    });
  }, [unavailable]);

  const reset = useCallback(() => {
    token.current = null;
    if (widgetId.current && window.turnstile) window.turnstile.reset(widgetId.current);
  }, []);

  return { containerRef, getToken, reset };
}
