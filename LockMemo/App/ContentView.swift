import SwiftUI

struct ContentView: View {
    @Binding var showEditor: Bool
    @State private var memos = MemoStore.load()
    @State private var draft = ""
    @FocusState private var focused: Bool
    @Environment(\.scenePhase) private var phase

    var body: some View {
        NavigationStack {
            List {
                if showEditor {
                    Section {
                        TextEditor(text: $draft)
                            .focused($focused)
                            .frame(minHeight: 120)
                        Button("저장") { commit() }
                            .disabled(draft.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                    }
                }
                ForEach(memos) { memo in
                    VStack(alignment: .leading, spacing: 4) {
                        Text(memo.text)
                        Text(memo.date, format: .dateTime.month().day().hour().minute())
                            .font(.caption).foregroundStyle(.secondary)
                    }
                }
                .onDelete { idx in
                    memos.remove(atOffsets: idx)
                    MemoStore.save(memos)
                }
            }
            .overlay { if memos.isEmpty && !showEditor { ContentUnavailableView("메모가 없어요", systemImage: "note.text") } }
            .navigationTitle("락메모")
            .toolbar {
                Button { showEditor = true } label: { Image(systemName: "square.and.pencil") }
            }
        }
        .onChange(of: showEditor) { _, on in if on { focused = true } }
        .onChange(of: phase) { _, p in
            if p == .active {
                memos = MemoStore.load()   // 잠금화면 알림으로 쓴 메모 반영
                let d = UserDefaults(suiteName: appGroupID)
                if d?.bool(forKey: "openEditor") == true {   // 컨트롤 버튼으로 열린 경우
                    d?.set(false, forKey: "openEditor")
                    showEditor = true
                }
            }
        }
        .onAppear { if showEditor { focused = true } }
    }

    private func commit() {
        MemoStore.add(draft)
        draft = ""
        showEditor = false
        memos = MemoStore.load()
    }
}
