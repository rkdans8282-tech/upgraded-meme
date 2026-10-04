# 아이폰만으로 TestFlight 설치하기

모두 아이폰 Safari / 앱으로 가능합니다. (비용: Apple 개발자 프로그램 연 $99)

## 1. Apple Developer Program 가입
- App Store에서 **Apple Developer** 앱 설치 → 로그인 → 계정 → **등록** → 결제 (승인까지 보통 하루 이내)
- 가입 후 **Team ID** 확인: developer.apple.com → Account → Membership details (10자리 영문/숫자)

## 2. 앱 등록 (App Store Connect)
- Safari에서 appstoreconnect.apple.com → 앱 → ➕ 신규 앱
- 번들 ID: `com.ans99880.lockmemo` (예: `com.ans99880.lockmemo`) — 없으면 먼저 developer.apple.com → Identifiers에서 App ID 등록
- 위젯용 `내접두어.lockmemo.widget` App ID도 등록
- Identifiers → App Groups → 등록: `group.com.ans99880.lockmemo`
  그리고 위 두 App ID 모두 App Groups 기능을 켜고 이 그룹을 선택

## 3. API 키 만들기
- appstoreconnect.apple.com → 사용자 및 액세스 → 통합 → **App Store Connect API** → 키 생성
- 접근 권한: **관리(Admin)**
- **Issuer ID**, **Key ID** 메모, `.p8` 파일 다운로드 (한 번만 가능!)
- .p8을 base64로 변환: 아이폰에서 `https://www.base64encode.org` → 파일 업로드 → 결과 복사

## 4. GitHub 설정 (Safari, 저장소 → Settings → Secrets and variables → Actions)
Secrets: `TEAM_ID`, `ASC_KEY_ID`, `ASC_ISSUER_ID`, `ASC_KEY_P8`(base64 결과)
Variables: `BUNDLE_PREFIX` (`com.ans99880`)

## 5. 빌드
- 저장소 → **Actions** → "LockMemo → TestFlight" → **Run workflow**
- 완료되면(약 10~15분) 아이폰 **TestFlight** 앱에서 설치

## 안 될 때
- 빌드 로그의 빨간 오류 문장을 복사해서 알려주세요.
- 흔한 원인: App ID/App Group 미등록, API 키 권한 부족, Team ID 오타
