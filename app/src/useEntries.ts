import { useCallback, useEffect, useRef, useState } from 'react';
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

  return { entries, ready, update };
}
