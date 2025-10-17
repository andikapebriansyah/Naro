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
      return NextResponse.json({ success: false, error: 'Only task owner can accept applicants' }, { status: 403 });
    }

    // Check if task already has an assigned worker
    if (task.assignedTo) {
      return NextResponse.json({ success: false, error: 'Task already has an assigned worker' }, { status: 400 });
    }

    // Find the applicant
    const applicantIndex = task.applicants.findIndex(
      (app: any) => app.userId.toString() === applicantUserId
    );

    if (applicantIndex === -1) {
      return NextResponse.json({ success: false, error: 'Applicant not found' }, { status: 404 });
    }

    // Update applicant status to accepted
    task.applicants[applicantIndex].status = 'accepted';
    
    // Assign the worker to the task
    task.assignedTo = applicantUserId;
    task.status = 'pending'; // Set to pending, waiting for worker confirmation

    // Reject all other pending applicants
    task.applicants.forEach((app: any, index: number) => {
      if (index !== applicantIndex && app.status === 'pending') {
        app.status = 'rejected';
      }
    });

    await task.save();

    return NextResponse.json({
      success: true,
      message: 'Applicant accepted successfully'
    });

  } catch (error) {
    console.error('Accept applicant error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}