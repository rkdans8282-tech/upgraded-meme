// 앱 아이콘(assets/icon.png)을 그려서 저장합니다.  사용: node tools/make_icon.js
// 필요: npm install @napi-rs/canvas --no-save  (빌드에는 필요 없고, 아이콘을 다시 만들 때만 씀)
// 디자인: 표지와 같은 검정 가죽 + 점선 테두리 + 핑크 이탤릭 'D' (스프링 없는 노트). 아이콘은 투명 영역이 없어야 하므로 꽉 찬 사각형으로 그림.
const fs = require('fs');
const path = require('path');
const { createCanvas, GlobalFonts } = require('@napi-rs/canvas');

const font = path.join(__dirname, '..', 'node_modules', '@expo-google-fonts', 'playfair-display', '400Regular_Italic', 'PlayfairDisplay_400Regular_Italic.ttf');
GlobalFonts.registerFromPath(font, 'PlayfairItalic');

const S = 1024;
const c = createCanvas(S, S);
const x = c.getContext('2d');

x.fillStyle = '#141414';
x.fillRect(0, 0, S, S);

// 점선 스티치 테두리
x.strokeStyle = 'rgba(244,169,196,0.35)';
x.lineWidth = 5;
x.setLineDash([22, 16]);
x.strokeRect(80, 80, 864, 864);
x.setLineDash([]);

// 핑크 이탤릭 D + 가는 선
x.fillStyle = '#F4A9C4';
x.font = '640px PlayfairItalic';
x.textAlign = 'center';
x.textBaseline = 'alphabetic';
x.fillText('D', 512, 690);
x.fillRect(422, 770, 180, 6);

// 앱스토어는 투명도(알파) 채널이 있는 아이콘을 거절하므로, 알파를 뺀 RGB PNG로 직접 저장
const zlib = require('zlib');
const crcTable = Array.from({ length: 256 }, (_, n) => {
  let v = n;
  for (let k = 0; k < 8; k++) v = v & 1 ? 0xedb88320 ^ (v >>> 1) : v >>> 1;
  return v >>> 0;
});
const crc32 = (buf) => {
  let v = 0xffffffff;
  for (const b of buf) v = crcTable[(v ^ b) & 0xff] ^ (v >>> 8);
  return (v ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
};
const rgba = x.getImageData(0, 0, S, S).data;
const raw = Buffer.alloc(S * (S * 3 + 1));
for (let row = 0; row < S; row++) {
  const o = row * (S * 3 + 1);
  raw[o] = 0; // 필터 없음
  for (let col = 0; col < S; col++) {
    const i = (row * S + col) * 4;
    raw[o + 1 + col * 3] = rgba[i];
    raw[o + 2 + col * 3] = rgba[i + 1];
    raw[o + 3 + col * 3] = rgba[i + 2];
  }
}
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(S, 0);
ihdr.writeUInt32BE(S, 4);
ihdr[8] = 8; // 8비트
ihdr[9] = 2; // RGB (알파 없음)
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
]);
const out = path.join(__dirname, '..', 'assets', 'icon.png');
fs.writeFileSync(out, png);
console.log('saved', out);
