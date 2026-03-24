#import <GoogleMaps/GoogleMaps.h>

__attribute__((constructor))
static void initGoogleMaps(void) {
    [GMSServices provideAPIKey:@"AIzaSyC6WNE3qJIjtvWcVK6GMdKLh4Y36SN8AdM"];
}
