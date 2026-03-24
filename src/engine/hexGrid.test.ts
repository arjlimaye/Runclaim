test('same location returns same hex ID', () => {
  const id1 = latLngToHexId(18.5204, 73.8567);
  const id2 = latLngToHexId(18.5204, 73.8567);
  expect(id1).toBe(id2);
});

test('nearby locations return same hex ID', () => {
  const id1 = latLngToHexId(18.52040, 73.85670);
  const id2 = latLngToHexId(18.52041, 73.85671); // ~1m away
  expect(id1).toBe(id2);
});
test('far locations return different hex IDs', () => {
  const id1 = latLngToHexId(18.5204, 73.8567);
  const id2 = latLngToHexId(18.5304, 73.8667); // ~1.5km away
  expect(id1).not.toBe(id2);
});

import { latLngToHexId, getClaimedHexes } from './hexGrid';

test('run path returns at least one claimed hex', () => {
  const path = [
    { lat: 18.5204, lng: 73.8567 },
    { lat: 18.5205, lng: 73.8568 },
    { lat: 18.5206, lng: 73.8569 },
    { lat: 18.5210, lng: 73.8580 },
    { lat: 18.5215, lng: 73.8590 },
  ];
  const claimed = getClaimedHexes(path);
  expect(claimed.length).toBeGreaterThan(0);
});

test('short path still claims hexes', () => {
  const path = [
    { lat: 18.5204, lng: 73.8567 },
    { lat: 18.5204, lng: 73.8567 },
  ];
  const claimed = getClaimedHexes(path);
  expect(claimed.length).toBeGreaterThan(0);
});