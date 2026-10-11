# 인수인계: 사진 넣기(M2) · 사진 오리기(M3)

> 클라우드 세션에서 설계까지 했고, 코드는 아직 쓰지 않았다. 노트북(데스크톱 앱)에서 이어서 구현한다.
> 로드맵과 배경은 `docs/PRD.md`, 디자인 방향은 `PLAN.md` 참고.

## 현재 상태
- 펜/형광펜/지우개(M1) 완료: `app/src/strokes.ts`, `app/src/components/InkLayer.tsx`
- 이미 설치된 패키지(package.json): `react-native-svg`, `expo-image-picker`, `expo-file-system`, `expo-image-manipulator` (모두 SDK 57 번들 버전)
- `app/app.json`에 `expo-image-picker` 플러그인 추가 필요 (사진첩 접근 문구)

## 구현 설계

### 데이터 (`app/src/stickers.ts`의 `Sticker`에 선택 필드 추가)
```ts
photo?: string;      // 'file:<이름>.jpg' (앱 문서 폴더/photos) 또는 웹에서는 data URI
aspect?: number;     // 화면에 보이는 가로/세로 비율
imgAspect?: number;  // 원본 사진 가로/세로
cut?: { pts: number[]; box: [number, number, number, number] }; // 오린 윤곽(사진 기준 0~1) + 경계 상자
```
- 사진 스티커는 `key: ''` + `photo`를 가진다. 기존 스티커와 같은 이동/크기/회전/삭제/되돌리기를 그대로 쓴다.
- **절대 경로를 저장하지 말 것**: iOS는 앱 업데이트 시 문서 폴더 경로가 바뀔 수 있다. 파일 이름만 저장하고 그릴 때 `new File(Paths.document, 'photos', 이름).uri`로 풀어쓴다.

### 사진 가져오기 (`app/src/photos.ts` 새로 만들기)
1. `ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 })`
2. `ImageManipulator.manipulate(uri).resize({ width: 최대 1280 }).renderAsync()` → `saveAsync({ format: SaveFormat.JPEG, compress: 0.8 })`
3. 네이티브: `Paths.document/photos/` 폴더(`create({ idempotent: true })`)에 `File.copy`로 저장. 웹: data URI 그대로 사용 (웹은 localStorage 용량이 작으므로 1024px 이하 권장).
- Expo 문서(docs.expo.dev)는 클라우드 환경에서 막혀 있었다. **노트북에서는 공식 문서(v57)를 확인하고** 위 API 이름을 검증할 것.

### 오리기 화면 (`app/src/components/CutoutModal.tsx` 새로 만들기)
- 사진을 화면에 맞춰 크게 보여주고, 손가락으로 윤곽을 한 번에 그린다 (PanResponder, 점 수집).
- 놓으면 닫힌 다각형이 되고 `다시 그리기` / `✓ 오리기 완료` 버튼.
- 좌표는 화면 좌표 → 사진 기준 0~1로 변환(사진이 contain으로 놓인 영역을 계산해서 보정).
- 경계 상자는 윤곽 bbox에 3% 정도 여유를 주고 0~1로 clamp.

### 그리기 (`StickerLayer.tsx` 수정)
- `photo`가 있으면 `stickerSource` 대신 사진을 그린다. 높이는 `width / (aspect ?? 1)`.
- `cut`이 없으면 흰 테두리 `Image`.
- `cut`이 있으면 `react-native-svg`로 그린다: `viewBox`는 경계 상자(가상 폭 1000, 높이 1000/imgAspect), 흰 다각형(채움+굵은 선)을 아래에 깔고 그 위에 `ClipPath`로 자른 `Image`. `ClipPath id`는 스티커마다 유일하게(`clip-${id}`).
- 오린 뒤 `aspect = bw * imgAspect / bh`.

### 화면 (`DiaryPage.tsx` 수정)
- 하단 도구줄: `＋ 스티커` `✏️ 펜` `🖼 사진` + 되돌리기 (좁으니 되돌리기는 `↩︎` 아이콘만)
- 사진 스티커를 선택하면 편집 막대에 `✂️ 오리기` 추가 → `CutoutModal`
- 사진 기본 크기 `scale: 1.7`, 오린 뒤 `1.3`

### 이후 (같은 기능의 확장)
- 오린 결과를 `내 스티커` 보관함(분류 `my`)에 저장해서 다시 쓰기
- 삭제된 사진 파일 정리(고아 파일)
- 오리기 무료 횟수 제한 + 프로 결제 연결(M7)

## 검증 방법
- `cd app && npx expo start --web` → 브라우저에서 확인 (펜 기능은 이 방식으로 검증했다)
- `npx tsc --noEmit` (타입체크), `npx expo lint` (클라우드에서는 네트워크 때문에 못 돌렸다)
- 실제 아이폰: Expo Go로 QR 접속. 손가락 감각은 웹으로는 검증 불가.
