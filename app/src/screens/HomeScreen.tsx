import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Chick } from '../components/Chick';
import { moods } from '../moods';
import { loadMoods, saveMood, todayKey } from '../storage';
import { theme } from '../theme';
import type { ChickMood } from '../chickSvgs';

const { color } = theme;
const DAYS = ['일', '월', '화', '수', '목', '금', '토'];

export default function HomeScreen() {
  const [mood, setMood] = useState<ChickMood | null>(null);
  const { width, height } = useWindowDimensions();
  const heroSize = Math.min(width - 80, height * 0.28, 380);

  useEffect(() => {
    loadMoods().then((m) => setMood(m[todayKey()] ?? null));
  }, []);

  const pick = (m: ChickMood) => {
    Haptics.selectionAsync().catch(() => {});
    setMood(m);
    saveMood(todayKey(), m);
  };

  const now = new Date();
  const title = `${now.getMonth() + 1}월 ${now.getDate()}일 ${DAYS[now.getDay()]}요일`;
  const say = moods.find((m) => m.key === mood)?.say ?? '오늘은 어땠어? 기분을 콕! 눌러줘 삐약!';

  return (
    <View style={s.root}>
      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.content}>
          <Text style={s.date}>{title}</Text>

          <View style={s.hero}>
            <View style={s.bubble}>
              <Text style={s.bubbleText}>{say}</Text>
            </View>
            <Chick mood={mood ?? 'normal'} size={heroSize} />
          </View>

          <Text style={s.section}>오늘 기분</Text>
          <View style={s.moodRow}>
            {moods.map((m) => {
              const on = mood === m.key;
              return (
                <Pressable
                  key={m.key}
                  onPress={() => pick(m.key)}
                  accessibilityRole="button"
                  accessibilityLabel={`오늘 기분 ${m.label}`}
                  style={[s.moodBtn, on && s.moodBtnOn]}
                >
                  <Chick mood={m.key} size={52} />
                  <Text style={[s.moodLabel, on && s.moodLabelOn]}>{m.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <View style={s.bottom}>
        <Pressable
          style={({ pressed }) => [s.writeBtn, pressed && { backgroundColor: color.yolk }]}
          accessibilityRole="button"
          onPress={() => Alert.alert('삐약!', '일기 쓰기 화면은 다음 단계에서 만들어요 🐥')}
        >
          <Text style={s.writeText}>＋ 오늘 일기 쓰기</Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg },
  scroll: { flexGrow: 1, paddingBottom: 100 },
  content: { flex: 1, width: '100%', maxWidth: 560, alignSelf: 'center', alignItems: 'center', padding: 20 },
  hero: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center' },
  date: { fontSize: 24, fontWeight: '800', color: color.text, marginTop: 8 },
  bubble: {
    backgroundColor: color.paper, borderRadius: theme.radius.card, borderWidth: 2,
    borderColor: color.yellow, paddingVertical: 12, paddingHorizontal: 18, marginBottom: 8,
  },
  bubbleText: { fontSize: 17, color: color.text, textAlign: 'center' },
  section: { alignSelf: 'flex-start', fontSize: 18, fontWeight: '700', color: color.text, marginTop: 16, marginBottom: 10 },
  moodRow: { flexDirection: 'row', gap: 10, width: '100%' },
  moodBtn: {
    flex: 1, minHeight: 92, alignItems: 'center', justifyContent: 'center', paddingVertical: 8,
    backgroundColor: color.paper, borderRadius: theme.radius.card, borderWidth: 3, borderColor: 'transparent',
  },
  moodBtnOn: { borderColor: color.yolk, backgroundColor: '#FFF2B8' },
  moodLabel: { fontSize: 14, color: color.textSoft, marginTop: 2 },
  moodLabelOn: { color: color.text, fontWeight: '800' },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 16, alignItems: 'center' },
  writeBtn: {
    minHeight: 56, minWidth: 240, paddingHorizontal: 32, borderRadius: theme.radius.pill,
    backgroundColor: color.yellow, alignItems: 'center', justifyContent: 'center',
    shadowColor: color.yolk, shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  writeText: { fontSize: 20, fontWeight: '800', color: color.text },
});
