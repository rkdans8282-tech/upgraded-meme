import { memo, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
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
  const [query, setQuery] = useState('');
  const target = Number(query);
  const valid = Number.isInteger(target) && target >= 1 && target <= MEMO_PAGES;
  const go = () => {
    if (valid) onPick(`memo:${target}`);
  };
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
      <View style={s.search}>
        <TextInput
          style={s.searchInput}
          value={query}
          onChangeText={(t) => setQuery(t.replace(/[^0-9]/g, '').slice(0, 3))}
          onSubmitEditing={go}
          keyboardType="number-pad"
          returnKeyType="go"
          placeholder={`쪽 번호로 바로 가기 (1~${MEMO_PAGES})`}
          placeholderTextColor="#B0B0B0"
          accessibilityLabel="쪽 번호 입력"
        />
        <Pressable onPress={go} disabled={!valid} style={[s.goBtn, !valid && { opacity: 0.35 }]} accessibilityRole="button" accessibilityLabel="입력한 쪽으로 이동">
          <Text style={s.goText}>이동</Text>
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
  head: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 16, paddingRight: 12, paddingTop: 12, paddingBottom: 8 },
  title: { fontFamily: font.bold, fontSize: 24, color: color.text },
  sub: { fontFamily: font.regular, fontSize: 15, color: color.textSoft },
  chip: { minHeight: 40, justifyContent: 'center', paddingHorizontal: 12, borderRadius: theme.radius.pill, borderWidth: 1, borderColor: '#DCDCDC' },
  chipOn: { backgroundColor: color.accent, borderColor: color.accent },
  close: { minHeight: 40, justifyContent: 'center', paddingHorizontal: 12, borderRadius: theme.radius.pill, backgroundColor: color.accentSoft },
  chipText: { fontFamily: font.bold, fontSize: 15, color: color.text },
  search: { flexDirection: 'row', gap: 8, paddingLeft: 16, paddingRight: 12, paddingBottom: 10 },
  searchInput: { flex: 1, minWidth: 0, minHeight: 42, borderRadius: 10, borderWidth: 1, borderColor: '#DCDCDC', paddingHorizontal: 12, fontFamily: font.regular, fontSize: 15, color: color.text, backgroundColor: '#FAFAFA' },
  goBtn: { flexShrink: 0, minWidth: 64, minHeight: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: color.accent },
  goText: { fontFamily: font.bold, fontSize: 15, color: color.text },
  list: { paddingLeft: 12, paddingRight: 8, paddingBottom: 20 },
  cellWrap: { flex: 1 / COLS, padding: 4, alignItems: 'center' },
  cell: { width: '100%', backgroundColor: '#fff', borderWidth: 1, borderColor: '#DCDCDC', overflow: 'hidden' },
  cellOn: { borderColor: color.text, borderWidth: 2 },
  no: { fontFamily: font.regular, fontSize: 13, color: '#B5B5B5', marginTop: 2 },
  noOn: { fontFamily: font.bold, color: color.text },
  empty: { fontFamily: font.regular, fontSize: 20, color: color.textSoft, textAlign: 'center', marginTop: 60 },
});
