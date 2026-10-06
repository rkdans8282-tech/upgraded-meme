import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { Entries, Entry, loadEntries, saveEntries } from './storage';

export function useEntries() {
  const [entries, setEntries] = useState<Entries>({});
  const [ready, setReady] = useState(false);
  const latest = useRef<Entries>({});
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    loadEntries().then((e) => {
      latest.current = e;
      setEntries(e);
      setReady(true);
    });
  }, []);

  const update = useCallback((day: string, patch: Partial<Entry>) => {
    const next = { ...latest.current, [day]: { ...latest.current[day], ...patch } };
    latest.current = next;
    setEntries(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => saveEntries(latest.current), 400); // 타이핑 멈추면 저장
  }, []);

  // 지금 바로 저장 (저장 버튼, 앱이 뒤로 갈 때)
  const flush = useCallback(async () => {
    clearTimeout(timer.current);
    await saveEntries(latest.current);
  }, []);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (st) => {
      if (st !== 'active') flush();
    });
    return () => sub.remove();
  }, [flush]);

  return { entries, ready, update, flush };
}
