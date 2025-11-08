import AsyncStorage from '@react-native-async-storage/async-storage';
import { Job } from './semanticMatcher';

const FAVORITES_KEY = 'user_favorites';

export interface FavoriteJob extends Job {
  savedAt: string;
  notes?: string;
}

export const saveJobToFavorites = async (job: Job, notes?: string): Promise<boolean> => {
  try {
    const favorites = await loadFavoriteJobs();
    const favoriteJob: FavoriteJob = {
      ...job,
      savedAt: new Date().toISOString(),
      notes
    };

    // Check if job is already saved
    const existingIndex = favorites.findIndex(fav => fav.id === job.id);
    if (existingIndex >= 0) {
      favorites[existingIndex] = favoriteJob;
    } else {
      favorites.push(favoriteJob);
    }

    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    return true;
  } catch (error) {
    console.error('Save favorite job error:', error);
    return false;
  }
};

export const removeJobFromFavorites = async (jobId: string): Promise<boolean> => {
  try {
    const favorites = await loadFavoriteJobs();
    const filtered = favorites.filter(fav => fav.id !== jobId);
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Remove favorite job error:', error);
    return false;
  }
};

export const loadFavoriteJobs = async (): Promise<FavoriteJob[]> => {
  try {
    const data = await AsyncStorage.getItem(FAVORITES_KEY);
    if (!data) return [];

    const favorites = JSON.parse(data);
    // Ensure all favorites have the required fields
    return favorites.map((fav: any) => ({
      ...fav,
      savedAt: fav.savedAt || new Date().toISOString()
    }));
  } catch (error) {
    console.error('Load favorite jobs error:', error);
    return [];
  }
};

export const isJobFavorited = async (jobId: string): Promise<boolean> => {
  try {
    const favorites = await loadFavoriteJobs();
    return favorites.some(fav => fav.id === jobId);
  } catch (error) {
    return false;
  }
};

export const getFavoriteJob = async (jobId: string): Promise<FavoriteJob | null> => {
  try {
    const favorites = await loadFavoriteJobs();
    return favorites.find(fav => fav.id === jobId) || null;
  } catch (error) {
    return null;
  }
};

export const updateFavoriteNotes = async (jobId: string, notes: string): Promise<boolean> => {
  try {
    const favorites = await loadFavoriteJobs();
    const index = favorites.findIndex(fav => fav.id === jobId);
    if (index >= 0) {
      favorites[index].notes = notes;
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
      return true;
    }
    return false;
  } catch (error) {
    console.error('Update favorite notes error:', error);
    return false;
  }
};

export const clearAllFavorites = async (): Promise<boolean> => {
  try {
    await AsyncStorage.removeItem(FAVORITES_KEY);
    return true;
  } catch (error) {
    console.error('Clear favorites error:', error);
    return false;
  }
};

// Get favorites sorted by most recently saved
export const getRecentFavorites = async (limit?: number): Promise<FavoriteJob[]> => {
  try {
    const favorites = await loadFavoriteJobs();
    const sorted = favorites.sort((a, b) =>
      new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
    );
    return limit ? sorted.slice(0, limit) : sorted;
  } catch (error) {
    return [];
  }
};