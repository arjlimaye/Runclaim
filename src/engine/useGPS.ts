import { useState, useEffect, useRef } from 'react';
import { Platform, AppState } from 'react-native';
import Geolocation from '@react-native-community/geolocation';

export type GPSPoint = {
  lat: number;
  lng: number;
  timestamp: number;
  speed: number;
};

const MAX_SPEED_MS = 12;       // spike rejection: > 43 km/h
const MAX_ACCURACY_M = 20;
const MIN_DISTANCE_M = 4;      // ignore duplicate points when standing still
const EARTH_RADIUS = 6371000;

const WATCH_OPTIONS = {
  enableHighAccuracy: true,
  distanceFilter: 4,
  timeout: 30000,
  ...(Platform.OS === 'android' ? { interval: 1000, fastestInterval: 500 } : {}),
  ...(Platform.OS === 'ios' ? { showsBackgroundLocationIndicator: true } : {}),
  pausesLocationUpdatesAutomatically: false,
};

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const a = sinDLat * sinDLat +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * sinDLng * sinDLng;
  return EARTH_RADIUS * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function useGPS() {
  const [path, setPath] = useState<GPSPoint[]>([]);
  const [tracking, setTracking] = useState(false);
  const watchId = useRef<number | null>(null);
  const trackingRef = useRef(false);
  const lastPointTimeRef = useRef<number>(0);
  const lastAcceptedPoint = useRef<GPSPoint | null>(null);

  const startWatch = () => {
    if (watchId.current !== null) {
      Geolocation.clearWatch(watchId.current);
    }
    lastPointTimeRef.current = Date.now();
    watchId.current = Geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, speed, accuracy } = position.coords;
        if ((accuracy ?? Infinity) > MAX_ACCURACY_M) return;

        const now = Date.now();
        const last = lastAcceptedPoint.current;

        if (last !== null) {
          const dist = haversineMeters(last.lat, last.lng, latitude, longitude);
          if (dist < MIN_DISTANCE_M) return;
          const dt = (now - last.timestamp) / 1000;
          if (dt > 0 && dist / dt > MAX_SPEED_MS) return; // GPS spike
        }

        const spd = speed ?? 0;
        const newPoint: GPSPoint = { lat: latitude, lng: longitude, timestamp: now, speed: spd };
        lastAcceptedPoint.current = newPoint;
        lastPointTimeRef.current = now;
        setPath((prev) => [...prev, newPoint]);
      },
      (error) => console.warn('GPS error:', error),
      WATCH_OPTIONS
    );
  };

  const start = () => {
    setPath([]);
    lastAcceptedPoint.current = null;
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

  // Restart GPS watcher if it stalls after app returns to foreground
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
