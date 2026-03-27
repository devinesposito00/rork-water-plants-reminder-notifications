import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Image } from 'expo-image';
import { Droplets, Pause, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Plant, PROFILE_ICONS } from '@/types/plant';
import { getDaysUntilDue, getDueStatus, formatDueText } from '@/utils/scheduling';
import Colors from '@/constants/colors';

interface PlantCardProps {
  plant: Plant;
  onPress: () => void;
  onWater: () => void;
  compact?: boolean;
}

export default function PlantCard({ plant, onPress, onWater, compact = false }: PlantCardProps) {
  const daysUntil = getDaysUntilDue(plant.nextDueAt);
  const status = getDueStatus(daysUntil);
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const getStatusColor = () => {
    if (plant.isPaused) return Colors.textTertiary;
    switch (status) {
      case 'overdue': return Colors.overdue;
      case 'today': return Colors.dueToday;
      case 'soon': return Colors.dueSoon;
      default: return Colors.primary;
    }
  };

  const getStatusBgColor = () => {
    if (plant.isPaused) return Colors.borderLight;
    switch (status) {
      case 'overdue': return Colors.overdueLight;
      case 'today': return Colors.dueTodayLight;
      case 'soon': return Colors.dueSoonLight;
      default: return Colors.successLight;
    }
  };

  const handleWaterPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    onWater();
  }, [onWater, scaleAnim]);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }, [onPress]);

  if (compact) {
    return (
      <TouchableOpacity
        style={styles.compactCard}
        onPress={handlePress}
        activeOpacity={0.7}
        testID={`plant-card-${plant.id}`}
      >
        <View style={styles.compactLeft}>
          {plant.photoUri ? (
            <Image source={{ uri: plant.photoUri }} style={styles.compactImage} />
          ) : (
            <View style={[styles.compactImage, styles.placeholderImage]}>
              <Text style={styles.profileIcon}>{PROFILE_ICONS[plant.seasonalProfile]}</Text>
            </View>
          )}
          <View style={styles.compactInfo}>
            <Text style={styles.compactName} numberOfLines={1}>{plant.name}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusBgColor() }]}>
              <Text style={[styles.statusText, { color: getStatusColor() }]}>
                {plant.isPaused ? 'Paused' : formatDueText(daysUntil)}
              </Text>
            </View>
          </View>
        </View>
        {!plant.isPaused && (
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <TouchableOpacity
              style={[styles.waterButton, { backgroundColor: getStatusColor() }]}
              onPress={handleWaterPress}
              testID={`water-button-${plant.id}`}
            >
              <Droplets size={18} color={Colors.textInverse} />
            </TouchableOpacity>
          </Animated.View>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handlePress}
      activeOpacity={0.7}
      testID={`plant-card-${plant.id}`}
    >
      <View style={styles.cardContent}>
        {plant.photoUri ? (
          <Image source={{ uri: plant.photoUri }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.placeholderImage]}>
            <Text style={styles.largeProfileIcon}>{PROFILE_ICONS[plant.seasonalProfile]}</Text>
          </View>
        )}
        <View style={styles.info}>
          <View style={styles.header}>
            <Text style={styles.name} numberOfLines={1}>{plant.name}</Text>
            {plant.isPaused && (
              <Pause size={14} color={Colors.textTertiary} />
            )}
          </View>
          {plant.species && (
            <Text style={styles.species} numberOfLines={1}>{plant.species}</Text>
          )}
          <View style={[styles.statusBadge, { backgroundColor: getStatusBgColor() }]}>
            <Text style={[styles.statusText, { color: getStatusColor() }]}>
              {plant.isPaused ? 'Paused' : formatDueText(daysUntil)}
            </Text>
          </View>
        </View>
        <View style={styles.actions}>
          {!plant.isPaused && (
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <TouchableOpacity
                style={[styles.waterButtonLarge, { backgroundColor: getStatusColor() }]}
                onPress={handleWaterPress}
                testID={`water-button-${plant.id}`}
              >
                <Droplets size={20} color={Colors.textInverse} />
              </TouchableOpacity>
            </Animated.View>
          )}
          <ChevronRight size={20} color={Colors.textTertiary} style={styles.chevron} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  placeholderImage: {
    backgroundColor: Colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIcon: {
    fontSize: 20,
  },
  largeProfileIcon: {
    fontSize: 28,
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    flex: 1,
  },
  species: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500' as const,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  waterButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  waterButtonLarge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chevron: {
    marginLeft: 4,
  },
  compactCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 4,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  compactLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  compactImage: {
    width: 44,
    height: 44,
    borderRadius: 10,
  },
  compactInfo: {
    marginLeft: 10,
    flex: 1,
  },
  compactName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
});
