//
//  RunClaimLiveActivityLiveActivity.swift
//  RunClaimLiveActivity
//
//  Created by Arjun Limaye on 19/05/26.
//

import ActivityKit
import WidgetKit
import SwiftUI

struct RunClaimLiveActivityLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: RunClaimLiveActivityAttributes.self) { context in
            // Lock screen/banner UI goes here
            VStack {
                Text("\(String(format: "%.2f", context.state.distanceKm)) km")
                Text("\(context.state.elapsedSeconds)s elapsed")
            }
            .activityBackgroundTint(Color.cyan)
            .activitySystemActionForegroundColor(Color.black)

        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    Text("\(String(format: "%.2f", context.state.distanceKm)) km")
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Text("\(context.state.elapsedSeconds)s")
                }
                DynamicIslandExpandedRegion(.bottom) {
                    Text("\(String(format: "%.2f", context.state.distanceKm)) km in \(context.state.elapsedSeconds)s")
                }
            } compactLeading: {
                Text("\(String(format: "%.1f", context.state.distanceKm))km")
            } compactTrailing: {
                Text("\(context.state.elapsedSeconds)s")
            } minimal: {
                Text("\(String(format: "%.1f", context.state.distanceKm))")
            }
            .widgetURL(URL(string: "http://www.apple.com"))
            .keylineTint(Color.red)
        }
    }
}


