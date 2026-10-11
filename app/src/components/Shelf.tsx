import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CoverArt } from './Cover';
import { COVER_ASPECT, Diary } from '../diaries';
import { theme } from '../theme';

const { font } = theme;
const COLS = 3;
const PAD = 22;
const GAP = 16;
const MIN_ROWS = 3; // 책장은 항상 3칸 이상 보임 (9권이 넘으면 아래로 스크롤)

type Props = {
  diaries: Diary[];
  slots: number;
  onOpen: (id: string) => void;
  onAdd: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
};

// 앱을 열면 보이는 책장: 내 다이어리가 선반에 3권씩 진열됨
export function Shelf({ diaries, slots, onOpen, onAdd, onEdit, onDelete }: Props) {
  const { width } = useWindowDimensions();
  const W = Math.min(width, 760);
  const cw = Math.floor((W - PAD * 2 - GAP * (COLS - 1)) / COLS);
  const ch = Math.round(cw / COVER_ASPECT);
  const [menu, setMenu] = useState<Diary | null>(null);
  const [confirm, setConfirm] = useState(false);

  const items: (Diary | 'add' | null)[] = [...diaries, 'add'];
  const rows = Math.max(MIN_ROWS, Math.ceil(items.length / COLS));
  while (items.length < rows * COLS) items.push(null);

  const close = () => {
    setMenu(null);
    setConfirm(false);
  };

  return (
    <SafeAreaView style={s.root}>
      <View style={s.head}>
        <Text style={s.title}>
          My <Text style={s.titleKo}>다이어리</Text>
        </Text>
        <Text style={s.sub}>{diaries.length}권 · 무료 1권{slots > 1 ? ` + 추가 ${slots - 1}권` : ''}</Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: 40, alignItems: 'center' }}>
        <View style={{ width: W }}>
          {Array.from({ length: rows }, (_, r) => (
            <View key={r} style={{ marginBottom: 26 }}>
              <View style={[s.row, { paddingHorizontal: PAD, gap: GAP, height: ch }]}>
                {items.slice(r * COLS, r * COLS + COLS).map((it, i) => {
                  if (it === null) return <View key={i} style={{ width: cw, height: ch }} />;
                  if (it === 'add')
                    return (
                      <Pressable key={i} onPress={onAdd} style={[s.add, { width: cw, height: ch }]} accessibilityRole="button" accessibilityLabel="새 다이어리 추가">
                        <Text style={s.plus}>+</Text>
                        <Text style={s.addText}>새 다이어리</Text>
                      </Pressable>
                    );
                  return (
                    <Pressable
                      key={it.id}
                      onPress={() => onOpen(it.id)}
                      onLongPress={() => setMenu(it)}
                      delayLongPress={350}
                      style={[{ width: cw, height: ch }, s.book]}
                      accessibilityRole="button"
                      accessibilityLabel={`${it.title} ${it.year}`}
                    >
                      <CoverArt cover={it.cover} title={it.title} year={it.year} w={cw} h={ch} />
                      <View pointerEvents="none" style={[StyleSheet.absoluteFill, s.edge]} />
                    </Pressable>
                  );
                })}
              </View>
              <View style={s.plank} />
              <View style={s.plankShade} />
            </View>
          ))}
        </View>
      </ScrollView>

      <Modal visible={!!menu} transparent animationType="fade" onRequestClose={close}>
        <Pressable style={s.backdrop} onPress={close}>
          <Pressable style={s.sheet} onPress={() => {}}>
            <Text style={s.sheetTitle}>{menu?.title} · {menu?.year}</Text>
            {confirm ? (
              <>
                <Text style={s.warn}>정말 삭제할까요?{'\n'}이 다이어리의 일기와 공책이 모두 사라지고 되돌릴 수 없어요.</Text>
                <View style={s.btns}>
                  <Pressable style={s.btn} onPress={() => setConfirm(false)} accessibilityRole="button"><Text style={s.btnText}>취소</Text></Pressable>
                  <Pressable
                    style={[s.btn, s.danger]}
                    onPress={() => {
                      if (menu) onDelete(menu.id);
                      close();
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="삭제 확인"
                  >
                    <Text style={[s.btnText, { color: '#fff' }]}>삭제</Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <View style={s.btns}>
                <Pressable
                  style={s.btn}
                  onPress={() => {
                    if (menu) onEdit(menu.id);
                    close();
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="표지 꾸미기"
                >
                  <Text style={s.btnText}>표지 꾸미기</Text>
                </Pressable>
                <Pressable style={s.btn} onPress={() => setConfirm(true)} accessibilityRole="button" accessibilityLabel="삭제"><Text style={s.btnText}>삭제</Text></Pressable>
                <Pressable style={s.btn} onPress={close} accessibilityRole="button"><Text style={s.btnText}>닫기</Text></Pressable>
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.color.desk },
  head: { paddingHorizontal: PAD + 4, paddingTop: 18, paddingBottom: 22 },
  title: { fontFamily: font.serif, fontSize: 30, color: theme.color.pink, letterSpacing: 1 },
  titleKo: { fontFamily: font.bold, fontStyle: 'normal', fontSize: 26, letterSpacing: 0 },
  sub: { fontFamily: font.regular, fontSize: 13, color: '#8A8A8A', marginTop: 4 },
  row: { flexDirection: 'row', alignItems: 'flex-end' },
  book: { shadowColor: '#000', shadowOpacity: 0.6, shadowRadius: 6, shadowOffset: { width: 2, height: 4 }, elevation: 6 },
  edge: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)', borderTopRightRadius: 2, borderBottomRightRadius: 2 },
  add: { borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#555', alignItems: 'center', justifyContent: 'center', borderRadius: 3 },
  plus: { fontFamily: font.regular, fontSize: 36, color: '#9A9A9A', lineHeight: 40 },
  addText: { fontFamily: font.regular, fontSize: 12, color: '#8A8A8A', marginTop: 4 },
  plank: { height: 10, backgroundColor: '#2C2C2C', borderTopWidth: 1, borderTopColor: '#444' },
  plankShade: { height: 6, backgroundColor: '#0E0E0E' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#1E1E1E', padding: 20, paddingBottom: 34, borderTopLeftRadius: 18, borderTopRightRadius: 18 },
  sheetTitle: { fontFamily: font.bold, fontSize: 18, color: '#fff', marginBottom: 14 },
  warn: { fontFamily: font.regular, fontSize: 15, color: '#D8D8D8', lineHeight: 22, marginBottom: 16 },
  btns: { flexDirection: 'row', gap: 8 },
  btn: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: '#333' },
  danger: { backgroundColor: '#C23B4E' },
  btnText: { fontFamily: font.bold, fontSize: 15, color: '#fff' },
});
