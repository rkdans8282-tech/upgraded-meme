import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { Entries, Entry, loadEntries, saveEntries } from './storage';

// 다이어리 한 권의 기록 (날짜별 일기 + 공책 쪽)
export function useEntries(diaryId: string) {
  const [entries, setEntries] = useState<Entries>({});
  const [ready, setReady] = useState(false);
  const latest = useRef<Entries>({});
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    loadEntries(diaryId).then((e) => {
      latest.current = e;
      setEntries(e);
      setReady(true);
    });
  }, [diaryId]);

  const update = useCallback(
    (day: string, patch: Partial<Entry>) => {
      const next = { ...latest.current, [day]: { ...latest.current[day], ...patch } };
      latest.current = next;
      setEntries(next);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => saveEntries(diaryId, latest.current), 400); // 타이핑 멈추면 저장
    },
    [diaryId],
  );

  // 지금 바로 저장 (저장 버튼, 앱이 뒤로 갈 때, 책장으로 나갈 때)
  const flush = useCallback(async () => {
    clearTimeout(timer.current);
    await saveEntries(diaryId, latest.current);
  }, [diaryId]);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (st) => {
      if (st !== 'active') flush();
    });
    return () => {
      sub.remove();
      flush();
    };
  }, [flush]);

  return { entries, ready, update, flush };
}
