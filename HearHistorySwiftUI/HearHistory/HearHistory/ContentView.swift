import SwiftUI

struct ContentView: View {
    // 初始化 ViewModel
    @StateObject private var viewModel = RadioViewModel()
    
    var body: some View {
        ZStack {
            // 背景暗房环境
            Color.black.edgesIgnoringSafeArea(.all)
            
            // 径向渐变背景 (模拟桌面光照)
            RadialGradient(
                colors: [Color(red: 0.2, green: 0.15, blue: 0.1), Color.black],
                center: .center,
                startRadius: 100,
                endRadius: 600
            )
            .edgesIgnoringSafeArea(.all)
            .opacity(0.6)
            
            // 收音机主体
            RadioBodyView {
                VStack(spacing: 0) {
                    
                    // 上半部分：刻度盘
                    DialView(viewModel: viewModel)
                        .frame(height: 200)
                        .padding(.top, 20)
                        .padding(.horizontal, 25)
                    
                    Spacer()
                    
                    // 下半部分：控制区
                    HStack(alignment: .bottom, spacing: 30) {
                        
                        // 左侧：节目显示面板 / 扬声器
                        SpeakerGrillView(viewModel: viewModel)
                            .padding(.leading, 30)
                            .padding(.bottom, 20)
                        
                        Spacer()
                        
                        // 中间：状态灯和装饰
                        VStack(spacing: 20) {
                            PowerLEDView(viewModel: viewModel)
                            
                            // 灵犀信号灯 (Magic Signal Button)
                            Button(action: {
                                if viewModel.isSignalDetected {
                                    viewModel.togglePodcast()
                                }
                            }) {
                                VStack(spacing: 4) {
                                     // 信号指示灯与文字
                                     HStack(spacing: 6) {
                                         // 状态逻辑：
                                         // 播放中 -> 红色呼吸灯 (ON AIR)
                                         // 有信号 -> 绿色常亮灯 (READY)
                                         // 无信号 -> 熄灭
                                         let isPlaying = viewModel.isPlaying
                                         let hasSignal = viewModel.isSignalDetected
                                         
                                         Circle()
                                            .fill(isPlaying ? Color.red : (hasSignal ? Color.green : Color(white: 0.2)))
                                            .frame(width: 6, height: 6)
                                            .shadow(color: isPlaying ? Color.red : (hasSignal ? Color.green : .clear), radius: isPlaying ? 8 : 5)
                                         
                                         // 文本逻辑
                                         Text(isPlaying ? "ON AIR" : (hasSignal ? "BROADCAST FOUND" : "FM HISTORY"))
                                            .font(.system(size: 10, weight: .black, design: .serif))
                                            .foregroundColor(isPlaying ? Color.red : (hasSignal ? Color.green : RadioColors.brass))
                                            .shadow(color: isPlaying ? Color.red.opacity(0.8) : (hasSignal ? Color.green.opacity(0.6) : .clear), radius: 3)
                                     }
                                     
                                     if viewModel.isPlaying {
                                         Text("PLAYING: \(viewModel.activePodcastEvent?.title ?? "Unknown")")
                                            .font(.system(size: 8, weight: .bold))
                                            .foregroundColor(Color.red.opacity(0.8))
                                            .lineLimit(1)
                                            .frame(maxWidth: 100)
                                     } else if viewModel.isSignalDetected {
                                         Text("TAP TO LISTEN")
                                            .font(.system(size: 8, weight: .bold))
                                            .foregroundColor(Color.green.opacity(0.8))
                                     } else {
                                         Text("STEREO SOUND")
                                            .font(.system(size: 8, weight: .medium))
                                            .foregroundColor(RadioColors.brass.opacity(0.6))
                                     }
                                }
                                .padding(.horizontal, 16)
                                .padding(.vertical, 8)
                                .background(
                                    ZStack {
                                        RoundedRectangle(cornerRadius: 6)
                                            .fill(Color.black.opacity(0.8))
                                        
                                        // 边框发光
                                        RoundedRectangle(cornerRadius: 6)
                                            .stroke(
                                                viewModel.isPlaying ? Color.red.opacity(0.6) : (viewModel.isSignalDetected ? Color.green.opacity(0.6) : RadioColors.brass.opacity(0.3)),
                                                lineWidth: 1
                                            )
                                    }
                                )
                                .shadow(
                                    color: viewModel.isPlaying ? Color.red.opacity(0.4) : (viewModel.isSignalDetected ? Color.green.opacity(0.3) : .clear),
                                    radius: 12
                                )
                                .scaleEffect(viewModel.isSignalDetected ? 1.05 : 1.0) // 呼吸/放大提示
                                .animation(.spring(response: 0.4, dampingFraction: 0.6), value: viewModel.isSignalDetected)
                                .animation(.spring(), value: viewModel.isPlaying) // Fix: No loop, just smooth transition
                            }
                            .buttonStyle(PlainButtonStyle())
                            .disabled(!viewModel.isSignalDetected)
                        }
                        .padding(.bottom, 30)
                        
                        Spacer()
                        
                        // 右侧：调谐旋钮
                        TuningKnobView(viewModel: viewModel)
                            .padding(.trailing, 40)
                            .padding(.bottom, 20)
                    }
                    .frame(height: 180)
                }
            }
            .edgesIgnoringSafeArea(.all) // Fullscreen immersion
            
            // 前景：暗角滤镜 (Vignette)
            // 增强沉浸感，让四周变暗
            RadialGradient(
                colors: [Color.clear, Color.black.opacity(0.6)],
                center: .center,
                startRadius: 300,
                endRadius: 800
            )
            .edgesIgnoringSafeArea(.all)
            .allowsHitTesting(false) // 确保不阻挡交互
            
            // 玻璃反光 (全局)
            // 模拟整个屏幕是玻璃表面
            LinearGradient(
                colors: [Color.white.opacity(0.00), Color.white.opacity(0.03)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .edgesIgnoringSafeArea(.all)
            .allowsHitTesting(false)
        }
        .statusBar(hidden: true) // 隐藏状态栏以获得更沉浸的体验
    }
}

#Preview {
    ContentView()
}
// Note: Traits for landscape are supported in #Preview but syntax varies.
// For simplicity, we remove the modifiers that cause warnings in the macro.
