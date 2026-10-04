import AppIntents
import Foundation

/// 컨트롤(잠금화면 하단 버튼) → 앱 실행 + "입력창 열기" 플래그 저장 (앱 프로세스에서 실행됨)
@available(iOS 18.0, *)
struct NewMemoIntent: ControlConfigurationIntent {
    static var title: LocalizedStringResource = "새 메모"
    static var openAppWhenRun = true
    func perform() async throws -> some IntentResult {
        UserDefaults(suiteName: appGroupID)?.set(true, forKey: "openEditor")
        return .result()
    }
}
