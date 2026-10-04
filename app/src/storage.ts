import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ChickMood } from './chickSvgs';

export type Entry = { mood?: ChickMood; text?: string };
export type Entries = Record<string, Entry>; // { "2026-10-04": { mood, text } }

const KEY = 'ppiyak:entries';
const OLD_MOODS = 'ppiyak:moods'; // 예전 버전(기분만 저장)

export async function loadEntries(): Promise<Entries> {
  try {
    const entries: Entries = JSON.parse((await AsyncStorage.getItem(KEY)) ?? '{}');
    const old: Record<string, ChickMood> = JSON.parse((await AsyncStorage.getItem(OLD_MOODS)) ?? '{}');
    for (const [day, mood] of Object.entries(old)) entries[day] = { mood, ...entries[day] };
    return entries;
  } catch {
    return {};
  }
}

export async function saveEntries(entries: Entries) {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(entries));
  } catch {}
}
