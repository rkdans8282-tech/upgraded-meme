import { memo, useMemo, useRef, useState } from 'react';
import { Image, PanResponder, StyleSheet, View } from 'react-native';
import Svg, { ClipPath, Defs, Image as SvgImage, Polygon } from 'react-native-svg';
import { BASE_SIZE, SCALE_MAX, SCALE_MIN, Sticker, stickerSource } from '../stickers';
import { photoUri } from '../photos';
import { theme } from '../theme';

type Pose = Pick<Sticker, 'x' | 'y' | 'scale' | 'rot'>;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

type ItemProps = {
  s: Sticker;
  selected: boolean;
  pageW: number;
  pageH: number;
  onSelect: (id: string) => void;
  onCommit: (next: Sticker) => void;
};

// 스티커 하나: 한 손가락 = 이동, 두 손가락 = 크기·회전
function StickerItem({ s, selected, pageW, pageH, onSelect, onCommit }: ItemProps) {
  const [live, setLive] = useState<Pose | null>(null);
  const cur: Pose = live ?? s;
  const latest = useRef({ s, pageW, pageH, onSelect, onCommit });
  latest.current = { s, pageW, pageH, onSelect, onCommit };
  const g = useRef({ pose: cur as Pose, base: { x: s.x, y: s.y }, pinch: false, d0: 1, a0: 0, scale0: 1, rot0: 0 });

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false, // 책장 넘기기 제스처가 가로채지 못하게
        onPanResponderGrant: () => {
          const { s: st } = latest.current;
          latest.current.onSelect(st.id);
          g.current = { pose: { x: st.x, y: st.y, scale: st.scale, rot: st.rot }, base: { x: st.x, y: st.y }, pinch: false, d0: 1, a0: 0, scale0: st.scale, rot0: st.rot };
        },
        onPanResponderMove: (e, gs) => {
          const { pageW: w, pageH: h } = latest.current;
          const t = e.nativeEvent.touches;
          const c = g.current;
          if (t && t.length >= 2) {
            const dx = t[1].pageX - t[0].pageX, dy = t[1].pageY - t[0].pageY;
            const d = Math.hypot(dx, dy) || 1, a = (Math.atan2(dy, dx) * 180) / Math.PI;
            if (!c.pinch) {
              c.pinch = true; c.d0 = d; c.a0 = a; c.scale0 = c.pose.scale; c.rot0 = c.pose.rot;
            }
            c.pose = { ...c.pose, scale: clamp(c.scale0 * (d / c.d0), SCALE_MIN, SCALE_MAX), rot: c.rot0 + (a - c.a0) };
          } else {
            if (c.pinch) {
              // 한 손가락을 뗐을 때 튀지 않게 기준점을 다시 잡음
              c.pinch = false;
              c.base = { x: c.pose.x - gs.dx / w, y: c.pose.y - gs.dy / h };
            }
            c.pose = { ...c.pose, x: clamp(c.base.x + gs.dx / w, 0, 1), y: clamp(c.base.y + gs.dy / h, 0, 1) };
          }
          setLive(c.pose);
        },
        onPanResponderRelease: () => finish(),
        onPanResponderTerminate: () => finish(),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  function finish() {
    const { s: st, onCommit: commit } = latest.current;
    const p = g.current.pose;
    setLive(null);
    if (p.x !== st.x || p.y !== st.y || p.scale !== st.scale || p.rot !== st.rot) commit({ ...st, ...p });
  }

  const src = s.photo ? { uri: photoUri(s.photo) } : stickerSource(s.key);
  if (!src) return null;
  const size = pageW * BASE_SIZE * cur.scale;
  const height = s.photo ? size / (s.aspect ?? 1) : size;
  return (
    <View
      {...pan.panHandlers}
      style={[
        st.item,
        { width: size, height, left: cur.x * pageW - size / 2, top: cur.y * pageH - size / 2, transform: [{ rotate: `${cur.rot}deg` }] },
        selected && st.selected,
      ]}
    >
      {s.photo && s.cut ? (
        <CutPhoto s={s} uri={photoUri(s.photo)} />
      ) : s.photo ? (
        <View style={st.photoFrame}>
          <Image source={src} style={st.img} resizeMode="cover" />
        </View>
      ) : (
        <Image source={src} style={st.img} resizeMode="contain" />
      )}
    </View>
  );
}

// 오린 사진: 흰 윤곽을 아래에 깔고, 그 위에 윤곽대로 자른 사진을 올림
function CutPhoto({ s, uri }: { s: Sticker; uri: string }) {
  const cut = s.cut!;
  const [bx, by, bx1] = cut.box;
  const bw = bx1 - bx;
  const ia = s.imgAspect ?? 1;
  const wv = 1000 / bw; // 사진 전체의 가상 너비 (경계 상자 너비 = 1000)
  const hv = wv / ia;
  const poly = cut.pts.reduce((a, v, i) => a + (i % 2 === 0 ? (i ? ' ' : '') + v * wv : ',' + v * hv), '');
  const id = `clip-${s.id}`;
  return (
    <Svg width="100%" height="100%" viewBox={`${bx * wv} ${by * hv} 1000 ${1000 / (s.aspect ?? 1)}`}>
      <Defs>
        <ClipPath id={id}>
          <Polygon points={poly} />
        </ClipPath>
      </Defs>
      <Polygon points={poly} fill="#000" fillOpacity={0.14} stroke="#000" strokeOpacity={0.14} strokeWidth={22} strokeLinejoin="round" transform="translate(5 9)" />
      <Polygon points={poly} fill="#fff" stroke="#fff" strokeWidth={22} strokeLinejoin="round" />
      <SvgImage href={{ uri }} x={0} y={0} width={wv} height={hv} preserveAspectRatio="none" clipPath={`url(#${id})`} />
    </Svg>
  );
}

type LayerProps = {
  stickers: Sticker[];
  selectedId: string | null;
  pageW: number;
  pageH: number;
  onSelect: (id: string) => void;
  onCommit: (next: Sticker) => void;
};

function StickerLayerBase({ stickers, selectedId, pageW, pageH, onSelect, onCommit }: LayerProps) {
  if (!pageW || !pageH) return null;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {stickers.map((s) => (
        <StickerItem key={s.id} s={s} selected={s.id === selectedId} pageW={pageW} pageH={pageH} onSelect={onSelect} onCommit={onCommit} />
      ))}
    </View>
  );
}
export const StickerLayer = memo(StickerLayerBase);

const st = StyleSheet.create({
  item: { position: 'absolute', borderRadius: 12 },
  selected: { borderWidth: 2, borderStyle: 'dashed', borderColor: theme.color.accent, backgroundColor: 'rgba(217,190,148,0.12)' },
  img: { width: '100%', height: '100%' },
  photoFrame: { flex: 1, borderWidth: 5, borderColor: '#fff', backgroundColor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.18)' },
});
