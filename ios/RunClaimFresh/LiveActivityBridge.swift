import Foundation
import ActivityKit

@objc(LiveActivityBridge)
class LiveActivityBridge: NSObject {

    // Stored as Any? so the property declaration compiles on all iOS deployment targets.
    // Actual value is Activity<RunClaimLiveActivityAttributes> on iOS 16.1+.
    private var activityInstance: Any? = nil

    @objc(startActivity:distanceKm:)
    func startActivity(_ elapsedSeconds: Double, distanceKm: Double) {
        guard #available(iOS 16.2, *) else {
            print("[RunClaim] LiveActivity: iOS 16.2+ required, skipping")
            return
        }
        guard ActivityAuthorizationInfo().areActivitiesEnabled else {
            print("[RunClaim] LiveActivity: areActivitiesEnabled = false — check Settings > [App] > Live Activities")
            return
        }

        let attributes = RunClaimLiveActivityAttributes()
        let state = RunClaimLiveActivityAttributes.ContentState(
            elapsedSeconds: Int(elapsedSeconds),
            distanceKm: distanceKm
        )
        let content = ActivityContent(state: state, staleDate: nil)
        do {
            let activity = try Activity<RunClaimLiveActivityAttributes>.request(
                attributes: attributes,
                content: content,
                pushType: nil
            )
            activityInstance = activity
        } catch {
            print("[RunClaim] LiveActivity start failed: \(error.localizedDescription)")
        }
    }

    @objc(updateActivity:distanceKm:)
    func updateActivity(_ elapsedSeconds: Double, distanceKm: Double) {
        guard #available(iOS 16.2, *) else { return }
        guard let activity = activityInstance as? Activity<RunClaimLiveActivityAttributes> else { return }

        let state = RunClaimLiveActivityAttributes.ContentState(
            elapsedSeconds: Int(elapsedSeconds),
            distanceKm: distanceKm
        )
        let content = ActivityContent(state: state, staleDate: nil)
        Task {
            await activity.update(content)
        }
    }

    @objc(endActivity)
    func endActivity() {
        guard #available(iOS 16.2, *) else { return }
        guard let activity = activityInstance as? Activity<RunClaimLiveActivityAttributes> else { return }

        Task {
            await activity.end(nil, dismissalPolicy: .immediate)
        }
        activityInstance = nil
    }

    @objc
    static func requiresMainQueueSetup() -> Bool {
        return false
    }
}
