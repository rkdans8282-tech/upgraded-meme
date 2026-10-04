import WidgetKit
import SwiftUI
import AppIntents

/// iOS 18+: 잠금화면 하단 버튼(손전등/카메라 자리)에 올릴 수 있는 컨트롤
@available(iOS 18.0, *)
struct LockMemoControl: ControlWidget {
    var body: some ControlWidgetConfiguration {
        StaticControlConfiguration(kind: "LockMemoControl") {
            ControlWidgetButton(action: NewMemoIntent()) {
                Label("새 메모", systemImage: "square.and.pencil")
            }
        }
        .displayName("새 메모")
    }
}
