import { useEffect, useState } from 'react';

/**
 * Stable signature of Ayah Lens QUL prefs so QUL verse rendering refetches when mushaf/tajweed changes.
 * Refreshes on mount and when the window gains focus (e.g. user changed Settings in Assistant).
 */
export function useAyahLensQulSignature(): string {
  const [sig, setSig] = useState('');

  useEffect(() => {
    let cancelled = false;

    const refresh = async () => {
      try {
        const s = await window.ayati.getAyahLensSettings();
        if (!cancelled) {
          setSig(
            `${s.qulMushafKey ?? ''}:${Boolean(s.qulTajweedEnabled)}:${Boolean(s.qulArabicEnabled)}`,
          );
        }
      } catch {
        if (!cancelled) setSig('');
      }
    };

    void refresh();
    const onFocus = () => void refresh();
    window.addEventListener('focus', onFocus);
    return () => {
      cancelled = true;
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  return sig;
}
