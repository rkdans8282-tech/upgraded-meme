import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PaperTexture } from './PaperTexture';
import { theme } from '../theme';

const { color, font } = theme;

// 공책 표지: 연한 베이지, 스티치 선, 고무 밴드, 가운데 이름표
export function Cover({ onOpen }: { onOpen: () => void }) {
  return (
    <Pressable style={s.cover} onPress={onOpen} accessibilityRole="button" accessibilityLabel="다이어리 펼치기">
      <PaperTexture />
      <View style={s.stitch} pointerEvents="none" />
      <View style={s.band} pointerEvents="none" />
      <View style={s.label}>
        <PaperTexture />
        <Text style={s.title}>Diary</Text>
        <View style={s.rule} />
        <Text style={s.year}>{new Date().getFullYear()}</Text>
      </View>
      <View style={s.openBtn}>
        <Text style={s.openText}>펼치기 ›</Text>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  cover: {
    flex: 1, backgroundColor: color.cover, borderTopRightRadius: 14, borderBottomRightRadius: 14,
    overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
  },
  stitch: {
    position: 'absolute', left: 74, right: 16, top: 16, bottom: 16, borderRadius: 8,
    borderWidth: 1.5, borderStyle: 'dashed', borderColor: color.coverDark,
  },
  band: { position: 'absolute', right: 40, top: 0, bottom: 0, width: 16, backgroundColor: color.coverDark, opacity: 0.7 },
  label: {
    backgroundColor: color.paper, borderRadius: 6, paddingVertical: 22, paddingHorizontal: 44,
    alignItems: 'center', overflow: 'hidden', borderWidth: 1.5, borderColor: color.coverDark,
    marginLeft: 40,
  },
  title: { fontFamily: font.bold, fontSize: 46, color: color.text, letterSpacing: 2 },
  rule: { width: 56, height: 2, backgroundColor: color.coverDark, marginVertical: 8 },
  year: { fontFamily: font.regular, fontSize: 22, color: color.textSoft },
  openBtn: {
    position: 'absolute', bottom: 34, left: 90, right: 70, alignItems: 'center',
  },
  openText: {
    fontFamily: font.bold, fontSize: 22, color: color.text, backgroundColor: color.paper, overflow: 'hidden',
    paddingHorizontal: 30, paddingVertical: 12, borderRadius: theme.radius.pill,
  },
});
