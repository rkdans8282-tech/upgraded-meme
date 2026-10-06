import { memo, useCallback, useRef, useState } from 'react';
import { Keyboard, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { GroupDrag, InkLayer } from './InkLayer';
import { CutoutModal } from './CutoutModal';
import { PageHoles } from './PageHoles';
import { RemoteKey, RemoteMenu } from './RemoteMenu';
import { LayoutSheet } from './LayoutSheet';
import { Layout, segments } from '../layouts';
import { StickerLayer } from './StickerLayer';
import { StickerSheet } from './StickerSheet';
import { Cut, SCALE_MAX, SCALE_MIN, Sticker, newId } from '../stickers';
import { PEN_COLORS, Stroke, Tool, WIDTHS } from '../strokes';
import { isGif, pickPhoto } from '../photos';
import { fromKey } from '../dates';
import { theme } from '../theme';
import type { Entry } from '../storage';

const { color, font } = theme;
export const LINE = 38; // 글자 줄 높이

type Props = {
  dayKey: string;
  entry?: Entry;
  onText: (day: string, text: string) => void;
  onStickers: (day: string, stickers: Sticker[]) => void;
  onStrokes: (day: string, strokes: Stroke[]) => void;
  onScratch: () => void;
  onCalendar: (day: string) => void;
  onSave: () => void;
  layout?: Layout; // 공책 쪽의 칸 나누기 (구분선)
  onLayout?: (day: string, layout: Layout) => void;
  onShelf?: () => void; // 책장으로 돌아가기 (둥근 리모컨 메뉴)
  pageLabel?: string; // 공책 쪽 번호 ('12 / 300')
  onIndex?: () => void; // 쪽 번호를 누르면 목록 열기
  dateLabel?: string; // 날짜 칸을 확대한 화면에서만, 날짜('2026-10-05')를 테두리 상자로 왼쪽 위에 보여줌
  transparent?: boolean; // 표지 꾸미기: 종이 배경 없이 위에 스티커·손글씨만 올림 (글상자도 없음)
  remoteItems?: RemoteKey[];
  holes: number; // 스프링 구멍 개수 (책 겉 스프링과 같은 값)
};

// 공책 속지 한 장 = 하루. 줄 없는 흰 종이(메모지처럼 자유롭게)
const NO_STICKERS: Sticker[] = [];
const NO_STROKES: Stroke[] = [];
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

function DiaryPageBase({ dayKey, entry, onText, onStickers, onStrokes, onScratch, onCalendar, onSave, onShelf, layout, onLayout, pageLabel, onIndex, dateLabel, transparent, remoteItems, holes }: Props) {
  const [areaH, setAreaH] = useState(300);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [sheet, setSheet] = useState(false);
  const [layoutSheet, setLayoutSheet] = useState(false);
  const [sheetCat, setSheetCat] = useState<string | undefined>(undefined);
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
  const addPhoto = async () => {
    Keyboard.dismiss();
    try {
      const p = await pickPhoto();
      if (!p) return;
      const st: Sticker = {
        id: newId(), key: '', photo: p.photo, aspect: p.imgAspect, imgAspect: p.imgAspect,
        x: 0.5, y: 0.42, scale: 1.7, rot: Math.round((Math.random() - 0.5) * 8),
      };
      apply([...stickers, st]);
      setSelectedId(st.id);
    } catch {}
  };
  // 글상자: 스티커처럼 옮기고 줄이고 돌릴 수 있는 글. '수정'을 눌러야 글이 고쳐짐(끌어서 옮기기와 헷갈리지 않게)
  const [editingId, setEditingId] = useState<string | null>(null);
  const addText = () => {
    Keyboard.dismiss();
    const st: Sticker = { id: newId(), key: '', text: '', x: 0.5, y: 0.3, scale: 1, rot: 0 };
    apply([...stickers, st]);
    setSelectedId(st.id);
    setEditingId(st.id);
  };
  const onEditText = useCallback((id: string, text: string) => onStickers(dayKey, stickers.map((st) => (st.id === id ? { ...st, text } : st))), [onStickers, dayKey, stickers]);
  const finishEdit = () => {
    const st = stickers.find((x) => x.id === editingId);
    setEditingId(null);
    if (st && !st.text?.trim()) {
      apply(stickers.filter((x) => x.id !== st.id)); // 비어 있으면 지움
      setSelectedId(null);
    }
  };
  // 올가미로 묶어서 옮기는 동안 스티커·글상자도 같이 움직여 보이게
  const [groupDrag, setGroupDrag] = useState<GroupDrag | null>(null);
  const moveStickers = useCallback((next: Sticker[]) => apply(next), [apply]);
  const [cutting, setCutting] = useState(false);
  const applyCut = (cut: Cut) => {
    const [x0, y0, x1, y1] = cut.box;
    const ia = selected?.imgAspect ?? 1;
    patchSelected(() => ({ cut, aspect: ((x1 - x0) * ia) / (y1 - y0), scale: 1.3 }));
    setCutting(false);
  };
  const openSheet = (cat?: string) => {
    Keyboard.dismiss();
    setSelectedId(null);
    setSheetCat(cat);
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

  const onRemote = (k: RemoteKey) => {
    if (k === 'pen') startDrawing();
    else if (k === 'sticker') openSheet(undefined);
    else if (k === 'tape') openSheet('tape');
    else if (k === 'photo') addPhoto();
    else if (k === 'text') addText();
    else if (k === 'layout') {
      Keyboard.dismiss();
      setSelectedId(null);
      setLayoutSheet(true);
    }
    else if (k === 'save') onSave();
    else if (k === 'shelf') onShelf?.();
    else onCalendar(dayKey);
  };

  const [contentH, setContentH] = useState(0);
  const total = Math.max(areaH, contentH + LINE);
  const showRemote = !drawing && !selected && !sheet && !layoutSheet && !cutting && !editingId;

  return (
    <View style={[s.page, transparent && { backgroundColor: 'transparent' }]} onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      <PageHoles holes={holes} />
      {layout && layout !== 'none' ? (
        <View style={s.panels} pointerEvents="none">
          {segments(layout).map(([x0, y0, x1, y1], i) => (
            <View
              key={i}
              style={{
                position: 'absolute', backgroundColor: '#B9B9B9',
                left: `${x0 * 100}%`, top: `${y0 * 100}%`,
                width: x0 === x1 ? 1 : `${(x1 - x0) * 100}%`, height: y0 === y1 ? 1 : `${(y1 - y0) * 100}%`,
              }}
            />
          ))}
        </View>
      ) : null}
      {dateLabel ? <View style={s.frame} pointerEvents="none" /> : null}
      {dateLabel ? <DateTag dayKey={dateLabel} /> : null}

      {!transparent && <ScrollView style={[s.area, dateLabel ? { marginTop: 92, paddingLeft: 26, paddingRight: 24 } : null]} onLayout={(e) => setAreaH(e.nativeEvent.layout.height)} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
        <View style={{ height: total }}>
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
            selectionColor={color.accent}
            onFocus={() => setSelectedId(null)}
            textAlignVertical="top"
          />
        </View>
      </ScrollView>}

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
        stickers={stickers}
        onMoveStickers={moveStickers}
        onDrag={setGroupDrag}
      />

      {drawing ? (
        <View style={s.penBar}>
          <View style={s.penRow}>
            {([['pen', '✏️', '펜'], ['marker', '🖍', '형광펜'], ['eraser', '🧽', '지우개'], ['lasso', '⭕', '옮기기']] as const).map(([k, icon, label]) => (
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
          {(tool === 'pen' || tool === 'marker') && (
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
                  <Text style={s.doneText}>✓ 완료</Text>
                </Pressable>
              </View>
            </>
          )}
          {(tool === 'eraser' || tool === 'lasso') && (
            <View style={s.penRow}>
              <Text style={s.eraserHint}>{tool === 'eraser' ? '지우고 싶은 글씨 위를 쓱 문지르세요' : '옮길 글씨를 동그라미로 감싼 뒤, 점선 상자 안을 끌어서 옮기세요'}</Text>
              <Pressable onPress={() => setDrawing(false)} accessibilityRole="button" accessibilityLabel="쓰기 끝" style={s.doneBtn}>
                <Text style={s.doneText}>✓ 완료</Text>
              </Pressable>
            </View>
          )}
        </View>
      ) : editingId ? (
        <View style={s.editBar}>
          <Text style={s.eraserHint}>글을 다 적으면 완료를 눌러요</Text>
          <View style={{ width: 92 }}>
            <EditBtn icon="✓" label="완료" strong onPress={finishEdit} />
          </View>
        </View>
      ) : selected ? (
        <View style={s.editBar}>
          <EditBtn icon="－" label="작게" onPress={() => patchSelected((st) => ({ scale: clamp(st.scale * 0.85, SCALE_MIN, SCALE_MAX) }))} />
          <EditBtn icon="＋" label="크게" onPress={() => patchSelected((st) => ({ scale: clamp(st.scale * 1.18, SCALE_MIN, SCALE_MAX) }))} />
          {selected.text !== undefined && <EditBtn icon="✎" label="수정" onPress={() => setEditingId(selected.id)} />}
          {selected.photo && !isGif(selected.photo) && <EditBtn icon="✂️" label="오리기" onPress={() => setCutting(true)} />}
          <View style={s.rotGroup}>
            <View style={s.rotBtns}>
              <Pressable onPress={() => patchSelected((st) => ({ rot: st.rot - 15 }))} accessibilityRole="button" accessibilityLabel="왼쪽으로 회전" style={s.rotBtn}>
                <Text style={s.editIcon}>⟲</Text>
              </Pressable>
              <Pressable onPress={() => patchSelected((st) => ({ rot: st.rot + 15 }))} accessibilityRole="button" accessibilityLabel="오른쪽으로 회전" style={s.rotBtn}>
                <Text style={s.editIcon}>⟳</Text>
              </Pressable>
            </View>
            <Text style={s.editLabel}>회전</Text>
          </View>
          <EditBtn icon="↩︎" label="되돌리기" disabled={undoCount === 0} onPress={undo} />
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
      ) : null}

      {/* 스티커 층: 글 위에 올라가고, 스티커가 없는 곳은 터치가 글상자로 통과 */}
      <View style={StyleSheet.absoluteFill} pointerEvents={drawing ? 'none' : 'box-none'}>
        <StickerLayer stickers={stickers} selectedId={selectedId} pageW={box.w} pageH={box.h} onSelect={setSelectedId} onCommit={commit} editingId={editingId} onEditText={onEditText} drag={groupDrag} />
      </View>

      {showRemote && pageLabel ? (
        <Pressable onPress={onIndex} style={s.badge} accessibilityRole="button" accessibilityLabel="공책 목록 열기">
          <Text style={s.badgeText}>{pageLabel}</Text>
        </Pressable>
      ) : null}

      {showRemote && <RemoteMenu items={remoteItems ?? [...(['pen', 'text', 'sticker', 'photo', 'tape'] as RemoteKey[]), ...(pageLabel ? (['layout'] as RemoteKey[]) : []), 'calendar', 'save', ...(onShelf ? (['shelf'] as RemoteKey[]) : [])]} onPick={onRemote} />}

      {cutting && selected?.photo && (
        <CutoutModal photo={selected.photo} imgAspect={selected.imgAspect ?? 1} onDone={applyCut} onClose={() => setCutting(false)} />
      )}

      {layoutSheet && (
        <LayoutSheet
          current={layout ?? 'none'}
          onPick={(l) => {
            onLayout?.(dayKey, l);
            setLayoutSheet(false);
          }}
          onClose={() => setLayoutSheet(false)}
        />
      )}

      {sheet && <StickerSheet initialCat={sheetCat} onPick={addSticker} onClose={() => setSheet(false)} />}
    </View>
  );
}

const MONTHS = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
const WEEKDAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

// 날짜 상자: 가는 테두리 안에 큰 숫자 + 영문 월/요일 (표지와 같은 분위기)
function DateTag({ dayKey }: { dayKey: string }) {
  const d = fromKey(dayKey);
  return (
    <View style={s.dateTag} pointerEvents="none">
      <Text style={s.dateDay}>{d.getDate()}</Text>
      <View style={s.dateRule} />
      <View>
        <Text style={s.dateMonth}>{MONTHS[d.getMonth()]}</Text>
        <Text style={s.dateDow}>{WEEKDAYS[d.getDay()]}</Text>
      </View>
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
  page: { flex: 1, backgroundColor: color.paper, overflow: 'hidden' },
  dateTag: {
    position: 'absolute', left: 18, top: 16, flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#2B2B2B', backgroundColor: color.paper, paddingVertical: 7, paddingHorizontal: 12,
  },
  // 공책 쪽 칸 나누기 구분선이 놓이는 영역 (테두리 포함)
  panels: { position: 'absolute', left: 12, right: 12, top: 22, bottom: 16, borderWidth: 1, borderColor: '#B9B9B9' },
  // 페이지를 두른 가는 선. 날짜 상자가 윗선에 걸쳐 있어서 머리말처럼 보임
  frame: { position: 'absolute', left: 12, right: 12, top: 43, bottom: 16, borderWidth: 1, borderColor: '#B9B9B9' },
  dateDay: { fontFamily: font.serif, fontSize: 34, lineHeight: 40, color: '#2B2B2B', minWidth: 22, textAlign: 'center' },
  dateRule: { width: 1, alignSelf: 'stretch', backgroundColor: '#2B2B2B', opacity: 0.35, marginHorizontal: 11 },
  dateMonth: { fontFamily: font.bold, fontSize: 11, letterSpacing: 2.4, color: '#2B2B2B' },
  dateDow: { fontFamily: font.regular, fontSize: 10, letterSpacing: 2, color: '#8A8A8A', marginTop: 3 },
  badge: { position: 'absolute', left: 20, bottom: 24, minHeight: 36, paddingHorizontal: 10, justifyContent: 'center' },
  badgeText: { fontFamily: font.regular, fontSize: 15, color: '#A8A8A8' },
  area: { flex: 1, marginTop: 24, paddingLeft: theme.pageLeft, paddingRight: 16 },
  input: {
    fontFamily: font.note, fontSize: 23, lineHeight: LINE, color: color.text,
    padding: 0, margin: 0, includeFontPadding: false,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
  },
  penBar: {
    zIndex: 5, elevation: 5, position: 'relative',
    gap: 6, paddingLeft: 12, paddingRight: 12, paddingTop: 8, paddingBottom: 14,
    borderTopWidth: 1, borderTopColor: '#E4E4E4', backgroundColor: color.paper,
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
  doneText: { fontFamily: font.bold, fontSize: 19, color: color.text },
  eraserHint: { flex: 1, fontFamily: font.regular, fontSize: 17, color: color.textSoft },
  editBar: {
    flexDirection: 'row', gap: 6, paddingLeft: 12, paddingRight: 12, paddingTop: 8, paddingBottom: 14,
    borderTopWidth: 1, borderTopColor: '#E4E4E4', backgroundColor: color.paper,
  },
  editBtn: { flex: 1, minHeight: 60, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: color.accentSoft },
  editBtnStrong: { backgroundColor: color.accent },
  rotGroup: { flex: 1.7, minHeight: 60, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: color.accentSoft },
  rotBtns: { flexDirection: 'row', width: '100%' },
  rotBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 36 },
  editIcon: { fontSize: 22, color: color.text },
  editLabel: { fontFamily: font.bold, fontSize: 12, color: color.text },
});
