import { supabase, SupabaseJob } from '@/lib/supabase';
import * as Location from 'expo-location';

export interface LocationFilter {
  userLat: number;
  userLon: number;
  maxDistanceKm: number;
  cities?: string[];
  states?: string[];
  includeRemote?: boolean;
}

// Haversine formula
const toRad = (deg: number) => deg * (Math.PI / 180);
const calculateDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const getLocationBasedJobs = async (filter: LocationFilter): Promise<SupabaseJob[]> => {
  const { userLat, userLon, maxDistanceKm, cities, states, includeRemote } = filter;

  let query = supabase
    .from('jobs')
    .select('*')
    .eq('is_approved', true);

  // If includeRemote is true, include remote jobs explicitly using OR syntax
  if (includeRemote) {
    // We'll still fetch all approved jobs and filter client-side, keeping remote when requested
  }

  if (cities && cities.length > 0) {
    query = query.in('city', cities);
  }

  if (states && states.length > 0) {
    query = query.in('state', states);
  }

  const { data: jobs, error } = await query;
  if (error) throw error;

  const jobList = (jobs || []) as SupabaseJob[];

  const nearbyJobs = jobList.filter(job => {
    if (job.is_remote && includeRemote) return true;
    if (!job.latitude || !job.longitude) return true; // include if coords missing

    const distance = calculateDistanceKm(userLat, userLon, Number(job.latitude), Number(job.longitude));
    return distance <= maxDistanceKm;
  });

  return nearbyJobs;
};

export const getUserLocation = async () => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;

    const location = await Location.getCurrentPositionAsync({});
    const [address] = await Location.reverseGeocodeAsync({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      city: address.city || address.district || null,
      state: address.region || null,
    };
  } catch (err) {
    console.error('getUserLocation error', err);
    return null;
  }
};
