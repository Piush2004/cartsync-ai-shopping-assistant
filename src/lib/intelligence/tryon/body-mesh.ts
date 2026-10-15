import { BodyMesh, Coordinate3D } from './types';
import * as crypto from 'crypto';

const meshCache = new Map<string, BodyMesh>();

/**
 * Generates and caches 3D landmarks from the user's effective measurements.
 */
export function generateBodyMesh(effectiveMeasurements: Record<string, number>): BodyMesh {
  // Generate a hash of the measurements to use as a cache key
  const hash = crypto.createHash('md5').update(JSON.stringify(effectiveMeasurements)).digest('hex');

  if (meshCache.has(hash)) {
    return meshCache.get(hash)!;
  }

  // Generate Mesh Landmarks (Mock representation)
  const chest = effectiveMeasurements['chest'] || 100;
  const waist = effectiveMeasurements['waist'] || 80;
  const inseam = effectiveMeasurements['inseam'] || 80;

  const landmarks: Record<string, Coordinate3D> = {
    'left_shoulder': { x: -chest * 0.2, y: 140, z: 0 },
    'right_shoulder': { x: chest * 0.2, y: 140, z: 0 },
    'chest_center': { x: 0, y: 120, z: chest * 0.15 },
    'waist_center': { x: 0, y: 100, z: waist * 0.15 },
    'left_hip': { x: -waist * 0.2, y: 95, z: 0 },
    'right_hip': { x: waist * 0.2, y: 95, z: 0 },
    'left_ankle': { x: -10, y: 100 - inseam, z: 0 },
    'right_ankle': { x: 10, y: 100 - inseam, z: 0 }
  };

  const mesh: BodyMesh = {
    landmarks,
    volume: chest * waist * 1.5, // Mock volume calc
    hash
  };

  meshCache.set(hash, mesh);
  return mesh;
}
