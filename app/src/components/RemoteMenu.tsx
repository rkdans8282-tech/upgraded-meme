import { ReactNode, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { theme } from '../theme';

const { color, font } = theme;
const R = 140; // 버튼 중심에서 항목까지 거리
const ITEM = 54;
const FAB = 56;

export type RemoteKey = 'pen' | 'sticker' | 'photo' | 'tape' | 'calendar';

const icon = (k: RemoteKey): ReactNode => {
  const p = { stroke: color.text, strokeWidth: 1.8, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
  switch (k) {
    case 'pen':
      return (<><Path d="M4 20l1-5L16 4l4 4L9 19z" {...p} /><Path d="M14 6l4 4" {...p} /></>);
    case 'sticker':
      return (<><Path d="M5 4h14a1 1 0 011 1v9l-6 6H5a1 1 0 01-1-1V5a1 1 0 011-1z" {...p} /><Path d="M20 14h-5a1 1 0 00-1 1v5" {...p} /><Path d="M8.5 9v1M13.5 9v1M8.5 13c1 1 3 1 4 0" {...p} /></>);
    case 'photo':
      return (<><Rect x={3} y={5} width={18} height={14} rx={2} {...p} /><Circle cx={9} cy={10} r={1.6} {...p} /><Path d="M4 18l5-5 4 4 3-3 4 4" {...p} /></>);
    case 'tape':
      return (<Path d="M3 8l2 1.5L3 11l2 1.5L3 14l2 1.5L3 17h18l-2-1.5L21 14l-2-1.5L21 11l-2-1.5L21 8z" {...p} />);
    case 'calendar':
      return (<><Rect x={4} y={6} width={16} height={14} rx={2} {...p} /><Path d="M4 11h16M9 4v4M15 4v4" {...p} /></>);
  }
};

const LABELS: Record<RemoteKey, string> = { pen: '펜', sticker: '스티커', photo: '사진', tape: '테이프', calendar: '달력' };

type Props = { items: RemoteKey[]; onPick: (k: RemoteKey) => void };

// 화면에 떠 있는 둥근 리모컨 버튼: 누르면 둥글게 펼쳐지는 메뉴 (아이폰 보조 터치처럼)
export function RemoteMenu({ items, onPick }: Props) {
  const [open, setOpen] = useState(false);
  const a = useRef(new Animated.Value(0)).current;

  const toggle = (to: boolean) => {
    setOpen(to);
    Animated.spring(a, { toValue: to ? 1 : 0, friction: 7, tension: 90, useNativeDriver: true }).start();
  };

  return (
    <>
      {open && <Pressable style={StyleSheet.absoluteFill} onPress={() => toggle(false)} accessibilityLabel="메뉴 닫기" />}
      <View style={s.anchor} pointerEvents="box-none">
        {items.map((k, i) => {
          const deg = 180 + (items.length === 1 ? 45 : (90 * i) / (items.length - 1)); // 왼쪽 → 위쪽
          const rad = (deg * Math.PI) / 180;
          return (
            <Animated.View
              key={k}
              pointerEvents={open ? 'auto' : 'none'}
              style={[
                s.item,
                {
                  opacity: a,
                  transform: [
                    { translateX: a.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(rad) * R] }) },
                    { translateY: a.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(rad) * R] }) },
                    { scale: a },
                  ],
                },
              ]}
            >
              <Pressable
                onPress={() => {
                  toggle(false);
                  onPick(k);
                }}
                style={s.itemBtn}
                accessibilityRole="button"
                accessibilityLabel={LABELS[k]}
              >
                <Svg width={24} height={24} viewBox="0 0 24 24">{icon(k)}</Svg>
                <Text style={s.label}>{LABELS[k]}</Text>
              </Pressable>
            </Animated.View>
          );
        })}
        <Pressable onPress={() => toggle(!open)} style={s.fab} accessibilityRole="button" accessibilityLabel="꾸미기 메뉴 열기">
          <View style={s.fabRing}>
            <View style={s.fabDot} />
          </View>
        </Pressable>
      </View>
    </>
  );
}

const s = StyleSheet.create({
  anchor: { position: 'absolute', right: 16, bottom: 20, width: FAB, height: FAB },
  fab: {
    width: FAB, height: FAB, borderRadius: FAB / 2, backgroundColor: 'rgba(70,60,50,0.82)', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 6,
  },
  fabRing: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.28)', alignItems: 'center', justifyContent: 'center' },
  fabDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.92)' },
  item: { position: 'absolute', left: (FAB - ITEM) / 2, top: (FAB - ITEM) / 2, width: ITEM, height: ITEM },
  itemBtn: {
    width: ITEM, height: ITEM, borderRadius: ITEM / 2, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#E4E4E4', shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 5, shadowOffset: { width: 0, height: 2 }, elevation: 5,
  },
  label: { fontFamily: font.bold, fontSize: 12, color: color.text, marginTop: -1 },
});
