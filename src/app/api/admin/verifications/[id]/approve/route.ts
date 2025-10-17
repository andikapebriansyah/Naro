import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is admin
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const userId = params.id;

    await dbConnect();

    // Find user
    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if KTP verification exists
    if (!user.ktpVerification || !user.ktpVerification.ktpImage) {
      return NextResponse.json(
        { success: false, error: 'KTP verification not found' },
        { status: 404 }
      );
    }

    // Check if already approved
    if (user.ktpVerification.status === 'approved') {
      return NextResponse.json(
        { success: false, error: 'Verification already approved' },
        { status: 400 }
      );
    }

    // Update verification status
    user.ktpVerification.status = 'approved';
    user.ktpVerification.verifiedAt = new Date();
    user.isVerified = true;

    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Verification approved successfully',
      data: {
        userId: user._id,
        name: user.name,
        email: user.email,
        verifiedAt: user.ktpVerification.verifiedAt,
      },
    });
  } catch (error) {
    console.error('Approve verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}