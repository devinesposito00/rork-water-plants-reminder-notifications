import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, Leaf, Sun, CloudRain, AlertCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { usePlants } from '@/contexts/PlantContext';
import PlantCard from '@/components/PlantCard';
import EmptyState from '@/components/EmptyState';
import Colors from '@/constants/colors';

export default function TodayScreen() {
  const router = useRouter();
  const { plants, categorizedPlants, waterPlant, isLoading } = usePlants();
  const [refreshing, setRefreshing] = React.useState(false);

  const { overdue, dueToday, dueSoon, later } = categorizedPlants;
  const urgentCount = overdue.length + dueToday.length;

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  const handleAddPlant = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/add-plant');
  }, [router]);

  const handlePlantPress = useCallback((plantId: string) => {
    router.push(`/plant/${plantId}`);
  }, [router]);

  const handleWater = useCallback((plantId: string) => {
    waterPlant(plantId);
  }, [waterPlant]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getWeatherIcon = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 18) {
      return <Sun size={24} color={Colors.warning} />;
    }
    return <CloudRain size={24} color={Colors.info} />;
  };

  if (plants.length === 0 && !isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.subtitle}>Let&apos;s add your first plant!</Text>
        </View>
        <EmptyState
          icon={<Leaf size={64} color={Colors.primary} />}
          title="No plants yet"
          description="Start your plant care journey by adding your first green friend."
          actionLabel="Add Your First Plant"
          onAction={handleAddPlant}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.subtitle}>
                {urgentCount > 0
                  ? `${urgentCount} plant${urgentCount > 1 ? 's' : ''} need${urgentCount === 1 ? 's' : ''} attention`
                  : 'All plants are doing well!'}
              </Text>
            </View>
            {getWeatherIcon()}
          </View>
        </View>

        {urgentCount > 0 && (
          <View style={styles.urgentBanner}>
            <AlertCircle size={20} color={Colors.overdue} />
            <Text style={styles.urgentText}>
              {urgentCount} plant{urgentCount > 1 ? 's' : ''} waiting for water
            </Text>
          </View>
        )}

        {overdue.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionDot, { backgroundColor: Colors.overdue }]} />
              <Text style={styles.sectionTitle}>Overdue</Text>
              <Text style={styles.sectionCount}>{overdue.length}</Text>
            </View>
            {overdue.map((plant) => (
              <PlantCard
                key={plant.id}
                plant={plant}
                onPress={() => handlePlantPress(plant.id)}
                onWater={() => handleWater(plant.id)}
              />
            ))}
          </View>
        )}

        {dueToday.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionDot, { backgroundColor: Colors.dueToday }]} />
              <Text style={styles.sectionTitle}>Due Today</Text>
              <Text style={styles.sectionCount}>{dueToday.length}</Text>
            </View>
            {dueToday.map((plant) => (
              <PlantCard
                key={plant.id}
                plant={plant}
                onPress={() => handlePlantPress(plant.id)}
                onWater={() => handleWater(plant.id)}
              />
            ))}
          </View>
        )}

        {dueSoon.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionDot, { backgroundColor: Colors.dueSoon }]} />
              <Text style={styles.sectionTitle}>Due Soon</Text>
              <Text style={styles.sectionCount}>{dueSoon.length}</Text>
            </View>
            {dueSoon.map((plant) => (
              <PlantCard
                key={plant.id}
                plant={plant}
                onPress={() => handlePlantPress(plant.id)}
                onWater={() => handleWater(plant.id)}
                compact
              />
            ))}
          </View>
        )}

        {later.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionDot, { backgroundColor: Colors.healthy }]} />
              <Text style={styles.sectionTitle}>Doing Well</Text>
              <Text style={styles.sectionCount}>{later.length}</Text>
            </View>
            {later.map((plant) => (
              <PlantCard
                key={plant.id}
                plant={plant}
                onPress={() => handlePlantPress(plant.id)}
                onWater={() => handleWater(plant.id)}
                compact
              />
            ))}
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={handleAddPlant}
        activeOpacity={0.8}
        testID="add-plant-fab"
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  urgentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.overdueLight,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
    gap: 10,
  },
  urgentText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.overdue,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    flex: 1,
  },
  sectionCount: {
    fontSize: 14,
    color: Colors.textTertiary,
    fontWeight: '500' as const,
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
