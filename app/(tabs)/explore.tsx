import { InfiniteScrollList } from '@/components/InfiniteScrollList';
import SearchBar from '@/components/InfiniteScrollList/components/SearchBar';
import { JobCardSkeleton } from '@/components/LoadingSkeleton';
import { SearchFilter, SearchFilters } from '@/components/SearchFilter';
import { fetchJobsWithFallback } from '@/services/jobAPI';
import { ParsedResume } from '@/services/resumeParser';
import { initializeTensorFlow, JobMatch, matchJobsToResume } from '@/services/semanticMatcher';
import { hasResumeData, loadResumeData } from '@/services/storage';
import { Stack, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function JobFeedScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [jobs, setJobs] = useState<JobMatch[]>([]);
  const [resumeProfile, setResumeProfile] = useState<ParsedResume | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasResume, setHasResume] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({});

  const loadJobs = useCallback(async (pageNum: number, profile: ParsedResume) => {
    if (loading) return;
    setLoading(true);

    try {
      // Fetch jobs from APIs
      const rawJobs = await fetchJobsWithFallback(searchQuery, 'India', pageNum);

      if (rawJobs.length === 0) {
        setLoading(false);
        return;
      }

      // Apply filters
      let filteredJobs = rawJobs;

      if (filters.location) {
        filteredJobs = filteredJobs.filter(job =>
          job.location.toLowerCase().includes(filters.location!.toLowerCase()) ||
          job.location.toLowerCase().includes('remote') && filters.location!.toLowerCase().includes('remote')
        );
      }

      if (filters.jobType) {
        filteredJobs = filteredJobs.filter(job =>
          job.job_type?.toLowerCase().includes(filters.jobType!.toLowerCase())
        );
      }

      if (filters.minSalary || filters.maxSalary) {
        filteredJobs = filteredJobs.filter(job => {
          if (!job.salary) return true;
          const salaryMatch = job.salary.match(/\$?(\d+(?:,\d+)?(?:\.\d+)?)/);
          if (!salaryMatch) return true;

          const salary = parseFloat(salaryMatch[1].replace(',', ''));
          if (filters.minSalary && salary < filters.minSalary) return false;
          if (filters.maxSalary && salary > filters.maxSalary) return false;
          return true;
        });
      }

      if (filters.remoteWork) {
        filteredJobs = filteredJobs.filter(job =>
          job.location.toLowerCase().includes('remote') ||
          job.description.toLowerCase().includes('remote')
        );
      }

      if (filters.experienceLevel) {
        const levelKeywords = {
          'Entry Level': ['entry', 'junior', 'graduate', '0-2'],
          'Mid Level': ['mid', 'intermediate', '3-5'],
          'Senior Level': ['senior', 'lead', 'principal', '6-10'],
          'Executive': ['executive', 'director', 'vp', 'head', 'chief', '10+']
        };

        const keywords = levelKeywords[filters.experienceLevel as keyof typeof levelKeywords] || [];
        filteredJobs = filteredJobs.filter(job =>
          keywords.some(keyword =>
            job.title.toLowerCase().includes(keyword) ||
            job.description.toLowerCase().includes(keyword)
          )
        );
      }

      // Match jobs to resume using semantic search
      const matches = await matchJobsToResume(profile, filteredJobs);

      // Filter by match score threshold (40%+ for broader results)
      const relevantJobs = matches.filter(m => m.matchScore > 0.4);

      setJobs(prev => pageNum === 1 ? relevantJobs : [...prev, ...relevantJobs]);
    } catch (error) {
      console.error('Error loading jobs:', error);
      Alert.alert('Error', 'Failed to load jobs. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [loading, searchQuery, filters]);

  const initializeApp = useCallback(async () => {
    // Initialize TensorFlow
    await initializeTensorFlow();

    // Check if user has resume
    const resumeExists = await hasResumeData();
    setHasResume(resumeExists);

    if (resumeExists) {
      // Load resume and fetch jobs
      const profile = await loadResumeData();
      setResumeProfile(profile);
      if (profile) {
        loadJobs(1, profile);
      }
    }
  }, [loadJobs]);

  useEffect(() => {
    initializeApp();
  }, [initializeApp]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    // Reset and search with new query
    if (resumeProfile) {
      setJobs([]);
      loadJobs(1, resumeProfile);
    }
  }, [resumeProfile, loadJobs]);

  const renderJob = useCallback((jobMatch: JobMatch, index: number): React.ReactElement => {
    const { job, matchScore, reasons } = jobMatch;

    const getMatchColor = (score: number) => {
      if (score > 0.8) return '#34C759'; // Green
      if (score > 0.6) return '#FF9500'; // Orange
      return '#FF3B30'; // Red
    };

    const getMatchLabel = (score: number) => {
      if (score > 0.8) return 'Excellent Match';
      if (score > 0.6) return 'Good Match';
      return 'Potential Match';
    };

    return (
      <Pressable
        key={String(job.id)}
        style={({ pressed }) => [
          styles.card,
          pressed && styles.cardPressed
        ]}
        onPress={() => {
          // Navigate to job detail screen
          router.push({
            pathname: '/job-detail',
            params: { jobData: JSON.stringify(jobMatch) }
          });
        }}
      >
        <View style={styles.cardHeader}>
          <View style={styles.matchIndicator}>
            <Text style={[styles.matchScore, { color: getMatchColor(matchScore) }]}>
              {Math.round(matchScore * 100)}%
            </Text>
            <Text style={[styles.matchLabel, { color: getMatchColor(matchScore) }]}>
              {getMatchLabel(matchScore)}
            </Text>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.metaRow}>
            <Text style={styles.company}>{job.company}</Text>
            <Text style={styles.location}>{job.location}</Text>
          </View>

          <Text style={styles.title} numberOfLines={2}>
            {job.title}
          </Text>

          <Text style={styles.description} numberOfLines={3}>
            {job.description}
          </Text>

          {job.salary && (
            <Text style={styles.salary}>{job.salary}</Text>
          )}

          {reasons && reasons.length > 0 && (
            <View style={styles.reasons}>
              <Text style={styles.reasonsTitle}>Why this matches:</Text>
              {reasons.slice(0, 2).map((reason, idx) => (
                <Text key={idx} style={styles.reasonText}>• {reason}</Text>
              ))}
            </View>
          )}

          <View style={styles.footer}>
            <View style={styles.skillsContainer}>
              {job.required_skills?.slice(0, 3).map((skill, idx) => (
                <View key={idx} style={styles.skillTag}>
                  <Text style={styles.skillText}>{skill}</Text>
                </View>
              ))}
            </View>
            <Pressable style={styles.applyButton}>
              <Text style={styles.applyText}>Apply</Text>
            </Pressable>
          </View>
        </View>
      </Pressable>
    );
  }, [router]);

  const renderEmptyState = () => {
    if (!hasResume) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Upload Your Resume First</Text>
          <Text style={styles.emptyText}>
            Upload your resume to get personalized job recommendations based on your skills and experience.
          </Text>
          <Pressable
            style={styles.uploadPromptButton}
            onPress={() => {
              // Navigate to resume upload screen
              Alert.alert('Navigate', 'Go to resume upload screen');
            }}
          >
            <Text style={styles.uploadPromptText}>Upload Resume</Text>
          </Pressable>
        </View>
      );
    }

    if (loading && jobs.length === 0) {
      return (
        <View style={styles.loadingContainer}>
          <JobCardSkeleton />
          <JobCardSkeleton />
          <JobCardSkeleton />
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>No Jobs Found</Text>
        <Text style={styles.emptyText}>
          Try adjusting your search terms or check back later for new opportunities.
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Job Matches',
          headerShown: false
        }}
      />

      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Job Matches</Text>
        <Text style={styles.headerSubtitle}>
          {hasResume ? 'AI-powered job recommendations' : 'Upload resume to get started'}
        </Text>
      </View>

      {hasResume && (
        <View style={styles.searchContainer}>
          <SearchBar searchQuery={searchQuery} onTextChange={handleSearch} />
          <Pressable style={styles.filterButton} onPress={() => setShowFilters(true)}>
            <Text style={styles.filterButtonText}>Filter</Text>
          </Pressable>
        </View>
      )}

      {showFilters && (
        <SearchFilter
          filters={filters}
          onFiltersChange={setFilters}
          onClose={() => setShowFilters(false)}
        />
      )}

      {hasResume ? (
        <InfiniteScrollList
          config={{
            serviceCall: async ({ page, itemsPerPage, refresh }: { page: number; itemsPerPage: number; refresh: boolean }) => {
              if (!resumeProfile) return [];
              // This is handled by loadJobs function above
              return [];
            },
            itemsPerPage: 20,
            searchQuery: searchQuery,
          }}
          renderItem={renderJob}
          keyExtractor={(jobMatch: JobMatch) => `job-${jobMatch.job.id}`}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={renderEmptyState}
          ListFooterComponent={loading ? () => <ActivityIndicator style={{ margin: 16 }} /> : undefined}
        />
      ) : (
        renderEmptyState()
      )}
    </SafeAreaView>
  );
}const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#1C1C1E',
    letterSpacing: -0.8,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#8E8E93',
    letterSpacing: 0.1,
  },
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8
    },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.02)',
  },
  cardPressed: {
    transform: [{ scale: 0.97 }],
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    paddingBottom: 0,
  },
  matchIndicator: {
    alignItems: 'flex-end',
  },
  matchScore: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  matchLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  content: {
    padding: 24,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  company: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  location: {
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: '500',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 12,
    color: '#1C1C1E',
    lineHeight: 30,
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 16,
    color: '#48484A',
    lineHeight: 24,
    marginBottom: 12,
    fontWeight: '400',
  },
  salary: {
    fontSize: 16,
    color: '#34C759',
    fontWeight: '600',
    marginBottom: 12,
  },
  reasons: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  reasonsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  reasonText: {
    fontSize: 13,
    color: '#48484A',
    lineHeight: 18,
    marginBottom: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 1,
    marginRight: 12,
  },
  skillTag: {
    backgroundColor: '#E5F0FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  skillText: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: '500',
  },
  applyButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  applyText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  separator: {
    height: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  uploadPromptButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  uploadPromptText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 16,
    textAlign: 'center',
  },
  loadingContainer: {
    padding: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  filterButton: {
    marginLeft: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  filterButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
