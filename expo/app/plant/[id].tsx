import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import {
  Droplets,
  Calendar,
  Trash2,
  Pause,
  Play,
  Clock,
  ChevronRight,
} from 'lucide-react-native';
import { usePlants } from '@/contexts/PlantContext';
import {
  PROFILE_LABELS,
  PROFILE_ICONS,
  LIGHT_LABELS,
  POT_SIZE_LABELS,
  SOIL_TYPE_LABELS,
} from '@/types/plant';
import {
  getDaysUntilDue,
  getDueStatus,
  formatDueText,
  formatLastWatered,
} from '@/utils/scheduling';
import Colors from '@/constants/colors';

export default function PlantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { plants, updatePlant, deletePlant, waterPlant, getPlantLogs } = usePlants();
  const [showHistory, setShowHistory] = useState(false);

  const plant = useMemo(() => plants.find((p) => p.id === id), [plants, id]);
  const logs = useMemo(() => (plant ? getPlantLogs(plant.id) : []), [plant, getPlantLogs]);

  const daysUntil = useMemo(() => (plant ? getDaysUntilDue(plant.nextDueAt) : null), [plant]);
  const status = useMemo(() => getDueStatus(daysUntil), [daysUntil]);

  const getStatusColor = useCallback(() => {
    if (!plant || plant.isPaused) return Colors.textTertiary;
    switch (status) {
      case 'overdue':
        return Colors.overdue;
      case 'today':
        return Colors.dueToday;
      case 'soon':
        return Colors.dueSoon;
      default:
        return Colors.primary;
    }
  }, [plant, status]);

  const handleWater = useCallback(() => {
    if (!plant) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    waterPlant(plant.id);
  }, [plant, waterPlant]);

  const handleTogglePause = useCallback(() => {
    if (!plant) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    updatePlant(plant.id, { isPaused: !plant.isPaused });
  }, [plant, updatePlant]);

  const handleToggleSeasonal = useCallback((value: boolean) => {
    if (!plant) return;
    updatePlant(plant.id, { seasonalAdjustmentEnabled: value });
  }, [plant, updatePlant]);

  const handleDelete = useCallback(() => {
    if (!plant) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      'Delete Plant',
      `Are you sure you want to delete "${plant.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deletePlant(plant.id);
            router.back();
          },
        },
      ]
    );
  }, [plant, deletePlant, router]);

  if (!plant) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Plant not found</Text>
      </View>
    );
  }

  const statusColor = getStatusColor();

  return (
    <>
      <Stack.Screen
        options={{
          title: plant.name,
          headerStyle: { backgroundColor: Colors.surface },
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.heroSection}>
          {plant.photoUri ? (
            <Image source={{ uri: plant.photoUri }} style={styles.heroImage} />
          ) : (
            <View style={[styles.heroImage, styles.heroPlaceholder]}>
              <Text style={styles.heroIcon}>{PROFILE_ICONS[plant.seasonalProfile]}</Text>
            </View>
          )}

          <View style={styles.heroInfo}>
            <Text style={styles.plantName}>{plant.name}</Text>
            {plant.species && <Text style={styles.plantSpecies}>{plant.species}</Text>}
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>
                {plant.isPaused ? 'Paused' : formatDueText(daysUntil)}
              </Text>
            </View>
          </View>
        </View>

        {!plant.isPaused && (
          <TouchableOpacity
            style={[styles.waterButton, { backgroundColor: statusColor }]}
            onPress={handleWater}
            activeOpacity={0.8}
          >
            <Droplets size={24} color={Colors.textInverse} />
            <Text style={styles.waterButtonText}>Mark as Watered</Text>
          </TouchableOpacity>
        )}

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Calendar size={20} color={Colors.primary} />
            <Text style={styles.statValue}>{formatLastWatered(plant.lastWateredAt)}</Text>
            <Text style={styles.statLabel}>Last Watered</Text>
          </View>
          <View style={styles.statCard}>
            <Clock size={20} color={Colors.secondary} />
            <Text style={styles.statValue}>{plant.baseIntervalDays} days</Text>
            <Text style={styles.statLabel}>Base Interval</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Plant Details</Text>
          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Type</Text>
              <Text style={styles.detailValue}>
                {PROFILE_ICONS[plant.seasonalProfile]} {PROFILE_LABELS[plant.seasonalProfile]}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Light</Text>
              <Text style={styles.detailValue}>{LIGHT_LABELS[plant.light]}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Pot Size</Text>
              <Text style={styles.detailValue}>{POT_SIZE_LABELS[plant.potSize]}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Soil</Text>
              <Text style={styles.detailValue}>{SOIL_TYPE_LABELS[plant.soilType]}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Schedule Settings</Text>
          <View style={styles.settingsCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Seasonal Adjustments</Text>
                <Text style={styles.settingDescription}>
                  Automatically adjust watering based on season
                </Text>
              </View>
              <Switch
                value={plant.seasonalAdjustmentEnabled}
                onValueChange={handleToggleSeasonal}
                trackColor={{ false: Colors.border, true: Colors.secondary }}
                thumbColor={Colors.surface}
              />
            </View>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.settingRow} onPress={handleTogglePause}>
              <View style={styles.settingInfo}>
                <View style={styles.settingLabelRow}>
                  {plant.isPaused ? (
                    <Play size={18} color={Colors.success} />
                  ) : (
                    <Pause size={18} color={Colors.warning} />
                  )}
                  <Text style={styles.settingLabel}>
                    {plant.isPaused ? 'Resume Reminders' : 'Pause Reminders'}
                  </Text>
                </View>
                <Text style={styles.settingDescription}>
                  {plant.isPaused
                    ? 'Start receiving watering reminders again'
                    : 'Pause reminders when traveling or during dormancy'}
                </Text>
              </View>
              <ChevronRight size={20} color={Colors.textTertiary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => setShowHistory(!showHistory)}
          >
            <Text style={styles.sectionTitle}>Watering History</Text>
            <View style={styles.historyBadge}>
              <Text style={styles.historyCount}>{logs.length}</Text>
            </View>
            <ChevronRight
              size={20}
              color={Colors.textTertiary}
              style={{ transform: [{ rotate: showHistory ? '90deg' : '0deg' }] }}
            />
          </TouchableOpacity>

          {showHistory && (
            <View style={styles.historyCard}>
              {logs.length === 0 ? (
                <Text style={styles.noHistoryText}>No watering history yet</Text>
              ) : (
                logs.slice(0, 10).map((log) => (
                  <View key={log.id} style={styles.historyItem}>
                    <Droplets size={16} color={Colors.info} />
                    <Text style={styles.historyDate}>
                      {new Date(log.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Text>
                    {log.amount && (
                      <Text style={styles.historyAmount}>{log.amount}</Text>
                    )}
                  </View>
                ))
              )}
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Trash2 size={20} color={Colors.error} />
          <Text style={styles.deleteButtonText}>Delete Plant</Text>
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingBottom: 40,
  },
  notFound: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  notFoundText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  heroImage: {
    width: 140,
    height: 140,
    borderRadius: 70,
    marginBottom: 16,
  },
  heroPlaceholder: {
    backgroundColor: Colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroIcon: {
    fontSize: 56,
  },
  heroInfo: {
    alignItems: 'center',
  },
  plantName: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  plantSpecies: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  waterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
    marginBottom: 20,
  },
  waterButtonText: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.textInverse,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
  },
  historyBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 8,
  },
  historyCount: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textInverse,
  },
  detailsCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    overflow: 'hidden',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  detailLabel: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  settingsCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingInfo: {
    flex: 1,
    marginRight: 12,
  },
  settingLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  settingDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginHorizontal: 16,
  },
  historyCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
  },
  noHistoryText: {
    fontSize: 14,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  historyDate: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
  },
  historyAmount: {
    fontSize: 13,
    color: Colors.textSecondary,
    textTransform: 'capitalize',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.errorLight,
    gap: 8,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: Colors.error,
  },
  bottomPadding: {
    height: 40,
  },
});
