import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Dimensions,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Polygon } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

type Props = { onDone: () => void };

export default function OnboardingScreen({ onDone }: Props) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const goNext = async () => {
    if (currentSlide < 3) {
      const next = currentSlide + 1;
      setCurrentSlide(next);
      scrollRef.current?.scrollTo({ x: next * width, animated: true });
    } else {
      await AsyncStorage.setItem('runclaim_onboarding_done', 'true');
      onDone();
    }
  };

  const Dots = ({ active }: { active: number }) => (
    <View style={styles.dots}>
      {[0, 1, 2, 3].map(i => (
        <View key={i} style={[styles.dot, i === active && styles.dotActive]} />
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        style={{ flex: 1 }}>

        {/* SLIDE 1 */}
        <View style={styles.slide}>
          <View style={[styles.content, { paddingTop: height * 0.32 }]}>
            <Svg width={60} height={60} viewBox="0 0 48 48" style={styles.visual}>
              <Polygon
                points="24,3 45,15 45,33 24,45 3,33 3,15"
                fill="none"
                stroke="rgba(62,207,178,0.4)"
                strokeWidth="1.5"
              />
              <Polygon
                points="24,11 38,19 38,29 24,37 10,29 10,19"
                fill="rgba(62,207,178,0.1)"
                stroke="#3ecfb2"
                strokeWidth="1.5"
              />
            </Svg>
            <Text style={styles.tag}>RunClaim</Text>
            <Text style={styles.headline}>{'Your city.\nUnclaimed.'}</Text>
            <Text style={styles.body}>
              Every street you run through becomes yours.
            </Text>
          </View>
          <View style={styles.bottom}>
            <Dots active={0} />
            <TouchableOpacity style={styles.btn} onPress={goNext} activeOpacity={0.85}>
              <Text style={styles.btnText}>Next</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* SLIDE 2 */}
        <View style={styles.slide}>
          <View style={[styles.content, { paddingTop: height * 0.2 }]}>
            <View style={[styles.visual, styles.hexGrid]}>
              {[
                { fill: 'rgba(62,207,178,0.06)', stroke: 'rgba(62,207,178,0.3)' },
                { fill: 'rgba(62,207,178,0.15)', stroke: 'rgba(62,207,178,0.55)' },
                { fill: 'rgba(62,207,178,0.3)', stroke: 'rgba(62,207,178,0.85)' },
                { fill: 'rgba(255,220,100,0.45)', stroke: 'rgba(255,220,100,1)' },
                { fill: 'rgba(62,207,178,0.06)', stroke: 'rgba(62,207,178,0.2)' },
                { fill: 'rgba(62,207,178,0.06)', stroke: 'rgba(62,207,178,0.16)' },
                { fill: 'rgba(62,207,178,0.2)', stroke: 'rgba(62,207,178,0.6)' },
                { fill: 'rgba(62,207,178,0.06)', stroke: 'rgba(62,207,178,0.2)' },
              ].map((hex, i) => (
                <View key={i} style={styles.hexCell}>
                  <Svg width={52} height={46} viewBox="0 0 30 26">
                    <Polygon
                      points="15,2 28,9 28,23 15,30 2,23 2,9"
                      fill={hex.fill}
                      stroke={hex.stroke}
                      strokeWidth="1.5"
                    />
                  </Svg>
                </View>
              ))}
            </View>
            <Text style={styles.tag}>How it works</Text>
            <Text style={styles.headline}>{'Run through it.\nThe hex is yours.'}</Text>
            <Text style={styles.body}>
              Run the same hex again and it gets deeper. D7 is Sacred.
            </Text>
          </View>
          <View style={styles.bottom}>
            <Dots active={1} />
            <TouchableOpacity style={styles.btn} onPress={goNext} activeOpacity={0.85}>
              <Text style={styles.btnText}>Next</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* SLIDE 3 */}
        <View style={styles.slide}>
          <View style={[styles.content, { paddingTop: height * 0.22 }]}>
            <Svg width={60} height={60} viewBox="0 0 48 48" style={styles.visual}>
              <Polygon
                points="24,3 45,15 45,33 24,45 3,33 3,15"
                fill="rgba(255,200,60,0.1)"
                stroke="rgba(255,200,60,0.4)"
                strokeWidth="1.5"
              />
              <Polygon
                points="24,11 38,19 38,29 24,37 10,29 10,19"
                fill="rgba(255,200,60,0.25)"
                stroke="rgba(255,200,60,0.8)"
                strokeWidth="1.5"
              />
            </Svg>
            <Text style={styles.tag}>Depth</Text>
            <Text style={styles.headlineLarge}>{'Depth\nis earned.'}</Text>
            <Text style={styles.body}>D1 is a claim. D7 is a statement.</Text>
          </View>
          <View style={styles.bottom}>
            <Dots active={2} />
            <TouchableOpacity style={styles.btn} onPress={goNext} activeOpacity={0.85}>
              <Text style={styles.btnText}>Next</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* SLIDE 4 */}
        <View style={styles.slide}>
          <View style={[styles.content, { paddingTop: height * 0.22 }]}>
            <Svg width={60} height={60} viewBox="0 0 72 72" style={styles.visual}>
              <Polygon
                points="36,4 68,22 68,50 36,68 4,50 4,22"
                fill="none"
                stroke="rgba(62,207,178,0.2)"
                strokeWidth="1.5"
              />
              <Polygon
                points="36,14 58,27 58,45 36,58 14,45 14,27"
                fill="rgba(62,207,178,0.07)"
                stroke="rgba(62,207,178,0.5)"
                strokeWidth="1.5"
              />
              <Polygon
                points="36,24 48,31 48,43 36,50 24,43 24,31"
                fill="rgba(62,207,178,0.15)"
                stroke="#3ecfb2"
                strokeWidth="1.5"
              />
            </Svg>
            <Text style={styles.tag}>Ready.</Text>
            <Text style={styles.headline}>
              {'Start\n'}
              <Text style={{ color: '#3ecfb2' }}>claiming.</Text>
            </Text>
            <Text style={styles.body}>
              Create your account and run your first hex today.
            </Text>
          </View>
          <View style={styles.bottom}>
            <Dots active={3} />
            <TouchableOpacity style={styles.btn} onPress={goNext} activeOpacity={0.85}>
              <Text style={styles.btnText}>Create Account</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080808',
  },
  slide: {
    width,
    flex: 1,
    paddingHorizontal: 28,
    paddingBottom: 44,
  },
  content: {
    flex: 1,
  },
  visual: {
    marginBottom: 28,
  },
  tag: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 9,
    letterSpacing: 3,
    color: 'rgba(255,255,255,0.65)',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  headline: {
    fontFamily: 'Teko-Bold',
    fontSize: 58,
    color: '#ffffff',
    lineHeight: 68,
    paddingTop: 6,
    marginBottom: 20,
    overflow: 'visible',
  },
  headlineLarge: {
    fontFamily: 'Teko-Bold',
    fontSize: 70,
    color: '#ffffff',
    lineHeight: 80,
    paddingTop: 6,
    marginBottom: 20,
    overflow: 'visible',
  },
  body: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 22,
  },
  hexGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: width * 0.55,
  },
  hexCell: {
    width: '25%',
    padding: 3,
  },
  bottom: {
    gap: 10,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
    marginBottom: 18,
  },
  dot: {
    width: 6,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#333',
  },
  dotActive: {
    width: 20,
    backgroundColor: '#3ecfb2',
  },
  btn: {
    backgroundColor: '#3ecfb2',
    borderRadius: 3,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#3ecfb2',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.20,
    shadowRadius: 16,
  },
  btnText: {
    fontFamily: 'SpaceGrotesk-SemiBold',
    fontSize: 16,
    letterSpacing: 5,
    color: '#050505',
    textTransform: 'uppercase',
  },
});