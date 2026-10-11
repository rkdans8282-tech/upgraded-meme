# 개발 빌드 · 결제 · TestFlight 설정 가이드

> Mac 없이 **EAS(클라우드 빌드)** 로 아이폰용 앱을 만들고, 결제를 테스트하고, TestFlight에 올리는 순서입니다.
> 계정 로그인·약관 동의·결제 상품 등록은 **본인이 직접** 해야 하는 단계입니다. (표시: 👤)
> Windows PowerShell에서는 `npx` 대신 `npx.cmd`를 씁니다.

## 0. 현재 상태

- 앱 코드는 결제까지 연결돼 있습니다 (`app/src/purchases.ts`). **키가 없거나 Expo Go/웹이면 '테스트 모드'**(실제 결제 없이 권수만 늘림)로 동작합니다.
- 상품: **`diary_slot`** (소모성, 다이어리 1권 추가, ₩3,300).
- 번들 ID는 임시값 **`com.harupaper.diary`** 입니다 (`app/app.json`). **첫 빌드 전에 확정**하세요. App Store에 등록하면 바꿀 수 없습니다.

## 1. App Store Connect (👤)

1. https://appstoreconnect.apple.com → **앱** → **+** → 새 앱: 이름 `Haru Paper`(또는 하루페이퍼), 번들 ID 선택(없으면 먼저 Certificates, Identifiers & Profiles에서 만들기), SKU 아무거나.
2. **계약 / 세금 / 금융 정보**: 유료 앱·인앱결제를 쓰려면 *Paid Applications* 계약과 은행·세금 정보 입력이 필요합니다. (미완료면 결제 상품이 심사·샌드박스에서 안 보일 수 있음)
3. 앱 → **수익화 → 인앱 구입** → **+**:
   - 유형: **소모성**
   - 참조 이름: `Diary slot` / 제품 ID: **`diary_slot`** (코드와 똑같이)
   - 가격: ₩3,300에 해당하는 가격 단계 선택
   - 현지화(한국어/영어): 표시 이름 "다이어리 1권 추가", 설명 "새 다이어리를 한 권 더 만들 수 있어요"
   - 심사용 스크린샷 1장 (결제 안내 화면)

## 2. RevenueCat (👤)

1. https://www.revenuecat.com 가입 → 프로젝트 생성 → **Apps → + → App Store** 앱 추가 (번들 ID 입력).
2. **App Store Connect API 키 / In-App Purchase 키** 연결 (RevenueCat 안내 화면의 순서대로. 연결하면 상품 가격·구매 내역을 읽습니다).
3. **Products** 에 `diary_slot` 추가 (App Store 상품 ID와 같게).
4. 앱 설정의 **Public API key (Apple, `appl_...`)** 를 복사합니다.
5. `app/.env.example` 을 `app/.env` 로 복사해서 채웁니다:
   ```
   EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_여기에_키
   ```
   (`.env` 는 git에 올라가지 않게 해 두었습니다.)

## 3. 개발 빌드 만들기 (👤 로그인·Apple 계정 입력)

개발 빌드는 Expo Go와 달리 **결제·무음 스위치 진동** 같은 네이티브 기능이 모두 켜진 진짜 앱입니다.

```
cd app
npx.cmd eas-cli login
npx.cmd eas-cli init
npx.cmd eas-cli device:create
npx.cmd eas-cli build --profile development --platform ios
```

- `device:create`: 안내 링크를 **아이폰 사파리**로 열어 기기를 등록합니다 (개발용 설치에 필요).
- `build`: 중간에 Apple 계정 로그인과 인증서 자동 생성 질문이 나옵니다 (모두 Yes 권장). 몇 분~수십 분 걸립니다.
- 끝나면 나오는 링크/QR을 아이폰으로 열어 설치합니다. 설치 후 **설정 → 일반 → VPN 및 기기 관리**에서 개발자 앱을 신뢰해야 할 수 있습니다.
- 실행: 컴퓨터에서 `npx.cmd expo start --dev-client` 후 폰의 앱에서 접속.

`eas.json` 의 설정은 이미 들어 있습니다 (`development` / `preview` / `production`).

## 4. 샌드박스 결제 테스트 (👤)

1. App Store Connect → **사용자 및 액세스 → 샌드박스 → 테스터** 에서 테스트 Apple ID 생성 (실제 이메일 형식, 실제 계정과 달라야 함).
2. 아이폰 **설정 → 개발자 → 샌드박스 Apple 계정**(또는 처음 결제 때 나오는 로그인 창)에서 그 계정으로 로그인.
3. 개발 빌드 앱에서 책장 `+` → 결제 안내 → 구매: 샌드박스라 **실제 청구는 되지 않습니다**.
4. 확인할 것:
   - 결제 안내의 가격이 스토어 가격으로 바뀌는지 (키 연결 전엔 ₩3,300 기본값)
   - 구매 후 새 다이어리 만들기 화면으로 넘어가는지, 책장 위 "추가 1권" 표시
   - 앱 삭제 후 재설치 → 결제 안내 → **구매 복원** 으로 권수가 돌아오는지 (소모성 복원이 불안정하면 PRD 6.1의 대안 참고)
   - 무음 스위치를 켜면 책장 넘길 때 진동이 꺼지는지

## 5. TestFlight (👤)

```
cd app
npx.cmd eas-cli build --profile production --platform ios
npx.cmd eas-cli submit --platform ios
```

- App Store Connect → **TestFlight** 에서 빌드가 처리되면 내부 테스터(본인) 추가 → TestFlight 앱으로 설치.
- 외부 테스터는 간단한 베타 심사가 필요합니다.
- 정식 심사 전에 준비: 개인정보처리방침 URL, 앱 설명/스크린샷, 결제 안내 문구(가격·갱신 없음·복원 방법), 연령 등급.

## 6. 막힐 때

- 빌드 오류 로그는 EAS 빌드 페이지에서 볼 수 있습니다. 로그를 그대로 복사해 보내면 원인을 찾을 수 있습니다.
- 결제 상품이 안 보이면: ① 상품 ID 철자 ② Paid Applications 계약 ③ RevenueCat 키 연결 ④ 상품이 "제출 준비됨" 상태인지 순서로 확인하세요.
