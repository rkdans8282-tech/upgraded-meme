import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Mood } from './moods';

export type Entry = { mood?: Mood; text?: string };
export type Entries = Record<string, Entry>; // { "2026-10-04": { mood, text } }

const KEY = 'ppiyak:entries'; // 이전 버전 데이터가 남도록 키 이름 유지

export async function loadEntries(): Promise<Entries> {
  try {
    return JSON.parse((await AsyncStorage.getItem(KEY)) ?? '{}');
  } catch {
    return {};
  }
}

export async function saveEntries(entries: Entries) {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(entries));
  } catch {}
}
