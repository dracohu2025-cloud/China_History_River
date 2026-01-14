import SwiftUI

// FM 刻度盘视图
struct DialView: View {
    @ObservedObject var viewModel: RadioViewModel
    @State private var glowOpacity: Double = 0.5

    private let minFreq: Double = 88.0
    private let maxFreq: Double = 108.0

    private let minYear: Double = -2070.0
    private let maxYear: Double = 2025.0

    var body: some View {
        GeometryReader { geometry in
            let width = geometry.size.width.isFinite ? max(0, geometry.size.width) : 0
            let height = geometry.size.height.isFinite ? max(0, geometry.size.height) : 0
            let safeSize = CGSize(width: width, height: height)
            
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
                            .frame(height: height * 0.5)
                    )
                
                // 刻度盘主体
                dialFace(size: safeSize)
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
            .opacity(width > 0 && height > 0 ? 1 : 0) // 布局未准备好时隐藏
        }
        .onAppear {
            // 呼吸灯动画
            withAnimation(.easeInOut(duration: 2).repeatForever(autoreverses: true)) {
                glowOpacity = 1.0
            }
        }
    }

    func dialFace(size: CGSize) -> some View {
        // 计算内部可用尺寸 (padding 4 + 4 = 8)
        let innerWidth = max(0, size.width - 8)
        let innerHeight = max(0, size.height - 8)
        
        // Content width after horizontal padding of 10 on each side
        let contentWidth = max(0, innerWidth - 20)
        
        return ZStack(alignment: .topLeading) {
            // 暖光效果
            Rectangle()
                .fill(RadioColors.glow)
                .opacity(glowOpacity * 0.1)

            // 刻度尺层
            VStack(spacing: 4) {
                // 朝代刻度 (上层)
                dynastyScale(width: contentWidth)
                    .frame(height: 40)
                    .padding(.horizontal, 10)

                // 年份刻度线 (中层)
                freqScale(width: contentWidth)
                    .frame(height: 20)
                    .padding(.horizontal, 10)

                // 年份数字
                freqNumbers(width: contentWidth)
                    .frame(height: 20)
                    .padding(.horizontal, 10)
                
                // 历史事件标记点 (下层)
                eventDots(width: contentWidth)
                    .frame(height: 10)
                    .padding(.horizontal, 10)
                    .padding(.top, 4)

                Spacer()
            }
            .padding(.top, 16)
            
            // 历史事件详细气泡 (悬浮层)
            // 放在这里是为了覆盖刻度，但我想让指针覆盖它？
            // 不，气泡应该最上层以保证文字清晰
            eventPopups(width: contentWidth)
                .frame(height: innerHeight)
                .padding(.horizontal, 10)
                // .allowsHitTesting(false) // Removed to allow podcast button interaction
            
            // 指针层
            needle(width: contentWidth, height: innerHeight)
                .offset(y: 16)
                .padding(.horizontal, 10)
        }
    }

    /// 计算朝代标签的行分配（智能防重叠）
    private func calculateDynastyRowAssignments(for dynasties: [Dynasty], width: CGFloat) -> [(dynasty: Dynasty, xPos: CGFloat, isUpperRow: Bool)] {
        let minSpacing: CGFloat = 45
        var lastXInRow: [CGFloat] = [-1000, -1000]  // [上排, 下排]
        
        return dynasties.map { dynasty in
            let percent = viewModel.getPercent(forYear: dynasty.startYear)
            let xPos = percent * width
            let safeX = xPos.isFinite ? xPos : 0
            
            // 检查哪一行可以放置
            let canPlaceUpper = (safeX - lastXInRow[0]) >= minSpacing
            let canPlaceLower = (safeX - lastXInRow[1]) >= minSpacing
            
            let isUpper: Bool
            if canPlaceUpper && !canPlaceLower {
                isUpper = true
            } else if canPlaceLower && !canPlaceUpper {
                isUpper = false
            } else {
                // 两行都可以放（或都放不下），选择距离更远的那行
                isUpper = (safeX - lastXInRow[0]) >= (safeX - lastXInRow[1])
            }
            
            lastXInRow[isUpper ? 0 : 1] = safeX
            return (dynasty, safeX, isUpper)
        }
    }
    
    func dynastyScale(width: CGFloat) -> some View {
        let filteredDynasties = viewModel.dynasties.filter { 
            $0.id != "modern" && $0.id != "prc" && $0.id != "roc"
        }
        
        let layoutData = calculateDynastyRowAssignments(for: filteredDynasties, width: width)
        
        return ZStack {
            ForEach(layoutData, id: \.dynasty.id) { item in
                let dynasty = item.dynasty
                let safeX = item.xPos
                let isUpperRow = item.isUpperRow
                let yPosition: CGFloat = isUpperRow ? 12 : 32
                
                let isHighlighted = viewModel.currentYear >= dynasty.startYear && viewModel.currentYear <= dynasty.endYear

                VStack(spacing: 1) {
                    if isUpperRow {
                        Text(dynasty.chineseName)
                            .font(.system(size: isHighlighted ? 12 : 9))
                            .fontWeight(isHighlighted ? .black : .medium)
                            .foregroundColor(isHighlighted ? RadioColors.needle : RadioColors.dialText)
                            .shadow(color: isHighlighted ? RadioColors.glow : .clear, radius: 2)
                            .scaleEffect(isHighlighted ? 1.15 : 1.0)
                            .animation(.spring(response: 0.3), value: isHighlighted)
                        
                        Rectangle()
                            .fill(Color(hex: dynasty.color))
                            .frame(width: 2, height: 8)
                            .cornerRadius(1)
                    } else {
                        Rectangle()
                            .fill(Color(hex: dynasty.color))
                            .frame(width: 2, height: 8)
                            .cornerRadius(1)
                        
                        Text(dynasty.chineseName)
                            .font(.system(size: isHighlighted ? 12 : 9))
                            .fontWeight(isHighlighted ? .black : .medium)
                            .foregroundColor(isHighlighted ? RadioColors.needle : RadioColors.dialText)
                            .shadow(color: isHighlighted ? RadioColors.glow : .clear, radius: 2)
                            .scaleEffect(isHighlighted ? 1.15 : 1.0)
                            .animation(.spring(response: 0.3), value: isHighlighted)
                    }
                }
                .position(x: safeX, y: yPosition)
                .contentShape(Rectangle())
                .onTapGesture {
                    withAnimation(.spring(response: 0.3, dampingFraction: 0.6)) {
                        viewModel.jumpToDynasty(dynasty)
                    }
                }
            }
        }
    }
    
    // ... freqScale and freqNumbers unchanged ...

    func freqScale(width: CGFloat) -> some View {
        ZStack {
            // 生成刻度：BC 2000 到 AD 2000
            // 由于是非线性的，我们还是按固定步长生成，但位置会挤压/拉伸
            ForEach(Array(stride(from: -2000, through: 2000, by: 100)), id: \.self) { year in
                let percent = viewModel.getPercent(forYear: year)
                let xPos = percent * width
                
                // 0年特殊处理 (虽然历史上没有0年，但作为轴线分界)
                let isZero = year == 0
                let isMajor = (year % 500 == 0) // 每500年一个大刻度
                let isMiddle = (year % 100 == 0) // 每100年

                if xPos.isFinite {
                    Rectangle()
                        .fill(isZero ? RadioColors.needle.opacity(0.8) : RadioColors.dialText)
                        .frame(width: isMajor ? 2 : 1, height: CGFloat(isMajor ? 14 : (isMiddle ? 10 : 6)))
                        .position(x: xPos, y: 10)
                }
            }
        }
    }

    func freqNumbers(width: CGFloat) -> some View {
        ZStack {
            // 主要年份数字显示
            ForEach([-2000, -1000, 0, 1000, 2000], id: \.self) { year in
                let percent = viewModel.getPercent(forYear: year)
                let xPos = percent * width
                
                Text("\(year)")
                    .font(.system(size: 10, design: .monospaced))
                    .fontWeight(.bold)
                    .foregroundColor(RadioColors.dialText)
                    .position(x: xPos.isFinite ? xPos : 0, y: 10)
            }
        }
    }

    func eventDots(width: CGFloat) -> some View {
        ZStack {
            ForEach(viewModel.historicalEvents) { event in
                let percent = viewModel.getPercent(forYear: event.year)
                let xPos = percent * width
                
                if xPos.isFinite {
                    let dist = abs(viewModel.currentYear - event.year)
                    let isClose = dist < 20
                    
                    Circle()
                        .fill(isClose ? RadioColors.needle : RadioColors.dialText.opacity(0.5))
                        .frame(width: isClose ? 8 : 4, height: isClose ? 8 : 4)
                        .position(x: xPos, y: 5)
                }
            }
        }
    }
    
    func eventPopups(width: CGFloat) -> some View {
        ZStack {
            ForEach(viewModel.historicalEvents) { event in
                let percent = viewModel.getPercent(forYear: event.year)
                let xPos = percent * width
                let dist = abs(viewModel.currentYear - event.year)
                let isClose = dist < 20 // 激活范围
                
                if xPos.isFinite && isClose {
                    VStack(alignment: .leading, spacing: 6) {
                        // 标题行
                        Text("\(event.year < 0 ? "前" : "公元") \(abs(event.year))年 \(event.title)")
                            .font(.system(size: 14, weight: .bold, design: .serif))
                            .foregroundColor(Color(hex: "3E2723"))
                        
                        // 描述
                        Text(event.description)
                            .font(.system(size: 11, design: .serif))
                            .foregroundColor(Color(hex: "3E2723").opacity(0.85))
                            .fixedSize(horizontal: false, vertical: true)
                            .lineLimit(2)
                        
                        // 多播客提示（如果有多个播客，提示用户看左下角）

                    }
                    .padding(12)
                    .frame(maxWidth: 340)
                    .background(
                        RoundedRectangle(cornerRadius: 8)
                            .fill(Color(hex: "F3E5AB"))
                    )
                    .overlay(
                        RoundedRectangle(cornerRadius: 8)
                            .stroke(Color(hex: "3E2723"), lineWidth: 2)
                    )
                    .shadow(color: Color.black.opacity(0.3), radius: 6, x: 0, y: 4)
                    .position(x: xPos, y: 160)
                    .transition(.scale.combined(with: .opacity))
                    .zIndex(100)
                }
            }
        }
    }

    func needle(width: CGFloat, height: CGFloat) -> some View {
        // 使用 getPercent 获取当前年份的归一化位置
        let percent = viewModel.getPercent(forYear: viewModel.currentYear)
        let xPos = percent * width
        let safeX = xPos.isFinite ? xPos : 0
        
        // Needle Length Configuration
        let needleHeight = height * 0.35 // Shortened further to 35% as requested
        
        return ZStack {
            // 红色垂直指示线
            Rectangle()
                .fill(RadioColors.needle)
                .frame(width: 2, height: needleHeight)
                .shadow(color: RadioColors.needle.opacity(0.5), radius: 2)
        }
        .frame(width: 10)
        .position(x: safeX, y: height * 0.45) // Slightly lower center to match layout
    }

    var freqDisplay: some View {
        Text(viewModel.currentYearString)
            .font(.system(size: 16, design: .serif))
            .fontWeight(.black) // Heavy weight
            .foregroundColor(Color(red: 1.0, green: 0.8, blue: 0.2)) // Golden Yellow
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(
                RoundedRectangle(cornerRadius: 6)
                    .fill(Color.black)
                    .overlay(
                        RoundedRectangle(cornerRadius: 6)
                            .stroke(Color(red: 1.0, green: 0.8, blue: 0.2), lineWidth: 2)
                    )
            )
            .shadow(color: Color(red: 1.0, green: 0.8, blue: 0.2).opacity(0.3), radius: 5)
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
            (a, r, g, b) = (255, (int >> 16) & 0xFF, (int >> 8) & 0xFF, int & 0xFF)
        case 8: // ARGB
            (a, r, g, b) = ((int >> 24) & 0xFF, (int >> 16) & 0xFF, (int >> 8) & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (255, 0, 0, 0) // Default to black opacity 1 if failed
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
