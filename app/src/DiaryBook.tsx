import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Keyboard, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import FlipPager, { FLIP_SIGN } from './components/FlipPager';
import { DiaryPage } from './components/DiaryPage';
import { CalendarPage } from './components/CalendarPage';
import { SLOT } from './components/PageHoles';
import { Cover } from './components/Cover';
import { PageIndex } from './components/PageIndex';
import type { Diary } from './diaries';
import { MEMO_PAGES, calKeyOf, isCal, memoNo, neighbor } from './book';
import { todayKey } from './dates';
import { useEntries } from './useEntries';
import { useSounds } from './sounds';
import { theme } from './theme';
import type { Sticker } from './stickers';
import type { Layout } from './layouts';
import type { Stroke } from './strokes';

const { color } = theme;
const ZOOM_FROM = 0.14; // 날짜 칸이 확대되기 시작하는 크기

// 다이어리 한 권 (겉표지 → 달력 12장 → 공책 300장)
export function DiaryBook({ diary, onBack }: { diary: Diary; onBack: () => void }) {
  const { entries, ready, update, flush } = useEntries(diary.id);
  const sounds = useSounds();

  const today = todayKey();
  const year = String(diary.year);
  // 이번 연도 다이어리면 이번 달 달력부터, 다른 해면 1월부터
  const homeCal = useCallback(() => (today.slice(0, 4) === year ? calKeyOf(today) : `cal:${year}-01`), [today, year]);
  const [page, setPage] = useState(homeCal); // 지금 펼친 쪽: 'cal:YYYY-MM' 또는 'memo:N'
  const [phase, setPhase] = useState<'cover' | 'opening' | 'book'>('cover');
  const [box, setBox] = useState({ w: 0, h: 0 });
  const coverAnim = useRef(new Animated.Value(0)).current;
  const bookRef = useRef<View>(null);

  // 키보드가 열려 있는 동안(글 쓰는 중)에는 밀어서 책장 넘기기를 끔
  const [kbOpen, setKbOpen] = useState(false);
  useEffect(() => {
    const a = Keyboard.addListener('keyboardDidShow', () => setKbOpen(true));
    const b = Keyboard.addListener('keyboardDidHide', () => setKbOpen(false));
    return () => {
      a.remove();
      b.remove();
    };
  }, []);

  const holes = Math.max(6, Math.floor(box.h / 46)); // 두꺼운 스프링이 촘촘히

  // 저장 버튼: 지금 바로 저장하고 잠깐 알려줌 (평소에도 쓰는 대로 자동 저장됨)
  const [saved, setSaved] = useState(false);
  const onSave = useCallback(async () => {
    await flush();
    setSaved(true);
    setTimeout(() => setSaved(false), 1400);
  }, [flush]);
  const [indexOpen, setIndexOpen] = useState(false);
  const openIndex = useCallback(() => setIndexOpen(true), []);

  const animateCover = useCallback((to: 0 | 1, end: 'cover' | 'book') => {
    sounds.flip();
    setPhase('opening');
    coverAnim.setValue(1 - to);
    Animated.timing(coverAnim, { toValue: to, duration: 700, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }).start(
      () => setPhase(end),
    );
  }, [sounds, coverAnim]);

  // 날짜 칸 확대: 누른 자리에서 종이가 커지며 열림
  const [zoom, setZoom] = useState<{ day: string; px: number; py: number } | null>(null);
  const zoomAnim = useRef(new Animated.Value(0)).current;
  const openZoom = useCallback((day: string, pageX: number, pageY: number) => {
    sounds.flip();
    const start = (px: number, py: number) => {
      zoomAnim.setValue(0);
      setZoom({ day, px, py });
      Animated.timing(zoomAnim, { toValue: 1, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    };
    if (bookRef.current) bookRef.current.measureInWindow((x, y) => start(pageX - x, pageY - y));
    else start(box.w / 2, box.h / 2);
  }, [sounds, zoomAnim, box]);
  const closeZoom = useCallback(() => {
    Animated.timing(zoomAnim, { toValue: 0, duration: 240, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(() => setZoom(null));
  }, [zoomAnim]);

  const goShelf = useCallback(async () => {
    await flush();
    onBack();
  }, [flush, onBack]);

  const onLayout = useCallback((d: string, layout: Layout) => update(d, { layout }), [update]);
  const onText = useCallback((d: string, text: string) => update(d, { text }), [update]);
  const onStickers = useCallback((d: string, stickers: Sticker[]) => update(d, { stickers }), [update]);
  const onStrokes = useCallback((d: string, strokes: Stroke[]) => update(d, { strokes }), [update]);
  // 방문한 쪽 기록: 쪽을 옮길 때마다 직전 쪽을 쌓아 두었다가 '뒤로'로 한 단계씩 되돌아감
  const trail = useRef<string[]>([]);
  const pageRef = useRef(page);
  pageRef.current = page;
  const go = useCallback((k: string) => {
    const cur = pageRef.current;
    if (k === cur) return;
    trail.current = [...trail.current.slice(-39), cur];
    Keyboard.dismiss(); // 쪽을 옮기면 키보드는 닫음 (달력 위에 키보드가 남지 않게)
    setPage(k);
  }, []);
  const goCalendar = useCallback(() => {
    sounds.flip();
    go(homeCal());
  }, [sounds, homeCal, go]);
  // 뒤로: 열린 목록/확대 화면 → 직전에 본 쪽 → (달력에서는) 표지 → 책장
  const goBack = useCallback(() => {
    if (indexOpen) return setIndexOpen(false);
    if (zoom) return closeZoom();
    const prev = trail.current.pop();
    if (prev) {
      sounds.flip();
      setPage(prev);
      return;
    }
    if (phase === 'book') {
      trail.current = [];
      return animateCover(0, 'cover');
    }
    if (phase === 'cover') goShelf();
  }, [indexOpen, zoom, closeZoom, sounds, phase, goShelf, animateCover]);
  const nav = useCallback((key: string, dir: 1 | -1) => neighbor(key, dir, year), [year]);

  const renderPage = useCallback(
    (key: string) =>
      isCal(key) ? (
        <CalendarPage monthKey={key} entries={entries} today={today} holes={holes} pageAspect={box.w / (box.h || 1)} onPick={openZoom} onShelf={goShelf} onNotebook={openIndex} />
      ) : (
        <DiaryPage
          dayKey={key}
          entry={entries[key]}
          onText={onText}
          onStickers={onStickers}
          onStrokes={onStrokes}
          onScratch={sounds.scratch}
          onCalendar={goCalendar}
          onSave={onSave}
          onShelf={goShelf}
          layout={entries[key]?.layout}
          onLayout={onLayout}
          pageLabel={`${memoNo(key)} / ${MEMO_PAGES}`}
          onIndex={openIndex}
          holes={holes}
        />
      ),
    [entries, today, onText, onStickers, onStrokes, sounds.scratch, goCalendar, openZoom, goShelf, onSave, onLayout, openIndex, holes, box],
  );

  if (!ready) return <View style={{ flex: 1, backgroundColor: color.desk }} />;

  const coverDeg = coverAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${FLIP_SIGN * 100}deg`] });
  const zoomStyle = zoom && {
    opacity: zoomAnim.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] }),
    transform: [
      { translateX: zoomAnim.interpolate({ inputRange: [0, 1], outputRange: [(1 - ZOOM_FROM) * (zoom.px - box.w / 2), 0] }) },
      { translateY: zoomAnim.interpolate({ inputRange: [0, 1], outputRange: [(1 - ZOOM_FROM) * (zoom.py - box.h / 2), 0] }) },
      { scale: zoomAnim.interpolate({ inputRange: [0, 1], outputRange: [ZOOM_FROM, 1] }) },
    ],
  };

  return (
    <>
      <StatusBar style="light" />
      <SafeAreaView style={s.desk}>
        <KeyboardAvoidingView style={s.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable onPress={goBack} style={s.back} hitSlop={8} accessibilityRole="button" accessibilityLabel="뒤로 가기">
            <Text style={s.backText}>‹ {phase === 'cover' ? '책장' : '뒤로'}</Text>
          </Pressable>
          <View style={s.frame}>
            <View ref={bookRef} collapsable={false} style={s.book} onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
              {/* 책 두께(겹쳐진 종이 옆면) */}
              <View style={[s.edge, { right: -3, bottom: -3, backgroundColor: '#E2E2E2' }]} />
              <View style={[s.edge, { right: -1.5, bottom: -1.5, backgroundColor: color.paperEdge }]} />

              <View style={[s.pageBox, s.shadow]}>
                {phase !== 'cover' && box.w > 0 && (
                  <FlipPager
                    current={page}
                    neighbor={nav}
                    width={box.w}
                    renderPage={renderPage}
                    onChange={go}
                    onFlipSound={sounds.flip}
                    locked={kbOpen}
                  />
                )}
                {indexOpen && (
                  <PageIndex
                    entries={entries}
                    aspect={box.w / (box.h || 1)}
                    current={page}
                    onPick={(k) => {
                      sounds.flip();
                      go(k);
                      setIndexOpen(false);
                    }}
                    onClose={() => setIndexOpen(false)}
                  />
                )}
                {zoom && (
                  <Animated.View style={[StyleSheet.absoluteFill, s.zoomPage, zoomStyle]}>
                    <DiaryPage
                      dayKey={zoom.day}
                      dateLabel={zoom.day}
                      entry={entries[zoom.day]}
                      onText={onText}
                      onStickers={onStickers}
                      onStrokes={onStrokes}
                      onScratch={sounds.scratch}
                      onCalendar={closeZoom}
                      onSave={onSave}
                      onShelf={goShelf}
                      holes={holes}
                    />
                  </Animated.View>
                )}
              </View>

              {phase !== 'book' && (
                <Animated.View
                  style={[
                    StyleSheet.absoluteFill,
                    s.shadow,
                    {
                      transform: [{ perspective: 1400 }, { translateX: -box.w / 2 }, { rotateY: coverDeg }, { translateX: box.w / 2 }],
                    },
                  ]}
                  pointerEvents={phase === 'cover' ? 'auto' : 'none'}
                >
                  <Cover cover={diary.cover} title={diary.title} year={diary.year} w={box.w} h={box.h} onOpen={() => animateCover(1, 'book')} />
                </Animated.View>
              )}

              {saved && (
                <View style={s.toast} pointerEvents="none">
                  <Text style={s.toastText}>저장됐어요 ✓</Text>
                </View>
              )}

              {/* 스프링 (흰 링) */}
              <View style={s.rings} pointerEvents="none">
                {Array.from({ length: holes }, (_, i) => (
                  <View key={i} style={s.ringSlot}>
                    <View style={s.ring}>
                      <View style={s.ringShine} />
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const s = StyleSheet.create({
  fill: { flex: 1 },
  desk: { flex: 1, backgroundColor: color.desk },
  frame: { flex: 1, width: '100%', maxWidth: 760, alignSelf: 'center', paddingLeft: 34, paddingRight: 18, paddingTop: 52, paddingBottom: 18 },
  back: { position: 'absolute', top: 6, right: 14, zIndex: 20, minHeight: 40, paddingHorizontal: 8, justifyContent: 'center' },
  backText: { fontFamily: theme.font.regular, fontSize: 16, color: '#E6E6E6' },
  book: { flex: 1 },
  edge: { position: 'absolute', left: 3, top: 3, borderRadius: 0 },
  pageBox: { ...StyleSheet.absoluteFill, backgroundColor: color.paper },
  toast: { position: 'absolute', top: 18, alignSelf: 'center', backgroundColor: 'rgba(20,20,20,0.88)', paddingHorizontal: 18, paddingVertical: 9, borderRadius: 999 },
  toastText: { fontFamily: theme.font.bold, fontSize: 17, color: '#fff' },
  zoomPage: { backgroundColor: color.paper },
  shadow: { shadowColor: '#3b3326', shadowOpacity: 0.2, shadowRadius: 5, shadowOffset: { width: 1, height: 2 }, elevation: 4 },
  rings: { position: 'absolute', left: -28, top: 0, bottom: 0, width: 66, justifyContent: 'space-around' },
  ringSlot: { height: SLOT, justifyContent: 'center' },
  ring: {
    width: 66, height: 15, borderRadius: 8, backgroundColor: color.coil, borderWidth: 1, borderColor: color.coilEdge,
    shadowColor: '#3b3326', shadowOpacity: 0.28, shadowRadius: 2.5, shadowOffset: { width: 1, height: 2 }, elevation: 3,
  },
  ringShine: { position: 'absolute', bottom: 2, left: 8, right: 8, height: 2, borderRadius: 1, backgroundColor: '#E8E8E8' },
});
