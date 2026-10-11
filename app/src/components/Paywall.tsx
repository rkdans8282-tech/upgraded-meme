import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { FREE_DIARIES } from '../diaries';
import { theme } from '../theme';

const { font } = theme;

type Props = {
  visible: boolean;
  price: string; // 스토어에 표시되는 가격 (예: ₩3,300)
  busy: boolean;
  message: string | null; // 취소/실패 안내
  live: boolean; // false면 실제 결제가 아닌 테스트 모드
  onBuy: () => void;
  onRestore: () => void;
  onClose: () => void;
};

// 무료 권수를 넘겨서 새 다이어리를 만들려 할 때 뜨는 안내
export function Paywall({ visible, price, busy, message, live, onBuy, onRestore, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.backdrop} onPress={busy ? undefined : onClose}>
        <Pressable style={s.card} onPress={() => {}}>
          <Text style={s.title}>다이어리를 더 만들어 볼까요?</Text>
          <Text style={s.body}>
            다이어리 {FREE_DIARIES}권까지는 무료예요.{'\n'}한 권 추가할 때마다 {price}이 결제되고, 표지부터 직접 꾸며서 책장에 모을 수 있어요.
          </Text>
          <Pressable style={[s.buy, busy && { opacity: 0.6 }]} onPress={onBuy} disabled={busy} accessibilityRole="button" accessibilityLabel="다이어리 한 권 추가 구매">
            {busy ? <ActivityIndicator color="#141414" /> : <Text style={s.buyText}>다이어리 1권 추가하기 · {price}</Text>}
          </Pressable>
          {message ? <Text style={s.msg}>{message}</Text> : null}
          <View style={s.links}>
            <Pressable style={s.link} onPress={onRestore} disabled={busy} accessibilityRole="button" accessibilityLabel="구매 복원">
              <Text style={s.linkText}>구매 복원</Text>
            </Pressable>
            <Pressable style={s.link} onPress={onClose} disabled={busy} accessibilityRole="button" accessibilityLabel="나중에">
              <Text style={s.linkText}>나중에</Text>
            </Pressable>
          </View>
          <Text style={s.fine}>
            결제는 Apple ID로 청구돼요. 이미 구매한 적이 있다면 「구매 복원」을 눌러 주세요.{!live ? '\n(테스트 모드: 실제 결제 없이 바로 추가돼요)' : ''}
          </Text>
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
  msg: { fontFamily: font.regular, fontSize: 13, color: '#E8A0A0', textAlign: 'center', marginTop: 10 },
  links: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 6 },
  link: { minHeight: 44, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  linkText: { fontFamily: font.regular, fontSize: 14, color: '#9A9A9A' },
  fine: { fontFamily: font.regular, fontSize: 11.5, color: '#707070', textAlign: 'center', lineHeight: 17 },
});
