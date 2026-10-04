// 스티커 목록 만들기: node tools/build_stickers_index.js
// app/assets/stickers/ 안의 PNG를 찾아서 앱이 쓰는 목록(app/src/stickerCatalog.ts)을 만듭니다.
// 내 스티커 추가: 투명 배경 PNG를 `my_이름.png` 로 저장해서 그 폴더에 넣고 이 명령을 실행하세요.
// 분류는 파일 이름 앞부분: basic 기본 / flower 꽃 / weather 날씨 / food 음식 / tape 테이프 / memo 메모 / my 내 스티커
const fs = require('fs');
const dir = 'app/assets/stickers';
const files = fs.readdirSync(dir).filter((f) => /\.png$/i.test(f)).sort();
const rows = files.map((f) => {
  const key = f.replace(/\.png$/i, '');
  const category = key.includes('_') ? key.split('_')[0] : 'my';
  return `  { key: '${key}', category: '${category}', src: require('../assets/stickers/${f}') },`;
});
fs.writeFileSync('app/src/stickerCatalog.ts',
`// 자동 생성 파일 — tools/build_stickers_index.js 로 만들어집니다. 직접 고치지 마세요.
export const STICKERS: { key: string; category: string; src: number }[] = [
${rows.join('\n')}
];
`);
console.log(files.length, 'stickers indexed');
