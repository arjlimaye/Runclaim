import Purchases, { LOG_LEVEL } from 'react-native-purchases';

const RC_API_KEY_IOS = 'test_HSwapgSzRcHtuFCnyfizTrGLtvc';

export function initializePurchases() {
  Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
  Purchases.configure({ apiKey: RC_API_KEY_IOS });
}

export { Purchases };