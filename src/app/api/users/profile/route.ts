import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import clientPromise from '@/lib/mongodb-client';
import User from '@/lib/models/User';
import { generateWorkerProfileEmbedding } from '@/lib/embedding';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();
    const user = await User.findById(session.user.id).select('-__v');
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Return user data dengan ktpVerification status untuk dashboard
    return NextResponse.json({
      success: true,
      data: {
        ...user.toObject(),
        // Explicitly include verification status
        ktpVerification: {
          status: user.ktpVerification?.status || 'not_submitted',
          submittedAt: user.ktpVerification?.submittedAt,
          verifiedAt: user.ktpVerification?.verifiedAt,
          rejectionReason: user.ktpVerification?.rejectionReason,
          ocrConfidence: user.ktpVerification?.ocrConfidence,
        },
      },
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { phone, location, locationCoordinates, about, workCategories } = body;
    


    await dbConnect();
    
    // Validate work categories if provided
    const validCategories = ['kebersihan', 'teknisi', 'renovasi', 'tukang', 'angkut', 'taman', 'lainnya'];
    if (workCategories && workCategories.some((cat: string) => !validCategories.includes(cat))) {
      return NextResponse.json(
        { error: 'Invalid work category' },
        { status: 400 }
      );
    }

    // Build update object
    const updateData: any = {};
    if (phone !== undefined) updateData.phone = phone;
    if (location !== undefined) updateData.location = location;
    if (locationCoordinates !== undefined) updateData.locationCoordinates = locationCoordinates;
    if (about !== undefined) updateData.about = about;
    if (workCategories !== undefined) updateData.workCategories = workCategories;
    


    // Check if profile is complete (for tasker validation) and generate embedding
    if (phone !== undefined || about !== undefined || workCategories !== undefined) {
      const currentUser = await User.findById(session.user.id);
      if (currentUser) {
        const finalPhone = phone !== undefined ? phone : currentUser.phone;
        const finalAbout = about !== undefined ? about : currentUser.about;
        const finalCategories = workCategories !== undefined ? workCategories : currentUser.workCategories;
        
        updateData.profileComplete = finalPhone && finalAbout && finalCategories && finalCategories.length > 0;
        
        // Generate embedding untuk profil pekerja jika ada perubahan pada profil yang relevan
        if (about !== undefined || workCategories !== undefined) {
          try {
            console.log('🔄 Generating profile embedding for user:', session.user.id);
            
            const profileEmbedding = await generateWorkerProfileEmbedding({
              name: currentUser.name,
              about: finalAbout,
              workCategories: finalCategories,
              location: location !== undefined ? location : currentUser.location,
            });
            
            // Use raw MongoDB to store embedding as JSON string (avoid Mongoose array issues)
            const client = await clientPromise;
            const db = client.db();
            const usersCollection = db.collection('users');
            const { ObjectId } = require('mongodb');
            const userId = new ObjectId(session.user.id);
            
            await usersCollection.updateOne(
              { _id: userId },
              { 
                $set: { 
                  profileVector: JSON.stringify(profileEmbedding),
                  profileVectorLastUpdate: new Date()
                } 
              }
            );
            
            console.log('✅ Profile embedding generated and stored successfully');
          } catch (embeddingError) {
            console.error('❌ Error generating profile embedding:', embeddingError);
            // Jangan fail update profil hanya karena embedding gagal
            console.warn('⚠️ Continuing profile update without embedding');
          }
        }
      }
    }

    // Use raw MongoDB for better compatibility with nested objects
    const client = await clientPromise;
    const db = client.db();
    const usersCollection = db.collection('users');
    const { ObjectId } = require('mongodb');
    const userId = new ObjectId(session.user.id);
    
    // Update with raw MongoDB
    await usersCollection.updateOne(
      { _id: userId },
      { $set: updateData }
    );
    
    // Get updated user with Mongoose for return
    const user = await User.findById(session.user.id).select('-__v');

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('✅ Profile updated successfully for user:', session.user.id);

    return NextResponse.json({
      success: true,
      data: {
        ...user.toObject(),
        // Explicitly include verification status
        ktpVerification: {
          status: user.ktpVerification?.status || 'not_submitted',
          submittedAt: user.ktpVerification?.submittedAt,
          verifiedAt: user.ktpVerification?.verifiedAt,
          rejectionReason: user.ktpVerification?.rejectionReason,
          ocrConfidence: user.ktpVerification?.ocrConfidence,
        },
      },
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('❌ Profile update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}