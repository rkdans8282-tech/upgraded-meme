import { StyleSheet, View } from 'react-native';

export const SLOT = 22; // 스프링 한 칸 높이 (겉 스프링과 같은 값)

// 속지 왼쪽의 스프링 구멍 (책 겉 스프링과 같은 개수)
export function PageHoles({ holes }: { holes: number }) {
  return (
    <View style={s.holes} pointerEvents="none">
      {Array.from({ length: holes }, (_, i) => (
        <View key={i} style={s.slot}>
          <View style={s.hole} />
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  holes: { position: 'absolute', left: 14, top: 0, bottom: 0, width: 18, justifyContent: 'space-around' },
  slot: { height: SLOT, alignItems: 'center', justifyContent: 'center' },
  hole: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#E2E2E2' },
});
