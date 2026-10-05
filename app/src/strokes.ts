// 손글씨 획. 좌표는 쪽(page) 크기에 대한 비율(0~1)이라 기기가 달라도 같은 자리에 그려짐
export type Tool = 'pen' | 'marker' | 'eraser';

export type Stroke = {
  id: string;
  tool: 'pen' | 'marker';
  color: string;
  width: number; // 쪽 너비 대비 비율
  pts: number[]; // [x0, y0, x1, y1, ...] (0~1)
};

export const PEN_COLORS = ['#4A3F35', '#E26D5C', '#F2A65A', '#E9C46A', '#8AB17D', '#6AA6C9', '#8E7DBE', '#E59AB5'];
export const WIDTHS = [
  { key: 'thin', label: '가늘게', ratio: 0.006 },
  { key: 'mid', label: '보통', ratio: 0.011 },
  { key: 'thick', label: '굵게', ratio: 0.02 },
] as const;
export const MARKER_MULT = 3; // 형광펜은 같은 굵기 선택의 3배
export const MARKER_OPACITY = 0.38;
export const ERASE_RADIUS = 0.035; // 쪽 너비 대비

// 점 목록 → 부드러운 SVG 경로 (중간점을 지나는 2차 곡선)
export function toPath(pts: number[], w: number, h: number): string {
  const n = pts.length / 2;
  if (n === 0) return '';
  const X = (i: number) => (pts[i * 2] * w).toFixed(1);
  const Y = (i: number) => (pts[i * 2 + 1] * h).toFixed(1);
  if (n === 1) return `M${X(0)} ${Y(0)} L${(pts[0] * w + 0.1).toFixed(1)} ${Y(0)}`; // 점 하나 = 동그란 점
  let d = `M${X(0)} ${Y(0)}`;
  for (let i = 1; i < n - 1; i++) {
    const mx = ((pts[i * 2] + pts[i * 2 + 2]) / 2) * w;
    const my = ((pts[i * 2 + 1] + pts[i * 2 + 3]) / 2) * h;
    d += ` Q${X(i)} ${Y(i)} ${mx.toFixed(1)} ${my.toFixed(1)}`;
  }
  return `${d} L${X(n - 1)} ${Y(n - 1)}`;
}

// 지우개: 점 (x, y) 근처를 지나는 획인가? (가로세로 비율이 달라 쪽 크기로 보정해서 거리 계산)
export function hits(st: Stroke, x: number, y: number, aspect: number): boolean {
  const r = ERASE_RADIUS + st.width / 2;
  const { pts } = st;
  for (let i = 0; i < pts.length; i += 2) {
    const dx = pts[i] - x, dy = (pts[i + 1] - y) * aspect;
    if (dx * dx + dy * dy <= r * r) return true;
    if (i >= 2) {
      // 점 사이가 멀 때 중간도 검사
      const mx = (pts[i] + pts[i - 2]) / 2 - x, my = ((pts[i + 1] + pts[i - 1]) / 2 - y) * aspect;
      if (mx * mx + my * my <= r * r) return true;
    }
  }
  return false;
}
