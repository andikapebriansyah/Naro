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
    const body = await request.json();
    const { reason } = body;

    // Validate rejection reason
    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Rejection reason is required' },
        { status: 400 }
      );
    }

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

    // Update verification status
    user.ktpVerification.status = 'rejected';
    user.ktpVerification.verifiedAt = new Date();
    user.ktpVerification.rejectionReason = reason.trim();
    user.isVerified = false;

    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Verification rejected successfully',
      data: {
        userId: user._id,
        name: user.name,
        email: user.email,
        rejectionReason: user.ktpVerification.rejectionReason,
        verifiedAt: user.ktpVerification.verifiedAt,
      },
    });
  } catch (error) {
    console.error('Reject verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}