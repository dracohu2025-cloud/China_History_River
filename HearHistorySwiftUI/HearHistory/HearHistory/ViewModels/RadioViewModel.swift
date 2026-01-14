
import SwiftUI
import Combine
import UIKit

/// 单个播客项
struct PodcastItem: Identifiable {
    let id = UUID()
    let uuid: String           // Supabase podcasts table ID
    let bookTitle: String      // 《书名》
}

/// 历史事件模型
struct HistoricalEvent: Identifiable {
    let id = UUID()
    let year: Int
    let title: String
    var description: String
    var podcasts: [PodcastItem] = []  // 该事件关联的所有播客
    
    /// 是否有播客可收听
    var hasPodcast: Bool {
        !podcasts.isEmpty
    }
}

// 收音机状态管理
class RadioViewModel: ObservableObject {
    @Published var currentFrequency: Double = 98.6  // 默认唐朝
    @Published var knobRotation: Double = 0
    @Published var isPlaying: Bool = false
    
    private let minFreq: Double = 88.0
    private let maxFreq: Double = 108.0
    private let maxRotation: Double = 720
    
    // 物理引擎变量
    // 已移除惯性系统，采用 "Heavy Damping" (高阻尼) 模式
    private let selectionHaptic = UISelectionFeedbackGenerator() // 用于刻度感
    private let limitHaptic = UINotificationFeedbackGenerator()  // 用于边界撞击感
    private let heavyHaptic = UIImpactFeedbackGenerator(style: .heavy) // 用于吸附感
    
    // 磁吸效果
    private let resistanceRange: Double = 0.3 // 进入磁吸范围的距离
    
    // 非线性时间轴配置 (Asymmetric Scale)
    // 0点偏左设计：95.0MHz 对应 公元0年
    // 88.0 - 95.0 MHz (7 MHz) -> BC 2070 - 0 (2070 Years)
    // 95.0 - 108.0 MHz (13 MHz) -> AD 0 - 2025 (2025 Years)
    private let splitFreq: Double = 95.0
    private let minYear: Int = -2070
    private let maxYear: Int = 2025

    // Base Data (Major Historical Framework)
    private let baseEvents: [HistoricalEvent] = [
        HistoricalEvent(year: -2070, title: "夏朝建立", description: "禹传子，家天下，中国第一个世袭制朝代"),
        HistoricalEvent(year: -1600, title: "商汤灭夏", description: "鸣条之战，夏桀兵败"),
        HistoricalEvent(year: -1046, title: "武王伐纣", description: "牧野之战，周朝建立"),
        HistoricalEvent(year: -770, title: "平王东迁", description: "东周开始，春秋战国序幕"),
        HistoricalEvent(year: -221, title: "秦灭六国", description: "秦始皇统一中国，建立首个中央集权帝国"),
        HistoricalEvent(year: -202, title: "汉朝建立", description: "刘邦由于垓下之战胜利，建立西汉"),
        HistoricalEvent(year: 9, title: "王莽篡汉", description: "建立新朝"),
        HistoricalEvent(year: 25, title: "光武中兴", description: "刘秀建立东汉"),
        HistoricalEvent(year: 220, title: "三国鼎立", description: "曹丕篡汉，魏蜀吴并立"),
        HistoricalEvent(year: 581, title: "隋朝建立", description: "杨坚建立隋朝，结束南北朝分裂"),
        HistoricalEvent(year: 618, title: "唐朝建立", description: "李渊称帝，建立大唐"),
        HistoricalEvent(year: 690, title: "武周革命", description: "武则天称帝，中国唯一女皇帝"),
        HistoricalEvent(year: 960, title: "赵匡胤陈桥兵变", description: "建立宋朝"),
        HistoricalEvent(year: 1279, title: "崖山海战", description: "南宋灭亡，元朝统一中国"),
        HistoricalEvent(year: 1368, title: "明朝建立", description: "朱元璋称帝，驱除鞑虏"),
        HistoricalEvent(year: 1644, title: "清兵入关", description: "明朝灭亡，清朝建立"),
        HistoricalEvent(year: 1840, title: "鸦片战争", description: "中国近代史开端"),
        HistoricalEvent(year: 1911, title: "辛亥革命", description: "推翻帝制，建立民国"),
        HistoricalEvent(year: 1949, title: "新中国成立", description: "中华人民共和国成立")
    ]
    
    // Data Source
    @Published var historicalEvents: [HistoricalEvent] = []
    @Published var dynasties: [Dynasty] = DYNASTY_FREQUENCIES  // Start with local fallback
    
    // ...
    
    @MainActor
    func loadEvents() async {
        do {
            // 1. 先加载基础骨架
            var mergedEvents = baseEvents
            
            // 2. 尝试获取播客数据
            let podcastEvents = try await SupabaseManager.shared.fetchAllEvents()
            
            // 3. 合并逻辑：如果年份相同，保留基础描述，追加播客数组
            for pEvent in podcastEvents {
                if let index = mergedEvents.firstIndex(where: { $0.year == pEvent.year }) {
                    // 找到现有历史事件，合并播客数组
                    var existing = mergedEvents[index]
                    existing.podcasts = pEvent.podcasts
                    // 不再将播客标题追加到描述中，因为左侧面板已显示
                    mergedEvents[index] = existing
                } else {
                    // 全新事件（基础库中没有的）
                    mergedEvents.append(pEvent)
                }
            }
            
            // 4. 排序并更新
            self.historicalEvents = mergedEvents.sorted { $0.year < $1.year }
            
            // 5. 加载朝代数据
            let remoteDynasties = try await SupabaseManager.shared.fetchDynasties()
            if !remoteDynasties.isEmpty {
                self.dynasties = remoteDynasties
            }
            
            UINotificationFeedbackGenerator().notificationOccurred(.success)
        } catch {
            print("Failed to load events: \(error)")
            // 即使网络失败，也要保证有基础数据显示
            if self.historicalEvents.isEmpty {
                self.historicalEvents = baseEvents
            }
        }
    }
    
    var currentDynasty: Dynasty {
        getCurrentDynasty(for: currentFrequency)
    }
    
    var currentYear: Int {
        frequencyToYear(currentFrequency)
    }
    
    var currentYearString: String {
        let year = frequencyToYear(currentFrequency)
        if year < 0 {
            return "BC \(abs(year))"
        } else {
            return "AD \(year)"
        }
    }
    
    // 当前调谐到的事件（用于 UI 交互）
    var activeEvent: HistoricalEvent? {
        // 判定距离：20年内算"调中"
        historicalEvents.first { abs(currentYear - $0.year) < 20 }
    }
    
    // 是否检测到播客信号
    var isSignalDetected: Bool {
        activeEvent?.hasPodcast ?? false
    }
    
    // 当前正在播放的事件
    @Published var activePodcastEvent: HistoricalEvent?
    
    // 多播客选择：当前选中的播客索引
    @Published var selectedPodcastIndex: Int = 0
    
    /// 选择播客（预设按钮点击）
    func selectPodcast(at index: Int) {
        guard let event = activeEvent, index < event.podcasts.count else { return }
        selectedPodcastIndex = index
        selectionHaptic.selectionChanged()
    }
    
    /// 获取当前选中的播客
    var selectedPodcast: PodcastItem? {
        guard let event = activeEvent, selectedPodcastIndex < event.podcasts.count else { return nil }
        return event.podcasts[selectedPodcastIndex]
    }
    
    func togglePodcast() {
        if isPlaying {
            // Pause playback
            AudioManager.shared.stop()
            isPlaying = false
            // Keep activePodcastEvent to allow identifying what was playing
            limitHaptic.notificationOccurred(.success)
        } else {
            // Resume or Start playback
            // If we have a selected podcast in the current active event, play it
            if let event = activeEvent, let podcast = selectedPodcast {
                activePodcastEvent = event
                isPlaying = true
                AudioManager.shared.play(podcastUUID: podcast.uuid, title: podcast.bookTitle)
                limitHaptic.notificationOccurred(.success)
            } 
            // If no active event but we have a paused podcast event, try to resume it
            else if let event = activePodcastEvent {
                isPlaying = true
                // Attempt to resume the last played podcast for this event
                // (This handles the case where user tuned away but wants to resume)
                // ideally we should track which specific podcast was playing for this event too,
                // but for now, rely on AudioManager's internal state or user re-selection.
                // Re-triggering play with the same UUID is safe due to AudioManager's checks.
                
                // Note: Logic here is simplified. Getting the exact podcast UUID to resume
                // if the dial moved is tricky without more state. 
                // For now, primarily support toggle when dial is still on target.
            }
        }
    }
    init() {
        selectionHaptic.prepare()
        limitHaptic.prepare()
        heavyHaptic.prepare()
        
        // 根据初始频率 98.6 反推初始角度
        // 公式：freq = 98.0 + (rot / 360.0)
        // => rot = (freq - 98.0) * 360.0
        let baseFreq = 98.0
        let initialOffset = 98.6 - baseFreq
        knobRotation = initialOffset * 360.0
        
        Task {
            await loadEvents()
        }
    }

    // 更新频率（基于旋转增量）
    func updateFrequency(from rotation: Double) {
        let oldFreq = currentFrequency
        
        // 电子机械专家模式：高阻尼传动比
        // 360度 = 1.0 MHz
        // let frequencyPerDegree = 1.0 / 360.0
        
        let normalizedRotation = rotation / 360.0
        let frequencyOffset = normalizedRotation * 1.0 // 每圈 1MHz
        
        let baseFreq = 98.0
        let newFreq = baseFreq + frequencyOffset
        
        // 边界处理
        let clampedFreq = max(minFreq, min(maxFreq, newFreq))
        
        // 如果触发了边界限制，需要修正 knobRotation，防止"空转"积累
        if newFreq != clampedFreq {
             let allowedOffset = clampedFreq - baseFreq
             let allowedRotation = (allowedOffset / 1.0) * 360.0
             knobRotation = allowedRotation
             
             // 边界撞击反馈：只在刚碰到边界时触发一次
             if abs(oldFreq - clampedFreq) > 0.01 {
                 limitHaptic.notificationOccurred(.warning)
             }
        } else {
            knobRotation = rotation
        }

        currentFrequency = (clampedFreq * 10).rounded() / 10
        
        // Haptics: 专业级机械棘轮感
        // 使用 selectionChanged 模拟精密仪器的齿轮咬合
        if Int(oldFreq * 10) != Int(currentFrequency * 10) {
             selectionHaptic.selectionChanged()
             selectionHaptic.prepare() // 准备下一次
        }
    }

    // 旋转旋钮 (接受角度增量)
    func rotateKnob(by deltaDegrees: Double) {
        // 1. 计算当前的磁吸阻力
        // 当靠近任何一个朝代频率时，旋钮变"沉"（灵敏度降低）
        // 这模拟了机械结构滑入凹槽的感觉
        var effectiveDelta = deltaDegrees
        
        for dynasty in DYNASTY_FREQUENCIES {
            // The resistance is still based on the linear frequency for now.
            // If dynasties were mapped to years, this would need to check year proximity.
            let dist = abs(currentFrequency - dynasty.frequency)
            if dist < resistanceRange {
                // 距离越近，阻力越大 (系数越小)
                // 0.0 distance -> 0.4 coefficient (非常沉)
                // 0.3 distance -> 1.0 coefficient (正常)
                let resistanceFactor = 0.4 + (0.6 * (dist / resistanceRange))
                effectiveDelta *= resistanceFactor
                break
            }
        }
        
        // 2. 应用旋转
        let newRotation = knobRotation + effectiveDelta
        updateFrequency(from: newRotation)
    }
    
    // 拖动结束：高阻尼模式下，松手即停
    func endDragging() {
        // 纯机械手感：移除松手后的自动吸附
        // 用户依靠"磁阻"（手感变沉）和刻度震动来感知位置
        // 不做任何位置修正，所停即所得
    }

    // 跳转到指定朝代 (用于点击刻度盘上的朝代标签)
    func jumpToDynasty(_ dynasty: Dynasty) {
        // Dynasty struct needs to be updated or we map via calculate
        // For now, use the 'frequency' in Dynasty, assume strict alignment isn't perfect yet
        // OR rely on Dynasty's startYear to calculate pure frequency
        // Better: Use startYear to find target frequency for perfect alignment
        let targetFreq = yearToFrequency(dynasty.startYear)
        
        // 反推需要的角度
        let baseFreq = 98.0
        let freqDiff = targetFreq - baseFreq
        let newRotation = freqDiff * 360.0
        
        updateFrequency(from: newRotation)
    }
    
    // Core Asymmetric Mapping Logic
    
    // 0~1 normalized position for UI elements
    func getPercent(forYear year: Int) -> Double {
        let freq = yearToFrequency(year)
        // Normalize freq 88-108 to 0-1
        return (freq - minFreq) / (maxFreq - minFreq)
    }

    func frequencyToYear(_ freq: Double) -> Int {
        if freq < splitFreq {
             // 88-95 maps to -2070 to 0
             let ratio = (freq - minFreq) / (splitFreq - minFreq)
             return Int(Double(minYear) + ratio * Double(0 - minYear))
        } else {
             // 95-108 maps to 0 to 2025
             let ratio = (freq - splitFreq) / (maxFreq - splitFreq)
             return Int(0 + ratio * Double(maxYear - 0))
        }
    }
    
    func yearToFrequency(_ year: Int) -> Double {
        if year < 0 {
            // Map [-2070, 0] -> [88, 95]
            let ratio = Double(year - minYear) / Double(0 - minYear)
            return minFreq + ratio * (splitFreq - minFreq)
        } else {
            // Map [0, 2025] -> [95, 108]
            let ratio = Double(year - 0) / Double(maxYear - 0)
            return splitFreq + ratio * (maxFreq - splitFreq)
        }
    }
}

