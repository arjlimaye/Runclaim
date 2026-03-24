import { useState, useEffect, useRef } from 'react';
import Geolocation from '@react-native-community/geolocation';

export type GPSPoint = {
  lat: number;
  lng: number;
  timestamp: number;
  speed: number;
};

const MAX_SPEED_MS = 6;

export function useGPS() {
  const [path, setPath] = useState<GPSPoint[]>([]);
  const [tracking, setTracking] = useState(false);
  const watchId = useRef<number | null>(null);

  const start = () => {
    setPath([]);
    setTracking(true);
  };

  const resume = () => {
    setTracking(true);
  };

  const stop = () => {
    setTracking(false);
    if (watchId.current !== null) {
      Geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
  };

  useEffect(() => {
    if (!tracking) return;

    watchId.current = Geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, speed } = position.coords;
        const spd = speed ?? 0;
        if (spd > MAX_SPEED_MS) return;
        setPath((prev) => [
          ...prev,
          { lat: latitude, lng: longitude, timestamp: Date.now(), speed: spd },
        ]);
      },
      (error) => console.warn('GPS error:', error),
      { enableHighAccuracy: true, distanceFilter: 10 }
    );

    return () => stop();
  }, [tracking]);

  return { path, tracking, start, stop, resume };
}