import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Task from '@/lib/models/Task';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { applicantUserId } = await request.json();
    if (!applicantUserId) {
      return NextResponse.json({ success: false, error: 'Applicant user ID is required' }, { status: 400 });
    }

    await dbConnect();

    const task = await Task.findById(params.id);
    if (!task) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    }

    // Check if user is the task owner
    if (task.posterId.toString() !== session.user.id) {
      return NextResponse.json({ success: false, error: 'Only task owner can reject applicants' }, { status: 403 });
    }

    // Find the applicant
    const applicantIndex = task.applicants.findIndex(
      (app: any) => app.userId.toString() === applicantUserId
    );

    if (applicantIndex === -1) {
      return NextResponse.json({ success: false, error: 'Applicant not found' }, { status: 404 });
    }

    // Update applicant status to rejected
    task.applicants[applicantIndex].status = 'rejected';

    await task.save();

    return NextResponse.json({
      success: true,
      message: 'Applicant rejected successfully'
    });

  } catch (error) {
    console.error('Reject applicant error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}