import { memo, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Mini } from './CalendarPage';
import { MEMO_PAGES } from '../book';
import { theme } from '../theme';
import type { Entries, Entry } from '../storage';

const { color, font } = theme;
const COLS = 4;
const hasContent = (e?: Entry) => !!(e?.text || e?.stickers?.length || e?.strokes?.length);

type Props = {
  entries: Entries;
  aspect: number; // 종이 가로/세로
  current: string;
  onPick: (key: string) => void;
  onClose: () => void;
};

const Cell = memo(function Cell({ no, e, aspect, on, onPress }: { no: number; e?: Entry; aspect: number; on: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={s.cellWrap} accessibilityRole="button" accessibilityLabel={`공책 ${no}쪽`}>
      <View style={[s.cell, { aspectRatio: aspect }, on && s.cellOn]}>
        {hasContent(e) && e ? <Mini e={e} aspect={aspect} inset={0} /> : null}
      </View>
      <Text style={[s.no, hasContent(e) && s.noOn]}>{no}</Text>
    </Pressable>
  );
});

// 공책 300장 목록: 쓴 쪽은 작게 미리 보이고, 누르면 그 쪽으로 이동
function PageIndexBase({ entries, aspect, current, onPick, onClose }: Props) {
  const [onlyWritten, setOnlyWritten] = useState(false);
  const written = useMemo(() => {
    const out: number[] = [];
    for (let n = 1; n <= MEMO_PAGES; n++) if (hasContent(entries[`memo:${n}`])) out.push(n);
    return out;
  }, [entries]);
  const data = useMemo(() => (onlyWritten ? written : Array.from({ length: MEMO_PAGES }, (_, i) => i + 1)), [onlyWritten, written]);

  return (
    <View style={s.wrap}>
      <View style={s.head}>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>공책 목록</Text>
          <Text style={s.sub}>쓴 쪽 {written.length} / {MEMO_PAGES}</Text>
        </View>
        <Pressable onPress={() => setOnlyWritten((v) => !v)} style={[s.chip, onlyWritten && s.chipOn]} accessibilityRole="button" accessibilityLabel="쓴 쪽만 보기">
          <Text style={s.chipText}>쓴 쪽만</Text>
        </Pressable>
        <Pressable onPress={onClose} style={s.close} accessibilityRole="button" accessibilityLabel="목록 닫기">
          <Text style={s.chipText}>닫기 ✕</Text>
        </Pressable>
      </View>
      {data.length === 0 ? (
        <Text style={s.empty}>아직 쓴 쪽이 없어요</Text>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(n) => String(n)}
          numColumns={COLS}
          initialNumToRender={12}
          windowSize={5}
          contentContainerStyle={s.list}
          renderItem={({ item }) => (
            <Cell no={item} e={entries[`memo:${item}`]} aspect={aspect} on={current === `memo:${item}`} onPress={() => onPick(`memo:${item}`)} />
          )}
        />
      )}
    </View>
  );
}

export const PageIndex = memo(PageIndexBase);

const s = StyleSheet.create({
  wrap: { ...StyleSheet.absoluteFill, backgroundColor: color.paper },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 52, paddingRight: 10, paddingTop: 12, paddingBottom: 8 },
  title: { fontFamily: font.bold, fontSize: 24, color: color.text },
  sub: { fontFamily: font.regular, fontSize: 15, color: color.textSoft },
  chip: { minHeight: 40, justifyContent: 'center', paddingHorizontal: 12, borderRadius: theme.radius.pill, borderWidth: 1, borderColor: '#DCDCDC' },
  chipOn: { backgroundColor: color.accent, borderColor: color.accent },
  close: { minHeight: 40, justifyContent: 'center', paddingHorizontal: 12, borderRadius: theme.radius.pill, backgroundColor: color.accentSoft },
  chipText: { fontFamily: font.bold, fontSize: 15, color: color.text },
  list: { paddingLeft: 50, paddingRight: 10, paddingBottom: 20 },
  cellWrap: { flex: 1 / COLS, padding: 4, alignItems: 'center' },
  cell: { width: '100%', backgroundColor: '#fff', borderWidth: 1, borderColor: '#DCDCDC', overflow: 'hidden' },
  cellOn: { borderColor: color.text, borderWidth: 2 },
  no: { fontFamily: font.regular, fontSize: 13, color: '#B5B5B5', marginTop: 2 },
  noOn: { fontFamily: font.bold, color: color.text },
  empty: { fontFamily: font.regular, fontSize: 20, color: color.textSoft, textAlign: 'center', marginTop: 60 },
});
