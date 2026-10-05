import { useCallback, useRef, useState } from 'react';
import { Animated, Easing, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { useFonts } from 'expo-font';
import { Gaegu_400Regular, Gaegu_700Bold } from '@expo-google-fonts/gaegu';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import FlipPager, { FLIP_SIGN, FlipHandle } from './src/components/FlipPager';
import { DiaryPage } from './src/components/DiaryPage';
import { Cover } from './src/components/Cover';
import { Pane } from './src/components/Pane';
import { todayKey } from './src/dates';
import { useEntries } from './src/useEntries';
import { useSounds } from './src/sounds';
import { theme } from './src/theme';
import type { Mood } from './src/moods';
import type { Sticker } from './src/stickers';
import type { Stroke } from './src/strokes';
import { SLOT } from './src/components/DiaryPage';

const { color, font } = theme;
type PaneKey = 'calendar' | 'decor' | 'settings';
const TABS: { key: PaneKey | 'cover'; emoji: string; label: string; bg: string }[] = [
  { key: 'calendar', emoji: '📅', label: '달력', bg: '#F2D3CC' },
  { key: 'decor', emoji: '🎨', label: '꾸미기', bg: '#F4DDBD' },
  { key: 'settings', emoji: '⚙️', label: '설정', bg: '#D3E2EE' },
  { key: 'cover', emoji: '📕', label: '표지', bg: '#D8E5CF' },
];
const PANE_TITLE: Record<PaneKey, string> = { calendar: '달력', decor: '꾸미기', settings: '설정' };

export default function App() {
  const [fontsLoaded] = useFonts({ Gaegu_400Regular, Gaegu_700Bold });
  const { entries, ready, update } = useEntries();
  const sounds = useSounds();

  const today = todayKey();
  const [day, setDay] = useState(today);
  const [phase, setPhase] = useState<'cover' | 'opening' | 'book'>('cover');
  const [pane, setPane] = useState<PaneKey | null>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const coverAnim = useRef(new Animated.Value(0)).current;
  const pager = useRef<FlipHandle>(null);

  const holes = Math.max(6, Math.floor(box.h / 46)); // 두꺼운 스프링이 촘촘히

  const animateCover = (to: 0 | 1, end: 'cover' | 'book') => {
    sounds.flip();
    setPhase('opening');
    coverAnim.setValue(1 - to);
    Animated.timing(coverAnim, { toValue: to, duration: 700, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }).start(
      () => setPhase(end),
    );
  };

  const onText = useCallback((d: string, text: string) => update(d, { text }), [update]);
  const onMood = useCallback(
    (d: string, mood: Mood) => {
      Haptics.selectionAsync().catch(() => {});
      update(d, { mood });
    },
    [update],
  );
  const flipPage = useCallback((dir: 1 | -1) => pager.current?.flip(dir), []);
  const onStickers = useCallback((d: string, stickers: Sticker[]) => update(d, { stickers }), [update]);
  const onStrokes = useCallback((d: string, strokes: Stroke[]) => update(d, { strokes }), [update]);
  const renderPage = useCallback(
    (key: string) => (
      <DiaryPage
        dayKey={key}
        entry={entries[key]}
        isToday={key === today}
        onText={onText}
        onMood={onMood}
        onStickers={onStickers}
        onStrokes={onStrokes}
        onScratch={sounds.scratch}
        onFlip={flipPage}
        holes={holes}
      />
    ),
    [entries, today, onText, onMood, onStickers, onStrokes, sounds.scratch, flipPage, holes],
  );

  if (!fontsLoaded || !ready) return <View style={{ flex: 1, backgroundColor: color.desk }} />;

  const coverDeg = coverAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${FLIP_SIGN * 100}deg`] });

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <SafeAreaView style={s.desk}>
        <KeyboardAvoidingView style={s.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={s.frame}>
            <View style={s.book} onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
              {/* 책 두께(겹쳐진 종이 옆면) */}
              <View style={[s.edge, { right: -12, bottom: -12, backgroundColor: '#DCCFB9' }]} />
              <View style={[s.edge, { right: -8, bottom: -8, backgroundColor: '#E6DAC6' }]} />
              <View style={[s.edge, { right: -4, bottom: -4, backgroundColor: color.paperEdge }]} />

              <View style={[s.pageBox, s.shadow]}>
                {phase !== 'cover' && box.w > 0 && (
                  <FlipPager
                    ref={pager}
                    current={day}
                    max={today}
                    width={box.w}
                    renderPage={renderPage}
                    onChange={setDay}
                    onFlipSound={sounds.flip}
                  />
                )}
                {phase === 'book' && pane && <Pane title={PANE_TITLE[pane]} onClose={() => setPane(null)} />}

                {/* 오른쪽 아래 접힌 모서리 (장식) */}
                {phase === 'book' && !pane && <View style={s.foldRight} pointerEvents="none" />}
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
                  <Cover onOpen={() => animateCover(1, 'book')} />
                </Animated.View>
              )}

              {/* 스프링 */}
              <View style={s.rings} pointerEvents="none">
                {Array.from({ length: holes }, (_, i) => (
                  <View key={i} style={s.ringSlot}>
                    <View style={s.ring}>
                      <View style={s.ringShine} />
                    </View>
                  </View>
                ))}
              </View>

              {/* 인덱스 탭 */}
              <View style={s.tabs}>
                {TABS.map((t) => (
                  <Pressable
                    key={t.key}
                    hitSlop={{ top: 4, bottom: 4, left: 8, right: 8 }}
                    style={[s.tab, { backgroundColor: t.bg }]}
                    accessibilityRole="button"
                    accessibilityLabel={t.label}
                    onPress={() => {
                      Haptics.selectionAsync().catch(() => {});
                      if (t.key === 'cover') {
                        setPane(null);
                        if (phase === 'book') animateCover(0, 'cover');
                      } else if (phase === 'book') {
                        setPane(pane === t.key ? null : t.key);
                      }
                    }}
                  >
                    <Text style={s.tabEmoji}>{t.emoji}</Text>
                    <Text style={s.tabLabel}>{t.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const s = StyleSheet.create({
  fill: { flex: 1 },
  desk: { flex: 1, backgroundColor: color.desk },
  frame: { flex: 1, width: '100%', maxWidth: 760, alignSelf: 'center', paddingLeft: 34, paddingRight: 50, paddingVertical: 18 },
  book: { flex: 1 },
  edge: { position: 'absolute', left: 8, top: 6, borderRadius: 10 },
  pageBox: { ...StyleSheet.absoluteFill, backgroundColor: color.paper, borderTopRightRadius: 10, borderBottomRightRadius: 10 },
  shadow: { shadowColor: '#6b5a3e', shadowOpacity: 0.28, shadowRadius: 10, shadowOffset: { width: 2, height: 4 }, elevation: 6 },
  rings: { position: 'absolute', left: -28, top: 0, bottom: 0, width: 66, justifyContent: 'space-around' },
  ringSlot: { height: SLOT, justifyContent: 'center' },
  ring: {
    width: 66, height: 16, borderRadius: 8, backgroundColor: color.coil, borderWidth: 1.5, borderColor: color.coilEdge,
    shadowColor: '#6b5a3e', shadowOpacity: 0.35, shadowRadius: 3, shadowOffset: { width: 1, height: 2 }, elevation: 3,
  },
  ringShine: { position: 'absolute', top: 2.5, left: 8, right: 22, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.6)' },
  tabs: { position: 'absolute', right: -44, top: 36, width: 44 },
  tab: {
    height: 66, marginBottom: 8, alignItems: 'center', justifyContent: 'center',
    borderTopRightRadius: 12, borderBottomRightRadius: 12, shadowColor: '#6b5a3e', shadowOpacity: 0.2, shadowRadius: 3,
    shadowOffset: { width: 1, height: 1 }, elevation: 2,
  },
  tabEmoji: { fontSize: 22 },
  tabLabel: { fontFamily: font.bold, fontSize: 14, color: color.text, marginTop: 2 },
  foldRight: {
    position: 'absolute', right: 0, bottom: 0, width: 0, height: 0, borderStyle: 'solid',
    borderLeftWidth: 34, borderBottomWidth: 34, borderLeftColor: 'transparent', borderBottomColor: '#E4D8C2',
    borderBottomRightRadius: 10,
  },
});
