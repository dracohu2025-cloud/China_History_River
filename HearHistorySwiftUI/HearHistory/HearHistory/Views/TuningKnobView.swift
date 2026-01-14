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

// 扬声器/节目显示面板
// 当有播客时，显示可选择的节目列表
// 当无播客时，显示复古扬声器网格
// 扬声器/节目显示面板
struct SpeakerGrillView: View {
    @ObservedObject var viewModel: RadioViewModel
    
    var body: some View {
        ZStack {
            // 面板背景 - 深色凹陷效果
            RoundedRectangle(cornerRadius: 16)
                .fill(
                    LinearGradient(
                        colors: [Color(hex: "2D1E16"), Color(hex: "1A110D")],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
                .frame(width: 170, height: 110)
                .overlay(
                    // 内阴影，模拟凹陷
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(Color.black.opacity(0.6), lineWidth: 4)
                        .blur(radius: 2)
                        .offset(x: 2, y: 2)
                        .mask(RoundedRectangle(cornerRadius: 16))
                )
                .overlay(
                    // 顶部高光边框
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(Color(hex: "5D4037").opacity(0.4), lineWidth: 1)
                )
                .shadow(color: Color.white.opacity(0.05), radius: 1, x: 0, y: 1) // 底部轻微反光
            
            // 内容区域 - 使用 GeometryReader 确保不溢出
            GeometryReader { geo in
                ZStack {
                    if let event = viewModel.activeEvent, event.hasPodcast {
                        programListView(podcasts: event.podcasts, width: geo.size.width)
                    } else {
                        speakerMeshView()
                    }
                }
                .frame(width: geo.size.width, height: geo.size.height)
            }
            .frame(width: 154, height: 94) // 略小于背景，形成内边距
            .clipShape(RoundedRectangle(cornerRadius: 12)) // 强制裁剪超出部分
        }
    }
    
    /// 扬声器网格（默认状态）
    private func speakerMeshView() -> some View {
        ZStack {
             // 网格纹理
             VStack(spacing: 3) {
                ForEach(0..<8, id: \.self) { _ in
                    HStack(spacing: 3) {
                        ForEach(0..<18, id: \.self) { _ in
                            Circle()
                                .fill(Color.black.opacity(0.6))
                                .frame(width: 4, height: 4)
                                .overlay(
                                    Circle()
                                        .stroke(Color(hex: "3E2723"), lineWidth: 0.5)
                                )
                        }
                    }
                }
            }
        }
    }
    
    /// 节目列表（有播客时）
    private func programListView(podcasts: [PodcastItem], width: CGFloat) -> some View {
        VStack(spacing: 0) {
            // 顶部状态栏 - 模拟 VFD显示屏或背光板
            HStack {
                Text("📻 PROGRAM SELECT")
                    .font(.system(size: 8, weight: .bold, design: .monospaced))
                    .foregroundColor(Color(hex: "FFB300"))
                    .shadow(color: Color(hex: "FFB300").opacity(0.5), radius: 2)
                
                Spacer()
                
                // 简单的信号强度指示
                HStack(spacing: 1) {
                    ForEach(0..<4) { i in
                        Rectangle()
                            .fill(Color(hex: "FF4444").opacity(i < 3 ? 0.8 : 0.2))
                            .frame(width: 2, height: 4 + CGFloat(i) * 2)
                    }
                }
            }
            .padding(.horizontal, 8)
            .padding(.vertical, 6)
            .background(Color.black.opacity(0.3))
            
            // 节目列表容器
            ScrollView(.vertical, showsIndicators: false) {
                VStack(alignment: .leading, spacing: 2) {
                    ForEach(Array(podcasts.enumerated()), id: \.element.id) { index, podcast in
                        Button(action: {
                            withAnimation(.easeInOut(duration: 0.2)) {
                                viewModel.selectPodcast(at: index)
                            }
                        }) {
                            HStack(spacing: 8) {
                                // 选中状态：发光点
                                Circle()
                                    .fill(viewModel.selectedPodcastIndex == index ?
                                          Color(hex: "FF4444") : Color(hex: "3E2723"))
                                    .frame(width: 6, height: 6)
                                    .shadow(color: viewModel.selectedPodcastIndex == index ?
                                            Color(hex: "FF4444") : .clear, radius: 4)
                                
                                // 标题
                                Text(podcast.bookTitle)
                                    .font(.system(size: 10, weight: viewModel.selectedPodcastIndex == index ? .semibold : .regular, design: .monospaced))
                                    .foregroundColor(viewModel.selectedPodcastIndex == index ?
                                                     Color(hex: "FFD700") : Color(hex: "BCAAA4"))
                                    .lineLimit(1)
                                
                                Spacer()
                            }
                            .padding(.vertical, 6)
                            .padding(.horizontal, 8)
                            .background(
                                RoundedRectangle(cornerRadius: 6)
                                    .fill(viewModel.selectedPodcastIndex == index ?
                                          Color(hex: "FFD700").opacity(0.15) : Color.transparent)
                            )
                        }
                        .buttonStyle(PlainButtonStyle())
                    }
                }
                .padding(.vertical, 4)
                .padding(.horizontal, 4)
            }
        }
        .background(Color(hex: "1F1410")) // 更深的内部背景
    }
}

extension Color {
    static let transparent = Color.white.opacity(0.0001)
}
