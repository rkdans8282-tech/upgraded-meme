import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Chick } from './Chick';
import { PaperTexture } from './PaperTexture';
import { theme } from '../theme';

const { color, font } = theme;

// 인덱스 탭을 눌렀을 때 공책 위로 펼쳐지는 종이 (달력/꾸미기/설정은 다음 단계에서 채움)
export function Pane({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <View style={s.pane}>
      <PaperTexture />
      <View style={s.head}>
        <Text style={s.title}>{title}</Text>
        <Pressable onPress={onClose} style={s.close} accessibilityRole="button" accessibilityLabel="닫기">
          <Text style={s.closeText}>✕ 닫기</Text>
        </Pressable>
      </View>
      <View style={s.body}>
        <Chick mood="sleepy" size={150} />
        <Text style={s.msg}>{title}은(는) 준비 중이에요, 삐약!</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  pane: { ...StyleSheet.absoluteFill, backgroundColor: color.paper, borderTopRightRadius: 10, borderBottomRightRadius: 10, overflow: 'hidden' },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 68, paddingRight: 14, paddingTop: 14 },
  title: { fontFamily: font.bold, fontSize: 32, color: color.text },
  close: { minHeight: theme.minTouch, justifyContent: 'center', paddingHorizontal: 16, borderRadius: theme.radius.pill, backgroundColor: color.yellow },
  closeText: { fontFamily: font.bold, fontSize: 20, color: color.text },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  msg: { fontFamily: font.regular, fontSize: 24, color: color.text, marginTop: 8 },
});
