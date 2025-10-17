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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const status = searchParams.get('status') || ''; // verified, unverified, pending

    await dbConnect();

    // Build query
    let query: any = {};

    // Search by name or email
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by role
    if (role && role !== 'all') {
      query.role = role;
    }

    // Filter by verification status
    if (status && status !== 'all') {
      if (status === 'verified') {
        query.isVerified = true;
      } else if (status === 'unverified') {
        query.isVerified = false;
        query['ktpVerification.status'] = { $ne: 'pending' };
      } else if (status === 'pending') {
        query['ktpVerification.status'] = 'pending';
      }
    }

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Get users with pagination
    const users = await User.find(query)
      .select('name email phone role isVerified balance completedTasks rating location createdAt ktpVerification.status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const totalUsers = await User.countDocuments(query);
    const totalPages = Math.ceil(totalUsers / limit);

    // Calculate stats
    const totalUsersCount = await User.countDocuments();
    const verifiedUsersCount = await User.countDocuments({ isVerified: true });
    const pendingVerificationsCount = await User.countDocuments({ 'ktpVerification.status': 'pending' });

    return NextResponse.json({
      success: true,
      data: users,
      pagination: {
        currentPage: page,
        totalPages,
        totalUsers,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      stats: {
        totalUsers: totalUsersCount,
        verifiedUsers: verifiedUsersCount,
        pendingVerifications: pendingVerificationsCount,
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}