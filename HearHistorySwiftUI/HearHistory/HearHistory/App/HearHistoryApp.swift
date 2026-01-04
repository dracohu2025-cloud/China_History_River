import SwiftUI

@main
struct HearHistoryApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
                .statusBar(hidden: true)
                .preferredInterfaceOrientationForPresentation(.landscape)
                .supportedOrientations(.landscape)
        }
    }
}
