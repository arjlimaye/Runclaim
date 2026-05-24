//
//  RunClaimLiveActivityLiveActivity.swift
//  RunClaimLiveActivity
//
//  Created by Arjun Limaye on 19/05/26.
//

import ActivityKit
import WidgetKit
import SwiftUI

private func formatTime(_ totalSeconds: Int) -> String {
    let minutes = totalSeconds / 60
    let seconds = totalSeconds % 60
    return String(format: "%d:%02d", minutes, seconds)
}

struct TealHexagon: Shape {
    func path(in rect: CGRect) -> Path {
        var path = Path()
        let w = rect.width
        let h = rect.height
        // Flat-top hexagon
        path.move(to: CGPoint(x: w * 0.25, y: 0))
        path.addLine(to: CGPoint(x: w * 0.75, y: 0))
        path.addLine(to: CGPoint(x: w, y: h * 0.5))
        path.addLine(to: CGPoint(x: w * 0.75, y: h))
        path.addLine(to: CGPoint(x: w * 0.25, y: h))
        path.addLine(to: CGPoint(x: 0, y: h * 0.5))
        path.closeSubpath()
        return path
    }
}

struct RunClaimLiveActivityLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: RunClaimLiveActivityAttributes.self) { context in
            // Lock screen / banner UI
            ZStack(alignment: .topTrailing) {
                Color(red: 0.051, green: 0.051, blue: 0.051)

                // Teal hexagon top-right
                TealHexagon()
                    .fill(Color(red: 0.243, green: 0.812, blue: 0.698))
                    .frame(width: 22, height: 20)
                    .padding(.top, 12)
                    .padding(.trailing, 14)

                HStack(spacing: 0) {
                    // Left: elapsed time
                    VStack(alignment: .leading, spacing: 2) {
                        Text(Date(timeIntervalSince1970: context.state.startTimestamp), style: .timer)
                            .font(.system(size: 34, weight: .bold, design: .default))
                            .foregroundColor(.white)
                            .monospacedDigit()
                        Text("Time")
                            .font(.system(size: 12, weight: .regular))
                            .foregroundColor(Color(white: 0.55))
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.leading, 16)

                    // Divider
                    Rectangle()
                        .fill(Color(white: 0.2))
                        .frame(width: 1, height: 44)

                    // Right: distance
                    VStack(alignment: .leading, spacing: 2) {
                        Text(String(format: "%.2f", context.state.distanceKm))
                            .font(.system(size: 34, weight: .bold, design: .default))
                            .foregroundColor(.white)
                            .monospacedDigit()
                        Text("Distance (km)")
                            .font(.system(size: 12, weight: .regular))
                            .foregroundColor(Color(white: 0.55))
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.leading, 20)
                }
                .padding(.vertical, 14)
            }
            .activityBackgroundTint(Color(red: 0.051, green: 0.051, blue: 0.051))
            .activitySystemActionForegroundColor(.white)

        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    VStack(alignment: .leading, spacing: 1) {
                        Text(Date(timeIntervalSince1970: context.state.startTimestamp), style: .timer)
                            .font(.system(size: 20, weight: .bold))
                            .foregroundColor(.white)
                            .monospacedDigit()
                        Text("Time")
                            .font(.system(size: 10))
                            .foregroundColor(Color(white: 0.55))
                    }
                }
                DynamicIslandExpandedRegion(.trailing) {
                    VStack(alignment: .trailing, spacing: 1) {
                        Text(String(format: "%.2f", context.state.distanceKm))
                            .font(.system(size: 20, weight: .bold))
                            .foregroundColor(.white)
                            .monospacedDigit()
                        Text("km")
                            .font(.system(size: 10))
                            .foregroundColor(Color(white: 0.55))
                    }
                }
                DynamicIslandExpandedRegion(.bottom) {
                    HStack {
                        Text(Date(timeIntervalSince1970: context.state.startTimestamp), style: .timer)
                        Text("·")
                        Text(String(format: "%.2f km", context.state.distanceKm))
                    }
                    .font(.system(size: 13, weight: .medium))
                    .foregroundColor(.white)
                }
            } compactLeading: {
                Text(Date(timeIntervalSince1970: context.state.startTimestamp), style: .timer)
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundColor(.white)
                    .monospacedDigit()
            } compactTrailing: {
                Text(String(format: "%.1fkm", context.state.distanceKm))
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundColor(.white)
            } minimal: {
                Text(Date(timeIntervalSince1970: context.state.startTimestamp), style: .timer)
                    .font(.system(size: 10, weight: .semibold))
                    .foregroundColor(.white)
                    .monospacedDigit()
            }
            .widgetURL(URL(string: "runclaim://"))
            .keylineTint(Color(red: 0.243, green: 0.812, blue: 0.698))
        }
    }
}
