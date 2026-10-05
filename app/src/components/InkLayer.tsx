import { memo, useMemo, useRef, useState } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { MARKER_MULT, MARKER_OPACITY, Stroke, Tool, hits, toPath } from '../strokes';
import { newId } from '../stickers';

type Props = {
  strokes: Stroke[];
  pageW: number;
  pageH: number;
  drawing: boolean; // true일 때만 터치를 받아 그림
  tool: Tool;
  color: string;
  widthRatio: number;
  onChange: (next: Stroke[]) => void; // 획이 추가/삭제될 때 (손을 뗄 때 한 번)
};

// 다 그린 획은 경로 문자열을 한 번만 만들어 두고, 그리는 중인 획만 다시 그림
const Done = memo(function Done({ strokes, w, h }: { strokes: Stroke[]; w: number; h: number }) {
  const paths = useMemo(() => strokes.map((s) => ({ s, d: toPath(s.pts, w, h) })), [strokes, w, h]);
  return (
    <>
      {paths.map(({ s, d }) => (
        <Path
          key={s.id}
          d={d}
          stroke={s.color}
          strokeWidth={s.width * w * (s.tool === 'marker' ? MARKER_MULT : 1)}
          strokeOpacity={s.tool === 'marker' ? MARKER_OPACITY : 1}
          strokeLinecap={s.tool === 'marker' ? 'butt' : 'round'}
          strokeLinejoin="round"
          fill="none"
        />
      ))}
    </>
  );
});

function InkLayerBase({ strokes, pageW, pageH, drawing, tool, color, widthRatio, onChange }: Props) {
  const [live, setLive] = useState<Stroke | null>(null);
  const [erased, setErased] = useState<Stroke[] | null>(null); // 지우개로 지우는 중인 목록
  const latest = useRef({ strokes, pageW, pageH, tool, color, widthRatio, onChange });
  latest.current = { strokes, pageW, pageH, tool, color, widthRatio, onChange };
  const cur = useRef<{ stroke: Stroke | null; erased: Stroke[] | null; changed: boolean }>({ stroke: null, erased: null, changed: false });

  const pan = useMemo(() => {
    const at = (e: { nativeEvent: { locationX: number; locationY: number } }) => {
      const { pageW: w, pageH: h } = latest.current;
      return [Math.min(1, Math.max(0, e.nativeEvent.locationX / w)), Math.min(1, Math.max(0, e.nativeEvent.locationY / h))];
    };
    const erase = (x: number, y: number) => {
      const c = cur.current;
      const base = c.erased ?? latest.current.strokes;
      const aspect = latest.current.pageH / latest.current.pageW;
      const next = base.filter((s) => !hits(s, x, y, aspect));
      if (next.length !== base.length) {
        c.erased = next;
        c.changed = true;
        setErased(next);
      }
    };
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false, // 책장 넘기기 제스처가 가로채지 못하게
      onPanResponderGrant: (e) => {
        const [x, y] = at(e);
        const { tool: t, color: col, widthRatio: wr } = latest.current;
        cur.current = { stroke: null, erased: null, changed: false };
        if (t === 'eraser') return erase(x, y);
        const stroke: Stroke = { id: newId(), tool: t, color: col, width: wr, pts: [x, y] };
        cur.current.stroke = stroke;
        setLive(stroke);
      },
      onPanResponderMove: (e) => {
        const [x, y] = at(e);
        const c = cur.current;
        if (latest.current.tool === 'eraser') return erase(x, y);
        if (!c.stroke) return;
        const { pts } = c.stroke;
        const lx = pts[pts.length - 2], ly = pts[pts.length - 1];
        const aspect = latest.current.pageH / latest.current.pageW;
        if (Math.hypot(x - lx, (y - ly) * aspect) < 0.003) return; // 너무 촘촘한 점은 건너뜀
        c.stroke = { ...c.stroke, pts: [...pts, x, y] };
        setLive(c.stroke);
      },
      onPanResponderRelease: () => finish(),
      onPanResponderTerminate: () => finish(),
    });
    function finish() {
      const c = cur.current;
      const { strokes: base, onChange: commit } = latest.current;
      if (c.stroke) commit([...base, c.stroke]);
      else if (c.changed && c.erased) commit(c.erased);
      cur.current = { stroke: null, erased: null, changed: false };
      setLive(null);
      setErased(null);
    }
  }, []);

  if (!pageW || !pageH) return null;
  const shown = erased ?? strokes;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={drawing ? 'auto' : 'none'} {...(drawing ? pan.panHandlers : null)}>
      <Svg width={pageW} height={pageH} pointerEvents="none">
        <Done strokes={shown} w={pageW} h={pageH} />
        {live && <Done strokes={[live]} w={pageW} h={pageH} />}
      </Svg>
    </View>
  );
}

export const InkLayer = memo(InkLayerBase);
