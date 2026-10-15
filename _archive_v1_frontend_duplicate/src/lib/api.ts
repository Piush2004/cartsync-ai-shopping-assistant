import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

export async function callFunction<T = unknown>(name: string, data?: Record<string, unknown>): Promise<T> {
  const fn = httpsCallable(functions, name);
  const result = await fn(data);
  return result.data as T;
}

export const chatAPI = (message: string, sessionId: string) =>
  callFunction('chat', { message, sessionId });

export interface BodyProfile {
  height: number;
  weight: number;
  chest?: number;
  waist?: number;
  hips?: number;
  preferredFit?: string;
}

export const sizingAPI = (bodyProfile: BodyProfile, productId: string, category: string) =>
  callFunction('sizing', { bodyProfile, productId, category });

export const vtonAPI = (
  imageUrl: string,
  productId: string,
  userGender: string,
  productGender: string,
  productCategory: string
) =>
  callFunction('vton', { imageUrl, productId, userGender, productGender, productCategory });
