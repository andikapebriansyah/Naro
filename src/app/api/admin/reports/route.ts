import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Report from '@/lib/models/Report';
import User from '@/lib/models/User';
import Task from '@/lib/models/Task';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check admin access
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // pending, reviewing, resolved, rejected, all
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');

    // Build query
    let query: any = {};
    if (status && status !== 'all') {
      query.status = status;
    }

    // Fetch reports with populated data
    const reports = await Report.find(query)
      .populate('reporterId', 'name email phone isVerified')
      .populate('reportedUserId', 'name email phone isVerified')
      .populate('taskId', 'title category budget status location')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .lean();

    const totalReports = await Report.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: reports,
      pagination: {
        total: totalReports,
        page,
        limit,
        totalPages: Math.ceil(totalReports / limit),
      },
    });
  } catch (error) {
    console.error('Fetch reports error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}