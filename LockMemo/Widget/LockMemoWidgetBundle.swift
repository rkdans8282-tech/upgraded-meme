import WidgetKit
import SwiftUI

@main
struct LockMemoWidgetBundle: WidgetBundle {
    var body: some Widget {
        LockMemoWidget()
        if #available(iOS 18.0, *) { LockMemoControl() }
    }
}
