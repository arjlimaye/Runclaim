import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import MapView, { Region } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import { loadHexStore, HexStore } from '../engine/storage';
import HexOverlay from './HexOverlay';

type Props = NativeStackScreenProps<any, 'Map'>;

export default function MapScreen({ navigation }: Props) {
  const [hexStore, setHexStore] = useState<HexStore>({});
  const [region, setRegion] = useState<Region | null>(null);
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    loadHexStore().then(setHexStore);
    Geolocation.getCurrentPosition(
      pos => {
        setRegion({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
      },
      () => {
        setRegion({
          latitude: 18.5204,
          longitude: 73.8567,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  }, []);

  if (!region) return <View style={styles.container} />;

  return (
    <View style={styles.container}>
      <MapView
        style={StyleSheet.absoluteFill}
        initialRegion={region}
        mapType="mutedStandard"
        userInterfaceStyle={isDark ? 'dark' : 'light'}
        showsUserLocation={true}
        showsCompass={false}
        showsScale={false}
      >
        <HexOverlay claimedHexIds={Object.keys(hexStore)} hexStore={hexStore} />
      </MapView>

      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>BACK</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.themeButton} onPress={() => setIsDark(prev => !prev)}>
        <Text style={styles.themeText}>{isDark ? '☀️' : '🌙'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3ecfb2',
  },
  backText: {
    fontFamily: 'SpaceGrotesk-Medium',
    fontSize: 12,
    color: '#3ecfb2',
    letterSpacing: 2,
  },
  themeButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3ecfb2',
  },
  themeText: {
    fontSize: 16,
  },
});