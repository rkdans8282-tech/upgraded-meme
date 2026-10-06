import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';

const { color, font } = theme;

// 공책 표지: 검은 가죽 + 핑크색 영문 글씨 + 얇은 스티치 선
export function Cover({ onOpen }: { onOpen: () => void }) {
  return (
    <Pressable style={s.cover} onPress={onOpen} accessibilityRole="button" accessibilityLabel="다이어리 펼치기">
      <View style={s.stitch} pointerEvents="none" />
      <View style={s.title}>
        <Text style={s.diary}>Diary</Text>
        <View style={s.rule} />
        <Text style={s.year}>{new Date().getFullYear()}</Text>
      </View>
      <View style={s.openBtn}>
        <Text style={s.openText}>OPEN</Text>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  cover: {
    flex: 1, backgroundColor: color.coverBlack, borderTopRightRadius: 2, borderBottomRightRadius: 2,
    overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
  },
  stitch: {
    position: 'absolute', left: 64, right: 14, top: 14, bottom: 14,
    borderWidth: 1, borderStyle: 'dashed', borderColor: '#3A3A3A',
  },
  title: { alignItems: 'center', marginLeft: 36 },
  diary: { fontFamily: font.serif, fontSize: 54, color: color.pink, letterSpacing: 3 },
  rule: { width: 44, height: 1, backgroundColor: color.pink, marginVertical: 14, opacity: 0.8 },
  year: { fontFamily: font.serif, fontSize: 16, color: color.pink, letterSpacing: 6, opacity: 0.85 },
  openBtn: { position: 'absolute', bottom: 38, left: 64, right: 14, alignItems: 'center' },
  openText: {
    fontFamily: font.serif, fontSize: 13, letterSpacing: 4, color: color.pink, borderWidth: 1, borderColor: color.pink,
    paddingHorizontal: 26, paddingVertical: 10, borderRadius: theme.radius.pill, overflow: 'hidden',
  },
});
