import Foundation
import AVFoundation
import Combine
import Supabase

class AudioManager: ObservableObject {
    static let shared = AudioManager()
    
    private var player: AVPlayer?
    private var currentPodcastUUID: String?  // Track currently loaded podcast
    private var playbackProgress: [String: CMTime] = [:] // Store progress for each podcast
    
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
    
    // ... getAudioURL method unchanged ...
    
    /// Play audio from a podcast UUID
    /// Auto-resumes from last position
    func play(podcastUUID: String, title: String) {
        Task {
            // Check if we are just resuming the same podcast
            if currentPodcastUUID == podcastUUID, let player = player {
                await MainActor.run {
                    player.play()
                    self.isPlaying = true
                    print("▶️ Resuming: \(title)")
                }
                return
            }
            
            // If switching podcasts, save progress of previous one
            if let oldUUID = currentPodcastUUID, let player = player {
                 await MainActor.run {
                     let currentTime = player.currentTime()
                     self.playbackProgress[oldUUID] = currentTime
                     print("💾 Saved progress for \(oldUUID): \(currentTime.seconds)s")
                 }
            }
            
            do {
                let audioPath = try await fetchAudioPath(for: podcastUUID)
                
                guard let url = constructFullURL(from: audioPath) else {
                    print("Invalid audio URL for podcast: \(podcastUUID)")
                    return
                }
                
                await MainActor.run {
                    self.currentPodcastTitle = title
                    self.currentPodcastUUID = podcastUUID
                    
                    let newPlayer = AVPlayer(url: url)
                    
                    // Seek to saved position if exists
                    if let savedTime = self.playbackProgress[podcastUUID] {
                        newPlayer.seek(to: savedTime)
                        print("⏩ Seeking to saved position: \(savedTime.seconds)s")
                    }
                    
                    self.player = newPlayer
                    self.player?.play()
                    self.isPlaying = true
                    print("▶️ Playing new: \(title) from \(url)")
                }
            } catch {
                print("Failed to play audio: \(error)")
            }
        }
    }
    
    /// Pause current playback and save progress
    func stop() {
        guard let player = player else { return }
        
        player.pause()
        
        if let currentUUID = currentPodcastUUID {
            playbackProgress[currentUUID] = player.currentTime()
            print("⏸ Paused. Progress saved for \(currentUUID)")
        }
        
        isPlaying = false
        // Don't clear currentPodcastTitle/UUID so we can resume
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
