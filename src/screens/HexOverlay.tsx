import React, { useEffect, useState } from 'react';
import { Polygon } from 'react-native-maps';
import { HexStore } from '../engine/storage';

type Props = {
  claimedHexIds: string[];
  hexStore?: HexStore;
};

function hexIdToCorners(hexId: string): { latitude: number; longitude: number }[] {
  const [q, r] = hexId.split('_').map(Number);
  const HEX_SIZE = 150;
  const EARTH_RADIUS = 6371000;

  const y = (r * HEX_SIZE * 3) / 2;
  const x = (q * HEX_SIZE + y / 3) * Math.sqrt(3);

  const corners = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i + 30);
    const cx = x + HEX_SIZE * Math.cos(angle);
    const cy = y + HEX_SIZE * Math.sin(angle);
    const lat = ((Math.atan(Math.exp(cy / EARTH_RADIUS)) - Math.PI / 4) * 2) * (180 / Math.PI);
    const lng = (cx / EARTH_RADIUS) * (180 / Math.PI);
    corners.push({ latitude: lat, longitude: lng });
  }
  return corners;
}

function depthToColors(depth: number): { fill: string; stroke: string } {
  if (depth === 7) {
    return {
      fill: 'rgba(255, 220, 100, 0.5)',
      stroke: 'rgba(255, 220, 100, 1)',
    };
  }
  const opacity = 0.08 + (depth - 1) * (0.35 / 5);
  const strokeOpacity = 0.3 + (depth - 1) * (0.6 / 5);
  return {
    fill: `rgba(62, 207, 178, ${opacity.toFixed(2)})`,
    stroke: `rgba(62, 207, 178, ${strokeOpacity.toFixed(2)})`,
  };
}

export default function HexOverlay({ claimedHexIds, hexStore }: Props) {
  const [d7GlowOpacity, setD7GlowOpacity] = useState(0.25);
  const [d7GlowUp, setD7GlowUp] = useState(true);

  useEffect(() => {
    const hasD7 = claimedHexIds.some(id => hexStore?.[id]?.depth_level === 7);
    if (!hasD7) return;

    const interval = setInterval(() => {
      setD7GlowOpacity(prev => {
        if (prev >= 0.55) {
          setD7GlowUp(false);
          return prev - 0.015;
        } else if (prev <= 0.15) {
          setD7GlowUp(true);
          return prev + 0.015;
        }
        return d7GlowUp ? prev + 0.015 : prev - 0.015;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [claimedHexIds, hexStore]);

  return (
    <>
      {claimedHexIds.map((id) => {
        const depth = hexStore?.[id]?.depth_level ?? 1;
        const { fill, stroke } = depthToColors(depth);
        const corners = hexIdToCorners(id);

        if (depth === 7) {
          return (
            <React.Fragment key={id}>
              {/* Base gold fill */}
              <Polygon
                coordinates={corners}
                fillColor={fill}
                strokeColor="rgba(255, 220, 100, 1)"
                strokeWidth={2}
              />
              {/* Pulsing glow layer */}
              <Polygon
                coordinates={corners}
                fillColor={`rgba(255, 220, 100, ${d7GlowOpacity.toFixed(3)})`}
                strokeColor={`rgba(255, 200, 50, ${(d7GlowOpacity + 0.3).toFixed(3)})`}
                strokeWidth={3}
              />
            </React.Fragment>
          );
        }

        return (
          <Polygon
            key={id}
            coordinates={corners}
            fillColor={fill}
            strokeColor={stroke}
            strokeWidth={1}
          />
        );
      })}
    </>
  );
}