// src/engine/mapStyle.ts
// Custom map style — near-black, desaturated. Premium, calm aesthetic.

export const MAP_STYLE = [
  // Base land — near-black
  {
    featureType: 'landscape',
    elementType: 'geometry',
    stylers: [{ color: '#0d0d0d' }],
  },
  // Water — very dark navy, subtle distinction from land
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#0a0f1a' }],
  },
  // Roads — dim, low contrast
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#1a1a1a' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#111111' }],
  },
  // Road labels — faint
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#444444' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#0d0d0d' }],
  },
  // POI — hidden
  {
    featureType: 'poi',
    stylers: [{ visibility: 'off' }],
  },
  // Transit — hidden
  {
    featureType: 'transit',
    stylers: [{ visibility: 'off' }],
  },
  // Admin boundaries — faint outline
  {
    featureType: 'administrative',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#222222' }, { weight: 0.5 }],
  },
  // Area labels — dim
  {
    featureType: 'administrative',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#555555' }],
  },
  {
    featureType: 'administrative',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#0d0d0d' }],
  },
];