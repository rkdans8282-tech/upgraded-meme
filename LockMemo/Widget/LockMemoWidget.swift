import WidgetKit
import SwiftUI

struct Entry: TimelineEntry { let date: Date; let memo: Memo? }

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> Entry { Entry(date: .now, memo: Memo(text: "메모")) }
    func getSnapshot(in context: Context, completion: @escaping (Entry) -> Void) {
        completion(Entry(date: .now, memo: MemoStore.load().first))
    }
    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> Void) {
        completion(Timeline(entries: [Entry(date: .now, memo: MemoStore.load().first)], policy: .never))
    }
}

struct MemoWidgetView: View {
    @Environment(\.widgetFamily) var family
    let entry: Entry

    var body: some View {
        Group {
            switch family {
            case .accessoryCircular:
                ZStack { AccessoryWidgetBackground(); Image(systemName: "square.and.pencil").font(.title2) }
            case .accessoryInline:
                Label(entry.memo?.text ?? "메모 쓰기", systemImage: "square.and.pencil")
            default:
                VStack(alignment: .leading, spacing: 2) {
                    Label("빠른 메모", systemImage: "square.and.pencil").font(.caption.bold())
                    Text(entry.memo?.text ?? "탭해서 바로 쓰기")
                        .font(.footnote).lineLimit(3)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
        .widgetURL(URL(string: "lockmemo://new"))
        .containerBackground(.clear, for: .widget)
    }
}

struct LockMemoWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "LockMemoWidget", provider: Provider()) { MemoWidgetView(entry: $0) }
            .configurationDisplayName("빠른 메모")
            .description("탭하면 바로 메모 입력창이 열립니다.")
            .supportedFamilies([.accessoryRectangular, .accessoryCircular, .accessoryInline, .systemSmall])
    }
}
