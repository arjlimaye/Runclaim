import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Polygon } from 'react-native-svg';
import Geolocation from '@react-native-community/geolocation';
import { loadHexStore } from '../engine/storage';
import { calcCityPct } from '../engine/hexGrid';

export default function HomeScreen({ navigation }: any) {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const [cityPct, setCityPct] = useState('0.00');
  const [cityName, setCityName] = useState('your city');

  useEffect(() => {
    Geolocation.getCurrentPosition(
      async pos => {
        const { latitude, longitude } = pos.coords;

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
        const claimedIds = Object.keys(hexStore);
        const pct = calcCityPct(claimedIds, latitude, longitude);
        setCityPct(pct);
      },
      () => {},
      { enableHighAccuracy: true, timeout: 5000 }
    );
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.topRow}>
        <Text style={styles.wordmark}>RunClaim</Text>
        <View style={styles.topRight}>
          <View style={styles.hexStat}>
            <View style={styles.hexIconRow}>
              <Svg width={18} height={18} viewBox="0 0 24 24">
                <Polygon
                  points="12,2 21,7 21,17 12,22 3,17 3,7"
                  fill="rgba(62,207,178,0.12)"
                  stroke="#3ecfb2"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </Svg>
              <Text style={styles.hexPct}>{cityPct}%</Text>
            </View>
            <Text style={styles.hexCity}>of {cityName}</Text>
          </View>
          <TouchableOpacity
            style={styles.settingsBtn}
            onPress={() => navigation.navigate('Settings')}>
            <Text style={styles.settingsIcon}>⚙</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.center}>
        <Text style={styles.date}>{today}</Text>
        <View style={styles.taglineWrap}>
          <Text style={[styles.tagline, styles.taglineLine]}>Earn</Text>
          <Text style={[styles.tagline, styles.taglineLine, styles.taglineAccent]}>Your</Text>
          <Text style={[styles.tagline, styles.taglineLine]}>City.</Text>
        </View>
        <View style={styles.streakRow}>
          {[...Array(7)].map((_, i) => (
            <View key={i} style={styles.streakSeg} />
          ))}
          <Text style={styles.streakLabel}>0 day streak</Text>
        </View>
      </View>
      <View style={styles.bottom}>
        <TouchableOpacity
          style={styles.btnPrimary}
          onPress={() => navigation.navigate('Run')}>
          <Text style={styles.btnPrimaryText}>Start Run</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.btnGhost}
          onPress={() => navigation.navigate('Map')}>
          <Text style={styles.btnGhostText}>View Map</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080808',
    paddingHorizontal: 20,
    paddingBottom: 44,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 24,
  },
  wordmark: {
    fontFamily: 'SpaceGrotesk-Medium',
    fontSize: 12,
    letterSpacing: 5,
    color: '#ffffff',
    textTransform: 'uppercase',
    paddingTop: 2,
  },
  topRight: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  hexStat: { alignItems: 'flex-end' },
  hexIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  hexPct: {
    fontFamily: 'SpaceGrotesk-Medium',
    fontSize: 14,
    color: '#3ecfb2',
    letterSpacing: 1,
  },
  hexCity: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 9,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginTop: 3,
  },
  settingsBtn: {
    paddingTop: 2,
  },
  settingsIcon: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.4)',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    marginTop: -60,
  },
  date: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  taglineWrap: {
    marginBottom: 24,
    paddingLeft: 10,
  },
  tagline: {
    fontFamily: 'Teko-Bold',
    fontSize: 76,
    color: 'rgba(255,255,255,0.95)',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  taglineLine: {
    marginBottom: -8,
  },
  taglineAccent: {
    color: '#3ecfb2',
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  streakSeg: {
    width: 20,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.40)',
  },
  streakLabel: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 10,
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginLeft: 6,
  },
  bottom: { gap: 10 },
  btnPrimary: {
    backgroundColor: '#3ecfb2',
    borderRadius: 3,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#3ecfb2',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.20,
    shadowRadius: 16,
  },
  btnPrimaryText: {
    fontFamily: 'SpaceGrotesk-SemiBold',
    fontSize: 16,
    letterSpacing: 5,
    color: '#050505',
    textTransform: 'uppercase',
  },
  btnGhost: {
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
    borderRadius: 3,
    paddingVertical: 15,
    alignItems: 'center',
  },
  btnGhostText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 13,
    letterSpacing: 4,
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
  },
});