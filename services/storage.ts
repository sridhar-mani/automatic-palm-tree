import * as SecureStore from 'expo-secure-store';
import { ParsedResume } from './resumeParser';

const RESUME_KEY = 'user_resume_data';

export const saveResumeData = async (resumeData: ParsedResume): Promise<boolean> => {
  try {
    // Store as JSON (SecureStore provides encryption)
    const data = JSON.stringify(resumeData);
    await SecureStore.setItemAsync(RESUME_KEY, data);
    return true;
  } catch (error) {
    console.error('Save resume error:', error);
    return false;
  }
};

export const loadResumeData = async (): Promise<ParsedResume | null> => {
  try {
    const data = await SecureStore.getItemAsync(RESUME_KEY);
    if (!data) return null;

    return JSON.parse(data);
  } catch (error) {
    console.error('Load resume error:', error);
    return null;
  }
};

export const deleteResumeData = async (): Promise<boolean> => {
  try {
    await SecureStore.deleteItemAsync(RESUME_KEY);
    return true;
  } catch (error) {
    console.error('Delete resume error:', error);
    return false;
  }
};

export const hasResumeData = async (): Promise<boolean> => {
  try {
    const data = await SecureStore.getItemAsync(RESUME_KEY);
    return data !== null;
  } catch (error) {
    return false;
  }
};