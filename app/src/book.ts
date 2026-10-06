// 책의 순서: 앞쪽에 1~12월 달력 → 그 뒤로 날짜와 상관없는 자유 메모 쪽(공부용 공책)
// 쪽 이름: 달력은 'cal:2026-10', 메모는 'memo:1', 'memo:2' ...
// 날짜 칸 하나(일기)는 책장이 아니라 달력에서 확대해서 여는 화면이고, 내용은 날짜('2026-10-06')로 저장됨
const p = (n: number) => String(n).padStart(2, '0');
export const isCal = (k: string) => k.startsWith('cal:');
export const isMemo = (k: string) => k.startsWith('memo:');
export const calKeyOf = (day: string) => `cal:${day.slice(0, 7)}`;
export const memoNo = (k: string) => Number(k.slice(5));

// memoMax: 내용이 있는 가장 뒤쪽 메모 번호. 그 바로 뒤에 빈 쪽 하나가 더 이어짐
export function neighbor(key: string, dir: 1 | -1, year: string, memoMax: number): string | null {
  if (isCal(key)) {
    const m = Number(key.slice(9, 11));
    if (dir === 1) return m < 12 ? `cal:${year}-${p(m + 1)}` : 'memo:1';
    return m > 1 ? `cal:${year}-${p(m - 1)}` : null;
  }
  const n = memoNo(key);
  if (dir === 1) return n < memoMax + 1 ? `memo:${n + 1}` : null;
  return n > 1 ? `memo:${n - 1}` : `cal:${year}-12`;
}
