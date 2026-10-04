// 기본 스티커 그리기: node tools/make_stickers.js   (Chromium/Playwright 필요: 만든 PNG는 저장소에 들어 있음)
// 파일 이름 규칙: <분류>_<이름>.png  → 분류: basic 기본 / flower 꽃 / weather 날씨 / food 음식 / tape 테이프 / memo 메모
const fs = require('fs');
const OUT = 'app/assets/stickers';
const L = '#8B7360'; // 선 색
const P = { pink: '#F4B6C2', rose: '#E98FA3', peach: '#F8D3B0', cream: '#F8E6CF', yellow: '#F7DE92', mint: '#BFE3CF',
            sage: '#A8CBB2', sky: '#BDD9F0', lav: '#D4C6EC', white: '#FFFDF8', red: '#F08A8A', brown: '#C9A27E' };
const st = (w = 6) => `stroke="${L}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const star = (cx, cy, R, r, n) =>
  Array.from({ length: n * 2 }, (_, i) => {
    const a = (Math.PI / n) * i - Math.PI / 2, rr = i % 2 ? r : R;
    return `${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`;
  }).join(' ');
const petals = (n, dist, rad, fill, cx = 128, cy = 128) =>
  Array.from({ length: n }, (_, i) => {
    const a = (Math.PI * 2 * i) / n;
    return `<circle cx="${(cx + dist * Math.cos(a)).toFixed(1)}" cy="${(cy + dist * Math.sin(a)).toFixed(1)}" r="${rad}" fill="${fill}" ${st(5)}/>`;
  }).join('');
const heart = (f) => `<path d="M128 214 C40 150 28 100 62 70 C90 46 118 62 128 86 C138 62 166 46 194 70 C228 100 216 150 128 214Z" fill="${f}" ${st()}/>
  <path d="M70 88 C78 76 92 74 100 80" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="7" stroke-linecap="round"/>`;
const cloudShape = (f, dy = 0) => `<path d="M70 ${176 + dy} C34 ${176 + dy} 34 ${120 + dy} 74 ${122 + dy} C80 ${84 + dy} 140 ${74 + dy} 156 ${112 + dy} C198 ${100 + dy} 226 ${176 + dy} 180 ${176 + dy}Z" fill="${f}" ${st()}/>`;
const wash = (defs, fill) => `<defs>${defs}</defs><g transform="rotate(-8 128 128)"><path d="M26 82 l10 8 -10 8 10 8 -10 8 10 8 -10 8 10 8 -10 8 H220 l-10 -8 10 -8 -10 -8 10 -8 -10 -8 10 -8 -10 -8 10 -8 -10 -8Z" fill="${fill}" stroke="${L}" stroke-opacity=".55" stroke-width="3" stroke-linejoin="round"/></g>`;

const S = []; // {cat, name, svg, die?}
const add = (cat, name, svg, die = true) => S.push({ cat, name, svg, die });

// ---- 기본 ----
add('basic', 'heart_pink', heart(P.pink));
add('basic', 'heart_cream', heart(P.cream));
add('basic', 'heart_lavender', heart(P.lav));
add('basic', 'star_yellow', `<polygon points="${star(128, 132, 98, 46, 5)}" fill="${P.yellow}" ${st()}/>`);
add('basic', 'star_pink', `<polygon points="${star(128, 132, 98, 46, 5)}" fill="${P.pink}" ${st()}/>`);
add('basic', 'sparkle', `<path d="M128 26 Q140 116 230 128 Q140 140 128 230 Q116 140 26 128 Q116 116 128 26Z" fill="${P.yellow}" ${st()}/>`);
add('basic', 'bow', `<path d="M128 128 C84 64 24 84 34 132 C44 176 92 172 128 128Z" fill="${P.pink}" ${st()}/>
  <path d="M128 128 C172 64 232 84 222 132 C212 176 164 172 128 128Z" fill="${P.pink}" ${st()}/>
  <path d="M120 140 L94 214 L120 200 L132 222Z M136 140 L162 214 L136 200 L124 222Z" fill="${P.rose}" ${st(5)}/>
  <rect x="106" y="108" width="44" height="42" rx="14" fill="${P.rose}" ${st()}/>`);
add('basic', 'cloverleaf', `${petals(4, 44, 40, P.sage)}<path d="M128 140 Q132 190 156 216" fill="none" ${st(7)}/>`);

// ---- 꽃 ----
add('flower', 'pink', `${petals(5, 52, 40, P.pink)}<circle cx="128" cy="128" r="28" fill="${P.yellow}" ${st()}/>`);
add('flower', 'lavender', `${petals(6, 54, 34, P.lav)}<circle cx="128" cy="128" r="26" fill="${P.cream}" ${st()}/>`);
add('flower', 'daisy', `${Array.from({ length: 12 }, (_, i) => `<ellipse cx="128" cy="62" rx="15" ry="38" fill="${P.white}" ${st(4.5)} transform="rotate(${i * 30} 128 128)"/>`).join('')}<circle cx="128" cy="128" r="30" fill="${P.yellow}" ${st()}/>`);
add('flower', 'tulip', `<path d="M128 150 Q126 200 134 236" fill="none" ${st(8)}/>
  <path d="M134 206 Q176 196 190 164 Q150 168 134 206Z" fill="${P.sage}" ${st(5)}/>
  <path d="M74 70 L74 126 C74 164 104 178 128 178 C152 178 182 164 182 126 L182 70 L154 98 L128 62 L102 98Z" fill="${P.pink}" ${st()}/>`);
add('flower', 'leaf', `<path d="M60 206 C40 110 100 44 206 44 C214 140 150 210 60 206Z" fill="${P.sage}" ${st()}/>
  <path d="M60 206 C100 150 150 100 190 62" fill="none" ${st(5)}/>`);
add('flower', 'sprout', `<path d="M128 224 L128 130" fill="none" ${st(8)}/>
  <path d="M128 140 C70 150 40 110 44 70 C96 70 126 100 128 140Z" fill="${P.sage}" ${st()}/>
  <path d="M128 120 C130 80 160 48 208 46 C214 96 176 130 128 120Z" fill="${P.mint}" ${st()}/>`);

// ---- 날씨 ----
add('weather', 'sun', `${Array.from({ length: 10 }, (_, i) => `<line x1="128" y1="30" x2="128" y2="54" ${st(10)} transform="rotate(${i * 36} 128 128)"/>`).join('')}<circle cx="128" cy="128" r="56" fill="${P.yellow}" ${st()}/>
  <circle cx="108" cy="124" r="5" fill="${L}"/><circle cx="148" cy="124" r="5" fill="${L}"/><path d="M114 144 Q128 156 142 144" fill="none" ${st(5)}/>`);
add('weather', 'cloud', cloudShape('#EAF3FB', 0));
add('weather', 'rain', `${cloudShape(P.sky, -24)}${[84, 128, 172].map((x) => `<path d="M${x} 174 Q${x - 14} 198 ${x} 206 Q${x + 14} 198 ${x} 174Z" fill="${P.sky}" ${st(5)}/>`).join('')}`);
add('weather', 'moon', `<path d="M164 34 A98 98 0 1 0 222 166 A78 78 0 0 1 164 34Z" fill="${P.yellow}" ${st()}/><circle cx="98" cy="150" r="9" fill="${L}" opacity=".25"/><circle cx="122" cy="188" r="6" fill="${L}" opacity=".25"/>`);
add('weather', 'rainbow', `${[[P.rose, 96], [P.yellow, 76], [P.mint, 56], [P.sky, 36]].map(([c, r]) => `<path d="M${128 - r} 190 A${r} ${r} 0 0 1 ${128 + r} 190" fill="none" stroke="${c}" stroke-width="20"/>`).join('')}
  <path d="M32 190 A96 96 0 0 1 224 190" fill="none" stroke="${L}" stroke-width="0"/>
  ${cloudShape(P.white, 28).replace('<path', '<path transform="translate(-6 0) scale(.5) translate(-10 52)"')}`);
add('weather', 'snow', `${Array.from({ length: 3 }, (_, i) => `<g transform="rotate(${i * 60} 128 128)"><line x1="128" y1="34" x2="128" y2="222" ${st(9)}/><path d="M110 58 L128 78 L146 58 M110 198 L128 178 L146 198" fill="none" ${st(7)}/></g>`).join('')}`, false);

// ---- 음식 ----
add('food', 'coffee', `<path d="M90 70 Q80 52 92 38 M128 70 Q118 52 130 38 M166 70 Q156 52 168 38" fill="none" stroke="${L}" stroke-opacity=".5" stroke-width="6" stroke-linecap="round"/>
  <path d="M184 110 H204 Q226 112 224 140 Q220 168 186 168" fill="none" ${st(9)}/>
  <path d="M52 94 H190 V150 Q190 196 120 196 Q52 196 52 150Z" fill="${P.white}" ${st()}/>
  <path d="M58 112 H184" stroke="${P.brown}" stroke-width="14" stroke-linecap="round"/>
  <ellipse cx="122" cy="214" rx="86" ry="12" fill="${P.cream}" ${st(5)}/>`);
add('food', 'cake', `<path d="M36 128 L220 128 L220 196 Q128 214 36 196Z" fill="${P.cream}" ${st()}/>
  <path d="M36 128 Q50 96 82 112 Q104 84 128 112 Q152 84 174 112 Q206 96 220 128Z" fill="${P.white}" ${st()}/>
  <circle cx="128" cy="88" r="18" fill="${P.red}" ${st(5)}/><path d="M128 72 Q134 60 146 62" fill="none" ${st(5)}/>
  <path d="M36 160 Q128 178 220 160" fill="none" stroke="${P.pink}" stroke-width="10" stroke-linecap="round"/>`);
add('food', 'cookie', `<circle cx="128" cy="128" r="94" fill="${P.brown}" ${st()}/>${[[96, 96], [156, 90], [168, 148], [112, 160], [84, 138], [140, 122]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="11" fill="#8A6A52"/>`).join('')}`);
add('food', 'strawberry', `<path d="M128 220 C60 180 44 120 62 86 C84 62 112 80 128 82 C144 80 172 62 194 86 C212 120 196 180 128 220Z" fill="${P.red}" ${st()}/>
  ${[[100, 120], [150, 118], [128, 146], [96, 160], [158, 158], [128, 188]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="5" ry="8" fill="${P.cream}"/>`).join('')}
  <path d="M128 84 L104 62 L116 80 L96 82 L120 90 L128 108 L136 90 L160 82 L140 80 L152 62Z" fill="${P.sage}" ${st(5)}/>`);
add('food', 'toast', `<path d="M58 210 V112 Q30 100 36 70 Q44 40 84 44 Q106 28 128 44 Q150 28 172 44 Q212 40 220 70 Q226 100 198 112 V210Z" fill="${P.peach}" ${st()}/>
  <path d="M82 190 V112 Q70 100 76 84 Q100 80 128 80 Q156 80 180 84 Q186 100 174 112 V190Z" fill="${P.cream}" ${st(5)}/>`);
add('food', 'icecream', `<path d="M86 124 L128 232 L170 124Z" fill="${P.peach}" ${st()}/><path d="M104 128 L140 216 M128 128 L156 188" stroke="${L}" stroke-opacity=".35" stroke-width="5" fill="none"/>
  <circle cx="128" cy="92" r="50" fill="${P.pink}" ${st()}/><path d="M80 112 Q72 140 98 134 Q110 148 128 134 Q146 148 158 134 Q184 140 176 112" fill="${P.white}" ${st(5)}/>
  <circle cx="128" cy="38" r="12" fill="${P.red}" ${st(5)}/>`);

// ---- 마스킹테이프 ----
add('tape', 'stripe_pink', wash(`<pattern id="a" width="24" height="24" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="24" height="24" fill="${P.white}"/><rect width="12" height="24" fill="${P.pink}"/></pattern>`, 'url(#a)'), false);
add('tape', 'dot_mint', wash(`<pattern id="a" width="28" height="28" patternUnits="userSpaceOnUse"><rect width="28" height="28" fill="${P.mint}"/><circle cx="14" cy="14" r="5" fill="${P.white}"/></pattern>`, 'url(#a)'), false);
add('tape', 'check_sky', wash(`<pattern id="a" width="32" height="32" patternUnits="userSpaceOnUse"><rect width="32" height="32" fill="${P.white}"/><rect width="16" height="32" fill="${P.sky}" opacity=".75"/><rect width="32" height="16" fill="${P.sky}" opacity=".75"/></pattern>`, 'url(#a)'), false);
add('tape', 'kraft', wash(`<pattern id="a" width="20" height="20" patternUnits="userSpaceOnUse"><rect width="20" height="20" fill="${P.peach}"/><path d="M0 20 L20 0" stroke="#fff" stroke-opacity=".35" stroke-width="3"/></pattern>`, 'url(#a)'), false);
add('tape', 'lavender', wash('', P.lav), false);

// ---- 메모 ----
add('memo', 'note_yellow', `<path d="M40 40 H216 V172 L172 216 H40Z" fill="${P.yellow}" ${st()}/><path d="M172 216 V172 H216Z" fill="${P.peach}" ${st(5)}/>
  <path d="M66 86 H190 M66 118 H190 M66 150 H140" stroke="${L}" stroke-opacity=".35" stroke-width="6" stroke-linecap="round"/>`);
add('memo', 'note_pink', `<path d="M40 40 H216 V172 L172 216 H40Z" fill="${P.pink}" ${st()}/><path d="M172 216 V172 H216Z" fill="${P.rose}" ${st(5)}/>
  <path d="M66 86 H190 M66 118 H190 M66 150 H140" stroke="${L}" stroke-opacity=".35" stroke-width="6" stroke-linecap="round"/>`);
add('memo', 'tag', `<path d="M40 100 L100 44 H214 Q226 44 226 56 V200 Q226 212 214 212 H100 L40 156Z" transform="rotate(0)" fill="${P.cream}" ${st()}/>
  <circle cx="98" cy="128" r="12" fill="${P.desk || '#F4EDE3'}" ${st(5)}/><path d="M98 116 Q90 70 40 40" fill="none" stroke="${P.rose}" stroke-width="6" stroke-linecap="round"/>
  <path d="M130 100 H200 M130 130 H200 M130 160 H174" stroke="${L}" stroke-opacity=".35" stroke-width="6" stroke-linecap="round"/>`);
add('memo', 'bubble', `<path d="M40 52 H216 Q232 52 232 68 V152 Q232 168 216 168 H150 L110 214 L108 168 H40 Q24 168 24 152 V68 Q24 52 40 52Z" fill="${P.white}" ${st()}/>
  <circle cx="86" cy="110" r="10" fill="${L}"/><circle cx="128" cy="110" r="10" fill="${L}"/><circle cx="170" cy="110" r="10" fill="${L}"/>`);
add('memo', 'clip', `<path d="M96 70 V160 Q96 196 128 196 Q160 196 160 160 V54 Q160 30 136 30 Q112 30 112 54 V150 Q112 168 128 168 Q144 168 144 150 V76" fill="none" stroke="${L}" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M96 70 V160 Q96 196 128 196 Q160 196 160 160 V54 Q160 30 136 30 Q112 30 112 54 V150 Q112 168 128 168 Q144 168 144 150 V76" fill="none" stroke="${P.sky}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`, false);

// ---- 그리기 ----
const DIE = `<filter id="die" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB">
  <feMorphology in="SourceAlpha" operator="dilate" radius="8" result="d"/><feFlood flood-color="#FFFFFF"/><feComposite in2="d" operator="in" result="w"/>
  <feGaussianBlur in="d" stdDeviation="3" result="b"/><feFlood flood-color="#6b5a3e" flood-opacity=".28"/><feComposite in2="b" operator="in" result="sh"/>
  <feOffset in="sh" dy="3" result="sh2"/><feMerge><feMergeNode in="sh2"/><feMergeNode in="w"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
const full = (s) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256"><defs>${DIE}</defs><g transform="translate(128 128) scale(.86) translate(-128 -128)" ${s.die ? 'filter="url(#die)"' : ''}>${s.svg}</g></svg>`;

(async () => {
  const { chromium } = require('playwright');
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 256, height: 256 }, deviceScaleFactor: 2 });
  for (const s of S) {
    await p.setContent(`<body style="margin:0;background:transparent">${full(s)}</body>`);
    await p.screenshot({ path: `${OUT}/${s.cat}_${s.name}.png`, omitBackground: true, clip: { x: 0, y: 0, width: 256, height: 256 } });
  }
  // 미리보기 (확인용)
  const pv = await b.newPage({ viewport: { width: 1100, height: 900 } });
  await pv.setContent(`<body style="margin:0;background:#FFFDF8;display:flex;flex-wrap:wrap;gap:6px;padding:12px;font:12px sans-serif;color:#5B4B3C">${S.map((s) => `<div style="text-align:center;width:128px">${full(s).replace('width="256" height="256"', 'width="128" height="128"')}<div>${s.cat}_${s.name}</div></div>`).join('')}</body>`);
  await pv.screenshot({ path: '/tmp/claude-0/stickers_preview.png', fullPage: true });
  await b.close();
  console.log(S.length, 'stickers');
})();
