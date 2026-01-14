import SwiftUI

// 大号调谐旋钮
struct TuningKnobView: View {
    @ObservedObject var viewModel: RadioViewModel
    @State private var previousDragAngle: Double? // 记录上一帧的角度

    var body: some View {
        GeometryReader { geometry in
            let width = geometry.size.width.isFinite ? max(0, geometry.size.width) : 0
            let height = geometry.size.height.isFinite ? max(0, geometry.size.height) : 0
            
            let midX = width / 2
            let midY = height / 2

            VStack(spacing: 6) {
                // 旋钮主体 (ZStack用于分离视觉层和交互层)
                ZStack {
                    // 1. 视觉层 (旋转)
                    Circle()
                        .fill(
                            LinearGradient(
                                colors: [RadioColors.brassLight, RadioColors.brass, RadioColors.brassDark],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .frame(width: 120, height: 120) // 尺寸1
                        .shadow(color: .black.opacity(0.6), radius: 8, x: 4, y: 6)
                        .overlay(
                            Circle()
                                .stroke(RadioColors.brassDark, lineWidth: 3)
                        )
                        .overlay(knobContent)
                        .rotationEffect(.degrees(viewModel.knobRotation.isFinite ? viewModel.knobRotation : 0)) // 保护 rotation
                    
                    // 2. 交互层 (静止，透明)
                    // 这一层不旋转，保证坐标系稳定，解决"不跟手"和"灵敏度爆炸"的问题
                    Circle()
                        .fill(Color.white.opacity(0.001)) // 必须几乎透明但有的fill才能接收点击
                        .frame(width: 120, height: 120) // 尺寸需与视觉层一致
                        .gesture(
                            DragGesture(minimumDistance: 0)
                                .onChanged { value in
                                    // 再次防御性检查
                                    guard value.location.x.isFinite, value.location.y.isFinite else { return }
                                    
                                    // 计算触摸点相对于圆心的当前角度
                                    let vector = CGVector(dx: value.location.x - midX, dy: value.location.y - midY)
                                    let angle = atan2(vector.dy, vector.dx) * 180 / .pi
                                    
                                    if let prevAngle = previousDragAngle {
                                        // 计算角度差 (当前 - 上一帧)
                                        var delta = angle - prevAngle
                                        
                                        // 处理跨越 -180/180 度的情况
                                        if delta > 180 { delta -= 360 }
                                        else if delta < -180 { delta += 360 }
                                        
                                        if delta.isFinite {
                                            viewModel.rotateKnob(by: delta)
                                        }
                                    }
                                    
                                    // 更新上一帧角度，供下一次计算使用
                                    previousDragAngle = angle
                                }
                                .onEnded { _ in
                                    previousDragAngle = nil // 拖动结束，重置状态
                                    viewModel.endDragging()
                                }
                        )
                }

                Text("顺时针: 未来  逆时针: 过去")
                    .font(.system(size: 9))
                    .foregroundColor(RadioColors.brass.opacity(0.8))
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity) // 填充GeometryReader
            .opacity(width > 0 && height > 0 ? 1 : 0) // Hide if invalid
        }
        .frame(width: 120, height: 140) // 给整体定个大概尺寸，方便布局
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
