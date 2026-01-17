import { SeasonalProfile, LightLevel, PotSize, SoilType, HomeClimate } from '@/types/plant';

const BASE_INTERVALS: Record<SeasonalProfile, { min: number; max: number }> = {
  tropical: { min: 5, max: 10 },
  succulent: { min: 14, max: 21 },
  leafy: { min: 5, max: 10 },
  flowering: { min: 4, max: 8 },
  herb: { min: 3, max: 7 },
  custom: { min: 7, max: 14 },
};

const LIGHT_ADJUSTMENTS: Record<LightLevel, number> = {
  direct: -2,
  brightIndirect: -1,
  medium: 0,
  low: 3,
};

const POT_SIZE_ADJUSTMENTS: Record<PotSize, number> = {
  small: -2,
  medium: 0,
  large: 2,
};

const SOIL_ADJUSTMENTS: Record<SoilType, number> = {
  fastDraining: -1,
  standard: 0,
  moistureRetentive: 2,
};

const CLIMATE_MULTIPLIERS: Record<HomeClimate, number> = {
  dry: 0.85,
  normal: 1.0,
  humid: 1.15,
};

interface SeasonalMultiplier {
  spring: number;
  summer: number;
  fall: number;
  winter: number;
}

const SEASONAL_MULTIPLIERS: Record<SeasonalProfile, SeasonalMultiplier> = {
  tropical: { spring: 0.85, summer: 0.75, fall: 1.0, winter: 1.2 },
  succulent: { spring: 0.9, summer: 0.85, fall: 1.0, winter: 1.6 },
  leafy: { spring: 0.8, summer: 0.75, fall: 1.0, winter: 1.3 },
  flowering: { spring: 0.75, summer: 0.7, fall: 1.0, winter: 1.4 },
  herb: { spring: 0.8, summer: 0.75, fall: 1.0, winter: 1.3 },
  custom: { spring: 0.85, summer: 0.8, fall: 1.0, winter: 1.25 },
};

function getSeason(month: number): keyof SeasonalMultiplier {
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 9) return 'fall';
  return 'winter';
}

export function calculateBaseInterval(
  profile: SeasonalProfile,
  light: LightLevel,
  potSize: PotSize,
  soilType: SoilType
): number {
  const { min, max } = BASE_INTERVALS[profile];
  const baseInterval = Math.round((min + max) / 2);
  
  const lightAdjust = LIGHT_ADJUSTMENTS[light];
  const potAdjust = POT_SIZE_ADJUSTMENTS[potSize];
  const soilAdjust = SOIL_ADJUSTMENTS[soilType];
  
  const adjustedInterval = baseInterval + lightAdjust + potAdjust + soilAdjust;
  
  return Math.max(1, Math.min(adjustedInterval, 30));
}

export function calculateAdjustedInterval(
  baseInterval: number,
  profile: SeasonalProfile,
  seasonalAdjustmentEnabled: boolean,
  homeClimate: HomeClimate
): number {
  let interval = baseInterval;
  
  if (seasonalAdjustmentEnabled) {
    const currentMonth = new Date().getMonth();
    const season = getSeason(currentMonth);
    const seasonalMultiplier = SEASONAL_MULTIPLIERS[profile][season];
    interval = Math.round(interval * seasonalMultiplier);
  }
  
  const climateMultiplier = CLIMATE_MULTIPLIERS[homeClimate];
  interval = Math.round(interval * climateMultiplier);
  
  return Math.max(1, Math.min(interval, 60));
}

export function calculateNextDueDate(
  lastWateredAt: string | undefined,
  baseInterval: number,
  profile: SeasonalProfile,
  seasonalAdjustmentEnabled: boolean,
  homeClimate: HomeClimate
): string {
  const adjustedInterval = calculateAdjustedInterval(
    baseInterval,
    profile,
    seasonalAdjustmentEnabled,
    homeClimate
  );
  
  const baseDate = lastWateredAt ? new Date(lastWateredAt) : new Date();
  const nextDue = new Date(baseDate);
  nextDue.setDate(nextDue.getDate() + adjustedInterval);
  
  return nextDue.toISOString();
}

export function getDaysUntilDue(nextDueAt: string | undefined): number | null {
  if (!nextDueAt) return null;
  
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  
  const dueDate = new Date(nextDueAt);
  dueDate.setHours(0, 0, 0, 0);
  
  const diffTime = dueDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

export function getDueStatus(daysUntil: number | null): 'overdue' | 'today' | 'soon' | 'later' | 'unknown' {
  if (daysUntil === null) return 'unknown';
  if (daysUntil < 0) return 'overdue';
  if (daysUntil === 0) return 'today';
  if (daysUntil <= 3) return 'soon';
  return 'later';
}

export function formatDueText(daysUntil: number | null): string {
  if (daysUntil === null) return 'Schedule not set';
  if (daysUntil < -1) return `Overdue by ${Math.abs(daysUntil)} days`;
  if (daysUntil === -1) return 'Overdue by 1 day';
  if (daysUntil === 0) return 'Due today';
  if (daysUntil === 1) return 'Due tomorrow';
  return `Due in ${daysUntil} days`;
}

export function formatLastWatered(lastWateredAt: string | undefined): string {
  if (!lastWateredAt) return 'Never watered';
  
  const date = new Date(lastWateredAt);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  
  const diffTime = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
