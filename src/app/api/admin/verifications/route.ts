import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is admin
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';

    await dbConnect();

    // Build query
    let query: any = {
      ktpVerification: { $exists: true },
    };

    if (status !== 'all') {
      query['ktpVerification.status'] = status;
    }

    // Get users with KTP verification
    const users = await User.find(query)
      .select('name email phone ktpVerification createdAt')
      .sort({ 'ktpVerification.submittedAt': -1 })
      .lean();

    // Filter out users without KTP verification submission
    const filteredUsers = users.filter(
      (user) => user.ktpVerification && user.ktpVerification.ktpImage
    );

    return NextResponse.json({
      success: true,
      data: filteredUsers,
      count: filteredUsers.length,
    });
  } catch (error) {
    console.error('Get verifications error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}