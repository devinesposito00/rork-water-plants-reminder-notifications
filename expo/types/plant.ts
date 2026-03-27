export type LightLevel = 'low' | 'medium' | 'brightIndirect' | 'direct';
export type PotSize = 'small' | 'medium' | 'large';
export type SoilType = 'fastDraining' | 'standard' | 'moistureRetentive';
export type WateringMode = 'recommended' | 'customInterval';
export type SeasonalProfile = 'tropical' | 'succulent' | 'leafy' | 'flowering' | 'herb' | 'custom';
export type WateringAmount = 'light' | 'normal' | 'deep';
export type GroupingMode = 'perPlant' | 'dailyDigest';
export type HomeClimate = 'dry' | 'normal' | 'humid';
export type Units = 'imperial' | 'metric';

export interface Plant {
  id: string;
  name: string;
  species?: string;
  photoUri?: string;
  light: LightLevel;
  potSize: PotSize;
  soilType: SoilType;
  locationInHome?: string;
  wateringMode: WateringMode;
  baseIntervalDays: number;
  seasonalAdjustmentEnabled: boolean;
  seasonalProfile: SeasonalProfile;
  lastWateredAt?: string;
  nextDueAt?: string;
  notes?: string;
  isPaused: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WateringLog {
  id: string;
  plantId: string;
  date: string;
  amount?: WateringAmount;
  note?: string;
}

export interface UserSettings {
  remindersEnabled: boolean;
  reminderHour: number;
  reminderMinute: number;
  groupingMode: GroupingMode;
  defaultSeasonalMode: boolean;
  homeClimate: HomeClimate;
  units: Units;
  notificationPermissionGranted: boolean;
}

export const DEFAULT_SETTINGS: UserSettings = {
  remindersEnabled: false,
  reminderHour: 9,
  reminderMinute: 0,
  groupingMode: 'dailyDigest',
  defaultSeasonalMode: true,
  homeClimate: 'normal',
  units: 'imperial',
  notificationPermissionGranted: false,
};

export const LIGHT_LABELS: Record<LightLevel, string> = {
  low: 'Low Light',
  medium: 'Medium Light',
  brightIndirect: 'Bright Indirect',
  direct: 'Direct Sun',
};

export const POT_SIZE_LABELS: Record<PotSize, string> = {
  small: 'Small (2-4")',
  medium: 'Medium (5-8")',
  large: 'Large (9"+)',
};

export const SOIL_TYPE_LABELS: Record<SoilType, string> = {
  fastDraining: 'Fast Draining',
  standard: 'Standard Mix',
  moistureRetentive: 'Moisture Retentive',
};

export const PROFILE_LABELS: Record<SeasonalProfile, string> = {
  tropical: 'Tropical',
  succulent: 'Succulent/Cactus',
  leafy: 'Leafy Green',
  flowering: 'Flowering',
  herb: 'Herb',
  custom: 'Custom',
};

export const PROFILE_ICONS: Record<SeasonalProfile, string> = {
  tropical: '🌴',
  succulent: '🌵',
  leafy: '🌿',
  flowering: '🌸',
  herb: '🌱',
  custom: '🪴',
};
