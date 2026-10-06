import { memo, useMemo, useRef, useState } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
import Svg, { G, Path, Polygon, Rect } from 'react-native-svg';
import { MARKER_MULT, MARKER_OPACITY, Stroke, Tool, hits, toPath } from '../strokes';
import { Sticker, newId, stickerHalf } from '../stickers';

export type GroupDrag = { ids: string[]; dx: number; dy: number };

type Props = {
  strokes: Stroke[];
  pageW: number;
  pageH: number;
  drawing: boolean; // true일 때만 터치를 받아 그림
  tool: Tool;
  color: string;
  widthRatio: number;
  onChange: (next: Stroke[]) => void; // 획이 추가/삭제/이동될 때 (손을 뗄 때 한 번)
  // 올가미(묶어서 옮기기)가 스티커·사진·글상자까지 함께 옮길 수 있게
  stickers?: Sticker[];
  onMoveStickers?: (next: Sticker[]) => void;
  onDrag?: (d: GroupDrag | null) => void; // 끌고 있는 동안 스티커 쪽 화면을 같이 움직이기 위한 알림
};

const NO_STICKERS: Sticker[] = [];
const noop1 = () => {};

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

// 점이 다각형 안에 있는가 (올가미 선택용)
function inside(poly: number[], x: number, y: number) {
  let c = false;
  for (let i = 0, j = poly.length - 2; i < poly.length; j = i, i += 2) {
    const xi = poly[i], yi = poly[i + 1], xj = poly[j], yj = poly[j + 1];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}
// 묶은 것들(획 + 스티커)이 차지하는 범위
const bounds = (list: Stroke[], stk: Sticker[], pageW: number, pageH: number) => {
  let x0 = 1, y0 = 1, x1 = 0, y1 = 0;
  for (const s of list) for (let i = 0; i < s.pts.length; i += 2) {
    x0 = Math.min(x0, s.pts[i]); x1 = Math.max(x1, s.pts[i]);
    y0 = Math.min(y0, s.pts[i + 1]); y1 = Math.max(y1, s.pts[i + 1]);
  }
  for (const s of stk) {
    const [hx, hy] = stickerHalf(s, pageW, pageH);
    x0 = Math.min(x0, s.x - hx); x1 = Math.max(x1, s.x + hx);
    y0 = Math.min(y0, s.y - hy); y1 = Math.max(y1, s.y + hy);
  }
  return { x0, y0, x1, y1 };
};
const PAD = 0.02;

type Gesture = { stroke: Stroke | null; erased: Stroke[] | null; changed: boolean; mode: 'draw' | 'lasso' | 'move'; loop: number[]; d: [number, number] };
const idle = (): Gesture => ({ stroke: null, erased: null, changed: false, mode: 'draw', loop: [], d: [0, 0] });

function InkLayerBase({ strokes, pageW, pageH, drawing, tool, color, widthRatio, onChange, stickers = NO_STICKERS, onMoveStickers = noop1, onDrag = noop1 }: Props) {
  const [live, setLive] = useState<Stroke | null>(null);
  const [erased, setErased] = useState<Stroke[] | null>(null); // 지우개로 지우는 중인 목록
  const [loop, setLoop] = useState<number[] | null>(null); // 올가미로 그리는 중인 선
  const [sel, setSel] = useState<string[]>([]); // 올가미로 묶은 획
  const [selSt, setSelSt] = useState<string[]>([]); // 올가미로 묶은 스티커·사진·글상자
  const [move, setMove] = useState<[number, number] | null>(null); // 묶음을 끌고 있는 거리 (비율)
  // 획·스티커가 바뀌어서(되돌리기 등) 사라진 것은 선택에서 뺌
  const selOk = useMemo(() => sel.filter((id) => strokes.some((x) => x.id === id)), [sel, strokes]);
  const selStOk = useMemo(() => selSt.filter((id) => stickers.some((x) => x.id === id)), [selSt, stickers]);
  const latest = useRef({ strokes, stickers, pageW, pageH, tool, color, widthRatio, onChange, onMoveStickers, onDrag, sel: selOk, selSt: selStOk });
  latest.current = { strokes, stickers, pageW, pageH, tool, color, widthRatio, onChange, onMoveStickers, onDrag, sel: selOk, selSt: selStOk };
  const cur = useRef<Gesture>(idle());

  // 올가미 모드가 아니게 되면 선택을 비움 (렌더 중에 상태를 맞춰 주는 방식)
  const lassoOn = tool === 'lasso' && drawing;
  const [wasLasso, setWasLasso] = useState(lassoOn);
  if (wasLasso !== lassoOn) {
    setWasLasso(lassoOn);
    if (!lassoOn) {
      setSel([]);
      setSelSt([]);
    }
  }

  const pan = useMemo(() => {
    const at = (e: { nativeEvent: { locationX: number; locationY: number } }) => {
      const { pageW: w, pageH: h } = latest.current;
      return [Math.min(1, Math.max(0, e.nativeEvent.locationX / w)), Math.min(1, Math.max(0, e.nativeEvent.locationY / h))];
    };
    const picked = () => {
      const L = latest.current;
      return { st: L.strokes.filter((s) => L.sel.includes(s.id)), sk: L.stickers.filter((s) => L.selSt.includes(s.id)) };
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
        const { tool: t, color: col, widthRatio: wr, pageW: w, pageH: h } = latest.current;
        cur.current = idle();
        if (t === 'eraser') return erase(x, y);
        if (t === 'lasso') {
          const p = picked();
          const b = bounds(p.st, p.sk, w, h);
          if (p.st.length + p.sk.length > 0 && x >= b.x0 - PAD && x <= b.x1 + PAD && y >= b.y0 - PAD && y <= b.y1 + PAD) {
            cur.current.mode = 'move'; // 묶음 안을 잡으면 옮기기
          } else {
            cur.current.mode = 'lasso';
            cur.current.loop = [x, y];
            setSel([]);
            setSelSt([]);
            setLoop([x, y]);
          }
          return;
        }
        const stroke: Stroke = { id: newId(), tool: t, color: col, width: wr, pts: [x, y] };
        cur.current.stroke = stroke;
        setLive(stroke);
      },
      onPanResponderMove: (e, gs) => {
        const c = cur.current;
        const { pageW: w, pageH: h } = latest.current;
        if (latest.current.tool === 'lasso') {
          if (c.mode === 'move') {
            c.d = [gs.dx / w, gs.dy / h];
            setMove(c.d);
            if (latest.current.selSt.length) latest.current.onDrag({ ids: latest.current.selSt, dx: c.d[0], dy: c.d[1] });
          } else {
            const [x, y] = at(e);
            c.loop = [...c.loop, x, y];
            setLoop(c.loop);
          }
          return;
        }
        const [x, y] = at(e);
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
      const L = latest.current;
      if (c.mode === 'lasso') {
        // 올가미 안에 절반 넘게 들어온 획, 가운데가 들어온 스티커·글상자를 묶음
        const poly = c.loop;
        const ok = poly.length >= 6;
        setSel(
          ok
            ? L.strokes
                .filter((s) => {
                  let k = 0;
                  for (let i = 0; i < s.pts.length; i += 2) if (inside(poly, s.pts[i], s.pts[i + 1])) k++;
                  return k * 2 >= s.pts.length / 2;
                })
                .map((s) => s.id)
            : [],
        );
        setSelSt(ok ? L.stickers.filter((s) => inside(poly, s.x, s.y)).map((s) => s.id) : []);
      } else if (c.mode === 'move') {
        const [dx, dy] = c.d;
        if (dx || dy) {
          const p = picked();
          const b = bounds(p.st, p.sk, L.pageW, L.pageH);
          // 종이 밖으로 나가지 않게 이동량을 제한
          const ddx = Math.min(1 - b.x1, Math.max(-b.x0, dx)), ddy = Math.min(1 - b.y1, Math.max(-b.y0, dy));
          if (p.st.length) L.onChange(L.strokes.map((s) => (L.sel.includes(s.id) ? { ...s, pts: s.pts.map((v, i) => v + (i % 2 === 0 ? ddx : ddy)) } : s)));
          if (p.sk.length) L.onMoveStickers(L.stickers.map((s) => (L.selSt.includes(s.id) ? { ...s, x: s.x + ddx, y: s.y + ddy } : s)));
        }
        L.onDrag(null);
      } else if (c.stroke) L.onChange([...L.strokes, c.stroke]);
      else if (c.changed && c.erased) L.onChange(c.erased);
      cur.current = idle();
      setLive(null);
      setErased(null);
      setLoop(null);
      setMove(null);
    }
  }, []);

  const shown = erased ?? strokes;
  const picked = useMemo(() => shown.filter((s) => selOk.includes(s.id)), [shown, selOk]);
  const pickedSt = useMemo(() => stickers.filter((s) => selStOk.includes(s.id)), [stickers, selStOk]);
  const rest = useMemo(() => (selOk.length ? shown.filter((s) => !selOk.includes(s.id)) : shown), [shown, selOk]);
  if (!pageW || !pageH) return null;
  const hasSel = picked.length + pickedSt.length > 0;
  const box = hasSel ? bounds(picked, pickedSt, pageW, pageH) : null;
  const [mx, my] = move ?? [0, 0];
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={drawing ? 'auto' : 'none'} {...(drawing ? pan.panHandlers : null)}>
      <Svg width={pageW} height={pageH} pointerEvents="none">
        <Done strokes={rest} w={pageW} h={pageH} />
        {hasSel && (
          <G x={mx * pageW} y={my * pageH}>
            <Done strokes={picked} w={pageW} h={pageH} />
            {box && (
              <Rect
                x={(box.x0 - PAD) * pageW}
                y={(box.y0 - PAD) * pageH}
                width={(box.x1 - box.x0 + PAD * 2) * pageW}
                height={(box.y1 - box.y0 + PAD * 2) * pageH}
                fill="rgba(106,166,201,0.08)"
                stroke="#6AA6C9"
                strokeWidth={1.5}
                strokeDasharray="6 4"
              />
            )}
          </G>
        )}
        {live && <Done strokes={[live]} w={pageW} h={pageH} />}
        {loop && loop.length >= 4 && (
          <Polygon
            points={loop.map((v, i) => (i % 2 === 0 ? v * pageW : v * pageH)).reduce((a, v, i) => a + (i % 2 === 0 ? (i ? ' ' : '') + v : ',' + v), '')}
            fill="rgba(106,166,201,0.1)"
            stroke="#6AA6C9"
            strokeWidth={1.5}
            strokeDasharray="5 4"
          />
        )}
      </Svg>
    </View>
  );
}

export const InkLayer = memo(InkLayerBase);
