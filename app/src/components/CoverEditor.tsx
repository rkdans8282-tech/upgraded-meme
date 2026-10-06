import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CoverArt, TITLE_FONT_LABEL } from './Cover';
import { DiaryPage } from './DiaryPage';
import { COVER_ASPECT, COVER_COLORS, CoverStyle, Diary, TITLE_COLORS, TitleFont } from '../diaries';
import type { Sticker } from '../stickers';
import type { Stroke } from '../strokes';
import { theme } from '../theme';

const { font } = theme;
const noop = () => {};
const HEX = /^#?[0-9a-fA-F]{6}$/;

function Swatches({ colors, value, onPick }: { colors: string[]; value: string; onPick: (c: string) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.swatchRow}>
      {colors.map((c) => (
        <Pressable key={c} onPress={() => onPick(c)} accessibilityRole="button" accessibilityLabel={`색 ${c}`} style={[s.swatchWrap, value.toLowerCase() === c.toLowerCase() && s.swatchOn]}>
          <View style={[s.swatch, { backgroundColor: c }]} />
        </Pressable>
      ))}
    </ScrollView>
  );
}

type Props = { initial: Diary; isNew: boolean; onSave: (d: Diary) => void; onCancel: () => void };

// 표지 꾸미기: 색·제목·글꼴을 고르고, 스티커·사진·손글씨로 마음대로 꾸밈
export function CoverEditor({ initial, isNew, onSave, onCancel }: Props) {
  const [d, setD] = useState<Diary>(initial);
  const [area, setArea] = useState({ w: 0, h: 0 });
  const [hex, setHex] = useState(initial.cover.color);
  const setCover = useCallback((p: Partial<CoverStyle>) => setD((x) => ({ ...x, cover: { ...x.cover, ...p } })), []);

  const cw = Math.floor(Math.min(area.w - 24, (area.h - 12) * COVER_ASPECT));
  const ch = Math.round(cw / COVER_ASPECT);
  const entry = useMemo(() => ({ stickers: d.cover.stickers, strokes: d.cover.strokes }), [d.cover.stickers, d.cover.strokes]);
  const onStickers = useCallback((_: string, stickers: Sticker[]) => setCover({ stickers }), [setCover]);
  const onStrokes = useCallback((_: string, strokes: Stroke[]) => setCover({ strokes }), [setCover]);
  const items = useMemo(() => ['pen', 'sticker', 'photo', 'tape'] as const, []);

  return (
    <SafeAreaView style={s.root}>
      <View style={s.bar}>
        <Pressable onPress={onCancel} hitSlop={10} accessibilityRole="button" accessibilityLabel="취소"><Text style={s.barText}>취소</Text></Pressable>
        <Text style={s.barTitle}>{isNew ? '새 다이어리 만들기' : '표지 꾸미기'}</Text>
        <Pressable onPress={() => onSave({ ...d, title: d.title.trim() || 'Diary' })} hitSlop={10} accessibilityRole="button" accessibilityLabel="완료">
          <Text style={[s.barText, { color: theme.color.pink }]}>완료</Text>
        </Pressable>
      </View>

      <View style={s.canvasArea} onLayout={(e) => setArea({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
        {cw > 0 && (
          <View style={{ width: cw, height: ch }}>
            <CoverArt cover={d.cover} title={d.title} year={d.year} w={cw} h={ch} bare />
            {/* 스티커·사진·손글씨는 아래 리모컨(둥근 버튼)으로 붙임 */}
            <View style={StyleSheet.absoluteFill}>
              <DiaryPage
                dayKey="cover"
                entry={entry}
                transparent
                remoteItems={[...items]}
                onText={noop}
                onStickers={onStickers}
                onStrokes={onStrokes}
                onScratch={noop}
                onCalendar={noop}
                onSave={noop}
                holes={0}
              />
            </View>
          </View>
        )}
      </View>

      <ScrollView style={s.panel} contentContainerStyle={{ padding: 14, paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
        <Text style={s.label}>표지 색</Text>
        <Swatches colors={COVER_COLORS} value={d.cover.color} onPick={(c) => { setCover({ color: c }); setHex(c); }} />
        <TextInput
          style={s.hex}
          value={hex}
          onChangeText={(t) => {
            setHex(t);
            if (HEX.test(t)) setCover({ color: t.startsWith('#') ? t : `#${t}` });
          }}
          autoCapitalize="none"
          maxLength={7}
          placeholder="#RRGGBB"
          placeholderTextColor="#666"
          accessibilityLabel="표지 색 직접 입력"
        />

        <Text style={s.label}>글자 색</Text>
        <Swatches colors={TITLE_COLORS} value={d.cover.titleColor} onPick={(c) => setCover({ titleColor: c })} />

        <Text style={s.label}>제목</Text>
        <TextInput style={s.input} value={d.title} onChangeText={(t) => setD((x) => ({ ...x, title: t }))} maxLength={24} placeholder="Diary" placeholderTextColor="#666" accessibilityLabel="다이어리 제목" />
        <View style={s.chips}>
          {(['serif', 'sans', 'hand'] as TitleFont[]).map((f) => (
            <Pressable key={f} onPress={() => setCover({ titleFont: f })} style={[s.chip, d.cover.titleFont === f && s.chipOn]} accessibilityRole="button">
              <Text style={[s.chipText, d.cover.titleFont === f && { color: '#141414' }]}>{TITLE_FONT_LABEL[f]}</Text>
            </Pressable>
          ))}
          <Pressable onPress={() => setCover({ stitch: !d.cover.stitch })} style={[s.chip, d.cover.stitch && s.chipOn]} accessibilityRole="button" accessibilityLabel="스티치 선">
            <Text style={[s.chipText, d.cover.stitch && { color: '#141414' }]}>점선</Text>
          </Pressable>
        </View>

        <Text style={s.label}>연도</Text>
        {isNew ? (
          <View style={s.chips}>
            <Pressable onPress={() => setD((x) => ({ ...x, year: x.year - 1 }))} style={s.chip} accessibilityRole="button" accessibilityLabel="연도 줄이기"><Text style={s.chipText}>－</Text></Pressable>
            <Text style={s.year}>{d.year}</Text>
            <Pressable onPress={() => setD((x) => ({ ...x, year: x.year + 1 }))} style={s.chip} accessibilityRole="button" accessibilityLabel="연도 늘리기"><Text style={s.chipText}>＋</Text></Pressable>
          </View>
        ) : (
          <Text style={s.year}>{d.year} <Text style={s.hint}>(만든 뒤에는 바꿀 수 없어요)</Text></Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.color.desk },
  bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 12 },
  barTitle: { fontFamily: font.bold, fontSize: 16, color: '#fff' },
  barText: { fontFamily: font.bold, fontSize: 16, color: '#BDBDBD' },
  canvasArea: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 200 },
  panel: { flexGrow: 0, maxHeight: 230, backgroundColor: '#161616', borderTopWidth: 1, borderTopColor: '#2A2A2A' },
  label: { fontFamily: font.bold, fontSize: 12.5, color: '#9A9A9A', marginTop: 10, marginBottom: 6 },
  swatchRow: { gap: 8, paddingVertical: 2 },
  swatchWrap: { padding: 3, borderRadius: 20, borderWidth: 2, borderColor: 'transparent' },
  swatchOn: { borderColor: '#fff' },
  swatch: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: '#444' },
  hex: { marginTop: 8, minHeight: 38, borderRadius: 10, backgroundColor: '#242424', color: '#fff', paddingHorizontal: 12, fontFamily: font.regular, fontSize: 14, width: 120 },
  input: { minHeight: 44, borderRadius: 10, backgroundColor: '#242424', color: '#fff', paddingHorizontal: 12, fontFamily: font.regular, fontSize: 16 },
  chips: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' },
  chip: { minHeight: 38, minWidth: 44, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center', borderRadius: 999, backgroundColor: '#2A2A2A' },
  chipOn: { backgroundColor: theme.color.pink },
  chipText: { fontFamily: font.bold, fontSize: 14, color: '#fff' },
  year: { fontFamily: font.bold, fontSize: 17, color: '#fff', minWidth: 60, textAlign: 'center' },
  hint: { fontFamily: font.regular, fontSize: 12, color: '#777' },
});
