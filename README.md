# 📔 다이어리

파스텔 베이지 스프링 노트 느낌의 아이폰·아이패드용 다이어리 앱 (Expo / React Native).
기획은 [PLAN.md](PLAN.md) 참고.

## 내 아이폰/아이패드에서 보기
1. 기기에 App Store에서 **Expo Go** 설치
2. PC에서 `cd app && npm install && npx expo start` (코드가 바뀌어 새 패키지가 생기면 `npm install`을 다시)
3. 터미널에 뜨는 QR코드를 기기 카메라로 찍기 (PC와 같은 Wi-Fi)

## 폴더
- `app/` 앱 코드 (`src/theme.ts` 색상, `src/components/` 표지·속지·책장 넘김)
- `tools/make_assets.js` 종이 질감·효과음 생성
- `tools/make_stickers.js` 기본 스티커 그리기 / `tools/build_stickers_index.js` 스티커 목록 갱신

## 스티커 직접 추가하기
1. 투명 배경 PNG(512×512 정도)를 `app/assets/stickers/` 폴더에 넣는다.
   - 파일 이름: `분류_이름.png` (분류: `basic` 기본 / `flower` 꽃 / `weather` 날씨 / `food` 음식 / `tape` 테이프 / `memo` 메모)
   - 분류 없이 `my_이름.png`로 저장하면 **내 스티커**에 모인다.
2. 프로젝트 폴더에서 `node tools/build_stickers_index.js` 실행 (목록 갱신)
3. 앱을 다시 열면 스티커 판에 나타난다.

기본 스티커 그림은 `tools/make_stickers.js`에 있다 (색·모양을 고쳐 다시 그릴 수 있음).
