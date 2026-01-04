import SwiftUI

struct ContentView: View {
    @StateObject private var viewModel = RadioViewModel()

    var body: some View {
        RadioBodyView {
            HStack(spacing: 12) {
                // 左侧扬声器
                speakerSection

                // 中间刻度盘区域
                dialSection

                // 右侧控制区
                controlSection
            }
            .padding(12)
        }
        .frame(maxWidth: 950, maxHeight: 420)
        .background(Color.black)
    }

    var speakerSection: some View {
        VStack(spacing: 10) {
            SpeakerGrillView()

            Text("听见历史")
                .font(.system(size: 14))
                .fontWeight(.bold)
                .foregroundColor(RadioColors.brass)
                .tracking(2)

            Text("HISTORY FM")
                .font(.system(size: 9))
                .foregroundColor(RadioColors.brass.opacity(0.7))
                .tracking(3)
        }
        .frame(width: 130)
    }

    var dialSection: some View {
        VStack(spacing: 6) {
            // 刻度盘
            DialView(viewModel: viewModel)

            // 当前朝代信息 + 内嵌按钮
            infoBar
        }
        .frame(maxWidth: .infinity)
        .padding(.horizontal, 8)
    }

    var infoBar: some View {
        HStack(spacing: 8) {
            // 朝代徽章
            Text(viewModel.currentDynasty.chineseName)
                .font(.system(size: 12))
                .fontWeight(.bold)
                .foregroundColor(.white)
                .padding(.horizontal, 10)
                .padding(.vertical, 3)
                .background(
                    RoundedRectangle(cornerRadius: 4)
                        .fill(Color(hex: viewModel.currentDynasty.color))
                )

            // 年份范围
            Text("\(viewModel.currentDynasty.startYear < 0 ? "公元前\(abs(viewModel.currentDynasty.startYear))" : "\(viewModel.currentDynasty.startYear)") - \(viewModel.currentDynasty.endYear < 0 ? "公元前\(abs(viewModel.currentDynasty.endYear))" : "\(viewModel.currentDynasty.endYear)")年")
                .font(.system(size: 11))
                .foregroundColor(RadioColors.brass)

            // 当前年份
            Text(formatYear(viewModel.currentYear))
                .font(.system(size: 11))
                .foregroundColor(RadioColors.glow)

            Spacer()

            // 内嵌按钮
            HStack(spacing: 6) {
                NavigationLink(destination: Text("已下载")) {
                    Text("已下载")
                        .font(.system(size: 10))
                        .foregroundColor(RadioColors.brass)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 4)
                        .background(
                            RoundedRectangle(cornerRadius: 4)
                                .fill(RadioColors.bodyDark)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 4)
                                        .stroke(RadioColors.brass, lineWidth: 1)
                                )
                        )
                }

                NavigationLink(destination: Text("设置")) {
                    Text("设置")
                        .font(.system(size: 10))
                        .foregroundColor(RadioColors.brass)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 4)
                        .background(
                            RoundedRectangle(cornerRadius: 4)
                                .fill(RadioColors.bodyDark)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 4)
                                        .stroke(RadioColors.brass, lineWidth: 1)
                                )
                        )
                }
            }
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 6)
    }

    var controlSection: some View {
        VStack(spacing: 12) {
            // 电源指示灯
            PowerLEDView(viewModel: viewModel)

            // 大号调谐旋钮
            TuningKnobView(viewModel: viewModel)

            // 收听按钮
            listenButton
        }
        .frame(width: 160)
        .padding(.vertical, 5)
    }

    var listenButton: some View {
        Button(action: {
            // TODO: 进入时间线/播放器
        }) {
            Text("收听")
                .font(.system(size: 16))
                .fontWeight(.bold)
                .foregroundColor(.white)
                .tracking(3)
                .padding(.horizontal, 30)
                .padding(.vertical, 12)
                .background(
                    LinearGradient(
                        colors: [
                            Color(red: 0.86, green: 0.08, blue: 0.24),
                            Color(red: 0.69, green: 0.06, blue: 0.19),
                            Color(red: 0.55, green: 0.0, blue: 0.0)
                        ],
                        startPoint: .top,
                        endPoint: .bottom
                    )
                )
                .cornerRadius(8)
                .shadow(color: .black.opacity(0.5), radius: 4, x: 2, y: 4)
        }
    }
}

#Preview {
    ContentView()
        .previewInterfaceOrientation(.landscapeLeft)
}
