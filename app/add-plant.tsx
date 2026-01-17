import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Camera,
  Check,
} from 'lucide-react-native';
import { usePlants } from '@/contexts/PlantContext';
import {
  SeasonalProfile,
  LightLevel,
  PotSize,
  SoilType,
  PROFILE_LABELS,
  PROFILE_ICONS,
  LIGHT_LABELS,
  POT_SIZE_LABELS,
  SOIL_TYPE_LABELS,
} from '@/types/plant';
import { calculateBaseInterval } from '@/utils/scheduling';
import Colors from '@/constants/colors';

type Step = 1 | 2 | 3 | 4;

export default function AddPlantScreen() {
  const router = useRouter();
  const { addPlant, settings } = usePlants();
  const [step, setStep] = useState<Step>(1);

  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [photoUri, setPhotoUri] = useState<string | undefined>();
  const [profile, setProfile] = useState<SeasonalProfile>('leafy');
  const [light, setLight] = useState<LightLevel>('medium');
  const [potSize, setPotSize] = useState<PotSize>('medium');
  const [soilType, setSoilType] = useState<SoilType>('standard');
  const [lastWatered, setLastWatered] = useState<'today' | 'yesterday' | 'week' | 'unknown'>('today');

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  const handlePickImage = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const handleNext = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step < 4) {
      setStep((s) => (s + 1) as Step);
    }
  }, [step]);

  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step > 1) {
      setStep((s) => (s - 1) as Step);
    }
  }, [step]);

  const handleSave = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    let lastWateredAt: string | undefined;
    const now = new Date();

    switch (lastWatered) {
      case 'today':
        lastWateredAt = now.toISOString();
        break;
      case 'yesterday':
        now.setDate(now.getDate() - 1);
        lastWateredAt = now.toISOString();
        break;
      case 'week':
        now.setDate(now.getDate() - 7);
        lastWateredAt = now.toISOString();
        break;
      default:
        lastWateredAt = undefined;
    }

    const baseInterval = calculateBaseInterval(profile, light, potSize, soilType);

    addPlant({
      name: name.trim(),
      species: species.trim() || undefined,
      photoUri,
      seasonalProfile: profile,
      light,
      potSize,
      soilType,
      wateringMode: 'recommended',
      baseIntervalDays: baseInterval,
      seasonalAdjustmentEnabled: settings.defaultSeasonalMode,
      lastWateredAt,
      isPaused: false,
    });

    router.back();
  }, [name, species, photoUri, profile, light, potSize, soilType, lastWatered, addPlant, settings.defaultSeasonalMode, router]);

  const canProceed = () => {
    switch (step) {
      case 1:
        return name.trim().length > 0;
      case 2:
      case 3:
      case 4:
        return true;
      default:
        return false;
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3, 4].map((s) => (
        <View
          key={s}
          style={[
            styles.stepDot,
            s === step && styles.stepDotActive,
            s < step && styles.stepDotComplete,
          ]}
        />
      ))}
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Add a New Plant</Text>
      <Text style={styles.stepDescription}>Give your plant a name and optionally add a photo</Text>

      <TouchableOpacity style={styles.photoButton} onPress={handlePickImage}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.photoPreview} />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Camera size={32} color={Colors.textTertiary} />
            <Text style={styles.photoPlaceholderText}>Add Photo</Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Plant Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Living Room Monstera"
          placeholderTextColor={Colors.textTertiary}
          value={name}
          onChangeText={setName}
          autoFocus
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Species (optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Monstera deliciosa"
          placeholderTextColor={Colors.textTertiary}
          value={species}
          onChangeText={setSpecies}
        />
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Plant Type</Text>
      <Text style={styles.stepDescription}>Choose the category that best matches your plant</Text>

      <View style={styles.optionsGrid}>
        {(Object.keys(PROFILE_LABELS) as SeasonalProfile[]).map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.optionCard, profile === p && styles.optionCardActive]}
            onPress={() => {
              Haptics.selectionAsync();
              setProfile(p);
            }}
          >
            <Text style={styles.optionIcon}>{PROFILE_ICONS[p]}</Text>
            <Text style={[styles.optionLabel, profile === p && styles.optionLabelActive]}>
              {PROFILE_LABELS[p]}
            </Text>
            {profile === p && (
              <View style={styles.checkMark}>
                <Check size={14} color={Colors.textInverse} />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Environment</Text>
      <Text style={styles.stepDescription}>Tell us about your plant&apos;s living conditions</Text>

      <View style={styles.environmentSection}>
        <Text style={styles.environmentLabel}>Light Level</Text>
        <View style={styles.environmentOptions}>
          {(Object.keys(LIGHT_LABELS) as LightLevel[]).map((l) => (
            <TouchableOpacity
              key={l}
              style={[styles.envOption, light === l && styles.envOptionActive]}
              onPress={() => {
                Haptics.selectionAsync();
                setLight(l);
              }}
            >
              <Text style={[styles.envOptionText, light === l && styles.envOptionTextActive]}>
                {LIGHT_LABELS[l]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.environmentSection}>
        <Text style={styles.environmentLabel}>Pot Size</Text>
        <View style={styles.environmentOptions}>
          {(Object.keys(POT_SIZE_LABELS) as PotSize[]).map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.envOption, potSize === p && styles.envOptionActive]}
              onPress={() => {
                Haptics.selectionAsync();
                setPotSize(p);
              }}
            >
              <Text style={[styles.envOptionText, potSize === p && styles.envOptionTextActive]}>
                {POT_SIZE_LABELS[p]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.environmentSection}>
        <Text style={styles.environmentLabel}>Soil Type</Text>
        <View style={styles.environmentOptions}>
          {(Object.keys(SOIL_TYPE_LABELS) as SoilType[]).map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.envOption, soilType === s && styles.envOptionActive]}
              onPress={() => {
                Haptics.selectionAsync();
                setSoilType(s);
              }}
            >
              <Text style={[styles.envOptionText, soilType === s && styles.envOptionTextActive]}>
                {SOIL_TYPE_LABELS[s]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Last Watered</Text>
      <Text style={styles.stepDescription}>When did you last water this plant?</Text>

      <View style={styles.lastWateredOptions}>
        {[
          { key: 'today', label: 'Today' },
          { key: 'yesterday', label: 'Yesterday' },
          { key: 'week', label: 'About a week ago' },
          { key: 'unknown', label: "I don't remember" },
        ].map((option) => (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.lastWateredOption,
              lastWatered === option.key && styles.lastWateredOptionActive,
            ]}
            onPress={() => {
              Haptics.selectionAsync();
              setLastWatered(option.key as typeof lastWatered);
            }}
          >
            <Text
              style={[
                styles.lastWateredText,
                lastWatered === option.key && styles.lastWateredTextActive,
              ]}
            >
              {option.label}
            </Text>
            {lastWatered === option.key && (
              <Check size={20} color={Colors.primary} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Schedule Preview</Text>
        <Text style={styles.summaryText}>
          Based on your settings, we recommend watering every{' '}
          <Text style={styles.summaryHighlight}>
            {calculateBaseInterval(profile, light, potSize, soilType)} days
          </Text>
          {settings.defaultSeasonalMode && ', adjusted seasonally'}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <X size={24} color={Colors.text} />
          </TouchableOpacity>
          {renderStepIndicator()}
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
        </ScrollView>

        <View style={styles.footer}>
          {step > 1 ? (
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <ChevronLeft size={20} color={Colors.primary} />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.backButton} />
          )}

          <TouchableOpacity
            style={[styles.nextButton, !canProceed() && styles.nextButtonDisabled]}
            onPress={step === 4 ? handleSave : handleNext}
            disabled={!canProceed()}
          >
            <Text style={styles.nextButtonText}>
              {step === 4 ? 'Add Plant' : 'Continue'}
            </Text>
            {step < 4 && <ChevronRight size={20} color={Colors.textInverse} />}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  stepIndicator: {
    flexDirection: 'row',
    gap: 8,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  stepDotActive: {
    backgroundColor: Colors.primary,
    width: 24,
  },
  stepDotComplete: {
    backgroundColor: Colors.secondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  stepContent: {
    paddingTop: 20,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 32,
  },
  photoButton: {
    alignSelf: 'center',
    marginBottom: 32,
  },
  photoPreview: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  photoPlaceholderText: {
    fontSize: 13,
    color: Colors.textTertiary,
    marginTop: 8,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  optionCard: {
    width: '47%',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
  },
  optionCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.successLight,
  },
  optionIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.text,
    textAlign: 'center',
  },
  optionLabelActive: {
    color: Colors.primary,
  },
  checkMark: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  environmentSection: {
    marginBottom: 24,
  },
  environmentLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  environmentOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  envOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  envOptionActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  envOptionText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500' as const,
  },
  envOptionTextActive: {
    color: Colors.textInverse,
  },
  lastWateredOptions: {
    gap: 12,
  },
  lastWateredOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  lastWateredOptionActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.successLight,
  },
  lastWateredText: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500' as const,
  },
  lastWateredTextActive: {
    color: Colors.primary,
  },
  summaryCard: {
    backgroundColor: Colors.infoLight,
    borderRadius: 12,
    padding: 16,
    marginTop: 32,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.info,
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
  },
  summaryHighlight: {
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    minWidth: 80,
  },
  backButtonText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '500' as const,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 4,
  },
  nextButtonDisabled: {
    backgroundColor: Colors.border,
  },
  nextButtonText: {
    fontSize: 16,
    color: Colors.textInverse,
    fontWeight: '600' as const,
  },
});
