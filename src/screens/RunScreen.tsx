import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Polygon } from 'react-native-svg';
import { useGPS } from '../engine/useGPS';
import Geolocation from '@react-native-community/geolocation';
import { loadHexStore } from '../engine/storage';
import { calcCityPct } from '../engine/hexGrid';
import { getClaimedHexes } from '../engine/hexGrid';
import { processRunHexes } from '../engine/storage';
import { supabase } from '../lib/supabase';

export default function RunScreen({ navigation }: any) {
  const { path, tracking, start, stop, resume } = useGPS();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [cityPct, setCityPct] = useState('0.00');
  const [cityName, setCityName] = useState('your city');
  const [isPaused, setIsPaused] = useState(false);
  const centerLatRef = useRef<number | null>(null);
  const centerLngRef = useRef<number | null>(null);

  const glowAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const hexOpacity = useRef(new Animated.Value(1)).current;
  const pauseScale = useRef(new Animated.Value(1)).current;
  const mapScale = useRef(new Animated.Value(1)).current;
  const glowLoopRef = useRef<any>(null);
  const pulseLoopRef = useRef<any>(null);

  useEffect(() => {
    Geolocation.getCurrentPosition(
      async pos => {
        const { latitude, longitude } = pos.coords;
        centerLatRef.current = latitude;
        centerLngRef.current = longitude;

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await res.json();
          const name =
            data.address?.city ||
            data.address?.town ||
            data.address?.village ||
            'your city';
          setCityName(name);
        } catch {
          setCityName('your city');
        }

        const hexStore = await loadHexStore();
        const pct = calcCityPct(Object.keys(hexStore), latitude, longitude);
        setCityPct(pct);
      },
      () => {},
      { enableHighAccuracy: true, timeout: 5000 }
    );
  }, []);

  useEffect(() => {
    if (!tracking || isPaused) return;
    const interval = setInterval(async () => {
      if (centerLatRef.current && centerLngRef.current) {
        const hexStore = await loadHexStore();
        const pct = calcCityPct(
          Object.keys(hexStore),
          centerLatRef.current,
          centerLngRef.current
        );
        setCityPct(pct);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [tracking, isPaused]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (tracking && !isPaused) {
      interval = setInterval(() => setElapsedSeconds(s => s + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [tracking, isPaused]);

  useEffect(() => {
    start();
    return () => stop();
  }, []);

  const startAnimations = () => {
    glowLoopRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    glowLoopRef.current.start();

    pulseLoopRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.025,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoopRef.current.start();
  };

  const stopAnimations = () => {
    glowLoopRef.current?.stop();
    pulseLoopRef.current?.stop();
    Animated.timing(glowAnim, {
      toValue: 0,
      duration: 600,
      useNativeDriver: true,
    }).start();
    Animated.timing(pulseAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
    startAnimations();
    return () => {
      glowLoopRef.current?.stop();
      pulseLoopRef.current?.stop();
    };
  }, []);

  const handlePause = () => {
    setIsPaused(true);
    stop();
    stopAnimations();
    Animated.timing(hexOpacity, {
      toValue: 0.7,
      duration: 400,
      useNativeDriver: true,
    }).start();
  };

  const handleResume = () => {
    setIsPaused(false);
    resume();
    startAnimations();
    Animated.timing(hexOpacity, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  };

  const handleEndRun = async () => {
    stop();
    const claimedIds = getClaimedHexes(path);
    const { data: { user } } = await supabase.auth.getUser();
    const ownerId = user?.id ?? 'local_user';
    const { newHexes, reinforced, maxDepth } = await processRunHexes(claimedIds, ownerId);
    navigation.navigate('Claim', {
      hexesClaimed: newHexes,
      reinforced,
      distanceKm: getDistance(),
      elapsedSeconds,
      maxDepth,
      punePct: cityPct,
      isFirstRun: newHexes === 0 && reinforced === 0,
    });
  };

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0)
      return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const getDistance = () => {
    if (path.length < 2) return '0.00';
    let total = 0;
    for (let i = 1; i < path.length; i++) {
      const R = 6371000;
      const dLat = ((path[i].lat - path[i - 1].lat) * Math.PI) / 180;
      const dLng = ((path[i].lng - path[i - 1].lng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((path[i - 1].lat * Math.PI) / 180) *
          Math.cos((path[i].lat * Math.PI) / 180) *
          Math.sin(dLng / 2) ** 2;
      total += R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
    return (total / 1000).toFixed(2);
  };

  const pressIn = (anim: Animated.Value) =>
    Animated.spring(anim, { toValue: 0.96, useNativeDriver: true, speed: 50 }).start();

  const pressOut = (anim: Animated.Value) =>
    Animated.spring(anim, { toValue: 1, useNativeDriver: true, speed: 50 }).start();

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.04, 0.10],
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.topBar}>
        <Text style={styles.wordmark}>RunClaim</Text>
        <View style={styles.puneWrap}>
          <Text style={styles.punePct}>{cityPct}%</Text>
          <Text style={styles.puneLabel}>of {cityName}</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statVal}>{getDistance()}</Text>
          <Text style={styles.statLabel}>Kilometers</Text>
        </View>
      </View>

      <View style={styles.hexCenter}>
        <View style={styles.timerAboveHex}>
          <Text style={styles.hexTimer}>{formatTime(elapsedSeconds)}</Text>
          <Text style={styles.hexTimerLabel}>Active Time</Text>
        </View>

        <Animated.View style={[styles.hexGlow, { opacity: glowOpacity }]} />

        <Animated.View
          style={[
            styles.hexWrap,
            { transform: [{ scale: pulseAnim }], opacity: hexOpacity },
          ]}>
          <Svg
            width={240}
            height={240}
            viewBox="0 0 240 240"
            style={StyleSheet.absoluteFill}>
            <Polygon
              points="120,4 224,62 224,178 120,236 16,178 16,62"
              fill="none"
              stroke="rgba(62,207,178,0.06)"
              strokeWidth="1"
            />
            <Polygon
              points="120,22 212,72 212,168 120,218 28,168 28,72"
              fill="rgba(62,207,178,0.06)"
              stroke="rgba(62,207,178,0.9)"
              strokeWidth="1.5"
            />
          </Svg>

          <View style={styles.hexContent}>
            <View style={styles.gpsRow}>
              <View style={[styles.gpsDot, isPaused && styles.gpsDotPaused]} />
              <Text style={[styles.gpsLabel, isPaused && styles.gpsLabelPaused]}>
                {isPaused ? 'Run Paused' : 'GPS Locked'}
              </Text>
            </View>
          </View>
        </Animated.View>
      </View>

      {isPaused ? (
        <View style={styles.bottom}>
          <Animated.View style={[styles.btnWrap, { transform: [{ scale: pauseScale }] }]}>
            <TouchableOpacity
              style={styles.btnEnd}
              onPressIn={() => pressIn(pauseScale)}
              onPressOut={() => pressOut(pauseScale)}
              onPress={handleEndRun}
              activeOpacity={1}>
              <Text style={styles.btnEndText}>End Run</Text>
            </TouchableOpacity>
          </Animated.View>
          <Animated.View style={[styles.btnWrap, { transform: [{ scale: mapScale }] }]}>
            <TouchableOpacity
              style={styles.btnResume}
              onPressIn={() => pressIn(mapScale)}
              onPressOut={() => pressOut(mapScale)}
              onPress={handleResume}
              activeOpacity={1}>
              <Text style={styles.btnResumeText}>Resume</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      ) : (
        <View style={styles.bottom}>
          <Animated.View style={[styles.btnWrap, { transform: [{ scale: pauseScale }] }]}>
            <TouchableOpacity
              style={styles.btnPause}
              onPressIn={() => pressIn(pauseScale)}
              onPressOut={() => pressOut(pauseScale)}
              onPress={handlePause}
              activeOpacity={1}>
              <View style={styles.pauseBars}>
                <View style={styles.pauseBar} />
                <View style={styles.pauseBar} />
              </View>
              <Text style={styles.btnPauseText}>Pause</Text>
            </TouchableOpacity>
          </Animated.View>
          <Animated.View style={[styles.btnWrap, { transform: [{ scale: mapScale }] }]}>
            <TouchableOpacity
              style={styles.btnMap}
              onPressIn={() => pressIn(mapScale)}
              onPressOut={() => pressOut(mapScale)}
              onPress={() => navigation.navigate('Map')}
              activeOpacity={1}>
              <Svg width={13} height={13} viewBox="0 0 24 24">
                <Polygon
                  points="12,2 21,7 21,17 12,22 3,17 3,7"
                  fill="rgba(5,5,5,0.25)"
                  stroke="#050505"
                  strokeWidth="1.5"
                />
              </Svg>
              <Text style={styles.btnMapText}>Live Map</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080808',
    paddingHorizontal: 24,
    paddingBottom: 44,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 12,
    marginBottom: 28,
  },
  wordmark: {
    fontFamily: 'SpaceGrotesk-Medium',
    fontSize: 12,
    letterSpacing: 5,
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  puneWrap: { alignItems: 'flex-end' },
  punePct: {
    fontFamily: 'SpaceGrotesk-Medium',
    fontSize: 14,
    color: '#3ecfb2',
    letterSpacing: 1,
  },
  puneLabel: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 9,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  statsRow: {
    alignItems: 'center',
    marginBottom: 16,
  },
  stat: { alignItems: 'center', gap: 5 },
  statVal: {
    fontFamily: 'Teko-Bold',
    fontSize: 46,
    color: '#3ecfb2',
    lineHeight: 52,
    letterSpacing: 1,
  },
  statLabel: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  hexCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerAboveHex: {
    alignItems: 'center',
    marginBottom: 8,
  },
  hexTimer: {
    fontFamily: 'Teko-Bold',
    fontSize: 72,
    color: '#ffffff',
    letterSpacing: 2,
    lineHeight: 80,
    paddingTop: 8,
  },
  hexTimerLabel: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 4,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  hexGlow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#3ecfb2',
    shadowColor: '#3ecfb2',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 36,
  },
  hexWrap: {
    width: 240,
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hexContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gpsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  gpsDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#3ecfb2',
  },
  gpsDotPaused: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  gpsLabel: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 8,
    color: 'rgba(62,207,178,0.6)',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  gpsLabelPaused: {
    color: 'rgba(255,255,255,0.35)',
  },
  bottom: {
    flexDirection: 'row',
    gap: 12,
  },
  btnWrap: { flex: 1 },
  btnPause: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.38)',
    borderRadius: 3,
  },
  pauseBars: {
    flexDirection: 'row',
    gap: 3,
  },
  pauseBar: {
    width: 3,
    height: 13,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  btnPauseText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 12,
    letterSpacing: 4,
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
  },
  btnMap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
    backgroundColor: '#3ecfb2',
    borderRadius: 3,
    shadowColor: '#3ecfb2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  btnMapText: {
    fontFamily: 'SpaceGrotesk-SemiBold',
    fontSize: 12,
    letterSpacing: 4,
    color: '#050505',
    textTransform: 'uppercase',
  },
  btnResume: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    backgroundColor: '#3ecfb2',
    borderRadius: 3,
    shadowColor: '#3ecfb2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  btnResumeText: {
    fontFamily: 'SpaceGrotesk-SemiBold',
    fontSize: 12,
    letterSpacing: 4,
    color: '#050505',
    textTransform: 'uppercase',
  },
  btnEnd: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(255,80,80,0.45)',
    borderRadius: 3,
  },
  btnEndText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 12,
    letterSpacing: 4,
    color: 'rgba(255,100,100,0.7)',
    textTransform: 'uppercase',
  },
});