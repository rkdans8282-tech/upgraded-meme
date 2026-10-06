import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { FREE_DIARIES } from '../diaries';
import { theme } from '../theme';

const { font } = theme;

// 무료 권수를 넘겨서 새 다이어리를 만들려 할 때 뜨는 안내
export function Paywall({ visible, onBuy, onClose }: { visible: boolean; onBuy: () => void; onClose: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.backdrop} onPress={onClose}>
        <Pressable style={s.card} onPress={() => {}}>
          <Text style={s.title}>다이어리를 더 만들어 볼까요?</Text>
          <Text style={s.body}>
            다이어리 {FREE_DIARIES}권까지는 무료예요.{'\n'}새 다이어리를 추가하면 표지부터 직접 꾸며서 책장에 모을 수 있어요.
          </Text>
          <Pressable style={s.buy} onPress={onBuy} accessibilityRole="button" accessibilityLabel="다이어리 한 권 추가 구매">
            <Text style={s.buyText}>다이어리 1권 추가하기</Text>
          </Pressable>
          <Pressable style={s.later} onPress={onClose} accessibilityRole="button" accessibilityLabel="나중에">
            <Text style={s.laterText}>나중에</Text>
          </Pressable>
          {__DEV__ && <Text style={s.dev}>테스트 버전: 실제 결제는 아직 연결되지 않아 바로 추가돼요</Text>}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center', padding: 28 },
  card: { width: '100%', maxWidth: 380, backgroundColor: '#1E1E1E', borderRadius: 18, padding: 24 },
  title: { fontFamily: font.bold, fontSize: 19, color: '#fff', marginBottom: 10 },
  body: { fontFamily: font.regular, fontSize: 14.5, color: '#CFCFCF', lineHeight: 22, marginBottom: 20 },
  buy: { minHeight: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: theme.color.pink },
  buyText: { fontFamily: font.bold, fontSize: 16, color: '#141414' },
  later: { minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  laterText: { fontFamily: font.regular, fontSize: 14, color: '#9A9A9A' },
  dev: { fontFamily: font.regular, fontSize: 11.5, color: '#707070', textAlign: 'center', marginTop: 6 },
});
