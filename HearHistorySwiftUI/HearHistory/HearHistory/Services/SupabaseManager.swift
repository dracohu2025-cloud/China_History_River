import Foundation
import Supabase

struct EventPodcastDTO: Codable {
    let event_year: Int
    let event_title: String
    let book_title: String?
    let podcast_uuid: String
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
            
            return response.map { dto in
                HistoricalEvent(
                    year: dto.event_year,
                    title: dto.event_title,
                    description: dto.book_title != nil ? "收听解读：《\(dto.book_title!)》" : "点击收听详细解读",
                    hasPodcast: true
                )
            }.sorted { $0.year < $1.year }
            
        } catch {
            print("Supabase Data Fetch Error: \(error)")
            throw error
        }
    }
}
