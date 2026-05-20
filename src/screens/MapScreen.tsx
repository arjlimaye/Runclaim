import React, { useCallback, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ActivityIndicator, Platform } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import MapView, { Region } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import { saveHexStore, HexStore } from '../engine/storage';
import { supabase } from '../lib/supabase';
import HexOverlay from './HexOverlay';

type Props = NativeStackScreenProps<any, 'Map'>;

export default function MapScreen({ navigation }: Props) {
  const [hexStore, setHexStore] = useState<HexStore>({});
  const [region, setRegion] = useState<Region | null>(null);
  const [isDark, setIsDark] = useState(true);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setLoading(true);

      const fetchHexes = async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data, error } = await supabase
              .from('hexes')
              .select('id, owner_id, depth_level, total_runs, last_run_timestamp')
              .eq('owner_id', user.id);

            if (!error && data && !cancelled) {
              const freshStore: HexStore = {};
              for (const row of data) {
                freshStore[row.id] = {
                  owner_id: row.owner_id,
                  depth_level: row.depth_level,
                  total_runs: row.total_runs,
                  last_run_timestamp: row.last_run_timestamp,
                };
              }
              setHexStore(freshStore);
              await saveHexStore(freshStore);
            }
          }
        } catch (err) {
          console.warn('MapScreen: failed to fetch hexes from Supabase', err);
        } finally {
          if (!cancelled) setLoading(false);
        }
      };

      fetchHexes();

      Geolocation.getCurrentPosition(
        pos => {
          if (!cancelled) {
            setRegion({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            });
          }
        },
        () => {
          if (!cancelled) {
            setRegion(r =>
              r ?? {
                latitude: 18.5204,
                longitude: 73.8567,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }
            );
          }
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );

      return () => {
        cancelled = true;
      };
    }, [])
  );

  if (!region) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color="#3ecfb2" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={StyleSheet.absoluteFill}
        initialRegion={region}
        mapType={Platform.OS === 'ios' ? 'mutedStandard' : 'standard'}
        {...(Platform.OS === 'ios' ? { userInterfaceStyle: isDark ? 'dark' : 'light' } : {})}
        showsUserLocation={true}
        showsCompass={false}
        showsScale={false}
      >
        <HexOverlay claimedHexIds={Object.keys(hexStore)} hexStore={hexStore} />
      </MapView>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color="#3ecfb2" />
        </View>
      )}

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
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 110,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 10,
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
