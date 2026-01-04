import SwiftUI

// 收音机配色方案
struct RadioColors {
    static let body = Color(red: 0.17, green: 0.09, blue: 0.06)      // #2C1810
    static let bodyLight = Color(red: 0.29, green: 0.20, blue: 0.16)  // #4A3228
    static let bodyDark = Color(red: 0.10, green: 0.06, blue: 0.04)   // #1A0F0A
    static let brass = Color(red: 0.72, green: 0.53, blue: 0.04)      // #B8860B
    static let brassLight = Color(red: 0.85, green: 0.65, blue: 0.13) // #DAA520
    static let brassDark = Color(red: 0.55, green: 0.41, blue: 0.08)   // #8B6914
    static let dial = Color(red: 0.96, green: 0.90, blue: 0.83)        // #F5E6D3
    static let dialText = Color(red: 0.17, green: 0.09, blue: 0.06)
    static let needle = Color(red: 0.86, green: 0.08, blue: 0.24)      // #DC143C
    static let speaker = Color(red: 0.10, green: 0.06, blue: 0.04)
    static let speakerMesh = Color(red: 0.24, green: 0.16, blue: 0.09)
    static let glow = Color(red: 1.0, green: 0.84, blue: 0.0)          // #FFD700
    static let ledOn = Color(red: 0.0, green: 1.0, blue: 0.0)
    static let ledOff = Color(red: 0.2, green: 0.2, blue: 0.2)
}

// 收音机主体视图
struct RadioBodyView<Content: View>: View {
    let content: Content

    init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }

    var body: some View {
        ZStack {
            // 木质机身渐变
            LinearGradient(
                colors: [RadioColors.bodyLight, RadioColors.body, RadioColors.bodyDark],
                startPoint: .top,
                endPoint: .bottom
            )
            .cornerRadius(20)
            .shadow(color: .black.opacity(0.5), radius: 20, x: 0, y: 10)

            // 顶部黄铜装饰条
            VStack(spacing: 0) {
                Rectangle()
                    .fill(RadioColors.bodyDark)
                    .frame(height: 8)

                LinearGradient(
                    colors: [RadioColors.brassLight, RadioColors.brass, RadioColors.brassDark],
                    startPoint: .top,
                    endPoint: .bottom
                )
                .frame(height: 4)
                .padding(.horizontal, 80)

                content

                // 底部装饰
                bottomTrim
            }
        }
    }

    var bottomTrim: some View {
        HStack {
            // 左脚垫
            RoundedRectangle(cornerRadius: 5)
                .fill(RadioColors.bodyDark)
                .frame(width: 35, height: 10)
                .shadow(color: .black.opacity(0.5), radius: 3, x: 0, y: 3)

            Spacer()

            // 底部铭牌
            LinearGradient(
                colors: [RadioColors.brassLight, RadioColors.brass, RadioColors.brassDark],
                startPoint: .top,
                endPoint: .bottom
            )
            .padding(.horizontal, 20)
            .padding(.vertical, 3)
            .overlay(
                Text("MODEL HR-5000 • 穿越五千年华夏文明")
                    .font(.system(size: 9))
                    .foregroundColor(RadioColors.bodyDark)
                    .tracking(1)
            )

            Spacer()

            // 右脚垫
            RoundedRectangle(cornerRadius: 5)
                .fill(RadioColors.bodyDark)
                .frame(width: 35, height: 10)
                .shadow(color: .black.opacity(0.5), radius: 3, x: 0, y: 3)
        }
        .frame(height: 28)
        .padding(.bottom, 5)
        .padding(.horizontal, 30)
    }
}
