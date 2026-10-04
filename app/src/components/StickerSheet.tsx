import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CATEGORY_LABELS, STICKERS, categories } from '../stickers';
import { theme } from '../theme';

const { color, font } = theme;
const LEFT = 54; // 스프링에 가려지지 않게 비워두는 왼쪽 여백

// 스티커 고르기: 아래에서 올라오는 판 (분류 칩 + 스티커 칸)
export function StickerSheet({ onPick, onClose }: { onPick: (key: string) => void; onClose: () => void }) {
  const cats = categories();
  const [cat, setCat] = useState(cats[0]);
  const list = STICKERS.filter((s) => s.category === cat);

  return (
    <View style={s.sheet}>
      <View style={s.head}>
        <Text style={s.title}>스티커 고르기</Text>
        <Pressable onPress={onClose} style={s.close} accessibilityRole="button" accessibilityLabel="스티커 판 닫기">
          <Text style={s.closeText}>닫기 ✕</Text>
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipScroll} contentContainerStyle={s.chips}>
        {cats.map((c) => (
          <Pressable key={c} onPress={() => setCat(c)} style={[s.chip, c === cat && s.chipOn]} accessibilityRole="button">
            <Text style={[s.chipText, c === cat && s.chipTextOn]}>{CATEGORY_LABELS[c] ?? c}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={s.grid}>
        {list.map((st) => (
          <Pressable
            key={st.key}
            onPress={() => onPick(st.key)}
            style={({ pressed }) => [s.cell, pressed && { backgroundColor: color.accentSoft }]}
            accessibilityRole="button"
            accessibilityLabel={`스티커 ${st.key}`}
          >
            <Image source={st.src} style={s.thumb} resizeMode="contain" />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  sheet: {
    position: 'absolute', left: 0, right: 0, bottom: 0, height: '56%', backgroundColor: color.paper,
    borderTopLeftRadius: 20, borderTopRightRadius: 20, borderTopWidth: 1.5, borderColor: color.rule,
    shadowColor: '#6b5a3e', shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: -4 }, elevation: 12,
  },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: LEFT, paddingRight: 14, paddingTop: 12 },
  title: { fontFamily: font.bold, fontSize: 24, color: color.text },
  close: { minHeight: theme.minTouch, justifyContent: 'center', paddingHorizontal: 14, borderRadius: theme.radius.pill, backgroundColor: color.accentSoft },
  closeText: { fontFamily: font.bold, fontSize: 18, color: color.text },
  chipScroll: { flexGrow: 0 },
  chips: { paddingLeft: LEFT, paddingRight: 14, gap: 8, paddingVertical: 4 },
  chip: { minHeight: 40, justifyContent: 'center', paddingHorizontal: 16, borderRadius: theme.radius.pill, borderWidth: 1.5, borderColor: color.rule },
  chipOn: { backgroundColor: color.accent, borderColor: color.accent },
  chipText: { fontFamily: font.regular, fontSize: 19, color: color.textSoft },
  chipTextOn: { fontFamily: font.bold, color: color.text },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingLeft: LEFT - 8, paddingRight: 8, paddingVertical: 8 },
  cell: { width: '33.33%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 14 },
  thumb: { width: '88%', height: '88%' },
});
