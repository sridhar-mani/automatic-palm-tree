import { supabase, SupabaseJob, SupabaseProfile } from '@/lib/supabase';
import { getLocationBasedJobs, LocationFilter } from './locationService';
import { matchJobsToResume } from './semanticMatcher';

export const getPersonalizedJobs = async (userProfile: SupabaseProfile) => {
  const lat = (userProfile as any).latitude as number | undefined;
  const lon = (userProfile as any).longitude as number | undefined;

  const locationFilter: LocationFilter = {
    userLat: lat || 0,
    userLon: lon || 0,
    maxDistanceKm: (userProfile.max_commute_km as number) || 10,
    cities: userProfile.preferred_cities || undefined,
    states: userProfile.preferred_states || undefined,
    includeRemote: !!userProfile.remote_only,
  };

  // Fetch location-prioritized jobs
  let jobs: SupabaseJob[] = [];
  try {
    jobs = await getLocationBasedJobs(locationFilter);
  } catch (err) {
    console.error('getLocationBasedJobs failed', err);
    // fallback: basic supabase fetch of approved jobs
    const { data } = await supabase.from('jobs').select('*').eq('is_approved', true).limit(100);
    jobs = (data || []) as SupabaseJob[];
  }

  // Experience filter
  jobs = jobs.filter(job => {
    if (!job.experience_min) return true;
    const expMin = job.experience_min || 0;
    const expMax = job.experience_max || 100;
    const userExp = (userProfile.experience_years as number) || 0;
    return userExp >= expMin && userExp <= expMax;
  });

  // Salary filter
  if (userProfile.preferred_salary_min) {
    jobs = jobs.filter(job => {
      if (!job.salary_min) return true;
      return (job.salary_min || 0) >= (userProfile.preferred_salary_min || 0);
    });
  }

  // Semantic matching (uses semanticMatcher)
  // Convert SupabaseJob to the Job type expected by semanticMatcher
  const normalizedJobs = jobs.map(j => ({
    id: j.id,
    title: j.title,
    company: j.company_name,
    description: j.description || '',
    location: `${j.city || ''}, ${j.state || ''}`,
    salary: j.salary_min ? `${j.salary_min}` : undefined,
    required_skills: j.required_skills || [],
    url: j.apply_url || undefined,
    job_type: j.application_type || undefined,
    employer_website: undefined,
    publisher: undefined,
  }));

  // semanticMatcher expects a ParsedResume-like object; we create a light profile
  const resumeLike = {
    name: userProfile.full_name || '',
    email: userProfile.email || '',
    phone: userProfile.phone || '',
    skills: userProfile.skills || [],
    experience: [],
    education: [],
    summary: userProfile.resume_summary || '',
    yearsExperience: (userProfile.experience_years as number) || 0,
  } as any;

  const ranked = await matchJobsToResume(resumeLike, normalizedJobs as any);
  return ranked.filter(r => r.matchScore >= 0.6);
};
