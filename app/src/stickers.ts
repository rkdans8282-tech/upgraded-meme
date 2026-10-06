import { STICKERS } from './stickerCatalog';

// 오린 윤곽: pts는 사진 기준 0~1 좌표 [x0,y0,x1,y1,...], box는 윤곽을 감싸는 경계 상자 [왼,위,오른,아래]
export type Cut = { pts: number[]; box: [number, number, number, number] };

// 일기장에 붙은 스티커 하나. 위치/크기는 쪽(page) 크기에 대한 비율이라 기기가 달라도 같은 자리에 붙음
export type Sticker = {
  id: string;
  key: string; // 스티커 파일 이름 (예: 'basic_heart_pink')
  x: number; // 가운데 가로 위치 (0~1)
  y: number; // 가운데 세로 위치 (0~1)
  scale: number; // 크기 배율 (기본 1)
  rot: number; // 기울기(도)
  photo?: string; // 사진 스티커: 'file:<이름>.jpg'(앱 문서 폴더/photos) 또는 웹의 data URI. 이때 key는 ''
  aspect?: number; // 화면에 보이는 가로/세로 비율
  imgAspect?: number; // 원본 사진 가로/세로 비율
  cut?: Cut; // 오린 모양 (없으면 네모 그대로)
  text?: string; // 글상자: 글이 들어 있는 스티커 (key는 '')
};

export const BASE_SIZE = 0.26; // 배율 1일 때 스티커 너비 = 쪽 너비의 26%
export const TEXT_WIDTH = 0.5; // 글상자 배율 1일 때 너비 = 쪽 너비의 50%
export const SCALE_MIN = 0.35;
export const SCALE_MAX = 4;

// 스티커가 차지하는 절반 크기(쪽 크기 대비 비율). 올가미로 묶을 때 상자 범위를 구하는 용도
export function stickerHalf(s: Sticker, pageW: number, pageH: number): [number, number] {
  const w = pageW * (s.text !== undefined ? TEXT_WIDTH : BASE_SIZE) * s.scale;
  const lines = s.text === undefined ? 1 : s.text.split(String.fromCharCode(10)).length;
  const h = s.text !== undefined ? pageW * 0.052 * 1.3 * s.scale * lines + 12 : s.photo ? w / (s.aspect ?? 1) : w;
  return [w / 2 / pageW, h / 2 / pageH];
}

export const CATEGORY_LABELS: Record<string, string> = {
  basic: '기본', flower: '꽃', weather: '날씨', food: '음식', tape: '테이프', memo: '메모', my: '내 스티커',
};

const byKey = new Map(STICKERS.map((s) => [s.key, s.src]));
export const stickerSource = (key: string) => byKey.get(key);
export { STICKERS };

// 분류 순서: CATEGORY_LABELS 순서대로, 모르는 분류는 뒤에
export const categories = () => {
  const order = Object.keys(CATEGORY_LABELS);
  const present = [...new Set(STICKERS.map((s) => s.category))];
  return present.sort((a, b) => (order.indexOf(a) + 99) % 99 - (order.indexOf(b) + 99) % 99 || a.localeCompare(b));
};
export const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
