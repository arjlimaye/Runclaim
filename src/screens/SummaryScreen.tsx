import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Geolocation from '@react-native-community/geolocation';

export default function SummaryScreen({ navigation, route }: any) {
  const {
    hexesClaimed = 0,
    reinforced = 0,
    distanceKm = '0.00',
    elapsedSeconds = 0,
    maxDepth = 1,
    punePct = '0.00',
    isFirstRun = true,
  } = route?.params || {};

  const [cityName, setCityName] = useState('your city');
  const glowAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(glowAnim, {
      toValue: 0,
      duration: 1000,
      delay: 400,
      useNativeDriver: true,
    }).start();

    Geolocation.getCurrentPosition(
      async pos => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`
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
      },
      () => {},
      { enableHighAccuracy: true, timeout: 5000 }
    );
  }, []);

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0)
      return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const handleDone = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Home' }],
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.topBar}>
        <Text style={styles.wordmark}>RunClaim</Text>
        <Text style={styles.date}>{today}</Text>
      </View>

      <Text style={styles.headline}>That was real.</Text>

      <View style={styles.bigNumWrap}>
        <Animated.View style={[styles.numGlow, { opacity: glowAnim }]} />
        <Text style={styles.bigNum}>{hexesClaimed}</Text>
      </View>

      <Text style={styles.bigLabel}>Hexes Claimed</Text>

      <View style={styles.divider} />

      <View style={styles.statsBlock}>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Distance</Text>
          <Text style={styles.rowVal}>{distanceKm} km</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Time</Text>
          <Text style={styles.rowVal}>{formatTime(elapsedSeconds)}</Text>
        </View>

        {!isFirstRun && reinforced > 0 && (
          <View style={styles.row}>
            <View style={styles.rowLabelWrap}>
              <Text style={styles.rowLabel}>Reinforced</Text>
              <Text style={styles.rowLabelSub}>↑ depth increased</Text>
            </View>
            <Text style={styles.rowValTeal}>+{reinforced}</Text>
          </View>
        )}

        {!isFirstRun && (
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Max Depth</Text>
            <Text style={styles.rowValTeal}>D{maxDepth}</Text>
          </View>
        )}
      </View>

      <View style={styles.divider} />

      <View style={styles.row}>
        <Text style={styles.rowLabel}>{cityName} Covered</Text>
        <Text style={styles.rowValTeal}>{punePct}%</Text>
      </View>

      <View style={styles.bottom}>
        <TouchableOpacity
          style={styles.btnPrimary}
          onPress={() => navigation.navigate('Map')}>
          <Text style={styles.btnPrimaryText}>View Territory</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.btnGhost}
          onPress={handleDone}>
          <Text style={styles.btnGhostText}>Done</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080808',
    paddingHorizontal: 28,
    paddingBottom: 44,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  date: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 10,
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  headline: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  bigNumWrap: {
    paddingTop: 14,
    paddingLeft: 10,
    overflow: 'visible',
    position: 'relative',
  },
  numGlow: {
    position: 'absolute',
    top: 0,
    left: -20,
    width: 180,
    height: 120,
    borderRadius: 90,
    backgroundColor: '#3ecfb2',
    shadowColor: '#3ecfb2',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 40,
  },
  bigNum: {
    fontFamily: 'Teko-Bold',
    fontSize: 100,
    color: '#3ecfb2',
    lineHeight: 112,
    letterSpacing: 2,
  },
  bigLabel: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 4,
    textTransform: 'uppercase',
    marginTop: 8,
    marginBottom: 28,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginBottom: 22,
  },
  statsBlock: {
    gap: 22,
    marginBottom: 22,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowLabelWrap: {
    flexDirection: 'column',
    gap: 2,
  },
  rowLabel: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 10,
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  rowLabelSub: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 8,
    color: 'rgba(62,207,178,0.45)',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  rowVal: {
    fontFamily: 'Teko-Bold',
    fontSize: 24,
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 1,
    lineHeight: 28,
  },
  rowValTeal: {
    fontFamily: 'Teko-Bold',
    fontSize: 24,
    color: '#3ecfb2',
    letterSpacing: 1,
    lineHeight: 28,
  },
  bottom: {
    marginTop: 'auto' as any,
    gap: 10,
  },
  btnPrimary: {
    backgroundColor: '#3ecfb2',
    borderRadius: 3,
    paddingVertical: 22,
    alignItems: 'center',
    shadowColor: '#3ecfb2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
  },
  btnPrimaryText: {
    fontFamily: 'SpaceGrotesk-SemiBold',
    fontSize: 13,
    letterSpacing: 5,
    color: '#050505',
    textTransform: 'uppercase',
  },
  btnGhost: {
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.22)',
    borderRadius: 3,
    paddingVertical: 15,
    alignItems: 'center',
  },
  btnGhostText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 12,
    letterSpacing: 5,
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
  },
});