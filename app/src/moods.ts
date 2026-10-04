import type { ChickMood } from './chickSvgs';

export const moods: { key: ChickMood; label: string; say: string }[] = [
  { key: 'happy', label: '좋아요', say: '오늘 기분 좋구나! 삐약!' },
  { key: 'excited', label: '신나요', say: '와아! 같이 신난다 삐약!' },
  { key: 'sleepy', label: '졸려요', say: '푹 쉬어도 괜찮아, 삐약...' },
  { key: 'sad', label: '울적해요', say: '괜찮아, 내가 옆에 있을게 삐약.' },
];
