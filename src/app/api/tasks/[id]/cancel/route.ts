import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Task from '@/lib/models/Task';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    const { reason } = await request.json();

    // Find the task and verify ownership
    const task = await Task.findById(params.id);

    if (!task) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    }

    // Verify that the current user is the poster
    if (task.posterId.toString() !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Not authorized to cancel this task' },
        { status: 403 }
      );
    }

    // Check if task can be cancelled
    if (!['draft', 'open', 'pending'].includes(task.status)) {
      return NextResponse.json(
        { success: false, error: 'Task cannot be cancelled at this stage' },
        { status: 400 }
      );
    }

    // Update task status to cancelled
    const updatedTask = await Task.findByIdAndUpdate(
      params.id,
      { 
        status: 'cancelled',
        cancellationReason: reason,
        cancelledAt: new Date()
      },
      { new: true }
    ).populate('posterId', 'name email image rating isVerified')
     .populate('assignedTo', 'name email image rating isVerified');

    // TODO: Send notifications to applicants/assigned worker
    // TODO: Handle payment refunds if any

    return NextResponse.json({
      success: true,
      data: updatedTask,
      message: 'Tugas berhasil dibatalkan'
    });
  } catch (error) {
    console.error('Cancel task error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}