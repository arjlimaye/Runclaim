#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(LiveActivityBridge, NSObject)

RCT_EXTERN_METHOD(startActivity:(double)elapsedSeconds distanceKm:(double)distanceKm startTimestamp:(double)startTimestamp)
RCT_EXTERN_METHOD(updateActivity:(double)elapsedSeconds distanceKm:(double)distanceKm startTimestamp:(double)startTimestamp)
RCT_EXTERN_METHOD(endActivity)

+ (BOOL)requiresMainQueueSetup { return NO; }

@end
