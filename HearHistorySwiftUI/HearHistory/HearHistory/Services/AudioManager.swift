import Foundation
import AVFoundation
import Combine
import Supabase

class AudioManager: ObservableObject {
    static let shared = AudioManager()
    
    private var player: AVPlayer?
    @Published var isPlaying: Bool = false
    @Published var currentPodcastTitle: String?
    
    private let supabaseURL = "https://zhvczrrcwpxgrifshhmh.supabase.co"
    
    private init() {
        // Configure audio session for playback
        do {
            try AVAudioSession.sharedInstance().setCategory(.playback, mode: .default)
            try AVAudioSession.sharedInstance().setActive(true)
        } catch {
            print("Failed to configure audio session: \(error)")
        }
    }
    
    /// Construct the public URL for a podcast audio file
    /// Storage bucket: "podcasts", path format: "{user_id}/{podcast_uuid}/audio.mp3"
    func getAudioURL(for podcastUUID: String, userID: String = "anonymous") -> URL? {
        // Supabase Storage public URL pattern:
        // https://{project}.supabase.co/storage/v1/object/public/{bucket}/{path}
        let audioPath = "\(userID)/\(podcastUUID)/audio.mp3"
        let urlString = "\(supabaseURL)/storage/v1/object/public/podcasts/\(audioPath)"
        return URL(string: urlString)
    }
    
    /// Play audio from a podcast UUID
    func play(podcastUUID: String, title: String) {
        // First, try to get the audio URL from the podcasts table
        // For now, we'll construct a likely URL pattern
        Task {
            do {
                // Query the podcasts table to get the actual audio_path
                let audioPath = try await fetchAudioPath(for: podcastUUID)
                
                guard let url = constructFullURL(from: audioPath) else {
                    print("Invalid audio URL for podcast: \(podcastUUID)")
                    return
                }
                
                await MainActor.run {
                    self.currentPodcastTitle = title
                    self.player = AVPlayer(url: url)
                    self.player?.play()
                    self.isPlaying = true
                    print("▶️ Playing: \(title) from \(url)")
                }
            } catch {
                print("Failed to play audio: \(error)")
            }
        }
    }
    
    /// Stop current playback
    func stop() {
        player?.pause()
        player = nil
        isPlaying = false
        currentPodcastTitle = nil
        print("⏹ Stopped playback")
    }
    
    /// Fetch audio_path from podcasts table
    private func fetchAudioPath(for podcastUUID: String) async throws -> String {
        struct PodcastAudioDTO: Codable {
            let audio_path: String
        }
        
        let response: [PodcastAudioDTO] = try await SupabaseManager.shared.client
            .from("podcasts")
            .select("audio_path")
            .eq("id", value: podcastUUID)
            .execute()
            .value
        
        guard let podcast = response.first else {
            throw NSError(domain: "AudioManager", code: 404, userInfo: [NSLocalizedDescriptionKey: "Podcast not found"])
        }
        
        return podcast.audio_path
    }
    
    /// Construct full URL from storage path
    private func constructFullURL(from audioPath: String) -> URL? {
        // audio_path format is typically: "user_id/podcast_id/audio.mp3"
        let urlString = "\(supabaseURL)/storage/v1/object/public/podcasts/\(audioPath)"
        return URL(string: urlString)
    }
}
