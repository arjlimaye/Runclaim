#import <GoogleMaps/GoogleMaps.h>

@interface GoogleMapsInitializer : NSObject
@end

@implementation GoogleMapsInitializer
+ (void)load {
    [GMSServices provideAPIKey:@"AIzaSyC6WNE3qJIjtvWcVK6GMdKLh4Y36SN8AdM"];
}
@end
