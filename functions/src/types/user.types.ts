export interface UserProfile {
  uid: string;
  email: string;
  credits: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  uid: string;
  favoriteBrands: string[];
  dislikedColors: string[];
  stylePreference: string;
  createdAt: string;
  updatedAt: string;
}
