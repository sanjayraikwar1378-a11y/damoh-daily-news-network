import { Reporter } from '@/data/mock';

export function enrichReporter(reporter?: Partial<Reporter> | null, authorNameFallback?: string): Reporter {
  const name = reporter?.name || authorNameFallback || 'Sanjay Raikwar';
  
  // Check if this is Sanjay Raikwar
  const isSanjay = name.toLowerCase().includes('sanjay') || name.toLowerCase().includes('raikwar');

  if (isSanjay) {
    return {
      id: reporter?.id || 'r1',
      name: 'Sanjay Raikwar',
      avatar: reporter?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop',
      role: reporter?.role || 'Founder & Editor, Damoh Daily News',
      designation1: reporter?.designation1 || 'Founder & Editor, Damoh Daily News',
      designation2: reporter?.designation2 || 'District Bureau, Dainik Keshariya Hindustan',
      email: reporter?.email || 'sanjay@damohdaily.com',
      bio: ''
    };
  }

  return {
    id: reporter?.id || 'r-default',
    name: name,
    avatar: reporter?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop',
    role: reporter?.role || reporter?.designation1 || 'Journalist / संवाददाता',
    designation1: reporter?.designation1 || reporter?.role || 'Journalist, Damoh Daily News',
    designation2: reporter?.designation2 || '',
    email: reporter?.email || '',
    bio: ''
  };
}
