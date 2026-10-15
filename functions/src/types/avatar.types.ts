export interface AvatarProfile {
  uid: string;
  avatarId: string;
  modelUrl: string; // Storage URL for 3D model or 2D composite
  type: '2D' | '3D';
  createdAt: string;
  updatedAt: string;
}
