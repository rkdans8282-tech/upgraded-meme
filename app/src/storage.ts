import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Mood } from './moods';
import type { Sticker } from './stickers';
import type { Stroke } from './strokes';
import type { Layout } from './layouts';

export type Entry = { mood?: Mood; text?: string; stickers?: Sticker[]; strokes?: Stroke[]; layout?: Layout };
export type Entries = Record<string, Entry>; // { "2026-10-04": { text }, "memo:3": { strokes } }

// 다이어리마다 따로 저장: 'ppiyak:entries:<다이어리 id>'
// (예전 한 권짜리 버전의 'ppiyak:entries'는 첫 다이어리로 옮겨 담음 → diaries.ts)
export const LEGACY_KEY = 'ppiyak:entries';
const keyOf = (diaryId: string) => `${LEGACY_KEY}:${diaryId}`;

export async function loadEntries(diaryId: string): Promise<Entries> {
  try {
    return JSON.parse((await AsyncStorage.getItem(keyOf(diaryId))) ?? '{}');
  } catch {
    return {};
  }
}

export async function saveEntries(diaryId: string, entries: Entries) {
  try {
    await AsyncStorage.setItem(keyOf(diaryId), JSON.stringify(entries));
  } catch {}
}

export async function removeEntries(diaryId: string) {
  try {
    await AsyncStorage.removeItem(keyOf(diaryId));
  } catch {}
}
