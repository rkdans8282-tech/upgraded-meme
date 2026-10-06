// 다이어리 디자인 틀 — 색/크기를 여기서 한 번에 바꿉니다. (파스텔 베이지)
export const theme = {
  color: {
    desk: '#000000', // 공책 뒤 책상 (사용에 집중되도록 검정)
    coverBlack: '#141414', // 표지 (검정 가죽)
    pink: '#F4A9C4', // 표지 글씨
    cover: '#E9DBC6',
    coverDark: '#D8C6AA', // 표지 밴드/스티치/가장자리
    paper: '#FFFFFF', // 속지 (순백)
    paperEdge: '#ECECEC', // 쌓인 종이 옆면
    rule: '#E6DCCB', // 줄
    margin: '#E9C9C1', // 왼쪽 여백선 (연한 로즈)
    text: '#5B4B3C',
    textSoft: '#9C8B78',
    accent: '#D9BE94', // 선택/강조 (버튼, 선택된 기분)
    accentSoft: '#F5E8D0',
    coil: '#FFFFFF', // 스프링 (흰 링)
    coilEdge: '#D2D2D2',
  },
  font: { regular: 'Gaegu_400Regular', bold: 'Gaegu_700Bold', serif: 'PlayfairDisplay_400Regular_Italic' },
  radius: { pill: 999 },
  minTouch: 44,
  pageLeft: 80, // 속지 왼쪽 여백 (스프링 구멍 + 여백선 자리)
};
