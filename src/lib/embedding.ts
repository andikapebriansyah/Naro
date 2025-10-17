import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Cache untuk model embedding
let embeddingModel: any = null;

/**
 * Initialize embedding model
 */
async function initEmbeddingModel() {
  if (!embeddingModel) {
    try {
      // Menggunakan text-embedding-004 model yang lebih baru
      embeddingModel = genAI.getGenerativeModel({ 
        model: "text-embedding-004" 
      });
    } catch (error) {
      console.error('❌ Error initializing embedding model:', error);
      throw new Error('Failed to initialize embedding model');
    }
  }
  return embeddingModel;
}

/**
 * Generate embedding vector dari text
 * @param text - Text yang akan di-embed
 * @returns Array of numbers representing the embedding vector
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty');
    }

    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const model = await initEmbeddingModel();
    
    // Generate embedding menggunakan Gemini
    const result = await model.embedContent(text.trim());
    const embedding = result.embedding;
    
    if (!embedding?.values || !Array.isArray(embedding.values)) {
      throw new Error('Invalid embedding response from Gemini API');
    }

    return embedding.values;
  } catch (error) {
    console.error('❌ Error generating embedding:', error);
    throw new Error(`Failed to generate embedding: ${error}`);
  }
}

/**
 * Generate embedding untuk profil pekerja
 * Menggabungkan informasi profil menjadi text yang representative
 */
export async function generateWorkerProfileEmbedding(profile: {
  name?: string;
  about?: string;
  workCategories?: string[];
  location?: string;
}): Promise<number[]> {
  try {
    // Buat text representative dari profil
    const parts: string[] = [];
    
    if (profile.name) {
      parts.push(`Nama: ${profile.name}`);
    }
    
    if (profile.workCategories && profile.workCategories.length > 0) {
      const categoryLabels = profile.workCategories.map(cat => {
        const categoryMap: Record<string, string> = {
          kebersihan: 'Kebersihan & Perawatan',
          teknisi: 'Teknisi & Perbaikan',
          renovasi: 'Renovasi & Konstruksi',
          tukang: 'Tukang & Pertukangan',
          angkut: 'Angkut & Pindahan',
          taman: 'Taman & Landscaping',
          lainnya: 'Lainnya'
        };
        return categoryMap[cat] || cat;
      });
      parts.push(`Keahlian: ${categoryLabels.join(', ')}`);
    }
    
    if (profile.about) {
      parts.push(`Deskripsi: ${profile.about}`);
    }
    
    if (profile.location) {
      parts.push(`Lokasi: ${profile.location}`);
    }

    const profileText = parts.join('. ');
    
    if (!profileText.trim()) {
      throw new Error('Profile information is empty');
    }

    return await generateEmbedding(profileText);
  } catch (error) {
    console.error('❌ Error generating worker profile embedding:', error);
    throw error;
  }
}

/**
 * Generate embedding untuk deskripsi pekerjaan
 */
export async function generateJobDescriptionEmbedding(job: {
  title?: string;
  description?: string;
  category?: string;
  location?: string;
}): Promise<number[]> {
  try {
    const parts: string[] = [];
    
    if (job.title) {
      parts.push(`Pekerjaan: ${job.title}`);
    }
    
    if (job.category) {
      const categoryMap: Record<string, string> = {
        kebersihan: 'Kebersihan & Perawatan',
        teknisi: 'Teknisi & Perbaikan', 
        renovasi: 'Renovasi & Konstruksi',
        tukang: 'Tukang & Pertukangan',
        angkut: 'Angkut & Pindahan',
        taman: 'Taman & Landscaping',
        lainnya: 'Lainnya'
      };
      parts.push(`Kategori: ${categoryMap[job.category] || job.category}`);
    }
    
    if (job.description) {
      parts.push(`Deskripsi: ${job.description}`);
    }
    
    if (job.location) {
      parts.push(`Lokasi: ${job.location}`);
    }

    const jobText = parts.join('. ');
    
    if (!jobText.trim()) {
      throw new Error('Job information is empty');
    }

    return await generateEmbedding(jobText);
  } catch (error) {
    console.error('❌ Error generating job description embedding:', error);
    throw error;
  }
}

/**
 * Hitung cosine similarity antara dua vector
 */
export function calculateCosineSimilarity(vectorA: number[], vectorB: number[]): number {
  try {
    if (!vectorA || !vectorB || vectorA.length !== vectorB.length) {
      return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vectorA.length; i++) {
      dotProduct += vectorA[i] * vectorB[i];
      normA += vectorA[i] * vectorA[i];
      normB += vectorB[i] * vectorB[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  } catch (error) {
    console.error('❌ Error calculating cosine similarity:', error);
    return 0;
  }
}

/**
 * Hitung jarak geografis menggunakan Haversine formula (dalam km)
 */
export function calculateGeographicalDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  try {
    const R = 6371; // Radius bumi dalam km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLng = (lng2 - lng1) * (Math.PI / 180);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return distance;
  } catch (error) {
    console.error('❌ Error calculating geographical distance:', error);
    return Infinity;
  }
}

/**
 * Normalisasi score ke range 0-1
 */
export function normalizeScore(score: number, min: number = 0, max: number = 1): number {
  return Math.max(0, Math.min(1, (score - min) / (max - min)));
}