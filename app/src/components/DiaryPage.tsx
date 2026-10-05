import { memo, useCallback, useRef, useState } from 'react';
import { Keyboard, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { PaperTexture } from './PaperTexture';
import { InkLayer } from './InkLayer';
import { StickerLayer } from './StickerLayer';
import { StickerSheet } from './StickerSheet';
import { SCALE_MAX, SCALE_MIN, Sticker, newId } from '../stickers';
import { PEN_COLORS, Stroke, Tool, WIDTHS } from '../strokes';
import { Mood, moods } from '../moods';
import { labelOf } from '../dates';
import { theme } from '../theme';
import type { Entry } from '../storage';

const { color, font } = theme;
export const LINE = 38; // 줄 간격 = 글자 줄 높이
export const SLOT = 22; // 스프링 한 칸 높이 (겉 스프링과 같은 값)

type Props = {
  dayKey: string;
  entry?: Entry;
  isToday: boolean;
  onText: (day: string, text: string) => void;
  onMood: (day: string, mood: Mood) => void;
  onStickers: (day: string, stickers: Sticker[]) => void;
  onStrokes: (day: string, strokes: Stroke[]) => void;
  onScratch: () => void;
  onFlip: (dir: 1 | -1) => void;
  holes: number; // 스프링 구멍 개수 (책 겉 스프링과 같은 값)
};

// 공책 속지 한 장 = 하루
const NO_STICKERS: Sticker[] = [];
const NO_STROKES: Stroke[] = [];
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

function DiaryPageBase({ dayKey, entry, isToday, onText, onMood, onStickers, onStrokes, onScratch, onFlip, holes }: Props) {
  const [areaH, setAreaH] = useState(300);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [sheet, setSheet] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const history = useRef<Sticker[][]>([]); // 되돌리기용 이전 상태들
  const [undoCount, setUndoCount] = useState(0);
  const stickers = entry?.stickers ?? NO_STICKERS;
  const selected = stickers.find((st) => st.id === selectedId) ?? null;

  // 스티커 목록을 바꾸고, 바꾸기 전 상태를 되돌리기 목록에 저장
  const apply = useCallback(
    (next: Sticker[]) => {
      history.current = [...history.current.slice(-29), stickers];
      setUndoCount(history.current.length);
      onStickers(dayKey, next);
    },
    [stickers, onStickers, dayKey],
  );
  const undo = () => {
    const prev = history.current.pop();
    setUndoCount(history.current.length);
    if (!prev) return;
    if (selectedId && !prev.some((st) => st.id === selectedId)) setSelectedId(null);
    onStickers(dayKey, prev);
  };
  const commit = useCallback((next: Sticker) => apply(stickers.map((st) => (st.id === next.id ? next : st))), [apply, stickers]);
  const patchSelected = (patch: (st: Sticker) => Partial<Sticker>) => {
    if (selected) commit({ ...selected, ...patch(selected) });
  };
  const addSticker = (key: string) => {
    const jitter = () => (Math.random() - 0.5) * 0.12;
    const st: Sticker = { id: newId(), key, x: 0.5 + jitter(), y: 0.42 + jitter(), scale: 1, rot: Math.round((Math.random() - 0.5) * 16) };
    apply([...stickers, st]);
    setSelectedId(st.id);
    setSheet(false);
  };
  const openSheet = () => {
    Keyboard.dismiss();
    setSelectedId(null);
    setSheet(true);
  };
  // 손글씨(펜) 모드
  const [drawing, setDrawing] = useState(false);
  const [tool, setTool] = useState<Tool>('pen');
  const [penColor, setPenColor] = useState(PEN_COLORS[0]);
  const [widthIdx, setWidthIdx] = useState(1);
  const strokes = entry?.strokes ?? NO_STROKES;
  const strokeHistory = useRef<Stroke[][]>([]);
  const [strokeUndo, setStrokeUndo] = useState(0);
  const changeStrokes = useCallback(
    (next: Stroke[]) => {
      strokeHistory.current = [...strokeHistory.current.slice(-29), strokes];
      setStrokeUndo(strokeHistory.current.length);
      onStrokes(dayKey, next);
    },
    [strokes, onStrokes, dayKey],
  );
  const undoStroke = () => {
    const prev = strokeHistory.current.pop();
    setStrokeUndo(strokeHistory.current.length);
    if (prev) onStrokes(dayKey, prev);
  };
  const startDrawing = () => {
    Keyboard.dismiss();
    setSelectedId(null);
    setDrawing(true);
  };
  const [contentH, setContentH] = useState(0);
  const mood = entry?.mood;
  const total = Math.max(areaH, contentH + LINE);
  const lines = Math.ceil(total / LINE);

  return (
    <View style={s.page} onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
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
          <View style={s.subRow}>
            <Text style={s.sub}>{isToday ? '오늘의 일기' : '그날의 일기'}</Text>
            {mood && <Text style={s.headMood}>{moods.find((m) => m.key === mood)?.emoji}</Text>}
          </View>
        </View>
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
            placeholder={'오늘은 어떤 하루였어?\n여기에 자유롭게 적어보세요.'}
            placeholderTextColor="#CBBFAE"
            selectionColor={color.accent}
            onFocus={() => setSelectedId(null)}
            textAlignVertical="top"
          />
        </View>
      </ScrollView>

      {/* 손글씨 층: 펜 모드일 때만 터치를 받음. 도구 막대보다 아래 층이라 막대는 항상 눌림 */}
      <InkLayer
        strokes={strokes}
        pageW={box.w}
        pageH={box.h}
        drawing={drawing}
        tool={tool}
        color={penColor}
        widthRatio={WIDTHS[widthIdx].ratio}
        onChange={changeStrokes}
      />

      {drawing ? (
        <View style={s.penBar}>
          <View style={s.penRow}>
            {([['pen', '✏️', '펜'], ['marker', '🖍', '형광펜'], ['eraser', '🧽', '지우개']] as const).map(([k, icon, label]) => (
              <Pressable key={k} onPress={() => setTool(k)} accessibilityRole="button" accessibilityLabel={label} style={[s.toolBtn, tool === k && s.toolBtnOn]}>
                <Text style={s.toolIcon}>{icon}</Text>
                <Text style={s.toolLabel}>{label}</Text>
              </Pressable>
            ))}
            <Pressable onPress={undoStroke} disabled={strokeUndo === 0} accessibilityRole="button" accessibilityLabel="되돌리기" style={[s.toolBtn, strokeUndo === 0 && { opacity: 0.35 }]}>
              <Text style={s.toolIcon}>↩︎</Text>
              <Text style={s.toolLabel}>되돌리기</Text>
            </Pressable>
          </View>
          {tool !== 'eraser' && (
            <>
              <View style={s.penRow}>
                {PEN_COLORS.map((c) => (
                  <Pressable key={c} onPress={() => setPenColor(c)} accessibilityRole="button" accessibilityLabel={`색 ${c}`} style={[s.swatchWrap, penColor === c && s.swatchWrapOn]}>
                    <View style={[s.swatch, { backgroundColor: c }]} />
                  </Pressable>
                ))}
              </View>
              <View style={s.penRow}>
                {WIDTHS.map((w, i) => (
                  <Pressable key={w.key} onPress={() => setWidthIdx(i)} accessibilityRole="button" accessibilityLabel={w.label} style={[s.widthBtn, widthIdx === i && s.toolBtnOn]}>
                    <View style={[s.widthDot, { height: 3 + i * 4 + (tool === 'marker' ? 4 : 0), backgroundColor: penColor, opacity: tool === 'marker' ? 0.5 : 1 }]} />
                  </Pressable>
                ))}
                <Pressable onPress={() => setDrawing(false)} accessibilityRole="button" accessibilityLabel="쓰기 끝" style={s.doneBtn}>
                  <Text style={s.stickerBtnText}>✓ 완료</Text>
                </Pressable>
              </View>
            </>
          )}
          {tool === 'eraser' && (
            <View style={s.penRow}>
              <Text style={s.eraserHint}>지우고 싶은 글씨 위를 쓱 문지르세요</Text>
              <Pressable onPress={() => setDrawing(false)} accessibilityRole="button" accessibilityLabel="쓰기 끝" style={s.doneBtn}>
                <Text style={s.stickerBtnText}>✓ 완료</Text>
              </Pressable>
            </View>
          )}
        </View>
      ) : selected ? (
        <View style={s.editBar}>
          <EditBtn icon="－" label="작게" onPress={() => patchSelected((st) => ({ scale: clamp(st.scale * 0.85, SCALE_MIN, SCALE_MAX) }))} />
          <EditBtn icon="＋" label="크게" onPress={() => patchSelected((st) => ({ scale: clamp(st.scale * 1.18, SCALE_MIN, SCALE_MAX) }))} />
          <EditBtn icon="⟳" label="회전" onPress={() => patchSelected((st) => ({ rot: st.rot + 15 }))} />
          <EditBtn
            icon="🗑"
            label="삭제"
            onPress={() => {
              apply(stickers.filter((st) => st.id !== selected.id));
              setSelectedId(null);
            }}
          />
          <EditBtn icon="✓" label="완료" strong onPress={() => setSelectedId(null)} />
        </View>
      ) : (
        <View style={s.moodBar}>
          <View style={s.toolRow}>
            <Pressable onPress={openSheet} style={s.stickerBtn} accessibilityRole="button" accessibilityLabel="스티커 붙이기">
              <Text style={s.stickerBtnText}>＋ 스티커</Text>
            </Pressable>
            <Pressable onPress={startDrawing} style={s.penBtn} accessibilityRole="button" accessibilityLabel="펜으로 쓰기">
              <Text style={s.stickerBtnText}>✏️ 펜</Text>
            </Pressable>
            <Pressable onPress={undo} disabled={undoCount === 0} style={[s.undoBtn, undoCount === 0 && { opacity: 0.35 }]} accessibilityRole="button" accessibilityLabel="스티커 되돌리기">
              <Text style={s.undoText}>↩︎ 되돌리기</Text>
            </Pressable>
          </View>
          <View style={s.navRow}>
            <Pressable onPress={() => onFlip(-1)} style={s.navBtn} accessibilityRole="button" accessibilityLabel="이전 날 보기">
              <Text style={s.navText}>‹ 이전</Text>
            </Pressable>
            <Text style={s.moodTitle} numberOfLines={1}>{isToday ? '오늘 기분' : '그날 기분'}</Text>
            {isToday ? (
              <View style={s.navBtn} />
            ) : (
              <Pressable onPress={() => onFlip(1)} style={s.navBtn} accessibilityRole="button" accessibilityLabel="다음 날 보기">
                <Text style={[s.navText, { textAlign: 'right' }]}>다음 ›</Text>
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
                  <Text style={s.moodEmoji}>{m.emoji}</Text>
                  <Text style={[s.moodLabel, on && s.moodLabelOn]} numberOfLines={1}>{m.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {/* 스티커 층: 글 위에 올라가고, 스티커가 없는 곳은 터치가 글상자로 통과 */}
      <View style={StyleSheet.absoluteFill} pointerEvents={drawing ? 'none' : 'box-none'}>
        <StickerLayer stickers={stickers} selectedId={selectedId} pageW={box.w} pageH={box.h} onSelect={setSelectedId} onCommit={commit} />
      </View>

      {sheet && <StickerSheet onPick={addSticker} onClose={() => setSheet(false)} />}
    </View>
  );
}

function EditBtn({ icon, label, onPress, disabled, strong }: { icon: string; label: string; onPress: () => void; disabled?: boolean; strong?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[s.editBtn, strong && s.editBtnStrong, disabled && { opacity: 0.35 }]}
    >
      <Text style={s.editIcon}>{icon}</Text>
      <Text style={s.editLabel}>{label}</Text>
    </Pressable>
  );
}

export const DiaryPage = memo(DiaryPageBase);

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: color.paper, borderTopRightRadius: 10, borderBottomRightRadius: 10, overflow: 'hidden' },
  margin: { position: 'absolute', left: theme.pageLeft - 14, top: 0, bottom: 0, width: 2, backgroundColor: color.margin, opacity: 0.8 },
  holes: { position: 'absolute', left: 14, top: 0, bottom: 0, width: 18, justifyContent: 'space-around' },
  holeSlot: { height: SLOT, alignItems: 'center', justifyContent: 'center' },
  hole: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#CDBFA6', opacity: 0.7 },
  header: { flexDirection: 'row', alignItems: 'center', paddingLeft: theme.pageLeft, paddingRight: 14, paddingTop: 14 },
  date: { fontFamily: font.bold, fontSize: 26, color: color.text },
  sub: { fontFamily: font.regular, fontSize: 18, color: color.textSoft, marginTop: -2 },
  area: { flex: 1, marginTop: 4, paddingLeft: theme.pageLeft, paddingRight: 16 },
  rule: { position: 'absolute', left: -theme.pageLeft, right: -16, height: 1.5, backgroundColor: color.rule },
  input: {
    fontFamily: font.regular, fontSize: 23, lineHeight: LINE, color: color.text,
    padding: 0, margin: 0, includeFontPadding: false,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
  },
  toolRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  stickerBtn: { minHeight: theme.minTouch, justifyContent: 'center', paddingHorizontal: 14, borderRadius: theme.radius.pill, backgroundColor: color.accent },
  stickerBtnText: { fontFamily: font.bold, fontSize: 21, color: color.text },
  penBtn: { minHeight: theme.minTouch, justifyContent: 'center', paddingHorizontal: 14, borderRadius: theme.radius.pill, backgroundColor: color.accentSoft },
  penBar: {
    zIndex: 5, elevation: 5, position: 'relative',
    gap: 6, paddingLeft: 54, paddingRight: 12, paddingTop: 8, paddingBottom: 14,
    borderTopWidth: 1.5, borderTopColor: color.rule, backgroundColor: color.paper,
  },
  penRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  toolBtn: { flex: 1, minHeight: 56, alignItems: 'center', justifyContent: 'center', borderRadius: 14, borderWidth: 2.5, borderColor: 'transparent' },
  toolBtnOn: { borderColor: color.accent, backgroundColor: color.accentSoft },
  toolIcon: { fontSize: 22, color: color.text },
  toolLabel: { fontFamily: font.bold, fontSize: 13, color: color.text },
  swatchWrap: { flex: 1, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20, borderWidth: 2.5, borderColor: 'transparent' },
  swatchWrapOn: { borderColor: color.accent },
  swatch: { width: 26, height: 26, borderRadius: 13 },
  widthBtn: { flex: 1, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 14, borderWidth: 2.5, borderColor: 'transparent', paddingHorizontal: 14 },
  widthDot: { width: '100%', borderRadius: 6 },
  doneBtn: { minHeight: theme.minTouch, minWidth: 104, paddingHorizontal: 12, flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderRadius: theme.radius.pill, backgroundColor: color.accent },
  eraserHint: { flex: 1, fontFamily: font.regular, fontSize: 17, color: color.textSoft },
  undoBtn: { minHeight: theme.minTouch, justifyContent: 'center', paddingHorizontal: 6 },
  undoText: { fontFamily: font.bold, fontSize: 17, color: color.textSoft },
  editBar: {
    flexDirection: 'row', gap: 6, paddingLeft: 54, paddingRight: 12, paddingTop: 8, paddingBottom: 14,
    borderTopWidth: 1.5, borderTopColor: color.rule, backgroundColor: color.paper,
  },
  editBtn: { flex: 1, minHeight: 60, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: color.accentSoft },
  editBtnStrong: { backgroundColor: color.accent },
  editIcon: { fontSize: 22, color: color.text },
  editLabel: { fontFamily: font.bold, fontSize: 13, color: color.text },
  moodBar: { paddingLeft: 54, paddingRight: 12, paddingBottom: 12, paddingTop: 6 },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  navBtn: { minWidth: 70, minHeight: theme.minTouch, justifyContent: 'center' },
  navText: { fontFamily: font.bold, fontSize: 20, color: color.text },
  moodTitle: { fontFamily: font.bold, fontSize: 18, color: color.textSoft, flexShrink: 0 },
  moodRow: { flexDirection: 'row', gap: 6 },
  moodBtn: {
    flex: 1, minHeight: theme.minTouch + 24, alignItems: 'center', justifyContent: 'center',
    borderRadius: 16, borderWidth: 2.5, borderColor: 'transparent', paddingVertical: 4,
  },
  moodBtnOn: { borderColor: color.accent, backgroundColor: color.accentSoft },
  moodEmoji: { fontSize: 30 },
  subRow: { flexDirection: 'row', alignItems: 'center' },
  headMood: { fontSize: 24, marginLeft: 8 },
  moodLabel: { fontFamily: font.regular, fontSize: 14, color: color.textSoft },
  moodLabelOn: { fontFamily: font.bold, color: color.text },
});
