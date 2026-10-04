export type Mood = 'happy' | 'excited' | 'sleepy' | 'sad';

export const moods: { key: Mood; label: string; emoji: string }[] = [
  { key: 'happy', label: '좋아요', emoji: '😊' },
  { key: 'excited', label: '신나요', emoji: '🥳' },
  { key: 'sleepy', label: '졸려요', emoji: '😴' },
  { key: 'sad', label: '슬퍼요', emoji: '😢' },
];
