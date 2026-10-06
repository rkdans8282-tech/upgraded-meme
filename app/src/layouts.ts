// 공책 쪽 나누기: 구분선만 그리고, 글·사진·GIF·스티커는 어느 칸에든 놓을 수 있음 (올가미로 칸 사이를 옮김)
export type Layout = 'none' | 'cols2' | 'rows2' | 'grid4' | 'top1' | 'left1';

export const LAYOUTS: { key: Layout; label: string }[] = [
  { key: 'none', label: '나누지 않음' },
  { key: 'cols2', label: '좌우 2칸' },
  { key: 'rows2', label: '상하 2칸' },
  { key: 'grid4', label: '4칸' },
  { key: 'top1', label: '위 1 · 아래 2' },
  { key: 'left1', label: '왼쪽 1 · 오른쪽 2' },
];

// 구분선: [x0, y0, x1, y1] (0~1, 나눌 영역 기준)
export function segments(l: Layout | undefined): [number, number, number, number][] {
  switch (l) {
    case 'cols2': return [[0.5, 0, 0.5, 1]];
    case 'rows2': return [[0, 0.5, 1, 0.5]];
    case 'grid4': return [[0.5, 0, 0.5, 1], [0, 0.5, 1, 0.5]];
    case 'top1': return [[0, 0.5, 1, 0.5], [0.5, 0.5, 0.5, 1]];
    case 'left1': return [[0.5, 0, 0.5, 1], [0.5, 0.5, 1, 0.5]];
    default: return [];
  }
}
