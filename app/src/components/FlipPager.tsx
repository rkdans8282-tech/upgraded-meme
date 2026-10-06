import { forwardRef, ReactNode, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Animated, Easing, PanResponder, StyleSheet, View } from 'react-native';

// 책장이 넘어가는 방향(회전 부호). 화면에서 책장이 앞으로 들리도록 맞춘 값.
export const FLIP_SIGN = -1;

// 손가락이 움직인 만큼 책장 모서리가 따라오도록 acos 곡선을 미리 계산
const STEPS = 12;
const input = Array.from({ length: STEPS + 1 }, (_, i) => i / STEPS);
const outFlip = input.map((p) => (Math.acos(1 - p) * 180) / Math.PI); // 넘어가는 장: 0°→90°
const outIn = input.map((p) => (Math.acos(p) * 180) / Math.PI); // 들어오는 장: 90°→0°

export type FlipHandle = { flip: (dir: 1 | -1) => void };

type Props = {
  current: string; // 지금 보이는 쪽
  neighbor: (key: string, dir: 1 | -1) => string | null; // 앞/뒤 쪽 (없으면 null)
  width: number;
  renderPage: (key: string) => ReactNode;
  onChange: (key: string) => void;
  onFlipSound: () => void;
};

const FlipPager = forwardRef<FlipHandle, Props>(function FlipPager(
  { current, neighbor, width, renderPage, onChange, onFlipSound },
  ref,
) {
  const p = useRef(new Animated.Value(0)).current;
  const [incoming, setIncoming] = useState<{ dir: 1 | -1; key: string } | null>(null);
  const live = useRef({ current, neighbor, width, onChange, onFlipSound });
  live.current = { current, neighbor, width, onChange, onFlipSound };
  const drag = useRef({ dir: 0 as 0 | 1 | -1, key: '', v: 0, busy: false });
  const swipeDir = useRef<1 | -1>(1);

  const targetOf = (dir: 1 | -1) => {
    const { current: c, neighbor: n } = live.current;
    return n(c, dir);
  };

  const settle = (commit: boolean, ms: number) => {
    const d = drag.current;
    d.busy = true;
    Animated.timing(p, {
      toValue: commit ? 1 : 0,
      duration: ms,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      if (commit) live.current.onChange(d.key);
      p.setValue(0);
      setIncoming(null);
      d.dir = 0;
      d.busy = false;
    });
  };

  const begin = (dir: 1 | -1) => {
    const key = targetOf(dir);
    if (!key) return false;
    drag.current = { dir, key, v: 0, busy: false };
    p.setValue(0);
    setIncoming({ dir, key });
    live.current.onFlipSound();
    return true;
  };

  useImperativeHandle(ref, () => ({
    flip: (dir) => {
      if (drag.current.busy || drag.current.dir !== 0) return;
      if (begin(dir)) settle(true, 480);
    },
  }));

  const pan = useMemo(
    () =>
      PanResponder.create({
        // 방향은 손가락을 가로채는 순간에 정함 (잡은 뒤에는 dx가 0부터 다시 시작해서 방향을 알 수 없음)
        onMoveShouldSetPanResponderCapture: (_, g) => {
          const ok = !drag.current.busy && Math.abs(g.dx) > 16 && Math.abs(g.dx) > Math.abs(g.dy) * 2;
          if (ok) swipeDir.current = g.dx < 0 ? 1 : -1;
          return ok;
        },
        onPanResponderGrant: () => {
          if (!begin(swipeDir.current)) drag.current.dir = 0;
        },
        onPanResponderMove: (_, g) => {
          const d = drag.current;
          if (!d.dir || d.busy) return;
          const raw = d.dir === 1 ? -g.dx : g.dx;
          d.v = Math.max(0, Math.min(1, raw / live.current.width));
          p.setValue(d.v);
        },
        onPanResponderRelease: (_, g) => finish(g.vx),
        onPanResponderTerminate: (_, g) => finish(g.vx),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  function finish(vx: number) {
    const d = drag.current;
    if (!d.dir || d.busy) return;
    const speed = d.dir === 1 ? -vx : vx;
    settle(d.v > 0.35 || speed > 0.5, 220);
  }

  const pivot = (deg: Animated.AnimatedInterpolation<string>) => ({
    transform: [{ perspective: 1400 }, { translateX: -width / 2 }, { rotateY: deg }, { translateX: width / 2 }],
  });
  const angle = (out: number[]) =>
    p.interpolate({ inputRange: input, outputRange: out.map((a) => `${FLIP_SIGN * a}deg`) });
  const fade = (a: number, b: number) => p.interpolate({ inputRange: [0, 1], outputRange: [a, b] });

  // 평소: 한 장만 보임 / 넘기는 중: 아래 장 + 위에서 움직이는 장
  // 터치(드래그)는 항상 가장 바깥 View에서 받는다
  const forward = incoming?.dir === 1;
  const under = incoming ? (forward ? incoming.key : current) : current;
  const over = incoming ? (forward ? current : incoming.key) : null;

  return (
    <View style={styles.fill} {...pan.panHandlers}>
      <View style={styles.fill}>
        {renderPage(under)}
        {incoming && (
          // 위 장이 들려 올라갈수록 아래 장이 밝아짐
          <Animated.View
            pointerEvents="none"
            style={[styles.fill, { backgroundColor: '#3a2e1e', opacity: forward ? fade(0.28, 0) : fade(0, 0.28) }]}
          />
        )}
      </View>
      {incoming && over && (
        <Animated.View pointerEvents="none" style={[styles.fill, pivot(angle(forward ? outFlip : outIn))]}>
          {renderPage(over)}
          {/* 비스듬해질수록 그늘이 짙어짐 */}
          <Animated.View
            pointerEvents="none"
            style={[styles.fill, { backgroundColor: '#3a2e1e', opacity: forward ? fade(0, 0.35) : fade(0.35, 0) }]}
          />
        </Animated.View>
      )}
    </View>
  );
});

export default FlipPager;

const styles = StyleSheet.create({ fill: { ...StyleSheet.absoluteFill } });
