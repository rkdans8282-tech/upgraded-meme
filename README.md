# 🐥 삐약일기

병아리 캐릭터와 함께 쓰는 아이폰·아이패드용 다이어리 앱 (Expo / React Native).
기획은 [PLAN.md](PLAN.md) 참고.

## 내 아이폰/아이패드에서 보기
1. 기기에 App Store에서 **Expo Go** 설치
2. PC에서 `cd app && npm install && npx expo start` (코드가 바뀌어 새 패키지가 생기면 `npm install`을 다시)
3. 터미널에 뜨는 QR코드를 기기 카메라로 찍기 (PC와 같은 Wi-Fi)

## 폴더
- `app/` 앱 코드 (`src/theme.ts` 색상, `src/components/` 표지·속지·책장 넘김)
- `tools/make_assets.js` 종이 질감·효과음 생성
- `Content/characters/` 병아리 SVG, `tools/make_chick.js` 로 재생성
