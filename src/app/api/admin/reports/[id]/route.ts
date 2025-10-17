import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Report from '@/lib/models/Report';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    await dbConnect();

    const report = await Report.findById(params.id)
      .populate('reporterId', 'name email phone isVerified rating completedTasks')
      .populate('reportedUserId', 'name email phone isVerified rating completedTasks')
      .populate('taskId')
      .populate('reviewedBy', 'name email')
      .lean();

    if (!report) {
      return NextResponse.json(
        { success: false, error: 'Report not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error('Fetch report detail error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch report' },
      { status: 500 }
    );
  }
}