import ActivityKit
import Foundation

struct RunClaimLiveActivityAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        var elapsedSeconds: Int
        var distanceKm: Double
        var startTimestamp: Double = 0
    }
}
