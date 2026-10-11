// 오늘의 이모지: 사용자가 키보드에서 직접 고른 이모지를 그대로 저장함 (예전 버전의 이름표도 읽어줌)
export type Mood = string;

const LEGACY: Record<string, string> = { happy: '😊', excited: '🥳', sleepy: '😴', sad: '😢' };
export const moodEmoji = (m?: string) => (m ? LEGACY[m] ?? m : '');

// 입력된 글자에서 마지막 이모지 하나만 남김 (새로 고르면 이전 것을 바꿔줌)
export function lastEmoji(text: string): string {
  const Seg = (Intl as { Segmenter?: new (l?: string, o?: object) => { segment(s: string): Iterable<{ segment: string }> } }).Segmenter;
  const parts = Seg ? Array.from(new Seg(undefined, { granularity: 'grapheme' }).segment(text), (x) => x.segment) : Array.from(text);
  return parts.filter((c) => c.trim()).pop() ?? '';
}
