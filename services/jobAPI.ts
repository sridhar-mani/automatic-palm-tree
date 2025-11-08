import AsyncStorage from '@react-native-async-storage/async-storage';
import { Job } from './semanticMatcher';

const ADZUNA_APP_ID = 'your_adzuna_app_id'; // Replace with actual Adzuna App ID
const ADZUNA_API_KEY = 'your_adzuna_api_key'; // Replace with actual Adzuna API Key
const JSEARCH_RAPID_KEY = 'your_jsearch_rapid_key'; // Replace with actual JSearch API Key

const CACHE_DURATION = 3600000; // 1 hour in milliseconds

export const fetchJobs = async (
  query: string = '',
  location: string = 'India',
  page: number = 1
): Promise<Job[]> => {
  try {
    // Check cache first (offline support)
    const cacheKey = `jobs_${query}_${location}_${page}`;
    const cached = await AsyncStorage.getItem(cacheKey);

    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      // Cache valid for 1 hour
      if (Date.now() - timestamp < CACHE_DURATION) {
        return data;
      }
    }

    // Fetch from multiple APIs in parallel
    const [adzunaJobs, jsearchJobs] = await Promise.allSettled([
      fetchAdzunaJobs(query, location, page),
      fetchJSearchJobs(query, location, page)
    ]);

    // Extract successful results
    const allJobs: Job[] = [];

    if (adzunaJobs.status === 'fulfilled') {
      allJobs.push(...adzunaJobs.value);
    }

    if (jsearchJobs.status === 'fulfilled') {
      allJobs.push(...jsearchJobs.value);
    }

    // Deduplicate jobs
    const uniqueJobs = deduplicateJobs(allJobs);

    // Cache results
    await AsyncStorage.setItem(cacheKey, JSON.stringify({
      data: uniqueJobs,
      timestamp: Date.now()
    }));

    return uniqueJobs;

  } catch (error) {
    console.error('Job fetch error:', error);
    return [];
  }
};

const fetchAdzunaJobs = async (query: string, location: string, page: number): Promise<Job[]> => {
  if (!ADZUNA_APP_ID || !ADZUNA_API_KEY || ADZUNA_APP_ID === 'your_adzuna_app_id') {
    console.log('Adzuna API keys not configured, skipping...');
    return [];
  }

  const url = `https://api.adzuna.com/v1/api/jobs/${location.toLowerCase()}/search/${page}?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_API_KEY}&what=${encodeURIComponent(query)}&results_per_page=20`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!data.results) return [];

    return data.results.map(normalizeAdzunaJob);
  } catch (error) {
    console.error('Adzuna API error:', error);
    return [];
  }
};

const fetchJSearchJobs = async (query: string, location: string, page: number): Promise<Job[]> => {
  if (!JSEARCH_RAPID_KEY || JSEARCH_RAPID_KEY === 'your_jsearch_rapid_key') {
    console.log('JSearch API key not configured, skipping...');
    return [];
  }

  const url = 'https://jsearch.p.rapidapi.com/search';

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'X-RapidAPI-Key': JSEARCH_RAPID_KEY,
        'X-RapidAPI-Host': 'jsearch.p.rapidapi.com',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: `${query} in ${location}`,
        page: page.toString(),
        num_pages: '1'
      })
    });

    const data = await response.json();

    if (!data.data) return [];

    return data.data.map(normalizeJSearchJob);
  } catch (error) {
    console.error('JSearch API error:', error);
    return [];
  }
};

const normalizeAdzunaJob = (job: any): Job => ({
  id: `adzuna_${job.id}`,
  title: job.title,
  company: job.company?.display_name || 'Unknown Company',
  description: job.description,
  location: job.location?.display_name || 'Remote',
  salary: job.salary_min && job.salary_max ?
    `${job.salary_min}-${job.salary_max} ${job.salary_currency || 'USD'}` : undefined,
  required_skills: extractSkillsFromDescription(job.description),
  url: job.redirect_url
});

const normalizeJSearchJob = (job: any): Job => ({
  id: `jsearch_${job.job_id}`,
  title: job.job_title,
  company: job.employer_name || 'Unknown Company',
  description: job.job_description || job.job_highlights?.join(' ') || '',
  location: job.job_city && job.job_state ?
    `${job.job_city}, ${job.job_state}` : job.job_country || 'Remote',
  salary: job.job_min_salary && job.job_max_salary ?
    `${job.job_min_salary}-${job.job_max_salary}` : undefined,
  required_skills: job.job_required_skills || extractSkillsFromDescription(job.job_description),
  url: job.job_apply_link
});

const extractSkillsFromDescription = (description: string): string[] => {
  if (!description) return [];

  const skillKeywords = [
    'javascript', 'typescript', 'python', 'java', 'react', 'node.js', 'aws', 'docker',
    'kubernetes', 'mongodb', 'postgresql', 'git', 'agile', 'scrum', 'machine learning',
    'tensorflow', 'react native', 'ios', 'android', 'flutter'
  ];

  const lowerDesc = description.toLowerCase();
  return skillKeywords.filter(skill => lowerDesc.includes(skill));
};

const deduplicateJobs = (jobs: Job[]): Job[] => {
  const seen = new Set<string>();
  return jobs.filter(job => {
    const key = `${job.title}_${job.company}_${job.location}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

// Mock data for development/testing when APIs are not configured
export const getMockJobs = (): Job[] => [
  {
    id: 'mock_1',
    title: 'Senior React Native Developer',
    company: 'TechCorp',
    description: 'We are looking for an experienced React Native developer with 3+ years of experience building mobile applications. Skills required: React Native, TypeScript, JavaScript, iOS, Android.',
    location: 'Bangalore, India',
    salary: '₹12,00,000 - ₹18,00,000',
    required_skills: ['React Native', 'TypeScript', 'JavaScript', 'iOS', 'Android'],
    url: 'https://example.com/job1'
  },
  {
    id: 'mock_2',
    title: 'Full Stack Developer',
    company: 'StartupXYZ',
    description: 'Join our team as a full stack developer. Experience with React, Node.js, and cloud platforms required. Python knowledge is a plus.',
    location: 'Mumbai, India',
    salary: '₹8,00,000 - ₹15,00,000',
    required_skills: ['React', 'Node.js', 'Python', 'JavaScript', 'AWS'],
    url: 'https://example.com/job2'
  },
  {
    id: 'mock_3',
    title: 'Machine Learning Engineer',
    company: 'AI Solutions',
    description: 'Looking for ML engineer with experience in TensorFlow, Python, and data science. Knowledge of NLP and computer vision preferred.',
    location: 'Delhi, India',
    salary: '₹15,00,000 - ₹25,00,000',
    required_skills: ['TensorFlow', 'Python', 'Machine Learning', 'NLP', 'Data Science'],
    url: 'https://example.com/job3'
  }
];

// Use mock data if APIs are not configured
export const fetchJobsWithFallback = async (
  query: string = '',
  location: string = 'India',
  page: number = 1
): Promise<Job[]> => {
  const realJobs = await fetchJobs(query, location, page);

  if (realJobs.length === 0) {
    console.log('Using mock data as fallback');
    return getMockJobs().filter(job =>
      (!query || job.title.toLowerCase().includes(query.toLowerCase())) &&
      job.location.toLowerCase().includes(location.toLowerCase())
    );
  }

  return realJobs;
};