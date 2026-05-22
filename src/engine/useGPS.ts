import { useState, useEffect, useRef } from 'react';
import { Platform, AppState } from 'react-native';
import Geolocation from '@react-native-community/geolocation';

export type GPSPoint = {
  lat: number;
  lng: number;
  timestamp: number;
  speed: number;
};

const MAX_SPEED_MS = 6;
const MAX_ACCURACY_M = 20; // FIX 4: filter out inaccurate points

const WATCH_OPTIONS = {
  enableHighAccuracy: true,
  distanceFilter: 5, // FIX 4: back to 5
  timeout: 30000,    // FIX 2: prevent watcher from silently dying
  ...(Platform.OS === 'android' ? { interval: 1000, fastestInterval: 500 } : {}),
  ...(Platform.OS === 'ios' ? { showsBackgroundLocationIndicator: true } : {}),
  pausesLocationUpdatesAutomatically: false,
};

export function useGPS() {
  const [path, setPath] = useState<GPSPoint[]>([]);
  const [tracking, setTracking] = useState(false);
  const watchId = useRef<number | null>(null);
  const trackingRef = useRef(false);       // FIX 2: readable inside AppState callback
  const lastPointTimeRef = useRef<number>(0); // FIX 2: detect GPS stall

  const startWatch = () => {
    if (watchId.current !== null) {
      Geolocation.clearWatch(watchId.current);
    }
    lastPointTimeRef.current = Date.now();
    watchId.current = Geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, speed, accuracy } = position.coords;
        // FIX 4: skip points with poor accuracy
        if ((accuracy ?? Infinity) > MAX_ACCURACY_M) return;
        const spd = speed ?? 0;
        if (spd > MAX_SPEED_MS) return;
        lastPointTimeRef.current = Date.now();
        setPath((prev) => [
          ...prev,
          { lat: latitude, lng: longitude, timestamp: Date.now(), speed: spd },
        ]);
      },
      (error) => console.warn('GPS error:', error),
      WATCH_OPTIONS
    );
  };

  const start = () => {
    setPath([]);
    trackingRef.current = true;
    setTracking(true);
  };

  const resume = () => {
    trackingRef.current = true;
    setTracking(true);
  };

  const stop = () => {
    trackingRef.current = false;
    setTracking(false);
    if (watchId.current !== null) {
      Geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
  };

  useEffect(() => {
    if (!tracking) return;
    startWatch();
    return () => {
      if (watchId.current !== null) {
        Geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
    };
  }, [tracking]);

  // FIX 2: restart GPS watcher if it stalls after app returns to foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active' && trackingRef.current) {
        const elapsed = Date.now() - lastPointTimeRef.current;
        if (elapsed > 10000) {
          startWatch();
        }
      }
    });
    return () => sub.remove();
  }, []);

  return { path, tracking, start, stop, resume };
}
