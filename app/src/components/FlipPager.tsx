import { forwardRef, ReactNode, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Keyboard, PanResponder, StyleSheet, View } from 'react-native';

// 책장이 넘어가는 방향(회전 부호). 화면에서 책장이 앞으로 들리도록 맞춘 값.
export const FLIP_SIGN = -1;

// 책장을 잡을 수 있는 곳: 종이 오른쪽 끝 이만큼의 폭 (공책 글 칸도 이만큼 오른쪽을 비워 둠)
export const FLIP_EDGE = 40;

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
  const rootRef = useRef<View>(null);
  const left = useRef(0); // 화면에서 종이 왼쪽 끝 위치 (손가락이 오른쪽 끝을 잡았는지 보려고)

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
    Keyboard.dismiss(); // 글 쓰다가 책장을 잡으면 키보드는 내림
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
        // 종이 오른쪽 끝(FLIP_EDGE)을 잡고 옆으로 밀 때만 책장을 넘김. 글 쓰는 자리를 눌러서는 절대 넘어가지 않음
        // 방향은 손가락을 가로채는 순간에 정함 (잡은 뒤에는 dx가 0부터 다시 시작해서 방향을 알 수 없음)
        onMoveShouldSetPanResponderCapture: (_, g) => {
          if (drag.current.busy) return false;
          const w = live.current.width;
          const startX = g.moveX - g.dx; // 손가락을 처음 댄 곳 (가로채기 전에는 g.x0가 비어 있음)
          if (startX < left.current + w - FLIP_EDGE - 8) return false;
          const ok = Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy) * 1.2;
          if (ok) swipeDir.current = g.dx < 0 ? 1 : -1;
          return ok;
        },
        onPanResponderGrant: () => {
          if (!begin(swipeDir.current)) drag.current.dir = 0;
        },
        onPanResponderMove: (_, g) => {
          const d = drag.current;
          if (!d.dir || d.busy) return;
          const w = live.current.width;
          // 앞 장으로 돌아갈 때는 오른쪽 끝에서 바깥으로 조금만 밀어도 넘어오게 (손가락이 움직일 자리가 좁음)
          const raw = d.dir === 1 ? -g.dx / w : g.dx / (w * 0.12);
          d.v = Math.max(0, Math.min(1, raw));
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
    settle(d.v > 0.35 || speed > 0.4, 220);
  }

  const pivot = (deg: Animated.AnimatedInterpolation<string>) => ({
    transform: [{ perspective: 1400 }, { translateX: -width / 2 }, { rotateY: deg }, { translateX: width / 2 }],
  });
  const angle = (out: number[]) =>
    p.interpolate({ inputRange: input, outputRange: out.map((a) => `${FLIP_SIGN * a}deg`) });
  const fade = (a: number, b: number) => p.interpolate({ inputRange: [0, 1], outputRange: [a, b] });

  // 평소: 한 장만 보임 / 넘기는 중: 아래 장 + 위에서 움직이는 장
  // 쪽마다 key를 붙여서, 넘기는 동안에도 지금 쪽은 같은 화면(같은 글상자)을 그대로 씀
  // → 쓰던 글이 다른 쪽에 들어가거나, 되돌리기가 다른 쪽에 적용되는 일이 없음
  const forward = incoming?.dir === 1;
  const order = incoming ? (forward ? [incoming.key, current] : [current, incoming.key]) : [current];

  return (
    <View
      ref={rootRef}
      style={styles.fill}
      onLayout={() => rootRef.current?.measureInWindow((x) => (left.current = x))}
      {...pan.panHandlers}
    >
      {order.map((k, i) => {
        const over = !!incoming && i === 1;
        return (
          <Animated.View
            key={k}
            pointerEvents={incoming ? 'none' : 'auto'}
            style={[styles.fill, over ? pivot(angle(forward ? outFlip : outIn)) : null]}
          >
            {renderPage(k)}
            {incoming && (
              // 아래 장: 위 장이 들려 올라갈수록 밝아짐 / 위 장: 비스듬해질수록 그늘이 짙어짐
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.fill,
                  { backgroundColor: '#3a2e1e', opacity: over ? (forward ? fade(0, 0.35) : fade(0.35, 0)) : forward ? fade(0.28, 0) : fade(0, 0.28) },
                ]}
              />
            )}
          </Animated.View>
        );
      })}
    </View>
  );
});

export default FlipPager;

const styles = StyleSheet.create({ fill: { ...StyleSheet.absoluteFill } });
