import { MeasurementProfile } from '../types/measurement.types';
import { AvatarProfile } from '../types/avatar.types';

export interface MeasurementProvider {
  extractMeasurements(frontImage: string, sideImage: string, actualHeightCm: number): Promise<MeasurementProfile>;
}

export interface AvatarProvider {
  generateAvatar(measurements: MeasurementProfile, gender?: string): Promise<AvatarProfile>;
}

export interface VTONProvider {
  tryOn(userImageUrl: string, garmentImageUrl: string): Promise<string>;
}

export interface LLMChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
}

export interface LLMProvider {
  chat(messages: LLMChatMessage[], tools?: any[]): Promise<any>;
}
