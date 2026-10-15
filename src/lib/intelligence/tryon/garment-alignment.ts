import { BodyMesh, Coordinate3D } from './types';

/**
 * Anchors the garment to the body mesh landmarks.
 */
export function alignGarment(mesh: BodyMesh, garmentType: string): Record<string, Coordinate3D> {
  const positions: Record<string, Coordinate3D> = {};

  if (garmentType === 'tops') {
    positions['collar'] = { x: 0, y: mesh.landmarks['left_shoulder'].y, z: 5 };
    positions['left_sleeve'] = mesh.landmarks['left_shoulder'];
    positions['right_sleeve'] = mesh.landmarks['right_shoulder'];
    positions['hem'] = mesh.landmarks['waist_center'];
  } else if (garmentType === 'bottoms') {
    positions['waistband'] = mesh.landmarks['waist_center'];
    positions['left_leg_opening'] = mesh.landmarks['left_ankle'];
    positions['right_leg_opening'] = mesh.landmarks['right_ankle'];
  }

  return positions;
}
