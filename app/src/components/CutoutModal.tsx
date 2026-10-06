import { useMemo, useRef, useState } from 'react';
import { Image, Modal, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';
import { photoUri } from '../photos';
import type { Cut } from '../stickers';
import { theme } from '../theme';

const { color, font } = theme;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const MIN_POINTS = 8;
const MARGIN = 0.03; // 경계 상자 여유

type Props = { photo: string; imgAspect: number; onDone: (cut: Cut) => void; onClose: () => void };

// 사진 위에 손가락으로 윤곽을 한 번에 그리면, 놓는 순간 닫힌 다각형이 됨
export function CutoutModal({ photo, imgAspect, onDone, onClose }: Props) {
  const [area, setArea] = useState({ w: 0, h: 0 });
  const [pts, setPts] = useState<number[][]>([]); // 화면 좌표 [x, y]
  const [closed, setClosed] = useState(false);
  const live = useRef<number[][]>([]);
  const start = useRef([0, 0]);

  // 사진이 contain으로 놓인 영역
  const fitW = area.w / area.h > imgAspect ? area.h * imgAspect : area.w;
  const fitH = fitW / imgAspect;
  const ox = (area.w - fitW) / 2, oy = (area.h - fitH) / 2;
  const rect = useRef({ ox, oy, fitW, fitH });
  rect.current = { ox, oy, fitW, fitH };

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (e) => {
          start.current = [e.nativeEvent.locationX, e.nativeEvent.locationY];
          live.current = [start.current];
          setClosed(false);
          setPts(live.current);
        },
        onPanResponderMove: (_, gs) => {
          const p = [start.current[0] + gs.dx, start.current[1] + gs.dy];
          const last = live.current[live.current.length - 1];
          if (Math.hypot(p[0] - last[0], p[1] - last[1]) < 3) return;
          live.current = [...live.current, p];
          setPts(live.current);
        },
        onPanResponderRelease: () => setClosed(live.current.length >= MIN_POINTS),
        onPanResponderTerminate: () => setClosed(live.current.length >= MIN_POINTS),
      }),
    [],
  );

  const finish = () => {
    const r = rect.current;
    const norm = live.current.flatMap(([x, y]) => [clamp((x - r.ox) / r.fitW, 0, 1), clamp((y - r.oy) / r.fitH, 0, 1)]);
    const xs = norm.filter((_, i) => i % 2 === 0), ys = norm.filter((_, i) => i % 2 === 1);
    const box: Cut['box'] = [
      clamp(Math.min(...xs) - MARGIN, 0, 1), clamp(Math.min(...ys) - MARGIN, 0, 1),
      clamp(Math.max(...xs) + MARGIN, 0, 1), clamp(Math.max(...ys) + MARGIN, 0, 1),
    ];
    onDone({ pts: norm, box });
  };
  const reset = () => {
    live.current = [];
    setPts([]);
    setClosed(false);
  };

  return (
    <Modal visible animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={s.wrap}>
        <Text style={s.title}>오리고 싶은 모양을 따라 쭉 그려주세요</Text>
        <View style={s.area} onLayout={(e) => setArea({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
          {area.w > 0 && (
            <Image source={{ uri: photoUri(photo) }} style={{ position: 'absolute', left: ox, top: oy, width: fitW, height: fitH }} />
          )}
          <Svg width={area.w} height={area.h} style={StyleSheet.absoluteFill} pointerEvents="none">
            {pts.length > 1 && (
              <Polygon
                points={pts.map((p) => p.join(',')).join(' ')}
                fill={closed ? 'rgba(255,255,255,0.25)' : 'none'}
                stroke={color.text}
                strokeWidth={4}
                strokeLinejoin="round"
                strokeDasharray={closed ? undefined : '10 6'}
              />
            )}
          </Svg>
          <View style={StyleSheet.absoluteFill} {...pan.panHandlers} />
        </View>
        <View style={s.bar}>
          <Pressable onPress={onClose} style={s.btn} accessibilityRole="button" accessibilityLabel="취소">
            <Text style={s.btnText}>취소</Text>
          </Pressable>
          <Pressable onPress={reset} disabled={pts.length === 0} style={[s.btn, pts.length === 0 && { opacity: 0.35 }]} accessibilityRole="button" accessibilityLabel="다시 그리기">
            <Text style={s.btnText}>다시 그리기</Text>
          </Pressable>
          <Pressable onPress={finish} disabled={!closed} style={[s.btn, s.btnStrong, !closed && { opacity: 0.35 }]} accessibilityRole="button" accessibilityLabel="오리기 완료">
            <Text style={s.btnText}>✓ 오리기 완료</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: color.paper, paddingTop: 48, paddingBottom: 20, paddingHorizontal: 12 },
  title: { fontFamily: font.bold, fontSize: 20, color: color.text, textAlign: 'center', marginBottom: 10 },
  area: { flex: 1, backgroundColor: '#E9DBC6', borderRadius: 12, overflow: 'hidden' },
  bar: { flexDirection: 'row', gap: 8, marginTop: 12 },
  btn: { flex: 1, minHeight: theme.minTouch, alignItems: 'center', justifyContent: 'center', borderRadius: theme.radius.pill, backgroundColor: color.accentSoft },
  btnStrong: { flex: 1.5, backgroundColor: color.accent },
  btnText: { fontFamily: font.bold, fontSize: 18, color: color.text },
});
