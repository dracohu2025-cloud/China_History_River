import SwiftUI

// 大号调谐旋钮
struct TuningKnobView: View {
    @ObservedObject var viewModel: RadioViewModel
    @State private var lastTranslation: CGFloat = 0

    var body: some View {
        VStack(spacing: 6) {
            // 旋钮阴影
            Circle()
                .fill(
                    LinearGradient(
                        colors: [RadioColors.brassLight, RadioColors.brass, RadioColors.brassDark],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
                .frame(width: 120, height: 120)
                .shadow(color: .black.opacity(0.6), radius: 8, x: 4, y: 6)
                .overlay(
                    Circle()
                        .stroke(RadioColors.brassDark, lineWidth: 3)
                )
                .overlay(knobContent)
                .rotationEffect(.degrees(viewModel.knobRotation))
                .gesture(
                    DragGesture(minimumDistance: 0)
                        .onChanged { value in
                            let delta = value.translation.height - lastTranslation
                            viewModel.adjustFrequency(by: delta)
                            lastTranslation = value.translation.height
                        }
                        .onEnded { _ in
                            lastTranslation = 0
                        }
                )

            Text("↑ 未来  ↓ 过去")
                .font(.system(size: 9))
                .foregroundColor(RadioColors.brass.opacity(0.8))
        }
    }

    var knobContent: some View {
        ZStack {
            // 24个小刻痕纹理
            ForEach(0..<24) { i in
                Rectangle()
                    .fill(RadioColors.brassDark)
                    .frame(width: 2, height: 6)
                    .offset(y: -52)
                    .rotationEffect(.degrees(Double(i) * 15))
            }

            // 顶部指示线
            Rectangle()
                .fill(RadioColors.bodyDark)
                .frame(width: 4, height: 20)
                .cornerRadius(2)
                .offset(y: -40)

            // 中心圆
            Circle()
                .fill(RadioColors.bodyDark)
                .frame(width: 50, height: 50)
                .overlay(
                    Circle()
                        .stroke(RadioColors.brass, lineWidth: 2)
                )
                .overlay(
                    Text("调谐")
                        .font(.system(size: 11))
                        .fontWeight(.bold)
                        .foregroundColor(RadioColors.brass)
                )
        }
    }
}

// 电源指示灯
struct PowerLEDView: View {
    @ObservedObject var viewModel: RadioViewModel

    var body: some View {
        VStack(spacing: 3) {
            Circle()
                .fill(viewModel.isPlaying ? RadioColors.ledOn : RadioColors.ledOff)
                .frame(width: 12, height: 12)
                .overlay(
                    Circle()
                        .stroke(RadioColors.brass, lineWidth: 2)
                )
                .shadow(
                    color: viewModel.isPlaying ? RadioColors.ledOn : .clear,
                    radius: viewModel.isPlaying ? 8 : 0
                )
                .onTapGesture {
                    withAnimation(.easeInOut(duration: 0.2)) {
                        viewModel.isPlaying.toggle()
                    }
                }

            Text("POWER")
                .font(.system(size: 8))
                .foregroundColor(RadioColors.brass)
        }
    }
}

// 扬声器网格
struct SpeakerGrillView: View {
    var body: some View {
        ZStack {
            Circle()
                .fill(RadioColors.speaker)
                .frame(width: 100, height: 100)
                .shadow(color: .black.opacity(0.8), radius: 4, x: 2, y: 2)

            // 8x12 网格孔
            VStack(spacing: 2) {
                ForEach(0..<8) { _ in
                    HStack(spacing: 2) {
                        ForEach(0..<12) { _ in
                            Circle()
                                .fill(RadioColors.speakerMesh)
                                .frame(width: 5, height: 5)
                        }
                    }
                }
            }
            .padding(8)
        }
    }
}
