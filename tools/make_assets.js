// 종이 질감 + 효과음 생성기: node tools/make_assets.js
// 결과: app/assets/paper.png, app/assets/sounds/*.wav
const fs = require('fs');
const zlib = require('zlib');

// ---------- 시드 고정 난수 (매번 같은 결과) ----------
let seed = 20261004;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

// ---------- 종이 질감 PNG (타일로 반복해도 이음새 없음) ----------
function crc32(buf) {
  let c, crc = ~0;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return ~crc >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function writePng(path, w, h, rgba) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0;
    rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  fs.writeFileSync(path, Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0)),
  ]));
}

const S = 256;
// 밝기(-1 어두움 ~ +1 밝음) 맵
const lum = new Float32Array(S * S);
// 1) 고운 입자
for (let i = 0; i < S * S; i++) lum[i] = (rnd() - 0.5) * 0.9;
// 2) 종이 섬유 (짧은 선, 가장자리에서 반대편으로 이어짐)
for (let f = 0; f < 420; f++) {
  let x = rnd() * S, y = rnd() * S;
  const a = rnd() * Math.PI * 2, len = 5 + rnd() * 16, v = (rnd() - 0.5) * 1.4;
  for (let t = 0; t < len; t++) {
    const px = ((Math.round(x + Math.cos(a) * t) % S) + S) % S;
    const py = ((Math.round(y + Math.sin(a) * t) % S) + S) % S;
    lum[py * S + px] += v;
  }
}
// 3) 부드러운 얼룩 (저주파)
const G = 8, grid = Array.from({ length: G * G }, () => rnd() - 0.5);
const g = (x, y) => grid[(((y % G) + G) % G) * G + (((x % G) + G) % G)];
for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
  const gx = (x / S) * G, gy = (y / S) * G, x0 = Math.floor(gx), y0 = Math.floor(gy);
  const fx = gx - x0, fy = gy - y0;
  const top = g(x0, y0) * (1 - fx) + g(x0 + 1, y0) * fx;
  const bot = g(x0, y0 + 1) * (1 - fx) + g(x0 + 1, y0 + 1) * fx;
  lum[y * S + x] += (top * (1 - fy) + bot * fy) * 0.3;
}
const px = Buffer.alloc(S * S * 4);
for (let i = 0; i < S * S; i++) {
  const v = Math.max(-1, Math.min(1, lum[i]));
  const light = v > 0;
  px[i * 4] = light ? 255 : 120; px[i * 4 + 1] = light ? 255 : 95; px[i * 4 + 2] = light ? 250 : 60;
  px[i * 4 + 3] = Math.round(Math.abs(v) * (light ? 48 : 34)); // 알파 (은은하게)
}
fs.mkdirSync('app/assets/sounds', { recursive: true });
writePng('app/assets/paper.png', S, S, px);

// ---------- 효과음 (16bit mono WAV) ----------
const SR = 22050;
function writeWav(path, samples) {
  const data = Buffer.alloc(samples.length * 2);
  samples.forEach((s, i) => data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, s)) * 32767), i * 2));
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + data.length, 4); h.write('WAVE', 8); h.write('fmt ', 12);
  h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22);
  h.writeUInt32LE(SR, 24); h.writeUInt32LE(SR * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34);
  h.write('data', 36); h.writeUInt32LE(data.length, 40);
  fs.writeFileSync(path, Buffer.concat([h, data]));
}
// 노이즈를 대역 통과(사각사각한 고음역)로 거르는 간단한 필터
function filteredNoise(n, lowA, highA) {
  const out = new Float32Array(n); let lp = 0, lp2 = 0;
  for (let i = 0; i < n; i++) {
    const x = rnd() * 2 - 1;
    lp += lowA * (x - lp);           // 고음 다듬기
    lp2 += highA * (lp - lp2);       // 저음 제거용 기준선
    out[i] = lp - lp2;
  }
  return out;
}
// 책장 넘기는 소리: 스윽(바람) + 바삭(결 부스러짐)
(() => {
  const n = Math.floor(SR * 0.6), noise = filteredNoise(n, 0.55, 0.05), out = [];
  let crackle = 0;
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const whoosh = Math.sin(Math.PI * Math.pow(t, 0.7)) * 0.55;       // 부드러운 스윽
    if (rnd() < 0.012 * (1 - t)) crackle = 1;                         // 바삭
    crackle *= 0.9;
    out.push(noise[i] * (whoosh + crackle * 0.9) * 0.85);
  }
  writeWav('app/assets/sounds/page_flip.wav', out);
})();
// 연필 사각사각: 짧은 긁는 소리 3종류
for (let v = 1; v <= 3; v++) {
  const n = Math.floor(SR * (0.10 + v * 0.02)), noise = filteredNoise(n, 0.7, 0.08), out = [];
  const rate = 70 + v * 25; // 긁는 속도
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const env = Math.sin(Math.PI * t) * (0.55 + 0.45 * Math.abs(Math.sin(2 * Math.PI * rate * i / SR)));
    out.push(noise[i] * env * 0.55);
  }
  writeWav(`app/assets/sounds/scratch${v}.wav`, out);
}
console.log('ok');
