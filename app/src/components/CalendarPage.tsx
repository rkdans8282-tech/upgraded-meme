import { memo, useState } from 'react';
import { GestureResponderEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import { InkLayer } from './InkLayer';
import { PageHoles } from './PageHoles';
import { StickerLayer } from './StickerLayer';
import { DAYS, keyOf } from '../dates';
import { theme } from '../theme';
import type { Entry, Entries } from '../storage';

const { color, font } = theme;
const noop = () => {};

type Props = {
  monthKey: string; // 'cal:2026-10'
  entries: Entries;
  today: string;
  holes: number;
  pageAspect: number; // 일기 종이의 가로/세로 (미리보기 모양을 맞추려고)
  onPick: (day: string, pageX: number, pageY: number) => void;
  onShelf: () => void;
  onNotebook: () => void; // 공책 목록 열기 (쪽 번호 검색 포함)
};

// 칸 안에 그날의 글·그림·스티커를 작게 보여줌 (종이 모양 그대로 줄여서)
export function Mini({ e, aspect, inset = 18 }: { e: Entry; aspect: number; inset?: number }) {
  const [sz, setSz] = useState({ w: 0, h: 0 });
  const w = Math.min(sz.w, sz.h * aspect), h = w / aspect;
  return (
    <View style={[s.mini, { top: inset }]} onLayout={(ev) => setSz({ w: ev.nativeEvent.layout.width, h: ev.nativeEvent.layout.height })} pointerEvents="none">
      {w > 0 && (
        <View style={{ width: w, height: h, overflow: 'hidden' }}>
          {!!e.text && <Text style={s.miniText} numberOfLines={6}>{e.text}</Text>}
          <InkLayer strokes={e.strokes ?? []} pageW={w} pageH={h} drawing={false} tool="pen" color="#000" widthRatio={0.01} onChange={noop} />
          <StickerLayer stickers={e.stickers ?? []} selectedId={null} pageW={w} pageH={h} onSelect={noop} onCommit={noop} />
        </View>
      )}
    </View>
  );
}

// 월간 달력 쪽: 날짜 칸을 누르면 그 칸이 확대되면서 그날의 종이가 열림
function CalendarPageBase({ monthKey, entries, today, holes, pageAspect, onPick, onShelf, onNotebook }: Props) {
  const [y, m] = monthKey.slice(4).split('-').map(Number);
  const lead = new Date(y, m - 1, 1).getDay();
  const count = new Date(y, m, 0).getDate();
  const cells: (number | null)[] = [...Array(lead).fill(null), ...Array.from({ length: count }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);
  const weeks = Array.from({ length: cells.length / 7 }, (_, i) => cells.slice(i * 7, i * 7 + 7));

  return (
    <View style={s.page}>
      <PageHoles holes={holes} />
      <View style={s.head}>
        <Text style={s.month}>{m}월</Text>
        <Text style={s.year}>{y}</Text>
        <View style={{ flex: 1 }} />
        <Pressable onPress={onNotebook} hitSlop={8} accessibilityRole="button" accessibilityLabel="공책으로 바로 가기">
          <Text style={s.notebook}>공책 ›</Text>
        </Pressable>
        <Pressable onPress={onShelf} hitSlop={8} accessibilityRole="button" accessibilityLabel="책장으로 돌아가기">
          <Text style={s.shelf}>책장</Text>
        </Pressable>
      </View>
      <View style={s.grid}>
        <View style={s.row}>
          {DAYS.map((d, i) => (
            <Text key={d} style={[s.dow, i === 0 && s.sun]}>{d}</Text>
          ))}
        </View>
        {weeks.map((w, wi) => (
          <View key={wi} style={[s.row, s.week]}>
            {w.map((d, di) => {
              if (!d) return <View key={di} style={s.cell} />;
              const day = keyOf(new Date(y, m - 1, d));
              const e = entries[day];
              const future = day > today;
              const has = !!(e?.text || e?.stickers?.length || e?.strokes?.length);
              return (
                <Pressable
                  key={di}
                  disabled={future}
                  onPress={(ev: GestureResponderEvent) => onPick(day, ev.nativeEvent.pageX, ev.nativeEvent.pageY)}
                  style={s.cell}
                  accessibilityRole="button"
                  accessibilityLabel={`${m}월 ${d}일`}
                >
                  <Text style={[s.num, di === 0 && s.sun, future && s.future, day === today && s.today]}>{d}</Text>
                  {has && e && <Mini e={e} aspect={pageAspect} />}
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

export const CalendarPage = memo(CalendarPageBase);

const LINE = '#DCDCDC';
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: color.paper, overflow: 'hidden' },
  head: { flexDirection: 'row', alignItems: 'baseline', gap: 8, paddingLeft: 10, paddingRight: 10, paddingTop: 10 },
  month: { fontFamily: font.bold, fontSize: 24, color: color.text },
  year: { fontFamily: font.regular, fontSize: 16, color: color.textSoft },
  notebook: { fontFamily: font.bold, fontSize: 14, color: color.text, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, backgroundColor: color.accentSoft, overflow: 'hidden' },
  shelf: { fontFamily: font.regular, fontSize: 14, color: color.textSoft, paddingHorizontal: 4 },
  grid: { flex: 1, marginLeft: 8, marginRight: 8, marginTop: 6, marginBottom: 10, borderTopWidth: 1, borderLeftWidth: 1, borderColor: LINE },
  row: { flexDirection: 'row' },
  week: { flex: 1 },
  dow: { flex: 1, textAlign: 'center', fontFamily: font.bold, fontSize: 14, color: color.textSoft, paddingVertical: 4, borderRightWidth: 1, borderBottomWidth: 1, borderColor: LINE },
  cell: { flex: 1, borderRightWidth: 1, borderBottomWidth: 1, borderColor: LINE, padding: 2 },
  num: { fontFamily: font.bold, fontSize: 13, color: color.text, alignSelf: 'flex-start' },
  sun: { color: '#C98B8B' },
  future: { opacity: 0.35 },
  today: { color: '#fff', backgroundColor: color.text, overflow: 'hidden', borderRadius: 8, minWidth: 16, textAlign: 'center', paddingHorizontal: 2 },
  mini: { position: 'absolute', left: 1, right: 1, top: 18, bottom: 1, alignItems: 'center' },
  miniText: { position: 'absolute', left: 2, top: 1, right: 2, fontSize: 6, lineHeight: 7, color: '#444' },
});
