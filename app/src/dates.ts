const p = (n: number) => String(n).padStart(2, '0');
export const DAYS = ['일', '월', '화', '수', '목', '금', '토'];

export const keyOf = (d: Date) => `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
export const todayKey = () => keyOf(new Date());
export const fromKey = (k: string) => {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d);
};
export const shiftKey = (k: string, n: number) => {
  const d = fromKey(k);
  d.setDate(d.getDate() + n);
  return keyOf(d);
};
export const labelOf = (k: string) => {
  const d = fromKey(k);
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${DAYS[d.getDay()]}요일`;
};
