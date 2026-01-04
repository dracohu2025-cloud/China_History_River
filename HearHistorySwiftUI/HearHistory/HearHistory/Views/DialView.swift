import SwiftUI

// FM 刻度盘视图
struct DialView: View {
    @ObservedObject var viewModel: RadioViewModel
    @State private var glowOpacity: Double = 0.5

    private let minFreq: Double = 88.0
    private let maxFreq: Double = 108.0

    var body: some View {
        GeometryReader { geometry in
            ZStack {
                // 玻璃罩背景
                RoundedRectangle(cornerRadius: 10)
                    .fill(Color.black.opacity(0.3))
                    .overlay(
                        RoundedRectangle(cornerRadius: 10)
                            .stroke(RadioColors.brass, lineWidth: 3)
                    )

                // 玻璃反光效果
                RoundedRectangle(cornerRadius: 10)
                    .fill(
                        LinearGradient(
                            colors: [
                                Color.white.opacity(0.3),
                                Color.white.opacity(0.1),
                                Color.white.opacity(0.2)
                            ],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .mask(
                        Rectangle()
                            .frame(height: geometry.size.height * 0.5)
                    )

                // 刻度盘主体
                dialFace
                    .padding(4)
                    .background(
                        RoundedRectangle(cornerRadius: 6)
                            .fill(RadioColors.dial)
                    )
                    .padding(4)

                // 当前频率显示
                VStack {
                    Spacer()
                    HStack {
                        Spacer()
                        freqDisplay
                    }
                    .padding(.bottom, 6)
                    .padding(.trailing, 8)
                }
            }
        }
        .onAppear {
            // 呼吸灯动画
            withAnimation(.easeInOut(duration: 2).repeatForever(autoreverses: true)) {
                glowOpacity = 1.0
            }
        }
    }

    var dialFace: some View {
        GeometryReader { geometry in
            ZStack {
                // 暖光效果
                Rectangle()
                    .fill(RadioColors.glow)
                    .opacity(glowOpacity * 0.1)

                VStack(spacing: 4) {
                    // 年份刻度
                    yearScale

                    // 朝代刻度
                    dynastyScale

                    // 频率刻度线
                    freqScale

                    // 频率数字
                    freqNumbers

                    Spacer()

                    // 指针
                    needle
                        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
                        .padding(.leading, 10)
                }
                .padding(.top, 6)
            }
        }
    }

    var yearScale: some View {
        HStack {
            Text("-2070").font(.system(size: 8)).foregroundColor(RadioColors.dialText.opacity(0.6))
            Text("-1000").font(.system(size: 8)).foregroundColor(RadioColors.dialText.opacity(0.6))
            Text("0").font(.system(size: 8)).foregroundColor(RadioColors.dialText.opacity(0.6))
            Text("500").font(.system(size: 8)).foregroundColor(RadioColors.dialText.opacity(0.6))
            Text("1000").font(.system(size: 8)).foregroundColor(RadioColors.dialText.opacity(0.6))
            Text("1500").font(.system(size: 8)).foregroundColor(RadioColors.dialText.opacity(0.6))
            Text("2025").font(.system(size: 8)).foregroundColor(RadioColors.dialText.opacity(0.6))
            Spacer()
        }
        .padding(.horizontal, 10)
    }

    var dynastyScale: some View {
        GeometryReader { geometry in
            ZStack {
                ForEach(DYNASTY_FREQUENCIES.filter { $0.id != "modern" }) { dynasty in
                    let xPos = ((dynasty.frequency - minFreq) / (maxFreq - minFreq)) * geometry.size.width
                    let isActive = abs(viewModel.currentFrequency - dynasty.frequency) < 1

                    VStack(spacing: 1) {
                        Rectangle()
                            .fill(Color(hex: dynasty.color))
                            .frame(width: 3, height: 10)
                            .cornerRadius(1)

                        Text(dynasty.chineseName)
                            .font(.system(size: isActive ? 12 : 10))
                            .fontWeight(isActive ? .bold : .medium)
                            .foregroundColor(isActive ? RadioColors.needle : RadioColors.dialText)
                    }
                    .position(x: xPos, y: geometry.size.height / 2)
                    .contentShape(Rectangle())
                    .onTapGesture {
                        withAnimation(.spring(response: 0.3, dampingFraction: 0.6)) {
                            viewModel.jumpToDynasty(dynasty)
                        }
                    }
                }
            }
            .frame(height: 36)
            .padding(.horizontal, 10)
        }
        .frame(height: 40)
    }

    var freqScale: some View {
        GeometryReader { geometry in
            ZStack {
                ForEach(0..<21) { i in
                    let freq = minFreq + Double(i)
                    let xPos = (Double(i) / 20.0) * geometry.size.width
                    let isMajor = Int(freq) % 2 == 0

                    Rectangle()
                        .fill(RadioColors.dialText)
                        .frame(width: isMajor ? 2 : 1, height: CGFloat(isMajor ? 14 : 7))
                        .position(x: xPos, y: geometry.size.height / 2)
                }
            }
            .frame(height: 18)
        }
        .frame(height: 20)
        .padding(.horizontal, 10)
    }

    var freqNumbers: some View {
        HStack {
            ForEach([88, 92, 96, 100, 104, 108], id: \.self) { freq in
                Text("\(freq)")
                    .font(.system(size: 11))
                    .fontWeight(.bold)
                    .foregroundColor(RadioColors.dialText)
                Spacer()
            }
        }
        .padding(.horizontal, 6)
    }

    var needle: some View {
        GeometryReader { geometry in
            let dialWidth = geometry.size.width * 0.45
            let normalizedFreq = (viewModel.currentFrequency - minFreq) / (maxFreq - minFreq)
            let xPos = normalizedFreq * dialWidth

            ZStack {
                Rectangle()
                    .fill(RadioColors.needle)
                    .frame(width: 2, height: .infinity)
                    .shadow(color: RadioColors.needle, radius: 4)

                // 指针三角形
                Path { path in
                    path.move(to: CGPoint(x: -5, y: 0))
                    path.addLine(to: CGPoint(x: 5, y: 0))
                    path.addLine(to: CGPoint(x: 0, y: 8))
                    path.closeSubpath()
                }
                .fill(RadioColors.needle)
                .offset(y: -8)
            }
            .frame(width: 4)
            .offset(x: 10 + xPos)
        }
        .padding(.top, 20)
        .padding(.bottom, 8)
    }

    var freqDisplay: some View {
        Text("FM \(String(format: "%.1f", viewModel.currentFrequency))")
            .font(.system(size: 12, family: .monospaced))
            .fontWeight(.bold)
            .foregroundColor(RadioColors.glow)
            .padding(.horizontal, 10)
            .padding(.vertical, 3)
            .background(
                RoundedRectangle(cornerRadius: 4)
                    .fill(Color(red: 0.1, green: 0.1, blue: 0.1))
                    .overlay(
                        RoundedRectangle(cornerRadius: 4)
                            .stroke(RadioColors.brass, lineWidth: 1)
                    )
            )
    }
}

// Color 扩展
extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 6: // RGB
            (a, r, g, b) = (255, int >> 16, int >> 8, int)
        case 8: // ARGB
            (a, r, g, b) = (int >> 24, int >> 16, int >> 8, int)
        default:
            (a, r, g, b) = (1, 1, 1, 0)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue:  Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}
