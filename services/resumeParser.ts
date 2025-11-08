import nlp from 'compromise';

interface ExperienceItem {
  company: string;
  role: string;
  duration: string;
  description: string;
}

interface EducationItem {
  institution: string;
  degree: string;
  year: string;
}

export interface ParsedResume {
  name: string;
  email: string;
  phone: string;
  skills: string[];
  experience: ExperienceItem[];
  education: EducationItem[];
  summary: string;
  yearsExperience: number;
}

export const parseResumeText = (text: string): ParsedResume => {
  // Use Compromise for smart text analysis
  const doc = nlp(text);

  // Extract contact info
  const emails = text.match(/[\w.-]+@[\w.-]+\.\w+/g) || [];
  const phones = text.match(/[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}/g) || [];

  // Extract skills using predefined tech corpus
  const skills = extractSkills(text);

  // Extract experience section
  const experience = extractExperience(text, doc);

  // Extract education
  const education = extractEducation(text, doc);

  // Calculate years of experience
  const yearsExperience = calculateExperience(experience);

  return {
    name: doc.people().out('text')[0] || '',
    email: emails[0] || '',
    phone: phones[0] || '',
    skills,
    experience,
    education,
    summary: generateSummary(text, skills, yearsExperience),
    yearsExperience
  };
};

// Comprehensive skill extraction
const extractSkills = (text: string): string[] => {
  const skillDatabase = [
    // Programming Languages
    'JavaScript', 'TypeScript', 'Python', 'Java', 'Kotlin', 'Swift', 'C++', 'C#', 'Go', 'Rust', 'PHP', 'Ruby',
    // Web Technologies
    'React', 'React Native', 'Vue.js', 'Angular', 'Node.js', 'Express', 'Next.js', 'HTML', 'CSS', 'SASS', 'SCSS',
    // Mobile Development
    'iOS', 'Android', 'Flutter', 'Xamarin', 'Ionic', 'Cordova',
    // Databases
    'MongoDB', 'PostgreSQL', 'MySQL', 'SQLite', 'Redis', 'Firebase', 'DynamoDB',
    // Cloud & DevOps
    'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Jenkins', 'GitLab CI', 'GitHub Actions',
    // Data Science & ML
    'TensorFlow', 'PyTorch', 'Scikit-learn', 'Pandas', 'NumPy', 'Machine Learning', 'Deep Learning', 'NLP',
    // Engineering & Scientific
    'OpenFOAM', 'CFD', 'VTK.js', 'WebGPU', 'MATLAB', 'Simulink', 'ANSYS', 'COMSOL',
    // Tools & Others
    'Git', 'REST API', 'GraphQL', 'WebSocket', 'Microservices', 'Agile', 'Scrum', 'Kanban'
  ];

  const lowerText = text.toLowerCase();
  const foundSkills = skillDatabase.filter(skill =>
    lowerText.includes(skill.toLowerCase())
  );

  // Use TF-IDF to rank skill importance if needed
  return [...new Set(foundSkills)];
};

const extractExperience = (text: string, doc: any): ExperienceItem[] => {
  // Find experience section patterns
  const expSection = text.match(/(experience|work history|employment|work experience)(.*?)(education|skills|projects|achievements)/is);

  if (!expSection) return [];

  const expText = expSection[2];

  // Extract company names using organizations
  const organizations = doc.organizations().out('array');

  return organizations.map((org: string, idx: number) => ({
    company: org,
    role: extractRoleFromContext(expText, org),
    duration: extractDurationFromContext(expText, org),
    description: extractDescriptionFromContext(expText, org)
  }));
};

const extractRoleFromContext = (text: string, company: string): string => {
  // Simple role extraction - could be enhanced with more NLP
  const lines = text.split('\n');
  for (const line of lines) {
    if (line.toLowerCase().includes(company.toLowerCase())) {
      // Look for common job titles in nearby lines
      const jobTitles = ['developer', 'engineer', 'manager', 'analyst', 'scientist', 'architect', 'lead', 'senior', 'junior'];
      for (const title of jobTitles) {
        if (line.toLowerCase().includes(title)) {
          return line.trim();
        }
      }
    }
  }
  return '';
};

const extractDurationFromContext = (text: string, company: string): string => {
  // Extract duration patterns around company mention
  const index = text.toLowerCase().indexOf(company.toLowerCase());
  if (index === -1) return '';

  const context = text.substring(Math.max(0, index - 100), Math.min(text.length, index + 100));
  const datePattern = /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\s*[-–]\s*(?:Present|Current|Now|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}|\d{4}\s*[-–]\s*(?:Present|Current|Now|\d{4})/i;
  const match = context.match(datePattern);
  return match ? match[0] : '';
};

const extractDescriptionFromContext = (text: string, company: string): string => {
  // Extract description around company mention
  const index = text.toLowerCase().indexOf(company.toLowerCase());
  if (index === -1) return '';

  const start = Math.max(0, index - 200);
  const end = Math.min(text.length, index + 200);
  return text.substring(start, end).trim();
};

const extractEducation = (text: string, doc: any): EducationItem[] => {
  const educationSection = text.match(/(education|academic background|qualifications)(.*?)(experience|skills|projects)/is);

  if (!educationSection) return [];

  const eduText = educationSection[2];
  const organizations = nlp(eduText).organizations().out('array');

  return organizations.map((org: string, idx: number) => ({
    institution: org,
    degree: extractDegreeFromContext(eduText, org),
    year: extractYearFromContext(eduText, org)
  }));
};

const extractDegreeFromContext = (text: string, institution: string): string => {
  const degrees = ['Bachelor', 'Master', 'PhD', 'Doctorate', 'MBA', 'BSc', 'MSc', 'BEng', 'MEng'];
  const lines = text.split('\n');

  for (const line of lines) {
    if (line.toLowerCase().includes(institution.toLowerCase())) {
      for (const degree of degrees) {
        if (line.toLowerCase().includes(degree.toLowerCase())) {
          return line.trim();
        }
      }
    }
  }
  return '';
};

const extractYearFromContext = (text: string, institution: string): string => {
  const index = text.toLowerCase().indexOf(institution.toLowerCase());
  if (index === -1) return '';

  const context = text.substring(Math.max(0, index - 50), Math.min(text.length, index + 50));
  const yearPattern = /\b(19|20)\d{2}\b/g;
  const match = context.match(yearPattern);
  return match ? match[match.length - 1] : '';
};

const calculateExperience = (experience: ExperienceItem[]): number => {
  // Simple calculation - could be enhanced with date parsing
  // For now, assume 2 years per job
  return experience.length * 2;
};

const generateSummary = (text: string, skills: string[], yearsExperience: number): string => {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
  const summarySentences = sentences.slice(0, 3);

  return summarySentences.join('. ').trim() +
         (summarySentences.length > 0 ? '.' : '') +
         ` ${yearsExperience} years of experience with skills in ${skills.slice(0, 5).join(', ')}.`;
};