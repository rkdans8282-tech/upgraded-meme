import UserNotifications

/// 잠금화면 알림 영역(노란 박스 위치)에 "메모 입력" 알림을 항상 띄워 둔다.
/// 알림을 아래로 당기거나 길게 누르면 잠금화면에서 바로 키보드가 열리고,
/// 입력한 글은 앱을 열지 않고 저장된다.
final class QuickNotification: NSObject, UNUserNotificationCenterDelegate {
    static let shared = QuickNotification()
    private let category = "QUICK_MEMO"
    private let action = "WRITE"
    private let requestID = "quick-memo-persistent"

    func setup() {
        let center = UNUserNotificationCenter.current()
        center.delegate = self

        let write = UNTextInputNotificationAction(
            identifier: action,
            title: "✍️ 메모 쓰기",
            options: [],                       // 잠금 해제 불필요, 앱도 안 열림
            textInputButtonTitle: "저장",
            textInputPlaceholder: "급한 메모를 입력하세요")
        center.setNotificationCategories([
            UNNotificationCategory(identifier: category, actions: [write],
                                   intentIdentifiers: [], options: [])
        ])
        center.requestAuthorization(options: [.alert, .sound]) { granted, _ in
            if granted { self.post() }
        }
    }

    /// 입력 후 알림이 사라지므로 다시 띄운다.
    func post() {
        let content = UNMutableNotificationContent()
        content.title = "📝 빠른 메모"
        content.body = "여기를 당겨서 바로 메모하세요"
        content.categoryIdentifier = category
        content.interruptionLevel = .passive   // 소리·화면 켜짐 없음
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 1, repeats: false)
        UNUserNotificationCenter.current().add(
            UNNotificationRequest(identifier: requestID, content: content, trigger: trigger))
    }

    func userNotificationCenter(_ center: UNUserNotificationCenter,
                                didReceive response: UNNotificationResponse,
                                withCompletionHandler completionHandler: @escaping () -> Void) {
        if let r = response as? UNTextInputNotificationResponse {
            MemoStore.add(r.userText)
        }
        post()
        completionHandler()
    }

    func userNotificationCenter(_ center: UNUserNotificationCenter,
                                willPresent notification: UNNotification,
                                withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        completionHandler([.banner])
    }
}
