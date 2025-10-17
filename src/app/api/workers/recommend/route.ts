import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import clientPromise from '@/lib/mongodb-client';
import User from '@/lib/models/User';
import {
  generateJobDescriptionEmbedding,
  calculateCosineSimilarity,
  calculateGeographicalDistance,
  normalizeScore
} from '@/lib/embedding';

interface WorkerWithScore {
  _id: string;
  name: string;
  email: string;
  image?: string;
  rating: number;
  completedTasks: number;
  location?: string;
  isVerified: boolean;
  workCategories: string[];
  phone?: string;
  about?: string;
  profileVector?: number[];
  // Recommendation scores
  semanticScore: number;
  categoryScore: number;
  distanceScore: number;
  ratingScore: number;
  experienceScore: number;
  reliabilityScore: number;
  totalScore: number;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      title, 
      description, 
      category, 
      location,
      locationCoordinates,
      limit = 10 
    } = body;

    if (!title || !description || !category) {
      return NextResponse.json(
        { error: 'Title, description, and category are required' },
        { status: 400 }
      );
    }

    await dbConnect();

    console.log('🔍 Starting worker recommendation process...');

    // 1. Generate embedding untuk job description
    let jobEmbedding: number[] = [];
    try {
      console.log('🔄 Generating job description embedding...');
      jobEmbedding = await generateJobDescriptionEmbedding({
        title,
        description,
        category,
        location
      });
      console.log('✅ Job embedding generated successfully');
    } catch (embeddingError) {
      console.error('❌ Error generating job embedding:', embeddingError);
      // Continue without semantic matching if embedding fails
    }

    // 2. Find workers dengan profile lengkap dan verified - lebih fleksibel
    console.log('🔍 Searching workers with query for category:', category);
    console.log('🔍 Current user ID:', session.user.id);
    
    // Use raw MongoDB to get workers with proper profileVector parsing
    const client = await clientPromise;
    const db = client.db();
    const usersCollection = db.collection('users');
    const { ObjectId } = require('mongodb');
    
    // Check current user profile first to debug
    const currentUserId = new ObjectId(session.user.id);
    const currentUser = await usersCollection.findOne({ _id: currentUserId });
    console.log('🔍 Current user profile check:');
    console.log('- Name:', currentUser?.name);
    console.log('- isVerified:', currentUser?.isVerified);
    console.log('- phone:', currentUser?.phone ? '✅ Has phone' : '❌ No phone');
    console.log('- about:', currentUser?.about ? '✅ Has about' : '❌ No about');
    console.log('- workCategories:', currentUser?.workCategories);
    console.log('- role:', currentUser?.role);
    console.log('- has profileVector:', !!currentUser?.profileVector);
    
    // First try: find workers with exact category match
    let workers = await usersCollection.find({
      role: { $in: ['tasker', 'user', 'admin'] }, // Include admin role
      isVerified: true,
      phone: { $exists: true, $ne: "" },
      about: { $exists: true, $ne: "" },
      workCategories: { 
        $exists: true, 
        $not: { $size: 0 },
        $in: [category] // Exact category match
      },
      _id: { $ne: currentUserId } // Exclude current user
    })
    .project({
      name: 1, email: 1, image: 1, rating: 1, completedTasks: 1, 
      location: 1, locationCoordinates: 1, isVerified: 1, workCategories: 1, phone: 1, 
      about: 1, profileVector: 1
    })
    .limit(30) // Limit untuk performance
    .toArray();

    console.log(`📊 Found ${workers.length} workers with exact category match`);
    
    // Debug: Log found workers
    workers.forEach((worker, index) => {
      console.log(`👤 Worker ${index + 1}: ${worker.name} (${worker._id}) - Categories: ${worker.workCategories?.join(', ')} - Has vector: ${!!worker.profileVector}`);
    });

    // If no exact match found, find workers with any category (more flexible)
    if (workers.length === 0) {
      console.log('🔄 No exact category match, searching all verified workers...');
      workers = await usersCollection.find({
        role: { $in: ['tasker', 'user', 'admin'] }, // Include admin role
        isVerified: true,
        phone: { $exists: true, $ne: "" },
        about: { $exists: true, $ne: "" },
        workCategories: { 
          $exists: true, 
          $not: { $size: 0 }
        },
        _id: { $ne: currentUserId } // Exclude current user
      })
      .project({
        name: 1, email: 1, image: 1, rating: 1, completedTasks: 1, 
        location: 1, locationCoordinates: 1, isVerified: 1, workCategories: 1, phone: 1, 
        about: 1, profileVector: 1
      })
      .limit(20) // Smaller limit for broader search
      .toArray();
      
      console.log(`📊 Found ${workers.length} workers total (all categories)`);
    }

    if (workers.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        message: 'No workers found matching criteria'
      });
    }

    // 3. Calculate scores untuk setiap worker
    const workersWithScores: WorkerWithScore[] = workers.map((worker) => {
      // Semantic similarity score (0-1)
      let semanticScore = 0;
      if (jobEmbedding.length > 0 && worker.profileVector) {
        try {
          // Parse JSON string back to array
          const workerVector = typeof worker.profileVector === 'string' 
            ? JSON.parse(worker.profileVector) 
            : worker.profileVector;
          
          if (Array.isArray(workerVector) && workerVector.length > 0) {
            semanticScore = calculateCosineSimilarity(jobEmbedding, workerVector);
            semanticScore = Math.max(0, semanticScore); // Ensure non-negative
          }
        } catch (parseError) {
          console.error('❌ Error parsing worker profile vector:', parseError);
          semanticScore = 0;
        }
      }

      // Category matching score (0-1) 
      let categoryScore = 0;
      if (worker.workCategories && worker.workCategories.includes(category)) {
        categoryScore = 1.0;
        // Bonus if worker has multiple relevant categories
        const relevantCategories = worker.workCategories.filter((cat: string) => 
          ['kebersihan', 'teknisi', 'renovasi', 'tukang', 'angkut', 'taman'].includes(cat)
        );
        categoryScore += relevantCategories.length * 0.1; // Max bonus 0.6
        categoryScore = Math.min(1.0, categoryScore);
      }

      // Distance score (0-1) - closer is better
      let distanceScore = 0.4; // Default if no location data
      
      // Primary: Use coordinates if available

      if (locationCoordinates && 
          locationCoordinates.lat && locationCoordinates.lng &&
          worker.locationCoordinates && 
          worker.locationCoordinates.lat && worker.locationCoordinates.lng) {
        
        const distance = calculateGeographicalDistance(
          locationCoordinates.lat, locationCoordinates.lng,
          worker.locationCoordinates.lat, worker.locationCoordinates.lng
        );
        

        
        // Convert distance to score (closer = higher score)
        if (distance <= 2) {
          distanceScore = 1.0; // Very close (within 2km)
        } else if (distance <= 5) {
          distanceScore = 0.9; // Close (within 5km)
        } else if (distance <= 10) {
          distanceScore = 0.8; // Moderate (within 10km)
        } else if (distance <= 20) {
          distanceScore = 0.6; // Far but doable (within 20km)
        } else if (distance <= 50) {
          distanceScore = 0.4; // Very far (within 50km)
        } else {
          distanceScore = 0.2; // Too far (>50km)
        }
        

        
      } else {
        // Fallback: Use location string matching
        const jobLocation = location?.toLowerCase() || '';
        const workerLocation = worker.location?.toLowerCase() || '';
        
        if (jobLocation && workerLocation) {
          if (workerLocation.includes(jobLocation) || jobLocation.includes(workerLocation)) {
            distanceScore = 0.8; // Good text match
          } else {
            // Check for city/area similarity
            const jobWords = jobLocation.split(/[\s,]+/);
            const workerWords = workerLocation.split(/[\s,]+/);
            
            let matches = 0;
            for (const jobWord of jobWords) {
              if (jobWord.length > 2 && workerWords.some((w: string) => w.includes(jobWord) || jobWord.includes(w))) {
                matches++; 
              }
            }
            
            if (matches > 0) {
              distanceScore = Math.min(0.7, 0.5 + (matches * 0.1)); // 0.5-0.7 based on matches
            } else {
              distanceScore = 0.3; // Different area
            }
          }
        } else {
          if (jobLocation && !workerLocation) {
            distanceScore = 0.2; // Job has location but worker doesn't
          } else if (!jobLocation && workerLocation) {
            distanceScore = 0.5; // Worker has location but job doesn't
          }
        }
      }

      // Rating score (0-1) - Enhanced rating calculation
      let ratingScore = 0.3; // Default untuk pekerja tanpa rating
      if (worker.rating && worker.rating > 0) {
        // Normalize rating dari 0-5 ke 0-1, tapi berikan penalty untuk rating rendah
        ratingScore = worker.rating / 5.0;
        
        // Tambahan bonus untuk rating tinggi (4.5+ mendapat boost)
        if (worker.rating >= 4.5) {
          ratingScore = Math.min(1.0, ratingScore + 0.1); // 10% bonus
        } else if (worker.rating >= 4.0) {
          ratingScore = Math.min(1.0, ratingScore + 0.05); // 5% bonus
        }
        
        // Penalty untuk rating rendah (di bawah 3.0)
        if (worker.rating < 3.0) {
          ratingScore = ratingScore * 0.7; // 30% penalty
        }
      }

      // Experience score based on completed tasks - Enhanced
      let experienceScore = 0.2; // Default untuk pekerja baru
      if (worker.completedTasks && worker.completedTasks > 0) {
        // Logarithmic scaling untuk completed tasks
        experienceScore = Math.min(1.0, Math.log(worker.completedTasks + 1) / Math.log(101));
        
        // Bonus untuk pekerja berpengalaman
        if (worker.completedTasks >= 50) {
          experienceScore = Math.min(1.0, experienceScore + 0.15); // Expert bonus
        } else if (worker.completedTasks >= 20) {
          experienceScore = Math.min(1.0, experienceScore + 0.1); // Experienced bonus
        } else if (worker.completedTasks >= 10) {
          experienceScore = Math.min(1.0, experienceScore + 0.05); // Semi-experienced bonus
        }
      }

      // Reliability score - Kombinasi rating dan experience
      const reliabilityScore = (ratingScore * 0.7) + (experienceScore * 0.3);

      // Weighted total score - Rating & Location balanced, others split 60%
      const weights = {
        rating: 0.20,        // 20% - Rating importance
        distance: 0.20,      // 20% - Location proximity (sama dengan rating)
        semantic: 0.20,      // 20% - Semantic matching (AI)
        category: 0.20,      // 20% - Category match
        experience: 0.20     // 20% - Experience/track record
      };

      const totalScore = 
        (semanticScore * weights.semantic) +
        (categoryScore * weights.category) +
        (ratingScore * weights.rating) +
        (experienceScore * weights.experience) +
        (distanceScore * weights.distance) +
        (reliabilityScore * 0.05); // Small bonus untuk kombinasi rating+experience

      return {
        _id: worker._id as string,
        name: worker.name || '',
        email: worker.email || '',
        image: worker.image,
        rating: worker.rating || 0,
        completedTasks: worker.completedTasks || 0,
        location: worker.location,
        isVerified: worker.isVerified || false,
        workCategories: worker.workCategories || [],
        phone: worker.phone,
        about: worker.about,
        profileVector: worker.profileVector,
        semanticScore: Math.round(semanticScore * 100) / 100,
        categoryScore: Math.round(categoryScore * 100) / 100,
        distanceScore: Math.round(distanceScore * 100) / 100,
        ratingScore: Math.round(ratingScore * 100) / 100,
        totalScore: Math.round(totalScore * 100) / 100,
        experienceScore: Math.round(experienceScore * 100) / 100,
        reliabilityScore: Math.round(reliabilityScore * 100) / 100
      } as WorkerWithScore;
    });

    // 4. Sort by total score (highest first) and limit results
    const recommendedWorkers = workersWithScores
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, limit);

    console.log('✅ Worker recommendation completed');
    console.log(`🎯 Top worker scores: ${recommendedWorkers.slice(0, 3).map(w => w.totalScore).join(', ')}`);

    return NextResponse.json({
      success: true,
      data: recommendedWorkers,
      metadata: {
        total: workers.length,
        recommended: recommendedWorkers.length,
        hasSemanticMatching: jobEmbedding.length > 0,
        weights: {
          rating: '20%',
          distance: '20%', 
          semantic: '20%',
          category: '20%',
          experience: '20%'
        },
        algorithm: 'Balanced Multi-Criteria Recommendation'
      }
    });

  } catch (error) {
    console.error('❌ Worker recommendation error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}

// GET endpoint untuk testing dengan query parameters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const title = searchParams.get('title') || 'Test Job';
    const description = searchParams.get('description') || 'Test job description';

    if (!category) {
      return NextResponse.json(
        { error: 'Category parameter is required' },
        { status: 400 }
      );
    }

    // Create mock request body for testing
    const mockRequest = {
      json: async () => ({
        title,
        description,
        category,
        location: 'Jakarta',
        locationCoordinates: { lat: -6.2, lng: 106.8 },
        limit: 5
      })
    } as NextRequest;

    // Call the POST handler with mock request
    return await POST(mockRequest);

  } catch (error) {
    console.error('❌ GET recommendation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}