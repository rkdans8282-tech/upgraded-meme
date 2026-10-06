import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { InkLayer } from './InkLayer';
import { StickerLayer } from './StickerLayer';
import { theme } from '../theme';
import type { CoverStyle, TitleFont } from '../diaries';

const { font } = theme;
const noop = () => {};

const TITLE_FONT: Record<TitleFont, string> = { serif: font.serif, sans: font.bold, hand: 'Gaegu_700Bold' };
export const TITLE_FONT_LABEL: Record<TitleFont, string> = { serif: '세리프', sans: '고딕', hand: '손글씨' };

type ArtProps = {
  cover: CoverStyle;
  title: string;
  year: number;
  w: number;
  h: number;
  bare?: boolean; // true면 스티커·손글씨는 안 그림 (꾸미기 화면에서 따로 그리므로)
  children?: ReactNode;
};

// 표지 그림: 책장 진열, 표지 꾸미기, 책 겉표지에서 모두 같은 모양 (크기만 달라짐)
export function CoverArt({ cover, title, year, w, h, bare, children }: ArtProps) {
  const tc = cover.titleColor;
  return (
    <View style={{ width: w, height: h, backgroundColor: cover.color, overflow: 'hidden', borderTopRightRadius: 2, borderBottomRightRadius: 2 }}>
      {cover.stitch && (
        <View
          pointerEvents="none"
          style={{ position: 'absolute', left: w * 0.17, right: w * 0.04, top: w * 0.04, bottom: w * 0.04, borderWidth: Math.max(1, w * 0.003), borderStyle: 'dashed', borderColor: tc, opacity: 0.3 }}
        />
      )}
      <View style={[s.titleBox, { marginLeft: w * 0.1 }]} pointerEvents="none">
        <Text
          numberOfLines={2}
          adjustsFontSizeToFit
          style={{ fontFamily: TITLE_FONT[cover.titleFont], fontSize: w * 0.17, color: tc, letterSpacing: w * 0.008, textAlign: 'center', maxWidth: w * 0.66 }}
        >
          {title}
        </Text>
        <View style={{ width: w * 0.13, height: Math.max(1, w * 0.003), backgroundColor: tc, marginVertical: w * 0.04, opacity: 0.8 }} />
        <Text style={{ fontFamily: font.serif, fontSize: w * 0.05, color: tc, letterSpacing: w * 0.016, opacity: 0.85 }}>{year}</Text>
      </View>
      {!bare && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <InkLayer strokes={cover.strokes} pageW={w} pageH={h} drawing={false} tool="pen" color="#000" widthRatio={0.01} onChange={noop} />
          <StickerLayer stickers={cover.stickers} selectedId={null} pageW={w} pageH={h} onSelect={noop} onCommit={noop} />
        </View>
      )}
      {children}
    </View>
  );
}

// 책 겉표지: 탭하면 열림
export function Cover({
  cover, title, year, w, h, onOpen,
}: {
  cover: CoverStyle; title: string; year: number; w: number; h: number; onOpen: () => void;
}) {
  const tc = cover.titleColor;
  return (
    <Pressable style={{ flex: 1 }} onPress={onOpen} accessibilityRole="button" accessibilityLabel="다이어리 펼치기">
      <CoverArt cover={cover} title={title} year={year} w={w} h={h}>
        <View style={s.openBtn} pointerEvents="none">
          <Text style={[s.openText, { color: tc, borderColor: tc }]}>OPEN</Text>
        </View>
      </CoverArt>
    </Pressable>
  );
}

const s = StyleSheet.create({
  titleBox: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  openBtn: { position: 'absolute', bottom: 38, left: 64, right: 14, alignItems: 'center' },
  openText: {
    fontFamily: font.serif, fontSize: 13, letterSpacing: 4, borderWidth: 1,
    paddingHorizontal: 26, paddingVertical: 10, borderRadius: theme.radius.pill, overflow: 'hidden',
  },
});
