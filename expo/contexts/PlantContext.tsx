import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback, useMemo } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import {
  Plant,
  WateringLog,
  UserSettings,
  DEFAULT_SETTINGS,
  WateringAmount,
} from '@/types/plant';
import { calculateNextDueDate, getDaysUntilDue, getDueStatus } from '@/utils/scheduling';

const PLANTS_STORAGE_KEY = '@water_plants:plants';
const LOGS_STORAGE_KEY = '@water_plants:logs';
const SETTINGS_STORAGE_KEY = '@water_plants:settings';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const [PlantProvider, usePlants] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [isInitialized, setIsInitialized] = useState(false);

  const plantsQuery = useQuery({
    queryKey: ['plants'],
    queryFn: async (): Promise<Plant[]> => {
      try {
        const stored = await AsyncStorage.getItem(PLANTS_STORAGE_KEY);
        console.log('[PlantContext] Loaded plants from storage');
        return stored ? JSON.parse(stored) : [];
      } catch (error) {
        console.error('[PlantContext] Error loading plants:', error);
        return [];
      }
    },
  });

  const logsQuery = useQuery({
    queryKey: ['wateringLogs'],
    queryFn: async (): Promise<WateringLog[]> => {
      try {
        const stored = await AsyncStorage.getItem(LOGS_STORAGE_KEY);
        console.log('[PlantContext] Loaded watering logs from storage');
        return stored ? JSON.parse(stored) : [];
      } catch (error) {
        console.error('[PlantContext] Error loading logs:', error);
        return [];
      }
    },
  });

  const settingsQuery = useQuery({
    queryKey: ['settings'],
    queryFn: async (): Promise<UserSettings> => {
      try {
        const stored = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
        console.log('[PlantContext] Loaded settings from storage');
        return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
      } catch (error) {
        console.error('[PlantContext] Error loading settings:', error);
        return DEFAULT_SETTINGS;
      }
    },
  });

  const plants = useMemo(() => plantsQuery.data ?? [], [plantsQuery.data]);
  const logs = useMemo(() => logsQuery.data ?? [], [logsQuery.data]);
  const settings = useMemo(() => settingsQuery.data ?? DEFAULT_SETTINGS, [settingsQuery.data]);

  useEffect(() => {
    if (plantsQuery.isSuccess && logsQuery.isSuccess && settingsQuery.isSuccess) {
      setIsInitialized(true);
    }
  }, [plantsQuery.isSuccess, logsQuery.isSuccess, settingsQuery.isSuccess]);

  const { mutate: savePlants } = useMutation({
    mutationFn: async (newPlants: Plant[]) => {
      await AsyncStorage.setItem(PLANTS_STORAGE_KEY, JSON.stringify(newPlants));
      return newPlants;
    },
    onSuccess: (newPlants) => {
      queryClient.setQueryData(['plants'], newPlants);
    },
  });

  const { mutate: saveLogs } = useMutation({
    mutationFn: async (newLogs: WateringLog[]) => {
      await AsyncStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(newLogs));
      return newLogs;
    },
    onSuccess: (newLogs) => {
      queryClient.setQueryData(['wateringLogs'], newLogs);
    },
  });

  const { mutate: saveSettings } = useMutation({
    mutationFn: async (newSettings: UserSettings) => {
      await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
      return newSettings;
    },
    onSuccess: (newSettings) => {
      queryClient.setQueryData(['settings'], newSettings);
    },
  });

  const addPlant = useCallback((plant: Omit<Plant, 'id' | 'createdAt' | 'updatedAt' | 'nextDueAt'>) => {
    const now = new Date().toISOString();
    const newPlant: Plant = {
      ...plant,
      id: `plant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
      updatedAt: now,
      nextDueAt: calculateNextDueDate(
        plant.lastWateredAt,
        plant.baseIntervalDays,
        plant.seasonalProfile,
        plant.seasonalAdjustmentEnabled,
        settings.homeClimate
      ),
    };
    console.log('[PlantContext] Adding plant:', newPlant.name);
    savePlants([...plants, newPlant]);
    return newPlant;
  }, [plants, settings.homeClimate, savePlants]);

  const updatePlant = useCallback((id: string, updates: Partial<Plant>) => {
    const updatedPlants = plants.map((p) => {
      if (p.id === id) {
        const updated = { ...p, ...updates, updatedAt: new Date().toISOString() };
        if (updates.lastWateredAt || updates.baseIntervalDays || updates.seasonalProfile || updates.seasonalAdjustmentEnabled !== undefined) {
          updated.nextDueAt = calculateNextDueDate(
            updated.lastWateredAt,
            updated.baseIntervalDays,
            updated.seasonalProfile,
            updated.seasonalAdjustmentEnabled,
            settings.homeClimate
          );
        }
        return updated;
      }
      return p;
    });
    console.log('[PlantContext] Updating plant:', id);
    savePlants(updatedPlants);
  }, [plants, settings.homeClimate, savePlants]);

  const deletePlant = useCallback((id: string) => {
    console.log('[PlantContext] Deleting plant:', id);
    savePlants(plants.filter((p) => p.id !== id));
    saveLogs(logs.filter((l) => l.plantId !== id));
  }, [plants, logs, savePlants, saveLogs]);

  const waterPlant = useCallback((plantId: string, amount?: WateringAmount, note?: string) => {
    const now = new Date().toISOString();
    const newLog: WateringLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      plantId,
      date: now,
      amount,
      note,
    };
    console.log('[PlantContext] Watering plant:', plantId);
    saveLogs([...logs, newLog]);
    
    const updatedPlants = plants.map((p) => {
      if (p.id === plantId) {
        const updated = { ...p, lastWateredAt: now, updatedAt: now };
        updated.nextDueAt = calculateNextDueDate(
          updated.lastWateredAt,
          updated.baseIntervalDays,
          updated.seasonalProfile,
          updated.seasonalAdjustmentEnabled,
          settings.homeClimate
        );
        return updated;
      }
      return p;
    });
    savePlants(updatedPlants);
  }, [logs, plants, settings.homeClimate, saveLogs, savePlants]);

  const updateSettings = useCallback((updates: Partial<UserSettings>) => {
    const newSettings = { ...settings, ...updates };
    console.log('[PlantContext] Updating settings:', updates);
    saveSettings(newSettings);
  }, [settings, saveSettings]);

  const requestNotificationPermission = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === 'web') {
      console.log('[PlantContext] Notifications not supported on web');
      return false;
    }
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      const granted = finalStatus === 'granted';
      saveSettings({ ...settings, notificationPermissionGranted: granted });
      console.log('[PlantContext] Notification permission:', granted);
      return granted;
    } catch (error) {
      console.error('[PlantContext] Error requesting notification permission:', error);
      return false;
    }
  }, [settings, saveSettings]);

  const scheduleNotifications = useCallback(async () => {
    if (Platform.OS === 'web' || !settings.remindersEnabled) return;
    
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      
      const activePlants = plants.filter((p) => !p.isPaused && p.nextDueAt);
      
      if (settings.groupingMode === 'dailyDigest') {
        const dueToday = activePlants.filter((p) => {
          const days = getDaysUntilDue(p.nextDueAt);
          return days !== null && days <= 0;
        });
        
        if (dueToday.length > 0) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: '🌿 Time to water your plants!',
              body: `You have ${dueToday.length} plant${dueToday.length > 1 ? 's' : ''} that need${dueToday.length === 1 ? 's' : ''} water today.`,
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DAILY,
              hour: settings.reminderHour,
              minute: settings.reminderMinute,
            },
          });
        }
      } else {
        for (const plant of activePlants) {
          const daysUntil = getDaysUntilDue(plant.nextDueAt);
          if (daysUntil !== null && daysUntil <= 1) {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: `🌱 ${plant.name} needs water`,
                body: daysUntil <= 0 ? 'This plant is due for watering!' : 'Due tomorrow',
              },
              trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DAILY,
                hour: settings.reminderHour,
                minute: settings.reminderMinute,
              },
            });
          }
        }
      }
      console.log('[PlantContext] Scheduled notifications');
    } catch (error) {
      console.error('[PlantContext] Error scheduling notifications:', error);
    }
  }, [plants, settings]);

  useEffect(() => {
    if (isInitialized && settings.remindersEnabled) {
      scheduleNotifications();
    }
  }, [isInitialized, settings.remindersEnabled, scheduleNotifications]);

  const getPlantLogs = useCallback((plantId: string): WateringLog[] => {
    return logs
      .filter((l) => l.plantId === plantId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [logs]);

  const categorizedPlants = useMemo(() => {
    const overdue: Plant[] = [];
    const dueToday: Plant[] = [];
    const dueSoon: Plant[] = [];
    const later: Plant[] = [];
    const paused: Plant[] = [];

    plants.forEach((plant) => {
      if (plant.isPaused) {
        paused.push(plant);
        return;
      }
      const days = getDaysUntilDue(plant.nextDueAt);
      const status = getDueStatus(days);
      
      switch (status) {
        case 'overdue':
          overdue.push(plant);
          break;
        case 'today':
          dueToday.push(plant);
          break;
        case 'soon':
          dueSoon.push(plant);
          break;
        default:
          later.push(plant);
      }
    });

    return { overdue, dueToday, dueSoon, later, paused };
  }, [plants]);

  return {
    plants,
    logs,
    settings,
    isLoading: !isInitialized,
    categorizedPlants,
    addPlant,
    updatePlant,
    deletePlant,
    waterPlant,
    updateSettings,
    getPlantLogs,
    requestNotificationPermission,
    scheduleNotifications,
  };
});
