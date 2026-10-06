import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { Gaegu_400Regular, Gaegu_700Bold } from '@expo-google-fonts/gaegu';
import { PlayfairDisplay_400Regular_Italic } from '@expo-google-fonts/playfair-display';
import { IBMPlexSansKR_400Regular, IBMPlexSansKR_600SemiBold } from '@expo-google-fonts/ibm-plex-sans-kr';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DiaryBook } from './src/DiaryBook';
import { Shelf } from './src/components/Shelf';
import { CoverEditor } from './src/components/CoverEditor';
import { Paywall } from './src/components/Paywall';
import { Diary, newDiary, useDiaries } from './src/diaries';
import { FALLBACK_PRICE, getPriceString, isLive } from './src/purchases';
import { theme } from './src/theme';

type Screen = { name: 'shelf' } | { name: 'book'; id: string } | { name: 'edit'; draft: Diary; isNew: boolean };

// 책장(내 다이어리 모음) ↔ 다이어리 한 권 ↔ 표지 꾸미기
export default function App() {
  const [fontsLoaded] = useFonts({ Gaegu_400Regular, Gaegu_700Bold, PlayfairDisplay_400Regular_Italic, IBMPlexSansKR_400Regular, IBMPlexSansKR_600SemiBold });
  const { diaries, ready, slots, canAdd, add, update, remove, buySlot, restorePurchases } = useDiaries();
  const [screen, setScreen] = useState<Screen>({ name: 'shelf' });
  const [paywall, setPaywall] = useState(false);
  const [price, setPrice] = useState(FALLBACK_PRICE);
  const [live, setLive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [payMsg, setPayMsg] = useState<string | null>(null);

  // 스토어 가격(나라별 통화)과 실제 결제 가능 여부를 불러옴
  useEffect(() => {
    isLive().then(setLive);
    getPriceString().then((p) => p && setPrice(p));
  }, []);
  const openPaywall = () => {
    setPayMsg(null);
    setPaywall(true);
  };

  if (!fontsLoaded || !ready) return <View style={{ flex: 1, backgroundColor: theme.color.desk }} />;

  const startNew = () => setScreen({ name: 'edit', draft: newDiary(), isNew: true });
  const book = screen.name === 'book' ? diaries.find((d) => d.id === screen.id) : undefined;

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      {screen.name === 'edit' ? (
        <CoverEditor
          key={screen.draft.id}
          initial={screen.draft}
          isNew={screen.isNew}
          onCancel={() => setScreen({ name: 'shelf' })}
          onSave={(d) => {
            if (screen.isNew) add(d);
            else update(d.id, d);
            setScreen({ name: 'shelf' });
          }}
        />
      ) : book ? (
        <DiaryBook key={book.id} diary={book} onBack={() => setScreen({ name: 'shelf' })} />
      ) : (
        <Shelf
          diaries={diaries}
          slots={slots}
          onOpen={(id) => setScreen({ name: 'book', id })}
          onAdd={() => (canAdd ? startNew() : openPaywall())}
          onEdit={(id) => {
            const d = diaries.find((x) => x.id === id);
            if (d) setScreen({ name: 'edit', draft: d, isNew: false });
          }}
          onDelete={remove}
        />
      )}
      <Paywall
        visible={paywall}
        price={price}
        busy={busy}
        live={live}
        message={payMsg}
        onClose={() => setPaywall(false)}
        onBuy={async () => {
          setBusy(true);
          setPayMsg(null);
          const r = await buySlot();
          setBusy(false);
          if (r.ok) {
            setPaywall(false);
            startNew();
          } else if (!r.cancelled) {
            setPayMsg('결제를 완료하지 못했어요. 잠시 뒤 다시 시도해 주세요.');
          }
        }}
        onRestore={async () => {
          setBusy(true);
          setPayMsg(null);
          const n = await restorePurchases();
          setBusy(false);
          if (n > 0) {
            setPaywall(false);
          } else {
            setPayMsg('복원할 구매 내역이 없어요.');
          }
        }}
      />
    </SafeAreaProvider>
  );
}
