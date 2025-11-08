import { loadUserPreferences, UserPreferences } from '@/services/userPreferences';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

export interface SearchFilters {
  location?: string;
  jobType?: string;
  minSalary?: number;
  maxSalary?: number;
  remoteWork?: boolean;
  experienceLevel?: string;
}

interface SearchFilterProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onClose: () => void;
}

export const SearchFilter: React.FC<SearchFilterProps> = ({
  filters,
  onFiltersChange,
  onClose
}) => {
  const [userPrefs, setUserPrefs] = useState<UserPreferences | null>(null);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    const prefs = await loadUserPreferences();
    setUserPrefs(prefs);
  };

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const applyFilters = () => {
    onClose();
  };

  const jobTypes = ['Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship'];
  const experienceLevels = ['Entry Level', 'Mid Level', 'Senior Level', 'Executive'];

  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Filter Jobs</Text>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Location Filter */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter location (e.g., New York, Remote)"
              value={filters.location || userPrefs?.location || ''}
              onChangeText={(text) => updateFilter('location', text)}
            />
          </View>

          {/* Job Type Filter */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Job Type</Text>
            <View style={styles.optionsGrid}>
              {jobTypes.map((type) => (
                <Pressable
                  key={type}
                  style={[
                    styles.optionButton,
                    filters.jobType === type && styles.optionButtonSelected
                  ]}
                  onPress={() => updateFilter('jobType', filters.jobType === type ? undefined : type)}
                >
                  <Text style={[
                    styles.optionText,
                    filters.jobType === type && styles.optionTextSelected
                  ]}>
                    {type}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Salary Range */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Salary Range (USD)</Text>
            <View style={styles.salaryInputs}>
              <TextInput
                style={[styles.input, styles.salaryInput]}
                placeholder="Min"
                keyboardType="numeric"
                value={filters.minSalary?.toString() || userPrefs?.salaryRange?.min?.toString() || ''}
                onChangeText={(text) => updateFilter('minSalary', text ? parseInt(text) : undefined)}
              />
              <Text style={styles.salarySeparator}>-</Text>
              <TextInput
                style={[styles.input, styles.salaryInput]}
                placeholder="Max"
                keyboardType="numeric"
                value={filters.maxSalary?.toString() || userPrefs?.salaryRange?.max?.toString() || ''}
                onChangeText={(text) => updateFilter('maxSalary', text ? parseInt(text) : undefined)}
              />
            </View>
          </View>

          {/* Remote Work */}
          <View style={styles.section}>
            <Pressable
              style={styles.checkboxContainer}
              onPress={() => updateFilter('remoteWork', !filters.remoteWork)}
            >
              <View style={[styles.checkbox, filters.remoteWork && styles.checkboxChecked]}>
                {filters.remoteWork && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>Remote work only</Text>
            </Pressable>
          </View>

          {/* Experience Level */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Experience Level</Text>
            <View style={styles.optionsGrid}>
              {experienceLevels.map((level) => (
                <Pressable
                  key={level}
                  style={[
                    styles.optionButton,
                    filters.experienceLevel === level && styles.optionButtonSelected
                  ]}
                  onPress={() => updateFilter('experienceLevel', filters.experienceLevel === level ? undefined : level)}
                >
                  <Text style={[
                    styles.optionText,
                    filters.experienceLevel === level && styles.optionTextSelected
                  ]}>
                    {level}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable style={styles.clearButton} onPress={clearFilters}>
            <Text style={styles.clearText}>Clear All</Text>
          </Pressable>
          <Pressable style={styles.applyButton} onPress={applyFilters}>
            <Text style={styles.applyText}>Apply Filters</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  closeButton: {
    padding: 5,
  },
  closeText: {
    fontSize: 18,
    color: '#8E8E93',
    fontWeight: '600',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    backgroundColor: '#FAFAFA',
  },
  optionButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  optionText: {
    fontSize: 14,
    color: '#48484A',
  },
  optionTextSelected: {
    color: '#FFFFFF',
  },
  salaryInputs: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  salaryInput: {
    flex: 1,
  },
  salarySeparator: {
    marginHorizontal: 12,
    fontSize: 16,
    color: '#8E8E93',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#1C1C1E',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
    gap: 12,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  clearText: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '600',
  },
  applyButton: {
    flex: 2,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  applyText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});