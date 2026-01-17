import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import {
  Bell,
  Clock,
  Layers,
  Thermometer,
  Trash2,
  ChevronRight,

} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { usePlants } from '@/contexts/PlantContext';
import { GroupingMode, HomeClimate } from '@/types/plant';
import Colors from '@/constants/colors';

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 15, 30, 45];

export default function SettingsScreen() {
  const { settings, updateSettings, requestNotificationPermission, plants } = usePlants();
  const [showTimePicker, setShowTimePicker] = useState(false);

  const handleToggleReminders = useCallback(async (value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (value) {
      const granted = await requestNotificationPermission();
      if (!granted && Platform.OS !== 'web') {
        Alert.alert(
          'Notifications Disabled',
          'Please enable notifications in your device settings to receive watering reminders.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
        return;
      }
    }
    
    updateSettings({ remindersEnabled: value });
  }, [requestNotificationPermission, updateSettings]);

  const handleGroupingChange = useCallback((mode: GroupingMode) => {
    Haptics.selectionAsync();
    updateSettings({ groupingMode: mode });
  }, [updateSettings]);

  const handleClimateChange = useCallback((climate: HomeClimate) => {
    Haptics.selectionAsync();
    updateSettings({ homeClimate: climate });
  }, [updateSettings]);

  const handleTimeSelect = useCallback((hour: number, minute: number) => {
    Haptics.selectionAsync();
    updateSettings({ reminderHour: hour, reminderMinute: minute });
    setShowTimePicker(false);
  }, [updateSettings]);

  const handleResetData = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      'Reset All Data',
      'This will permanently delete all your plants and watering history. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Data Reset', 'All data has been cleared.');
          },
        },
      ]
    );
  }, []);

  const formatTime = (hour: number, minute: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    const displayMinute = minute.toString().padStart(2, '0');
    return `${displayHour}:${displayMinute} ${period}`;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: Colors.primaryLight + '20' }]}>
                <Bell size={20} color={Colors.primary} />
              </View>
              <View>
                <Text style={styles.settingLabel}>Watering Reminders</Text>
                <Text style={styles.settingDescription}>Get notified when plants need water</Text>
              </View>
            </View>
            <Switch
              value={settings.remindersEnabled}
              onValueChange={handleToggleReminders}
              trackColor={{ false: Colors.border, true: Colors.secondary }}
              thumbColor={Colors.surface}
            />
          </View>

          {settings.remindersEnabled && (
            <>
              <View style={styles.divider} />
              
              <TouchableOpacity
                style={styles.settingRow}
                onPress={() => setShowTimePicker(!showTimePicker)}
              >
                <View style={styles.settingLeft}>
                  <View style={[styles.iconContainer, { backgroundColor: Colors.warning + '20' }]}>
                    <Clock size={20} color={Colors.warning} />
                  </View>
                  <View>
                    <Text style={styles.settingLabel}>Reminder Time</Text>
                    <Text style={styles.settingDescription}>
                      {formatTime(settings.reminderHour, settings.reminderMinute)}
                    </Text>
                  </View>
                </View>
                <ChevronRight size={20} color={Colors.textTertiary} />
              </TouchableOpacity>

              {showTimePicker && (
                <View style={styles.timePickerContainer}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.timePickerScroll}
                  >
                    {HOURS.map((hour) =>
                      MINUTES.map((minute) => (
                        <TouchableOpacity
                          key={`${hour}-${minute}`}
                          style={[
                            styles.timeOption,
                            settings.reminderHour === hour &&
                              settings.reminderMinute === minute &&
                              styles.timeOptionActive,
                          ]}
                          onPress={() => handleTimeSelect(hour, minute)}
                        >
                          <Text
                            style={[
                              styles.timeOptionText,
                              settings.reminderHour === hour &&
                                settings.reminderMinute === minute &&
                                styles.timeOptionTextActive,
                            ]}
                          >
                            {formatTime(hour, minute)}
                          </Text>
                        </TouchableOpacity>
                      ))
                    )}
                  </ScrollView>
                </View>
              )}

              <View style={styles.divider} />

              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <View style={[styles.iconContainer, { backgroundColor: Colors.info + '20' }]}>
                    <Layers size={20} color={Colors.info} />
                  </View>
                  <View>
                    <Text style={styles.settingLabel}>Grouping Mode</Text>
                    <Text style={styles.settingDescription}>How to receive notifications</Text>
                  </View>
                </View>
              </View>

              <View style={styles.optionsContainer}>
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    settings.groupingMode === 'dailyDigest' && styles.optionButtonActive,
                  ]}
                  onPress={() => handleGroupingChange('dailyDigest')}
                >
                  <Text
                    style={[
                      styles.optionText,
                      settings.groupingMode === 'dailyDigest' && styles.optionTextActive,
                    ]}
                  >
                    Daily Digest
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    settings.groupingMode === 'perPlant' && styles.optionButtonActive,
                  ]}
                  onPress={() => handleGroupingChange('perPlant')}
                >
                  <Text
                    style={[
                      styles.optionText,
                      settings.groupingMode === 'perPlant' && styles.optionTextActive,
                    ]}
                  >
                    Per Plant
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Environment</Text>
        
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: Colors.accent + '20' }]}>
                <Thermometer size={20} color={Colors.accent} />
              </View>
              <View>
                <Text style={styles.settingLabel}>Home Climate</Text>
                <Text style={styles.settingDescription}>Affects watering schedules</Text>
              </View>
            </View>
          </View>

          <View style={styles.optionsContainer}>
            {(['dry', 'normal', 'humid'] as HomeClimate[]).map((climate) => (
              <TouchableOpacity
                key={climate}
                style={[
                  styles.optionButton,
                  settings.homeClimate === climate && styles.optionButtonActive,
                ]}
                onPress={() => handleClimateChange(climate)}
              >
                <Text
                  style={[
                    styles.optionText,
                    settings.homeClimate === climate && styles.optionTextActive,
                  ]}
                >
                  {climate.charAt(0).toUpperCase() + climate.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data</Text>
        
        <View style={styles.card}>
          <View style={styles.statsRow}>
            <Text style={styles.statsLabel}>Total Plants</Text>
            <Text style={styles.statsValue}>{plants.length}</Text>
          </View>
          
          <View style={styles.divider} />
          
          <TouchableOpacity style={styles.dangerRow} onPress={handleResetData}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: Colors.error + '20' }]}>
                <Trash2 size={20} color={Colors.error} />
              </View>
              <Text style={styles.dangerLabel}>Reset All Data</Text>
            </View>
            <ChevronRight size={20} color={Colors.textTertiary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Water Your Plants v1.0.0</Text>
        <Text style={styles.footerSubtext}>Made with 🌿 for plant lovers</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginLeft: 4,
    marginBottom: 8,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  settingDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginHorizontal: 16,
  },
  timePickerContainer: {
    padding: 16,
    paddingTop: 0,
  },
  timePickerScroll: {
    gap: 8,
  },
  timeOption: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.borderLight,
    marginRight: 8,
  },
  timeOptionActive: {
    backgroundColor: Colors.primary,
  },
  timeOptionText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  timeOptionTextActive: {
    color: Colors.textInverse,
  },
  optionsContainer: {
    flexDirection: 'row',
    padding: 16,
    paddingTop: 8,
    gap: 8,
  },
  optionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: Colors.borderLight,
    alignItems: 'center',
  },
  optionButtonActive: {
    backgroundColor: Colors.primary,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
  },
  optionTextActive: {
    color: Colors.textInverse,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  statsLabel: {
    fontSize: 16,
    color: Colors.text,
  },
  statsValue: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  dangerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  dangerLabel: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: Colors.error,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  footerText: {
    fontSize: 14,
    color: Colors.textTertiary,
  },
  footerSubtext: {
    fontSize: 13,
    color: Colors.textTertiary,
    marginTop: 4,
  },
});
