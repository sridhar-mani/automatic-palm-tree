import { ParsedResume, parseResumeText } from '@/services/resumeParser';
import { saveResumeData } from '@/services/storage';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Stack } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import pdfToText from 'react-pdftotext';

const base64ToBlob = (base64: string, type: string) => {
  const byteCharacters = atob(base64);
  const byteArrays = [];

  for (let i = 0; i < byteCharacters.length; i++) {
    byteArrays.push(byteCharacters.charCodeAt(i));
  }

  return new Blob([new Uint8Array(byteArrays)], { type });
};

export default function ResumeUploadScreen() {
  const [isUploading, setIsUploading] = useState(false);
  const [parsedResume, setParsedResume] = useState<ParsedResume | null>(null);

  const handleUploadResume = async () => {
    try {
      setIsUploading(true);

      // Step 1: Pick PDF file
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true
      });

      if (result.canceled) {
        setIsUploading(false);
        return;
      }

      // Step 2: Read file content
      const fileUri = result.assets[0].uri;
      const fileInfo = await FileSystem.readAsStringAsync(fileUri, {
        encoding: 'base64'
      });

      // Step 3: Convert base64 to blob for PDF parsing
      const blob = base64ToBlob(fileInfo, 'application/pdf');

      // Step 4: Extract text from PDF
      const text = await pdfToText(blob);

      if (!text || text.trim().length === 0) {
        Alert.alert('Error', 'Could not extract text from PDF. Please try a different file.');
        setIsUploading(false);
        return;
      }

      // Step 5: Parse resume with NLP
      const parsed = parseResumeText(text);
      setParsedResume(parsed);

      // Step 6: Store securely
      const saved = await saveResumeData(parsed);

      if (saved) {
        Alert.alert(
          'Success!',
          'Your resume has been uploaded and parsed successfully. You can now browse job matches.',
          [
            { text: 'OK', onPress: () => {} }
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to save resume data. Please try again.');
      }

    } catch (error) {
      console.error('Resume upload error:', error);
      Alert.alert(
        'Error',
        'Failed to upload resume. Please check that you selected a valid PDF file and try again.'
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Upload Resume',
          headerShown: true
        }}
      />

      <View style={styles.content}>
        <Text style={styles.title}>Upload Your Resume</Text>
        <Text style={styles.subtitle}>
          Upload your resume in PDF format to get personalized job recommendations
        </Text>

        <TouchableOpacity
          style={[styles.uploadButton, isUploading && styles.uploadButtonDisabled]}
          onPress={handleUploadResume}
          disabled={isUploading}
        >
          {isUploading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.uploadButtonText}>Select PDF Resume</Text>
          )}
        </TouchableOpacity>

        {parsedResume && (
          <View style={styles.parsedData}>
            <Text style={styles.parsedTitle}>Resume Parsed Successfully!</Text>

            <View style={styles.parsedSection}>
              <Text style={styles.sectionTitle}>Personal Info</Text>
              <Text style={styles.parsedText}>Name: {parsedResume.name || 'Not found'}</Text>
              <Text style={styles.parsedText}>Email: {parsedResume.email || 'Not found'}</Text>
              <Text style={styles.parsedText}>Phone: {parsedResume.phone || 'Not found'}</Text>
            </View>

            <View style={styles.parsedSection}>
              <Text style={styles.sectionTitle}>Skills ({parsedResume.skills.length})</Text>
              <Text style={styles.parsedText}>
                {parsedResume.skills.slice(0, 10).join(', ')}
                {parsedResume.skills.length > 10 && '...'}
              </Text>
            </View>

            <View style={styles.parsedSection}>
              <Text style={styles.sectionTitle}>Experience</Text>
              <Text style={styles.parsedText}>
                {parsedResume.yearsExperience} years of experience
              </Text>
              <Text style={styles.parsedText}>
                {parsedResume.experience.length} positions found
              </Text>
            </View>

            <View style={styles.parsedSection}>
              <Text style={styles.sectionTitle}>Education</Text>
              <Text style={styles.parsedText}>
                {parsedResume.education.length} education entries found
              </Text>
            </View>
          </View>
        )}

        <View style={styles.info}>
          <Text style={styles.infoTitle}>Supported Features:</Text>
          <Text style={styles.infoText}>• PDF text extraction</Text>
          <Text style={styles.infoText}>• Contact information parsing</Text>
          <Text style={styles.infoText}>• Skills recognition</Text>
          <Text style={styles.infoText}>• Experience analysis</Text>
          <Text style={styles.infoText}>• Education parsing</Text>
          <Text style={styles.infoText}>• Secure local storage</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1C1C1E',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  uploadButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  uploadButtonDisabled: {
    backgroundColor: '#8E8E93',
    shadowOpacity: 0.1,
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  parsedData: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  parsedTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 16,
    textAlign: 'center',
  },
  parsedSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 8,
  },
  parsedText: {
    fontSize: 14,
    color: '#48484A',
    lineHeight: 20,
    marginBottom: 4,
  },
  info: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#48484A',
    lineHeight: 20,
    marginBottom: 4,
  },
});