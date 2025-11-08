import * as SecureStore from 'expo-secure-store';

export interface UserPreferences {
  location?: string;
  jobTypes?: string[];
  salaryRange?: {
    min?: number;
    max?: number;
    currency?: string;
  };
  remoteWork?: boolean;
  experienceLevel?: 'entry' | 'mid' | 'senior' | 'executive';
  industries?: string[];
  keywords?: string[];
  notifications?: {
    jobMatches: boolean;
    applicationDeadlines: boolean;
    newJobs: boolean;
  };
}

const PREFERENCES_KEY = 'user_preferences';

export const saveUserPreferences = async (preferences: UserPreferences): Promise<boolean> => {
  try {
    const data = JSON.stringify(preferences);
    await SecureStore.setItemAsync(PREFERENCES_KEY, data);
    return true;
  } catch (error) {
    console.error('Save preferences error:', error);
    return false;
  }
};

export const loadUserPreferences = async (): Promise<UserPreferences | null> => {
  try {
    const data = await SecureStore.getItemAsync(PREFERENCES_KEY);
    if (!data) return null;

    return JSON.parse(data);
  } catch (error) {
    console.error('Load preferences error:', error);
    return null;
  }
};

export const updateUserPreferences = async (updates: Partial<UserPreferences>): Promise<boolean> => {
  try {
    const current = await loadUserPreferences() || {};
    const updated = { ...current, ...updates };
    return await saveUserPreferences(updated);
  } catch (error) {
    console.error('Update preferences error:', error);
    return false;
  }
};

export const deleteUserPreferences = async (): Promise<boolean> => {
  try {
    await SecureStore.deleteItemAsync(PREFERENCES_KEY);
    return true;
  } catch (error) {
    console.error('Delete preferences error:', error);
    return false;
  }
};

// Default preferences
export const getDefaultPreferences = (): UserPreferences => ({
  location: '',
  jobTypes: [],
  salaryRange: {
    min: 0,
    max: 200000,
    currency: 'USD'
  },
  remoteWork: false,
  experienceLevel: 'mid',
  industries: [],
  keywords: [],
  notifications: {
    jobMatches: true,
    applicationDeadlines: true,
    newJobs: false
  }
});

// Helper functions for common preference operations
export const addKeyword = async (keyword: string): Promise<boolean> => {
  const prefs = await loadUserPreferences() || getDefaultPreferences();
  const keywords = prefs.keywords || [];
  if (!keywords.includes(keyword)) {
    keywords.push(keyword);
    return await updateUserPreferences({ keywords });
  }
  return true;
};

export const removeKeyword = async (keyword: string): Promise<boolean> => {
  const prefs = await loadUserPreferences() || getDefaultPreferences();
  const keywords = prefs.keywords || [];
  const filtered = keywords.filter(k => k !== keyword);
  return await updateUserPreferences({ keywords: filtered });
};

export const setLocation = async (location: string): Promise<boolean> => {
  return await updateUserPreferences({ location });
};

export const setSalaryRange = async (min?: number, max?: number, currency?: string): Promise<boolean> => {
  const prefs = await loadUserPreferences() || getDefaultPreferences();
  const currentRange = prefs.salaryRange || {};
  return await updateUserPreferences({
    salaryRange: {
      ...currentRange,
      ...(min !== undefined && { min }),
      ...(max !== undefined && { max }),
      ...(currency && { currency })
    }
  });
};

export const setJobTypes = async (jobTypes: string[]): Promise<boolean> => {
  return await updateUserPreferences({ jobTypes });
};

export const setExperienceLevel = async (level: 'entry' | 'mid' | 'senior' | 'executive'): Promise<boolean> => {
  return await updateUserPreferences({ experienceLevel: level });
};