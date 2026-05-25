import React, { useEffect, useRef, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { enableScreens } from 'react-native-screens';
import { View, ActivityIndicator, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './src/lib/supabase';
import { initializePurchases } from './src/lib/purchases';
import HomeScreen from './src/screens/HomeScreen';
import RunScreen from './src/screens/RunScreen';
import SummaryScreen from './src/screens/SummaryScreen';
import ClaimScreen from './src/screens/ClaimScreen';
import MapScreen from './src/screens/MapScreen';
import AuthScreen from './src/screens/AuthScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import UsernamePickerScreen from './src/screens/UsernamePickerScreen';
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'https://08b7f772501d06abfac033ee48525fcc@o4511451899822080.ingest.us.sentry.io/4511451903754240',

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Enable Logs
  enableLogs: true,

  // Configure Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [
    Sentry.mobileReplayIntegration(),
    Sentry.feedbackIntegration(),
  ],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

enableScreens();

const Stack = createNativeStackNavigator();

export default Sentry.wrap(function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [onboardingDone, setOnboardingDone] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [needsUsername, setNeedsUsername] = useState(false);
  const loadingRef = useRef(true);

  const checkUsername = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', userId)
      .single();
    setNeedsUsername(!data?.username);
  };

  useEffect(() => {
    initializePurchases();
  }, []);

  useEffect(() => {
    // FIX 1: if app comes to foreground while still loading, force auth screen after 3s
    const appStateSub = AppState.addEventListener('change', nextState => {
      if (nextState === 'active' && loadingRef.current) {
        setTimeout(() => {
          if (loadingRef.current) {
            loadingRef.current = false;
            setLoading(false);
          }
        }, 3000);
      }
    });

    const init = async () => {
      const done = await AsyncStorage.getItem('runclaim_onboarding_done');
      setOnboardingDone(done === 'true');

      // FIX 1: race getSession against a 5-second timeout; on timeout default to auth screen
      const sessionTimeout = new Promise<{ data: { session: null } }>(resolve =>
        setTimeout(() => resolve({ data: { session: null } }), 5000),
      );
      const {
        data: { session },
      } = await Promise.race([supabase.auth.getSession(), sessionTimeout]);
      setSession(session);
      if (session?.user) await checkUsername(session.user.id);
      loadingRef.current = false;
      setLoading(false);
    };
    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session?.user) {
        await checkUsername(session.user.id);
      } else {
        setNeedsUsername(false);
      }
    });

    return () => {
      subscription.unsubscribe();
      appStateSub.remove();
    };
  }, []);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#080808',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator color="#3ecfb2" />
      </View>
    );
  }

  if (!onboardingDone) {
    return <OnboardingScreen onDone={() => setOnboardingDone(true)} />;
  }

  if (!session) {
    return <AuthScreen />;
  }

  if (needsUsername) {
    return (
      <UsernamePickerScreen
        userId={session.user.id}
        onDone={() => setNeedsUsername(false)}
      />
    );
  }

  if (showOnboarding) {
    return <OnboardingScreen onDone={() => setShowOnboarding(false)} />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Run" component={RunScreen} />
        <Stack.Screen name="Claim" component={ClaimScreen} />
        <Stack.Screen name="Summary" component={SummaryScreen} />
        <Stack.Screen name="Map" component={MapScreen} />
        <Stack.Screen name="Settings">
          {(props: any) => (
            <SettingsScreen
              {...props}
              onShowOnboarding={() => setShowOnboarding(true)}
            />
          )}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
});
