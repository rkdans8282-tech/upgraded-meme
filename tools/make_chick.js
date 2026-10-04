// 병아리 캐릭터 SVG 생성기: node tools/make_chick.js
// 색을 바꾸려면 아래 C 값만 고치면 됩니다.
const fs = require('fs');
const C = { body:'#FFD93B', edge:'#F5B700', wing:'#FFC21A', beak:'#FF9F45', feet:'#FF9F45',
            cheek:'#FFB6B6', ink:'#5A4630', white:'#FFFFFF' };

const eyes = {
  normal: `<circle cx="196" cy="268" r="17" fill="${C.ink}"/><circle cx="316" cy="268" r="17" fill="${C.ink}"/>
           <circle cx="202" cy="261" r="6" fill="#fff"/><circle cx="322" cy="261" r="6" fill="#fff"/>`,
  happy: `<path d="M176 276 Q196 248 216 276" stroke="${C.ink}" stroke-width="10" fill="none" stroke-linecap="round"/>
          <path d="M296 276 Q316 248 336 276" stroke="${C.ink}" stroke-width="10" fill="none" stroke-linecap="round"/>`,
  sleepy:`<path d="M176 268 Q196 286 216 268" stroke="${C.ink}" stroke-width="10" fill="none" stroke-linecap="round"/>
          <path d="M296 268 Q316 286 336 268" stroke="${C.ink}" stroke-width="10" fill="none" stroke-linecap="round"/>
          <text x="372" y="190" font-size="44" font-weight="700" fill="${C.edge}" font-family="sans-serif">z</text>
          <text x="404" y="150" font-size="56" font-weight="700" fill="${C.edge}" font-family="sans-serif">Z</text>`,
  excited:`<path d="M196 246 l7 15 16 2 -12 11 4 16 -15 -8 -15 8 4 -16 -12 -11 16 -2z" fill="${C.ink}"/>
           <path d="M316 246 l7 15 16 2 -12 11 4 16 -15 -8 -15 8 4 -16 -12 -11 16 -2z" fill="${C.ink}"/>
           <path d="M96 150 l6 14 14 6 -14 6 -6 14 -6 -14 -14 -6 14 -6z" fill="${C.edge}"/>
           <path d="M420 190 l5 11 11 5 -11 5 -5 11 -5 -11 -11 -5 11 -5z" fill="${C.edge}"/>`,
  sad:   `<circle cx="196" cy="272" r="17" fill="${C.ink}"/><circle cx="316" cy="272" r="17" fill="${C.ink}"/>
          <circle cx="202" cy="265" r="6" fill="#fff"/><circle cx="322" cy="265" r="6" fill="#fff"/>
          <path d="M172 240 L216 228" stroke="${C.ink}" stroke-width="8" stroke-linecap="round"/>
          <path d="M340 240 L296 228" stroke="${C.ink}" stroke-width="8" stroke-linecap="round"/>
          <path d="M176 296 Q166 330 186 336 Q206 330 196 296z" fill="#8FD3FF"/>`,
};
const beak = {
  normal: `<path d="M236 292 Q256 280 276 292 Q256 320 236 292z" fill="${C.beak}"/>`,
  open:   `<path d="M232 290 Q256 276 280 290 Q256 340 232 290z" fill="${C.beak}"/><path d="M244 308 Q256 322 268 308 Q256 302 244 308z" fill="#E8604C"/>`,
  sad:    `<path d="M238 296 Q256 284 274 296 Q256 312 238 296z" fill="${C.beak}"/>`,
};
const mood = {
  normal:  [eyes.normal, beak.normal],
  happy:   [eyes.happy, beak.normal],
  sleepy:  [eyes.sleepy, beak.normal],
  excited: [eyes.excited, beak.open],
  sad:     [eyes.sad, beak.sad],
};
const svg = (e, b) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <ellipse cx="256" cy="466" rx="130" ry="14" fill="#000" opacity="0.08"/>
  <path d="M222 438 L212 466 M222 438 L232 466 M290 438 L280 466 M290 438 L300 466" stroke="${C.feet}" stroke-width="12" stroke-linecap="round"/>
  <path d="M256 92 Q236 56 214 70 Q232 78 244 96z M256 92 Q262 50 286 54 Q272 70 266 96z M256 96 Q282 70 304 88 Q280 92 268 100z" fill="${C.edge}"/>
  <ellipse cx="256" cy="290" rx="178" ry="160" fill="${C.body}" stroke="${C.edge}" stroke-width="8"/>
  <ellipse cx="92" cy="318" rx="34" ry="52" fill="${C.wing}" stroke="${C.edge}" stroke-width="6" transform="rotate(18 92 318)"/>
  <ellipse cx="420" cy="318" rx="34" ry="52" fill="${C.wing}" stroke="${C.edge}" stroke-width="6" transform="rotate(-18 420 318)"/>
  <ellipse cx="150" cy="316" rx="26" ry="16" fill="${C.cheek}" opacity="0.85"/>
  <ellipse cx="362" cy="316" rx="26" ry="16" fill="${C.cheek}" opacity="0.85"/>
  ${e}
  ${b}
</svg>`;
for (const [name,[e,b]] of Object.entries(mood))
  fs.writeFileSync(`Content/characters/chick_${name}.svg`, svg(e,b));
fs.writeFileSync('Content/characters/preview.html',
 `<body style="margin:0;background:#FFF8DC;display:flex;flex-wrap:wrap;gap:8px;padding:16px;font-family:sans-serif;color:#5A4630">`+
 Object.keys(mood).map(n=>`<div style="text-align:center"><img src="chick_${n}.svg" width="220"><div>${n}</div></div>`).join('')+`</body>`);
console.log('ok');

// 앱에서 바로 쓰도록 TS 파일도 함께 생성
fs.mkdirSync('app/src', { recursive: true });
const out = Object.keys(mood).map(n => `  ${n}: ${JSON.stringify(fs.readFileSync(`Content/characters/chick_${n}.svg`, 'utf8'))},`).join('\n');
fs.writeFileSync('app/src/chickSvgs.ts', `// 자동 생성 파일 — tools/make_chick.js 로 만들어집니다. 직접 고치지 마세요.\nexport const chickSvgs = {\n${out}\n} as const;\nexport type ChickMood = keyof typeof chickSvgs;\n`);
