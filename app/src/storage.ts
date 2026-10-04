import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ChickMood } from './chickSvgs';

const KEY = 'ppiyak:moods'; // { "2026-10-04": "happy" }

export const todayKey = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

export async function loadMoods(): Promise<Record<string, ChickMood>> {
  try {
    return JSON.parse((await AsyncStorage.getItem(KEY)) ?? '{}');
  } catch {
    return {};
  }
}

export async function saveMood(date: string, mood: ChickMood) {
  const all = await loadMoods();
  all[date] = mood;
  await AsyncStorage.setItem(KEY, JSON.stringify(all));
}
