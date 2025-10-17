import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';

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

    return NextResponse.json({
      success: true,
      data: user,
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
    const { phone, about, workCategories } = body;

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
    if (about !== undefined) updateData.about = about;
    if (workCategories !== undefined) updateData.workCategories = workCategories;

    // Check if profile is complete (for tasker validation)
    if (phone !== undefined || about !== undefined || workCategories !== undefined) {
      const currentUser = await User.findById(session.user.id);
      if (currentUser) {
        const finalPhone = phone !== undefined ? phone : currentUser.phone;
        const finalAbout = about !== undefined ? about : currentUser.about;
        const finalCategories = workCategories !== undefined ? workCategories : currentUser.workCategories;
        
        updateData.profileComplete = finalPhone && finalAbout && finalCategories && finalCategories.length > 0;
      }
    }

    const user = await User.findByIdAndUpdate(
      session.user.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-__v');

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('✅ Profile updated successfully for user:', session.user.id);

    return NextResponse.json({
      success: true,
      data: user,
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