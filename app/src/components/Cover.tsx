import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Chick } from './Chick';
import { PaperTexture } from './PaperTexture';
import { theme } from '../theme';

const { color, font } = theme;

// 공책 표지: 병아리가 가운데에 크게
export function Cover({ onOpen, chickSize }: { onOpen: () => void; chickSize: number }) {
  return (
    <Pressable style={s.cover} onPress={onOpen} accessibilityRole="button" accessibilityLabel="공책 펼치기">
      <PaperTexture opacity={1.6} />
      <View style={s.band} pointerEvents="none" />
      <View style={s.center}>
        <Chick mood="happy" size={chickSize} />
        <View style={s.label}>
          <PaperTexture />
          <Text style={s.title}>삐약일기</Text>
          <Text style={s.subtitle}>오늘도 콕콕 적어봐요</Text>
        </View>
      </View>
      <View style={s.openBtn}>
        <Text style={s.openText}>펼치기 ›</Text>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  cover: {
    flex: 1, backgroundColor: color.yellow, borderTopRightRadius: 14, borderBottomRightRadius: 14,
    overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
  },
  band: { position: 'absolute', right: 26, top: 0, bottom: 0, width: 14, backgroundColor: color.yolk, opacity: 0.55 },
  center: { alignItems: 'center', justifyContent: 'center' },
  label: {
    marginTop: 8, backgroundColor: color.paper, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 30,
    alignItems: 'center', overflow: 'hidden', borderWidth: 2, borderColor: color.yolk,
  },
  title: { fontFamily: font.bold, fontSize: 40, color: color.text },
  subtitle: { fontFamily: font.regular, fontSize: 18, color: color.textSoft, marginTop: -4 },
  openBtn: {
    position: 'absolute', bottom: 28, minHeight: 52, minWidth: 180, borderRadius: theme.radius.pill,
    backgroundColor: color.paper, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28,
  },
  openText: { fontFamily: font.bold, fontSize: 24, color: color.text },
});
