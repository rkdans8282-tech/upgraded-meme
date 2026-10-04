import SwiftUI

@main
struct LockMemoApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) private var delegate
    @State private var showEditor = false

    var body: some Scene {
        WindowGroup {
            ContentView(showEditor: $showEditor)
                // 위젯/컨트롤 탭 → lockmemo://new → 바로 입력창
                .onOpenURL { url in
                    if url.host == "new" { showEditor = true }
                }
        }
    }
}

final class AppDelegate: NSObject, UIApplicationDelegate {
    func application(_ application: UIApplication,
                     didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {
        QuickNotification.shared.setup()
        return true
    }
}
