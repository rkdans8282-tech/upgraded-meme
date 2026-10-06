import { useMemo, useRef } from 'react';
import { useAudioPlayer, AudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';

const FLIP_VOLUME = 0.35; // 책장 넘기는 소리 크기 (0~1, 낮출수록 작아짐)

const play = (p: AudioPlayer, volume = 1) => {
  try {
    p.volume = volume;
    p.seekTo(0);
    p.play();
  } catch {}
};

// 책장 넘기는 소리 + 연필 사각사각 소리
export function useSounds() {
  const flipP = useAudioPlayer(require('../assets/sounds/page_flip.wav'));
  const s1 = useAudioPlayer(require('../assets/sounds/scratch1.wav'));
  const s2 = useAudioPlayer(require('../assets/sounds/scratch2.wav'));
  const s3 = useAudioPlayer(require('../assets/sounds/scratch3.wav'));
  const idx = useRef(0);
  const last = useRef(0);

  return useMemo(
    () => ({
      flip: () => {
        play(flipP, FLIP_VOLUME);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      },
      scratch: () => {
        const now = Date.now();
        if (now - last.current < 70) return; // 너무 빨리 겹치지 않게
        last.current = now;
        play([s1, s2, s3][idx.current++ % 3]);
      },
    }),
    [flipP, s1, s2, s3],
  );
}
