import { useMemo } from 'react';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

// 소리는 쓰지 않고, 책장을 넘길 때 아주 약한 진동만 줌
// 아이폰 무음 스위치가 켜져 있으면 진동도 끔
// - 아이폰은 무음 스위치로 진동이 꺼지지 않아서, 스위치 상태를 읽어 직접 막음
//   (읽기는 개발 빌드에서만 가능. Expo Go에서는 네이티브 모듈이 없어 건너뛰고 진동은 그대로 울림)
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

export function useSounds() {
  return useMemo(
    () => ({
      flip: () => {
        if (!silentSwitchOn) Haptics.selectionAsync().catch(() => {}); // 가장 약한 '톡' 진동
      },
      scratch: () => {}, // 글씨 쓸 때 소리 없음
    }),
    [],
  );
}
