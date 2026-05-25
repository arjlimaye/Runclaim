import React, { useEffect, useState } from 'react';
import { Polygon } from 'react-native-maps';
import { HexStore } from '../engine/storage';
import { hexIdToPolygon } from '../engine/hexGrid';

type Props = {
  claimedHexIds: string[];
  hexStore?: HexStore;
};

const DEPTH_COLORS: Record<number, { fill: string; stroke: string }> = {
  1: { fill: 'rgba(62,207,178,0.15)', stroke: 'rgba(62,207,178,0.6)' },
  2: { fill: 'rgba(62,207,178,0.20)', stroke: 'rgba(62,207,178,0.7)' },
  3: { fill: 'rgba(62,207,178,0.25)', stroke: 'rgba(62,207,178,0.75)' },
  4: { fill: 'rgba(62,207,178,0.30)', stroke: 'rgba(62,207,178,0.8)' },
  5: { fill: 'rgba(62,207,178,0.35)', stroke: 'rgba(62,207,178,0.85)' },
  6: { fill: 'rgba(62,207,178,0.40)', stroke: 'rgba(62,207,178,0.9)' },
  7: { fill: 'rgba(255, 220, 100, 0.5)', stroke: 'rgba(255, 220, 100, 1)' },
};

function depthToColors(depth: number): { fill: string; stroke: string } {
  return DEPTH_COLORS[depth] ?? DEPTH_COLORS[1];
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
        const corners = hexIdToPolygon(id);
        if (corners.length === 0) return null;

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
                strokeColor={`rgba(255, 200, 50, ${Math.min(d7GlowOpacity + 0.3, 1).toFixed(3)})`}
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
            strokeWidth={1.5}
          />
        );
      })}
    </>
  );
}