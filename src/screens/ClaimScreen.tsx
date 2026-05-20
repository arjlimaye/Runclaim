import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Text } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Svg, { Polygon, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import Sound from 'react-native-sound';

Sound.setCategory('Playback');

type Props = NativeStackScreenProps<any, 'Claim'>;

const R = 38;
const SQRT3 = Math.sqrt(3);
const CX = 110;
const CY = 110;

function hexPoints(cx: number, cy: number): string {
  return [0, 60, 120, 180, 240, 300]
    .map(deg => {
      const rad = (deg * Math.PI) / 180;
      return `${cx + R * Math.cos(rad)},${cy + R * Math.sin(rad)}`;
    })
    .join(' ');
}

const HEXES = [
  { x: CX,           y: CY },
  { x: CX,           y: CY - R * SQRT3 },
  { x: CX + R * 1.5, y: CY - (R * SQRT3) / 2 },
  { x: CX + R * 1.5, y: CY + (R * SQRT3) / 2 },
  { x: CX,           y: CY + R * SQRT3 },
  { x: CX - R * 1.5, y: CY + (R * SQRT3) / 2 },
  { x: CX - R * 1.5, y: CY - (R * SQRT3) / 2 },
];

const ASSEMBLE_DURATION = HEXES.length * 220;

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function ClaimScreen({ route, navigation }: Props) {
  const { hexesClaimed, distanceKm, elapsedSeconds, punePct, isFirstRun } = route.params;
  const [assembledCount, setAssembledCount] = useState(0);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const soundRef = useRef<Sound | null>(null);
  const sweepX = useRef(new Animated.Value(-220)).current;
  const sweepOpacity = useRef(new Animated.Value(0)).current;
  const statsOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const sound = new Sound('claim.wav', Sound.MAIN_BUNDLE, (error) => {
      if (!error) soundRef.current = sound;
    });

    HEXES.forEach((_, i) => {
      const t = setTimeout(() => {
        setAssembledCount(prev => prev + 1);
      }, i * 220);
      timersRef.current.push(t);
    });

    const sweepTimer = setTimeout(() => {
      soundRef.current?.play();
      runSweep();
    }, ASSEMBLE_DURATION + 300);
    timersRef.current.push(sweepTimer);

    return () => {
      timersRef.current.forEach(clearTimeout);
      soundRef.current?.release();
    };
  }, []);

  const runSweep = () => {
    sweepX.setValue(-220);
    sweepOpacity.setValue(0);

    Animated.sequence([
      Animated.timing(sweepOpacity, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(sweepX, {
          toValue: 440,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(500),
          Animated.timing(sweepOpacity, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start(() => {
      Animated.timing(statsOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start(() => {
        setTimeout(() => {
          navigation.replace('Summary', {
            hexesClaimed,
            distanceKm,
            elapsedSeconds,
            punePct,
            isFirstRun,
          });
        }, 1800);
      });
    });
  };

  return (
    <View style={styles.container}>
      <View style={{ width: 220, height: 220 }}>
        <Svg width={220} height={220} style={StyleSheet.absoluteFill}>
          {HEXES.map((hex, i) => (
            <Polygon
              key={i}
              points={hexPoints(hex.x, hex.y)}
              fill="#3ecfb2"
              opacity={i < assembledCount ? 1 : 0}
              stroke="#000000"
              strokeWidth={2}
            />
          ))}
        </Svg>

        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: 220,
            height: 220,
            opacity: sweepOpacity,
            transform: [{ translateX: sweepX }],
          }}
        >
          <Svg width={220} height={220}>
            <Defs>
              <LinearGradient id="sweep" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0"   stopColor="#000000" stopOpacity="0" />
                <Stop offset="0.4" stopColor="#ffffff" stopOpacity="0" />
                <Stop offset="0.5" stopColor="#ffffff" stopOpacity="0.7" />
                <Stop offset="0.6" stopColor="#3ecfb2" stopOpacity="0.4" />
                <Stop offset="1"   stopColor="#000000" stopOpacity="0" />
              </LinearGradient>
            </Defs>
            <Rect x={0} y={0} width={220} height={220} fill="url(#sweep)" />
          </Svg>
        </Animated.View>
      </View>

      <Animated.View style={[styles.statsContainer, { opacity: statsOpacity }]}>
        <Text style={styles.statNumber}>{hexesClaimed}</Text>
        <Text style={styles.statLabel}>HEXES CLAIMED</Text>
        <View style={styles.statRow}>
          <View style={styles.statItem}>
           <Text style={styles.statRowNumber}>{parseFloat(distanceKm).toFixed(2)}</Text>
            <Text style={styles.statRowLabel}>KM</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statRowNumber}>{formatTime(elapsedSeconds)}</Text>
            <Text style={styles.statRowLabel}>TIME</Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsContainer: {
    alignItems: 'center',
    marginTop: 48,
  },
  statNumber: {
    fontFamily: 'Teko-Bold',
    fontSize: 80,
    lineHeight: 88,
    paddingTop: 10,
    paddingLeft: 10,
    color: '#3ecfb2',
    letterSpacing: 2,
  },
  statLabel: {
    fontFamily: 'SpaceGrotesk-Medium',
    fontSize: 11,
    color: '#3ecfb2',
    letterSpacing: 3,
    opacity: 0.6,
    marginTop: 4,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    gap: 32,
  },
  statItem: {
    alignItems: 'center',
  },
  statRowNumber: {
    fontFamily: 'Teko-Bold',
    fontSize: 32,
    lineHeight: 40,
    paddingTop: 10,
    color: '#ffffff',
    letterSpacing: 1,
  },
  statRowLabel: {
    fontFamily: 'SpaceGrotesk-Medium',
    fontSize: 10,
    color: '#ffffff',
    letterSpacing: 3,
    opacity: 0.4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#ffffff',
    opacity: 0.15,
  },
});

