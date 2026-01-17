import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Search, Plus, Leaf } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { usePlants } from '@/contexts/PlantContext';
import EmptyState from '@/components/EmptyState';
import { Plant, SeasonalProfile, PROFILE_ICONS } from '@/types/plant';
import { getDaysUntilDue, getDueStatus, formatDueText } from '@/utils/scheduling';
import Colors from '@/constants/colors';

type FilterType = 'all' | SeasonalProfile | 'overdue' | 'paused';

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'tropical', label: '🌴 Tropical' },
  { key: 'succulent', label: '🌵 Succulent' },
  { key: 'leafy', label: '🌿 Leafy' },
  { key: 'flowering', label: '🌸 Flowering' },
  { key: 'herb', label: '🌱 Herb' },
  { key: 'paused', label: 'Paused' },
];

export default function PlantsScreen() {
  const router = useRouter();
  const { plants, isLoading } = usePlants();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  const filteredPlants = useMemo(() => {
    let result = plants;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.species?.toLowerCase().includes(query) ||
          p.locationInHome?.toLowerCase().includes(query)
      );
    }

    if (activeFilter !== 'all') {
      if (activeFilter === 'overdue') {
        result = result.filter((p) => {
          const days = getDaysUntilDue(p.nextDueAt);
          return days !== null && days < 0 && !p.isPaused;
        });
      } else if (activeFilter === 'paused') {
        result = result.filter((p) => p.isPaused);
      } else {
        result = result.filter((p) => p.seasonalProfile === activeFilter);
      }
    }

    return result.sort((a, b) => {
      const daysA = getDaysUntilDue(a.nextDueAt) ?? 999;
      const daysB = getDaysUntilDue(b.nextDueAt) ?? 999;
      return daysA - daysB;
    });
  }, [plants, searchQuery, activeFilter]);

  const handleAddPlant = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/add-plant');
  }, [router]);

  const handlePlantPress = useCallback((plantId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/plant/${plantId}`);
  }, [router]);

  const handleFilterPress = useCallback((filter: FilterType) => {
    Haptics.selectionAsync();
    setActiveFilter(filter);
  }, []);

  const getStatusColor = (plant: Plant) => {
    if (plant.isPaused) return Colors.textTertiary;
    const days = getDaysUntilDue(plant.nextDueAt);
    const status = getDueStatus(days);
    switch (status) {
      case 'overdue': return Colors.overdue;
      case 'today': return Colors.dueToday;
      case 'soon': return Colors.dueSoon;
      default: return Colors.primary;
    }
  };

  if (plants.length === 0 && !isLoading) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon={<Leaf size={64} color={Colors.primary} />}
          title="Your garden is empty"
          description="Add plants to keep track of their watering schedules."
          actionLabel="Add Plant"
          onAction={handleAddPlant}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color={Colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search plants..."
            placeholderTextColor={Colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersScroll}
        contentContainerStyle={styles.filtersContent}
      >
        {FILTERS.map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterChip,
              activeFilter === filter.key && styles.filterChipActive,
            ]}
            onPress={() => handleFilterPress(filter.key)}
          >
            <Text
              style={[
                styles.filterText,
                activeFilter === filter.key && styles.filterTextActive,
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.gridContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        <Text style={styles.resultCount}>
          {filteredPlants.length} plant{filteredPlants.length !== 1 ? 's' : ''}
        </Text>

        <View style={styles.grid}>
          {filteredPlants.map((plant) => (
            <TouchableOpacity
              key={plant.id}
              style={styles.gridItem}
              onPress={() => handlePlantPress(plant.id)}
              activeOpacity={0.7}
            >
              {plant.photoUri ? (
                <Image source={{ uri: plant.photoUri }} style={styles.gridImage} />
              ) : (
                <View style={[styles.gridImage, styles.placeholderImage]}>
                  <Text style={styles.profileIcon}>{PROFILE_ICONS[plant.seasonalProfile]}</Text>
                </View>
              )}
              <View style={styles.gridItemInfo}>
                <Text style={styles.gridItemName} numberOfLines={1}>{plant.name}</Text>
                <Text style={[styles.gridItemStatus, { color: getStatusColor(plant) }]}>
                  {plant.isPaused ? 'Paused' : formatDueText(getDaysUntilDue(plant.nextDueAt))}
                </Text>
              </View>
              <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(plant) }]} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={handleAddPlant}
        activeOpacity={0.8}
      >
        <Plus size={28} color={Colors.textInverse} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    marginLeft: 10,
  },
  filtersScroll: {
    maxHeight: 44,
  },
  filtersContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  filterTextActive: {
    color: Colors.textInverse,
  },
  scrollView: {
    flex: 1,
  },
  gridContainer: {
    paddingTop: 16,
  },
  resultCount: {
    fontSize: 13,
    color: Colors.textTertiary,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
  },
  gridItem: {
    width: '50%',
    padding: 4,
  },
  gridImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
  },
  placeholderImage: {
    backgroundColor: Colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIcon: {
    fontSize: 40,
  },
  gridItemInfo: {
    padding: 8,
  },
  gridItemName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  gridItemStatus: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500' as const,
  },
  statusIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  bottomPadding: {
    height: 100,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});
