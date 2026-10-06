import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LAYOUTS, Layout, segments } from '../layouts';
import { theme } from '../theme';

const { color, font } = theme;
const LEFT = 54; // 스프링에 가려지지 않게 비워두는 왼쪽 여백

// 칸 나누기 모양 고르기: 아래에서 올라오는 판
export function LayoutSheet({ current, onPick, onClose }: { current: Layout; onPick: (l: Layout) => void; onClose: () => void }) {
  return (
    <View style={s.sheet}>
      <View style={s.head}>
        <Text style={s.title}>칸 나누기</Text>
        <Pressable onPress={onClose} style={s.close} accessibilityRole="button" accessibilityLabel="칸 나누기 닫기">
          <Text style={s.closeText}>닫기 ✕</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={s.grid}>
        {LAYOUTS.map((l) => (
          <Pressable key={l.key} onPress={() => onPick(l.key)} style={[s.cell, current === l.key && s.cellOn]} accessibilityRole="button" accessibilityLabel={l.label}>
            <View style={s.preview}>
              {segments(l.key).map(([x0, y0, x1, y1], i) => (
                <View
                  key={i}
                  style={{
                    position: 'absolute', backgroundColor: '#8A8A8A',
                    left: `${x0 * 100}%`, top: `${y0 * 100}%`,
                    width: x0 === x1 ? 1 : `${(x1 - x0) * 100}%`, height: y0 === y1 ? 1 : `${(y1 - y0) * 100}%`,
                  }}
                />
              ))}
            </View>
            <Text style={s.label}>{l.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  sheet: {
    position: 'absolute', left: 0, right: 0, bottom: 0, maxHeight: '60%', backgroundColor: color.paper,
    borderTopWidth: 1, borderColor: '#E4E4E4',
    shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 12, shadowOffset: { width: 0, height: -4 }, elevation: 12,
  },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: LEFT, paddingRight: 14, paddingTop: 12 },
  title: { fontFamily: font.bold, fontSize: 18, color: color.text },
  close: { minHeight: 40, justifyContent: 'center', paddingHorizontal: 14, borderRadius: theme.radius.pill, backgroundColor: color.accentSoft },
  closeText: { fontFamily: font.bold, fontSize: 14, color: color.text },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingLeft: LEFT - 6, paddingRight: 8, paddingVertical: 10 },
  cell: { width: '33.33%', padding: 6, alignItems: 'center' },
  cellOn: { backgroundColor: color.accentSoft },
  preview: { width: 56, height: 74, borderWidth: 1, borderColor: '#8A8A8A', backgroundColor: '#fff' },
  label: { fontFamily: font.regular, fontSize: 12, color: color.text, marginTop: 6, textAlign: 'center' },
});
