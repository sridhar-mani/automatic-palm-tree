import { isJobFavorited, removeJobFromFavorites, saveJobToFavorites } from '@/services/jobFavorites';
import { JobMatch } from '@/services/semanticMatcher';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function JobDetailScreen() {
  const { jobData } = useLocalSearchParams();
  const router = useRouter();
  const [isFavorited, setIsFavorited] = useState(false);

  // Parse the job data from the route params
  const jobMatch: JobMatch | null = jobData ? JSON.parse(jobData as string) : null;

  const checkFavoriteStatus = useCallback(async () => {
    if (jobMatch) {
      const favorited = await isJobFavorited(jobMatch.job.id);
      setIsFavorited(favorited);
    }
  }, [jobMatch]);

  useEffect(() => {
    if (jobMatch) {
      checkFavoriteStatus();
    }
  }, [jobMatch, checkFavoriteStatus]);

  if (!jobMatch) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Job Not Found</Text>
          <Text style={styles.errorText}>The job details could not be loaded.</Text>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const { job, matchScore, reasons } = jobMatch;

  const getMatchColor = (score: number) => {
    if (score > 0.8) return '#34C759';
    if (score > 0.6) return '#FF9500';
    return '#FF3B30';
  };

  const getMatchLabel = (score: number) => {
    if (score > 0.8) return 'Excellent Match';
    if (score > 0.6) return 'Good Match';
    return 'Potential Match';
  };

  const handleApply = () => {
    if (job.url) {
      Linking.openURL(job.url).catch(() => {
        Alert.alert('Error', 'Could not open the application link.');
      });
    } else {
      Alert.alert('Apply', `Apply for ${job.title} at ${job.company}`);
    }
  };

  const handleSave = async () => {
    if (!jobMatch) return;

    try {
      if (isFavorited) {
        const success = await removeJobFromFavorites(jobMatch.job.id);
        if (success) {
          setIsFavorited(false);
          Alert.alert('Success', 'Job removed from favorites');
        }
      } else {
        const success = await saveJobToFavorites(jobMatch.job);
        if (success) {
          setIsFavorited(true);
          Alert.alert('Success', 'Job saved to favorites');
        }
      }
    } catch {
      Alert.alert('Error', 'Failed to update favorites');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Job Details',
          headerBackTitle: 'Back',
        }}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Match Score Header */}
        <View style={styles.matchHeader}>
          <View style={[styles.matchBadge, { backgroundColor: getMatchColor(matchScore) + '20' }]}>
            <Text style={[styles.matchScore, { color: getMatchColor(matchScore) }]}>
              {Math.round(matchScore * 100)}% Match
            </Text>
            <Text style={[styles.matchLabel, { color: getMatchColor(matchScore) }]}>
              {getMatchLabel(matchScore)}
            </Text>
          </View>
        </View>

        {/* Job Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{job.title}</Text>
          <Text style={styles.company}>{job.company}</Text>
          <Text style={styles.location}>{job.location}</Text>
          {job.salary && <Text style={styles.salary}>{job.salary}</Text>}
        </View>

        {/* Match Reasons */}
        {reasons && reasons.length > 0 && (
          <View style={styles.reasonsSection}>
            <Text style={styles.sectionTitle}>Why This Matches Your Profile</Text>
            {reasons.map((reason, index) => (
              <View key={index} style={styles.reasonItem}>
                <Text style={styles.reasonBullet}>•</Text>
                <Text style={styles.reasonText}>{reason}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Job Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Job Description</Text>
          <Text style={styles.description}>{job.description}</Text>
        </View>

        {/* Requirements/Skills */}
        {job.required_skills && job.required_skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Required Skills</Text>
            <View style={styles.skillsContainer}>
              {job.required_skills.map((skill, index) => (
                <View key={index} style={styles.skillTag}>
                  <Text style={styles.skillText}>{skill}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Job Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Job Details</Text>
          <View style={styles.detailsGrid}>
            {job.job_type && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Job Type</Text>
                <Text style={styles.detailValue}>{job.job_type}</Text>
              </View>
            )}
            {job.employer_website && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Company Website</Text>
                <Text style={styles.detailValue}>{job.employer_website}</Text>
              </View>
            )}
            {job.publisher && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Posted by</Text>
                <Text style={styles.detailValue}>{job.publisher}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Pressable style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>
              {isFavorited ? 'Saved' : 'Save Job'}
            </Text>
          </Pressable>
          <Pressable style={styles.applyButton} onPress={handleApply}>
            <Text style={styles.applyButtonText}>Apply Now</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollView: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  errorText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  matchHeader: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    alignItems: 'center',
  },
  matchBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
  },
  matchScore: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  matchLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginTop: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1C1C1E',
    marginBottom: 8,
    lineHeight: 34,
  },
  company: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 4,
  },
  location: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 8,
  },
  salary: {
    fontSize: 18,
    color: '#34C759',
    fontWeight: '600',
  },
  reasonsSection: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginTop: 8,
  },
  section: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  reasonItem: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  reasonBullet: {
    fontSize: 16,
    color: '#007AFF',
    marginRight: 8,
    marginTop: 2,
  },
  reasonText: {
    fontSize: 16,
    color: '#48484A',
    lineHeight: 24,
    flex: 1,
  },
  description: {
    fontSize: 16,
    color: '#48484A',
    lineHeight: 24,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  skillTag: {
    backgroundColor: '#E5F0FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  skillText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
  detailsGrid: {
    gap: 16,
  },
  detailItem: {
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#1C1C1E',
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  applyButton: {
    flex: 2,
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});