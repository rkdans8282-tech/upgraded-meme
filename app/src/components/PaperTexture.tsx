import { Image, StyleSheet, useWindowDimensions, View } from 'react-native';

const TILE = 256; // paper.png 한 칸 크기

// 종이 결 무늬를 바둑판처럼 깔아주는 층 (색 위에 은은하게 덮임)
// (resizeMode="repeat"는 웹/일부 환경에서 반복되지 않아 직접 타일링)
export function PaperTexture({ opacity = 1 }: { opacity?: number }) {
  const { width, height } = useWindowDimensions();
  const cols = Math.ceil(width / TILE) + 1;
  const rows = Math.ceil(height / TILE) + 1;
  return (
    <View style={[StyleSheet.absoluteFill, { overflow: 'hidden', opacity }]} pointerEvents="none">
      <View style={{ width: cols * TILE, flexDirection: 'row', flexWrap: 'wrap' }}>
        {Array.from({ length: cols * rows }, (_, i) => (
          <Image key={i} source={require('../../assets/paper.png')} style={{ width: TILE, height: TILE }} />
        ))}
      </View>
    </View>
  );
}
