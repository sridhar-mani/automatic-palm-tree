import * as use from '@tensorflow-models/universal-sentence-encoder';
import * as tf from '@tensorflow/tfjs';
import { ParsedResume } from './resumeParser';

export interface Job {
  id: string;
  title: string;
  company: string;
  description: string;
  location: string;
  salary?: string;
  required_skills?: string[];
  url?: string;
  job_type?: string;
  employer_website?: string;
  publisher?: string;
}

export interface JobMatch {
  job: Job;
  matchScore: number;
  reasons: string[];
}

let model: use.UniversalSentenceEncoder | null = null;
let isInitializing = false;
let initializationPromise: Promise<boolean> | null = null;

// Cache for embeddings to avoid recomputation
const embeddingCache = new Map<string, tf.Tensor>();

export const initializeTensorFlow = async (): Promise<boolean> => {
  // Return existing promise if already initializing
  if (isInitializing && initializationPromise) {
    return initializationPromise;
  }

  // Return true if already initialized
  if (model) {
    return true;
  }

  isInitializing = true;
  initializationPromise = (async () => {
    try {
      console.log('Initializing TensorFlow.js...');
      await tf.ready();
      console.log('TensorFlow.js ready');

      console.log('Loading Universal Sentence Encoder model...');
      model = await use.load();
      console.log('USE model loaded successfully');

      isInitializing = false;
      return true;
    } catch (error) {
      console.error('TensorFlow initialization failed:', error);
      isInitializing = false;
      model = null;
      return false;
    }
  })();

  return initializationPromise;
};

export const matchJobsToResume = async (
  resumeProfile: ParsedResume,
  jobs: Job[]
): Promise<JobMatch[]> => {
  // Lazy initialization - only initialize when needed
  if (!model && !isInitializing) {
    const initialized = await initializeTensorFlow();
    if (!initialized) {
      // Fallback to simple text matching if TF fails
      return fallbackMatching(resumeProfile, jobs);
    }
  }

  // Wait for initialization if it's in progress
  if (isInitializing && initializationPromise) {
    await initializationPromise;
  }

  if (!model) {
    return fallbackMatching(resumeProfile, jobs);
  }

  try {
    // Create resume embedding with caching
    const resumeText = `${resumeProfile.summary} ${resumeProfile.skills.join(' ')} ${resumeProfile.experience.map(exp => exp.description).join(' ')}`;
    const resumeEmbedding = await getCachedEmbedding(resumeText);

    // Batch process job embeddings with caching
    const jobEmbeddings: tf.Tensor[] = [];
    for (const job of jobs) {
      const jobText = `${job.title} ${job.description} ${job.required_skills?.join(' ') || ''}`;
      const embedding = await getCachedEmbedding(jobText);
      jobEmbeddings.push(embedding);
    }

    // Stack job embeddings into a single tensor
    const jobEmbeddingsTensor = tf.stack(jobEmbeddings);

    // Calculate cosine similarity
    const similarities = tf.tidy(() => {
      const normalized1 = tf.norm(resumeEmbedding, 2, 1, true);
      const normalized2 = tf.norm(jobEmbeddingsTensor, 2, 1, true);

      const dot = tf.matMul(
        resumeEmbedding,
        jobEmbeddingsTensor,
        false,
        true
      );

      return tf.div(
        dot,
        tf.matMul(normalized1, normalized2, false, true)
      );
    });

    const scores = await similarities.data();

    // Cleanup tensors (but keep cached embeddings)
    similarities.dispose();
    jobEmbeddingsTensor.dispose();

    // Return ranked matches
    return jobs.map((job, idx) => ({
      job,
      matchScore: scores[idx],
      reasons: generateMatchReasons(job, resumeProfile, scores[idx])
    }))
    .sort((a, b) => b.matchScore - a.matchScore);

  } catch (error) {
    console.error('Semantic matching error:', error);
    // Fallback to simple matching
    return fallbackMatching(resumeProfile, jobs);
  }
};

// Cached embedding computation
const getCachedEmbedding = async (text: string): Promise<tf.Tensor> => {
  if (embeddingCache.has(text)) {
    return embeddingCache.get(text)!;
  }

  if (!model) {
    throw new Error('Model not initialized');
  }

  const embedding = await model.embed([text]);
  // Keep embeddings in cache (limit cache size to prevent memory issues)
  if (embeddingCache.size < 100) {
    embeddingCache.set(text, embedding);
  }

  return embedding;
};

// Fallback matching when TensorFlow fails
const fallbackMatching = (resumeProfile: ParsedResume, jobs: Job[]): JobMatch[] => {
  return jobs.map(job => {
    const resumeSkills = new Set(resumeProfile.skills.map(s => s.toLowerCase()));
    const jobSkills = new Set(job.required_skills?.map(s => s.toLowerCase()) || []);

    // Calculate skill overlap
    const overlap = [...resumeSkills].filter(skill => jobSkills.has(skill)).length;
    const totalSkills = jobSkills.size || 1;
    const skillScore = overlap / totalSkills;

    // Simple text similarity
    const resumeText = `${resumeProfile.summary} ${resumeProfile.skills.join(' ')}`.toLowerCase();
    const jobText = `${job.title} ${job.description}`.toLowerCase();

    const commonWords = resumeText.split(' ').filter(word =>
      word.length > 3 && jobText.includes(word)
    ).length;

    const textScore = Math.min(commonWords / 10, 1); // Cap at 1

    const matchScore = (skillScore * 0.7) + (textScore * 0.3);

    return {
      job,
      matchScore,
      reasons: generateMatchReasons(job, resumeProfile, matchScore)
    };
  }).sort((a, b) => b.matchScore - a.matchScore);
};

const generateMatchReasons = (job: Job, resumeProfile: ParsedResume, score: number): string[] => {
  const reasons: string[] = [];

  // Skill matches
  const resumeSkills = new Set(resumeProfile.skills.map(s => s.toLowerCase()));
  const jobSkills = job.required_skills?.map(s => s.toLowerCase()) || [];

  const matchingSkills = jobSkills.filter(skill => resumeSkills.has(skill));
  if (matchingSkills.length > 0) {
    reasons.push(`Matches ${matchingSkills.length} required skills: ${matchingSkills.slice(0, 3).join(', ')}`);
  }

  // Experience level
  if (resumeProfile.yearsExperience > 0) {
    if (job.title.toLowerCase().includes('senior') && resumeProfile.yearsExperience >= 5) {
      reasons.push(`Your ${resumeProfile.yearsExperience} years experience aligns with senior role requirements`);
    } else if (job.title.toLowerCase().includes('junior') && resumeProfile.yearsExperience <= 3) {
      reasons.push(`Entry-level position matches your experience level`);
    }
  }

  // Location match (if available)
  if (job.location && resumeProfile.summary.toLowerCase().includes(job.location.toLowerCase())) {
    reasons.push(`Location preference matches: ${job.location}`);
  }

  // Overall match strength
  if (score > 0.8) {
    reasons.push('Excellent overall match based on skills and experience');
  } else if (score > 0.6) {
    reasons.push('Good match with room for growth');
  } else if (score > 0.4) {
    reasons.push('Moderate match - consider as learning opportunity');
  }

  return reasons;
};