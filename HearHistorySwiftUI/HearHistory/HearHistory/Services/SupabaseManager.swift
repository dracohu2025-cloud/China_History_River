import Foundation
import Supabase

struct EventPodcastDTO: Codable {
    let event_year: Int
    let event_title: String
    let book_title: String?
    let podcast_uuid: String
}

struct DynastyDTO: Codable {
    let id: String
    let name: String
    let chinese_name: String
    let start_year: Int
    let end_year: Int
    let color: String
    let country: String?
}

class SupabaseManager {
    static let shared = SupabaseManager()
    let client: SupabaseClient

    private init() {
        self.client = SupabaseClient(
            supabaseURL: URL(string: "https://zhvczrrcwpxgrifshhmh.supabase.co")!,
            supabaseKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpodmN6cnJjd3B4Z3JpZnNoaG1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3MDg5NzUsImV4cCI6MjA3OTI4NDk3NX0.aSa9aWHsNxghJhGj91l1bU_vwAMPp9ZIDTQnm-OG-go"
        )
    }

    func fetchAllEvents() async throws -> [HistoricalEvent] {
        do {
            let response: [EventPodcastDTO] = try await client
                .from("event_podcasts")
                .select()
                .execute()
                .value
            
            // 按年份分组播客
            var eventsByYear: [Int: (title: String, podcasts: [PodcastItem])] = [:]
            
            for dto in response {
                let podcastItem = PodcastItem(
                    uuid: dto.podcast_uuid,
                    bookTitle: dto.book_title ?? "历史解读"
                )
                
                if var existing = eventsByYear[dto.event_year] {
                    // 同一年份，追加播客
                    existing.podcasts.append(podcastItem)
                    eventsByYear[dto.event_year] = existing
                } else {
                    // 新年份，创建条目
                    eventsByYear[dto.event_year] = (title: dto.event_title, podcasts: [podcastItem])
                }
            }
            
            // 转换为 HistoricalEvent 数组
            return eventsByYear.map { year, data in
                let podcastTitles = data.podcasts.map { "《\($0.bookTitle)》" }.joined(separator: "、")
                return HistoricalEvent(
                    year: year,
                    title: data.title,
                    description: "🎧 收听解读：\(podcastTitles)",
                    podcasts: data.podcasts
                )
            }.sorted { $0.year < $1.year }
            
        } catch {
            print("Supabase Data Fetch Error: \(error)")
            throw error
        }
    }
    
    /// Fetch dynasties from Supabase, filtered to Chinese dynasties only
    func fetchDynasties() async throws -> [Dynasty] {
        do {
            let response: [DynastyDTO] = try await client
                .from("dynasties")
                .select()
                .eq("country", value: "china")
                .order("start_year", ascending: true)
                .execute()
                .value
            
            // 精选主要朝代 (使用 Supabase 精确 ID)
            // 策略：展示中华文明的主干脉络，避免过于细碎
            let majorDynastyIds = [
                "xia",                    // 夏 (-2070)
                "shang",                  // 商 (-1600)
                "zhou_west",              // 西周 (-1046)
                "zhou_east",              // 东周 (-770) - 包含春秋战国
                "qin",                    // 秦 (-221)
                "han_west",               // 西汉 (-202)
                "han_east",               // 东汉 (25)
                "threekingdoms_wei",      // 魏 (220) - 三国代表
                "western_jin",            // 西晋 (266)
                "eastern_jin",            // 东晋 (317)
                "sui",                    // 隋 (581)
                "tang",                   // 唐 (618)
                "northern_song",          // 北宋 (960)
                "southern_song",          // 南宋 (1127)
                "yuan",                   // 元 (1271)
                "ming",                   // 明 (1368)
                "qing"                    // 清 (1636)
            ]
            
            return response
                .filter { majorDynastyIds.contains($0.id) }
                .map { dto in
                Dynasty(
                    id: dto.id,
                    name: dto.name,
                    chineseName: dto.chinese_name,
                    frequency: yearToFrequency(dto.start_year),
                    startYear: dto.start_year,
                    endYear: dto.end_year,
                    color: dto.color
                )
            }
        } catch {
            print("Supabase Dynasty Fetch Error: \(error)")
            throw error
        }
    }
}
