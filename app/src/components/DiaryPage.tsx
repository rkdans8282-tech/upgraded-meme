import { memo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Chick } from './Chick';
import { PaperTexture } from './PaperTexture';
import { moods } from '../moods';
import { labelOf } from '../dates';
import { theme } from '../theme';
import type { Entry } from '../storage';
import type { ChickMood } from '../chickSvgs';

const { color, font } = theme;
export const LINE = 38; // 줄 간격 = 글자 줄 높이

type Props = {
  dayKey: string;
  entry?: Entry;
  isToday: boolean;
  onText: (day: string, text: string) => void;
  onMood: (day: string, mood: ChickMood) => void;
  onScratch: () => void;
  onFlip: (dir: 1 | -1) => void;
  holes: number; // 스프링 구멍 개수 (책 겉 스프링과 같은 값)
};

// 공책 속지 한 장 = 하루
function DiaryPageBase({ dayKey, entry, isToday, onText, onMood, onScratch, onFlip, holes }: Props) {
  const [areaH, setAreaH] = useState(300);
  const [contentH, setContentH] = useState(0);
  const mood = entry?.mood;
  const total = Math.max(areaH, contentH + LINE);
  const lines = Math.ceil(total / LINE);

  return (
    <View style={s.page}>
      <PaperTexture />
      {/* 스프링 구멍 + 왼쪽 여백선 */}
      <View style={s.margin} pointerEvents="none" />
      <View style={s.holes} pointerEvents="none">
        {Array.from({ length: holes }, (_, i) => (
          <View key={i} style={s.holeSlot}>
            <View style={s.hole} />
          </View>
        ))}
      </View>

      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <Text style={s.date} numberOfLines={1}>{labelOf(dayKey)}</Text>
          <Text style={s.sub}>{isToday ? '오늘의 일기' : '그날의 일기'}</Text>
        </View>
        <Chick mood={mood ?? 'normal'} size={64} />
      </View>

      <ScrollView
        style={s.area}
        onLayout={(e) => setAreaH(e.nativeEvent.layout.height)}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ height: total }}>
          {Array.from({ length: lines }, (_, i) => (
            <View key={i} style={[s.rule, { top: (i + 1) * LINE - 8 }]} pointerEvents="none" />
          ))}
          <TextInput
            style={[s.input, { minHeight: areaH }]}
            multiline
            scrollEnabled={false}
            value={entry?.text ?? ''}
            onChangeText={(t) => {
              onScratch();
              onText(dayKey, t);
            }}
            onContentSizeChange={(e) => setContentH(e.nativeEvent.contentSize.height)}
            placeholder={'오늘은 어떤 하루였어?\n여기에 콕콕 적어봐 🐥'}
            placeholderTextColor="#C9B98F"
            selectionColor={color.yolk}
            textAlignVertical="top"
          />
        </View>
      </ScrollView>

      <View style={s.moodBar}>
        <View style={s.navRow}>
          <Pressable onPress={() => onFlip(-1)} style={s.navBtn} accessibilityRole="button" accessibilityLabel="이전 날 보기">
            <Text style={s.navText}>‹ 이전</Text>
          </Pressable>
          <Text style={s.moodTitle}>{isToday ? '오늘 기분' : '그날 기분'}</Text>
          {isToday ? (
            <View style={s.navBtn} />
          ) : (
            <Pressable onPress={() => onFlip(1)} style={s.navBtn} accessibilityRole="button" accessibilityLabel="다음 날 보기">
              <Text style={s.navText}>다음 ›</Text>
            </Pressable>
          )}
        </View>
        <View style={s.moodRow}>
          {moods.map((m) => {
            const on = mood === m.key;
            return (
              <Pressable
                key={m.key}
                onPress={() => onMood(dayKey, m.key)}
                accessibilityRole="button"
                accessibilityLabel={`기분 ${m.label}`}
                style={[s.moodBtn, on && s.moodBtnOn]}
              >
                <Chick mood={m.key} size={40} />
                <Text style={[s.moodLabel, on && s.moodLabelOn]}>{m.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

export const DiaryPage = memo(DiaryPageBase);

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: color.paper, borderTopRightRadius: 10, borderBottomRightRadius: 10, overflow: 'hidden' },
  margin: { position: 'absolute', left: 54, top: 0, bottom: 0, width: 2, backgroundColor: color.margin, opacity: 0.8 },
  holes: { position: 'absolute', left: 12, top: 0, bottom: 0, width: 16, justifyContent: 'space-around' },
  holeSlot: { height: 16, alignItems: 'center', justifyContent: 'center' },
  hole: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#B9A678', opacity: 0.55 },
  header: { flexDirection: 'row', alignItems: 'center', paddingLeft: 66, paddingRight: 10, paddingTop: 12 },
  date: { fontFamily: font.bold, fontSize: 26, color: color.text },
  sub: { fontFamily: font.regular, fontSize: 18, color: color.textSoft, marginTop: -2 },
  area: { flex: 1, marginTop: 4, paddingLeft: 68, paddingRight: 16 },
  rule: { position: 'absolute', left: -68, right: -16, height: 1.5, backgroundColor: color.rule },
  input: {
    fontFamily: font.regular, fontSize: 23, lineHeight: LINE, color: color.text,
    padding: 0, margin: 0, includeFontPadding: false,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
  },
  moodBar: { paddingLeft: 66, paddingRight: 12, paddingBottom: 12, paddingTop: 6 },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  navBtn: { minWidth: 72, minHeight: theme.minTouch, justifyContent: 'center' },
  navText: { fontFamily: font.bold, fontSize: 20, color: color.text },
  moodTitle: { fontFamily: font.bold, fontSize: 18, color: color.textSoft },
  moodRow: { flexDirection: 'row', gap: 6 },
  moodBtn: {
    flex: 1, minHeight: theme.minTouch + 24, alignItems: 'center', justifyContent: 'center',
    borderRadius: 16, borderWidth: 2.5, borderColor: 'transparent', paddingVertical: 4,
  },
  moodBtnOn: { borderColor: color.yolk, backgroundColor: '#FFF1B0' },
  moodLabel: { fontFamily: font.regular, fontSize: 15, color: color.textSoft },
  moodLabelOn: { fontFamily: font.bold, color: color.text },
});
