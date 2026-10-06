import { useMemo, useRef } from 'react';
import { Platform } from 'react-native';
import { useAudioPlayer, AudioPlayer, setAudioModeAsync } from 'expo-audio';
import * as Haptics from 'expo-haptics';

// 아이폰 무음 스위치가 켜져 있으면 소리와 진동을 모두 끔
// - 소리: 오디오 세션이 무음 스위치를 따르도록 설정
// - 진동: 아이폰은 무음 스위치로 진동이 꺼지지 않아서, 스위치 상태를 읽어 직접 막음
//   (읽기는 개발 빌드에서만 가능. Expo Go에서는 네이티브 모듈이 없어 건너뛰고 진동은 그대로 울림)
setAudioModeAsync({ playsInSilentMode: false }).catch(() => {});
let silentSwitchOn = false;
if (Platform.OS === 'ios') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { VolumeManager } = require('react-native-volume-manager');
    VolumeManager.addSilentListener((st: { isMuted: boolean }) => {
      silentSwitchOn = st.isMuted;
    });
  } catch {}
}

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
        if (!silentSwitchOn) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
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
