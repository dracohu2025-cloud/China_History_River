import Foundation

// 朝代数据模型
struct Dynasty: Identifiable, Codable {
    let id: String
    let name: String
    let chineseName: String
    let frequency: Double        // FM 频率
    let startYear: Int
    let endYear: Int
    let color: String
}

// 预定义朝代频率映射
let DYNASTY_FREQUENCIES: [Dynasty] = [
    Dynasty(id: "xia", name: "Xia", chineseName: "夏", frequency: 88.0, startYear: -2070, endYear: -1600, color: "#8B4513"),
    Dynasty(id: "shang", name: "Shang", chineseName: "商", frequency: 89.5, startYear: -1600, endYear: -1046, color: "#CD853F"),
    Dynasty(id: "zhou", name: "Zhou", chineseName: "周", frequency: 91.0, startYear: -1046, endYear: -256, color: "#DAA520"),
    Dynasty(id: "qin", name: "Qin", chineseName: "秦", frequency: 92.5, startYear: -221, endYear: -207, color: "#FF6347"),
    Dynasty(id: "han", name: "Han", chineseName: "汉", frequency: 94.0, startYear: -202, endYear: 220, color: "#DC143C"),
    Dynasty(id: "sanguo", name: "Three Kingdoms", chineseName: "三国", frequency: 95.5, startYear: 220, endYear: 280, color: "#FF4500"),
    Dynasty(id: "jin", name: "Jin", chineseName: "晋", frequency: 96.5, startYear: 266, endYear: 420, color: "#FF8C00"),
    Dynasty(id: "tang", name: "Tang", chineseName: "唐", frequency: 98.6, startYear: 618, endYear: 907, color: "#FFD700"),
    Dynasty(id: "song", name: "Song", chineseName: "宋", frequency: 100.5, startYear: 960, endYear: 1279, color: "#87CEEB"),
    Dynasty(id: "yuan", name: "Yuan", chineseName: "元", frequency: 102.5, startYear: 1271, endYear: 1368, color: "#9370DB"),
    Dynasty(id: "ming", name: "Ming", chineseName: "明", frequency: 104.5, startYear: 1368, endYear: 1644, color: "#DDA0DD"),
    Dynasty(id: "qing", name: "Qing", chineseName: "清", frequency: 106.5, startYear: 1644, endYear: 1912, color: "#FFB6C1"),
    Dynasty(id: "modern", name: "Modern", chineseName: "现代", frequency: 108.0, startYear: 1912, endYear: 2025, color: "#708090"),
]

// 频率 <-> 年份 转换
let MIN_FREQ: Double = 88.0
let MAX_FREQ: Double = 108.0
let MIN_YEAR: Int = -2070
let MAX_YEAR: Int = 2025
let YEAR_RANGE = MAX_YEAR - MIN_YEAR
let FREQ_RANGE = MAX_FREQ - MIN_FREQ

func yearToFrequency(_ year: Int) -> Double {
    let ratio = Double(year - MIN_YEAR) / Double(YEAR_RANGE)
    return MIN_FREQ + ratio * FREQ_RANGE
}

func frequencyToYear(_ frequency: Double) -> Int {
    let ratio = (frequency - MIN_FREQ) / FREQ_RANGE
    return MIN_YEAR + Int(Double(ratio) * Double(YEAR_RANGE))
}

func getCurrentDynasty(for frequency: Double) -> Dynasty {
    return DYNASTY_FREQUENCIES.first { dynasty in
        frequency >= dynasty.frequency - 1 && frequency < dynasty.frequency + 1
    } ?? DYNASTY_FREQUENCIES[7] // 默认唐朝
}

func formatYear(_ year: Int) -> String {
    if year < 0 {
        return "公元前\(abs(year))年"
    }
    return "公元\(year)年"
}
