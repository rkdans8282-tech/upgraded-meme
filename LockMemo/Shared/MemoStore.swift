import Foundation
import WidgetKit

let appGroupID = "group.com.example.lockmemo"

struct Memo: Identifiable, Codable, Equatable {
    var id = UUID()
    var text: String
    var date = Date()
}

/// 앱·위젯이 App Group 파일로 메모를 공유한다.
enum MemoStore {
    private static var url: URL {
        FileManager.default
            .containerURL(forSecurityApplicationGroupIdentifier: appGroupID)!
            .appendingPathComponent("memos.json")
    }

    static func load() -> [Memo] {
        guard let data = try? Data(contentsOf: url),
              let memos = try? JSONDecoder().decode([Memo].self, from: data) else { return [] }
        return memos
    }

    static func save(_ memos: [Memo]) {
        guard let data = try? JSONEncoder().encode(memos) else { return }
        try? data.write(to: url, options: .atomic)
        WidgetCenter.shared.reloadAllTimelines()
    }

    static func add(_ text: String) {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }
        save([Memo(text: trimmed)] + load())
    }
}
