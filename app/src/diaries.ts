import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LEGACY_KEY, removeEntries } from './storage';
import { newId } from './stickers';
import type { Sticker } from './stickers';
import type { Stroke } from './strokes';

// 표지 꾸밈: 색·글자·글꼴·스티치 + 스티커/사진/손글씨 (좌표는 표지 크기 대비 비율)
export type TitleFont = 'serif' | 'sans' | 'hand';
export type CoverStyle = {
  color: string;
  titleColor: string;
  titleFont: TitleFont;
  stitch: boolean;
  stickers: Sticker[];
  strokes: Stroke[];
};
export type Diary = { id: string; title: string; year: number; cover: CoverStyle; createdAt: number };

export const COVER_ASPECT = 0.62; // 책장·꾸미기 화면에서 표지의 가로/세로
export const FREE_DIARIES = 1; // 무료로 만들 수 있는 권수

export const COVER_COLORS = ['#141414', '#2B2B33', '#E9DBC6', '#FFFFFF', '#F4A9C4', '#C23B4E', '#F2C48D', '#E8D36A', '#B5D8C0', '#2F5D50', '#A9C8F0', '#2E4A7D', '#C9B8E8', '#8B5E3C'];
export const TITLE_COLORS = ['#F4A9C4', '#FFFFFF', '#141414', '#E8D36A', '#C23B4E', '#2E4A7D', '#2F5D50', '#8B5E3C'];

export const defaultCover = (): CoverStyle => ({
  color: '#141414', titleColor: '#F4A9C4', titleFont: 'serif', stitch: true, stickers: [], strokes: [],
});
export const newDiary = (year = new Date().getFullYear()): Diary => ({
  id: newId(), title: 'Diary', year, cover: defaultCover(), createdAt: Date.now(),
});

const DIARIES_KEY = 'ppiyak:diaries';
const SLOTS_KEY = 'ppiyak:purchased'; // 결제해서 늘린 권수

// 앱을 처음 열 때: 저장된 다이어리가 없으면 첫 다이어리를 만들고, 예전 한 권짜리 데이터가 있으면 거기로 옮김
async function load(): Promise<{ diaries: Diary[]; purchased: number }> {
  let diaries: Diary[] = [];
  let purchased = 0;
  try {
    diaries = JSON.parse((await AsyncStorage.getItem(DIARIES_KEY)) ?? '[]');
    purchased = Number(await AsyncStorage.getItem(SLOTS_KEY)) || 0;
  } catch {}
  if (!diaries.length) {
    const first = newDiary();
    try {
      const legacy = await AsyncStorage.getItem(LEGACY_KEY);
      if (legacy) await AsyncStorage.setItem(`${LEGACY_KEY}:${first.id}`, legacy);
      await AsyncStorage.setItem(DIARIES_KEY, JSON.stringify([first]));
    } catch {}
    diaries = [first];
  }
  return { diaries, purchased };
}

export function useDiaries() {
  const [diaries, setDiaries] = useState<Diary[]>([]);
  const [purchased, setPurchased] = useState(0);
  const [ready, setReady] = useState(false);
  const latest = useRef<Diary[]>([]);

  useEffect(() => {
    load().then((r) => {
      latest.current = r.diaries;
      setDiaries(r.diaries);
      setPurchased(r.purchased);
      setReady(true);
    });
  }, []);

  const commit = useCallback((next: Diary[]) => {
    latest.current = next;
    setDiaries(next);
    AsyncStorage.setItem(DIARIES_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const add = useCallback((d: Diary) => commit([...latest.current, d]), [commit]);
  const update = useCallback((id: string, patch: Partial<Diary>) => commit(latest.current.map((d) => (d.id === id ? { ...d, ...patch } : d))), [commit]);
  const remove = useCallback(async (id: string) => {
    commit(latest.current.filter((d) => d.id !== id));
    await removeEntries(id);
  }, [commit]);

  // 새 다이어리를 만들 수 있는 권수 = 무료 1권 + 결제로 늘린 권수
  const slots = FREE_DIARIES + purchased;
  // TODO(결제): 실제 인앱결제(StoreKit/RevenueCat) 연결 전까지는 눌렀을 때 바로 권수를 늘리는 임시 동작
  const buySlot = useCallback(async () => {
    const next = purchased + 1;
    setPurchased(next);
    await AsyncStorage.setItem(SLOTS_KEY, String(next)).catch(() => {});
  }, [purchased]);

  return { diaries, ready, slots, canAdd: diaries.length < slots, add, update, remove, buySlot };
}
