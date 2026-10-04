// 병아리 캐릭터 SVG 생성기: node tools/make_chick.js
// 색을 바꾸려면 아래 C 값만 고치면 됩니다.
const fs = require('fs');
const C = { body:'#FFE680', edge:'#F0C93A', wing:'#FFDC5C', beak:'#FFA552', feet:'#FFA552',
            cheek:'#FFB6B6', ink:'#5A4630' };

// 하찮은 점 눈: 작고, 멀리 떨어지고, 낮게 달림
const dot = (r = 11, dy = 0) =>
  `<circle cx="198" cy="${320 + dy}" r="${r}" fill="${C.ink}"/><circle cx="314" cy="${320 + dy}" r="${r}" fill="${C.ink}"/>`;
const arc = (d) => `<path d="${d}" stroke="${C.ink}" stroke-width="8" fill="none" stroke-linecap="round"/>`;

const eyes = {
  normal: dot(),
  happy:  arc('M184 326 Q198 308 212 326') + arc('M300 326 Q314 308 328 326'),
  sleepy: arc('M184 322 Q198 330 212 322') + arc('M300 322 Q314 330 328 322') +
          `<text x="364" y="250" font-size="38" font-weight="700" fill="${C.edge}" font-family="sans-serif">z</text>
           <text x="394" y="212" font-size="50" font-weight="700" fill="${C.edge}" font-family="sans-serif">Z</text>`,
  excited: dot(14) +
          `<path d="M120 230 l5 12 12 5 -12 5 -5 12 -5 -12 -12 -5 12 -5z" fill="${C.edge}"/>
           <path d="M404 250 l4 10 10 4 -10 4 -4 10 -4 -10 -10 -4 10 -4z" fill="${C.edge}"/>`,
  sad:    dot(11, 6) +
          arc('M178 306 L214 296') + arc('M334 306 L298 296') +
          `<path d="M182 342 Q174 364 188 368 Q202 364 194 342z" fill="#8FD3FF"/>`,
};
const beak = {
  normal: `<path d="M244 336 Q256 329 268 336 Q256 352 244 336z" fill="${C.beak}"/>`,
  open:   `<path d="M242 334 Q256 326 270 334 Q256 366 242 334z" fill="${C.beak}"/><path d="M249 350 Q256 360 263 350 Q256 346 249 350z" fill="#E8604C"/>`,
  sad:    `<path d="M246 340 Q256 333 266 340 Q256 350 246 340z" fill="${C.beak}"/>`,
};
const mood = {
  normal:  [eyes.normal, beak.normal],
  happy:   [eyes.happy, beak.normal],
  sleepy:  [eyes.sleepy, beak.normal],
  excited: [eyes.excited, beak.open],
  sad:     [eyes.sad, beak.sad],
};
const svg = (e, b) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <ellipse cx="256" cy="466" rx="150" ry="13" fill="#000" opacity="0.07"/>
  <ellipse cx="222" cy="454" rx="17" ry="8" fill="${C.feet}"/>
  <ellipse cx="290" cy="454" rx="17" ry="8" fill="${C.feet}"/>
  <path d="M256 152 Q250 120 232 112 M256 152 Q268 118 290 120" stroke="${C.edge}" stroke-width="9" fill="none" stroke-linecap="round"/>
  <path d="M66 312 C66 196 150 152 256 152 C362 152 446 196 446 312 C446 412 360 456 256 456 C152 456 66 412 66 312Z" fill="${C.body}" stroke="${C.edge}" stroke-width="6" stroke-linejoin="round"/>
  <ellipse cx="72" cy="338" rx="20" ry="30" fill="${C.wing}" stroke="${C.edge}" stroke-width="5" transform="rotate(20 72 338)"/>
  <ellipse cx="440" cy="338" rx="20" ry="30" fill="${C.wing}" stroke="${C.edge}" stroke-width="5" transform="rotate(-20 440 338)"/>
  <ellipse cx="146" cy="354" rx="22" ry="12" fill="${C.cheek}" opacity="0.7"/>
  <ellipse cx="366" cy="354" rx="22" ry="12" fill="${C.cheek}" opacity="0.7"/>
  ${e}
  ${b}
</svg>`;
for (const [name,[e,b]] of Object.entries(mood))
  fs.writeFileSync(`Content/characters/chick_${name}.svg`, svg(e,b));
fs.writeFileSync('Content/characters/preview.html',
 `<body style="margin:0;background:#FFF8DC;display:flex;flex-wrap:wrap;gap:8px;padding:16px;font-family:sans-serif;color:#5A4630">`+
 Object.keys(mood).map(n=>`<div style="text-align:center"><img src="chick_${n}.svg" width="220"><div>${n}</div></div>`).join('')+`</body>`);

// 앱에서 바로 쓰도록 TS 파일도 함께 생성
fs.mkdirSync('app/src', { recursive: true });
const out = Object.keys(mood).map(n => `  ${n}: ${JSON.stringify(fs.readFileSync(`Content/characters/chick_${n}.svg`, 'utf8'))},`).join('\n');
fs.writeFileSync('app/src/chickSvgs.ts', `// 자동 생성 파일 — tools/make_chick.js 로 만들어집니다. 직접 고치지 마세요.\nexport const chickSvgs = {\n${out}\n} as const;\nexport type ChickMood = keyof typeof chickSvgs;\n`);
console.log('ok');
