import { supabase } from '@/lib/supabase';
import * as Linking from 'expo-linking';
import React from 'react';
import { Alert, Button } from 'react-native';

type JobMinimal = {
  id: string;
  title: string;
  company_name: string;
  application_type?: string | null;
  application_contact?: string | null;
  apply_url?: string | null;
  application_count?: number | null;
};

type ProfileMinimal = {
  id: string;
  skills?: string[];
};

const calculateMatchScore = (job: JobMinimal, profile: ProfileMinimal) => {
  // lightweight placeholder: in-app we'll rely on semanticMatcher service
  return 0.5;
};

export const SimpleApply: React.FC<{ job: JobMinimal; userProfile: ProfileMinimal }> = ({ job, userProfile }) => {
  const handleQuickApply = async () => {
    try {
      const matchScore = calculateMatchScore(job, userProfile);

      // Save application record
      const { error: insertError } = await supabase.from('applications').insert({
        job_id: job.id,
        user_id: userProfile.id,
        match_score: matchScore,
      }).select();

      if (insertError) {
        console.error('Application insert error', insertError);
        Alert.alert('Error', 'Failed to apply');
        return;
      }

      // Increment application count safely
      await supabase.rpc('increment_job_application_count', { job_uuid: job.id }).catch(() => {
        // If RPC not available, fallback to simple update (may race)
        supabase.from('jobs').update({ application_count: (job.application_count || 0) + 1 }).eq('id', job.id);
      });

      // Launch appropriate channel
      switch (job.application_type) {
        case 'whatsapp': {
          const phone = job.application_contact || '';
          const message = `Hi, I'm interested in the ${job.title} position at ${job.company_name}. My skills: ${userProfile.skills?.join(', ') || ''}`;
          Linking.openURL(`whatsapp://send?phone=${phone}&text=${encodeURIComponent(message)}`).catch(() => {
            Alert.alert('Error', 'Could not open WhatsApp');
          });
          break;
        }
        case 'phone': {
          const phone = job.application_contact || '';
          Linking.openURL(`tel:${phone}`).catch(() => {
            Alert.alert('Error', 'Could not start a call');
          });
          break;
        }
        case 'email': {
          const email = job.application_contact || '';
          const subject = `Application for ${job.title}`;
          Linking.openURL(`mailto:${email}?subject=${encodeURIComponent(subject)}`).catch(() => {
            Alert.alert('Error', 'Could not open mail client');
          });
          break;
        }
        case 'direct':
        default: {
          if (job.apply_url) {
            Linking.openURL(job.apply_url).catch(() => {
              Alert.alert('Error', 'Could not open application link');
            });
          } else {
            Alert.alert('Applied', 'Application recorded');
          }
          break;
        }
      }

      Alert.alert('Success', 'Application submitted');
    } catch (err) {
      console.error('Quick apply error', err);
      Alert.alert('Error', 'Failed to apply');
    }
  };

  return <Button title="Quick Apply" onPress={handleQuickApply} />;
};
