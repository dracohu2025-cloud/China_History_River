import SwiftUI
import Combine

// 收音机状态管理
class RadioViewModel: ObservableObject {
    @Published var currentFrequency: Double = 98.6  // 默认唐朝
    @Published var knobRotation: Double = 0
    @Published var isPlaying: Bool = false

    private let minFreq: Double = 88.0
    private let maxFreq: Double = 108.0
    private let maxRotation: Double = 720  // 两圈 (360 * 2)

    var currentDynasty: Dynasty {
        getCurrentDynasty(for: currentFrequency)
    }

    var currentYear: Int {
        frequencyToYear(currentFrequency)
    }

    // 更新频率（从旋钮旋转角度）
    func updateFrequency(from rotation: Double) {
        knobRotation = rotation
        let clampedRotation = max(-maxRotation, min(maxRotation, rotation))
        let rotationRatio = (clampedRotation + maxRotation) / (maxRotation * 2)
        let newFreq = minFreq + rotationRatio * (maxFreq - minFreq)
        currentFrequency = (newFreq * 10).rounded() / 10  // 保留一位小数
    }

    // 从垂直滑动手势更新频率
    func adjustFrequency(by verticalDelta: CGFloat) {
        let sensitivity: Double = 0.5
        let deltaRotation = -Double(verticalDelta) * sensitivity
        let newRotation = knobRotation + deltaRotation
        updateFrequency(from: newRotation)
    }

    // 跳转到指定朝代
    func jumpToDynasty(_ dynasty: Dynasty) {
        let normalizedFreq = (dynasty.frequency - minFreq) / (maxFreq - minFreq)
        let newRotation = (normalizedFreq - 0.5) * 360 * 4
        updateFrequency(from: newRotation)
    }
}
