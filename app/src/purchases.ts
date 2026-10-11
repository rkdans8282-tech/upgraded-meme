import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 다이어리 추가 결제 (RevenueCat + 애플 인앱결제)
// - 상품: 'diary_slot' (소모성 1개 = 다이어리 1권 추가, ₩3,300). App Store Connect와 RevenueCat에 같은 이름으로 만들어야 함
// - 산 횟수는 RevenueCat이 계정(애플 ID)에 기록해서 '구매 복원'으로 되살릴 수 있음
// - 키(EXPO_PUBLIC_REVENUECAT_IOS_KEY)가 없거나, 웹/Expo Go처럼 실제 결제가 안 되는 환경에서는
//   기기 안에 숫자만 저장하는 '테스트 모드'로 동작함 (실제 결제 없음)
export const PRODUCT_ID = 'diary_slot';
export const FALLBACK_PRICE = '₩3,300';
const API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY;
const LOCAL_KEY = 'ppiyak:purchased'; // 테스트 모드에서 쓰는 구매 횟수

type RC = typeof import('react-native-purchases').default;
let rc: RC | null = null;
let ready: Promise<boolean> | null = null;

// 실제 결제를 쓸 수 있으면 true. 앱을 켤 때 한 번만 설정
function init(): Promise<boolean> {
  if (!ready) {
    ready = (async () => {
      if (Platform.OS !== 'ios' || !API_KEY) return false;
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const mod = require('react-native-purchases').default as RC;
        mod.configure({ apiKey: API_KEY });
        rc = mod;
        return true;
      } catch {
        return false; // 네이티브 모듈이 없는 환경 (예: Expo Go)
      }
    })();
  }
  return ready;
}

const countOf = (info: { nonSubscriptionTransactions: { productIdentifier: string }[] }) =>
  info.nonSubscriptionTransactions.filter((t) => t.productIdentifier === PRODUCT_ID).length;

const localCount = async () => Number(await AsyncStorage.getItem(LOCAL_KEY).catch(() => null)) || 0;

export async function isLive() {
  return init();
}

// 지금까지 산 권수
export async function getPurchasedCount(): Promise<number> {
  if (await init()) {
    try {
      return countOf(await rc!.getCustomerInfo());
    } catch {}
  }
  return localCount();
}

// 스토어에 표시되는 가격 (나라별 통화로 나옴). 못 가져오면 null
export async function getPriceString(): Promise<string | null> {
  if (!(await init())) return null;
  try {
    const [p] = await rc!.getProducts([PRODUCT_ID]);
    return p?.priceString ?? null;
  } catch {
    return null;
  }
}

export type BuyResult = { ok: boolean; count: number; cancelled?: boolean };

// 1권 추가 구매. 취소하면 cancelled: true
export async function buyOne(): Promise<BuyResult> {
  if (await init()) {
    try {
      const [product] = await rc!.getProducts([PRODUCT_ID]);
      if (!product) return { ok: false, count: await getPurchasedCount() };
      const { customerInfo } = await rc!.purchaseStoreProduct(product);
      return { ok: true, count: countOf(customerInfo) };
    } catch (e) {
      const cancelled = !!(e as { userCancelled?: boolean }).userCancelled;
      return { ok: false, cancelled, count: await getPurchasedCount() };
    }
  }
  // 테스트 모드: 실제 결제 없이 권수만 늘림
  const next = (await localCount()) + 1;
  await AsyncStorage.setItem(LOCAL_KEY, String(next)).catch(() => {});
  return { ok: true, count: next };
}

// 구매 복원 (앱을 다시 설치했거나 폰을 바꿨을 때)
export async function restore(): Promise<number> {
  if (await init()) {
    try {
      return countOf(await rc!.restorePurchases());
    } catch {}
  }
  return localCount();
}
